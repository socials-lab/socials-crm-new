import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Send, ScrollText, Plus, X, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useEmailTemplates } from '@/hooks/useEmailTemplates';
import { EmailCcBccFields } from '@/components/shared/EmailCcBccFields';
import type { Applicant } from '@/types/applicant';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

interface SendContractRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicant: Applicant;
  onSend: () => void;
}

const DEFAULT_TO = ['dana.bauerova@socials.cz'];
const DEFAULT_BCC = ['danny@socials.cz'];

export function SendContractRequestDialog({
  open,
  onOpenChange,
  applicant,
  onSend,
}: SendContractRequestDialogProps) {
  const { user } = useAuth();
  const { fillTemplate } = useEmailTemplates();
  const senderName = [user?.user_metadata?.first_name, user?.user_metadata?.last_name].filter(Boolean).join(' ') || 'Socials';

  const getDefaults = () => {
    const billingAddress =
      applicant.billing_street && applicant.billing_city
        ? `${applicant.billing_street}, ${applicant.billing_zip} ${applicant.billing_city}`
        : '—';

    return fillTemplate('contract_request', {
      full_name: applicant.full_name,
      email: applicant.email,
      personal_email: applicant.personal_email || '—',
      phone: applicant.phone || '—',
      birthday: applicant.birthday
        ? format(new Date(applicant.birthday), 'd. M. yyyy', { locale: cs })
        : '—',
      company_name: applicant.company_name || '—',
      ico: applicant.ico || '—',
      dic: applicant.dic || '—',
      billing_address: billingAddress,
      hourly_rate: applicant.hourly_rate ? `${applicant.hourly_rate} Kč/h` : '—',
      bank_account: applicant.bank_account || '—',
      position: applicant.position,
      sender: senderName,
    });
  };

  const [toEmails, setToEmails] = useState<string[]>([]);
  const [newToEmail, setNewToEmail] = useState('');
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [bccEmails, setBccEmails] = useState<string[]>(DEFAULT_BCC);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [isSending, setIsSending] = useState(false);

  if (open && !initialized && fillTemplate) {
    const defaults = getDefaults();
    setToEmails(DEFAULT_TO);
    setNewToEmail('');
    setCcEmails([]);
    setBccEmails(DEFAULT_BCC);
    setEmailSubject(defaults.subject);
    setEmailContent(defaults.body);
    setInitialized(true);
  }

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
    setIsSending(true);

    const ccParam = ccEmails.length > 0 ? `&cc=${ccEmails.join(',')}` : '';
    const bccParam = bccEmails.length > 0 ? `&bcc=${bccEmails.join(',')}` : '';
    const mailtoLink = `mailto:${toEmails.join(',')}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailContent)}${ccParam}${bccParam}`;
    window.open(mailtoLink, '_blank');

    await new Promise(resolve => setTimeout(resolve, 500));
    onSend();
    setIsSending(false);
    toast.success('Žádost o přípravu smlouvy byla odeslána');
    onOpenChange(false);
  };

  const handleMarkAsSent = () => {
    onSend();
    toast.success('Žádost o přípravu smlouvy byla označena jako odeslaná');
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      const defaults = getDefaults();
      setToEmails(DEFAULT_TO);
      setNewToEmail('');
      setCcEmails([]);
      setBccEmails(DEFAULT_BCC);
      setEmailSubject(defaults.subject);
      setEmailContent(defaults.body);
      setInitialized(true);
    } else {
      setInitialized(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            Tvorba smlouvy
          </DialogTitle>
          <DialogDescription>
            Interní email se souhrnem údajů pro přípravu smlouvy nového spolupracovníka.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* To */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Komu</Label>
            <div className="space-y-2">
              {toEmails.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {toEmails.map(email => (
                    <Badge key={email} variant="secondary" className="gap-1 pr-1 font-normal">
                      {email}
                      <button
                        type="button"
                        onClick={() => removeEmail(email, toEmails, setToEmails)}
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
                  value={newToEmail}
                  onChange={(e) => setNewToEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEmail(newToEmail, toEmails, setToEmails, setNewToEmail); } }}
                  placeholder="Přidat příjemce..."
                  className="text-sm"
                />
                <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => addEmail(newToEmail, toEmails, setToEmails, setNewToEmail)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* CC / BCC */}
          <EmailCcBccFields
            cc={ccEmails}
            onCcChange={setCcEmails}
            bcc={bccEmails}
            onBccChange={setBccEmails}
            defaultExpanded={true}
          />

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
              rows={16}
              className="font-mono text-sm leading-relaxed"
              placeholder="Text emailu..."
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Zrušit
          </Button>
          <Button
            variant="secondary"
            onClick={handleMarkAsSent}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Označit jako odeslané
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || toEmails.length === 0}
          >
            {isSending ? (
              <>
                <Send className="h-4 w-4 mr-2 animate-pulse" />
                Odesílám...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Otevřít v emailu
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}