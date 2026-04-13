import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Send, UserX, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { invokeWithTimeout } from '@/lib/supabaseUtils';
import type { Applicant } from '@/types/applicant';
import { DEFAULT_GMAIL_BCC } from '@/hooks/useGoogleCalendar';
import { EmailTagList } from '@/components/ui/email-tag-list';
import { useAuth } from '@/hooks/useAuth';
import { useCRMData } from '@/hooks/useCRMData';
import { EmailSenderInfo } from '@/components/shared/EmailSenderInfo';
import { formatEmailTextToHtml, getDefaultEmailSignature, inflectVocativeFullName } from '@/lib/emailSignature';
import { useEmailTemplates } from '@/hooks/useEmailTemplates';

interface SendRejectionEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicant: Applicant;
  onSend: () => void;
}


export function SendRejectionEmailDialog({
  open,
  onOpenChange,
  applicant,
  onSend
}: SendRejectionEmailDialogProps) {
  const { user } = useAuth();
  const { colleagues } = useCRMData();
  const { fillTemplate } = useEmailTemplates();
  const currentUserColleague = colleagues.find(c => c.profile_id === user?.id);
  const signature = getDefaultEmailSignature(currentUserColleague, { fallbackName: 'Tým Socials' });

  const getDefaults = () => fillTemplate('rejection_email', {
    name: inflectVocativeFullName(applicant.full_name),
    position: applicant.position,
    signature,
  });

  const [emailTo, setEmailTo] = useState(applicant.email || '');
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [newCcEmail, setNewCcEmail] = useState('');
  const [bccEmails, setBccEmails] = useState<string[]>([DEFAULT_GMAIL_BCC]);
  const [newBccEmail, setNewBccEmail] = useState('');
  const [subject, setSubject] = useState(() => getDefaults().subject);
  const [message, setMessage] = useState(() => getDefaults().body);
  const [isSending, setIsSending] = useState(false);

  // Reset fields when applicant changes or dialog opens
  useEffect(() => {
    if (open) {
      setEmailTo(applicant.email || '');
      setCcEmails([]);
      setNewCcEmail('');
      setBccEmails([DEFAULT_GMAIL_BCC]);
      setNewBccEmail('');
      const defaults = getDefaults();
      setSubject(defaults.subject);
      setMessage(defaults.body);
    }
  }, [open, applicant.id, applicant.position, signature, fillTemplate]);

  const parseEmails = (value: string) =>
    value
      .split(/[\n,;]+/)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);

  const mergeEmails = (base: string[], pending: string) => {
    const merged = [...base];
    for (const email of parseEmails(pending)) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
      if (!merged.includes(email)) merged.push(email);
    }
    return merged;
  };

  const addEmail = (
    email: string,
    list: string[],
    setList: (v: string[]) => void,
    setInput: (v: string) => void
  ) => {
    const candidates = parseEmails(email);
    if (candidates.length === 0) return;

    const next = [...list];
    let hasInvalid = false;

    for (const candidate of candidates) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)) {
        hasInvalid = true;
        continue;
      }
      if (!next.includes(candidate)) {
        next.push(candidate);
      }
    }

    if (hasInvalid) {
      toast.error('Některé emaily nejsou platné');
    }

    setList(next);
    setInput('');
  };

  const removeEmail = (email: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.filter(e => e !== email));
  };

  const handleSend = async () => {
    if (!emailTo.trim()) {
      toast.error('Vyplňte e-mail příjemce');
      return;
    }

    setIsSending(true);

    try {
      const htmlContent = formatEmailTextToHtml(message);

      const finalCcEmails = mergeEmails(ccEmails, newCcEmail);
      const finalBccEmails = mergeEmails(bccEmails, newBccEmail);

      const { error } = await invokeWithTimeout('send-email', {
        body: {
          to: emailTo.trim(),
          cc: finalCcEmails.join(', '),
          bcc: finalBccEmails.join(', '),
          subject,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
              ${htmlContent}
            </div>
          `,
        },
      });

      if (error) throw error;

      onSend();
      toast.success('Odmítací email byl odeslán');
      onOpenChange(false);
    } catch (err: any) {
      console.error('Failed to send rejection email:', err);
      toast.error(err?.message || 'Nepodařilo se odeslat email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <UserX className="h-5 w-5" />
            Odeslat odmítnutí kandidáta
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            Po odeslání bude uchazeč přesunut do stavu "Zamítnut".
          </div>

          <EmailSenderInfo colleague={currentUserColleague} />

          <div className="space-y-2">
            <Label htmlFor="email-to">Příjemce</Label>
            <Input
              id="email-to"
              type="email"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              placeholder="email@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Předmět</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">CC</Label>
              <EmailTagList
                emails={ccEmails}
                onRemove={(e) => removeEmail(e, ccEmails, setCcEmails)}
                newEmail={newCcEmail}
                onNewEmailChange={setNewCcEmail}
                onAdd={() => addEmail(newCcEmail, ccEmails, setCcEmails, setNewCcEmail)}
                placeholder="Přidat CC..."
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">BCC</Label>
              <EmailTagList
                emails={bccEmails}
                onRemove={(e) => removeEmail(e, bccEmails, setBccEmails)}
                newEmail={newBccEmail}
                onNewEmailChange={setNewBccEmail}
                onAdd={() => addEmail(newBccEmail, bccEmails, setBccEmails, setNewBccEmail)}
                placeholder="Přidat BCC..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Zpráva</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button variant="destructive" onClick={handleSend} disabled={isSending || !emailTo.trim()}>
            {isSending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {isSending ? 'Odesílání...' : 'Odeslat odmítnutí'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
