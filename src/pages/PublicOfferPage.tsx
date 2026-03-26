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
  ChevronLeft,
  ChevronRight,
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
  Sun,
  Moon,
  Star as StarIcon,
  Plus as PlusIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PublicOfferService, PublicOffer, PortfolioLink } from '@/types/publicOffer';
import socialsLogoDark from '@/assets/socials-logo-dark.svg';
import socialsLogo from '@/assets/socials-logo.svg';
import cert1 from '@/assets/certs/cert-1.avif';
import cert2 from '@/assets/certs/cert-2.avif';
import cert3 from '@/assets/certs/cert-3.avif';
import cert4 from '@/assets/certs/cert-4.avif';
import cert5 from '@/assets/certs/cert-5.avif';
import cert6 from '@/assets/certs/cert-6.avif';
import cert7 from '@/assets/certs/cert-7.avif';
import cert8 from '@/assets/certs/cert-8.avif';
import { getPublicOfferByToken, incrementOfferView } from '@/data/publicOffersMockData';
import { usePublicPortfolio } from '@/hooks/usePortfolioData';

const usePublicPortfolioLocal = usePublicPortfolio;

// Portfolio icon by type
function getPortfolioIcon(type: PortfolioLink['type']) {
  switch (type) {
    case 'case_study': return BookOpen;
    case 'presentation': return Presentation;
    case 'video': return Video;
    default: return FileText;
  }
}

// Get emoji based on service name/type
function getServiceEmoji(serviceName: string): string {
  const name = serviceName.toLowerCase();
  if (name.includes('meta') || name.includes('facebook') || name.includes('instagram')) return '📘';
  if (name.includes('google') || name.includes('search') || name.includes('ppc') || name.includes('ads')) return '🔎';
  if (name.includes('tiktok')) return '🎵';
  if (name.includes('linkedin')) return '💼';
  if (name.includes('kreativ') || name.includes('creative') || name.includes('design') || name.includes('grafik')) return '🎨';
  if (name.includes('video') || name.includes('reels')) return '🎬';
  if (name.includes('analytic') || name.includes('report') || name.includes('měření')) return '📊';
  if (name.includes('strateg') || name.includes('consult') || name.includes('poradenství')) return '🧠';
  if (name.includes('email') || name.includes('newsletter') || name.includes('mailing')) return '📧';
  if (name.includes('seo')) return '🔗';
  if (name.includes('social') || name.includes('community') || name.includes('správa')) return '💬';
  if (name.includes('ecommerce') || name.includes('e-commerce') || name.includes('shoptet') || name.includes('eshop')) return '🛒';
  return '✨';
}

// Section heading component for consistent styling
function SectionHeading({ title, subtitle, className }: { title: string; subtitle?: string; className?: string }) {
  return (
    <div className={cn("mb-10", className)}>
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h2>
      {subtitle && (
        <p className="text-muted-foreground mt-2 text-base md:text-lg leading-relaxed max-w-2xl">{subtitle}</p>
      )}
    </div>
  );
}

// Thin divider between sections
function SectionDivider() {
  return <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-16" />;
}

// Onboarding process steps
const ONBOARDING_STEPS = [
  {
    icon: FileSignature,
    title: 'Digitální podpis smlouvy',
    description: 'Pošleme vám k digitálnímu podpisu smlouvu o propagaci a zpracování osobních údajů přes nástroj DigiSign.',
    timeline: 'Do 24 hodin',
  },
  {
    icon: ClipboardList,
    title: 'Přístupy do Freela',
    description: 'Pošleme vám přístupy do Freela – nástroje na projektové řízení, kde budete mít přehled o všem, co děláme.',
    timeline: 'Do 24 h od podpisu',
  },
  {
    icon: Phone,
    title: 'Onboardingový telefonát',
    description: 'Spojí se s vámi projektový manažer ohledně onboardingového telefonátu, kde si projdete všechny potřebné další kroky.',
    timeline: 'Do 24 hodin',
  },
  {
    icon: UserCheck,
    title: 'Navýšení přístupů',
    description: 'Navýšíte nám přístupy do reklamních platforem – zašleme vám přesné instrukce s potřebnými úrovněmi oprávnění.',
    timeline: 'Cca 24 hodin',
  },
  {
    icon: Rocket,
    title: 'Pustíme se do práce!',
    description: 'Začneme s optimalizací stávajících kampaní a následně spustíme vlastní strategie šité na míru vašemu byznysu.',
    timeline: 'Let\'s go 🚀',
  },
];

