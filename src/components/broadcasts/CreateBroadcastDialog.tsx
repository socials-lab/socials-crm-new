import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RecipientSelector, type Recipient } from './RecipientSelector';
import { EmailCcBccFields } from '@/components/shared/EmailCcBccFields';
import { Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface CreateBroadcastDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateBroadcastDialog({ open, onOpenChange, onCreated }: CreateBroadcastDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [bccEmails, setBccEmails] = useState<string[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    loadRecipients();
  }, [open]);

  const loadRecipients = async () => {
    setLoading(true);
    try {
      // Get active clients
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name')
        .eq('status', 'active');

      if (!clients?.length) {
        setRecipients([]);
        setSelectedIds([]);
        setLoading(false);
        return;
      }

      const clientMap = new Map(clients.map(c => [c.id, c.name]));

      // Get contacts with emails for active clients
      const { data: contacts } = await supabase
        .from('client_contacts')
        .select('id, name, email, client_id')
        .in('client_id', clients.map(c => c.id))
        .not('email', 'is', null);

      const mapped: Recipient[] = (contacts || [])
        .filter(c => c.email && c.email.trim() !== '')
        .map(c => ({
          contact_id: c.id,
          contact_name: c.name,
          email: c.email!,
          company: clientMap.get(c.client_id) || '',
          client_id: c.client_id,
        }));

      setRecipients(mapped);
      setSelectedIds(mapped.map(r => r.contact_id));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSend = async () => {
    if (!subject.trim()) {
      toast({ title: 'Vyplňte předmět', variant: 'destructive' });
      return;
    }
    if (!body.trim()) {
      toast({ title: 'Vyplňte tělo emailu', variant: 'destructive' });
      return;
    }
    if (selectedIds.length === 0) {
      toast({ title: 'Vyberte alespoň jednoho příjemce', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      const selectedRecipients = recipients.filter(r => selectedIds.includes(r.contact_id));
      const recipientsPayload = selectedRecipients.map(r => ({
        email: r.email,
        contact_name: r.contact_name,
        company: r.company,
      }));

      // Save to DB
      const { data: broadcastData, error: dbError } = await supabase.from('broadcasts' as any).insert({
        subject,
        body,
        recipient_count: selectedRecipients.length,
        recipients: recipientsPayload,
        cc_emails: ccEmails,
        bcc_emails: bccEmails,
        sent_by: user?.id,
      }).select('id').single();

      if (dbError) throw dbError;

      const broadcastId = (broadcastData as any)?.id;

      // Call edge function with broadcast_id for recipient tracking
      const { error: fnError } = await supabase.functions.invoke('send-broadcast', {
        body: { subject, body, recipients: recipientsPayload, cc_emails: ccEmails, bcc_emails: bccEmails, broadcast_id: broadcastId },
      });
      if (fnError) console.warn('Edge function warning:', fnError);

      toast({ title: `Rozesílka odeslána ${selectedRecipients.length} příjemcům` });
      setSubject('');
      setBody('');
      setCcEmails([]);
      setBccEmails([]);
      onOpenChange(false);
      onCreated();
    } catch (e: any) {
      toast({ title: 'Chyba při odesílání', description: e.message, variant: 'destructive' });
    }
    setSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nová rozesílka</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Předmět</Label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Předmět emailu" />
          </div>

          <div>
            <Label>Tělo emailu</Label>
            <Textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Text emailu... Použijte {contact_name}, {company} nebo {signature} pro personalizaci."
              rows={8}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Proměnné: <code>{'{contact_name}'}</code>, <code>{'{company}'}</code>, <code>{'{signature}'}</code>
            </p>
          </div>

          <EmailCcBccFields
            cc={ccEmails}
            bcc={bccEmails}
            onCcChange={setCcEmails}
            onBccChange={setBccEmails}
          />

          <div>
            <Label>Příjemci (kontakty aktivních klientů)</Label>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <RecipientSelector
                recipients={recipients}
                selected={selectedIds}
                onSelectionChange={setSelectedIds}
              />
            )}
          </div>

          <Button onClick={handleSend} disabled={sending} className="w-full">
            {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Odeslat rozesílku ({selectedIds.length} příjemců)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
