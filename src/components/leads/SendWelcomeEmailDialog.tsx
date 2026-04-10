import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Copy, Check, Mail, Send, Users, Calendar, Sparkles } from 'lucide-react';
import type { Lead } from '@/types/crm';
import { useCRMData } from '@/hooks/useCRMData';
import { useAuth } from '@/hooks/useAuth';
import { EmailSignatureRichEditor } from '@/components/shared/EmailSignatureRichEditor';
import { invokeWithTimeout } from '@/lib/supabaseUtils';
import { inflectVocativeFullName } from '@/lib/emailSignature';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

interface SendWelcomeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  onMarkSent: () => void;
}

export function SendWelcomeEmailDialog({ open, onOpenChange, lead, onMarkSent }: SendWelcomeEmailDialogProps) {
  const { user } = useAuth();
  const { colleagues } = useCRMData();
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [mainContactName, setMainContactName] = useState('');

  const currentUserColleague = colleagues.find((c) => c.profile_id === user?.id);
  const normalize = (value: string | null | undefined) =>
    (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  const canSendFromCrm =
    normalize(currentUserColleague?.full_name) === normalize('Daniel Bauer') &&
    normalize(currentUserColleague?.email) === 'danny@socials.cz' &&
    normalize(currentUserColleague?.role) === 'admin';

  const services = lead.potential_services || [];

  const startDateFormatted = useMemo(() => {
    if (!lead.offer_created_at) return null;
    try {
      const offerDate = new Date(lead.offer_created_at);
      const approxStart = new Date(offerDate);
      approxStart.setDate(1);
      approxStart.setMonth(approxStart.getMonth() + 1);
      return format(approxStart, 'MMMM yyyy', { locale: cs });
    } catch {
      return null;
    }
  }, [lead.offer_created_at]);

  const contactFirstName = (lead.contact_name || '').trim().split(/\s+/).filter(Boolean)[0] || '';
  const contactNameVocative = inflectVocativeFullName(contactFirstName).trim();

  const emailHtml = useMemo(() => {
    const mainContactLine = mainContactName.trim()
      ? `Váš hlavní kontakt bude náš Meta Ads specialista <strong>${mainContactName.trim()}</strong>.`
      : 'Váš hlavní kontakt bude náš Meta Ads specialista <strong>[DOPLŇTE JMÉNO HLAVNÍHO KONTAKTU]</strong>.';

    return `
      <p>Dobrý den${contactNameVocative ? `, ${contactNameVocative}` : ''},</p>
      <p></p>
      <p>vítám vás mezi klienty Socials 🎉 a moc si vážím vaší důvěry. Vím, že výběr agentury není snadné rozhodnutí, a o to víc mě těší, že jste si vybrali právě nás. Smlouva je podepsaná, onboarding formulář vyplněn – můžeme se pustit do práce.</p>
      <p></p>
      <p><strong>Jak to bude probíhat:</strong></p>
      <p></p>
      <p>1. Založíme vám projekt ve Freelu a přidáme přístupy na e-maily z formuláře.</p>
      <p>2. Veškerá komunikace poběží přes Freelo – vše na jednom místě, nic se neztratí.</p>
      <p>3. Ozve se vám váš hlavní kontakt (Meta Ads specialista), doladí přístupy a domluví úvodní hovor. Projektový manažer zároveň pohlídá hladký onboarding.</p>
      <p>4. Můžeme se pustit do práce 🚀</p>
      <p></p>
      <p>${mainContactLine} Bude vás provázet denní komunikací i strategií kampaní. Projektový manažer bude k dispozici pro organizaci a onboarding.</p>
      <p></p>
      <p><strong>Ještě jedna důležitá věc</strong></p>
      <p>U nás ve firmě fungujeme na principu BUF – brutálně upřímný feedback. Znamená to, že vám vždy řekneme věci na rovinu, a totéž čekáme i od vás. Když vám něco nebude na spolupráci sedět, řekněte nám to narovinu. Jen tak se můžeme zlepšovat a poskytovat pro vás tu nejlepší službu. 🙂</p>
      <p></p>
      <p>Pokud budete cokoliv potřebovat, ozvěte se klidně přímo mně <a href="mailto:danny@socials.cz">danny@socials.cz</a> a nebo našemu COO Otakarovi - <a href="mailto:otas@socials.cz">otas@socials.cz</a></p>
      <p></p>
      <p>Těším se na spolupráci!</p>
      <p></p>
      <p>Přeji hezký den.</p>
      <p>Daniel Bauer<br />CEO @Socials</p>
    `;
  }, [contactNameVocative, mainContactName]);

  const [editableHtml, setEditableHtml] = useState(emailHtml);

  useEffect(() => {
    setEditableHtml(emailHtml);
  }, [emailHtml, open]);

  useEffect(() => {
    if (open) {
      setMainContactName('');
    }
  }, [open]);

  const htmlToPlainText = (html: string) => {
    const withBreaks = html
      .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6)>/gi, '\n\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/ul>/gi, '\n\n')
      .replace(/<\/ol>/gi, '\n\n');
    const stripped = withBreaks.replace(/<[^>]+>/g, '');
    return stripped
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+\n/g, '\n')
      .trim();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(htmlToPlainText(editableHtml));
      setCopied(true);
      toast.success('Zkopírováno do schránky');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Nepodařilo se zkopírovat');
    }
  };

  const recipientEmail = lead.contact_email || '';
  const subjectText = `Vítejte v Socials – ${lead.company_name}`;
  const subject = encodeURIComponent(`Vítejte v Socials – ${lead.company_name}`);
  const body = encodeURIComponent(htmlToPlainText(editableHtml));
  const mailtoLink = `mailto:${recipientEmail}?subject=${subject}&body=${body}`;

  const handleSendDirect = async () => {
    if (!canSendFromCrm) {
      toast.error('Tento e-mail může z CRM odeslat pouze Daniel Bauer (danny@socials.cz, admin).');
      return;
    }
    if (!mainContactName.trim()) {
      toast.error('Nejdřív doplňte hlavní kontakt pro klienta.');
      return;
    }
    if (!recipientEmail.trim()) {
      toast.error('Lead nemá vyplněný kontaktní e-mail');
      return;
    }
    if (!currentUserColleague?.email) {
      toast.error('Chybí informace o odesílateli (kolega/e-mail)');
      return;
    }

    setIsSending(true);
    try {
      const { error } = await invokeWithTimeout('send-email', {
        body: {
          to: recipientEmail.trim(),
          from: `${currentUserColleague.full_name} <${currentUserColleague.email}>`,
          subject: subjectText,
          html: `
            <style>
              p { margin: 0 0 12px 0; }
              ul, ol { margin: 0 0 12px 20px; padding: 0; }
              li { margin: 0 0 6px 0; }
            </style>
            <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; line-height: 1.6; color: #1f2937;">
              ${editableHtml}
            </div>
          `,
        },
      });

      if (error) throw error;

      onMarkSent();
      toast.success(`📧 Welcome e-mail odeslán na ${recipientEmail}`);
      onOpenChange(false);
    } catch (err: any) {
      console.error('Failed to send welcome email:', err);
      toast.error(err?.message || 'Nepodařilo se odeslat welcome e-mail');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Welcome e-mail
          </DialogTitle>
          <DialogDescription>
            Odešlete uvítací e-mail novému klientovi se souhrnem spolupráce.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipient */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Příjemce:</span>
            <Badge variant="secondary" className="font-mono">
              {recipientEmail || 'E-mail není vyplněn'}
            </Badge>
            <span className="text-muted-foreground">({lead.contact_name})</span>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-lg border bg-muted/30 text-center">
              <Sparkles className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-xs text-muted-foreground">Služby</p>
              <p className="text-sm font-semibold">{services.length}</p>
            </div>
            <div className="p-2.5 rounded-lg border bg-muted/30 text-center">
              <Users className="h-4 w-4 mx-auto mb-1 text-blue-600" />
              <p className="text-xs text-muted-foreground">Hlavní kontakt</p>
              <p className="text-sm font-semibold truncate">{mainContactName.trim() || 'Doplňte'}</p>
            </div>
            <div className="p-2.5 rounded-lg border bg-muted/30 text-center">
              <Calendar className="h-4 w-4 mx-auto mb-1 text-green-600" />
              <p className="text-xs text-muted-foreground">Start</p>
              <p className="text-sm font-semibold">{startDateFormatted || '—'}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium">Hlavní kontakt pro klienta (povinné)</p>
            <Input
              value={mainContactName}
              onChange={(e) => setMainContactName(e.target.value)}
              placeholder="Např. Jan Novák"
            />
          </div>

          {/* Sender */}
          <div className="p-2.5 rounded-lg border bg-primary/5 text-sm">
            <span className="text-muted-foreground">Odesílatel: </span>
            <span className="font-medium">{currentUserColleague?.full_name || 'Neznámý uživatel'}</span>
            {currentUserColleague?.position ? (
              <span className="text-muted-foreground"> ({currentUserColleague.position})</span>
            ) : null}
            {currentUserColleague?.email ? (
              <span className="text-muted-foreground"> — {currentUserColleague.email}</span>
            ) : null}
            {!canSendFromCrm ? (
              <div className="text-xs text-amber-700 mt-1">
                Tento e-mail může z CRM odeslat pouze Daniel Bauer (danny@socials.cz, admin).
              </div>
            ) : null}
          </div>

          {/* Editable email body */}
          <div>
            <EmailSignatureRichEditor
              value={editableHtml}
              onChange={setEditableHtml}
              placeholder="Napište welcome e-mail..."
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row sm:flex-wrap sm:justify-end gap-2">
          <Button variant="outline" onClick={handleCopy} className="gap-2 w-full sm:w-auto">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Zkopírováno' : 'Kopírovat text'}
          </Button>
          <Button variant="outline" asChild className="gap-2 w-full sm:w-auto">
            <a href={mailtoLink}>
              <Send className="h-4 w-4" />
              Otevřít v e-mailu
            </a>
          </Button>
          <Button
            onClick={() => { onMarkSent(); onOpenChange(false); }}
            disabled={!mainContactName.trim()}
            className="gap-2 w-full sm:w-auto"
          >
            <Check className="h-4 w-4" />
            Označit jako odeslaný
          </Button>
          <Button
            onClick={handleSendDirect}
            disabled={isSending || !recipientEmail.trim() || !currentUserColleague?.email || !canSendFromCrm}
            className="gap-2 w-full sm:w-auto"
          >
            <Send className="h-4 w-4" />
            {isSending ? 'Odesílám...' : 'Odeslat z CRM'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
