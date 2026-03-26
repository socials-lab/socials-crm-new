import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
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
import socialsLogoDark from '@/assets/socials-logo-dark.svg';
import socialsLogo from '@/assets/socials-logo.svg';
import { getPublicOfferByToken, incrementOfferView } from '@/data/publicOffersMockData';
import { usePublicPortfolio } from '@/hooks/usePortfolioData';

// Alias for use inside the file
const usePublicPortfolioLocal = usePublicPortfolio;

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

// Onboarding process steps
const ONBOARDING_STEPS = [
  {
    icon: FileSignature,
    title: 'Digitální podpis smlouvy',
    description: 'Pošleme vám k digitálnímu podpisu smlouvu o propagaci a zpracování osobních údajů přes nástroj DigiSign.',
    timeline: 'Do 24 hodin',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  {
    icon: ClipboardList,
    title: 'Přístupy do Freela',
    description: 'Pošleme vám přístupy do Freela – nástroje na projektové řízení, kde budete mít přehled o všem, co děláme.',
    timeline: 'Do 24 h od podpisu',
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-100 dark:bg-violet-900/40',
    borderColor: 'border-violet-200 dark:border-violet-800',
  },
  {
    icon: Phone,
    title: 'Onboardingový telefonát',
    description: 'Spojí se s vámi projektový manažer ohledně onboardingového telefonátu, kde si projdete všechny potřebné další kroky.',
    timeline: 'Do 24 hodin',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-900/40',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
  {
    icon: UserCheck,
    title: 'Navýšení přístupů',
    description: 'Navýšíte nám přístupy do reklamních platforem – zašleme vám přesné instrukce s potřebnými úrovněmi oprávnění.',
    timeline: 'Cca 24 hodin',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  {
    icon: Rocket,
    title: 'Pustíme se do práce!',
    description: 'Začneme s optimalizací stávajících kampaní a následně spustíme vlastní strategie šité na míru vašemu byznysu.',
    timeline: 'Let\'s go 🚀',
    color: 'text-primary',
    bg: 'bg-primary/10',
    borderColor: 'border-primary/20',
  },
];

function ServiceCard({ service, showTypeLabel = false }: { service: PublicOfferService; showTypeLabel?: boolean }) {
  const [isOpen, setIsOpen] = useState(false); // Default closed
  const [showDetailedSections, setShowDetailedSections] = useState(false);

  // Use deliverables if available, otherwise parse offer_description
  const hasDeliverables = service.deliverables && service.deliverables.length > 0;
  const hasRequirements = service.requirements && service.requirements.length > 0;
  const hasDetailedSections = service.detailed_sections && service.detailed_sections.length > 0;
  const hasDetails = hasDeliverables || service.offer_description || service.frequency || service.start_timeline;

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
                <span className="font-semibold text-sm text-muted-foreground">
                  {service.price.toLocaleString('cs-CZ')} {service.currency}
                </span>
                <span className="text-xs text-muted-foreground/70 ml-1">
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

              {/* Detailed sections - secondary expandable */}
              {hasDetailedSections && (
                <Collapsible open={showDetailedSections} onOpenChange={setShowDetailedSections}>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 transition-colors text-sm text-muted-foreground hover:text-primary cursor-pointer">
                      <span>{showDetailedSections ? 'Skrýt podrobnosti' : '📋 Zobrazit podrobný rozpis služby'}</span>
                      <ChevronDown className={cn('h-4 w-4 transition-transform', showDetailedSections && 'rotate-180')} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-border space-y-5">
                      {service.detailed_sections!.map((section, sIdx) => (
                        <div key={sIdx}>
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <span>{section.emoji}</span>
                            <span>{section.title}</span>
                          </h4>
                          <ul className="space-y-1.5 ml-6">
                            {section.items.map((item, iIdx) => (
                              <li key={iIdx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <span className="shrink-0 mt-1.5 w-1 h-1 rounded-full bg-muted-foreground/50" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
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
          <Badge className="bg-primary/20 text-primary border-primary/30 shrink-0 mt-0.5 w-[70px] justify-center">Core</Badge>
          <div>
            <p className="font-medium">Hlavní služby</p>
             <p className="text-muted-foreground text-xs leading-relaxed">
               Základní pilíře vaší online strategie. Core služby jsou rozděleny do úrovní{' '}
               <span className="font-medium text-emerald-600">GROWTH</span>,{' '}
               <span className="font-medium text-primary">PRO</span> a{' '}
               <span className="font-medium text-amber-600">ELITE</span>{' '}
               podle rozsahu správy, výše spravovaného rozpočtu a očekávané náročnosti.
             </p>
          </div>
        </div>
        
        {/* Add-on služby */}
        <div className="flex items-start gap-3">
          <Badge variant="outline" className="shrink-0 mt-0.5 w-[70px] justify-center">Doplněk</Badge>
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

function OnboardingProcessSection() {
  return (
    <section className="mb-16 p-6 md:p-8 rounded-2xl border bg-card/50 backdrop-blur-sm">
      <h2 className="text-base font-semibold mb-2 text-center">
        🤝 Jak bude vypadat začátek spolupráce
      </h2>
      <p className="text-sm text-muted-foreground text-center mb-8">
        Celý proces zvládneme obvykle do 48 hodin od vašeho rozhodnutí.
      </p>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[23px] top-6 bottom-6 w-px bg-border hidden sm:block" />

        <div className="space-y-3">
          {ONBOARDING_STEPS.map((step, idx) => (
            <div
              key={idx}
              className="group flex gap-4 items-start p-3 rounded-xl border border-transparent hover:border-border hover:bg-muted/40 transition-all duration-200 cursor-default"
            >
              {/* Icon circle */}
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 relative z-10 border transition-transform duration-200 group-hover:scale-110",
                step.bg,
                step.borderColor,
              )}>
                <step.icon className={cn("h-5 w-5", step.color)} />
              </div>

              {/* Content */}
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{step.title}</h3>
                  <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 font-normal">
                    {step.timeline}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const WHY_US_ITEMS = [
  {
    emoji: '💰',
    title: '30+ mil. Kč měsíčně',
    description: 'Spravujeme reklamní rozpočty přes 30 milionů Kč měsíčně. Máme zkušenosti s velkými i středními e-shopy a víme, co funguje – a aplikujeme to i na váš business.',
  },
  {
    emoji: '👨‍💻',
    title: 'Výhradně seniorní specialisté',
    description: 'Každý náš specialista má 5+ let zkušeností. Žádní junioři. Každý ví, jak z kampaní vytěžit maximum.',
  },
  {
    emoji: '🏅',
    title: 'Certifikovaní partneři platforem',
    description: 'Meta, Google, TikTok, Sklik a zlatý Shoptet partner. Máme přímé kontakty, přístup k betám a možnost řešit složitější věci přímo s platformami.',
  },
  {
    emoji: '🤝',
    title: 'Pečlivý výběr klientů',
    description: 'Jdeme do spolupráce jen s firmami, u kterých jsme přesvědčeni, že jim dokážeme zlepšit obchodní výsledky díky výkonnostní reklamě.',
  },
];

const WHY_US_LINKS = [
  {
    emoji: '📊',
    label: 'Případové studie',
    description: 'Prohlédněte si reálné dopady na tržby klientů',
    url: 'https://www.socials.cz/pripadove-studie',
  },
  {
    emoji: '🎙️',
    label: 'Socials Podcast',
    description: 'Otevřeně mluvíme o marketingu, výkonu a vedení agentury',
    url: 'https://www.socials.cz/socials-podcast',
  },
  {
    emoji: '⭐',
    label: 'Hodnocení na Shoptet Partner Portálu',
    description: 'Co o nás říkají naši klienti',
    url: 'https://partneri.shoptet.cz/profesionalove/socials-advertising/',
  },
];

function WhyUsSection() {
  return (
    <section className="mb-16 p-6 md:p-8 rounded-2xl border bg-card/50 backdrop-blur-sm">
      <h2 className="text-base font-semibold mb-2 text-center">
        🏆 Proč spolupracovat právě s námi?
      </h2>
      <p className="text-sm text-muted-foreground text-center mb-2">
        Chceme, aby pro vás byla spolupráce se Socials jasná a hlavně postavená na skvělých výsledcích.
      </p>
      <p className="text-sm text-muted-foreground text-center mb-8 font-medium">
        Ne sliby, ale skutečný business dopad.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {WHY_US_ITEMS.map((item, i) => (
          <div
            key={i}
            className="group p-4 rounded-xl border bg-muted/30 hover:bg-muted/60 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 cursor-default"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0 transition-transform duration-200 group-hover:scale-125">{item.emoji}</span>
              <div>
                <p className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">{item.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Separator className="mb-6" />

      <p className="text-xs text-muted-foreground text-center mb-4 font-medium uppercase tracking-wider">
        Poznejte nás blíže
      </p>

      <div className="space-y-2">
        {WHY_US_LINKS.map((link, i) => (
          <a
            key={i}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 p-3 rounded-xl border bg-card hover:border-primary/50 hover:bg-primary/5 hover:shadow-md transition-all duration-200"
          >
            <span className="text-xl shrink-0 transition-transform duration-200 group-hover:scale-110">{link.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm group-hover:text-primary transition-colors">{link.label}</p>
              <p className="text-xs text-muted-foreground">{link.description}</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 shrink-0" />
          </a>
        ))}
      </div>
    </section>
  );
}

function ReportingSection() {
  const DEMO_REPORT_URL = 'https://68bb7487-e1f5-44d2-a8a4-9044e8cf5438.lovableproject.com/shared-report/8c10b8c2a68fb6c367178fe0e01bc1702f39c4b1af1c6389';
  
  return (
    <section className="mb-16">
      <div className="p-6 md:p-8 rounded-2xl border bg-card/50 backdrop-blur-sm">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">📊 Reporting až na úroveň zisku</h2>
        
        <div className="space-y-4 mb-8">
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
            Pokud máte platformu <span className="font-semibold text-foreground">Shoptet</span>, dodáme vám reporting až na úroveň <span className="font-semibold text-foreground">zisku a contribution margin</span>. Budete přesně vědět, kolik peněz vám vydělá jaký produkt.
          </p>
          <p className="text-sm text-muted-foreground italic">
            (Na implementaci dalších platforem jako Shopify a Upgates nyní pracujeme.)
          </p>
        </div>

        <div className="mb-6">
          <p className="text-sm font-medium text-muted-foreground mb-3">Interaktivní ukázka reportu — můžete si ho přímo proklikat:</p>
          <div className="rounded-xl overflow-hidden border border-border/50 shadow-lg" style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
            <iframe
              src={DEMO_REPORT_URL}
              frameBorder="0"
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              title="Demo report – ukázka"
            />
          </div>
        </div>

        <div className="flex justify-center">
          <a
            href={DEMO_REPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
          >
            Otevřít demo report
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

function CreativePortfolioSection() {
  const [selectedItem, setSelectedItem] = useState<{ url: string; type: string } | null>(null);
  const { items: portfolioItems, isLoading: portfolioLoading } = usePublicPortfolioLocal();

  // Fallback to static images if DB is empty
  const FALLBACK_IMAGES = [
    { src: '/images/portfolio/banner1.jpg', alt: 'Teen Wear – kreativní banner', type: 'image' as const },
    { src: '/images/portfolio/doprava_zdarma1.png', alt: 'Super Zoo – doprava zdarma', type: 'image' as const },
    { src: '/images/portfolio/sleepking.jpg', alt: 'SleepKing – produktová reklama', type: 'image' as const },
    { src: '/images/portfolio/puella.png', alt: 'Puella – vánoční kampaň', type: 'image' as const },
    { src: '/images/portfolio/cyber_monday.png', alt: 'Puella – Cyber Monday', type: 'image' as const },
    { src: '/images/portfolio/onlinemedical.jpg', alt: 'Online Medical – longevity', type: 'image' as const },
    { src: '/images/portfolio/nutworld.png', alt: 'Nut World – prémiové kešu', type: 'image' as const },
    { src: '/images/portfolio/naturapura.jpg', alt: 'Pontina – Essentials set', type: 'image' as const },
    { src: '/images/portfolio/halloween.png', alt: 'Natima – Halloween kampaň', type: 'image' as const },
    { src: '/images/portfolio/magnesium.png', alt: 'Natima – Magnesium duo', type: 'image' as const },
    { src: '/images/portfolio/cbdway.jpg', alt: 'CBDway – Tutti Frutti medvídci', type: 'image' as const },
    { src: '/images/portfolio/dmania.jpg', alt: 'Dmania – listopadová sleva', type: 'image' as const },
    { src: '/images/portfolio/k2moto.png', alt: 'K2 Moto – airbagová vesta', type: 'image' as const },
    { src: '/images/portfolio/beewood.png', alt: 'Beewood – dřevěné kryty', type: 'image' as const },
    // Videa
    { src: '/images/portfolio/antistress.mp4', alt: 'Antistress – produktové video', type: 'video' as const },
    { src: '/images/portfolio/firefly.mp4', alt: 'Adobe Firefly – AI video', type: 'video' as const },
    { src: '/images/portfolio/penezenka.mp4', alt: 'Business peněženka – produkt', type: 'video' as const },
    { src: '/images/portfolio/ioniq.mp4', alt: 'Hyundai IONIQ – reklama', type: 'video' as const },
    { src: '/images/portfolio/hyundai.mp4', alt: 'Hyundai – video spot', type: 'video' as const },
    { src: '/images/portfolio/cbdway_sleep.mp4', alt: 'CBDway Sleep – produkt', type: 'video' as const },
    { src: '/images/portfolio/final_video.mp4', alt: 'Kreativní video spot', type: 'video' as const },
    { src: '/images/portfolio/nutworld_video.mp4', alt: 'Nut World – video reklama', type: 'video' as const },
    { src: '/images/portfolio/teenwear_video.mp4', alt: 'Teen Wear – video', type: 'video' as const },
    { src: '/images/portfolio/natima_video.mp4', alt: 'Natima – klientské video', type: 'video' as const },
  ];

  const displayItems = portfolioItems.length > 0
    ? portfolioItems.map(i => ({ src: i.file_url, alt: i.title, type: i.type }))
    : FALLBACK_IMAGES;

  return (
    <section className="mb-16 p-6 md:p-8 rounded-2xl border bg-card/50 backdrop-blur-sm">
      <h2 className="text-base font-semibold mb-2 text-center">
        🎨 Grafika, která prodává
      </h2>
      <p className="text-sm text-muted-foreground text-center mb-2">
        Specializujeme se na grafiku pro výkonnostní reklamy. Tvoříme kreativy, které nejen vypadají skvěle, ale hlavně konvertují.
      </p>
      <p className="text-sm text-muted-foreground text-center mb-8">
        Díky <span className="font-semibold text-foreground">AI nástrojům</span> od vás nepotřebujeme žádné podklady navíc — stačí fotka produktu na bílém pozadí a z toho vytvoříme kompletní kreativní bannery i videa.
      </p>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {displayItems.map((item, i) => (
          <div
            key={i}
            onClick={() => setSelectedItem({ url: item.src, type: item.type })}
            className="group relative aspect-square rounded-xl overflow-hidden border bg-muted/30 cursor-pointer hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300"
          >
            {item.type === 'video' ? (
              <>
                <video
                  src={item.src}
                  className="w-full h-full object-cover"
                  muted
                  preload="metadata"
                  onMouseEnter={e => (e.target as HTMLVideoElement).play()}
                  onMouseLeave={e => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
                  <div className="p-2.5 rounded-full bg-background/80 backdrop-blur-sm">
                    <Play className="h-5 w-5 text-primary fill-primary" />
                  </div>
                </div>
              </>
            ) : (
              <img
                src={item.src}
                alt={item.alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
              <p className="text-xs font-medium text-foreground">{item.alt}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedItem(null)}
        >
          {selectedItem.type === 'video' ? (
            <video
              src={selectedItem.url}
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl"
              controls
              autoPlay
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <img
              src={selectedItem.url}
              alt="Portfolio detail"
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
            />
          )}
          <p className="absolute bottom-6 text-xs text-muted-foreground">Klikněte kamkoliv pro zavření</p>
        </div>
      )}
    </section>
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
      <div className="offer-dark min-h-screen bg-background">
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
      <div className="offer-dark min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="mb-6">
            <img src={socialsLogoDark} alt="Socials" className="h-10 mx-auto" />
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

  const onboardingUrl = `/onboarding/${offer.lead_id}`;

  return (
    <div className="offer-dark min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <img src={socialsLogoDark} alt="Socials" className="h-8" />
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
            Na základě poznání vaší firmy jsme připravili strategii a nabídku
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

            {/* Loom video embed */}
            {offer.loom_url && (
              <div className="mt-6 rounded-xl overflow-hidden border shadow-sm">
                <AspectRatio ratio={16 / 9}>
                  <iframe
                    src={offer.loom_url}
                    title="Video k nabídce"
                    className="w-full h-full"
                    frameBorder="0"
                    allowFullScreen
                    allow="autoplay; fullscreen"
                  />
                </AspectRatio>
              </div>
            )}
          </section>
        )}

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
          
          {/* Service structure explanation - only show when there are both core and addon services */}
          {offer.services.some(s => s.service_type === 'core') && offer.services.some(s => s.service_type === 'addon') && (
            <ServiceStructureExplanation />
          )}
          
          {/* Group services by type */}
          {(() => {
            const coreServices = offer.services.filter(s => s.service_type === 'core');
            const addonServices = offer.services.filter(s => s.service_type === 'addon');
            const otherServices = offer.services.filter(s => !s.service_type);
            
            // If no core services, show all in a flat list without Core/Doplněk labels
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

        {/* Pricing Summary */}
        <section className="mb-10">
          <div className="p-5 rounded-xl border bg-card space-y-3">
            {totalMonthly > 0 && (() => {
              const discountPercent = offer.monthly_discount_percent || 0;
              const scope = offer.discount_scope || 'core_only';
              const discountBase = scope === 'all_services' ? totalMonthly : coreMonthly;
              const discountedBase = discountPercent > 0 
                ? Math.round(discountBase * (1 - discountPercent / 100)) 
                : discountBase;
              const discountAmount = discountBase - discountedBase;
              const totalAfterDiscount = scope === 'all_services' 
                ? discountedBase 
                : discountedBase + addonMonthly;
              
              return (
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
                            {totalAfterDiscount.toLocaleString('cs-CZ')} {offer.currency}
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
                      <span className="font-medium">-{discountAmount.toLocaleString('cs-CZ')} {offer.currency}/měs</span>
                    </div>
                  )}
                </div>
              );
            })()}
            {totalOneOff > 0 && (
              <>
                {totalMonthly > 0 && <div className="border-t" />}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Jednorázově</span>
                  <span className="text-lg font-semibold text-foreground">
                    {totalOneOff.toLocaleString('cs-CZ')} {offer.currency}
                  </span>
                </div>
              </>
            )}
            <p className="text-xs text-muted-foreground text-right">Ceny jsou uvedeny bez DPH</p>
            <p className="text-xs text-muted-foreground text-right mt-1">Měsíční položky fakturujeme v prvním měsíci poměrně ode dne zahájení služby.</p>
          </div>
        </section>

        {/* Onboarding process timeline */}
        <OnboardingProcessSection />

        {/* Why us section */}
        <WhyUsSection />

        {/* Creative portfolio */}
        <CreativePortfolioSection />

        {/* Reporting section */}
        <ReportingSection />

        {/* Loom video */}
        {offer.loom_url && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4">🎥 Video k nabídce</h2>
            <div className="rounded-xl overflow-hidden border" style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
              <iframe
                src={offer.loom_url.replace('/share/', '/embed/')}
                frameBorder="0"
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              />
            </div>
          </section>
        )}

        {/* Contact Section */}
        <ContactSection offer={offer} />

        {/* CTA Section - Confident tone */}
        <section className="mb-10">
          <div className="p-6 rounded-xl bg-muted/30 border text-center">
            <h2 className="text-lg font-semibold mb-2">
              🚀 Pusťte se do toho s námi
            </h2>
            <p className="mb-5 text-muted-foreground text-sm max-w-sm mx-auto">
              Společně posuneme váš byznys na další úroveň.
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
            <img src={socialsLogoDark} alt="Socials" className="h-5 opacity-50" />
          </div>
        </footer>
      </main>

      {/* Sticky CTA for mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-background/95 backdrop-blur border-t shadow-lg sm:hidden safe-area-bottom">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-bold">{(totalMonthly + totalOneOff).toLocaleString('cs-CZ')} {offer.currency}</p>
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
