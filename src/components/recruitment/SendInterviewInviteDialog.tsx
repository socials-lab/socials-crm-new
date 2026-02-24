import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Send, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useEmailTemplates } from '@/hooks/useEmailTemplates';
import { EmailCcBccFields } from '@/components/shared/EmailCcBccFields';
import type { Applicant } from '@/types/applicant';

interface SendInterviewInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicant: Applicant;
  onSend: (emailData: { subject: string; message: string; recipients: string[] }) => void;
}

export function SendInterviewInviteDialog({ 
  open, 
  onOpenChange, 
  applicant,
  onSend 
}: SendInterviewInviteDialogProps) {
  const { user } = useAuth();
  const { fillTemplate } = useEmailTemplates();
  const senderName = [user?.user_metadata?.first_name, user?.user_metadata?.last_name].filter(Boolean).join(' ') || 'Socials';
  const senderEmail = user?.email || '';

  const { subject: defaultSubject, body: defaultMessage } = fillTemplate('interview_invite', {
    name: applicant.full_name.split(' ')[0],
    position: applicant.position,
    sender: senderName,
  });

  const [emailTo, setEmailTo] = useState(applicant.email);
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState(defaultMessage);
  const [isSending, setIsSending] = useState(false);
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);

  const handleSend = async () => {
    setIsSending(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    onSend({ subject, message, recipients: [emailTo] });
    toast.success('Pozvánka na pohovor byla odeslána');
    onOpenChange(false);
    setIsSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Odeslat pozvánku na pohovor
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Odesílatel</Label>
            <Input
              value={`${senderName} <${senderEmail}>`}
              readOnly
              className="bg-muted/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-to">Příjemce</Label>
            <Input
              id="email-to"
              type="email"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
            />
          </div>

          {/* CC / BCC */}
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
              rows={10}
              className="font-mono text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            <Send className="mr-2 h-4 w-4" />
            {isSending ? 'Odesílání...' : 'Odeslat pozvánku'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
