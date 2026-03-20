import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AspectRatio } from '@/components/ui/aspect-ratio';
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
  Mail,
  MessageCircle,
  Copy,
  Check,
  Share2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PublicOfferService, PublicOffer, PortfolioLink } from '@/types/publicOffer';
import socialsLogo from '@/assets/socials-logo.png';
import { supabase } from '@/integrations/supabase/client';

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

// Get emoji based on service name/type
function getServiceEmoji(serviceName: string): string {
  const name = serviceName.toLowerCase();
  
  // Meta / Facebook / Instagram
  if (name.includes('meta') || name.includes('facebook') || name.includes('instagram')) {
    return '📘';
  }
  // Google / Search / PPC
  if (name.includes('google') || name.includes('search') || name.includes('ppc') || name.includes('ads')) {
    return '🔎';
  }
  // TikTok
  if (name.includes('tiktok')) {
    return '🎵';
  }
  // LinkedIn
  if (name.includes('linkedin')) {
    return '💼';
  }
  // Creative / Design / Grafika
  if (name.includes('kreativ') || name.includes('creative') || name.includes('design') || name.includes('grafik')) {
    return '🎨';
  }
  // Video / Reels
  if (name.includes('video') || name.includes('reels')) {
    return '🎬';
  }
  // Analytics / Reporting
  if (name.includes('analytic') || name.includes('report') || name.includes('měření')) {
    return '📊';
  }
  // Strategy / Consulting
  if (name.includes('strateg') || name.includes('consult') || name.includes('poradenství')) {
    return '🧠';
  }
  // Email / Newsletter
  if (name.includes('email') || name.includes('newsletter') || name.includes('mailing')) {
    return '📧';
  }
  // SEO
  if (name.includes('seo')) {
    return '🔗';
  }
  // Social / Community
  if (name.includes('social') || name.includes('community') || name.includes('správa')) {
    return '💬';
  }
  // E-commerce / Shoptet
  if (name.includes('ecommerce') || name.includes('e-commerce') || name.includes('shoptet') || name.includes('eshop')) {
    return '🛒';
  }
  // Default
  return '✨';
}

// Process steps for "How it works" section - compact version
const PROCESS_STEPS = [
  {
    number: 1,
    icon: ClipboardList,
    title: 'Vyplníte formulář',
    description: '5 minut',
  },
  {
    number: 2,
    icon: FileSignature,
    title: 'Smlouva k podpisu',
    description: 'Do 24 hodin',
  },
  {
    number: 3,
    icon: Phone,
    title: 'Onboarding a start',
    description: 'Jdeme na to',
  },
];

