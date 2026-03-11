import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Copy, Check, Send, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { invokeWithTimeout } from '@/lib/supabaseUtils';
import type { Applicant } from '@/types/applicant';
import { useApplicantsData } from '@/hooks/useApplicantsData';
import { DEFAULT_GMAIL_BCC } from '@/hooks/useGoogleCalendar';
import { EmailTagList } from '@/components/ui/email-tag-list';
import { useAuth } from '@/hooks/useAuth';
import { useCRMData } from '@/hooks/useCRMData';
import { formatEmailTextToHtml, getDefaultEmailSignature } from '@/lib/emailSignature';
import { useEmailTemplates } from '@/hooks/useEmailTemplates';

interface SendApplicantOnboardingDialogProps {
  applicant: Applicant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend?: () => void;
}


export function SendApplicantOnboardingDialog({
  applicant,
  open,
  onOpenChange,
  onSend,
}: SendApplicantOnboardingDialogProps) {
  const { sendOnboarding } = useApplicantsData();
  const { user } = useAuth();
  const { colleagues } = useCRMData();
  const { fillTemplate } = useEmailTemplates();
  const currentUserColleague = colleagues.find(c => c.profile_id === user?.id);
  const signature = getDefaultEmailSignature(currentUserColleague, { fallbackName: 'HR tým Socials.cz' });
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const onboardingUrl = `${window.location.origin}/applicant-onboarding/${applicant.id}`;

  const getDefaults = () => fillTemplate('applicant_onboarding', {
    name: applicant.full_name.split(' ')[0],
    position: applicant.position,
    url: onboardingUrl,
    signature,
  });

  const [emailTo, setEmailTo] = useState(applicant.email || '');
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [newCcEmail, setNewCcEmail] = useState('');
  const [bccEmails, setBccEmails] = useState<string[]>([DEFAULT_GMAIL_BCC]);
  const [newBccEmail, setNewBccEmail] = useState('');
  const [subject, setSubject] = useState(() => getDefaults().subject);
  const [message, setMessage] = useState(() => getDefaults().body);

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

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(onboardingUrl);
    setCopied(true);
    toast.success('Odkaz zkopírován');
    setTimeout(() => setCopied(false), 2000);
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

      sendOnboarding(applicant.id);
      onSend?.();
      toast.success('Onboarding email byl odeslán');
      onOpenChange(false);
    } catch (err: any) {
      console.error('Failed to send onboarding email:', err);
      toast.error(err?.message || 'Nepodařilo se odeslat email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Odeslat onboarding formulář
          </DialogTitle>
          <DialogDescription>
            Odešlete novému kolegovi odkaz na vyplnění onboarding formuláře
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipient */}
          <div className="space-y-2">
            <Label htmlFor="onb-email">Příjemce</Label>
            <Input
              id="onb-email"
              type="email"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              placeholder="email@example.com"
            />
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="onb-subject">Předmět</Label>
            <Input
              id="onb-subject"
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

          {/* Onboarding link */}
          <div className="space-y-2">
            <Label>Odkaz na onboarding</Label>
            <div className="flex gap-2">
              <Input
                value={onboardingUrl}
                readOnly
                className="text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Editable message */}
          <div className="space-y-2">
            <Label htmlFor="onb-message">Zpráva</Label>
            <Textarea
              id="onb-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[150px] text-sm font-mono"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button onClick={handleSend} disabled={isSending || !emailTo.trim()}>
            {isSending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {isSending ? 'Odesílání...' : 'Odeslat email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
