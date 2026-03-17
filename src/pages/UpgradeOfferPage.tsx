import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { format, getDaysInMonth, startOfMonth, addMonths, getDate } from 'date-fns';
import { cs } from 'date-fns/locale';
import { Check, Clock, AlertCircle, Package, DollarSign, X as XIcon, CheckCircle2, Calendar as CalendarIcon, Info, Building2, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  getModificationRequestByToken, 
  clientAcceptOffer,
  seedNewEngagementDemo,
  type StoredModificationRequest 
} from '@/data/modificationRequestsMockData';
import type { AddServiceProposedChanges, UpdateServicePriceProposedChanges, DeactivateServiceProposedChanges, NewEngagementProposedChanges, ModificationRequestType } from '@/types/crm';
import socialsLogoDark from '@/assets/socials-logo-dark.svg';

// Helper to calculate prorated amount
function calculateProratedAmount(monthlyPrice: number, effectiveFrom: string) {
  const startDate = new Date(effectiveFrom);
  const daysInMonth = getDaysInMonth(startDate);
  const startDay = startDate.getDate();
  const remainingDays = daysInMonth - startDay + 1;
  const proratedAmount = (monthlyPrice / daysInMonth) * remainingDays;
  
  return {
    fullAmount: monthlyPrice,
    proratedAmount: Math.round(proratedAmount),
    remainingDays,
    daysInMonth,
  };
}

