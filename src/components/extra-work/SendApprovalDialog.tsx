import { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { EmailTagInput } from '@/components/ui/email-tag-input';
import { useCRMData } from '@/hooks/useCRMData';
import { useAuth } from '@/hooks/useAuth';
import { DEFAULT_GMAIL_BCC, useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { toast } from 'sonner';
import type { ExtraWork } from '@/types/crm';
import { Copy, Mail, CheckCircle2, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { formatEmailTextToHtml, getDefaultEmailSignature } from '@/lib/emailSignature';
import { useEmailTemplates } from '@/hooks/useEmailTemplates';

interface SendApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extraWork: ExtraWork;
  onUpdate?: (id: string, data: Partial<ExtraWork>) => Promise<void> | void;
}

export function SendApprovalDialog({ open, onOpenChange, extraWork, onUpdate }: SendApprovalDialogProps) {
  const { getClientById, clientContacts, colleagues, engagements } = useCRMData();
  const { user } = useAuth();
  const { sendEmail, hasGmailScope, isCheckingConnection, connectGoogleCalendar, isLoading: googleLoading } = useGoogleCalendar();
  const { fillTemplate } = useEmailTemplates();
  const [email, setEmail] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [bccEmails, setBccEmails] = useState<string[]>([DEFAULT_GMAIL_BCC]);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [approvalToken, setApprovalToken] = useState<string | null>(extraWork.approval_token || null);
  const [isPreparingApprovalLink, setIsPreparingApprovalLink] = useState(false);
  const [approvalLinkError, setApprovalLinkError] = useState<string | null>(null);
  const tokenPersistPromiseRef = useRef<Promise<string> | null>(null);

  const client = useMemo(() => getClientById(extraWork.client_id), [extraWork.client_id, getClientById]);
  const currentUserColleague = useMemo(() => colleagues.find(c => c.profile_id === user?.id), [colleagues, user?.id]);
  const colleague = useMemo(() => colleagues.find(c => c.id === extraWork.colleague_id), [extraWork.colleague_id, colleagues]);
  const engagement = useMemo(() => engagements.find(e => e.id === extraWork.engagement_id), [extraWork.engagement_id, engagements]);

  const clientName = client?.brand_name || client?.name || 'Klient';

  const defaultEmail = useMemo(() => {
    const contacts = clientContacts.filter(c => c.client_id === extraWork.client_id);
    const primary = contacts.find(c => c.is_primary);
    return primary?.email || contacts[0]?.email || client?.main_contact_email || '';
  }, [extraWork.client_id, clientContacts, client]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: extraWork.currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  const getApprovalUrl = () => {
    if (!approvalToken) return '';
    return `${window.location.origin}/extra-work-approval/${approvalToken}`;
  };

  const ensureApprovalToken = async (): Promise<string> => {
    if (approvalToken) return approvalToken;
    if (!onUpdate) {
      throw new Error('Missing update handler for approval token.');
    }

    if (tokenPersistPromiseRef.current) {
      return tokenPersistPromiseRef.current;
    }

    const token = crypto.randomUUID();
    // Optimistically set local token to prevent repeated update loops while mutation is in flight.
    setApprovalToken(token);

    const persistPromise = Promise.resolve(onUpdate(extraWork.id, { approval_token: token }))
      .then(() => token)
      .catch((error) => {
        setApprovalToken(null);
        throw error;
      })
      .finally(() => {
        tokenPersistPromiseRef.current = null;
      });

    tokenPersistPromiseRef.current = persistPromise;
    return persistPromise;
  };

  async function prepareApprovalToken() {
    setApprovalLinkError(null);
    setIsPreparingApprovalLink(true);
    try {
      await ensureApprovalToken();
    } catch (error) {
      console.error('Failed to initialize approval token:', error);
      setApprovalLinkError('Schvalovací odkaz se nepodařilo připravit.');
      toast.error('Nepodařilo se připravit schvalovací odkaz.');
    } finally {
      setIsPreparingApprovalLink(false);
    }
  }

  useEffect(() => {
    setApprovalToken(extraWork.approval_token || null);
  }, [extraWork.id, extraWork.approval_token]);

  const currentUserColleagueId = currentUserColleague?.id || '';
  const colleagueName = colleague?.full_name || '';
  const engagementName = engagement?.name || '';

  // Generate default email content
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const init = async () => {
      try {
        setApprovalLinkError(null);
        setIsPreparingApprovalLink(true);
        const token = await ensureApprovalToken();
        const approvalUrl = `${window.location.origin}/extra-work-approval/${token}`;

        if (cancelled) return;

        setCcEmails((prev) => (prev.length === 0 ? prev : []));
        setBccEmails((prev) => (prev.length === 1 && prev[0] === DEFAULT_GMAIL_BCC ? prev : [DEFAULT_GMAIL_BCC]));

        const hoursLine = extraWork.hours_worked && extraWork.hourly_rate
          ? `Rozsah: ${extraWork.hours_worked}h × ${extraWork.hourly_rate.toLocaleString('cs-CZ')} ${extraWork.currency}/h`
          : '';

        const signature = getDefaultEmailSignature(currentUserColleague, { fallbackName: 'Socials' });
        const { subject, body } = fillTemplate('send_approval', {
          work_name: extraWork.name,
          work_description: extraWork.description ? `Popis: ${extraWork.description}` : '',
          amount: formatCurrency(extraWork.amount),
          hours_line: hoursLine,
          engagement_line: engagementName ? `Zakázka: ${engagementName}` : '',
          colleague_line: colleagueName ? `Zpracoval/a: ${colleagueName}` : '',
          url: approvalUrl,
          signature,
        });

        if (!cancelled) {
          setEmailSubject((prev) => (prev === subject ? prev : subject));
          setEmailBody((prev) => (prev === body ? prev : body));
        }
      } catch (error) {
        console.error('Failed to initialize approval token:', error);
        if (!cancelled) {
          setApprovalLinkError('Schvalovací odkaz se nepodařilo připravit.');
        }
        toast.error('Nepodařilo se připravit schvalovací odkaz.');
      } finally {
        if (!cancelled) {
          setIsPreparingApprovalLink(false);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    extraWork.id,
    extraWork.name,
    extraWork.description,
    extraWork.amount,
    extraWork.currency,
    extraWork.hours_worked,
    extraWork.hourly_rate,
    currentUserColleagueId,
    colleagueName,
    engagementName,
    fillTemplate,
  ]);

  const handleCopyLink = async () => {
    try {
      setApprovalLinkError(null);
      const token = await ensureApprovalToken();
      const url = `${window.location.origin}/extra-work-approval/${token}`;
      navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      toast.success('Odkaz zkopírován do schránky');
    } catch (error) {
      console.error('Failed to copy approval link:', error);
      setApprovalLinkError('Schvalovací odkaz se nepodařilo připravit.');
      toast.error('Nepodařilo se připravit schvalovací odkaz.');
    }
  };

  const handleSendEmail = async () => {
    const targetEmail = email || defaultEmail;
    if (!targetEmail) {
      toast.error('Zadejte email');
      return;
    }

    if (!emailSubject.trim()) {
      toast.error('Předmět emailu nesmí být prázdný');
      return;
    }

    if (!hasGmailScope) {
      toast.error('Google účet není propojen. Propojte ho v nastavení profilu.');
      return;
    }

    setIsSending(true);

    try {
      const token = await ensureApprovalToken();
      const approvalUrl = `${window.location.origin}/extra-work-approval/${token}`;
      const bodyWithUrl = emailBody.includes('http') ? emailBody : `${emailBody}\n\n${approvalUrl}`;
      const htmlBody = formatEmailTextToHtml(bodyWithUrl);

      const result = await sendEmail(targetEmail, emailSubject, `<div style="font-family: sans-serif;">${htmlBody}</div>`, {
        cc: ccEmails.join(', '),
        bcc: bccEmails.join(', '),
      });

      if (result) {
        toast.success(`Email odeslán na ${targetEmail}`);
        onOpenChange(false);
      }
      // If result is null, sendEmail already showed an error toast
    } catch (error) {
      console.error('Failed to send email:', error);
      toast.error('Nepodařilo se odeslat email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Odeslat ke schválení</DialogTitle>
          <DialogDescription>
            Odešlete klientovi {clientName} žádost o schválení vícepráce "{extraWork.name}".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Summary */}
          <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vícepráce:</span>
              <span className="font-medium">{extraWork.name}</span>
            </div>
            {extraWork.hours_worked && extraWork.hourly_rate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rozsah:</span>
                <span>{extraWork.hours_worked}h × {extraWork.hourly_rate.toLocaleString('cs-CZ')} {extraWork.currency}/h</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Částka:</span>
              <span className="font-semibold">{formatCurrency(extraWork.amount)}</span>
            </div>
            {engagement && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Zakázka:</span>
                <span>{engagement.name}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Approval link */}
          <div className="space-y-2">
            <Label>Schvalovací odkaz</Label>
            <div className="flex flex-col sm:flex-row gap-2 min-w-0">
              <Input
                value={getApprovalUrl()}
                readOnly
                className="font-mono text-xs min-w-0 flex-1"
                placeholder={isPreparingApprovalLink ? 'Připravuji schvalovací odkaz...' : ''}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                title="Zkopírovat odkaz"
                className="shrink-0"
                disabled={isPreparingApprovalLink || !getApprovalUrl()}
              >
                {linkCopied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            {approvalLinkError && (
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-destructive">{approvalLinkError}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={prepareApprovalToken}
                  disabled={isPreparingApprovalLink}
                >
                  Zkusit znovu
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Tento odkaz můžete zkopírovat a poslat klientovi přímo, nebo použít email níže.
            </p>
          </div>

          <Separator />

          {/* Email form */}
          <div className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="email">Email příjemce</Label>
              <Input
                id="email"
                type="email"
                placeholder={defaultEmail || 'email@example.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {defaultEmail && !email && (
                <p className="text-xs text-muted-foreground">
                  Výchozí kontakt: {defaultEmail}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="cc">CC</Label>
                <EmailTagInput
                  value={ccEmails}
                  onChange={setCcEmails}
                  placeholder="oddeleni@firma.cz"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bcc">BCC</Label>
                <EmailTagInput
                  value={bccEmails}
                  onChange={setBccEmails}
                  placeholder="danny@socials.cz"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="subject">Předmět</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="h-8"
                >
                  {showPreview ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                  {showPreview ? 'Skrýt' : 'Náhled'}
                </Button>
              </div>
              <Input
                id="subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>

            {showPreview ? (
              <div className="space-y-2">
                <Label>Náhled emailu</Label>
                <div className="bg-white border rounded-lg p-4 text-sm whitespace-pre-wrap">
                  {emailBody}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="body">Text emailu</Label>
                <Textarea
                  id="body"
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button onClick={handleSendEmail} disabled={isSending || !hasGmailScope}>
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Odesílám...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Odeslat email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
