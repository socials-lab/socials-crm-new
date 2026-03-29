import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Send, UserX, DoorOpen, MessageSquareText } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useEmailTemplates } from '@/hooks/useEmailTemplates';
import { EmailCcBccFields } from '@/components/shared/EmailCcBccFields';
import type { Applicant } from '@/types/applicant';

interface SendRejectionEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicant: Applicant;
  onSend: (emailData: { subject: string; message: string; recipients: string[] }) => void;
}

type RejectionVariant = 'friendly' | 'constructive';

export function SendRejectionEmailDialog({ 
  open, 
  onOpenChange, 
  applicant,
  onSend 
}: SendRejectionEmailDialogProps) {
  const { user } = useAuth();
  const { fillTemplate } = useEmailTemplates();
  const senderName = [user?.user_metadata?.first_name, user?.user_metadata?.last_name].filter(Boolean).join(' ') || 'Socials';
  const senderEmail = user?.email || '';

  const templateVars = {
    name: applicant.full_name.split(' ')[0],
    position: applicant.position,
    sender: senderName,
  };

  const friendly = fillTemplate('rejection_email', templateVars);
  const constructive = fillTemplate('rejection_email_constructive', templateVars);

  const [variant, setVariant] = useState<RejectionVariant>('friendly');
  const [subject, setSubject] = useState(friendly.subject);
  const [message, setMessage] = useState(friendly.body);
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);

  const handleVariantChange = (v: RejectionVariant) => {
    setVariant(v);
    const tpl = v === 'friendly' ? friendly : constructive;
    setSubject(tpl.subject);
    setMessage(tpl.body);
  };

  const handleSendEmail = () => {
    const mailtoLink = `mailto:${applicant.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.open(mailtoLink, '_blank');
    onSend({ subject, message, recipients: [applicant.email] });
    toast.success('Odmítací email byl odeslán');
    onOpenChange(false);
  };

  const handleMarkAsSent = () => {
    onSend({ subject, message, recipients: [applicant.email] });
    toast.success('Označeno jako odesláno');
    onOpenChange(false);
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
            Po odeslání bude uchazeč přesunut do stavu „Bad fit".
          </div>

          {/* Variant selector */}
          <div className="space-y-2">
            <Label>Varianta e-mailu</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={variant === 'friendly' ? 'default' : 'outline'}
                className="justify-start gap-2 h-auto py-3"
                onClick={() => handleVariantChange('friendly')}
              >
                <DoorOpen className="h-4 w-4 shrink-0" />
                <div className="text-left">
                  <div className="font-medium text-sm">Přátelské</div>
                  <div className="text-xs opacity-70">Otevřené dveře do budoucna</div>
                </div>
              </Button>
              <Button
                type="button"
                variant={variant === 'constructive' ? 'default' : 'outline'}
                className="justify-start gap-2 h-auto py-3"
                onClick={() => handleVariantChange('constructive')}
              >
                <MessageSquareText className="h-4 w-4 shrink-0" />
                <div className="text-left">
                  <div className="font-medium text-sm">Konstruktivní</div>
                  <div className="text-xs opacity-70">S feedbackem a doporučením</div>
                </div>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Odesílatel</Label>
            <Input
              value={`${senderName} <${senderEmail}>`}
              readOnly
              className="bg-muted/50"
            />
          </div>

          <EmailCcBccFields cc={cc} onCcChange={setCc} bcc={bcc} onBccChange={setBcc} />

          <div className="space-y-2">
            <Label htmlFor="subject">Předmět</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Zpráva</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={12}
              className="font-mono text-sm"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleMarkAsSent}>
            Pouze označit jako odesláno
          </Button>
          <Button variant="destructive" onClick={handleSendEmail} className="gap-2">
            <Send className="h-4 w-4" />
            Otevřít v emailu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