export default function UpgradeOfferPage() {
  const { token } = useParams<{ token: string }>();
  const [offer, setOffer] = useState<StoredModificationRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [agreedToChange, setAgreedToChange] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    // Seed demo data for new_engagement showcase
    seedNewEngagementDemo();

    if (!token) {
      setIsLoading(false);
      return;
    }

    const request = getModificationRequestByToken(token);
    setOffer(request);
    if (request?.effective_from) {
      setSelectedDate(new Date(request.effective_from));
    } else {
      setSelectedDate(startOfMonth(addMonths(new Date(), 1)));
    }
    setIsLoading(false);
  }, [token]);

  // Get total monthly price from offer
  const totalMonthlyPrice = useMemo(() => {
    if (!offer) return 0;
    if (offer.items && offer.items.length > 0) {
      let total = 0;
      for (const item of offer.items) {
        const c = item.proposed_changes as any;
        if (item.request_type === 'add_service' || item.request_type === 'expand_country') total += c.price || 0;
        else if (item.request_type === 'update_service_price') total += c.new_price || 0;
      }
      const discountPercent = offer.bundle_discount_percent || 0;
      return Math.round(total * (1 - discountPercent / 100));
    }
    const c = offer.proposed_changes as any;
    if (offer.request_type === 'add_service' || offer.request_type === 'expand_country') return c.price || 0;
    if (offer.request_type === 'update_service_price') return c.new_price || 0;
    if (offer.request_type === 'new_engagement') return c.total_monthly_price || 0;
    return 0;
  }, [offer]);

  // Live prorated calculation
  const prorationCalc = useMemo(() => {
    if (!selectedDate || !totalMonthlyPrice) return null;
    const daysInMonth = getDaysInMonth(selectedDate);
    const startDay = getDate(selectedDate);
    const remainingDays = daysInMonth - startDay + 1;
    const proratedAmount = Math.round((totalMonthlyPrice / daysInMonth) * remainingDays);
    return {
      proratedAmount,
      remainingDays,
      daysInMonth,
      monthName: format(selectedDate, 'LLLL yyyy', { locale: cs }),
      isFullMonth: startDay === 1,
    };
  }, [selectedDate, totalMonthlyPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offer || !email || !agreedToChange || !token || !selectedDate) return;

    setIsSubmitting(true);
    
    try {
      const updatedOffer = clientAcceptOffer(token, email, selectedDate.toISOString());
      
      if (updatedOffer) {
        setOffer(updatedOffer);
        toast.success('Změna byla úspěšně potvrzena. Na váš email jsme odeslali potvrzení.', {
          duration: 6000,
        });
      } else {
        throw new Error('Failed to accept offer');
      }
    } catch (err) {
      console.error('Error accepting offer:', err);
      toast.error('Nepodařilo se potvrdit změnu. Zkuste to prosím znovu.');
    }
    
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Načítám nabídku...</div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Nabídka nenalezena</h1>
            <p className="text-muted-foreground">
              Tato nabídka neexistuje nebo byl odkaz neplatný.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAccepted = offer.status === 'client_approved' || offer.status === 'applied';
  const isExpired = offer.upgrade_offer_valid_until && new Date(offer.upgrade_offer_valid_until) < new Date() && !isAccepted;
  const clientName = offer.client_brand_name || offer.client_name;
  const isBundled = offer.items && offer.items.length > 1;

  // Get change-specific icon and label
  const getChangeIcon = () => {
    switch (offer.request_type) {
      case 'add_service': return <Package className="h-5 w-5" />;
      case 'update_service_price': return <DollarSign className="h-5 w-5" />;
      case 'deactivate_service': return <XIcon className="h-5 w-5" />;
      case 'new_engagement': return <Building2 className="h-5 w-5" />;
      default: return <Package className="h-5 w-5" />;
    }
  };

  const getChangeLabel = () => {
    switch (offer.request_type) {
      case 'add_service': return 'Přidání nové služby';
      case 'update_service_price': return 'Změna ceny služby';
      case 'deactivate_service': return 'Ukončení služby';
      case 'new_engagement': return 'Nová zakázka';
      default: return 'Změna';
    }
  };

  // Render team members from colleague_rewards array
  const renderTeamSection = (rewards?: import('@/utils/pricingEngine').ColleagueRewardEntry[] | null) => {
    if (!rewards || rewards.length === 0) return null;
    
    const teamMembers = rewards.filter(cr => cr.colleague_name);
    if (teamMembers.length === 0) return null;

    return (
      <div className="mt-3 pt-3 border-t border-border/50">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <User className="h-3.5 w-3.5" />
          Váš tým
        </p>
        <div className="flex flex-wrap gap-2">
          {teamMembers.map((cr, i) => (
            <div key={i} className="inline-flex items-center gap-1.5 bg-muted rounded-full px-3 py-1 text-sm">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{cr.colleague_name}</span>
              <span className="text-muted-foreground">— {cr.role}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render change details for a specific type and changes (used for bundled items)
  const renderChangeDetailsForItem = (itemType: ModificationRequestType, changes: any, itemRewards?: import('@/utils/pricingEngine').ColleagueRewardEntry[] | null) => {
    switch (itemType) {
      case 'add_service': {
        const c = changes as unknown as AddServiceProposedChanges;
        const prorationInfo = c.price && offer.effective_from
          ? calculateProratedAmount(c.price, offer.effective_from)
          : null;
        return (
          <div className="space-y-3">
            <h3 className="font-semibold">{c.name}</h3>
            {c.description && <p className="text-muted-foreground text-sm">{c.description}</p>}
            {c.deliverables && c.deliverables.length > 0 && (
              <ul className="space-y-1">
                {c.deliverables.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-muted-foreground">Měsíční cena:</span>
              <span className="font-semibold">{c.price?.toLocaleString('cs-CZ')} {c.currency}</span>
            </div>
            {prorationInfo && offer.effective_from && (
              <p className="text-xs text-muted-foreground">
                Fakturace za první měsíc: {prorationInfo.proratedAmount.toLocaleString('cs-CZ')} {c.currency} ({prorationInfo.remainingDays}/{prorationInfo.daysInMonth} dní)
              </p>
            )}
            {renderTeamSection(itemRewards)}
          </div>
        );
      }
      case 'update_service_price': {
        const c = changes as unknown as UpdateServicePriceProposedChanges;
        return (
          <div className="space-y-2">
            <h3 className="font-semibold">{c.service_name}</h3>
            <div className="flex justify-between"><span className="text-muted-foreground">Původní:</span><span className="line-through text-muted-foreground">{c.old_price?.toLocaleString('cs-CZ')} {c.currency}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Nová:</span><span className="font-semibold text-primary">{c.new_price?.toLocaleString('cs-CZ')} {c.currency}</span></div>
          </div>
        );
      }
      case 'deactivate_service': {
        const c = changes as unknown as DeactivateServiceProposedChanges;
        return (
          <div className="space-y-2">
            <h3 className="font-semibold">{c.service_name}</h3>
            <p className="text-muted-foreground text-sm">Služba bude ukončena.</p>
          </div>
        );
      }
      case 'expand_country': {
        const c = changes as any;
        return (
          <div className="space-y-2">
            <h3 className="font-semibold">{c.service_name || c.reference_service_name} — {c.new_country_name || c.new_country_code}</h3>
            <div className="flex justify-between"><span className="text-muted-foreground">Měsíční cena:</span><span className="font-semibold">{c.price?.toLocaleString('cs-CZ')} {c.currency}</span></div>
          </div>
        );
      }
      default:
        return <p>Detaily změny nejsou k dispozici</p>;
    }
  };

  // Render change details based on type
  const renderChangeDetails = () => {
    const changes = offer.proposed_changes;
    
    switch (offer.request_type) {
      case 'add_service': {
        const c = changes as unknown as AddServiceProposedChanges;
        const prorationInfo = c.price && offer.effective_from
          ? calculateProratedAmount(c.price, offer.effective_from)
          : null;
        
        return (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <Package className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{c.name}</h3>
                {c.selected_tier && (
                  <Badge variant="outline" className="mt-1">
                    Tier: {String(c.selected_tier).toUpperCase()}
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Service description */}
            {c.description && (
              <p className="text-muted-foreground">{c.description}</p>
            )}
            
            {/* Deliverables - what client gets */}
            {c.deliverables && c.deliverables.length > 0 && (
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">
                    Co dostanete:
                  </p>
                </div>
                <ul className="space-y-2">
                  {c.deliverables.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="space-y-2 pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Měsíční cena:</span>
                <span className="font-semibold text-lg">
                  {c.price?.toLocaleString('cs-CZ')} {c.currency}
                </span>
              </div>
              
              {offer.effective_from && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Platnost od:
                  </span>
                  <span className="font-medium">
                    {format(new Date(offer.effective_from), 'd. MMMM yyyy', { locale: cs })}
                  </span>
                </div>
              )}
            </div>
            
            {prorationInfo && (
              <Alert className="bg-primary/5 border-primary/20">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Fakturace za {format(new Date(offer.effective_from!), 'LLLL', { locale: cs })}:</strong>{' '}
                  {prorationInfo.proratedAmount.toLocaleString('cs-CZ')} {c.currency}{' '}
                  ({prorationInfo.remainingDays} dní z {prorationInfo.daysInMonth})
                  <br />
                  <span className="text-xs text-muted-foreground">Od dalšího měsíce: plná měsíční cena</span>
                </AlertDescription>
              </Alert>
            )}
            {renderTeamSection(offer?.pricing_snapshot?.colleague_rewards)}
          </div>
        );
      }
      
      case 'update_service_price': {
        const c = changes as unknown as UpdateServicePriceProposedChanges;
        return (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                <DollarSign className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{c.service_name}</h3>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Původní cena:</span>
                <span className="line-through text-muted-foreground">
                  {c.old_price?.toLocaleString('cs-CZ')} {c.currency}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Nová cena:</span>
                <span className="font-semibold text-lg text-primary">
                  {c.new_price?.toLocaleString('cs-CZ')} {c.currency}
                </span>
              </div>
              
              {offer.effective_from && (
                <div className="flex justify-between items-center pt-2">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Platnost od:
                  </span>
                  <span className="font-medium">
                    {format(new Date(offer.effective_from), 'd. MMMM yyyy', { locale: cs })}
                  </span>
                </div>
              )}
            </div>
            {renderTeamSection(offer?.pricing_snapshot?.colleague_rewards)}
          </div>
        );
      }
      
      case 'deactivate_service': {
        const c = changes as unknown as DeactivateServiceProposedChanges;
        return (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                <XIcon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{c.service_name}</h3>
              </div>
            </div>
            
            <div className="space-y-2">
              {offer.effective_from && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Ukončení od:
                  </span>
                  <span className="font-medium">
                    {format(new Date(offer.effective_from), 'd. MMMM yyyy', { locale: cs })}
                  </span>
                </div>
              )}
            </div>
            {renderTeamSection(offer?.pricing_snapshot?.colleague_rewards)}
          </div>
        );
      }
      
      case 'new_engagement': {
        const c = changes as unknown as NewEngagementProposedChanges;
        return (
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{c.engagement_name}</h3>
                {c.is_different_sro && c.new_client_data?.company_name && (
                  <p className="text-sm text-muted-foreground">
                    Nová entita: {c.new_client_data.company_name}
                  </p>
                )}
              </div>
            </div>

            {/* Services list */}
            {c.services.map((svc, idx) => (
              <div key={idx} className="p-4 rounded-lg border bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{svc.name}</h4>
                  {svc.selected_tier && (
                    <Badge variant="outline">{String(svc.selected_tier).toUpperCase()}</Badge>
                  )}
                </div>
                {svc.description && (
                  <p className="text-sm text-muted-foreground">{svc.description}</p>
                )}
                {svc.deliverables && svc.deliverables.length > 0 && (
                  <ul className="space-y-1">
                    {svc.deliverables.map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-muted-foreground text-sm">Měsíční cena:</span>
                  <span className="font-semibold">{svc.price.toLocaleString('cs-CZ')} {svc.currency}</span>
                </div>
                {/* Per-service team */}
                {svc.assignments && svc.assignments.length > 0 && (
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      Váš tým
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {svc.assignments.map((a, i) => (
                        <div key={i} className="inline-flex items-center gap-1.5 bg-muted rounded-full px-3 py-1 text-sm">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">{a.colleague_name}</span>
                          <span className="text-muted-foreground">— {a.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Total */}
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="font-semibold text-lg">Celkem měsíčně:</span>
              <span className="font-bold text-xl text-primary">
                {c.total_monthly_price.toLocaleString('cs-CZ')} {c.currency}/měs
              </span>
            </div>

            {/* Onboarding form notice */}
            {c.send_onboarding_form && c.is_different_sro && (
              <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
                <Info className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-300">
                  <strong>Prosím vyplňte fakturační údaje</strong>
                  <br />
                  <span className="text-sm">
                    Pro novou právní entitu potřebujeme fakturační údaje (IČO, DIČ, adresa) a kontaktní osobu.
                    Po potvrzení nabídky vám bude zaslán onboarding formulář k vyplnění.
                  </span>
                </AlertDescription>
              </Alert>
            )}

            {offer.effective_from && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  Navrhovaný začátek:
                </span>
                <span className="font-medium">
                  {format(new Date(offer.effective_from), 'd. MMMM yyyy', { locale: cs })}
                </span>
              </div>
            )}
          </div>
        );
      }
      
      default:
        return <p>Detaily změny nejsou k dispozici</p>;
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--muted))]">
      {/* Header with primary accent */}
      <header className="bg-background border-b">
        <div className="container max-w-3xl mx-auto px-4 py-5 flex items-center justify-center">
          <img src={socialsLogoDark} alt="Socials.cz" className="h-8" />
        </div>
      </header>

      {/* Hero intro banner */}
      <div className="bg-primary/10 border-b border-primary/20">
        <div className="container max-w-3xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-3">Návrh úpravy spolupráce</h1>
          <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Vážený kliente, na základě naší komunikace jsme pro vás připravili návrh na rozšíření spolupráce.
            Níže naleznete přehled navrhovaných změn včetně cen.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-background rounded-full px-4 py-2 text-sm border shadow-sm">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="font-medium">{clientName}</span>
            <span className="text-muted-foreground">–</span>
            <span className="text-muted-foreground">{offer.engagement_name}</span>
          </div>
        </div>
      </div>

      <main className="container max-w-3xl mx-auto px-4 py-8">
        {/* Success state */}
        {isAccepted && (
          <Card className="mb-8 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="pt-8 pb-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-green-700 mb-2">
                  Děkujeme za potvrzení! 🎉
                </h2>
                <p className="text-green-600">
                  Vaše potvrzení bylo úspěšně zaznamenáno. Na váš email jsme odeslali souhrn.
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-white/60 border border-green-200 space-y-4">
                <p className="text-xs font-semibold text-green-800 uppercase tracking-wide">
                  📋 Souhrn potvrzené změny
                </p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Zakázka:</span>
                    <span className="font-medium">{offer.engagement_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Typ změny:</span>
                    <span className="font-medium">{getChangeLabel()}</span>
                  </div>
                  {totalMonthlyPrice > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Měsíční cena:</span>
                      <span className="font-semibold">{totalMonthlyPrice.toLocaleString('cs-CZ')} CZK</span>
                    </div>
                  )}
                  {offer.client_chosen_effective_from && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Začátek platnosti:</span>
                        <span className="font-medium">
                          {format(new Date(offer.client_chosen_effective_from), 'd. MMMM yyyy', { locale: cs })}
                        </span>
                      </div>
                      {totalMonthlyPrice > 0 && (() => {
                        const d = new Date(offer.client_chosen_effective_from);
                        const dim = getDaysInMonth(d);
                        const rd = dim - getDate(d) + 1;
                        const pro = Math.round((totalMonthlyPrice / dim) * rd);
                        if (rd < dim) {
                          return (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Fakturace za {format(d, 'LLLL', { locale: cs })}:</span>
                              <span className="font-medium">{pro.toLocaleString('cs-CZ')} CZK ({rd}/{dim} dní)</span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </>
                  )}
                </div>

                <div className="border-t border-green-200 pt-3 space-y-2 text-sm text-green-700">
                  {offer.client_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" />
                      <span>Potvrzení odesláno na: <strong>{offer.client_email}</strong></span>
                    </div>
                  )}
                  {offer.client_approved_at && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Potvrzeno: {format(new Date(offer.client_approved_at), "d. MMMM yyyy 'v' HH:mm", { locale: cs })}</span>
                    </div>
                  )}
                </div>

                {/* Onboarding form CTA for new engagement with different SRO */}
                {offer.request_type === 'new_engagement' && (() => {
                  const c = offer.proposed_changes as unknown as NewEngagementProposedChanges;
                  return c.is_different_sro && c.send_onboarding_form;
                })() && (
                  <div className="border-t border-green-200 pt-4 mt-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center space-y-3">
                      <p className="text-amber-800 font-semibold">
                        📋 Ještě jeden krok – vyplňte fakturační údaje
                      </p>
                      <p className="text-amber-700 text-sm">
                        Pro novou právní entitu potřebujeme vaše fakturační údaje (IČO, DIČ, adresa) a kontaktní osobu.
                      </p>
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={() => window.location.href = `/modification-onboarding/${offer.id}`}
                      >
                        <Building2 className="h-4 w-4 mr-2" />
                        Vyplnit fakturační údaje
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expired state */}
        {isExpired && !isAccepted && (
          <Card className="mb-8 border-destructive/50 bg-destructive/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-destructive">
                <AlertCircle className="h-8 w-8" />
                <div>
                  <h2 className="font-semibold text-lg">Nabídka vypršela</h2>
                  <p className="text-sm">
                    Platnost této nabídky skončila {offer.upgrade_offer_valid_until && format(new Date(offer.upgrade_offer_valid_until), 'd. MMMM yyyy', { locale: cs })}.
                    Kontaktujte nás pro novou nabídku.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Change details card(s) */}
        {isBundled ? (
          <>
            {offer.items!.map((item, idx) => (
              <Card key={item.id} className="mb-4">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline">{idx + 1}.</Badge>
                    <h2 className="font-semibold">{
                      item.request_type === 'add_service' ? 'Přidání nové služby' :
                      item.request_type === 'update_service_price' ? 'Změna ceny služby' :
                      item.request_type === 'deactivate_service' ? 'Ukončení služby' :
                      item.request_type === 'expand_country' ? 'Rozšíření do nové země' :
                      'Změna'
                    }</h2>
                  </div>
                  {renderChangeDetailsForItem(item.request_type, item.proposed_changes, item.pricing_snapshot?.colleague_rewards)}
                </CardContent>
              </Card>
            ))}
            {/* Combined total */}
            <Card className="mb-8 border-primary/30 bg-primary/5">
              <CardContent className="pt-6">
                {(() => {
                  let total = 0;
                  for (const item of offer.items!) {
                    const c = item.proposed_changes as any;
                    if (item.request_type === 'add_service' || item.request_type === 'expand_country') total += c.price || 0;
                    else if (item.request_type === 'update_service_price') total += c.new_price || 0;
                  }
                  const discountPercent = (offer as any).bundle_discount_percent || 0;
                  const discountAmount = discountPercent > 0 ? Math.round(total * discountPercent / 100) : 0;
                  const finalPrice = total - discountAmount;
                  return (
                    <div className="space-y-2">
                      {discountPercent > 0 && (
                        <>
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span>Celkem bez slevy</span>
                            <span className="line-through">{total.toLocaleString('cs-CZ')} CZK/měs</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1.5">
                              🏷️ Sleva za balíček ({discountPercent} %)
                            </span>
                            <span className="font-medium text-primary">-{discountAmount.toLocaleString('cs-CZ')} CZK</span>
                          </div>
                          <p className="text-xs text-muted-foreground italic">
                            Sleva se vztahuje na odběr všech služeb v balíčku najednou. Při odběru jednotlivých služeb se uplatňují standardní ceny.
                          </p>
                        </>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-lg">
                          {discountPercent > 0 ? 'Celkem po slevě' : 'Celkem měsíčně'}
                        </span>
                        <span className="font-bold text-xl text-primary">
                          {finalPrice.toLocaleString('cs-CZ')} CZK/měs
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-6">
                {getChangeIcon()}
                <h2 className="font-semibold">{getChangeLabel()}</h2>
              </div>
              {renderChangeDetails()}
            </CardContent>
          </Card>
        )}

        {/* Confirmation form */}
        {!isAccepted && !isExpired && (
          <Card>
            <CardContent className="pt-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Check className="h-5 w-5" />
                Potvrzení změny
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Date picker */}
                <div className="space-y-2">
                  <Label>Požadovaný začátek platnosti</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, 'd. MMMM yyyy', { locale: cs }) : 'Vyberte datum'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Prorated calculation */}
                {prorationCalc && totalMonthlyPrice > 0 && (
                  <Alert className="bg-primary/5 border-primary/20">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="space-y-1">
                      {prorationCalc.isFullMonth ? (
                        <p>
                          <strong>Fakturace za {prorationCalc.monthName}:</strong>{' '}
                          {totalMonthlyPrice.toLocaleString('cs-CZ')} CZK (celý měsíc)
                        </p>
                      ) : (
                        <>
                          <p>
                            <strong>Fakturace za {prorationCalc.monthName}:</strong>{' '}
                            {prorationCalc.proratedAmount.toLocaleString('cs-CZ')} CZK{' '}
                            ({prorationCalc.remainingDays} dní z {prorationCalc.daysInMonth})
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Od dalšího měsíce: plná měsíční cena {totalMonthlyPrice.toLocaleString('cs-CZ')} CZK
                          </p>
                        </>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Váš email (pro zaslání potvrzení)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vas@email.cz"
                    required
                  />
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="agree"
                    checked={agreedToChange}
                    onCheckedChange={(checked) => setAgreedToChange(checked === true)}
                  />
                  <Label htmlFor="agree" className="text-sm leading-relaxed cursor-pointer">
                    Souhlasím s touto změnou spolupráce
                  </Label>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={!email || !agreedToChange || isSubmitting || !selectedDate}
                >
                  {isSubmitting ? 'Potvrzuji...' : 'Potvrdit změnu'}
                </Button>
                
                {offer.upgrade_offer_valid_until && (
                  <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                    <Clock className="h-3 w-3" />
                    Platnost nabídky: do {format(new Date(offer.upgrade_offer_valid_until), 'd. MMMM yyyy', { locale: cs })}
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        )}

      </main>
    </div>
  );
}
