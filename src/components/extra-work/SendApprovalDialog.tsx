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
import { Copy, Mail, CheckCircle2 } from 'lucide-react';

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
  const [linkCopied, setLinkCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const client = useMemo(() => getClientById(extraWork.client_id), [extraWork.client_id, getClientById]);

  const defaultEmail = useMemo(() => {
    const contacts = clientContacts.filter(c => c.client_id === extraWork.client_id);
    const primary = contacts.find(c => c.is_primary);
    return primary?.email || contacts[0]?.email || client?.main_contact_email || '';
  }, [extraWork.client_id, clientContacts, client]);

  const getOrCreateToken = async (): Promise<string> => {
    // If token already exists on the extra work, reuse it
    if (extraWork.approval_token) return extraWork.approval_token;

    const token = crypto.randomUUID();
    const { error } = await (supabase as any)
      .from('extra_works')
      .update({ approval_token: token })
      .eq('id', extraWork.id);

    if (error) {
      console.error('Failed to save approval token:', error);
      throw error;
    }

    onUpdate(extraWork.id, { approval_token: token } as any);
    return token;
  };

  const getApprovalUrl = async () => {
    const token = await getOrCreateToken();
    return `${window.location.origin}/extra-work-approval/${token}`;
  };

  const handleCopyLink = async () => {
    try {
      setIsSaving(true);
      const url = await getApprovalUrl();
      navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      toast({ title: 'Odkaz zkopírován', description: 'Schvalovací odkaz byl zkopírován do schránky.' });
    } catch {
      toast({ title: 'Chyba', description: 'Nepodařilo se vytvořit odkaz.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendEmail = async () => {
    const targetEmail = email || defaultEmail;
    if (!targetEmail) {
      toast({ title: 'Chyba', description: 'Zadejte email.', variant: 'destructive' });
      return;
    }

    try {
      setIsSaving(true);
      const token = await getOrCreateToken();

      // Update email in DB
      await (supabase as any)
        .from('extra_works')
        .update({ client_approval_email: targetEmail })
        .eq('id', extraWork.id);

      // Call edge function to send email
      await supabase.functions.invoke('send-extra-work-approval', {
        body: {
          token,
          email: targetEmail,
          extraWorkName: extraWork.name,
          amount: extraWork.amount,
          currency: extraWork.currency,
          clientName: client?.brand_name || client?.name || '',
        },
        headers: { 'Content-Type': 'application/json' },
      });

      onUpdate(extraWork.id, { client_approval_email: targetEmail } as any);

      toast({ title: '📧 Email odeslán', description: `Schvalovací email byl odeslán na ${targetEmail}.` });
      onOpenChange(false);
    } catch {
      toast({ title: 'Chyba', description: 'Nepodařilo se odeslat email.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
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
            <Button onClick={handleSendEmail} className="flex-1" disabled={isSaving}>
              <Mail className="h-4 w-4 mr-2" /> Odeslat email
            </Button>
            <Button variant="outline" onClick={handleCopyLink} disabled={isSaving}>
              {linkCopied ? (
                <><CheckCircle2 className="h-4 w-4 mr-2 text-green-600" /> Zkopírováno</>
              ) : (
                <><Copy className="h-4 w-4 mr-2" /> Zkopírovat odkaz</>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Klient obdrží odkaz pro schválení nebo zamítnutí vícepráce.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Zavřít</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
