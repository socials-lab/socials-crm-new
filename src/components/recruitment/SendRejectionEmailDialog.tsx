import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Send, UserX, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Applicant } from '@/types/applicant';

interface SendRejectionEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicant: Applicant;
  onSend: () => void;
}

function buildDefaultMessage(applicant: Applicant) {
  return `Dobrý den ${applicant.full_name.split(' ')[0]},

děkujeme za Váš zájem o pozici ${applicant.position} v agentuře Socials a čas, který jste věnoval/a přípravě své přihlášky.

Po pečlivém zvážení jsme se rozhodli pokračovat s jinými kandidáty, jejichž profil lépe odpovídá našim aktuálním potřebám.

Přejeme Vám mnoho úspěchů v dalším profesním směřování a věříme, že najdete pozici, která bude přesně pro Vás.

S pozdravem,
Tým Socials`;
}

export function SendRejectionEmailDialog({
  open,
  onOpenChange,
  applicant,
  onSend
}: SendRejectionEmailDialogProps) {
  const [emailTo, setEmailTo] = useState(applicant.email || '');
  const [subject, setSubject] = useState(`Vyjádření k Vaší přihlášce – ${applicant.position} | Socials`);
  const [message, setMessage] = useState(buildDefaultMessage(applicant));
  const [isSending, setIsSending] = useState(false);

  // Reset fields when applicant changes or dialog opens
  useEffect(() => {
    if (open) {
      setEmailTo(applicant.email || '');
      setSubject(`Vyjádření k Vaší přihlášce – ${applicant.position} | Socials`);
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
