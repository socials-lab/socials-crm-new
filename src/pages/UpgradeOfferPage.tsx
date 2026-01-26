import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format, getDaysInMonth } from 'date-fns';
import { cs } from 'date-fns/locale';
import { Check, Clock, AlertCircle, Package, DollarSign, X as XIcon, CheckCircle2, Calendar, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  getModificationRequestByToken, 
  clientAcceptOffer,
  type StoredModificationRequest 
} from '@/data/modificationRequestsMockData';
import type { AddServiceProposedChanges, UpdateServicePriceProposedChanges, DeactivateServiceProposedChanges } from '@/types/crm';
import socialsLogo from '@/assets/socials-logo.png';

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

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    // Fetch from localStorage
    const request = getModificationRequestByToken(token);
    setOffer(request);
    setIsLoading(false);
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offer || !email || !agreedToChange || !token) return;

    setIsSubmitting(true);
    
    try {
      const updatedOffer = clientAcceptOffer(token, email);
      
      if (updatedOffer) {
        setOffer(updatedOffer);
        toast.success('Změna byla úspěšně potvrzena');
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

  // Get change-specific icon and label
  const getChangeIcon = () => {
    switch (offer.request_type) {
      case 'add_service': return <Package className="h-5 w-5" />;
      case 'update_service_price': return <DollarSign className="h-5 w-5" />;
      case 'deactivate_service': return <XIcon className="h-5 w-5" />;
      default: return <Package className="h-5 w-5" />;
    }
  };

  const getChangeLabel = () => {
    switch (offer.request_type) {
      case 'add_service': return 'Přidání nové služby';
      case 'update_service_price': return 'Změna ceny služby';
      case 'deactivate_service': return 'Ukončení služby';
      default: return 'Změna';
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
          </div>
        );
      }
      
      default:
        return <p>Detaily změny nejsou k dispozici</p>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-3xl mx-auto px-4 py-4 flex items-center justify-center">
          <img src={socialsLogo} alt="Socials.cz" className="h-8" />
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-4 py-8">
        {/* Success state */}
        {isAccepted && (
          <Card className="mb-8 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-800">
            <CardContent className="pt-8 pb-8">
              {/* Big success icon and thank you */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/50 mb-4">
                  <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">
                  Děkujeme za potvrzení! 🎉
                </h2>
                <p className="text-green-600 dark:text-green-500">
                  Vaše potvrzení bylo úspěšně zaznamenáno. Budeme vás informovat o dalších krocích.
                </p>
              </div>
              
              {/* Confirmation details */}
              <div className="p-4 rounded-lg bg-white/60 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
                <p className="text-xs font-semibold text-green-800 dark:text-green-300 mb-3 uppercase tracking-wide">
                  📋 Detail potvrzení
                </p>
                <div className="space-y-2 text-sm text-green-700 dark:text-green-400">
                  {offer.client_email && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{offer.client_email}</span>
                    </div>
                  )}
                  {offer.client_approved_at && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Potvrzeno:</span>
                      <span className="font-medium">
                        {format(new Date(offer.client_approved_at), "d. MMMM yyyy 'v' HH:mm:ss", { locale: cs })}
                      </span>
                    </div>
                  )}
                </div>
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

        {/* Main content */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Návrh úpravy spolupráce</h1>
          <p className="text-muted-foreground">
            Pro: <span className="font-medium text-foreground">{clientName}</span>
            {' – '}
            <span className="font-medium text-foreground">{offer.engagement_name}</span>
          </p>
        </div>

        {/* Change details card */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-6">
              {getChangeIcon()}
              <h2 className="font-semibold">{getChangeLabel()}</h2>
            </div>
            
            {renderChangeDetails()}
          </CardContent>
        </Card>

        {/* Confirmation form */}
        {!isAccepted && !isExpired && (
          <Card>
            <CardContent className="pt-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Check className="h-5 w-5" />
                Potvrzení změny
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Váš email</Label>
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
                  disabled={!email || !agreedToChange || isSubmitting}
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

        {/* Contact section */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Máte dotazy? Kontaktujte nás na info@socials.cz</p>
        </div>
      </main>
    </div>
  );
}
