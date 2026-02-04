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
import { supabase } from '@/integrations/supabase/client';
import type { Applicant } from '@/types/applicant';
import { useApplicantsData } from '@/hooks/useApplicantsData';

interface SendApplicantOnboardingDialogProps {
  applicant: Applicant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend?: () => void;
}

function buildDefaultMessage(applicant: Applicant, onboardingUrl: string) {
  return `Dobrý den ${applicant.full_name.split(' ')[0]},

gratulujeme k přijetí na pozici ${applicant.position}!

Pro dokončení nástupu prosím vyplňte onboarding formulář:
${onboardingUrl}

Formulář obsahuje předvyplněné údaje z Vaší přihlášky. Prosím zkontrolujte je a doplňte zbývající informace potřebné pro pracovní smlouvu.

Těšíme se na spolupráci!

S pozdravem,
HR tým Socials.cz`;
}

export function SendApplicantOnboardingDialog({
  applicant,
  open,
  onOpenChange,
  onSend,
}: SendApplicantOnboardingDialogProps) {
  const { sendOnboarding } = useApplicantsData();
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const onboardingUrl = `${window.location.origin}/applicant-onboarding/${applicant.id}`;

  const [emailTo, setEmailTo] = useState(applicant.email || '');
  const [subject, setSubject] = useState(`Onboarding - ${applicant.position} | Socials.cz`);
  const [message, setMessage] = useState(buildDefaultMessage(applicant, onboardingUrl));

  // Reset fields when applicant changes or dialog opens
  useEffect(() => {
    if (open) {
      setEmailTo(applicant.email || '');
      setSubject(`Onboarding - ${applicant.position} | Socials.cz`);
      setMessage(buildDefaultMessage(applicant, `${window.location.origin}/applicant-onboarding/${applicant.id}`));
    }
  }, [open, applicant.id]);

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
      const htmlContent = message
        .split('\n')
        .map(line => {
          if (line.startsWith('http')) {
            return `<p><a href="${line}" style="color: #2563eb; text-decoration: underline;">${line}</a></p>`;
          }
          return line.trim() ? `<p>${line}</p>` : '<br>';
        })
        .join('');

      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: emailTo.trim(),
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

  const handleMarkAsSent = () => {
    sendOnboarding(applicant.id);
    onSend?.();
    toast.success('Označeno jako odesláno');
    onOpenChange(false);
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
          <Button variant="outline" onClick={handleMarkAsSent}>
            Pouze označit jako odesláno
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
