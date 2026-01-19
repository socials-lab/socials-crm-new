import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ExternalLink, 
  Calendar, 
  FileText, 
  Building2,
  CheckCircle2,
  Users,
  Award,
  BarChart3,
  Headphones,
  ArrowRight,
  Play,
  Presentation,
  BookOpen,
  Video,
  Package,
  Clock,
  Rocket,
  ClipboardList,
  FileSignature,
  UserCheck,
  Phone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PublicOfferService, PublicOffer, PortfolioLink } from '@/types/publicOffer';
import socialsLogo from '@/assets/socials-logo.png';
import { getPublicOfferByToken, incrementOfferView } from '@/data/publicOffersMockData';

// Value proposition items
const VALUE_PROPS = [
  {
    icon: Users,
    title: '🎯 150+ spokojených klientů',
    description: 'Pomáháme firmám růst online už 8 let',
  },
  {
    icon: Award,
    title: '🏆 Certifikovaní specialisté',
    description: 'Meta Business Partner & Google Partner',
  },
  {
    icon: BarChart3,
    title: '📊 Transparentní reporting',
    description: 'Měsíční reporty s jasnými KPIs',
  },
  {
    icon: Headphones,
    title: '🤝 Dedikovaný account manager',
    description: 'Vždy víte, na koho se obrátit',
  },
];

// Portfolio icon by type
function getPortfolioIcon(type: PortfolioLink['type']) {
  switch (type) {
    case 'case_study':
      return BookOpen;
    case 'presentation':
      return Presentation;
    case 'video':
      return Video;
    default:
      return FileText;
  }
}

// Process steps for "How it works" section
const PROCESS_STEPS = [
  {
    number: 1,
    icon: ClipboardList,
    title: '📝 Vyplníte krátký formulář',
    description: 'Základní údaje pro přípravu smlouvy (5 min)',
  },
  {
    number: 2,
    icon: FileSignature,
    title: '⚡ Připravíme vám smlouvu',
    description: 'Do 5 minut obdržíte smlouvu k podpisu',
  },
  {
    number: 3,
    icon: UserCheck,
    title: '👋 Spojí se s vámi account manager',
    description: 'Představí se kolega, který bude mít váš projekt na starosti',
  },
  {
    number: 4,
    icon: Phone,
    title: '🚀 Onboarding call a start',
    description: 'Domluvíme si úvodní hovor a můžeme začít',
  },
];

