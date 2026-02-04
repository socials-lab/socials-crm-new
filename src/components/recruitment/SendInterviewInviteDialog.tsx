import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Send, Mail, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Applicant } from '@/types/applicant';

interface SendInterviewInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicant: Applicant;
  onSend: () => void;
}

function buildDefaultMessage(applicant: Applicant) {
  return `Dobrý den ${applicant.full_name.split(' ')[0]},

děkujeme za Váš zájem o pozici ${applicant.position} v agentuře Socials.

Rádi bychom se s Vámi spojili na krátký telefonát nebo online schůzku, abychom Vás lépe poznali a probrali detaily případné spolupráce.

Dejte prosím vědět, kdy se Vám hodí 15-30 minutový call.

Děkujeme a těšíme se na Vás,
Tým Socials`;
}

export function SendInterviewInviteDialog({
  open,
  onOpenChange,
  applicant,
  onSend
}: SendInterviewInviteDialogProps) {
  const [emailTo, setEmailTo] = useState(applicant.email || '');
  const [subject, setSubject] = useState(`Pozvánka na pohovor – ${applicant.position} | Socials`);
  const [message, setMessage] = useState(buildDefaultMessage(applicant));
  const [isSending, setIsSending] = useState(false);

  // Reset fields when applicant changes or dialog opens
  useEffect(() => {
    if (open) {
      setEmailTo(applicant.email || '');
      setSubject(`Pozvánka na pohovor – ${applicant.position} | Socials`);
      setMessage(buildDefaultMessage(applicant));
    }
  }, [open, applicant.id]);

  const handleSend = async () => {
    if (!emailTo.trim()) {
      toast.error('Vyplňte e-mail příjemce');
      return;
    }

    setIsSending(true);

    try {
      // Convert plain text to HTML
      const htmlContent = message
        .split('\n')
        .map(line => line.trim() ? `<p>${line}</p>` : '<br>')
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

      onSend();
      toast.success('Pozvánka na pohovor byla odeslána');
      onOpenChange(false);
    } catch (err: any) {
      console.error('Failed to send interview invite:', err);
      toast.error(err?.message || 'Nepodařilo se odeslat pozvánku');
    } finally {
      setIsSending(false);
    }
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
          <Button onClick={handleSend} disabled={isSending || !emailTo.trim()}>
            {isSending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {isSending ? 'Odesílání...' : 'Odeslat pozvánku'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