function ServiceCard({ service, showTypeLabel = false }: { service: PublicOfferService; showTypeLabel?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDetailedSections, setShowDetailedSections] = useState(false);

  const hasDeliverables = service.deliverables && service.deliverables.length > 0;
  const hasRequirements = service.requirements && service.requirements.length > 0;
  const hasDetailedSections = service.detailed_sections && service.detailed_sections.length > 0;
  const hasDetails = hasDeliverables || service.offer_description || service.frequency || service.start_timeline;

  const descriptionLines = !hasDeliverables 
    ? (service.offer_description?.split('\n').filter(line => line.trim().length > 0) || [])
    : [];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn(
        "rounded-xl border-2 transition-all duration-300 overflow-hidden",
        isOpen
          ? "border-[#94e700]/40 bg-[#94e700]/[0.03] shadow-[0_0_30px_-10px_rgba(148,231,0,0.15)]"
          : "border-foreground/[0.08] bg-foreground/[0.02] hover:border-[#94e700]/25 hover:bg-foreground/[0.04] hover:shadow-[0_0_20px_-10px_rgba(148,231,0,0.1)]"
      )}>
        <CollapsibleTrigger className="w-full">
          <div className="p-4 md:p-6">
            {/* Mobile: stacked layout, Desktop: horizontal */}
            <div className="flex items-start gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#94e700]/10 border border-[#94e700]/20 flex items-center justify-center shrink-0 text-xl md:text-2xl">
                {getServiceEmoji(service.name)}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-base">{service.name}</p>
                    {service.service_type === 'core' && service.selected_tier && (
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[10px] uppercase font-medium tracking-wider",
                          service.selected_tier === 'elite' && "border-amber-500/50 text-amber-400 bg-amber-500/10",
                          service.selected_tier === 'pro' && "border-[#94e700]/50 text-[#94e700] bg-[#94e700]/10",
                          service.selected_tier === 'growth' && "border-emerald-500/50 text-emerald-400 bg-emerald-500/10",
                        )}
                      >
                        {service.selected_tier}
                      </Badge>
                    )}
                    {service.service_type === 'addon' && (
                      <Badge variant="outline" className="text-[10px] border-foreground/20 text-muted-foreground">
                        Doplněk
                      </Badge>
                    )}
                    {!service.service_type && service.selected_tier && (
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[10px] uppercase font-medium tracking-wider",
                          service.selected_tier === 'elite' && "border-amber-500/50 text-amber-400 bg-amber-500/10",
                          service.selected_tier === 'pro' && "border-[#94e700]/50 text-[#94e700] bg-[#94e700]/10",
                          service.selected_tier === 'growth' && "border-emerald-500/50 text-emerald-400 bg-emerald-500/10",
                        )}
                      >
                        {service.selected_tier}
                      </Badge>
                    )}
                  </div>
                  {/* Desktop price inline */}
                  <div className="hidden md:flex items-center gap-3">
                    <div className="text-right whitespace-nowrap">
                      <span className="font-bold text-lg text-[#94e700]">
                        {service.price.toLocaleString('cs-CZ')} {service.currency}
                      </span>
                      {service.billing_type === 'monthly' && (
                        <span className="text-xs text-muted-foreground/70 ml-1">/měs</span>
                      )}
                    </div>
                    {hasDetails && (
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                        isOpen ? "bg-[#94e700]/20 text-[#94e700]" : "bg-foreground/[0.05] text-muted-foreground/50"
                      )}>
                        <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
                      </div>
                    )}
                  </div>
                </div>
                {service.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2 md:line-clamp-none">{service.description}</p>
                )}
                {/* Mobile: price row */}
                <div className="flex md:hidden items-center justify-between mt-2.5">
                  <div className="whitespace-nowrap">
                    <span className="font-bold text-base text-[#94e700]">
                      {service.price.toLocaleString('cs-CZ')} {service.currency}
                    </span>
                    {service.billing_type === 'monthly' && (
                      <span className="text-xs text-muted-foreground/70 ml-1">/měs</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {hasDetails && !isOpen && <span>Detaily</span>}
                    {hasDetails && (
                      <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isOpen && 'rotate-180')} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        
        {hasDetails && (
          <CollapsibleContent>
            <div className="px-5 md:px-6 pb-6 space-y-4">
              {(hasDeliverables || descriptionLines.length > 0) && (
                <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="h-4 w-4 text-emerald-400" />
                    <p className="text-sm font-semibold text-emerald-300">Co dostanete:</p>
                  </div>
                  <ul className="space-y-2">
                    {(hasDeliverables ? service.deliverables! : descriptionLines).map((item, idx) => {
                      const cleanItem = item.replace(/^[-•*]\s*/, '');
                      return (
                        <li key={idx} className="flex items-start gap-2 text-sm text-emerald-200/80">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{cleanItem}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {(service.frequency || service.turnaround) && (
                <div className="flex flex-wrap gap-3">
                  {service.frequency && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-foreground/[0.03] border border-foreground/[0.06] text-sm text-foreground/70">
                      <Clock className="h-4 w-4 text-muted-foreground/70" />
                      <span>{service.frequency}</span>
                    </div>
                  )}
                  {service.turnaround && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-foreground/[0.03] border border-foreground/[0.06] text-sm text-foreground/70">
                      <Rocket className="h-4 w-4 text-muted-foreground/70" />
                      <span>{service.turnaround}</span>
                    </div>
                  )}
                </div>
              )}

              {service.start_timeline && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#94e700]/5 border border-[#94e700]/10 text-sm">
                  <Calendar className="h-4 w-4 text-[#94e700]" />
                  <span className="font-medium text-[#94e700]">Start: {service.start_timeline}</span>
                </div>
              )}

              {hasRequirements && (
                <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/10">
                  <div className="flex items-center gap-2 mb-3">
                    <ClipboardList className="h-4 w-4 text-amber-400" />
                    <p className="text-sm font-semibold text-amber-300">Co od vás budeme potřebovat:</p>
                  </div>
                  <ul className="space-y-2">
                    {service.requirements!.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-amber-200/80">
                        <span className="text-amber-400">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {hasDetailedSections && (
                <Collapsible open={showDetailedSections} onOpenChange={setShowDetailedSections}>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-dashed border-foreground/10 hover:border-[#94e700]/30 hover:bg-[#94e700]/5 transition-colors text-sm text-muted-foreground hover:text-[#94e700] cursor-pointer">
                      <span>{showDetailedSections ? 'Skrýt podrobnosti' : 'Zobrazit podrobný rozpis služby'}</span>
                      <ChevronDown className={cn('h-4 w-4 transition-transform', showDetailedSections && 'rotate-180')} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-4 p-4 rounded-lg bg-foreground/[0.02] border border-foreground/[0.06] space-y-5">
                      {service.detailed_sections!.map((section, sIdx) => (
                        <div key={sIdx}>
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <span>{section.emoji}</span>
                            <span>{section.title}</span>
                          </h4>
                          <ul className="space-y-1.5 ml-6">
                            {section.items.map((item, iIdx) => (
                              <li key={iIdx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <span className="shrink-0 mt-1.5 w-1 h-1 rounded-full bg-white/30" />
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
    <div className="p-5 rounded-xl bg-foreground/[0.02] border border-foreground/[0.06] mb-6">
      <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-foreground/70">
        Jak strukturujeme naše služby
      </h3>
      
      <div className="space-y-4 text-sm">
        <div className="flex items-start gap-3">
          <Badge className="bg-[#94e700]/10 text-[#94e700] border-[#94e700]/30 shrink-0 mt-0.5 w-[70px] justify-center text-[10px]">Core</Badge>
          <div>
            <p className="font-medium text-foreground">Hlavní služby</p>
            <p className="text-muted-foreground/70 text-xs leading-relaxed mt-0.5">
              Základní pilíře vaší online strategie. Core služby jsou rozděleny do úrovní{' '}
              <span className="font-medium text-emerald-400">GROWTH</span>,{' '}
              <span className="font-medium text-[#94e700]">PRO</span> a{' '}
              <span className="font-medium text-amber-400">ELITE</span>{' '}
              podle rozsahu správy, výše spravovaného rozpočtu a očekávané náročnosti.
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <Badge variant="outline" className="shrink-0 mt-0.5 w-[70px] justify-center text-[10px] border-foreground/20 text-muted-foreground">Doplněk</Badge>
          <div>
            <p className="font-medium text-foreground">Doplňkové služby</p>
            <p className="text-muted-foreground/70 text-xs leading-relaxed mt-0.5">
              Rozšíření k hlavním službám pro maximální efektivitu.{' '}
              <span className="font-medium text-foreground/70">Doplňky nelze využívat samostatně</span> – 
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
    <section>
      <SectionHeading 
        title="🚀 Jak to bude probíhat" 
        subtitle="Celý proces zvládneme obvykle do 48 hodin od vašeho rozhodnutí."
      />

      <div className="relative">
        {/* Vertical lime line */}
        <div className="absolute left-[23px] top-8 bottom-8 w-px bg-gradient-to-b from-[#94e700]/60 via-[#94e700]/20 to-transparent hidden sm:block" />

        <div className="space-y-2">
          {ONBOARDING_STEPS.map((step, idx) => (
            <div
              key={idx}
              className="group flex gap-4 items-start p-4 rounded-xl border border-transparent hover:border-foreground/[0.06] hover:bg-foreground/[0.02] transition-all duration-300 cursor-default"
            >
              <div className="w-12 h-12 rounded-xl bg-foreground/[0.04] border border-foreground/[0.08] flex items-center justify-center shrink-0 relative z-10 transition-all duration-300 group-hover:bg-[#94e700]/10 group-hover:border-[#94e700]/30">
                <step.icon className="h-5 w-5 text-muted-foreground group-hover:text-[#94e700] transition-colors" />
              </div>

              <div className="flex-1 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm text-foreground group-hover:text-[#94e700] transition-colors">{step.title}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-foreground/[0.05] text-muted-foreground/70 font-medium">
                    {step.timeline}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground/70 mt-1 leading-relaxed">
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
    stat: '30+ mil. Kč',
    label: 'měsíčně ve správě',
    description: 'Spravujeme reklamní rozpočty přes 30 milionů Kč měsíčně. Máme zkušenosti s velkými i středními e-shopy.',
  },
  {
    stat: 'AI-first',
    label: 'přístup ke správě',
    description: 'Využíváme AI ve všem — od tvorby grafik na míru, přes analýzu dat, až po optimalizaci kampaní. Díky tomu jsme rychlejší a efektivnější.',
  },
  {
    stat: 'Zisk',
    label: 'ne jen revenue',
    description: 'Neřešíme jen revenue a PNO. Díky naší unikátní technologii měříme váš skutečný zisk na úrovni produktu a contribution margin (náhled níže).',
  },
  {
    stat: 'Unikátní',
    label: 'interní nástroje',
    description: 'Máme vlastní interní nástroje na správu kampaní, které jsou na trhu zcela unikátní. Nonstop monitoring, grafika na míru a efektivní škálování.',
  },
  {
    stat: '5+ let',
    label: 'zkušeností na specialistu',
    description: 'Každý náš specialista má 5+ let zkušeností. Žádní junioři. Každý ví, jak z kampaní vytěžit maximum.',
  },
  {
    stat: '7 let',
    label: 'na trhu',
    description: 'Od roku 2018 pomáháme e-shopům růst. Meta, Google, TikTok, Sklik a zlatý Shoptet partner s přímými kontakty na platformy.',
  },
];

const WHY_US_LINKS = [
  {
    label: '📈 Případové studie',
    description: 'Prohlédněte si reálné dopady na tržby klientů',
    url: 'https://www.socials.cz/pripadove-studie',
  },
  {
    label: '🎙️ Socials Podcast',
    description: 'Otevřeně mluvíme o marketingu, výkonu a vedení agentury',
    url: 'https://www.socials.cz/socials-podcast',
  },
  {
    label: '⭐ Recenze klientů',
    description: 'Co o nás říkají naši klienti na Shoptet Partner Portálu',
    url: 'https://partneri.shoptet.cz/profesionalove/socials-advertising/',
  },
];

function WhyUsSection() {
  return (
    <section>
      <SectionHeading
        title="💪 Proč právě my"
        subtitle="Ne sliby, ale skutečný business dopad. Podobnou agenturu na trhu nenajdete."
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-10">
        {WHY_US_ITEMS.map((item, i) => (
          <div
            key={i}
            className="group p-5 rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] hover:bg-foreground/[0.04] hover:border-[#94e700]/20 transition-all duration-300 cursor-default"
          >
            <p className="text-2xl md:text-3xl font-bold text-[#94e700] mb-1 group-hover:scale-105 transition-transform origin-left">{item.stat}</p>
            <p className="text-xs font-medium text-foreground/70 uppercase tracking-wider mb-3">{item.label}</p>
            <p className="text-xs text-muted-foreground/70 leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {WHY_US_LINKS.map((link, i) => (
          <a
            key={i}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex-1 flex items-center gap-3 p-4 rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] hover:border-[#94e700]/30 hover:bg-[#94e700]/5 transition-all duration-300"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground group-hover:text-[#94e700] transition-colors">{link.label}</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">{link.description}</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground/40 group-hover:text-[#94e700] shrink-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        ))}
      </div>
    </section>
  );
}

function ReportingSection() {
  const DEMO_REPORT_URL = 'https://68bb7487-e1f5-44d2-a8a4-9044e8cf5438.lovableproject.com/shared-report/376158d883246f2ecfec54891d03e0a3c0ae4090e0c5dda9';
  
  return (
    <section>
      <SectionHeading
        title="📊 Reporting až na úroveň zisku"
        subtitle="Pro Shoptet klienty dodáváme reporting až na úroveň contribution margin. Budete přesně vědět, kolik peněz vám vydělá jaký produkt."
      />
      <p className="text-sm text-muted-foreground/70 italic -mt-6 mb-8">
        (Na implementaci dalších platforem jako Shopify a Upgates nyní pracujeme.)
      </p>

      <div className="mb-6">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Interaktivní ukázka reportu</p>
        <div className="rounded-xl overflow-hidden border border-foreground/[0.08]" style={{ position: 'relative', paddingBottom: '120%', height: 0 }}>
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
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#94e700] text-black font-semibold hover:bg-[#a8f01a] transition-colors text-sm"
        >
          Otevřít demo report
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </section>
  );
}

function PortfolioGrid({ items, label }: { items: { src: string; alt: string; type: 'image' | 'video' }[]; label: string }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (selectedIndex === null) return;
    const total = items.length;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setSelectedIndex(i => i !== null ? (i + 1) % total : null);
      if (e.key === 'ArrowLeft') setSelectedIndex(i => i !== null ? (i - 1 + total) % total : null);
      if (e.key === 'Escape') setSelectedIndex(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedIndex, items.length]);

  if (items.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">{label}</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {items.map((item, i) => (
          <div
            key={i}
            onClick={() => setSelectedIndex(i)}
            className="group relative aspect-square rounded-lg overflow-hidden border border-foreground/[0.06] cursor-pointer hover:border-[#94e700]/30 hover:shadow-[0_0_30px_-10px_rgba(200,255,0,0.15)] transition-all duration-300"
          >
            {item.type === 'video' ? (
              <>
                <video
                  src={item.src}
                  className="w-full h-full object-cover"
                  muted
                  preload="auto"
                  playsInline
                  onMouseEnter={e => (e.target as HTMLVideoElement).play()}
                  onMouseLeave={e => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
                  <div className="p-2 rounded-full bg-black/60 backdrop-blur-sm">
                    <Play className="h-4 w-4 text-[#94e700] fill-[#94e700]" />
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2.5">
              <p className="text-[10px] font-medium text-foreground">{item.alt}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && (() => {
        const current = items[selectedIndex];
        const goNext = (e: React.MouseEvent) => { e.stopPropagation(); setSelectedIndex((selectedIndex + 1) % items.length); };
        const goPrev = (e: React.MouseEvent) => { e.stopPropagation(); setSelectedIndex((selectedIndex - 1 + items.length) % items.length); };
        return (
          <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setSelectedIndex(null)}
          >
            <button
              onClick={goPrev}
              className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-foreground/70 hover:text-white transition-colors backdrop-blur-sm"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            {current.type === 'video' ? (
              <video
                src={current.src}
                className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl"
                controls
                autoPlay
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <img
                src={current.src}
                alt={current.alt}
                className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
                onClick={e => e.stopPropagation()}
              />
            )}

            <button
              onClick={goNext}
              className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-foreground/70 hover:text-white transition-colors backdrop-blur-sm"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            <div className="absolute bottom-6 flex flex-col items-center gap-2">
              <p className="text-sm font-medium text-foreground/80">{current.alt}</p>
              <p className="text-xs text-muted-foreground/70">{selectedIndex + 1} / {items.length} · Klikněte kamkoliv pro zavření</p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function CreativePortfolioSection() {
  const { items: portfolioItems, isLoading: portfolioLoading } = usePublicPortfolioLocal();

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
    { src: '/images/portfolio/nutworld-ai1.mp4', alt: 'Nut World – AI video', type: 'video' as const },
    { src: '/images/portfolio/nutworld-hook1.mp4', alt: 'Nut World – hook video', type: 'video' as const },
    { src: '/images/portfolio/natios-hook1.mp4', alt: 'Natios – hook video', type: 'video' as const },
  ];

  const displayItems = portfolioItems.length > 0
    ? portfolioItems.map(i => ({ src: i.file_url, alt: i.title, type: i.type }))
    : FALLBACK_IMAGES;

  const banners = displayItems.filter(i => i.type === 'image');
  const videos = displayItems.filter(i => i.type === 'video');

  return (
    <section>
      <SectionHeading
        title="🎨 Grafika, která prodává"
        subtitle="Všem klientům doporučujeme nechat si kreativy tvořit u nás. Specializujeme se na grafiku pro výkonnostní reklamy — díky AI nástrojům nám stačí fotka produktu na bílém pozadí a vytvoříme kompletní bannery i videa."
      />

      <div className="space-y-10">
        <PortfolioGrid items={banners} label="Bannery" />
        <PortfolioGrid items={videos} label="Videa" />
      </div>
    </section>
  );
}

function ContactSection({ offer }: { offer: PublicOffer }) {
  if (!offer.owner_name && !offer.owner_email) return null;
  
  return (
    <div className="flex items-start gap-4 p-5 rounded-xl border border-foreground/[0.06] bg-foreground/[0.02]">
      <div className="w-10 h-10 rounded-full bg-[#94e700]/10 flex items-center justify-center shrink-0">
        <MessageCircle className="h-5 w-5 text-[#94e700]" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-sm mb-1 text-foreground">
          Máte dotaz? Ozvěte se mi
        </h3>
        <p className="text-xs text-muted-foreground/70 mb-3">
          Pokud vám cokoliv není jasné nebo potřebujete něco upřesnit, neváhejte mě kontaktovat.
        </p>
        <div className="space-y-1.5">
          {offer.owner_name && (
            <p className="text-sm font-medium text-foreground">{offer.owner_name}</p>
          )}
          {offer.owner_email && (
            <a href={`mailto:${offer.owner_email}`} className="text-sm text-foreground hover:text-[#94e700] hover:underline flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {offer.owner_email}
            </a>
          )}
          {offer.owner_phone && (
            <a href={`tel:${offer.owner_phone}`} className="text-sm text-foreground hover:text-[#94e700] hover:underline flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              {offer.owner_phone}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PublicOfferPage({ testToken }: { testToken?: string }) {
  const params = useParams<{ token: string }>();
  const rawToken = testToken || params.token || '';
  const token = decodeURIComponent(rawToken).trim().replace(/\/+$/, '');
  
  const [offer, setOffer] = useState<PublicOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useState(true);

  const handleCopyLink = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    function fetchOffer() {
      if (!token || token === ':token' || token.length < 3) {
        setError('Neplatný odkaz na nabídku');
        setLoading(false);
        return;
      }
      const foundOffer = getPublicOfferByToken(token);
      if (!foundOffer) {
        setError('Nabídka nebyla nalezena nebo již není platná');
        setLoading(false);
        return;
      }
      setOffer(foundOffer);
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
          <div className="mt-6 p-3 rounded bg-muted text-xs text-left">
            <p><strong>Debug:</strong></p>
            <p>Raw token: <code>{rawToken || '(prázdný)'}</code></p>
            <p>Normalized: <code>{token || '(prázdný)'}</code></p>
          </div>
          <div className="mt-4">
            <a href="/offer/test-nabidka-123" className="text-primary hover:underline text-sm">
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
    <div className={cn(isDark ? "offer-dark" : "offer-light", "min-h-screen bg-background transition-colors duration-300")}>
      {/* Sticky Header */}
      <header className={cn(
        "border-b border-foreground/[0.06] backdrop-blur-md sticky top-0 z-10 transition-colors duration-300",
        isDark ? "bg-black/80" : "bg-white/80"
      )}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <img src={isDark ? socialsLogo : socialsLogoDark} alt="Socials" className="h-9" />
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors text-muted-foreground hover:text-foreground bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06]"
              title={isDark ? "Přepnout na světlý režim" : "Přepnout na tmavý režim"}
            >
              {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={handleCopyLink}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full transition-colors border text-muted-foreground hover:text-foreground bg-foreground/[0.04] hover:bg-foreground/[0.08] border-foreground/[0.06]"
            >
              {copied ? (
                <><Check className="h-3 w-3 text-[#94e700]" /><span>Zkopírováno</span></>
              ) : (
                <><Share2 className="h-3 w-3" /><span>Sdílet</span></>
              )}
            </button>
            <Button asChild size="sm" className="bg-[#94e700] text-black hover:bg-[#a8f01a] font-semibold text-xs px-4 hidden sm:inline-flex">
              <Link to={onboardingUrl}>
                Začít spolupráci
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 md:px-10 py-12 md:py-20">
        
        {/* ===== 1. HERO ===== */}
        <section className="text-center mb-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground/70 mb-4">
            Návrh spolupráce
          </p>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 leading-[1.1]">
            Strategická nabídka pro{' '}
            <span className="text-[#94e700]">
              {offer.website 
                ? offer.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
                : offer.company_name}
            </span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Připraveno pro {offer.contact_name === 'Jan Novák' ? 'Jana Nováka' : offer.contact_name}
          </p>
        </section>

        {/* Credibility badges */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground/50 font-medium mb-16">
          <span>Meta Business Partner</span>
          <span className="text-white/10">·</span>
          <span>Google Partner</span>
          <span className="text-white/10">·</span>
          <span className="text-amber-500/70">Shoptet Zlatý Partner</span>
          <span className="text-white/10">·</span>
          <span>30 mil. Kč/měsíc ve správě</span>
        </div>

        {/* Validity warning */}
        {isExpired && (
          <div className="mb-10 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-center">
            <p className="text-red-400 font-medium text-sm">
              Platnost této nabídky vypršela
            </p>
          </div>
        )}

        {/* ===== 2. LOOM VIDEO & AUDIT ===== */}
        {(offer.audit_summary || offer.loom_url) && (
          <>
            <section>
              {offer.loom_url && (
                <div className="rounded-xl overflow-hidden border border-foreground/[0.08] mb-6">
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

            <SectionDivider />
          </>
        )}

        {/* ===== AUDIT FINDINGS ===== */}
        {offer.audit_summary && (
          <>
            <section>
              <SectionHeading
                title="🔍 Co jsme zjistili"
                subtitle="Na základě analýzy vašich reklamních účtů a webu jsme identifikovali klíčové oblasti pro zlepšení."
              />
              <div className="space-y-3">
                {offer.audit_summary.split('\n').filter(line => line.trim().length > 0).map((finding, idx) => {
                  const cleanFinding = finding.replace(/^[-•*]\s*/, '').trim();
                  if (!cleanFinding) return null;
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-4 p-4 rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] hover:bg-foreground/[0.04] hover:border-foreground/[0.1] transition-all duration-300"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-sm">💡</span>
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed">{cleanFinding}</p>
                    </div>
                  );
                })}
              </div>

              {offer.recommendation_intro && (
                <div className="mt-6 p-5 rounded-xl bg-[#94e700]/[0.05] border border-[#94e700]/20">
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">✅</span>
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">Naše doporučení</p>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{offer.recommendation_intro}</p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            <SectionDivider />
          </>
        )}

        {/* ===== 3. PROČ S NÁMI ===== */}
        <WhyUsSection />

        <SectionDivider />

        {/* ===== 4. PORTFOLIO ===== */}
        <CreativePortfolioSection />

        <SectionDivider />

        {/* ===== 5. REPORTING ===== */}
        <ReportingSection />

        <SectionDivider />

        {/* ===== 6. SLUŽBY + CENÍK ===== */}
        <section>
          <div className="rounded-2xl bg-gradient-to-br from-[#94e700]/10 via-[#94e700]/5 to-transparent border border-[#94e700]/20 p-6 md:p-8 mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">
              🎯 Nabídka na míru pro{' '}
              <span className="text-[#94e700]">
                {offer.website ? offer.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') : offer.company_name}
              </span>
            </h2>
            <p className="text-muted-foreground mt-2">
              Na základě analýzy jsme připravili balíček služeb přesně pro vaše potřeby.
            </p>
          </div>
          
          {offer.services.some(s => s.service_type === 'core') && offer.services.some(s => s.service_type === 'addon') && (
            <ServiceStructureExplanation />
          )}
          
          {(() => {
            const coreServices = offer.services.filter(s => s.service_type === 'core');
            const addonServices = offer.services.filter(s => s.service_type === 'addon');
            const otherServices = offer.services.filter(s => !s.service_type);
            
            if (coreServices.length === 0) {
              return (
                <div className="space-y-3">
                  {offer.services.map((service, idx) => (
                    <ServiceCard key={service.id || idx} service={service} />
                  ))}
                </div>
              );
            }
            
            return (
              <div className="space-y-8">
                {coreServices.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-foreground/[0.06]">
                      <div className="w-8 h-8 rounded-lg bg-[#94e700]/10 flex items-center justify-center">
                        <StarIcon className="h-4 w-4 text-[#94e700]" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-foreground">Hlavní služby</span>
                        <p className="text-xs text-muted-foreground">Klíčové služby pro růst vašeho byznysu</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {coreServices.map((service, idx) => (
                        <ServiceCard key={service.id || idx} service={service} />
                      ))}
                    </div>
                  </div>
                )}
                
                {addonServices.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-foreground/[0.06]">
                      <div className="w-8 h-8 rounded-lg bg-foreground/[0.05] flex items-center justify-center">
                        <PlusIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-foreground">Doplňkové služby</span>
                        <p className="text-xs text-muted-foreground">Rozšíření pro maximální výkon</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {addonServices.map((service, idx) => (
                        <ServiceCard key={service.id || idx} service={service} />
                      ))}
                    </div>
                  </div>
                )}
                
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
        <div className="mt-10 p-8 md:p-10 rounded-2xl border-2 border-[#94e700]/30 bg-gradient-to-br from-[#94e700]/[0.08] to-[#94e700]/[0.02] shadow-[0_0_60px_-20px_rgba(148,231,0,0.15)] relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#94e700]/10 rounded-full blur-3xl pointer-events-none" />
          
          <h3 className="text-lg font-bold text-foreground mb-6">💰 Cenový souhrn</h3>
          
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
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-base text-muted-foreground font-medium">Měsíční cena</span>
                  <div className="text-right flex flex-wrap items-baseline justify-end gap-x-2">
                    {discountPercent > 0 ? (
                      <>
                        <span className="text-sm text-muted-foreground/70 line-through">
                          {totalMonthly.toLocaleString('cs-CZ')} {offer.currency}
                        </span>
                        <span className="text-2xl md:text-4xl font-extrabold text-[#94e700] tracking-tight whitespace-nowrap">
                          {totalAfterDiscount.toLocaleString('cs-CZ')} {offer.currency}
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl md:text-4xl font-extrabold text-[#94e700] tracking-tight whitespace-nowrap">
                        {totalMonthly.toLocaleString('cs-CZ')} {offer.currency}
                      </span>
                    )}
                    <span className="text-sm text-muted-foreground/70">/měsíc</span>
                  </div>
                </div>
                {discountPercent > 0 && (
                  <div className="flex items-center justify-between text-sm bg-emerald-500/10 rounded-lg px-4 py-2.5 border border-emerald-500/20">
                    <span className="text-emerald-500 font-medium">✨ Sleva {discountPercent}% {scope === 'all_services' ? 'na všechny služby' : 'na core služby'} při odběru všech služeb</span>
                    <span className="font-bold text-emerald-500">-{discountAmount.toLocaleString('cs-CZ')} {offer.currency}/měs</span>
                  </div>
                )}
              </div>
            );
          })()}
          {totalOneOff > 0 && (
            <>
              {totalMonthly > 0 && <div className="border-t border-foreground/[0.1] my-5" />}
              <div className="flex items-center justify-between">
                <span className="text-base text-muted-foreground font-medium">Jednorázově</span>
                <span className="text-2xl font-bold text-foreground">
                  {totalOneOff.toLocaleString('cs-CZ')} {offer.currency}
                </span>
              </div>
            </>
          )}
          <div className="mt-5 pt-4 border-t border-foreground/[0.06]">
            <p className="text-[11px] text-muted-foreground/60 text-right">Ceny jsou uvedeny bez DPH</p>
            <p className="text-[11px] text-muted-foreground/60 text-right">Měsíční položky fakturujeme v prvním měsíci poměrně ode dne zahájení služby.</p>
          </div>
        </div>

        <SectionDivider />

        {/* ===== 7. ONBOARDING ===== */}
        <OnboardingProcessSection />

        <SectionDivider />

        {/* ===== 8. KONTAKT + CTA ===== */}
        <section className="space-y-6">
          <ContactSection offer={offer} />
          
          <div className="text-center pt-10 pb-12 px-4">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight">
              🚀 Pojďme do toho
            </h2>
            <p className="mb-4 text-muted-foreground text-base max-w-md mx-auto">
              Stačí vyplnit krátký formulář a můžeme začít.
            </p>
            <p className="mb-8 text-muted-foreground/70 text-sm max-w-md mx-auto">
              Celý onboarding zvládneme do 48 hodin — smlouvu pošleme k digitálnímu podpisu, nastavíme přístupy a spustíme kampaně.
            </p>
            <div className="flex justify-center">
              <Button 
                asChild 
                size="lg" 
                className="bg-[#94e700] text-black hover:bg-[#a8f01a] font-bold px-12 py-7 text-lg rounded-xl shadow-[0_0_40px_-10px_rgba(148,231,0,0.4)] hover:shadow-[0_0_50px_-10px_rgba(148,231,0,0.5)] transition-all"
              >
                <Link to={onboardingUrl}>
                  Začít spolupráci
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
            </div>
            <p className="mt-5 text-xs text-muted-foreground/50">
              ✅ Smlouva do 24 hodin
            </p>
          </div>
        </section>

        {/* ===== CERTIFIKACE ===== */}
        <section className="mt-16 rounded-2xl bg-gray-900 dark:bg-gray-800 py-10 px-6">
          <h2 className="text-lg font-semibold text-center mb-2 text-white">🏆 Certifikace & partnerství</h2>
          <p className="text-sm text-gray-400 text-center mb-8">Oficiálně certifikovaný tým s přístupem k nejnovějším nástrojům a beta funkcím</p>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4 items-center justify-items-center">
            {[cert8, cert7, cert6, cert1, cert2, cert3, cert4, cert5].map((cert, i) => (
              <img key={i} src={cert} alt={`Certifikace ${i + 1}`} className="h-12 md:h-16 object-contain opacity-80 hover:opacity-100 transition-opacity" />
            ))}
          </div>
        </section>

        {/* ===== 9. FOOTER ===== */}
        <footer className="pt-8 mt-16 border-t border-foreground/[0.06]">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
              <a href="https://www.socials.cz/pripadove-studie" target="_blank" rel="noopener noreferrer"
                className="text-muted-foreground/70 hover:text-[#94e700] transition-colors inline-flex items-center gap-1">
                Případové studie <ExternalLink className="h-3 w-3" />
              </a>
              <a href="https://partneri.shoptet.cz/profesionalove/socials-advertising/" target="_blank" rel="noopener noreferrer"
                className="text-muted-foreground/70 hover:text-[#94e700] transition-colors inline-flex items-center gap-1">
                Recenze klientů <ExternalLink className="h-3 w-3" />
              </a>
              <a href="https://www.socials.cz/o-nas" target="_blank" rel="noopener noreferrer"
                className="text-muted-foreground/70 hover:text-[#94e700] transition-colors inline-flex items-center gap-1">
                O nás <ExternalLink className="h-3 w-3" />
              </a>
              <a href="https://www.socials.cz/socials-podcast" target="_blank" rel="noopener noreferrer"
                className="text-muted-foreground/70 hover:text-[#94e700] transition-colors inline-flex items-center gap-1">
                Podcast <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <img src={isDark ? socialsLogo : socialsLogoDark} alt="Socials" className="h-5 opacity-30" />
          </div>
        </footer>
      </main>

      {/* Sticky CTA for mobile */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 p-3 pb-6 backdrop-blur-md border-t border-foreground/[0.06] sm:hidden safe-area-bottom",
        isDark ? "bg-black/95" : "bg-white/95"
      )}>
        <div className="flex justify-center">
          <Button asChild className="bg-[#94e700] text-black hover:bg-[#a8f01a] font-semibold w-full max-w-xs">
            <Link to={onboardingUrl}>
              Začít spolupráci
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
