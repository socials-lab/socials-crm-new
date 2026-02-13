import { useState } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';

interface RequestAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactName: string;
  contactEmail: string | null;
  companyName: string;
  leadId: string;
  onSent?: (platforms: string[]) => void;
}

export function RequestAccessDialog({
  open,
  onOpenChange,
  contactName,
  contactEmail,
  companyName,
  leadId,
  onSent,
}: RequestAccessDialogProps) {
  const { hasGmailScope, isCheckingConnection, connectGoogleCalendar, sendEmail, isLoading: googleLoading } = useGoogleCalendar();

  const getDefaultSubject = () => {
    return `Žádost o nasdílení přístupů - ${companyName} / Socials`;
  };

  const generateDefaultEmail = () => {
    return `Dobrý den ${contactName},

rádi bychom Vás požádali o nasdílení přístupů k reklamním účtům.

Přístupy prosím nasdílejte na email: ads@socials.cz

Pro Meta Ads: Přidejte nás jako partnera s přístupem k reklamnímu účtu.
Pro Google Ads: Přidejte email jako uživatele s oprávněním "Správce".
Pro S-klik: Přidejte email jako uživatele s rolí "Administrátor".

Děkujeme za spolupráci.

S pozdravem,
Tým Socials`;
  };

  const [emailSubject, setEmailSubject] = useState(getDefaultSubject());
  const [emailContent, setEmailContent] = useState(generateDefaultEmail());
  const [recipientEmail, setRecipientEmail] = useState(contactEmail || '');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!recipientEmail || !recipientEmail.trim()) {
      toast.error('Zadejte email příjemce');
      return;
    }

    if (!hasGmailScope) {
      toast.error('Pro odesílání emailů je potřeba propojit Google účet s oprávněním pro Gmail');
      return;
    }

    setIsSending(true);

    try {
      // Convert plain text to HTML with better formatting
      const lines = emailContent.split('\n');
      const htmlParts: string[] = [];
      let currentParagraph: string[] = [];

      for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed === '') {
          if (currentParagraph.length > 0) {
            htmlParts.push(`<p style="margin: 0 0 16px 0;">${currentParagraph.join('<br>')}</p>`);
            currentParagraph = [];
          }
        } else if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.match(/^\d+\./)) {
          if (currentParagraph.length > 0) {
            htmlParts.push(`<p style="margin: 0 0 16px 0;">${currentParagraph.join('<br>')}</p>`);
            currentParagraph = [];
          }
          htmlParts.push(`<p style="margin: 0 0 8px 0; padding-left: 20px;">${trimmed}</p>`);
        } else {
          currentParagraph.push(trimmed);
        }
      }

      if (currentParagraph.length > 0) {
        htmlParts.push(`<p style="margin: 0 0 16px 0;">${currentParagraph.join('<br>')}</p>`);
      }

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
          ${htmlParts.join('')}
        </div>
      `;

      const result = await sendEmail(recipientEmail.trim(), emailSubject, html);

      if (result) {
        onSent?.([]);

        toast.success('Žádost o přístupy byla odeslána');
        onOpenChange(false);

        // Reset state
        setEmailContent(generateDefaultEmail());
      }
    } catch (error) {
      console.error('Failed to send email:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      // Reset when opening
      setEmailSubject(getDefaultSubject());
      setEmailContent(generateDefaultEmail());
      setRecipientEmail(contactEmail || '');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>📧 Žádost o nasdílení přístupů</DialogTitle>
          <DialogDescription>
            Upravte znění emailu před odesláním.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Google Connection Warning */}
          {!isCheckingConnection && !hasGmailScope && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  Pro odesílání emailů je potřeba propojit Google účet
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={connectGoogleCalendar}
                  disabled={googleLoading}
                >
                  Propojit Google účet
                </Button>
              </div>
            </div>
          )}

          {/* Recipient Info */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Příjemce (email)</Label>
              <Input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="email@example.com"
              />
              <p className="text-xs text-muted-foreground">
                Výchozí: {contactName} {contactEmail ? `(${contactEmail})` : '– email nevyplněn'}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Společnost:</span>
              <span className="font-medium">{companyName}</span>
            </div>
          </div>

          {/* Email Subject */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Předmět emailu</Label>
            <Input
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Předmět emailu..."
            />
          </div>

          {/* Email Content */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Obsah emailu</Label>
            <Textarea
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              rows={10}
              className="font-mono text-sm"
              placeholder="Text emailu..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !recipientEmail.trim() || !hasGmailScope}
          >
            {isSending ? (
              <>
                <Send className="h-4 w-4 mr-2 animate-pulse" />
                Odesílám...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Odeslat email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
