import { useState } from 'react';
import { Send, ExternalLink, Copy, Check, AlertCircle, Plus, X } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/sonner';
import { DEFAULT_GMAIL_BCC, useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import type { Lead } from '@/types/crm';

interface SendOnboardingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  onSent?: (formUrl: string) => void;
}

function EmailTagList({
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
}

export function SendOnboardingFormDialog({
  open,
  onOpenChange,
  lead,
  onSent,
}: SendOnboardingFormDialogProps) {
  const { hasGmailScope, isCheckingConnection, connectGoogleCalendar, sendEmail, isLoading: googleLoading } = useGoogleCalendar();
  const [isSending, setIsSending] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // Generate unique form URL for this lead
  const formUrl = `${window.location.origin}/onboarding/${lead.id}`;
  
  const cleanWebsite = (website: string | null) => {
    if (!website) return '';
    return website
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
  };

  const getDefaultSubject = () => {
    const domain = lead.website ? cleanWebsite(lead.website) : lead.company_name;
    return `Onboarding formulář - ${domain} / Socials`;
  };

  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [newCcEmail, setNewCcEmail] = useState('');
  const [bccEmails, setBccEmails] = useState<string[]>([DEFAULT_GMAIL_BCC]);
  const [newBccEmail, setNewBccEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState(getDefaultSubject());
  const [emailContent, setEmailContent] = useState(() => generateDefaultEmail());

  function generateDefaultEmail() {
    return `Dobrý den ${lead.contact_name},

děkujeme za Váš zájem o spolupráci s agenturou Socials.

Pro zahájení spolupráce prosím vyplňte náš onboarding formulář, kde doplníte potřebné údaje pro nastavení služeb a fakturaci.

Formulář je předvyplněný údaji, které již o Vás máme. Prosím zkontrolujte je a případně upravte nebo doplňte.

👉 Odkaz na formulář: ${formUrl}

Po vyplnění formuláře Vás budeme kontaktovat s dalšími kroky.

Děkujeme,
Tým Socials`;
  }

  const parseEmails = (value: string) =>
    value
      .split(/[\n,;]+/)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);

  const mergeEmails = (base: string[], pending: string) => {
    const merged = [...base];
    for (const email of parseEmails(pending)) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
      if (!merged.includes(email)) merged.push(email);
    }
    return merged;
  };

  const addEmail = (
    email: string,
    list: string[],
    setList: (v: string[]) => void,
    setInput: (v: string) => void
  ) => {
    const candidates = parseEmails(email);
    if (candidates.length === 0) return;

    const next = [...list];
    let hasInvalid = false;

    for (const candidate of candidates) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)) {
        hasInvalid = true;
        continue;
      }
      if (!next.includes(candidate)) {
        next.push(candidate);
      }
    }

    if (hasInvalid) {
      toast.error('Některé emaily nejsou platné');
    }

    setList(next);
    setInput('');
  };

  const removeEmail = (email: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.filter(e => e !== email));
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(formUrl);
      setIsCopied(true);
      toast.success('Odkaz zkopírován');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error('Nepodařilo se zkopírovat odkaz');
    }
  };

  const handleSend = async () => {
    if (!lead.contact_email?.trim()) {
      toast.error('Kontakt nemá vyplněný email');
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
          // Empty line - end current paragraph
          if (currentParagraph.length > 0) {
            htmlParts.push(`<p style="margin: 0 0 16px 0;">${currentParagraph.join('<br>')}</p>`);
            currentParagraph = [];
          }
        } else if (trimmed.includes('👉')) {
          // Special emoji line - flush paragraph first
          if (currentParagraph.length > 0) {
            htmlParts.push(`<p style="margin: 0 0 16px 0;">${currentParagraph.join('<br>')}</p>`);
            currentParagraph = [];
          }
          // Convert URLs to clickable links
          const withLinks = trimmed.replace(
            /(https?:\/\/[^\s]+)/g,
            '<a href="$1" style="color: #0066cc; text-decoration: underline;">$1</a>'
          );
          htmlParts.push(`<p style="margin: 16px 0; font-weight: bold;">${withLinks}</p>`);
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

      const finalCcEmails = mergeEmails(ccEmails, newCcEmail);
      const finalBccEmails = mergeEmails(bccEmails, newBccEmail);

      const result = await sendEmail(lead.contact_email.trim(), emailSubject, html, {
        cc: finalCcEmails.join(', '),
        bcc: finalBccEmails.join(', '),
      });
      
      if (result) {
        // Notify parent about sent form
        onSent?.(formUrl);
        toast.success('Onboarding formulář byl odeslán');
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
      setNewCcEmail('');
      setBccEmails([DEFAULT_GMAIL_BCC]);
      setNewBccEmail('');
      setEmailSubject(getDefaultSubject());
      setEmailContent(generateDefaultEmail());
      setIsCopied(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>📋 Odeslat onboarding formulář</DialogTitle>
          <DialogDescription>
            Odešlete klientovi předvyplněný formulář pro vyplnění údajů potřebných k onboardingu.
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
          {/* Form URL */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Odkaz na formulář</Label>
            <div className="flex gap-2">
              <Input
                value={formUrl}
                readOnly
                className="flex-1 text-sm font-mono bg-muted/50"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {isCopied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open(formUrl, '_blank')}
                className="shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Formulář je unikátní pro tohoto klienta a obsahuje předvyplněné údaje z leadu.
            </p>
          </div>

          {/* Prefilled Data Preview */}
          <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
            <Label className="text-xs text-muted-foreground">Předvyplněné údaje:</Label>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs">
              <div>
                <span className="text-muted-foreground">Společnost:</span>{' '}
                <span className="font-medium">{lead.company_name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">IČO:</span>{' '}
                <span className="font-medium">{lead.ico}</span>
              </div>
              {lead.dic && (
                <div>
                  <span className="text-muted-foreground">DIČ:</span>{' '}
                  <span className="font-medium">{lead.dic}</span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Kontakt:</span>{' '}
                <span className="font-medium">{lead.contact_name}</span>
              </div>
              {lead.contact_email && (
                <div>
                  <span className="text-muted-foreground">Email:</span>{' '}
                  <span className="font-medium">{lead.contact_email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Recipient Info */}
          <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Příjemce:</span>
              <span className="font-medium">{lead.contact_name}</span>
              {lead.contact_email ? (
                <span className="text-muted-foreground">({lead.contact_email})</span>
              ) : (
                <span className="text-amber-600">(chybí email!)</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">CC</Label>
              <EmailTagList
                emails={ccEmails}
                onRemove={(e) => removeEmail(e, ccEmails, setCcEmails)}
                newEmail={newCcEmail}
                onNewEmailChange={setNewCcEmail}
                onAdd={() => addEmail(newCcEmail, ccEmails, setCcEmails, setNewCcEmail)}
                placeholder="Přidat CC..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">BCC</Label>
              <EmailTagList
                emails={bccEmails}
                onRemove={(e) => removeEmail(e, bccEmails, setBccEmails)}
                newEmail={newBccEmail}
                onNewEmailChange={setNewBccEmail}
                onAdd={() => addEmail(newBccEmail, bccEmails, setBccEmails, setNewBccEmail)}
                placeholder="Přidat BCC..."
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
              rows={8}
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
            disabled={isSending || !lead.contact_email || !hasGmailScope}
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
