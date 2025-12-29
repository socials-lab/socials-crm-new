import { useState } from 'react';
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
import { Mail, Copy, Check, Send } from 'lucide-react';
import { toast } from 'sonner';
import type { Applicant } from '@/types/applicant';
import { useApplicantsData } from '@/hooks/useApplicantsData';

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
  const [copied, setCopied] = useState(false);
  
  const onboardingUrl = `${window.location.origin}/applicant-onboarding/${applicant.id}`;
  
  const emailSubject = `Onboarding - ${applicant.position} | Socials.cz`;
  const emailBody = `Dobrý den ${applicant.full_name.split(' ')[0]},

gratulujeme k přijetí na pozici ${applicant.position}!

Pro dokončení nástupu prosím vyplňte onboarding formulář:
${onboardingUrl}

Formulář obsahuje předvyplněné údaje z Vaší přihlášky. Prosím zkontrolujte je a doplňte zbývající informace potřebné pro pracovní smlouvu.

Těšíme se na spolupráci!

S pozdravem,
HR tým Socials.cz`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(onboardingUrl);
    setCopied(true);
    toast.success('Odkaz zkopírován');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = () => {
    const mailtoLink = `mailto:${applicant.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoLink, '_blank');
    sendOnboarding(applicant.id);
    onSend?.();
    toast.success('Onboarding byl odeslán');
    onOpenChange(false);
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
          {/* Recipient info */}
          <div className="bg-muted/50 p-3 rounded-lg space-y-1">
            <p className="font-medium">{applicant.full_name}</p>
            <p className="text-sm text-muted-foreground">{applicant.email}</p>
            <p className="text-sm text-muted-foreground">{applicant.position}</p>
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

          {/* Email preview */}
          <div className="space-y-2">
            <Label>Náhled emailu</Label>
            <Textarea 
              value={emailBody}
              readOnly
              className="min-h-[150px] text-sm"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleMarkAsSent}>
            Pouze označit jako odesláno
          </Button>
          <Button onClick={handleSendEmail} className="gap-2">
            <Send className="h-4 w-4" />
            Otevřít v emailu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
