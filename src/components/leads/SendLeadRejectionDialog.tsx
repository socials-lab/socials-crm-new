import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Send, UserX } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmailSignatureRichEditor } from '@/components/shared/EmailSignatureRichEditor';
import { useEmailTemplates } from '@/hooks/useEmailTemplates';
import { useAuth } from '@/hooks/useAuth';
import { useCRMData } from '@/hooks/useCRMData';
import { EmailCcBccFields } from '@/components/shared/EmailCcBccFields';
import { EmailSenderInfo } from '@/components/shared/EmailSenderInfo';
import { DEFAULT_GMAIL_BCC, useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import {
  getDefaultEmailSignature,
  inflectVocativeFullName,
  signatureHtmlToStoredText,
  signatureTextToEditableHtml,
} from '@/lib/emailSignature';
import { toast } from 'sonner';

interface SendLeadRejectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactName: string;
  contactEmail: string | null;
  companyName: string;
  leadId: string;
  onSent?: (emailData?: { subject: string; body: string; recipients: string[] }) => void;
}

const DEFAULT_BCC = [DEFAULT_GMAIL_BCC];

export function SendLeadRejectionDialog({
  open,
  onOpenChange,
  contactName,
  contactEmail,
  companyName,
  leadId,
  onSent,
}: SendLeadRejectionDialogProps) {
  const { fillTemplate } = useEmailTemplates();
  const { user } = useAuth();
  const { colleagues } = useCRMData();
  const { hasGmailScope, isCheckingConnection, connectGoogleCalendar, sendEmail, isLoading: googleLoading } = useGoogleCalendar();
  const currentUserColleague = colleagues.find((colleague) => colleague.profile_id === user?.id);
  const firstName = (contactName || '').trim().split(/\s+/).filter(Boolean)[0] || '';
  const inferVenovalVariant = (name: string): 'věnoval' | 'věnovala' | 'věnoval/a' => {
    const normalized = (name || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();

    if (!normalized) return 'věnoval/a';

    const masculineExceptionsEndingWithA = new Set([
      'kuba', 'jakuba', 'jarda', 'misa', 'sasa', 'nikola', 'luka', 'ondra', 'jura',
    ]);
    if (masculineExceptionsEndingWithA.has(normalized)) return 'věnoval';

    if (normalized.endsWith('a')) return 'věnovala';
    return 'věnoval';
  };
  const venovalVariant = inferVenovalVariant(firstName);
  const defaults = useMemo(() => {
    const filled = fillTemplate('lead_rejection', {
      company: companyName,
      name: inflectVocativeFullName(firstName),
      signature: getDefaultEmailSignature(currentUserColleague, { fallbackName: 'Tým Socials' }),
    });
    return {
      ...filled,
      body: filled.body.replaceAll('věnoval/a', venovalVariant),
    };
  }, [fillTemplate, companyName, firstName, currentUserColleague, venovalVariant]);

  const [recipientEmail, setRecipientEmail] = useState(contactEmail || '');
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [bccEmails, setBccEmails] = useState<string[]>(DEFAULT_BCC);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContentHtml, setEmailContentHtml] = useState('<p></p>');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRecipientEmail(contactEmail || '');
    setCcEmails([]);
    setBccEmails(DEFAULT_BCC);
    setEmailSubject(defaults.subject);
    setEmailContentHtml(signatureTextToEditableHtml(defaults.body));
  }, [open, contactEmail, defaults.subject, defaults.body]);

  const handleSend = async () => {
    if (!recipientEmail.trim()) {
      toast.error('Zadejte e-mail příjemce');
      return;
    }
    if (!hasGmailScope) {
      toast.error('Pro odesílání emailů je potřeba propojit Google účet s oprávněním pro Gmail');
      return;
    }
    setIsSending(true);
    try {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
          ${emailContentHtml}
        </div>
      `;

      const result = await sendEmail(recipientEmail.trim(), emailSubject, html, {
        cc: ccEmails.join(', '),
        bcc: bccEmails.join(', '),
        leadId,
      });

      if (!result) throw new Error('Odeslání emailu selhalo');

      onSent?.({
        subject: emailSubject,
        body: signatureHtmlToStoredText(emailContentHtml),
        recipients: [recipientEmail.trim()],
      });
      toast.success('Odmítací email byl odeslán');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to send lead rejection email:', error);
      toast.error('Nepodařilo se odeslat odmítací email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5" />
            Slušně odmítnout lead
          </DialogTitle>
          <DialogDescription>
            Odešlete odmítací email a lead následně přesuňte do stavu Bad Fit.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isCheckingConnection && !hasGmailScope && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  Pro odesílání emailů je potřeba propojit Google účet
                </p>
                <Button variant="outline" size="sm" className="mt-2" onClick={connectGoogleCalendar} disabled={googleLoading}>
                  Propojit Google účet
                </Button>
              </div>
            </div>
          )}

          <EmailSenderInfo colleague={currentUserColleague} />

          <div className="space-y-2">
            <Label className="text-sm font-medium">Příjemce</Label>
            <Input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="email@firma.cz"
            />
          </div>

          <EmailCcBccFields cc={ccEmails} onCcChange={setCcEmails} bcc={bccEmails} onBccChange={setBccEmails} />

          <div className="space-y-2">
            <Label className="text-sm font-medium">Předmět</Label>
            <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Obsah emailu</Label>
            <EmailSignatureRichEditor
              value={emailContentHtml}
              onChange={setEmailContentHtml}
              placeholder="Napište obsah odmítacího e-mailu..."
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button onClick={handleSend} disabled={isSending || !recipientEmail.trim() || !hasGmailScope}>
            <Send className="h-4 w-4 mr-2" />
            {isSending ? 'Odesílám...' : 'Odeslat email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

