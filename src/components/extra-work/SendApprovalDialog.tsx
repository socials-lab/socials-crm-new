import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCRMData } from '@/hooks/useCRMData';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { ExtraWork } from '@/types/crm';
import { Copy, Mail, CheckCircle2, Loader2 } from 'lucide-react';

interface SendApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extraWork: ExtraWork;
  onUpdate: (id: string, data: Partial<ExtraWork>) => void;
}

export function SendApprovalDialog({ open, onOpenChange, extraWork, onUpdate }: SendApprovalDialogProps) {
  const { getClientById, clientContacts } = useCRMData();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const client = useMemo(() => getClientById(extraWork.client_id), [extraWork.client_id, getClientById]);

  // Pre-fill email from client contacts
  const defaultEmail = useMemo(() => {
    const contacts = clientContacts.filter(c => c.client_id === extraWork.client_id);
    const primary = contacts.find(c => c.is_primary);
    return primary?.email || contacts[0]?.email || client?.main_contact_email || '';
  }, [extraWork.client_id, clientContacts, client]);

  // Generate or use existing token
  const getApprovalToken = async (): Promise<string> => {
    if ((extraWork as any).approval_token) return (extraWork as any).approval_token;

    const token = crypto.randomUUID();
    
    // Update in Supabase
    const { error } = await supabase
      .from('extra_works')
      .update({ approval_token: token } as any)
      .eq('id', extraWork.id);

    if (error) {
      console.error('Failed to save token:', error);
    }

    onUpdate(extraWork.id, { approval_token: token } as any);
    return token;
  };

  const getApprovalUrl = async () => {
    const token = await getApprovalToken();
    return `${window.location.origin}/extra-work-approval/${token}`;
  };

  const handleCopyLink = async () => {
    try {
      const url = await getApprovalUrl();
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      toast({ title: 'Odkaz zkopírován', description: 'Schvalovací odkaz byl zkopírován do schránky.' });
    } catch (err) {
      toast({ title: 'Chyba', description: 'Nepodařilo se zkopírovat odkaz.', variant: 'destructive' });
    }
  };

  const handleSendEmail = async () => {
    const targetEmail = email || defaultEmail;
    if (!targetEmail) {
      toast({ title: 'Chyba', description: 'Zadejte email.', variant: 'destructive' });
      return;
    }

    setIsSending(true);
    try {
      const token = await getApprovalToken();
      const approvalUrl = `${window.location.origin}/extra-work-approval/${token}`;

      // Update email on the record
      onUpdate(extraWork.id, { client_approval_email: targetEmail } as any);

      // Also update in Supabase
      await supabase
        .from('extra_works')
        .update({ client_approval_email: targetEmail } as any)
        .eq('id', extraWork.id);

      // Call edge function (stub)
      await supabase.functions.invoke('send-extra-work-approval', {
        body: {
          email: targetEmail,
          approval_url: approvalUrl,
          extra_work_name: extraWork.name,
          client_name: client?.brand_name,
          amount: extraWork.amount,
          hours: extraWork.hours_worked,
          rate: extraWork.hourly_rate,
        },
        headers: {},
      });

      toast({ title: 'Email odeslán', description: `Schvalovací email byl odeslán na ${targetEmail}.` });
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast({ title: 'Chyba', description: 'Nepodařilo se odeslat email.', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Odeslat ke schválení</DialogTitle>
          <DialogDescription>
            Pošlete klientovi odkaz pro schválení vícepráce "{extraWork.name}".
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Email klienta</Label>
            <Input
              type="email"
              value={email || defaultEmail}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="klient@firma.cz"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSendEmail} disabled={isSending} className="flex-1">
              {isSending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Odesílám...</>
              ) : (
                <><Mail className="h-4 w-4 mr-2" /> Odeslat email</>
              )}
            </Button>
            <Button variant="outline" onClick={handleCopyLink}>
              {linkCopied ? (
                <><CheckCircle2 className="h-4 w-4 mr-2 text-green-600" /> Zkopírováno</>
              ) : (
                <><Copy className="h-4 w-4 mr-2" /> Zkopírovat odkaz</>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Email zatím loguje payload na serveru. Pro skutečné odesílání bude potřeba napojit Resend API.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Zavřít</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
