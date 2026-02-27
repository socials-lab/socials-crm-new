import { useState, useMemo, useEffect } from 'react';
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
import { Copy, Mail, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { getDefaultEmailSignature } from '@/lib/emailSignature';

interface SendApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extraWork: ExtraWork;
  onUpdate?: (id: string, data: Partial<ExtraWork>) => void;
}

export function SendApprovalDialog({ open, onOpenChange, extraWork, onUpdate }: SendApprovalDialogProps) {
  const { getClientById, clientContacts, colleagues, engagements } = useCRMData();
  const { user } = useAuth();
  const { sendEmail, isConnected } = useGoogleCalendar();
  const [email, setEmail] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [bccEmails, setBccEmails] = useState<string[]>([DEFAULT_GMAIL_BCC]);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSending, setIsSending] = useState(false);

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
    new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: extraWork.currency || 'CZK', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  const getApprovalUrl = () => {
    if (!extraWork.approval_token) return '';
    return `${window.location.origin}/extra-work-approval/${extraWork.approval_token}`;
  };

  // Generate default email content
  useEffect(() => {
    if (open) {
      const approvalUrl = getApprovalUrl();

      setCcEmails([]);
      setBccEmails([DEFAULT_GMAIL_BCC]);
      setEmailSubject(`Schválení vícepráce: ${extraWork.name}`);

      const hoursLine = extraWork.hours_worked && extraWork.hourly_rate
        ? `\nRozsah: ${extraWork.hours_worked}h × ${extraWork.hourly_rate.toLocaleString('cs-CZ')} ${extraWork.currency || 'CZK'}/h`
        : '';

      const signature = getDefaultEmailSignature(currentUserColleague, { fallbackName: 'Socials' });

      setEmailBody(
        `Dobrý den,\n\nrádi bychom Vás požádali o schválení následující vícepráce:\n\nNázev: ${extraWork.name}` +
        (extraWork.description ? `\nPopis: ${extraWork.description}` : '') +
        hoursLine +
        `\nCelková částka: ${formatCurrency(extraWork.amount)}` +
        (engagement ? `\nZakázka: ${engagement.name}` : '') +
        (colleague ? `\nZpracoval/a: ${colleague.full_name}` : '') +
        `\n\nPro schválení nebo zamítnutí klikněte na odkaz níže:\n${approvalUrl}` +
        `\n\n${signature}`
      );
    }
  }, [open, extraWork.id, extraWork.approval_token, currentUserColleague, colleague, engagement]);

  const handleCopyLink = () => {
    const url = getApprovalUrl();
    if (!url) {
      toast.error('Chybí schvalovací token');
      return;
    }
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
    toast.success('Odkaz zkopírován do schránky');
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

    if (!isConnected) {
      toast.error('Google účet není propojen. Propojte ho v nastavení profilu.');
      return;
    }

    setIsSending(true);

    try {
      // Convert plain text to HTML
      const htmlBody = emailBody
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>')
        .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>');

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
            <div className="flex gap-2">
              <Input
                value={getApprovalUrl()}
                readOnly
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                title="Zkopírovat odkaz"
              >
                {linkCopied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Tento odkaz můžete zkopírovat a poslat klientovi přímo, nebo použít email níže.
            </p>
          </div>

          <Separator />

          {/* Email form */}
          <div className="space-y-4">
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
          <Button onClick={handleSendEmail} disabled={isSending || !isConnected}>
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
