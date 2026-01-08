import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Copy, ExternalLink, Check } from 'lucide-react';
import { useCRMData } from '@/hooks/useCRMData';
import { toast } from 'sonner';
import type { Lead } from '@/types/crm';
import type { PublicOfferService, PublicOffer } from '@/types/publicOffer';
import { addPublicOffer } from '@/data/publicOffersMockData';
interface CreateOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  onSuccess: (token: string, offerUrl: string) => void;
}

function generateToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function CreateOfferDialog({ open, onOpenChange, lead, onSuccess }: CreateOfferDialogProps) {
  const { services, colleagues } = useCRMData();
  const [auditSummary, setAuditSummary] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [notionUrl, setNotionUrl] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createdOfferUrl, setCreatedOfferUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Get current user's colleague record
  const currentColleague = colleagues.find(c => c.status === 'active');

  // Map lead services with offer descriptions
  const offerServices: PublicOfferService[] = useMemo(() => {
    if (!lead.potential_services) return [];
    
    return lead.potential_services.map(ls => {
      const serviceDetails = services.find(s => s.id === ls.service_id);
      return {
        id: ls.id,
        service_id: ls.service_id,
        name: ls.name,
        description: serviceDetails?.description || '',
        offer_description: serviceDetails?.offer_description || null,
        selected_tier: ls.selected_tier,
        price: ls.price,
        currency: ls.currency,
        billing_type: ls.billing_type,
      };
    });
  }, [lead.potential_services, services]);

  const totalPrice = offerServices.reduce((sum, s) => sum + s.price, 0);

  const handleCreate = async () => {
    if (offerServices.length === 0) {
      toast.error('Přidejte alespoň jednu službu do nabídky');
      return;
    }

    setIsCreating(true);

    try {
      const token = generateToken();
      const offerUrl = `${window.location.origin}/offer/${token}`;
      const now = new Date().toISOString();

      // Create offer object for mock store
      const newOffer: PublicOffer = {
        id: crypto.randomUUID(),
        lead_id: lead.id,
        token,
        company_name: lead.company_name,
        contact_name: lead.contact_name,
        audit_summary: auditSummary.trim() || null,
        custom_note: customNote.trim() || null,
        notion_url: notionUrl.trim() || null,
        services: offerServices,
        total_price: totalPrice,
        currency: lead.currency,
        offer_type: lead.offer_type as 'retainer' | 'one_off',
        valid_until: validUntil || null,
        is_active: true,
        viewed_at: null,
        view_count: 0,
        created_by: currentColleague?.id || null,
        created_at: now,
        updated_at: now,
      };

      // Add to mock store
      addPublicOffer(newOffer);

      setCreatedOfferUrl(offerUrl);
      toast.success('Nabídka byla vytvořena!');
      onSuccess(token, offerUrl);
    } catch (err) {
      console.error('Error creating offer:', err);
      toast.error('Chyba při vytváření nabídky');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!createdOfferUrl) return;
    await navigator.clipboard.writeText(createdOfferUrl);
    setCopied(true);
    toast.success('Odkaz zkopírován do schránky');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setAuditSummary('');
    setCustomNote('');
    setNotionUrl('');
    setValidUntil('');
    setCreatedOfferUrl(null);
    setCopied(false);
    onOpenChange(false);
  };

  // Default valid_until to 14 days from now
  const defaultValidUntil = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().split('T')[0];
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {createdOfferUrl ? '✅ Nabídka vytvořena' : 'Vytvořit sdílenou nabídku'}
          </DialogTitle>
        </DialogHeader>

        {createdOfferUrl ? (
          // Success state
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg border bg-green-500/10 border-green-500/30">
              <p className="text-sm text-green-700 font-medium mb-3">
                Nabídka byla úspěšně vytvořena! Zkopírujte odkaz a odešlete klientovi:
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={createdOfferUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="outline" size="icon" asChild>
                  <a href={createdOfferUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            <div className="text-center">
              <Button onClick={handleClose}>Zavřít</Button>
            </div>
          </div>
        ) : (
          // Form state
          <>
            <div className="space-y-4 py-4">
              {/* Company info */}
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm">
                  <span className="text-muted-foreground">Pro:</span>{' '}
                  <span className="font-medium">{lead.company_name}</span>
                  {' · '}
                  <span className="text-muted-foreground">{lead.contact_name}</span>
                </p>
              </div>

              {/* Services summary */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Služby v nabídce</Label>
                <div className="space-y-2">
                  {offerServices.map((service, idx) => (
                    <div
                      key={service.id || idx}
                      className="flex items-center justify-between p-2 rounded border bg-card text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span>{service.name}</span>
                        {service.selected_tier && (
                          <Badge variant="outline" className="text-xs uppercase">
                            {service.selected_tier}
                          </Badge>
                        )}
                        {!service.offer_description && (
                          <Badge variant="secondary" className="text-xs">
                            Bez popisu
                          </Badge>
                        )}
                      </div>
                      <span className="font-medium">
                        {service.price.toLocaleString()} {service.currency}
                      </span>
                    </div>
                  ))}
                </div>
                {offerServices.some(s => !s.offer_description) && (
                  <p className="text-xs text-amber-600">
                    ⚠️ Některé služby nemají popis pro nabídky. Doplňte ho v nastavení Služby.
                  </p>
                )}
                <div className="text-right font-semibold">
                  Celkem: {totalPrice.toLocaleString()} {lead.currency}
                  {lead.offer_type === 'retainer' && <span className="font-normal">/měs</span>}
                </div>
              </div>

              <Separator />

              {/* Audit summary */}
              <div className="space-y-2">
                <Label htmlFor="audit">📊 Výstup z auditu (volitelné)</Label>
                <Textarea
                  id="audit"
                  value={auditSummary}
                  onChange={(e) => setAuditSummary(e.target.value)}
                  placeholder="Na základě analýzy vašich reklamních účtů jsme identifikovali..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Krátké shrnutí zjištění z auditu účtů klienta
                </p>
              </div>

              {/* Custom note */}
              <div className="space-y-2">
                <Label htmlFor="note">📝 Poznámka pro klienta (volitelné)</Label>
                <Textarea
                  id="note"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="Těšíme se na spolupráci! V případě dotazů se neváhejte obrátit..."
                  rows={3}
                />
              </div>

              {/* Notion URL */}
              <div className="space-y-2">
                <Label htmlFor="notion">📄 Link na detailní nabídku v Notion (volitelné)</Label>
                <Input
                  id="notion"
                  type="url"
                  value={notionUrl}
                  onChange={(e) => setNotionUrl(e.target.value)}
                  placeholder="https://notion.so/..."
                />
                <p className="text-xs text-muted-foreground">
                  Pokud máte podrobnější vysvětlení nabídky v Notion
                </p>
              </div>

              {/* Valid until */}
              <div className="space-y-2">
                <Label htmlFor="validUntil">📅 Platnost nabídky do</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={validUntil || defaultValidUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Zrušit
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isCreating || offerServices.length === 0}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Vytvářím...
                  </>
                ) : (
                  'Vytvořit nabídku'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
