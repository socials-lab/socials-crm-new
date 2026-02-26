import { useState, useEffect } from 'react';
import { Send, User, Mail, Building2, ExternalLink, AlertCircle } from 'lucide-react';
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
import { EmailTagInput } from '@/components/ui/email-tag-input';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/hooks/useAuth';
import { DEFAULT_GMAIL_BCC, useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useCRMData } from '@/hooks/useCRMData';
import type { Lead } from '@/types/crm';

interface SendOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  onSent?: (ownerId: string) => void;
}

export function SendOfferDialog({
  open,
  onOpenChange,
  lead,
  onSent,
}: SendOfferDialogProps) {
  const { user } = useAuth();
  const { colleagues } = useCRMData();
  const { hasGmailScope, isCheckingConnection, connectGoogleCalendar, sendEmail, isLoading: googleLoading } = useGoogleCalendar();
  
  const cleanWebsite = (website: string | null) => {
    if (!website) return '';
    return website
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
  };

  const getDefaultSubject = () => {
    const domain = lead.website ? cleanWebsite(lead.website) : lead.company_name;
    return `Nabídka spolupráce - ${domain} / Socials`;
  };

  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [bccEmails, setBccEmails] = useState<string[]>([DEFAULT_GMAIL_BCC]);
  const [emailSubject, setEmailSubject] = useState(getDefaultSubject());
  const [emailContent, setEmailContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Get current user's colleague record
  const currentUserColleague = colleagues.find(c => c.profile_id === user?.id);

  // Generate email content when dialog opens or lead changes
  useEffect(() => {
    if (!currentUserColleague || !open) return;
    
    const servicesText = lead.potential_services && lead.potential_services.length > 0
      ? lead.potential_services.map(s => {
          const tierText = s.selected_tier ? ` (${s.selected_tier.toUpperCase()})` : '';
          const billingText = s.billing_type === 'monthly' ? '/měs' : ' jednorázově';
          return `  • ${s.name}${tierText}: ${s.price.toLocaleString()} ${s.currency}${billingText}`;
        }).join('\n')
      : '  (žádné služby v nabídce)';

    const hasServices = lead.potential_services && lead.potential_services.length > 0;
    const totalPrice = hasServices
      ? lead.potential_services.reduce((sum, s) => sum + s.price, 0)
      : 0;
    const hasMonthlyServices = hasServices && lead.potential_services.some(s => s.billing_type === 'monthly');

    const priceText = hasServices
      ? `Celková cena: ${totalPrice.toLocaleString()} ${lead.currency}${hasMonthlyServices ? '/měs' : ''}`
      : 'Cena bude stanovena na základě detailní nabídky.';

    setEmailContent(`Dobrý den ${lead.contact_name},

děkuji za náš nedávný rozhovor ohledně spolupráce se společností ${lead.company_name}.

Na základě našeho jednání jsem pro Vás připravil/a nabídku:

${servicesText}

${priceText}

${lead.offer_url ? `Detailní nabídku naleznete zde: ${lead.offer_url}` : ''}

Budu rád/a, když se mi ozvete s případnými dotazy.

S pozdravem,
${currentUserColleague.full_name}
${currentUserColleague.position}
${currentUserColleague.email}
${currentUserColleague.phone || ''}`);
  }, [currentUserColleague, lead, open]);

  const handleSend = async () => {
    if (!lead.contact_email?.trim()) {
      toast.error('Kontakt nemá vyplněný email');
      return;
    }

    if (!hasGmailScope) {
      toast.error('Pro odesílání emailů je potřeba propojit Google účet s oprávněním pro Gmail');
      return;
    }

    if (!currentUserColleague) {
      toast.error('Nepodařilo se zjistit vaše údaje');
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
          // Empty line - end current paragraph
          if (currentParagraph.length > 0) {
            htmlParts.push(`<p style="margin: 0 0 16px 0;">${currentParagraph.join('<br>')}</p>`);
            currentParagraph = [];
          }
        } else if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.match(/^\d+\./)) {
          // List item - flush paragraph first
          if (currentParagraph.length > 0) {
            htmlParts.push(`<p style="margin: 0 0 16px 0;">${currentParagraph.join('<br>')}</p>`);
            currentParagraph = [];
          }
          htmlParts.push(`<p style="margin: 0 0 8px 0; padding-left: 20px;">${trimmed}</p>`);
        } else {
          // Regular line - add to current paragraph
          currentParagraph.push(trimmed);
        }
      }
      
      // Flush remaining paragraph
      if (currentParagraph.length > 0) {
        htmlParts.push(`<p style="margin: 0 0 16px 0;">${currentParagraph.join('<br>')}</p>`);
      }

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
          ${htmlParts.join('')}
        </div>
      `;

      const result = await sendEmail(lead.contact_email.trim(), emailSubject, html, {
        cc: ccEmails.join(', '),
        bcc: bccEmails.join(', '),
      });
      
      if (result) {
        onSent?.(lead.owner_id);
        toast.success('📤 Nabídka byla odeslána!');
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
      setCcEmails([]);
      setBccEmails([DEFAULT_GMAIL_BCC]);
      setEmailSubject(getDefaultSubject());
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>📤 Odeslat nabídku</DialogTitle>
          <DialogDescription>
            Nabídka bude odeslána kontaktní osobě z vašeho Google účtu.
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

          {/* Sender Info Card */}
          {currentUserColleague && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-primary" />
                <span className="font-medium">{currentUserColleague.full_name}</span>
                <span className="text-muted-foreground">– {currentUserColleague.position}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{currentUserColleague.email}</span>
              </div>
              {currentUserColleague.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="ml-6">{currentUserColleague.phone}</span>
                </div>
              )}
            </div>
          )}

          {/* Recipient Info */}
          <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{lead.company_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{lead.contact_name}</span>
              {lead.contact_email && (
                <span className="text-muted-foreground">({lead.contact_email})</span>
              )}
            </div>
            {lead.offer_url && (
              <a 
                href={lead.offer_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Nabídka v Notion</span>
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">CC</Label>
              <EmailTagInput
                value={ccEmails}
                onChange={setCcEmails}
                placeholder="oddeleni@firma.cz"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">BCC</Label>
              <EmailTagInput
                value={bccEmails}
                onChange={setBccEmails}
                placeholder="danny@socials.cz"
              />
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
              rows={12}
              className="font-mono text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !lead.contact_email || !hasGmailScope || !currentUserColleague}
          >
            {isSending ? (
              <>
                <Send className="h-4 w-4 mr-2 animate-pulse" />
                Odesílám...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Odeslat nabídku
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
