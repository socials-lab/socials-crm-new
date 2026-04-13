import { useEffect, useMemo, useState } from 'react';
import { Send, Plus, X, Calendar, AlertCircle } from 'lucide-react';
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
import { useCRMData } from '@/hooks/useCRMData';
import { useMeetingScheduleUrl } from '@/hooks/useMeetingScheduleUrl';
import { EmailCcBccFields } from '@/components/shared/EmailCcBccFields';
import { EmailSenderInfo } from '@/components/shared/EmailSenderInfo';
import { DEFAULT_GMAIL_BCC, useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { formatEmailTextToHtml, getDefaultEmailSignature, inflectVocativeFullName } from '@/lib/emailSignature';

interface SendMeetingRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactName: string;
  contactEmail: string | null;
  companyName: string;
  leadId: string;
  onSent?: () => void;
}

const DEFAULT_BCC = [DEFAULT_GMAIL_BCC, 'dana.bauerova@socials.cz'];

function EmailTagList({
  emails,
  onRemove,
  newEmail,
  onNewEmailChange,
  onAdd,
  placeholder,
}: {
  emails: string[];
  onRemove: (email: string) => void;
  newEmail: string;
  onNewEmailChange: (value: string) => void;
  onAdd: () => void;
  placeholder: string;
}) {
  return (
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
          onChange={(event) => onNewEmailChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onAdd();
            }
          }}
          placeholder={placeholder}
          className="text-sm"
        />
        <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={onAdd}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

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
  const { user } = useAuth();
  const { colleagues } = useCRMData();
  const { hasGmailScope, isCheckingConnection, connectGoogleCalendar, sendEmail, isLoading: googleLoading } = useGoogleCalendar();
  const { meetingUrl } = useMeetingScheduleUrl();
  const currentUserColleague = colleagues.find((colleague) => colleague.profile_id === user?.id);

  const defaults = useMemo(() => {
    return fillTemplate('meeting_request', {
      company: companyName,
      name: inflectVocativeFullName(contactName),
      meeting_url: meetingUrl || '',
      signature: getDefaultEmailSignature(currentUserColleague, { fallbackName: 'Tým Socials' }),
    });
  }, [fillTemplate, companyName, contactName, meetingUrl, currentUserColleague]);

  const [toEmails, setToEmails] = useState<string[]>(contactEmail ? [contactEmail] : []);
  const [newToEmail, setNewToEmail] = useState('');
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [bccEmails, setBccEmails] = useState<string[]>(DEFAULT_BCC);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEmailSubject(defaults.subject);
    setEmailContent(defaults.body);
  }, [open, defaults.subject, defaults.body]);

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

    if (!meetingUrl || !meetingUrl.trim()) {
      toast.error('Chybí URL pro sjednání schůzky. Nastavte ji v Nastavení -> Profil.');
      return;
    }

    setIsSending(true);

    try {
      const htmlContent = formatEmailTextToHtml(emailContent);
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
          ${htmlContent}
        </div>
      `;

      const result = await sendEmail(toEmails.join(', '), emailSubject, html, {
        cc: ccEmails.join(', '),
        bcc: bccEmails.join(', '),
        leadId: leadId,
      });

      if (!result) {
        throw new Error('Odeslání emailu selhalo');
      }

      onSent?.();
      toast.success('Žádost o schůzku byla odeslána');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to send meeting request email:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setToEmails(contactEmail ? [contactEmail] : []);
      setNewToEmail('');
      setCcEmails([]);
      setBccEmails(DEFAULT_BCC);
      setEmailSubject(defaults.subject);
      setEmailContent(defaults.body);
    }
    onOpenChange(newOpen);
  };

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

          <EmailSenderInfo colleague={currentUserColleague} />

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
            onClick={handleSend}
            disabled={isSending || toEmails.length === 0 || !hasGmailScope || !meetingUrl || !meetingUrl.trim()}
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
