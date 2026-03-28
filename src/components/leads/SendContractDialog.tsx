import { useState } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { FileSignature, Copy, Check, Building2, Hash, Mail, MapPin, Package, Code, ChevronDown, ChevronUp, FileText, ExternalLink } from 'lucide-react';
import type { Lead, LeadService } from '@/types/crm';
import { toast } from 'sonner';

interface SendContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  onSend: (data: {
    contract_url: string;
    digisign_envelope_id: string | null;
    digisign_document_url: string | null;
    contract_sent_at: string;
  }) => void;
}

export function SendContractDialog({ open, onOpenChange, lead, onSend }: SendContractDialogProps) {
  const [copied, setCopied] = useState(false);
  const [showPayload, setShowPayload] = useState(false);

  const leadServices: LeadService[] = Array.isArray(lead.potential_services) ? lead.potential_services : [];
  const monthlyServices = leadServices.filter(s => (s.billing_type || 'monthly') === 'monthly');
  const oneOffServices = leadServices.filter(s => s.billing_type === 'one_off');
  const monthlyTotal = monthlyServices.reduce((sum, s) => sum + (s.price || 0), 0);
  const oneOffTotal = oneOffServices.reduce((sum, s) => sum + (s.price || 0), 0);
  const currency = lead.currency || 'CZK';

  // Build DigiSign API payload
  const digisignPayload = {
    envelope: {
      email_subject: `Smlouva o spolupráci — ${lead.company_name}`,
      email_body: `Dobrý den,\n\nv příloze zasíláme smlouvu o spolupráci k podpisu.\n\nDěkujeme,\nTým Socials`,
      signers: [
        {
          name: lead.contact_name,
          email: lead.contact_email || lead.billing_email,
          role: 'signer',
          order: 1,
        },
      ],
      document: {
        name: `Smlouva_${lead.company_name.replace(/\s+/g, '_')}.pdf`,
      },
      metadata: {
        lead_id: lead.id,
        company_name: lead.company_name,
        ico: lead.ico,
        dic: lead.dic,
      },
    },
    contract_data: {
      client: {
        company_name: lead.company_name,
        ico: lead.ico || null,
        dic: lead.dic || null,
        billing_street: lead.billing_street || null,
        billing_city: lead.billing_city || null,
        billing_zip: lead.billing_zip || null,
        billing_country: lead.billing_country || null,
        billing_email: lead.billing_email || null,
        contact_name: lead.contact_name,
        contact_email: lead.contact_email || null,
        contact_phone: lead.contact_phone || null,
      },
      services: leadServices.map(svc => ({
        name: svc.name,
        tier: svc.selected_tier || null,
        price: svc.price || 0,
        currency: svc.currency || currency,
        billing_type: svc.billing_type || 'monthly',
      })),
      pricing: {
        monthly_total: monthlyTotal,
        one_off_total: oneOffTotal,
        currency,
      },
      offer_type: lead.offer_type || 'retainer',
    },
  };

  const payloadJson = JSON.stringify(digisignPayload, null, 2);

  const hasMissingData = !lead.billing_street || !lead.billing_city || !lead.contact_email;

  const handleCopyPayload = async () => {
    await navigator.clipboard.writeText(payloadJson);
    setCopied(true);
    toast.success('Payload zkopírován');
    setTimeout(() => setCopied(false), 2000);
  };

  // Build Google Docs content for pre-filled contract
  const buildGoogleDocsContent = () => {
    const billingAddress = [lead.billing_street, lead.billing_city, lead.billing_zip, lead.billing_country].filter(Boolean).join(', ');
    
    let content = `SMLOUVA O SPOLUPRÁCI\n\n`;
    content += `1. SMLUVNÍ STRANY\n\n`;
    content += `Objednatel:\n`;
    content += `${lead.company_name}\n`;
    if (lead.ico) content += `IČO: ${lead.ico}\n`;
    if (lead.dic) content += `DIČ: ${lead.dic}\n`;
    if (billingAddress) content += `Sídlo: ${billingAddress}\n`;
    content += `Kontaktní osoba: ${lead.contact_name}\n`;
    if (lead.contact_email) content += `E-mail: ${lead.contact_email}\n`;
    if (lead.contact_phone) content += `Tel: ${lead.contact_phone}\n`;
    if (lead.billing_email) content += `Fakturační e-mail: ${lead.billing_email}\n`;
    content += `\n`;
    content += `Poskytovatel:\n`;
    content += `[DOPLNIT ÚDAJE POSKYTOVATELE]\n\n`;
    content += `2. PŘEDMĚT SMLOUVY\n\n`;
    
    if (leadServices.length > 0) {
      leadServices.forEach((svc, idx) => {
        const tierLabel = svc.selected_tier ? ` (${svc.selected_tier.toUpperCase()})` : '';
        const priceLabel = `${(svc.price || 0).toLocaleString('cs-CZ')} ${svc.currency || currency}`;
        const billingLabel = (svc.billing_type || 'monthly') === 'monthly' ? '/měs' : ' jednorázově';
        content += `${idx + 1}. ${svc.name}${tierLabel} — ${priceLabel}${billingLabel}\n`;
      });
      content += `\n`;
      if (monthlyTotal > 0) {
        content += `Celková měsíční cena: ${monthlyTotal.toLocaleString('cs-CZ')} ${currency}/měs\n`;
      }
      if (oneOffTotal > 0) {
        content += `Jednorázová cena: ${oneOffTotal.toLocaleString('cs-CZ')} ${currency}\n`;
      }
    }
    
    content += `\n3. DOBA TRVÁNÍ\n\n[DOPLNIT]\n\n`;
    content += `4. PLATEBNÍ PODMÍNKY\n\n[DOPLNIT]\n\n`;
    content += `5. ZÁVĚREČNÁ USTANOVENÍ\n\n[DOPLNIT]\n\n`;
    content += `\nV __________ dne __________\n\n`;
    content += `Za objednatele:\t\t\tZa poskytovatele:\n`;
    content += `${lead.contact_name}\t\t\t[JMÉNO]\n`;

    return content;
  };

  const handleOpenGoogleDocs = () => {
    const content = buildGoogleDocsContent();
    // Google Docs "create" URL with pre-filled title
    const title = encodeURIComponent(`Smlouva — ${lead.company_name}`);
    const body = encodeURIComponent(content);
    // Use Google Docs create URL — opens a new blank doc with the title
    const googleDocsUrl = `https://docs.google.com/document/create?title=${title}&body=${body}`;
    
    // Copy the contract text to clipboard for pasting into the doc
    navigator.clipboard.writeText(content).then(() => {
      toast.success('Text smlouvy zkopírován do schránky — vložte ho do nového dokumentu (Ctrl+V)');
    });
    
    // Open a new Google Doc
    window.open(`https://docs.google.com/document/create?title=${title}`, '_blank');
  };

  const handleCreateContract = () => {
    toast.success('Smlouva vytvořena — čeká na propojení s DigiSign API');
    onSend({
      contract_url: '',
      digisign_envelope_id: null,
      digisign_document_url: null,
      contract_sent_at: new Date().toISOString(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            Vytvořit smlouvu
          </DialogTitle>
          <DialogDescription>
            Zkontrolujte údaje a vytvořte smlouvu v Google Docs nebo přes DigiSign API.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* ── Contract data preview ── */}
          <div className="rounded-lg border bg-card p-4 space-y-4">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Údaje do smlouvy</h5>

            {/* Company & billing */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Smluvní strana</p>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  {lead.company_name}
                </div>
                {lead.ico && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Hash className="h-3 w-3 shrink-0" />
                    IČO: {lead.ico}
                    {lead.dic && <> · DIČ: {lead.dic}</>}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3 shrink-0" />
                  {lead.contact_name} · {lead.contact_email || <span className="text-destructive">chybí e-mail</span>}
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Fakturační adresa</p>
                {(lead.billing_street || lead.billing_city) ? (
                  <div className="space-y-0.5 text-xs">
                    {lead.billing_street && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                        {lead.billing_street}
                      </div>
                    )}
                    <div className="pl-5 text-muted-foreground">
                      {[lead.billing_city, lead.billing_zip, lead.billing_country].filter(Boolean).join(', ')}
                    </div>
                    {lead.billing_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                        {lead.billing_email}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-destructive">⚠️ Fakturační adresa nevyplněna</p>
                )}
              </div>
            </div>

            {/* Services & pricing */}
            {leadServices.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Package className="h-3 w-3" />
                  Služby a ceny
                </p>
                <div className="rounded-md border divide-y divide-border/50 text-sm">
                  {leadServices.map((svc, idx) => (
                    <div key={idx} className="flex items-center justify-between px-3 py-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="truncate">{svc.name}</span>
                        {svc.selected_tier && (
                          <Badge variant="outline" className="text-[10px] uppercase shrink-0">{svc.selected_tier}</Badge>
                        )}
                      </div>
                      <span className="font-medium tabular-nums whitespace-nowrap ml-2">
                        {(svc.price || 0).toLocaleString('cs-CZ')} {svc.currency || currency}
                        {(svc.billing_type || 'monthly') === 'monthly' ? '/měs' : ''}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-3 py-2 bg-muted/50 font-semibold text-sm">
                    <span>Celkem měsíčně</span>
                    <span className="tabular-nums">{monthlyTotal.toLocaleString('cs-CZ')} {currency}/měs</span>
                  </div>
                  {oneOffTotal > 0 && (
                    <div className="flex items-center justify-between px-3 py-2 bg-muted/50 text-sm">
                      <span>Jednorázově</span>
                      <span className="font-semibold tabular-nums">{oneOffTotal.toLocaleString('cs-CZ')} {currency}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {leadServices.length === 0 && (
              <p className="text-xs text-destructive">⚠️ Žádné služby v nabídce — vytvořte nejdříve nabídku.</p>
            )}
          </div>

          {/* Missing data warning */}
          {hasMissingData && (
            <div className="rounded-lg border border-amber-300/40 bg-amber-500/5 p-3">
              <p className="text-xs font-medium" style={{ color: 'hsl(var(--warning, 45 93% 47%))' }}>
                ⚠️ Některé údaje chybí — smlouva může být neúplná. Doplňte je v detailu leadu.
              </p>
            </div>
          )}

          <Separator />

          {/* ── Two paths: Google Docs or DigiSign ── */}
          <div className="space-y-3">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Jak chcete smlouvu vytvořit?</h5>

            {/* Option 1: Google Docs */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Google Docs</span>
                  <Badge variant="outline" className="text-[10px]">Manuální</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Otevře nový Google Doc s předvyplněnými údaji. Text smlouvy se zkopíruje do schránky — stačí vložit (Ctrl+V), upravit a pak odeslat přes DigiSign ručně.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleOpenGoogleDocs}
                disabled={leadServices.length === 0}
              >
                <FileText className="h-4 w-4" />
                Vytvořit v Google Docs
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>

            {/* Option 2: DigiSign API */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSignature className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">DigiSign API</span>
                  <Badge variant="secondary" className="text-[10px]">Připraveno</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Automatické odeslání smlouvy přes DigiSign API — zatím připraven payload, backend bude napojen.
              </p>

              {/* Expandable payload preview */}
              <button
                type="button"
                onClick={() => setShowPayload(!showPayload)}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Code className="h-3.5 w-3.5" />
                <span>API Payload</span>
                {showPayload ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>

              {showPayload && (
                <div className="relative">
                  <pre className="rounded-md border bg-muted/50 p-3 text-[11px] font-mono overflow-x-auto max-h-[250px] overflow-y-auto leading-relaxed">
                    {payloadJson}
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-7 gap-1.5 text-xs"
                    onClick={handleCopyPayload}
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? 'Zkopírováno' : 'Kopírovat'}
                  </Button>
                </div>
              )}

              <Button
                size="sm"
                className="gap-2"
                onClick={handleCreateContract}
                disabled={leadServices.length === 0}
              >
                <FileSignature className="h-4 w-4" />
                Odeslat přes DigiSign
              </Button>
            </div>
          </div>

          {/* Contract signed status */}
          {lead.contract_signed_at && (
            <div className="rounded-lg border border-emerald-300/40 bg-emerald-500/5 p-3">
              <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'hsl(var(--success, 142 76% 36%))' }}>
                <Check className="h-4 w-4" />
                Smlouva byla podepsána {new Date(lead.contract_signed_at).toLocaleDateString('cs-CZ')}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zavřít
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}