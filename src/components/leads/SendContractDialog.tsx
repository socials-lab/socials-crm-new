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
import { FileSignature, Copy, Check, Building2, Hash, Mail, MapPin, Package, Code, ChevronDown, ChevronUp } from 'lucide-react';
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

  const handleCreateContract = () => {
    // Frontend-only: simulate creating the contract
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
            Zkontrolujte údaje a vytvořte smlouvu k odeslání přes DigiSign.
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
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                ⚠️ Některé údaje chybí — smlouva může být neúplná. Doplňte je v detailu leadu.
              </p>
            </div>
          )}

          <Separator />

          {/* DigiSign API payload preview */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowPayload(!showPayload)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  DigiSign API Payload
                </span>
                <Badge variant="outline" className="text-[10px]">Preview</Badge>
              </div>
              {showPayload ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {showPayload && (
              <div className="relative">
                <pre className="rounded-md border bg-muted/50 p-3 text-[11px] font-mono overflow-x-auto max-h-[300px] overflow-y-auto leading-relaxed">
                  {payloadJson}
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-7 gap-1.5 text-xs"
                  onClick={handleCopyPayload}
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Zkopírováno' : 'Kopírovat'}
                </Button>
              </div>
            )}
          </div>

          {/* Contract signed status */}
          {lead.contract_signed_at && (
            <div className="rounded-lg border border-emerald-300/40 bg-emerald-500/5 p-3">
              <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                <Check className="h-4 w-4" />
                Smlouva byla podepsána {new Date(lead.contract_signed_at).toLocaleDateString('cs-CZ')}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button onClick={handleCreateContract} disabled={leadServices.length === 0}>
            <FileSignature className="h-4 w-4 mr-2" />
            {lead.contract_sent_at ? 'Aktualizovat smlouvu' : 'Vytvořit smlouvu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
