import { useState } from 'react';
import { Send, AlertCircle, Plus, X } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
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

const DEFAULT_BCC = ['danny@socials.cz', 'dana.bauerova@socials.cz'];

const DEFAULT_EMAIL_CONTENT = `Dobrý den,

Na základě našeho telefonátu Vás prosíme o nasdílení přístupů do níže uvedených marketingových nástrojů. Uděláme audit a připravíme pro vás nabídku na případnou spolupráci.

Google Analytics 4 - Přístup na úrovni celého účtu s oprávněním "Čtení" pošlete na e-mail analytics@socials.cz

Facebook Business Manager - Přidejte nás jako partnery (ID našeho účtu: 1196977750459552) s nejnižší úrovní přístupů k těmto položkám: Reklamní účet, Katalog produktů, Meta Pixel (Datový set), FB stránka.

Google Ads - Zašlete nám ID reklamního účtu. Zašleme žádost o přístup která dorazí na e-mail, na který máte Google Ads účet vedený.

S-klik - Nasdílejte na e-mail mysocials@seznam.cz

Pokud si nebudete vědět rady, zde naleznete návod. Případně klidně napište a pomůžeme :)

Děkujeme a přejeme hezký den,
Tým Socials`;

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

  const [toEmails, setToEmails] = useState<string[]>(contactEmail ? [contactEmail] : []);
  const [newToEmail, setNewToEmail] = useState('');
  const [bccEmails, setBccEmails] = useState<string[]>(DEFAULT_BCC);
  const [newBccEmail, setNewBccEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState(getDefaultSubject());
  const [emailContent, setEmailContent] = useState(DEFAULT_EMAIL_CONTENT);
  const [isSending, setIsSending] = useState(false);

  const addEmail = (
    email: string,
    list: string[],
    setList: (v: string[]) => void,
    setInput: (v: string) => void
  ) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error('Neplatný email');
      return;
    }
    if (list.includes(trimmed)) {
      toast.error('Email už je v seznamu');
      return;
    }
    setList([...list, trimmed]);
    setInput('');
  };

  const removeEmail = (email: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.filter(e => e !== email));
  };

  const handleSend = async () => {
    if (toEmails.length === 0) {
      toast.error('Zadejte alespoň jednoho příjemce');
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

      // Send to all recipients (primary + BCC)
      // Note: Gmail API sendEmail might need to be updated to support multiple recipients
      // For now, we send to the first recipient and include others in the message
      const allRecipients = toEmails.join(', ');
      const result = await sendEmail(allRecipients, emailSubject, html, bccEmails.join(', '));

      if (result) {
        onSent?.(['Google Analytics 4', 'Facebook Business Manager', 'Google Ads', 'S-klik']);
        toast.success('Žádost o přístupy byla odeslána');
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Failed to send email:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setToEmails(contactEmail ? [contactEmail] : []);
      setNewToEmail('');
      setBccEmails(DEFAULT_BCC);
      setNewBccEmail('');
      setEmailSubject(getDefaultSubject());
      setEmailContent(DEFAULT_EMAIL_CONTENT);
    }
    onOpenChange(newOpen);
  };

  const EmailTagList = ({
    emails,
    onRemove,
    newEmail,
    onNewEmailChange,
    onAdd,
    placeholder,
  }: {
    emails: string[];
    onRemove: (e: string) => void;
    newEmail: string;
    onNewEmailChange: (v: string) => void;
    onAdd: () => void;
    placeholder: string;
  }) => (
    <div className="space-y-2">
      {emails.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {emails.map(email => (
            <Badge key={email} variant="secondary" className="gap-1 pr-1 font-normal">
              {email}
              <button
                type="button"
                onClick={() => onRemove(email)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={newEmail}
          onChange={(e) => onNewEmailChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAdd(); } }}
          placeholder={placeholder}
          className="text-sm"
        />
        <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={onAdd}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📧 Žádost o nasdílení přístupů</DialogTitle>
          <DialogDescription>
            Upravte příjemce a znění emailu před odesláním.
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

          {/* To */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Komu</Label>
            <EmailTagList
              emails={toEmails}
              onRemove={(e) => removeEmail(e, toEmails, setToEmails)}
              newEmail={newToEmail}
              onNewEmailChange={setNewToEmail}
              onAdd={() => addEmail(newToEmail, toEmails, setToEmails, setNewToEmail)}
              placeholder="Přidat příjemce..."
            />
          </div>

          {/* BCC */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Skrytá kopie (BCC)</Label>
            <EmailTagList
              emails={bccEmails}
              onRemove={(e) => removeEmail(e, bccEmails, setBccEmails)}
              newEmail={newBccEmail}
              onNewEmailChange={setNewBccEmail}
              onAdd={() => addEmail(newBccEmail, bccEmails, setBccEmails, setNewBccEmail)}
              placeholder="Přidat BCC..."
            />
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Předmět emailu</Label>
            <Input
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Předmět emailu..."
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Obsah emailu</Label>
            <Textarea
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              rows={18}
              className="font-mono text-sm leading-relaxed"
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
            disabled={isSending || toEmails.length === 0 || !hasGmailScope}
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
