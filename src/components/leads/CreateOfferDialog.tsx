import { useState, useMemo, useEffect } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Copy, ExternalLink, Check } from 'lucide-react';
import { useCRMData } from '@/hooks/useCRMData';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';
import type { Lead } from '@/types/crm';
import type { PublicOfferService, PublicOffer, PortfolioLink } from '@/types/publicOffer';
import { supabase } from '@/integrations/supabase/client';
import { EditableOfferServiceCard } from './EditableOfferServiceCard';

interface CreateOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  onSuccess: (token: string, offerUrl: string) => void;
}

function generateToken(): string {
  // Use cryptographically secure random values
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

function getOfferTypeFromServices(services: Array<{ billing_type: 'monthly' | 'one_off' }>): 'retainer' | 'one_off' {
  if (!services?.length) return 'retainer';
  const hasMonthly = services.some(s => s.billing_type === 'monthly');
  const hasOneOff = services.some(s => s.billing_type === 'one_off');
  if (hasMonthly && hasOneOff) return 'retainer'; // Mixed: default to retainer
  return hasMonthly ? 'retainer' : 'one_off';
}

// Default portfolio links that can be added
const DEFAULT_PORTFOLIO_OPTIONS: Omit<PortfolioLink, 'id'>[] = [
  { title: 'Case Study: E-shop Fashion Brand', url: 'https://www.canva.com/design/example1', type: 'case_study' },
  { title: 'Ukázka kampaní pro B2B klienty', url: 'https://www.canva.com/design/example2', type: 'presentation' },
  { title: 'Reference od klientů', url: 'https://socials.cz/reference', type: 'reference' },
];

export function CreateOfferDialog({ open, onOpenChange, lead, onSuccess }: CreateOfferDialogProps) {
  const { services, colleagues } = useCRMData();
  const { colleagueId } = useUserRole();
  const [auditSummary, setAuditSummary] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [portfolioLinks, setPortfolioLinks] = useState<PortfolioLink[]>(
    DEFAULT_PORTFOLIO_OPTIONS.map((p, idx) => ({ ...p, id: `portfolio-${idx}` }))
  );
  const [monthlyDiscountPercent, setMonthlyDiscountPercent] = useState(0);
  const [discountScope, setDiscountScope] = useState<'core_only' | 'all_services'>('core_only');
  const [isCreating, setIsCreating] = useState(false);
  const [createdOfferUrl, setCreatedOfferUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Editable services state
  const [editableServices, setEditableServices] = useState<PublicOfferService[]>([]);

  // Get current user's colleague record (the logged-in user)
  const currentColleague = colleagueId ? colleagues.find(c => c.id === colleagueId) : null;

  // Initialize editable services when dialog opens
  useEffect(() => {
    if (open && lead.potential_services) {
      const initialServices: PublicOfferService[] = lead.potential_services.map(ls => {
        const serviceDetails = services.find(s => s.id === ls.service_id);

        return {
          id: ls.id,
          service_id: ls.service_id,
          name: ls.name,
          description: serviceDetails?.description || '',
          offer_description: null,
          selected_tier: ls.selected_tier,
          price: ls.price,
          original_price: ls.price,
          discount_reason: '',
          currency: ls.currency,
          billing_type: ls.billing_type,
          // Pass service_type from service definition
          service_type: serviceDetails?.service_type,
          // Use DB deliverables or empty array (no magic fallbacks)
          deliverables: serviceDetails?.default_deliverables || [],
          frequency: '',
          turnaround: '',
          requirements: [],
          start_timeline: '',
        };
      });
      setEditableServices(initialServices);
    }
  }, [open, lead.potential_services, services]);

  // Calculate totals
  const totals = useMemo(() => {
    const coreMonthly = editableServices
      .filter(s => s.billing_type === 'monthly' && s.service_type === 'core')
      .reduce((sum, s) => sum + s.price, 0);
    const addonMonthly = editableServices
      .filter(s => s.billing_type === 'monthly' && s.service_type !== 'core')
      .reduce((sum, s) => sum + s.price, 0);
    const monthly = coreMonthly + addonMonthly;

    const oneOff = editableServices
      .filter(s => s.billing_type === 'one_off')
      .reduce((sum, s) => sum + s.price, 0);

    const totalOriginal = editableServices.reduce((sum, s) => sum + (s.original_price || s.price), 0);
    const totalFinal = editableServices.reduce((sum, s) => sum + s.price, 0);
    const totalDiscount = totalOriginal - totalFinal;

    const discountBase = discountScope === 'all_services' ? monthly : coreMonthly;
    const discountedBase = monthlyDiscountPercent > 0
      ? Math.round(discountBase * (1 - monthlyDiscountPercent / 100))
      : discountBase;
    const monthlyDiscountAmount = discountBase - discountedBase;
    const monthlyAfterDiscount = discountScope === 'all_services'
      ? discountedBase
      : discountedBase + addonMonthly;

    return {
      monthly,
      coreMonthly,
      addonMonthly,
      oneOff,
      totalOriginal,
      totalFinal,
      totalDiscount,
      monthlyAfterDiscount,
      monthlyDiscountAmount,
    };
  }, [editableServices, monthlyDiscountPercent, discountScope]);

  const handleUpdateService = (index: number, updated: PublicOfferService) => {
    setEditableServices(prev =>
      prev.map((s, i) => i === index ? updated : s)
    );
  };

  const handleRemoveService = (index: number) => {
    setEditableServices(prev => prev.filter((_, i) => i !== index));
  };

  // Default valid_until to 14 days from now
  const defaultValidUntil = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().split('T')[0];
  }, []);

  const handleCreate = async () => {
    // Validate required fields
    if (!lead.company_name?.trim()) {
      toast.error('Chybí název firmy');
      return;
    }
    if (!lead.contact_name?.trim()) {
      toast.error('Chybí jméno kontaktní osoby');
      return;
    }
    if (editableServices.length === 0) {
      toast.error('Přidejte alespoň jednu službu do nabídky');
      return;
    }

    setIsCreating(true);

    try {
      const token = generateToken();
      const offerUrl = `${window.location.origin}/offer/${token}`;

      // Find lead owner for contact info
      const leadOwner = colleagues.find(c => c.id === lead.owner_id);

      // Insert offer into Supabase with timeout
      const insertPromise = supabase
        .from('public_offers')
        .insert({
          lead_id: lead.id,
          token,
          company_name: lead.company_name.trim(),
          website: lead.website || null,
          contact_name: lead.contact_name.trim(),
          audit_summary: auditSummary.trim() || null,
          recommendation_intro: null,
          custom_note: customNote.trim() || null,
          notion_url: null,
          // Cast to unknown to satisfy Supabase's JSONB column type (typed arrays -> Json)
          services: editableServices as unknown as Record<string, unknown>[],
          portfolio_links: portfolioLinks as unknown as Record<string, unknown>[],
          total_price: totals.monthlyAfterDiscount + totals.oneOff,
          monthly_discount_percent: monthlyDiscountPercent > 0 ? monthlyDiscountPercent : null,
          discount_scope: monthlyDiscountPercent > 0 ? discountScope : null,
          currency: lead.currency || 'CZK',
          offer_type: getOfferTypeFromServices(editableServices),
          valid_until: validUntil || defaultValidUntil,
          is_active: true,
          created_by: currentColleague?.id || null,
          owner_name: leadOwner?.full_name || null,
          owner_email: leadOwner?.email || null,
          owner_phone: leadOwner?.phone || null,
          estimated_start_date: null, // Can be set later if needed
        });

      // Add timeout to prevent hanging forever
      // Creating an offer can take longer on slower Supabase/connection, so keep this generous.
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Požadavek vypršel. Zkuste to prosím znovu.')), 60000)
      );

      const { error } = await Promise.race([insertPromise, timeoutPromise]);

      if (error) {
        throw error;
      }

      setCreatedOfferUrl(offerUrl);
      toast.success('Nabídka byla vytvořena!');
      onSuccess(token, offerUrl);
    } catch (err: unknown) {
      console.error('Error creating offer:', err);
      const errorMessage = err instanceof Error ? err.message : 'Chyba při vytváření nabídky';
      toast.error(errorMessage);
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
    setValidUntil('');
    setCreatedOfferUrl(null);
    setCopied(false);
    setEditableServices([]);
    setMonthlyDiscountPercent(0);
    setDiscountScope('core_only');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[95vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>
            {createdOfferUrl ? 'Nabídka vytvořena' : 'Vytvořit sdílenou nabídku'}
          </DialogTitle>
        </DialogHeader>

        {createdOfferUrl ? (
          // Success state
          <div className="space-y-4 px-6 pb-6">
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
            <ScrollArea className="max-h-[calc(95vh-180px)]">
              <div className="space-y-4 px-6 pb-4">
                {/* Company info */}
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Pro:</span>{' '}
                    <span className="font-medium">{lead.company_name}</span>
                    {' · '}
                    <span className="text-muted-foreground">{lead.contact_name}</span>
                  </p>
                </div>

                {/* Editable Services */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Služby v nabídce</Label>
                  <div className="space-y-3">
                    {editableServices.map((service, idx) => (
                      <EditableOfferServiceCard
                        key={service.id || idx}
                        service={service}
                        onUpdate={(updated) => handleUpdateService(idx, updated)}
                        onRemove={() => handleRemoveService(idx)}
                      />
                    ))}
                  </div>

                  {editableServices.length === 0 && (
                    <div className="p-4 text-center text-muted-foreground border rounded-lg border-dashed">
                      Žádné služby v nabídce. Přidejte služby k leadu před vytvořením nabídky.
                    </div>
                  )}

                  {/* Price Summary */}
                  {editableServices.length > 0 && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Měsíčně:</span>
                        <span className="font-medium">
                          {monthlyDiscountPercent > 0 ? (
                            <>
                              <span className="line-through text-muted-foreground mr-2">
                                {totals.monthly.toLocaleString('cs-CZ')}
                              </span>
                              {totals.monthlyAfterDiscount.toLocaleString('cs-CZ')} {lead.currency}/měs
                            </>
                          ) : (
                            <>{totals.monthly.toLocaleString('cs-CZ')} {lead.currency}/měs</>
                          )}
                        </span>
                      </div>

                      {totals.monthly > 0 && (
                        <div className="space-y-1.5 mb-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground text-xs">
                              Sleva při odběru všech služeb:
                            </span>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                value={monthlyDiscountPercent || ''}
                                onChange={(e) => setMonthlyDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                                placeholder="0"
                                className="w-16 h-7 text-sm text-right"
                              />
                              <span className="text-muted-foreground">%</span>
                            </div>
                          </div>

                          {monthlyDiscountPercent > 0 && totals.addonMonthly > 0 && (
                            <div className="flex items-center gap-3 text-xs">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  name="discountScope"
                                  checked={discountScope === 'core_only'}
                                  onChange={() => setDiscountScope('core_only')}
                                  className="accent-primary"
                                />
                                <span className="text-muted-foreground">Jen core služby</span>
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  name="discountScope"
                                  checked={discountScope === 'all_services'}
                                  onChange={() => setDiscountScope('all_services')}
                                  className="accent-primary"
                                />
                                <span className="text-muted-foreground">Všechny služby</span>
                              </label>
                            </div>
                          )}
                        </div>
                      )}

                      {monthlyDiscountPercent > 0 && (
                        <div className="flex items-center justify-between text-sm text-green-600 mb-1">
                          <span>Sleva {monthlyDiscountPercent}% na {discountScope === 'all_services' ? 'všechny služby' : 'core služby'}:</span>
                          <span className="font-medium">
                            -{totals.monthlyDiscountAmount.toLocaleString('cs-CZ')} {lead.currency}/měs
                          </span>
                        </div>
                      )}

                      {totals.oneOff > 0 && (
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Jednorázově:</span>
                          <span className="font-medium">
                            {totals.oneOff.toLocaleString('cs-CZ')} {lead.currency}
                          </span>
                        </div>
                      )}

                      {totals.totalDiscount > 0 && (
                        <div className="flex items-center justify-between text-sm text-green-600">
                          <span>Celková sleva na služby:</span>
                          <span className="font-medium">
                            -{totals.totalDiscount.toLocaleString('cs-CZ')} {lead.currency}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Audit summary */}
                <div className="space-y-2">
                  <Label htmlFor="audit">Výstup z auditu (volitelné)</Label>
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
                  <Label htmlFor="note">Poznámka pro klienta (volitelné)</Label>
                  <Textarea
                    id="note"
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="Těšíme se na spolupráci! V případě dotazů se neváhejte obrátit..."
                    rows={3}
                  />
                </div>

                {/* Valid until */}
                <div className="space-y-2">
                  <Label htmlFor="validUntil">Platnost nabídky do</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={validUntil || defaultValidUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="px-6 py-4 border-t">
              <Button variant="outline" onClick={handleClose}>
                Zrušit
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isCreating || editableServices.length === 0}
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
