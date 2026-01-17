import { useState } from 'react';
import { Send, ExternalLink, Copy, Check } from 'lucide-react';
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
import { toast } from '@/components/ui/sonner';
import type { Lead } from '@/types/crm';

interface SendOnboardingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  onSent?: (formUrl: string) => void;
}

export function SendOnboardingFormDialog({
  open,
  onOpenChange,
  lead,
  onSent,
}: SendOnboardingFormDialogProps) {
  const [isSending, setIsSending] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // Generate unique form URL for this lead
  const formUrl = `https://crm.socials.cz/onboarding/${lead.id}`;
  
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
    if (!lead.contact_email) {
      toast.error('Kontakt nemá vyplněný email');
      return;
    }

    setIsSending(true);
    
    // Mock sending - will be replaced with actual Edge Function
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Notify parent about sent form
    onSent?.(formUrl);
    
    setIsSending(false);
    toast.success('Onboarding formulář byl odeslán');
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
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
            disabled={isSending || !lead.contact_email}
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
