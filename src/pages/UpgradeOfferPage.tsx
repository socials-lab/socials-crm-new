import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { Check, Clock, Mail, Phone, AlertCircle, Package, DollarSign, X as XIcon, CheckCircle2, Calendar, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  getUpgradeOfferByToken, 
  acceptUpgradeOffer,
  isOfferValid,
  calculateProratedAmount,
} from '@/data/upgradeOffersMockData';
import type { EngagementUpgradeOffer } from '@/types/upgradeOffer';
import type { AddServiceProposedChanges, UpdateServicePriceProposedChanges, DeactivateServiceProposedChanges } from '@/types/crm';
import socialsLogo from '@/assets/socials-logo.png';

export default function UpgradeOfferPage() {
  const { token } = useParams<{ token: string }>();
  const [offer, setOffer] = useState<EngagementUpgradeOffer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [agreedToChange, setAgreedToChange] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);

  useEffect(() => {
    if (token) {
      const foundOffer = getUpgradeOfferByToken(token);
      setOffer(foundOffer);
      if (foundOffer?.status === 'accepted') {
        setIsAccepted(true);
      }
    }
    setIsLoading(false);
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offer || !email || !agreedToChange) return;

    setIsSubmitting(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const result = acceptUpgradeOffer(offer.token, email);
    
    if (result) {
      setOffer(result);
      setIsAccepted(true);
      toast.success('Změna byla úspěšně potvrzena');
    } else {
      toast.error('Nepodařilo se potvrdit změnu. Nabídka možná vypršela.');
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

  const isExpired = !isOfferValid(offer) && offer.status !== 'accepted';

  // Get change-specific icon and label
  const getChangeIcon = () => {
    switch (offer.change_type) {
      case 'add_service': return <Package className="h-5 w-5" />;
      case 'update_service_price': return <DollarSign className="h-5 w-5" />;
      case 'deactivate_service': return <XIcon className="h-5 w-5" />;
    }
  };

  const getChangeLabel = () => {
    switch (offer.change_type) {
      case 'add_service': return 'Přidání nové služby';
      case 'update_service_price': return 'Změna ceny služby';
      case 'deactivate_service': return 'Ukončení služby';
    }
  };

  // Render change details based on type
  const renderChangeDetails = () => {
    const changes = offer.proposed_changes;
    
    switch (offer.change_type) {
      case 'add_service': {
        const c = changes as AddServiceProposedChanges;
        const prorationInfo = offer.new_monthly_price && offer.effective_from
          ? calculateProratedAmount(offer.new_monthly_price, offer.effective_from)
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
                    Tier: {c.selected_tier.toUpperCase()}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Měsíční cena:</span>
                <span className="font-semibold text-lg">
                  {c.price.toLocaleString('cs-CZ')} {c.currency}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Platnost od:
                </span>
                <span className="font-medium">
                  {format(new Date(offer.effective_from), 'd. MMMM yyyy', { locale: cs })}
                </span>
              </div>
            </div>
            
            {prorationInfo && (
              <Alert className="bg-primary/5 border-primary/20">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Fakturace za {format(new Date(offer.effective_from), 'LLLL', { locale: cs })}:</strong>{' '}
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
        const c = changes as UpdateServicePriceProposedChanges;
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
                  {c.old_price.toLocaleString('cs-CZ')} {c.currency}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Nová cena:</span>
                <span className="font-semibold text-lg text-primary">
                  {c.new_price.toLocaleString('cs-CZ')} {c.currency}
                </span>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Platnost od:
                </span>
                <span className="font-medium">
                  {format(new Date(offer.effective_from), 'd. MMMM yyyy', { locale: cs })}
                </span>
              </div>
            </div>
          </div>
        );
      }
      
      case 'deactivate_service': {
        const c = changes as DeactivateServiceProposedChanges;
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
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Ukončení od:
                </span>
                <span className="font-medium">
                  {format(new Date(offer.effective_from), 'd. MMMM yyyy', { locale: cs })}
                </span>
              </div>
            </div>
          </div>
        );
      }
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
          <Card className="mb-8 border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-8 w-8" />
                <div>
                  <h2 className="font-semibold text-lg">Změna potvrzena</h2>
                  <p className="text-sm text-green-600 dark:text-green-500">
                    Děkujeme za potvrzení. Budeme vás informovat o dalších krocích.
                  </p>
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
                    Platnost této nabídky skončila {format(new Date(offer.valid_until), 'd. MMMM yyyy', { locale: cs })}.
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
            Pro: <span className="font-medium text-foreground">{offer.client_name}</span>
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
                
                <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3" />
                  Platnost nabídky: do {format(new Date(offer.valid_until), 'd. MMMM yyyy', { locale: cs })}
                </p>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Contact section */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">Máte dotazy? Kontaktujte mě</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
            <span className="font-medium">{offer.contact_name}</span>
            <a 
              href={`mailto:${offer.contact_email}`} 
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <Mail className="h-4 w-4" />
              {offer.contact_email}
            </a>
            {offer.contact_phone && (
              <a 
                href={`tel:${offer.contact_phone}`} 
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <Phone className="h-4 w-4" />
                {offer.contact_phone}
              </a>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