function ServiceCard({ service, showTypeLabel = false }: { service: PublicOfferService; showTypeLabel?: boolean }) {
  const [isOpen, setIsOpen] = useState(false); // Default closed

  // Use deliverables if available, otherwise parse offer_description
  const hasDeliverables = service.deliverables && service.deliverables.length > 0;
  const hasRequirements = service.requirements && service.requirements.length > 0;
  const hasDetailedSections = service.detailed_sections && service.detailed_sections.length > 0;
  const hasDetails = hasDeliverables || service.offer_description || service.frequency || service.start_timeline || hasDetailedSections || hasRequirements;

  // Parse offer description into bullet points if no deliverables
  const descriptionLines = !hasDeliverables 
    ? (service.offer_description?.split('\n').filter(line => line.trim().length > 0) || [])
    : [];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-2xl">
                {getServiceEmoji(service.name)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-lg">{service.name}</p>
                  {/* Tier badge for core services */}
                  {service.service_type === 'core' && service.selected_tier && (
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
                  {/* Add-on badge */}
                  {service.service_type === 'addon' && (
                    <Badge variant="outline" className="text-xs">
                      Doplněk
                    </Badge>
                  )}
                  {/* Legacy: show tier if service_type not set */}
                  {!service.service_type && service.selected_tier && (
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
            <div className="px-6 pb-6 space-y-4">
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

              {/* Detailed sections (second-level expandable) */}
              {hasDetailedSections && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground">Podrobný rozpis</p>
                  {service.detailed_sections!.map((section, sectionIdx) => (
                    <Collapsible key={sectionIdx}>
                      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors [&[data-state=open]>svg]:rotate-180">
                        <span className="text-lg">{section.emoji || '📌'}</span>
                        <span className="text-sm font-medium">{section.title || 'Sekce'}</span>
                        <ChevronDown className="h-4 w-4 ml-auto shrink-0 transition-transform" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <ul className="mt-2 pl-4 space-y-1.5 border-l-2 border-muted ml-2">
                          {(section.items || []).filter(Boolean).map((item, itemIdx) => (
                            <li key={itemIdx} className="text-sm text-muted-foreground py-0.5">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              )}
            </div>
          </CollapsibleContent>
        )}
      </div>
    </Collapsible>
  );
}

function ServiceStructureExplanation() {
  return (
    <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 mb-4">
      <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
        📦 Jak strukturujeme naše služby
      </h3>
      
      <div className="space-y-3 text-sm">
        {/* Core služby */}
        <div className="flex items-start gap-3">
          <Badge className="bg-primary/20 text-primary border-primary/30 shrink-0 mt-0.5 w-20 justify-center">Core</Badge>
          <div>
            <p className="font-medium">Hlavní služby</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Základní pilíře vaší online strategie. Core služby jsou rozděleny do úrovní{' '}
              <span className="font-medium text-emerald-600">GROWTH</span>,{' '}
              <span className="font-medium text-primary">PRO</span> a{' '}
              <span className="font-medium text-amber-600">ELITE</span>{' '}
              podle rozsahu správy a výše spravovaného rozpočtu.
            </p>
          </div>
        </div>
        
        {/* Add-on služby */}
        <div className="flex items-start gap-3">
          <Badge variant="outline" className="shrink-0 mt-0.5 w-20 justify-center">Doplněk</Badge>
          <div>
            <p className="font-medium">Doplňkové služby</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Rozšíření k hlavním službám pro maximální efektivitu.{' '}
              <span className="font-medium text-foreground">Doplňky nelze využívat samostatně</span> – 
              vždy fungují jako rozšíření k některé z Core služeb.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function NextStepsSection() {
  return (
    <section className="mb-10">
      <p className="text-xs text-muted-foreground text-center mb-3">Jak to probíhá?</p>
      
      {/* Timeline: horizontal scroll on narrow screens, row on sm+ */}
      <div className="w-full overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
        <div className="flex min-w-[520px] items-stretch justify-between gap-3 px-2 sm:min-w-0">
        {PROCESS_STEPS.map((step, idx) => (
          <div key={idx} className="flex min-w-[4.5rem] flex-1 items-center gap-2 sm:min-w-0">
            <div className="flex flex-1 flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-1">
                <step.icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-xs font-medium leading-tight">{step.title}</p>
              <p className="text-[10px] text-muted-foreground">{step.description}</p>
            </div>
            {idx < PROCESS_STEPS.length - 1 && (
              <ArrowRight className="hidden h-3 w-3 shrink-0 text-muted-foreground/50 sm:block" />
            )}
          </div>
        ))}
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

// Contact section - shows lead owner's contact info
function ContactSection({ offer }: { offer: PublicOffer }) {
  if (!offer.owner_name && !offer.owner_email) return null;

  return (
    <section className="mb-10">
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <MessageCircle className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">
              Máte dotaz? Ozvěte se mi
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Pokud vám cokoliv není jasné nebo potřebujete něco upřesnit, neváhejte mě kontaktovat.
            </p>
            <div className="space-y-1.5">
              {offer.owner_name && (
                <p className="text-sm font-medium">{offer.owner_name}</p>
              )}
              {offer.owner_email && (
                <a 
                  href={`mailto:${offer.owner_email}`}
                  className="text-sm text-primary hover:underline flex items-center gap-1.5"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {offer.owner_email}
                </a>
              )}
              {offer.owner_phone && (
                <a 
                  href={`tel:${offer.owner_phone}`}
                  className="text-sm text-primary hover:underline flex items-center gap-1.5"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {offer.owner_phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
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
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    async function fetchOffer() {
      // Check for invalid/placeholder tokens
      if (!token || token === ':token' || token.length < 3) {
        setError('Neplatný odkaz na nabídku');
        setLoading(false);
        return;
      }

      try {
        // Fetch from Supabase
        const { data, error } = await supabase
          .from('public_offers')
          .select('*')
          .eq('token', token)
          .eq('is_active', true)
          .single();

        if (error || !data) {
          setError('Nabídka nebyla nalezena nebo již není platná');
          setLoading(false);
          return;
        }

        // Convert database row to PublicOffer type
        const foundOffer: PublicOffer = {
          id: data.id,
          lead_id: data.lead_id,
          token: data.token,
          company_name: data.company_name,
          website: data.website,
          contact_name: data.contact_name,
          audit_summary: data.audit_summary,
          recommendation_intro: data.recommendation_intro,
          custom_note: data.custom_note,
          loom_url: data.notion_url || null,  // DB column notion_url stores Loom video URL
          services: (data.services as PublicOfferService[]) || [],
          portfolio_links: (data.portfolio_links as PortfolioLink[]) || [],
          total_price: data.total_price || 0,
          currency: (() => {
            if (!data.currency) throw new Error(`Public offer ${data.id} has no currency`);
            return data.currency;
          })(),
          offer_type: (data.offer_type as 'retainer' | 'one_off') || 'retainer',
          valid_until: data.valid_until,
          is_active: data.is_active ?? true,
          viewed_at: data.viewed_at,
          view_count: data.view_count || 0,
          created_by: data.created_by,
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString(),
          estimated_start_date: data.estimated_start_date || undefined,
          monthly_discount_percent: data.monthly_discount_percent || undefined,
          discount_scope: data.discount_scope || undefined,
          owner_name: data.owner_name || undefined,
          owner_email: data.owner_email || undefined,
          owner_phone: data.owner_phone || undefined,
        };

        setOffer(foundOffer);

        // Track view via RPC
        await supabase.rpc('increment_offer_view', { offer_token: token });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching offer:', err);
        setError('Chyba při načítání nabídky');
        setLoading(false);
      }
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
  const coreMonthly = offer.services
    .filter(s => s.billing_type === 'monthly' && s.service_type === 'core')
    .reduce((sum, s) => sum + s.price, 0);
  const addonMonthly = offer.services
    .filter(s => s.billing_type === 'monthly' && s.service_type !== 'core')
    .reduce((sum, s) => sum + s.price, 0);
  const totalMonthly = coreMonthly + addonMonthly;
  const totalOneOff = offer.services
    .filter(s => s.billing_type === 'one_off')
    .reduce((sum, s) => sum + s.price, 0);

  const discountPercent = offer.monthly_discount_percent || 0;
  const scope = offer.discount_scope || 'core_only';
  const discountBase = scope === 'all_services' ? totalMonthly : coreMonthly;
  const discountedBase = discountPercent > 0
    ? Math.round(discountBase * (1 - discountPercent / 100))
    : discountBase;
  const monthlyAfterDiscount = scope === 'all_services'
    ? discountedBase
    : discountedBase + addonMonthly;
  const displayTotal = monthlyAfterDiscount + totalOneOff;

  const onboardingUrl = `/onboarding/${offer.lead_id}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <img src={socialsLogo} alt="Socials" className="h-8" />
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link to={onboardingUrl}>
              Vyplnit onboarding formulář
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        {/* Hero Section - Consultative approach */}
        <section className="text-center mb-10">
          <p className="text-muted-foreground mb-1 text-sm">
            Na základě poznání vaší firmy jsme připravili strategii
          </p>
          <h1 className="text-xl md:text-3xl font-bold mb-1">
            Návrh spolupráce pro{' '}
            <span className="text-primary">
              {offer.website 
                ? offer.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
                : offer.company_name}
            </span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Pro: {offer.contact_name}
            {offer.valid_until && !isExpired && (
              <span className="mx-2">•</span>
            )}
            {offer.valid_until && !isExpired && (
              <span>
                Platí do {new Date(offer.valid_until).toLocaleDateString('cs-CZ', {
                  day: 'numeric',
                  month: 'long',
                })}
              </span>
            )}
          </p>
          {/* Share button */}
          <button
            onClick={handleCopyLink}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-full transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-green-600" />
                <span>Odkaz zkopírován</span>
              </>
            ) : (
              <>
                <Share2 className="h-3 w-3" />
                <span>Sdílet nabídku</span>
              </>
            )}
          </button>
        </section>

        {/* Validity warning */}
        {isExpired && (
          <div className="mb-10 p-3 rounded-lg border border-destructive/50 bg-destructive/10 text-center">
            <p className="text-destructive font-medium text-sm">
              Platnost této nabídky vypršela
            </p>
          </div>
        )}

        {/* Audit - What we found & recommendations */}
        {offer.audit_summary && (
          <section className="mb-10">
            <div className="p-5 rounded-xl bg-muted/50 border">
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                🔍 Co jsme zjistili & doporučení pro vás
              </h2>
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {offer.audit_summary}
              </p>
            </div>
          </section>
        )}

        {/* Loom video embed */}
        {offer.loom_url && (() => {
          const embedUrl = offer.loom_url.replace(/\/share\//, '/embed/');
          return (
            <section className="mb-10">
              <div className="rounded-xl overflow-hidden border shadow-sm">
                <AspectRatio ratio={16 / 9}>
                  <iframe
                    src={embedUrl}
                    title="Video k nabídce"
                    className="w-full h-full"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                  />
                </AspectRatio>
              </div>
            </section>
          );
        })()}

        {/* Services - As recommendations */}
        <section className="mb-10">
          <h2 className="text-base font-semibold mb-4">
            🎯 Služby navržené pro{' '}
            <span className="text-primary">
              {offer.website 
                ? offer.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
                : offer.company_name}
            </span>
          </h2>
          
          {/* Service structure explanation - only for mixed core + addon offers */}
          {offer.services.some(s => s.service_type === 'core') && offer.services.some(s => s.service_type === 'addon') && (
            <ServiceStructureExplanation />
          )}
          
          {/* Group services by type */}
          {(() => {
            const coreServices = offer.services.filter(s => s.service_type === 'core');
            const addonServices = offer.services.filter(s => s.service_type === 'addon');
            const otherServices = offer.services.filter(s => !s.service_type);
            
            // If no core services, show all in one flat list (addon-only / legacy)
            if (coreServices.length === 0) {
              return (
                <div className="space-y-4">
                  {offer.services.map((service, idx) => (
                    <ServiceCard key={service.id || idx} service={service} />
                  ))}
                </div>
              );
            }

            return (
              <div className="space-y-6">
                {/* Core services */}
                {coreServices.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-primary/20 text-primary border-primary/30">Core</Badge>
                      <span className="text-sm font-medium text-muted-foreground">Hlavní služby</span>
                    </div>
                    <div className="space-y-4">
                      {coreServices.map((service, idx) => (
                        <ServiceCard key={service.id || idx} service={service} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Add-on services */}
                {addonServices.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline">Doplněk</Badge>
                      <span className="text-sm font-medium text-muted-foreground">Doplňkové služby ke Core produktům</span>
                    </div>
                    <div className="space-y-4">
                      {addonServices.map((service, idx) => (
                        <ServiceCard key={service.id || idx} service={service} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Services without type (legacy) */}
                {otherServices.length > 0 && (
                  <div className="space-y-4">
                    {otherServices.map((service, idx) => (
                      <ServiceCard key={service.id || idx} service={service} />
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </section>

        {/* Pricing Summary - Clean */}
        <section className="mb-10">
          <div className="p-5 rounded-xl border bg-card space-y-3">
            {totalMonthly > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Měsíční cena</span>
                  <div className="text-right">
                    {discountPercent > 0 ? (
                      <>
                        <span className="text-base text-muted-foreground line-through mr-2">
                          {totalMonthly.toLocaleString('cs-CZ')} {offer.currency}
                        </span>
                        <span className="text-2xl font-bold text-foreground">
                          {monthlyAfterDiscount.toLocaleString('cs-CZ')} {offer.currency}
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold text-foreground">
                        {totalMonthly.toLocaleString('cs-CZ')} {offer.currency}
                      </span>
                    )}
                    <span className="text-sm text-muted-foreground ml-1">/měsíc</span>
                  </div>
                </div>
                {discountPercent > 0 && (
                  <div className="flex items-center justify-between text-sm text-green-600">
                    <span>Sleva {discountPercent}% {scope === 'all_services' ? 'na všechny služby' : 'na core služby'} při odběru všech služeb</span>
                    <span className="font-medium">-{(discountBase - discountedBase).toLocaleString('cs-CZ')} {offer.currency}/měs</span>
                  </div>
                )}
              </div>
            )}

            {totalOneOff > 0 && (
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">Jednorázově</span>
                <span className="text-sm font-medium">
                  {totalOneOff.toLocaleString('cs-CZ')} {offer.currency}
                </span>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Ceny jsou uvedeny bez DPH. Při měsíční spolupráci fakturujeme průběžně dle dohodnutého rozsahu.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 pt-2">
              <Button
                asChild
                size="lg"
                className="font-medium"
              >
                <Link to={onboardingUrl}>
                  Vyplnit onboarding formulář
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* How it works - Compact */}
        <NextStepsSection />




        {/* Contact Section */}
        <ContactSection offer={offer} />

        {/* CTA Section - Confident tone */}
        <section className="mb-10">
          <div className="p-6 rounded-xl bg-muted/30 border text-center">
            <h2 className="text-lg font-semibold mb-2">
              🚀 Pusťte se do toho s námi
            </h2>
            <p className="mb-5 text-muted-foreground text-sm max-w-sm mx-auto">
              Společně posuneme váš byznys na další úroveň. Stačí vyplnit krátký formulář a o zbytek se postaráme.
            </p>
            <Button
              asChild
              size="lg"
              className="font-medium px-8"
            >
              <Link to={onboardingUrl}>
                Vyplnit onboarding formulář
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <p className="mt-4 text-xs text-muted-foreground">
              ✅ Smlouva do 24 hodin
            </p>
          </div>
        </section>

        {/* Footer - Credibility badges */}
        <footer className="pt-6 border-t">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
              <span>Meta Business Partner</span>
              <span>•</span>
              <span>Google Partner</span>
              <span>•</span>
              <span className="font-medium text-amber-600">Shoptet Zlatý Partner</span>
              <span>•</span>
              <span>30 mil. Kč/měsíc ve správě kampaní</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
              <a
                href="https://www.socials.cz/pripadove-studie"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Případové studie
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://partneri.shoptet.cz/profesionalove/socials-advertising/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Recenze našich klientů
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://www.socials.cz/o-nas"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Více o nás
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://www.socials.cz/socials-podcast"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                🎙️ Socials Podcast
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <img src={socialsLogo} alt="Socials" className="h-5 opacity-50" />
          </div>
        </footer>
      </main>

      {/* Sticky CTA for mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-background/95 backdrop-blur border-t shadow-lg sm:hidden safe-area-bottom">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-bold">{displayTotal.toLocaleString('cs-CZ')} {offer.currency}</p>
            <p className="text-xs text-muted-foreground">
              {totalMonthly > 0 ? '/měsíc' : 'celkem'}
            </p>
          </div>
          <Button asChild className="flex-1 max-w-[200px]">
            <Link to={onboardingUrl}>
              Vyplnit formulář
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