function ServiceCard({ service }: { service: PublicOfferService }) {
  const [isOpen, setIsOpen] = useState(true); // Default open to show details

  // Use deliverables if available, otherwise parse offer_description
  const hasDeliverables = service.deliverables && service.deliverables.length > 0;
  const hasRequirements = service.requirements && service.requirements.length > 0;
  const hasDetails = hasDeliverables || service.offer_description || service.frequency || service.start_timeline;

  // Parse offer description into bullet points if no deliverables
  const descriptionLines = !hasDeliverables 
    ? (service.offer_description?.split('\n').filter(line => line.trim().length > 0) || [])
    : [];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-lg">{service.name}</p>
                  {service.selected_tier && (
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs uppercase font-medium",
                        service.selected_tier === 'elite' && "border-amber-500 text-amber-600 bg-amber-50",
                        service.selected_tier === 'pro' && "border-primary text-primary bg-primary/5",
                        service.selected_tier === 'growth' && "border-emerald-500 text-emerald-600 bg-emerald-50",
                      )}
                    >
                      {service.selected_tier}
                    </Badge>
                  )}
                </div>
                {service.description && (
                  <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="font-bold text-xl">
                  {service.price.toLocaleString('cs-CZ')} {service.currency}
                </span>
                <span className="text-sm text-muted-foreground ml-1">
                  {service.billing_type === 'monthly' ? '/měs' : ''}
                </span>
              </div>
              {hasDetails && (
                <ChevronDown
                  className={cn(
                    'h-5 w-5 text-muted-foreground transition-transform',
                    isOpen && 'rotate-180'
                  )}
                />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        
        {hasDetails && (
          <CollapsibleContent>
            <div className="px-5 pb-5 space-y-4">
              {/* What you get (deliverables) */}
              {(hasDeliverables || descriptionLines.length > 0) && (
                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Co dostanete:</p>
                  </div>
                  <ul className="space-y-2">
                    {(hasDeliverables ? service.deliverables! : descriptionLines).map((item, idx) => {
                      const cleanItem = item.replace(/^[-•*]\s*/, '');
                      return (
                        <li key={idx} className="flex items-start gap-2 text-sm text-emerald-800 dark:text-emerald-200">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span>{cleanItem}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Frequency and turnaround */}
              {(service.frequency || service.turnaround) && (
                <div className="flex flex-wrap gap-3">
                  {service.frequency && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{service.frequency}</span>
                    </div>
                  )}
                  {service.turnaround && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-sm">
                      <Rocket className="h-4 w-4 text-muted-foreground" />
                      <span>{service.turnaround}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Start timeline */}
              {service.start_timeline && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-sm">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-medium text-primary">Start: {service.start_timeline}</span>
                </div>
              )}

              {/* Requirements from client */}
              {hasRequirements && (
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                  <div className="flex items-center gap-2 mb-3">
                    <ClipboardList className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Co od vás budeme potřebovat:</p>
                  </div>
                  <ul className="space-y-2">
                    {service.requirements!.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-200">
                        <span className="text-amber-600 dark:text-amber-400">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CollapsibleContent>
        )}
      </div>
    </Collapsible>
  );
}

function NextStepsSection({ estimatedStart }: { estimatedStart?: string }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg md:text-xl font-bold mb-4 text-center">🔄 Jak to funguje?</h2>
      
      {/* Timeline for desktop */}
      <div className="hidden md:block relative">
        {/* Connecting line */}
        <div className="absolute top-7 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-200 dark:from-emerald-800 dark:via-emerald-600 dark:to-emerald-800" />
        
        <div className="grid grid-cols-4 gap-3">
          {PROCESS_STEPS.map((step, idx) => (
            <div key={idx} className="relative text-center">
              {/* Step circle */}
              <div className="relative z-10 w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md">
                <step.icon className="h-6 w-6 text-white" />
              </div>
              
              {/* Step number */}
              <div className="absolute top-0 right-1/2 translate-x-9 -translate-y-0.5 w-5 h-5 rounded-full bg-background border-2 border-emerald-500 flex items-center justify-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                {step.number}
              </div>
              
              {/* Content */}
              <div className="mt-3">
                <p className="font-semibold text-sm mb-0.5">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Timeline for mobile */}
      <div className="md:hidden space-y-3">
        {PROCESS_STEPS.map((step, idx) => (
          <div key={idx} className="flex gap-3">
            {/* Left side - line and circle */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-sm shrink-0">
                <step.icon className="h-4 w-4 text-white" />
              </div>
              {idx < PROCESS_STEPS.length - 1 && (
                <div className="w-0.5 flex-1 bg-gradient-to-b from-emerald-400 to-emerald-200 dark:from-emerald-600 dark:to-emerald-800 mt-1" />
              )}
            </div>
            
            {/* Right side - content */}
            <div className="pb-4 pt-0.5">
              <p className="font-semibold text-sm">{step.title}</p>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Estimated time */}
      <div className="mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center">
        <div className="flex items-center justify-center gap-2 text-sm">
          <span>⏱️</span>
          <span className="font-medium text-emerald-700 dark:text-emerald-300">
            {estimatedStart || 'Od vyplnění formuláře ke startu: cca 3-5 pracovních dnů'}
          </span>
        </div>
      </div>
    </section>
  );
}

function PortfolioCard({ link }: { link: PortfolioLink }) {
  const Icon = getPortfolioIcon(link.type);
  
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 p-4 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all"
    >
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate group-hover:text-primary transition-colors">
          {link.title}
        </p>
        <p className="text-xs text-muted-foreground capitalize">
          {link.type === 'case_study' && 'Case Study'}
          {link.type === 'presentation' && 'Prezentace'}
          {link.type === 'reference' && 'Reference'}
          {link.type === 'video' && 'Video'}
        </p>
      </div>
      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </a>
  );
}

export default function PublicOfferPage({ testToken }: { testToken?: string }) {
  const params = useParams<{ token: string }>();
  const rawToken = testToken || params.token || '';
  
  // Normalize token - remove whitespace, decode URI, remove trailing slashes
  const token = decodeURIComponent(rawToken).trim().replace(/\/+$/, '');
  
  const [offer, setOffer] = useState<PublicOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function fetchOffer() {
      // Check for invalid/placeholder tokens
      if (!token || token === ':token' || token.length < 3) {
        setError('Neplatný odkaz na nabídku');
        setLoading(false);
        return;
      }

      // Fetch from mock store
      const foundOffer = getPublicOfferByToken(token);

      if (!foundOffer) {
        setError('Nabídka nebyla nalezena nebo již není platná');
        setLoading(false);
        return;
      }

      setOffer(foundOffer);

      // Track view in mock store
      incrementOfferView(token);
      
      setLoading(false);
    }

    fetchOffer();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex justify-center mb-8">
            <Skeleton className="h-12 w-32" />
          </div>
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-12 w-64 mx-auto mb-8" />
          <Skeleton className="h-32 w-full mb-4" />
          <Skeleton className="h-24 w-full mb-4" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="mb-6">
            <img src={socialsLogo} alt="Socials" className="h-10 mx-auto" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">Nabídka není dostupná</h1>
          <p className="text-muted-foreground mb-4">
            {error || 'Tato nabídka neexistuje nebo již není platná.'}
          </p>
          
          {/* Debug info */}
          <div className="mt-6 p-3 rounded bg-muted text-xs text-left">
            <p><strong>Debug:</strong></p>
            <p>Raw token: <code>{rawToken || '(prázdný)'}</code></p>
            <p>Normalized: <code>{token || '(prázdný)'}</code></p>
          </div>
          
          {/* Link to test offer */}
          <div className="mt-4">
            <a 
              href="/offer/test-nabidka-123"
              className="text-primary hover:underline text-sm"
            >
              → Otevřít testovací nabídku
            </a>
          </div>
        </div>
      </div>
    );
  }

  const isExpired = offer.valid_until && new Date(offer.valid_until) < new Date();
  const totalMonthly = offer.services
    .filter(s => s.billing_type === 'monthly')
    .reduce((sum, s) => sum + s.price, 0);
  const totalOneOff = offer.services
    .filter(s => s.billing_type === 'one_off')
    .reduce((sum, s) => sum + s.price, 0);

  const onboardingUrl = `/onboarding/${offer.lead_id}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <img src={socialsLogo} alt="Socials" className="h-8" />
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link to={onboardingUrl}>
              Zahájit spolupráci
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 md:py-10">
        {/* Hero Section */}
        <section className="text-center mb-8">
          <p className="text-muted-foreground mb-2 text-sm uppercase tracking-wider">
            👋 Nabídka připravená speciálně pro
          </p>
          <h1 className="text-2xl md:text-4xl font-bold mb-2 flex items-center justify-center gap-2">
            <Building2 className="h-6 w-6 md:h-8 md:w-8 text-emerald-600" />
            {offer.company_name}
          </h1>
          <p className="text-muted-foreground text-sm">
            Připraveno pro: <span className="font-medium text-foreground">{offer.contact_name}</span>
          </p>
          
          {/* Validity badge */}
          {offer.valid_until && !isExpired && (
            <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full bg-muted text-xs">
              <span>📅</span>
              <span className="text-muted-foreground">
                Platí do: {new Date(offer.valid_until).toLocaleDateString('cs-CZ', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}
        </section>

        {/* Validity warning */}
        {isExpired && (
          <div className="mb-8 p-4 rounded-xl border border-destructive/50 bg-destructive/10 text-center">
            <p className="text-destructive font-medium">
              ⚠️ Platnost této nabídky vypršela
            </p>
          </div>
        )}

        {/* Value Proposition */}
        <section className="mb-8">
          <h2 className="text-lg md:text-xl font-bold mb-3 text-center">✨ Proč spolupracovat se Socials?</h2>
          <div className="grid grid-cols-2 gap-3">
            {VALUE_PROPS.map((prop, idx) => (
              <div 
                key={idx}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                  <prop.icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{prop.title}</p>
                  <p className="text-xs text-muted-foreground">{prop.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Audit Summary */}
        {offer.audit_summary && (
          <section className="mb-6">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              📊 Výstup z auditu
            </h2>
            <div className="p-4 rounded-lg border bg-card">
              <p className="text-muted-foreground text-sm whitespace-pre-line leading-relaxed">
                {offer.audit_summary}
              </p>
            </div>
          </section>
        )}

        {/* Services */}
        <section className="mb-8">
          <h2 className="text-lg md:text-xl font-bold mb-3 flex items-center gap-2">
            📦 Služby v nabídce
          </h2>
          <div className="space-y-3">
            {offer.services.map((service, idx) => (
              <ServiceCard key={service.id || idx} service={service} />
            ))}
          </div>
        </section>

        {/* Portfolio Section */}
        {offer.portfolio_links && offer.portfolio_links.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              🎨 Ukázky naší práce
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {offer.portfolio_links.map((link) => (
                <PortfolioCard key={link.id} link={link} />
              ))}
            </div>
          </section>
        )}

        {/* Pricing Summary */}
        <section className="mb-6">
          <div className="p-4 md:p-5 rounded-xl border bg-gradient-to-br from-muted/30 to-muted/50">
            <h3 className="text-lg font-semibold mb-3 text-center">💰 Souhrn nabídky</h3>
            <div className="space-y-2">
              {totalMonthly > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
                  <span className="text-muted-foreground text-sm">Měsíční poplatek</span>
                  <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {totalMonthly.toLocaleString('cs-CZ')} {offer.currency}
                    <span className="text-sm font-normal text-muted-foreground">/měs</span>
                  </span>
                </div>
              )}
              {totalOneOff > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
                  <span className="text-muted-foreground text-sm">Jednorázově</span>
                  <span className="text-lg font-bold">
                    {totalOneOff.toLocaleString('cs-CZ')} {offer.currency}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Custom Note */}
        {offer.custom_note && (
          <section className="mb-6">
            <div className="p-4 rounded-lg border bg-card">
              <p className="text-muted-foreground text-sm whitespace-pre-line italic">
                💬 "{offer.custom_note}"
              </p>
            </div>
          </section>
        )}

        {/* Notion Link */}
        {offer.notion_url && (
          <section className="mb-6">
            <a
              href={offer.notion_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors group"
            >
              <span>📄</span>
              <span className="font-medium text-emerald-700 dark:text-emerald-300 text-sm">Detailní nabídka a vysvětlení</span>
              <ExternalLink className="h-3 w-3 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </section>
        )}

        {/* How it works / Next Steps */}
        <NextStepsSection estimatedStart={offer.estimated_start_date} />

        {/* CTA Section */}
        <section className="mb-8">
          <div className="p-5 md:p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200/50 dark:border-emerald-800 text-center">
            <h2 className="text-xl md:text-2xl font-bold mb-2">
              🚀 Připraveni začít?
            </h2>
            <p className="mb-4 text-muted-foreground max-w-md mx-auto text-sm">
              Vyplňte krátký formulář a do 5 minut vám připravíme smlouvu k podpisu ✨
            </p>
            <Button 
              asChild 
              size="lg" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8"
            >
              <Link to={onboardingUrl}>
                <Play className="h-5 w-5 mr-2" />
                Zahájit spolupráci
              </Link>
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              ⏱️ Zabere to jen 5 minut
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center pt-8 border-t">
          <img src={socialsLogo} alt="Socials" className="h-6 mx-auto mb-3 opacity-50" />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Socials. Všechna práva vyhrazena.
          </p>
        </footer>
      </main>

      {/* Sticky CTA for mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-background/95 backdrop-blur border-t shadow-lg sm:hidden safe-area-bottom">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-bold text-emerald-600 dark:text-emerald-400">{(totalMonthly + totalOneOff).toLocaleString('cs-CZ')} {offer.currency}</p>
            <p className="text-xs text-muted-foreground">celkem</p>
          </div>
          <Button asChild className="flex-1 max-w-[180px] bg-emerald-600 hover:bg-emerald-700">
            <Link to={onboardingUrl}>
              <Play className="h-4 w-4 mr-2" />
              Zahájit 🚀
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
