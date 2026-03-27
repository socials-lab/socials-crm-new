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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileSignature, ExternalLink, Copy, Check, Send, Building2, Hash, Mail, MapPin, Package } from 'lucide-react';
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
  const [contractUrl, setContractUrl] = useState(lead.contract_url || '');
  const [digisignEnvelopeId, setDigisignEnvelopeId] = useState(lead.digisign_envelope_id || '');
  const [digisignDocumentUrl, setDigisignDocumentUrl] = useState(lead.digisign_document_url || '');
  const [copied, setCopied] = useState(false);

  const digisignLink = digisignEnvelopeId
    ? `https://app.digisign.org/envelope/${digisignEnvelopeId}`
    : null;

  const leadServices: LeadService[] = Array.isArray(lead.potential_services) ? lead.potential_services : [];
  const monthlyServices = leadServices.filter(s => (s.billing_type || 'monthly') === 'monthly');
  const oneOffServices = leadServices.filter(s => s.billing_type === 'one_off');
  const monthlyTotal = monthlyServices.reduce((sum, s) => sum + (s.price || 0), 0);
  const oneOffTotal = oneOffServices.reduce((sum, s) => sum + (s.price || 0), 0);
  const currency = lead.currency || 'CZK';

  const handleSend = () => {
    if (!contractUrl && !digisignDocumentUrl) {
      toast.error('Zadejte odkaz na smlouvu nebo DigiSign dokument');
      return;
    }

    onSend({
      contract_url: contractUrl || digisignDocumentUrl || '',
      digisign_envelope_id: digisignEnvelopeId || null,
      digisign_document_url: digisignDocumentUrl || null,
      contract_sent_at: new Date().toISOString(),
    });
    onOpenChange(false);
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Zkopírováno');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            Smlouva — DigiSign
          </DialogTitle>
          <DialogDescription>
            Zkontrolujte údaje pro smlouvu a připojte ji přes DigiSign.
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
                  {lead.contact_name} · {lead.contact_email}
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

          <Separator />

          {/* DigiSign fields */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <img src="https://www.digisign.org/favicon.ico" alt="" className="h-4 w-4" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <span className="text-sm font-medium">DigiSign</span>
              <Badge variant="outline" className="text-[10px]">Doporučeno</Badge>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">ID obálky (Envelope ID)</Label>
              <Input
                value={digisignEnvelopeId}
                onChange={(e) => setDigisignEnvelopeId(e.target.value)}
                placeholder="např. abc123-def456-..."
                className="font-mono text-sm"
              />
              <p className="text-[10px] text-muted-foreground">
                Zkopírujte z DigiSign po vytvoření obálky. Backend webhook uloží podepsaný dokument automaticky.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Odkaz na DigiSign dokument</Label>
              <Input
                type="url"
                value={digisignDocumentUrl}
                onChange={(e) => setDigisignDocumentUrl(e.target.value)}
                placeholder="https://app.digisign.org/document/..."
              />
            </div>

            {digisignLink && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-primary/5 border border-primary/20">
                <FileSignature className="h-4 w-4 text-primary shrink-0" />
                <a href={digisignLink} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate flex-1">
                  {digisignLink}
                </a>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleCopy(digisignLink)}>
                  {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" asChild>
                  <a href={digisignLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Fallback: manual contract URL */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Nebo přímý odkaz na smlouvu (volitelné)</Label>
            <Input
              type="url"
              value={contractUrl}
              onChange={(e) => setContractUrl(e.target.value)}
              placeholder="https://drive.google.com/... nebo jiný odkaz"
            />
          </div>

          {/* Status info */}
          {lead.contract_signed_at && (
            <div className="rounded-lg border border-emerald-300/40 bg-emerald-500/5 p-3">
              <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                <Check className="h-4 w-4" />
                Smlouva byla podepsána {new Date(lead.contract_signed_at).toLocaleDateString('cs-CZ')}
              </div>
              {lead.digisign_document_url && (
                <a href={lead.digisign_document_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline mt-1">
                  <ExternalLink className="h-3 w-3" />
                  Otevřít podepsaný dokument
                </a>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button onClick={handleSend} disabled={!contractUrl && !digisignDocumentUrl && !digisignEnvelopeId}>
            <Send className="h-4 w-4 mr-2" />
            {lead.contract_sent_at ? 'Aktualizovat smlouvu' : 'Odeslat smlouvu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
