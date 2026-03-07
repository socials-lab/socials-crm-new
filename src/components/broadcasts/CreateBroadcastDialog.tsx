import { useEffect, useState } from 'react';
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
    void loadRecipients();
  }, [open]);

  async function loadRecipients() {
    setLoading(true);
    try {
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

      const clientMap = new Map(clients.map((client) => [client.id, client.name]));

      const { data: contacts } = await supabase
        .from('client_contacts')
        .select('id, name, email, client_id')
        .in('client_id', clients.map((client) => client.id))
        .not('email', 'is', null);

      const mapped: Recipient[] = (contacts || [])
        .filter((contact) => contact.email && contact.email.trim() !== '')
        .map((contact) => ({
          contact_id: contact.id,
          contact_name: contact.name,
          email: contact.email!,
          company: clientMap.get(contact.client_id) || '',
          client_id: contact.client_id,
        }));

      setRecipients(mapped);
      setSelectedIds(mapped.map((recipient) => recipient.contact_id));
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  async function handleSend() {
    if (!subject.trim()) {
      toast({ title: 'Vyplňte předmět', variant: 'destructive' });
      return;
    }
    if (!body.trim()) {
      toast({ title: 'Vyplňte tělo emailu', variant: 'destructive' });
      return;
    }
    if (ccEmails.length > 0) {
      toast({
        title: 'CC nelze použít u rozesílek',
        description: 'Kvůli ochraně soukromí příjemců použijte BCC.',
        variant: 'destructive',
      });
      return;
    }
    if (selectedIds.length === 0) {
      toast({ title: 'Vyberte alespoň jednoho příjemce', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      const selectedRecipients = recipients.filter((recipient) => selectedIds.includes(recipient.contact_id));
      const recipientsPayload = selectedRecipients.map((recipient) => ({
        email: recipient.email,
        contact_name: recipient.contact_name,
        company: recipient.company,
      }));

      const { data: broadcastData, error: dbError } = await supabase
        .from('broadcasts' as any)
        .insert({
          subject,
          body,
          recipient_count: selectedRecipients.length,
          recipients: recipientsPayload,
          cc_emails: ccEmails,
          bcc_emails: bccEmails,
          sent_by: user?.id,
        })
        .select('id')
        .single();

      if (dbError) throw dbError;

      const broadcastId = (broadcastData as any)?.id;

      const { error: functionError } = await supabase.functions.invoke('send-broadcast', {
        body: {
          subject,
          body,
          recipients: recipientsPayload,
          cc_emails: ccEmails,
          bcc_emails: bccEmails,
          broadcast_id: broadcastId,
        },
      });
      if (functionError) throw functionError;

      const { data: statusCheck, error: statusCheckError } = await supabase
        .from('broadcasts' as any)
        .select('send_status, failed_count, last_error')
        .eq('id', broadcastId)
        .single();
      if (statusCheckError) throw statusCheckError;

      const sendStatus = (statusCheck as any)?.send_status as string | undefined;
      const failedCount = Number((statusCheck as any)?.failed_count ?? 0);
      const lastError = (statusCheck as any)?.last_error as string | null | undefined;

      if (sendStatus === 'failed') {
        throw new Error(lastError || 'Rozesílání selhalo');
      }
      if (sendStatus === 'partial_failed' || failedCount > 0) {
        toast({
          title: `Rozesílka odeslána částečně (${selectedRecipients.length - failedCount}/${selectedRecipients.length})`,
          description: lastError || `${failedCount} příjemcům se nepodařilo odeslat email`,
          variant: 'destructive',
        });
      } else {
        toast({ title: `Rozesílka odeslána ${selectedRecipients.length} příjemcům` });
      }
      setSubject('');
      setBody('');
      setCcEmails([]);
      setBccEmails([]);
      onOpenChange(false);
      onCreated();
    } catch (error: any) {
      toast({ title: 'Chyba při odesílání', description: error.message, variant: 'destructive' });
    }
    setSending(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nová rozesílka</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border p-3 bg-muted/50">
            <Label className="text-xs text-muted-foreground">Odesílatel</Label>
            <p className="text-sm font-medium">{user?.email || '—'}</p>
          </div>

          <div>
            <Label>Předmět</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Předmět emailu" />
          </div>

          <div>
            <Label>Tělo emailu</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Text emailu... Použijte {contact_name}, {company} nebo {signature} pro personalizaci."
              rows={8}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Proměnné: <code>{'{contact_name}'}</code>, <code>{'{company}'}</code>, <code>{'{signature}'}</code>
            </p>
          </div>

          <EmailCcBccFields cc={ccEmails} bcc={bccEmails} onCcChange={setCcEmails} onBccChange={setBccEmails} />
          <p className="text-xs text-muted-foreground">
            U rozesílek je podporováno pouze BCC, aby příjemci neviděli ostatní adresy.
          </p>

          <div>
            <Label>Příjemci (kontakty aktivních klientů)</Label>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <RecipientSelector recipients={recipients} selected={selectedIds} onSelectionChange={setSelectedIds} />
            )}
          </div>

          <Button onClick={() => void handleSend()} disabled={sending} className="w-full">
            {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Odeslat rozesílku ({selectedIds.length} příjemců)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
