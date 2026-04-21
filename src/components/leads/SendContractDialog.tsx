import { useState, useEffect, useRef } from 'react';
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
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  FileSignature, Copy, Check, Building2, Hash, Mail, MapPin,
  Package, Code, ChevronDown, ChevronUp, FileText, ExternalLink,
  Link2, Send, AlertCircle,
} from 'lucide-react';
import type { Lead, LeadService } from '@/types/crm';
import { toast } from 'sonner';
import { useDigiSign } from '@/hooks/useDigiSign';
import { supabase } from '@/integrations/supabase/client';
import type { PublicOfferService } from '@/types/publicOffer';

interface SendContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  onSaveContractUrl: (url: string) => Promise<void>;
  onSend: (data: {
    contract_url: string;
    digisign_envelope_id: string | null;
    digisign_document_url: string | null;
  }) => void;
}

export function SendContractDialog({ open, onOpenChange, lead, onSaveContractUrl, onSend }: SendContractDialogProps) {
  const [copied, setCopied] = useState(false);
  const [showPayload, setShowPayload] = useState(false);
  const getInitialGoogleDocsUrl = () =>
    lead.google_docs_contract_url ||
    (lead.contract_url?.includes('docs.google.com/document/') ? lead.contract_url : '') ||
    '';
  const [googleDocsUrl, setGoogleDocsUrl] = useState(getInitialGoogleDocsUrl);
  const lastSavedUrl = useRef(getInitialGoogleDocsUrl());
  const [googleDocsSavedAt, setGoogleDocsSavedAt] = useState<string | null>(lead.google_docs_contract_saved_at || null);
  const [isSendingToDraft, setIsSendingToDraft] = useState(false);

  // Sync URL from lead prop whenever it changes (e.g. after React Query refresh or prop update).
  useEffect(() => {
    const freshUrl =
      lead.google_docs_contract_url ||
      (lead.contract_url?.includes('docs.google.com/document/') ? lead.contract_url : '') ||
      '';
    setGoogleDocsUrl(freshUrl);
    lastSavedUrl.current = freshUrl;
    setGoogleDocsSavedAt(lead.google_docs_contract_saved_at || null);
  }, [lead.google_docs_contract_url, lead.contract_url, lead.google_docs_contract_saved_at]);

  // Auto-save when the dialog opens so URL is always current.
  useEffect(() => {
    if (!open) return;
    const url =
      lead.google_docs_contract_url ||
      (lead.contract_url?.includes('docs.google.com/document/') ? lead.contract_url : '') ||
      '';
    setGoogleDocsUrl(url);
    lastSavedUrl.current = url;
    setGoogleDocsSavedAt(lead.google_docs_contract_saved_at || null);
    setHasResetDraft(false);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGoogleDocsUrlBlur = async () => {
    const trimmed = googleDocsUrl.trim();
    if (trimmed && trimmed.includes('docs.google.com') && trimmed !== lastSavedUrl.current) {
      try {
        await onSaveContractUrl(trimmed);
        lastSavedUrl.current = trimmed;
        const savedAt = new Date().toISOString();
        setGoogleDocsSavedAt(savedAt);
      } catch (error) {
        console.error('Failed to save Google Docs URL:', error);
        toast.error('Nepodařilo se uložit odkaz na Google Docs');
      }
    }
  };
  const googleDocsSavedAtLabel = googleDocsSavedAt
    ? new Date(googleDocsSavedAt).toLocaleString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    : null;
  const [isPreparingContractDoc, setIsPreparingContractDoc] = useState(false);
  const [draftCreated, setDraftCreated] = useState(false);
  const [draftEnvelopeId, setDraftEnvelopeId] = useState<string | null>(null);
  const [hasResetDraft, setHasResetDraft] = useState(false);
  const [offerServicesFallback, setOfferServicesFallback] = useState<LeadService[]>([]);
  const { createContract } = useDigiSign();

  useEffect(() => {
    if (!open) return;

    const localServices = Array.isArray(lead.potential_services) ? lead.potential_services : [];
    if (localServices.length > 0) {
      setOfferServicesFallback([]);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        let query = supabase
          .from('public_offers')
          .select('services, token')
          .eq('is_active', true);

        if (lead.offer_token) {
          query = query.eq('token', lead.offer_token);
        } else {
          query = query.eq('lead_id', lead.id);
        }

        const { data, error } = await query
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        const services = (data?.services ?? []) as PublicOfferService[];
        const normalized: LeadService[] = Array.isArray(services)
          ? services.map((service, idx) => ({
              id: service.id || `offer-service-${idx}`,
              service_id: service.service_id,
              name: service.name,
              selected_tier: service.selected_tier ?? null,
              price: Number(service.price || 0),
              currency: service.currency || lead.currency || 'CZK',
              billing_type: service.billing_type || 'monthly',
              managed_countries: service.managed_countries || [],
              country_variants: service.country_variants || [],
              intro_discount_percent: null,
              intro_discount_months: null,
              creative_boost_credits: service.creative_boost_credits ?? null,
              creative_boost_price_per_credit: service.creative_boost_price_per_credit ?? null,
              creative_boost_graphic_reward: null,
              creative_boost_editor_reward: null,
            }))
          : [];

        if (mounted) {
          setOfferServicesFallback(normalized);
        }
      } catch (error) {
        console.error('Failed to load services from public offer fallback:', error);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open, lead.id, lead.offer_token, lead.potential_services, lead.currency]);

  const localLeadServices: LeadService[] = Array.isArray(lead.potential_services) ? lead.potential_services : [];
  const leadServices: LeadService[] = localLeadServices.length > 0 ? localLeadServices : offerServicesFallback;
  const monthlyServices = leadServices.filter(s => (s.billing_type || 'monthly') === 'monthly');
  const oneOffServices = leadServices.filter(s => s.billing_type === 'one_off');
  const monthlyTotal = monthlyServices.reduce((sum, s) => sum + (s.price || 0), 0);
  const oneOffTotal = oneOffServices.reduce((sum, s) => sum + (s.price || 0), 0);
  const currency = lead.currency || 'CZK';

  const hasGoogleDocsUrl = googleDocsUrl.trim().length > 0 && googleDocsUrl.includes('docs.google.com');
  const hasExistingDigisignDraftInCrm = (lead.contract_url || '').includes('app.digisign.org/selfcare/envelopes/');

  // Build DigiSign API payload — always as DRAFT
  const digisignPayload = {
    envelope: {
      status: 'draft',
      email_subject: `Smlouva o propagaci — ${lead.company_name}`,
      email_body:
        `Dobrý den,\n\n` +
        `posílám Vám smlouvu o propagaci k podpisu.\n\n` +
        `Pokud budete potřebovat cokoliv upravit nebo vysvětlit, dejte mi prosím vědět.\n\n` +
        `Děkuji a přeji hezký den,\n` +
        `Dana Bauerová\n\n` +
        `dana.bauerova@socials.cz\n` +
        `Socials.cz`,
      signers: [
        {
          name: lead.contact_name,
          email: lead.contact_email || lead.billing_email,
          role: 'signer',
          order: 1,
        },
      ],
      document: {
        name: `${lead.company_name} - Smlouva o propagaci.pdf`,
        source: hasGoogleDocsUrl ? 'google_docs_export' : 'generated',
        google_docs_url: hasGoogleDocsUrl ? googleDocsUrl.trim() : undefined,
        export_format: 'application/pdf',
      },
      metadata: {
        lead_id: lead.id,
        company_name: lead.company_name,
        ico: lead.ico,
        dic: lead.dic,
        created_as: 'draft',
        note: 'Draft vytvořen z CRM — doplňte podpisové archy v DigiSign a odešlete ručně.',
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
    automation: {
      steps: [
        '1. Stáhnout Google Doc jako PDF (export link)',
        '2. Vytvořit draft envelope v DigiSign s přiloženým PDF',
        '3. Nastavit podepisující osobu (bez podpisových archů)',
        '4. Uživatel doplní podpisové archy v DigiSign',
        '5. Uživatel odešle smlouvu k podpisu z DigiSign',
      ],
      google_docs_export_url: hasGoogleDocsUrl
        ? `${googleDocsUrl.trim().replace(/\/edit.*$/, '')}/export?format=pdf`
        : null,
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

  const handleOpenGoogleDocs = async () => {
    setIsPreparingContractDoc(true);
    try {
      // Preview flow should always use backend template configuration and create a copy.
      // Do not pass template URL from frontend (prevents falling back to stale template docs).
      const result = await createContract(lead.id, undefined, undefined, true);
      if (!result) return;

      const generatedGoogleDocUrl =
        typeof result === 'object' && result && 'google_doc_url' in result && typeof result.google_doc_url === 'string'
          ? result.google_doc_url
          : null;

      if (!generatedGoogleDocUrl) {
        toast.error('Nepodařilo se připravit Google Docs smlouvu');
        return;
      }

      setGoogleDocsUrl(generatedGoogleDocUrl);
      await onSaveContractUrl(generatedGoogleDocUrl);
      setGoogleDocsSavedAt(new Date().toISOString());
      window.open(generatedGoogleDocUrl, '_blank');
      toast.success('Smlouva byla připravena, uložena do CRM a otevřena v Google Docs');
    } catch (error) {
      console.error('Failed to prepare contract document:', error);
      toast.error('Nepodařilo se připravit smlouvu v Google Docs');
    } finally {
      setIsPreparingContractDoc(false);
    }
  };

  const handleSendDraftToDigisign = async () => {
    if (!hasGoogleDocsUrl) {
      toast.error('Zadejte odkaz na Google Doc se smlouvou');
      return;
    }

    setIsSendingToDraft(true);

    try {
      const currentLeadGoogleDocUrl = (lead.google_docs_contract_url || '').trim();
      const shouldForceNewDraft = hasResetDraft || (currentLeadGoogleDocUrl.length > 0 && googleDocsUrl.trim() !== currentLeadGoogleDocUrl);
      const result = await createContract(lead.id, undefined, googleDocsUrl.trim(), false, shouldForceNewDraft);
      if (!result) return;

      const envelopeId =
        (typeof result === 'object' && result && 'digisign_id' in result && typeof result.digisign_id === 'string'
          ? result.digisign_id
          : null) ||
        (typeof result === 'object' && result && 'envelope_id' in result && typeof result.envelope_id === 'string'
          ? result.envelope_id
          : null);
      const generatedGoogleDocUrl =
        typeof result === 'object' && result && 'google_doc_url' in result && typeof result.google_doc_url === 'string'
          ? result.google_doc_url
          : null;

      if (!envelopeId) {
        throw new Error('DigiSign returned success without envelope id');
      }

      const digisignDraftUrl =
        (typeof result === 'object' && result && 'digisign_url' in result && typeof result.digisign_url === 'string')
          ? result.digisign_url
          : `https://app.digisign.org/selfcare/envelopes/${envelopeId}/detail`;
      setDraftEnvelopeId(envelopeId);
      setDraftCreated(true);
      setHasResetDraft(false);

      toast.success('📋 Smlouva byla odeslána k ruční kontrole Daně Bauerové', {
        duration: 5000,
      });

      onSend({
        contract_url: digisignDraftUrl,
        digisign_envelope_id: envelopeId,
        digisign_document_url: null,
      });
      if (generatedGoogleDocUrl) {
        setGoogleDocsUrl(generatedGoogleDocUrl);
        try {
          await onSaveContractUrl(generatedGoogleDocUrl);
          setGoogleDocsSavedAt(new Date().toISOString());
        } catch (error) {
          console.error('Failed to save generated Google Docs URL:', error);
        }
      }
    } catch (error) {
      console.error('Failed to create DigiSign draft:', error);
      const message = error instanceof Error ? error.message : 'Nepodařilo se vytvořit draft smlouvy v DigiSign';
      toast.error(message);
    } finally {
      setIsSendingToDraft(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            Vytvořit smlouvu
          </DialogTitle>
          <DialogDescription>
            Vytvořte smlouvu v Google Docs, upravte ji a pak odešlete jako draft do DigiSign.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 overflow-y-auto flex-1 min-h-0">
          {/* ── Contract data preview ── */}
          <div className="rounded-lg border bg-card p-4 space-y-4">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Údaje do smlouvy</h5>

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

          {hasMissingData && (
            <div className="rounded-lg border border-amber-300/40 bg-amber-500/5 p-3">
              <p className="text-xs font-medium" style={{ color: 'hsl(var(--warning, 45 93% 47%))' }}>
                ⚠️ Některé údaje chybí — smlouva může být neúplná. Doplňte je v detailu leadu.
              </p>
            </div>
          )}

          <Separator />

          {/* ── Step 1: Create in Google Docs ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground text-[10px] rounded-full h-5 w-5 p-0 flex items-center justify-center shrink-0">1</Badge>
              <h5 className="text-sm font-semibold">Vytvořit smlouvu v Google Docs</h5>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                Otevře kopii finální šablony smlouvy v Google Docs. Upravte ji dle potřeby a zkopírujte odkaz.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleOpenGoogleDocs}
                disabled={isPreparingContractDoc}
              >
                <FileText className="h-4 w-4" />
                {isPreparingContractDoc ? 'Připravuji…' : 'Vytvořit v Google Docs'}
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {/* ── Step 2: Paste Google Docs URL ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground text-[10px] rounded-full h-5 w-5 p-0 flex items-center justify-center shrink-0">2</Badge>
              <h5 className="text-sm font-semibold">Vložit odkaz na hotovou smlouvu</h5>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="gdocs-url" className="text-xs text-muted-foreground">
                  Odkaz na Google Doc s upravenou smlouvou
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="gdocs-url"
                      placeholder="https://docs.google.com/document/d/..."
                      value={googleDocsUrl}
                      onChange={e => setGoogleDocsUrl(e.target.value)}
                      onBlur={handleGoogleDocsUrlBlur}
                      className="pl-9 text-sm"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={!hasGoogleDocsUrl}
                    onClick={() => {
                      window.open(googleDocsUrl.trim(), '_blank', 'noopener,noreferrer');
                    }}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Otevřít
                  </Button>
                </div>
                {googleDocsUrl.trim() && !hasGoogleDocsUrl && (
                  <p className="text-[11px] text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Zadejte platný odkaz na Google Docs
                  </p>
                )}
                {hasGoogleDocsUrl && (
                  <div className="space-y-1">
                    <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Google Doc odkaz rozpoznán
                    </p>
                    {googleDocsSavedAtLabel && (
                      <p className="text-[11px] text-muted-foreground">
                        Uloženo: {googleDocsSavedAtLabel}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Step 3: Send draft to DigiSign ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground text-[10px] rounded-full h-5 w-5 p-0 flex items-center justify-center shrink-0">3</Badge>
              <h5 className="text-sm font-semibold">Odeslat draft do DigiSign</h5>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              {draftCreated ? (
                <div className="space-y-3">
                  <div className="rounded-md border border-emerald-300/40 bg-emerald-500/5 p-3 space-y-2">
                    <p className="text-sm font-medium flex items-center gap-2" style={{ color: 'hsl(var(--success, 142 76% 36%))' }}>
                      <Check className="h-4 w-4" />
                      Smlouva byla odeslána k ruční kontrole Daně Bauerové
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Dana Bauerová provede kontrolu a odešle smlouvu k podpisu přímo v DigiSign.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="gap-2 w-full"
                    onClick={() => {
                      const digisignUrl = draftEnvelopeId
                        ? `https://app.digisign.org/selfcare/envelopes/${draftEnvelopeId}/detail`
                        : 'https://app.digisign.org/selfcare';
                      window.open(digisignUrl, '_blank');
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Otevřít draft v DigiSign
                  </Button>
                </div>
              ) : (
                <>
                  <div className="rounded-md bg-muted/50 p-3 space-y-1.5">
                    <p className="text-xs font-medium">Automatizace provede:</p>
                    <ol className="text-[11px] text-muted-foreground space-y-0.5 list-decimal list-inside">
                      <li>Stáhne Google Doc jako PDF</li>
                      <li>Vytvoří draft envelope v DigiSign s přiloženým PDF</li>
                      <li>Nastaví podepisující osobu: <span className="font-medium text-foreground">{lead.contact_name}</span></li>
                    </ol>
                    <div className="mt-2 rounded border border-amber-300/40 bg-amber-500/5 px-2.5 py-1.5">
                      <p className="text-[11px] font-medium" style={{ color: 'hsl(var(--warning, 45 93% 47%))' }}>
                        ⚠️ Smlouva se odešle pouze jako <strong>draft</strong> — podpisové archy doplníte a odešlete ručně v DigiSign.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={handleSendDraftToDigisign}
                      disabled={!hasGoogleDocsUrl || isSendingToDraft}
                    >
                      <Send className="h-4 w-4" />
                      {isSendingToDraft ? 'Vytvářím draft…' : 'Vytvořit draft v DigiSign'}
                    </Button>
                    {(draftCreated || hasExistingDigisignDraftInCrm) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDraftCreated(false);
                          setDraftEnvelopeId(null);
                          setHasResetDraft(true);
                          toast.success('Odeslání bylo resetováno. Můžete vložit jiný odkaz a odeslat znovu.');
                        }}
                      >
                        Resetovat odeslání
                      </Button>
                    )}

                {/* Expandable payload preview */}
                <button
                  type="button"
                  onClick={() => setShowPayload(!showPayload)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
                >
                  <Code className="h-3.5 w-3.5" />
                  <span>API Payload</span>
                  {showPayload ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>

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
                </>
              )}
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
