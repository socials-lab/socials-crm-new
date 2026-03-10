import { useState } from 'react';
import { Send, Plus, X, CheckCircle2, Calendar } from 'lucide-react';
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
import { useEmailTemplates } from '@/hooks/useEmailTemplates';
import { useAuth } from '@/hooks/useAuth';
import { useMeetingScheduleUrl } from '@/hooks/useMeetingScheduleUrl';
import { EmailCcBccFields } from '@/components/shared/EmailCcBccFields';

interface SendMeetingRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactName: string;
  contactEmail: string | null;
  companyName: string;
  leadId: string;
  onSent?: (emailData: { subject: string; body: string; recipients: string[] }) => void;
}

const DEFAULT_BCC = ['danny@socials.cz', 'dana.bauerova@socials.cz'];

export function SendMeetingRequestDialog({
  open,
  onOpenChange,
  contactName,
  contactEmail,
  companyName,
  leadId,
  onSent,
}: SendMeetingRequestDialogProps) {
  const { fillTemplate } = useEmailTemplates();
  const { meetingUrl } = useMeetingScheduleUrl();

  const getDefaults = () => {
    return fillTemplate('meeting_request', {
      company: companyName,
      name: contactName,
      meeting_url: meetingUrl || '',
    });
  };

  const [toEmails, setToEmails] = useState<string[]>(contactEmail ? [contactEmail] : []);
  const [newToEmail, setNewToEmail] = useState('');
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [bccEmails, setBccEmails] = useState<string[]>(DEFAULT_BCC);
  const [emailSubject, setEmailSubject] = useState(() => getDefaults().subject);
  const [emailContent, setEmailContent] = useState(() => getDefaults().body);
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

    setIsSending(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    onSent?.({
      subject: emailSubject,
      body: emailContent,
      recipients: toEmails,
    });
    setIsSending(false);
    toast.success('Žádost o schůzku byla odeslána');
    onOpenChange(false);
  };

  const handleMarkAsSent = () => {
    onSent?.({
      subject: emailSubject,
      body: emailContent,
      recipients: toEmails,
    });
    toast.success('Žádost o schůzku byla označena jako odeslaná');
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setToEmails(contactEmail ? [contactEmail] : []);
      setNewToEmail('');
      setCcEmails([]);
      setBccEmails(DEFAULT_BCC);
      const defaults = getDefaults();
      setEmailSubject(defaults.subject);
      setEmailContent(defaults.body);
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
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Žádost o schůzku
          </DialogTitle>
          <DialogDescription>
            Odešlete email s žádostí o online schůzku.
            {!meetingUrl && (
              <span className="block text-amber-600 mt-1">
                ⚠️ Nemáte nastavenou URL pro sjednání schůzky. Nastavte ji v Nastavení → Profil.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
              rows={14}
              className="font-mono text-sm leading-relaxed"
              placeholder="Text emailu..."
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
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
                Odeslat email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
