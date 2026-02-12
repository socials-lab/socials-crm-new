import { useState } from 'react';
import { Send, Plus, X } from 'lucide-react';
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
import { toast } from 'sonner';

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
  const getDefaultSubject = () => {
    return `Žádost o nasdílení přístupů - ${companyName} / Socials`;
  };

  const [toEmails, setToEmails] = useState<string[]>([]);
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
    if (!contactEmail && toEmails.length === 0) {
      toast.error('Zadejte alespoň jednoho příjemce');
      return;
    }

    setIsSending(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    onSent?.(['Google Analytics 4', 'Facebook Business Manager', 'Google Ads', 'S-klik']);
    setIsSending(false);
    toast.success('Žádost o přístupy byla odeslána');
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setToEmails([]);
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
          {/* To */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Komu</Label>
            {contactEmail && (
              <Badge variant="outline" className="font-normal">
                {contactName} ({contactEmail})
              </Badge>
            )}
            <EmailTagList
              emails={toEmails}
              onRemove={(e) => removeEmail(e, toEmails, setToEmails)}
              newEmail={newToEmail}
              onNewEmailChange={setNewToEmail}
              onAdd={() => addEmail(newToEmail, toEmails, setToEmails, setNewToEmail)}
              placeholder="Přidat dalšího příjemce..."
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
            disabled={isSending || (!contactEmail && toEmails.length === 0)}
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
