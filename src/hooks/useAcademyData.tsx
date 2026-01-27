import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AcademyLink {
  label: string;
  url: string;
  type?: 'sop' | 'doc' | 'video' | 'external';
}

export interface AcademyVideo {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  duration: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  sort_order: number;
  is_active: boolean;
  links?: AcademyLink[]; // Related resources (SOP, docs, etc.)
}

export interface AcademyModule {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  required: boolean;
  sort_order: number;
  is_active: boolean;
  videos: AcademyVideo[];
  links?: AcademyLink[]; // Module-level resources
}

// Default mock data while database tables aren't created
const DEFAULT_MODULES: AcademyModule[] = [
  // ═══════════════════════════════════════════════════════════
  // POVINNÉ MODULY - Základy pro každého nového kolegu
  // ═══════════════════════════════════════════════════════════
  {
    id: 'welcome',
    title: 'Vítej v Socials! 👋',
    description: 'Úvod do naší agentury, kultury a hodnot',
    icon: 'Users',
    required: true,
    sort_order: 1,
    is_active: true,
    videos: [
      { id: 'welcome-1', module_id: 'welcome', title: 'Kdo jsme a co děláme', description: 'Seznámení s agenturou Socials, naše mise a vize', duration: '5:30', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnail_url: null, sort_order: 1, is_active: true },
      { id: 'welcome-2', module_id: 'welcome', title: 'Naše hodnoty a kultura', description: 'Jak u nás pracujeme a co je pro nás důležité', duration: '4:15', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnail_url: null, sort_order: 2, is_active: true },
      { id: 'welcome-3', module_id: 'welcome', title: 'Seznámení s týmem', description: 'Kdo je kdo a na koho se obrátit', duration: '6:00', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnail_url: null, sort_order: 3, is_active: true },
    ],
  },
  {
    id: 'tools',
    title: 'Nástroje a procesy 🛠️',
    description: 'Všechny nástroje které používáme denně',
    icon: 'Settings',
    required: true,
    sort_order: 2,
    is_active: true,
    links: [
      { label: 'SOP: Freelo workflow', url: 'https://docs.google.com/document/d/freelo-sop', type: 'sop' },
      { label: 'SOP: Slack pravidla', url: 'https://docs.google.com/document/d/slack-sop', type: 'sop' },
    ],
    videos: [
      { id: 'tools-1', module_id: 'tools', title: 'CRM systém - základy', description: 'Jak používat Socials CRM pro správu klientů', duration: '8:20', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnail_url: null, sort_order: 1, is_active: true },
      { id: 'tools-2', module_id: 'tools', title: 'Freelo - projektové řízení', description: 'Práce s úkoly a projekty ve Freelu', duration: '7:45', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnail_url: null, sort_order: 2, is_active: true },
      { id: 'tools-3', module_id: 'tools', title: 'Slack komunikace', description: 'Pravidla komunikace a kanály', duration: '4:00', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnail_url: null, sort_order: 3, is_active: true },
      { id: 'tools-4', module_id: 'tools', title: 'Google Workspace', description: 'Dokumenty, kalendář a další Google nástroje', duration: '5:30', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnail_url: null, sort_order: 4, is_active: true },
    ],
  },
  {
    id: 'clients',
    title: 'Práce s klienty 🤝',
    description: 'Jak komunikovat a pracovat s našimi klienty',
    icon: 'Briefcase',
    required: true,
    sort_order: 3,
    is_active: true,
    links: [
      { label: 'SOP: Onboarding klienta', url: 'https://docs.google.com/document/d/onboarding-sop', type: 'sop' },
      { label: 'Šablona: Welcome email', url: 'https://docs.google.com/document/d/welcome-email', type: 'doc' },
    ],
    videos: [
      { id: 'clients-1', module_id: 'clients', title: 'Onboarding nového klienta', description: 'Proces nástupu nového klienta krok za krokem', duration: '10:15', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnail_url: null, sort_order: 1, is_active: true },
      { id: 'clients-2', module_id: 'clients', title: 'Pravidelná komunikace', description: 'Jak a kdy komunikovat s klienty', duration: '6:30', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnail_url: null, sort_order: 2, is_active: true },
      { id: 'clients-3', module_id: 'clients', title: 'Řešení problémů', description: 'Co dělat když něco nejde podle plánu', duration: '7:00', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnail_url: null, sort_order: 3, is_active: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // CRM PROCESY - Jak pracovat v CRM
  // ═══════════════════════════════════════════════════════════
  {
    id: 'upsell-commissions',
    title: 'Provize za upselly 💰',
    description: 'Jak funguje provizní systém za prodej služeb a víceprací',
    icon: 'Coins',
    required: true,
    sort_order: 4,
    is_active: true,
    links: [
      { label: 'Pravidla provizí', url: 'https://docs.google.com/document/d/upsell-rules', type: 'doc' },
    ],
    videos: [
      { 
        id: 'upsell-1', 
        module_id: 'upsell-commissions', 
        title: 'Jak fungují provize', 
        description: 'Přehled provizního systému - 10% z prvního měsíce fakturace za nové služby a vícepráce', 
        duration: '5:00', 
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
        thumbnail_url: null, 
        sort_order: 1, 
        is_active: true 
      },
      { 
        id: 'upsell-2', 
        module_id: 'upsell-commissions', 
        title: 'Typy upsellů', 
        description: 'Nové zakázky, rozšíření služeb a vícepráce - co se počítá do provizí', 
        duration: '4:30', 
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
        thumbnail_url: null, 
        sort_order: 2, 
        is_active: true 
      },
      { 
        id: 'upsell-3', 
        module_id: 'upsell-commissions', 
        title: 'Jak evidovat upsell v CRM', 
        description: 'Krok za krokem - jak správně zadat upsell aby se ti spočítala provize', 
        duration: '6:00', 
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
        thumbnail_url: null, 
        sort_order: 3, 
        is_active: true 
      },
      { 
        id: 'upsell-4', 
        module_id: 'upsell-commissions', 
        title: 'Schvalovací proces', 
        description: 'Jak probíhá schválení provize a kdy ji dostaneš vyplacenou', 
        duration: '3:30', 
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
        thumbnail_url: null, 
        sort_order: 4, 
        is_active: true 
      },
    ],
  },
  {
    id: 'extra-work',
    title: 'Evidence víceprací 🔧',
    description: 'Jak správně evidovat vícepráce v CRM',
    icon: 'FileText',
    required: true,
    sort_order: 5,
    is_active: true,
    links: [
      { label: 'SOP: Vícepráce', url: 'https://docs.google.com/document/d/extra-work-sop', type: 'sop' },
      { label: 'Ceník víceprací', url: 'https://docs.google.com/spreadsheets/d/pricing', type: 'doc' },
    ],
    videos: [
      { 
        id: 'ew-1', 
        module_id: 'extra-work', 
        title: 'Co je vícepráce', 
        description: 'Definice vícepráce - co se počítá a co ne', 
        duration: '4:00', 
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
        thumbnail_url: null, 
        sort_order: 1, 
        is_active: true 
      },
      { 
        id: 'ew-2', 
        module_id: 'extra-work', 
        title: 'Vytvoření vícepráce v CRM', 
        description: 'Jak založit novou vícepráci - klient, popis, hodiny, cena', 
        duration: '5:30', 
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
        thumbnail_url: null, 
        sort_order: 2, 
        is_active: true 
      },
      { 
        id: 'ew-3', 
        module_id: 'extra-work', 
        title: 'Workflow schvalování', 
        description: 'Stavy vícepráce: Čeká na schválení → Schváleno → K fakturaci → Vyfakturováno', 
        duration: '4:00', 
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
        thumbnail_url: null, 
        sort_order: 3, 
        is_active: true 
      },
      { 
        id: 'ew-4', 
        module_id: 'extra-work', 
        title: 'Komunikace s klientem', 
        description: 'Jak se domluvit s klientem na vícepráci před jejím zahájením', 
        duration: '5:00', 
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
        thumbnail_url: null, 
        sort_order: 4, 
        is_active: true 
      },
    ],
  },
  {
    id: 'modification-requests',
    title: 'Návrhy změn v zakázkách 📝',
    description: 'Jak funguje schvalovací workflow pro změny v zakázkách',
    icon: 'ClipboardCheck',
    required: true,
    sort_order: 6,
    is_active: true,
    links: [
      { label: 'SOP: Změny v zakázkách', url: 'https://docs.google.com/document/d/modifications-sop', type: 'sop' },
    ],
    videos: [
      { 
        id: 'mod-1', 
        module_id: 'modification-requests', 
        title: 'Co jsou návrhy změn', 
        description: 'Přidání služby, změna ceny, deaktivace - kdy použít návrh změny', 
        duration: '4:00', 
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
        thumbnail_url: null, 
        sort_order: 1, 
        is_active: true 
      },
      { 
        id: 'mod-2', 
        module_id: 'modification-requests', 
        title: 'Vytvoření návrhu změny', 
        description: 'Jak podat návrh na změnu v zakázce krok za krokem', 
        duration: '5:30', 
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
        thumbnail_url: null, 
        sort_order: 2, 
        is_active: true 
      },
      { 
        id: 'mod-3', 
        module_id: 'modification-requests', 
        title: 'Schvalovací workflow', 
        description: 'Pending → Approved → Client Approved → Applied - celý proces', 
        duration: '6:00', 
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
        thumbnail_url: null, 
        sort_order: 3, 
        is_active: true 
      },
      { 
        id: 'mod-4', 
        module_id: 'modification-requests', 
        title: 'Upgrade offer pro klienta', 
        description: 'Jak klient schvaluje změny přes veřejný odkaz', 
        duration: '4:00', 
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
        thumbnail_url: null, 
        sort_order: 4, 
        is_active: true 
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // SLUŽBY - Detaily jednotlivých služeb
  // ═══════════════════════════════════════════════════════════
  {
    id: 'services-overview',
    title: 'Přehled našich služeb 📦',
    description: 'Detailní popis všech služeb které nabízíme',
    icon: 'Package',
    required: false,
    sort_order: 7,
    is_active: true,
    links: [
      { label: 'Katalog služeb', url: 'https://docs.google.com/spreadsheets/d/services-catalog', type: 'doc' },
      { label: 'Ceník služeb', url: 'https://docs.google.com/spreadsheets/d/pricing', type: 'doc' },
    ],
    videos: [
      { 
        id: 'srv-1', 
        module_id: 'services-overview', 
        title: 'Core vs Add-on služby', 
        description: 'Rozdíl mezi základními a doplňkovými službami', 
        duration: '4:00', 
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
        thumbnail_url: null, 
        sort_order: 1, 
        is_active: true 
      },
      { 
        id: 'srv-2', 
        module_id: 'services-overview', 
        title: 'Tier systém: Growth, Pro, Elite', 
        description: 'Jak fungují úrovně služeb a co obsahují', 
        duration: '6:00', 
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
        thumbnail_url: null, 
        sort_order: 2, 
        is_active: true 
      },
    ],
  },
  {
    id: 'service-meta-ads',
    title: 'Meta Ads 📘',
    description: 'Facebook a Instagram reklama',
    icon: 'Target',
    required: false,
    sort_order: 8,
    is_active: true,
    links: [
      { label: 'SOP: Meta Ads setup', url: 'https://docs.google.com/document/d/meta-setup-sop', type: 'sop' },
      { label: 'SOP: Meta Ads optimalizace', url: 'https://docs.google.com/document/d/meta-optimization-sop', type: 'sop' },
      { label: 'Šablona: Reporting', url: 'https://docs.google.com/spreadsheets/d/meta-report-template', type: 'doc' },
      { label: 'Meta Business Help', url: 'https://www.facebook.com/business/help', type: 'external' },
    ],
    videos: [
      { 
        id: 'meta-1', 
        module_id: 'service-meta-ads', 
        title: 'Meta Ads základy', 
        description: 'Úvod do Facebook a Instagram reklamy', 
        duration: '12:00', 
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
        thumbnail_url: null, 
        sort_order: 1, 
        is_active: true 
      },
      { 
        id: 'meta-2', 
        module_id: 'service-meta-ads', 
        title: 'Struktura kampaní', 
        description: 'Best practices pro strukturu účtu a kampaní', 
        duration: '10:00', 
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
        thumbnail_url: null, 
        sort_order: 2, 
        is_active: true 
      },
      { 
        id: 'meta-3', 
        module_id: 'service-meta-ads', 
        title: 'Optimalizace a škálování', 
        description: 'Jak optimalizovat kampaně a škálovat rozpočty', 
        duration: '15:00', 
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
        thumbnail_url: null, 
        sort_order: 3, 
        is_active: true 
      },
    ],
  },
  {
    id: 'service-google-ads',
    title: 'Google Ads 🔎',
    description: 'Google Search, Shopping a PMax',
    icon: 'Search',
    required: false,
    sort_order: 9,
    is_active: true,
    links: [
      { label: 'SOP: Google Ads setup', url: 'https://docs.google.com/document/d/google-setup-sop', type: 'sop' },
      { label: 'SOP: PMax kampane', url: 'https://docs.google.com/document/d/pmax-sop', type: 'sop' },
      { label: 'SOP: Shopping feed', url: 'https://docs.google.com/document/d/shopping-feed-sop', type: 'sop' },
      { label: 'Google Ads Help', url: 'https://support.google.com/google-ads', type: 'external' },
    ],
    videos: [
      { 
        id: 'google-1', 
        module_id: 'service-google-ads', 
        title: 'Google Ads základy', 
        description: 'Úvod do Google vyhledávání a PMax', 
        duration: '11:30', 
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
        thumbnail_url: null, 
        sort_order: 1, 
        is_active: true 
      },
      { 
        id: 'google-2', 
        module_id: 'service-google-ads', 
        title: 'Shopping a Product Feed', 
        description: 'Nastavení Merchant Center a produktového feedu', 
        duration: '14:00', 
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
        thumbnail_url: null, 
        sort_order: 2, 
        is_active: true 
      },
      { 
        id: 'google-3', 
        module_id: 'service-google-ads', 
        title: 'Performance Max', 
        description: 'Jak správně nastavit a optimalizovat PMax', 
        duration: '12:00', 
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
        thumbnail_url: null, 
        sort_order: 3, 
        is_active: true 
      },
    ],
  },
  {
    id: 'service-creative-boost',
    title: 'Creative Boost 🎨',
    description: 'Vše o naší kreativní službě',
    icon: 'Sparkles',
    required: false,
    sort_order: 10,
    is_active: true,
    links: [
      { label: 'SOP: Creative Boost', url: 'https://docs.google.com/document/d/creative-boost-sop', type: 'sop' },
      { label: 'Brand Guidelines šablona', url: 'https://docs.google.com/document/d/brand-guidelines', type: 'doc' },
      { label: 'Canva Team', url: 'https://www.canva.com/team', type: 'external' },
    ],
    videos: [
      { id: 'cb-1', module_id: 'service-creative-boost', title: 'Co je Creative Boost', description: 'Představení služby a jak funguje', duration: '5:00', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnail_url: null, sort_order: 1, is_active: true },
      { id: 'cb-2', module_id: 'service-creative-boost', title: 'Kreditový systém', description: 'Jak fungují kredity a odměny pro grafiky (80 Kč/kredit)', duration: '6:30', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnail_url: null, sort_order: 2, is_active: true },
      { id: 'cb-3', module_id: 'service-creative-boost', title: 'Typy výstupů a kredity', description: 'Kolik kreditů stojí jednotlivé typy grafik', duration: '5:00', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnail_url: null, sort_order: 3, is_active: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // DALŠÍ UŽITEČNÉ SEKCE
  // ═══════════════════════════════════════════════════════════
  {
    id: 'leads-sales',
    title: 'Leady a prodej 🎯',
    description: 'Jak pracovat s leady a uzavírat obchody',
    icon: 'Target',
    required: false,
    sort_order: 11,
    is_active: true,
    links: [
      { label: 'SOP: Kvalifikace leadů', url: 'https://docs.google.com/document/d/lead-qualification-sop', type: 'sop' },
      { label: 'Šablona: Nabídka', url: 'https://docs.google.com/document/d/offer-template', type: 'doc' },
    ],
    videos: [
      { 
        id: 'leads-1', 
        module_id: 'leads-sales', 
        title: 'Lead pipeline v CRM', 
        description: 'Stádia leadů a jak s nimi pracovat', 
        duration: '7:00', 
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
        thumbnail_url: null, 
        sort_order: 1, 
        is_active: true 
      },
      { 
        id: 'leads-2', 
        module_id: 'leads-sales', 
        title: 'Příprava nabídky', 
        description: 'Jak připravit nabídku pro klienta v CRM', 
        duration: '8:00', 
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
        thumbnail_url: null, 
        sort_order: 2, 
        is_active: true 
      },
      { 
        id: 'leads-3', 
        module_id: 'leads-sales', 
        title: 'Konverze leadu na klienta', 
        description: 'Proces převodu leadu na aktivního klienta', 
        duration: '5:00', 
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
        thumbnail_url: null, 
        sort_order: 3, 
        is_active: true 
      },
    ],
  },
  {
    id: 'invoicing',
    title: 'Fakturace 🧾',
    description: 'Jak funguje fakturační proces',
    icon: 'Receipt',
    required: false,
    sort_order: 12,
    is_active: true,
    links: [
      { label: 'SOP: Fakturace', url: 'https://docs.google.com/document/d/invoicing-sop', type: 'sop' },
      { label: 'Fakturoid', url: 'https://app.fakturoid.cz', type: 'external' },
    ],
    videos: [
      { 
        id: 'inv-1', 
        module_id: 'invoicing', 
        title: 'Fakturační cyklus', 
        description: 'Kdy a jak se fakturují služby a vícepráce', 
        duration: '6:00', 
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
        thumbnail_url: null, 
        sort_order: 1, 
        is_active: true 
      },
      { 
        id: 'inv-2', 
        module_id: 'invoicing', 
        title: 'Práce s CRM fakturací', 
        description: 'Jak používat fakturační modul v CRM', 
        duration: '8:00', 
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
        thumbnail_url: null, 
        sort_order: 2, 
        is_active: true 
      },
    ],
  },
  {
    id: 'reporting',
    title: 'Reporting a analýza 📊',
    description: 'Jak připravovat reporty pro klienty',
    icon: 'BarChart3',
    required: false,
    sort_order: 13,
    is_active: true,
    links: [
      { label: 'SOP: Měsíční report', url: 'https://docs.google.com/document/d/report-sop', type: 'sop' },
      { label: 'Šablona: Report deck', url: 'https://docs.google.com/presentation/d/report-template', type: 'doc' },
      { label: 'Looker Studio', url: 'https://lookerstudio.google.com', type: 'external' },
    ],
    videos: [
      { 
        id: 'rep-1', 
        module_id: 'reporting', 
        title: 'Jak číst data', 
        description: 'Základy datové analýzy a metrik', 
        duration: '9:45', 
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
        thumbnail_url: null, 
        sort_order: 1, 
        is_active: true 
      },
      { 
        id: 'rep-2', 
        module_id: 'reporting', 
        title: 'Příprava měsíčního reportu', 
        description: 'Krok za krokem jak připravit report pro klienta', 
        duration: '12:00', 
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
        thumbnail_url: null, 
        sort_order: 2, 
        is_active: true 
      },
    ],
  },
  {
    id: 'meetings',
    title: 'Meetingy s klienty 📅',
    description: 'Jak vést efektivní schůzky',
    icon: 'Calendar',
    required: false,
    sort_order: 14,
    is_active: true,
    links: [
      { label: 'SOP: Příprava na meeting', url: 'https://docs.google.com/document/d/meeting-prep-sop', type: 'sop' },
      { label: 'Šablona: Meeting notes', url: 'https://docs.google.com/document/d/meeting-notes', type: 'doc' },
    ],
    videos: [
      { 
        id: 'meet-1', 
        module_id: 'meetings', 
        title: 'Příprava na meeting', 
        description: 'Co připravit před schůzkou s klientem', 
        duration: '5:00', 
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
        thumbnail_url: null, 
        sort_order: 1, 
        is_active: true 
      },
      { 
        id: 'meet-2', 
        module_id: 'meetings', 
        title: 'Evidence meetingů v CRM', 
        description: 'Jak zaznamenávat schůzky a úkoly', 
        duration: '4:00', 
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
        thumbnail_url: null, 
        sort_order: 2, 
        is_active: true 
      },
    ],
  },
];

interface AcademyDataContextType {
  modules: AcademyModule[];
  isLoading: boolean;
  error: string | null;
  isUsingDatabase: boolean;
  refetch: () => Promise<void>;
  // Admin functions
  createModule: (module: Partial<AcademyModule>) => Promise<AcademyModule | null>;
  updateModule: (id: string, module: Partial<AcademyModule>) => Promise<boolean>;
  deleteModule: (id: string) => Promise<boolean>;
  createVideo: (video: Partial<AcademyVideo>) => Promise<AcademyVideo | null>;
  updateVideo: (id: string, video: Partial<AcademyVideo>) => Promise<boolean>;
  deleteVideo: (id: string) => Promise<boolean>;
  reorderModules: (orderedIds: string[]) => Promise<boolean>;
  reorderVideos: (moduleId: string, orderedIds: string[]) => Promise<boolean>;
}

const AcademyDataContext = createContext<AcademyDataContextType | undefined>(undefined);

export function AcademyDataProvider({ children }: { children: ReactNode }) {
  const [modules, setModules] = useState<AcademyModule[]>(DEFAULT_MODULES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingDatabase, setIsUsingDatabase] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Try to fetch from database - use rpc or raw query approach
      // This will fail gracefully if tables don't exist
      const { data: modulesData, error: modulesError } = await supabase
        .rpc('get_academy_modules' as never)
        .select('*');

      if (modulesError) {
        // Tables don't exist yet, use default data
        console.log('Academy tables not found, using default data');
        setModules(DEFAULT_MODULES);
        setIsUsingDatabase(false);
        setIsLoading(false);
        return;
      }

      // If we got here, database tables exist
      setIsUsingDatabase(true);

      const { data: videosData, error: videosError } = await supabase
        .rpc('get_academy_videos' as never)
        .select('*');

      if (videosError) {
        setModules(DEFAULT_MODULES);
        setIsUsingDatabase(false);
        setIsLoading(false);
        return;
      }

      // Combine modules with their videos
      const modulesWithVideos: AcademyModule[] = ((modulesData as unknown as AcademyModule[]) || []).map(module => ({
        ...module,
        videos: ((videosData as unknown as AcademyVideo[]) || []).filter(video => video.module_id === module.id)
      }));

      setModules(modulesWithVideos.length > 0 ? modulesWithVideos : DEFAULT_MODULES);
    } catch (err) {
      console.log('Using default academy data');
      setModules(DEFAULT_MODULES);
      setIsUsingDatabase(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Try direct table access as alternative
  const fetchDataDirect = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Try direct table access using any type to bypass TypeScript
      const modulesResult = await (supabase as any)
        .from('academy_modules')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (modulesResult.error) {
        // Tables don't exist yet, use default data
        console.log('Academy tables not found, using default data');
        setModules(DEFAULT_MODULES);
        setIsUsingDatabase(false);
        setIsLoading(false);
        return;
      }

      // If we got here, database tables exist
      setIsUsingDatabase(true);

      const videosResult = await (supabase as any)
        .from('academy_videos')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (videosResult.error) {
        setModules(DEFAULT_MODULES);
        setIsUsingDatabase(false);
        setIsLoading(false);
        return;
      }

      // Combine modules with their videos
      const modulesWithVideos: AcademyModule[] = (modulesResult.data || []).map((module: any) => ({
        ...module,
        videos: (videosResult.data || []).filter((video: any) => video.module_id === module.id)
      }));

      setModules(modulesWithVideos.length > 0 ? modulesWithVideos : DEFAULT_MODULES);
    } catch (err) {
      console.log('Using default academy data');
      setModules(DEFAULT_MODULES);
      setIsUsingDatabase(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDataDirect();
  }, [fetchDataDirect]);

  const createModule = async (moduleData: Partial<AcademyModule>): Promise<AcademyModule | null> => {
    if (!isUsingDatabase) {
      toast({ title: 'Info', description: 'Databázové tabulky ještě nebyly vytvořeny. Spusťte migraci.', variant: 'destructive' });
      return null;
    }
    
    try {
      const { data, error } = await (supabase as any)
        .from('academy_modules')
        .insert({
          title: moduleData.title || 'Nový modul',
          description: moduleData.description,
          icon: moduleData.icon || 'BookOpen',
          required: moduleData.required || false,
          sort_order: moduleData.sort_order || modules.length + 1,
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Modul vytvořen', description: 'Nový modul byl úspěšně přidán' });
      await fetchDataDirect();
      return { ...data, videos: [] };
    } catch (err) {
      console.error('Error creating module:', err);
      toast({ title: 'Chyba', description: 'Nepodařilo se vytvořit modul', variant: 'destructive' });
      return null;
    }
  };

  const updateModule = async (id: string, moduleData: Partial<AcademyModule>): Promise<boolean> => {
    if (!isUsingDatabase) {
      toast({ title: 'Info', description: 'Databázové tabulky ještě nebyly vytvořeny', variant: 'destructive' });
      return false;
    }
    
    try {
      const { error } = await (supabase as any)
        .from('academy_modules')
        .update({
          title: moduleData.title,
          description: moduleData.description,
          icon: moduleData.icon,
          required: moduleData.required,
          sort_order: moduleData.sort_order,
          is_active: moduleData.is_active,
        })
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Modul upraven', description: 'Změny byly uloženy' });
      await fetchDataDirect();
      return true;
    } catch (err) {
      console.error('Error updating module:', err);
      toast({ title: 'Chyba', description: 'Nepodařilo se upravit modul', variant: 'destructive' });
      return false;
    }
  };

  const deleteModule = async (id: string): Promise<boolean> => {
    if (!isUsingDatabase) {
      toast({ title: 'Info', description: 'Databázové tabulky ještě nebyly vytvořeny', variant: 'destructive' });
      return false;
    }
    
    try {
      const { error } = await (supabase as any)
        .from('academy_modules')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Modul smazán', description: 'Modul byl odstraněn' });
      await fetchDataDirect();
      return true;
    } catch (err) {
      console.error('Error deleting module:', err);
      toast({ title: 'Chyba', description: 'Nepodařilo se smazat modul', variant: 'destructive' });
      return false;
    }
  };

  const createVideo = async (videoData: Partial<AcademyVideo>): Promise<AcademyVideo | null> => {
    if (!isUsingDatabase) {
      toast({ title: 'Info', description: 'Databázové tabulky ještě nebyly vytvořeny', variant: 'destructive' });
      return null;
    }
    
    try {
      const moduleVideos = modules.find(m => m.id === videoData.module_id)?.videos || [];
      
      const { data, error } = await (supabase as any)
        .from('academy_videos')
        .insert({
          module_id: videoData.module_id,
          title: videoData.title || 'Nové video',
          description: videoData.description,
          duration: videoData.duration,
          video_url: videoData.video_url,
          thumbnail_url: videoData.thumbnail_url,
          sort_order: videoData.sort_order || moduleVideos.length + 1,
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Video přidáno', description: 'Nové video bylo úspěšně přidáno' });
      await fetchDataDirect();
      return data;
    } catch (err) {
      console.error('Error creating video:', err);
      toast({ title: 'Chyba', description: 'Nepodařilo se přidat video', variant: 'destructive' });
      return null;
    }
  };

  const updateVideo = async (id: string, videoData: Partial<AcademyVideo>): Promise<boolean> => {
    if (!isUsingDatabase) {
      toast({ title: 'Info', description: 'Databázové tabulky ještě nebyly vytvořeny', variant: 'destructive' });
      return false;
    }
    
    try {
      const { error } = await (supabase as any)
        .from('academy_videos')
        .update({
          title: videoData.title,
          description: videoData.description,
          duration: videoData.duration,
          video_url: videoData.video_url,
          thumbnail_url: videoData.thumbnail_url,
          sort_order: videoData.sort_order,
          is_active: videoData.is_active,
        })
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Video upraveno', description: 'Změny byly uloženy' });
      await fetchDataDirect();
      return true;
    } catch (err) {
      console.error('Error updating video:', err);
      toast({ title: 'Chyba', description: 'Nepodařilo se upravit video', variant: 'destructive' });
      return false;
    }
  };

  const deleteVideo = async (id: string): Promise<boolean> => {
    if (!isUsingDatabase) {
      toast({ title: 'Info', description: 'Databázové tabulky ještě nebyly vytvořeny', variant: 'destructive' });
      return false;
    }
    
    try {
      const { error } = await (supabase as any)
        .from('academy_videos')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Video smazáno', description: 'Video bylo odstraněno' });
      await fetchDataDirect();
      return true;
    } catch (err) {
      console.error('Error deleting video:', err);
      toast({ title: 'Chyba', description: 'Nepodařilo se smazat video', variant: 'destructive' });
      return false;
    }
  };

  const reorderModules = async (orderedIds: string[]): Promise<boolean> => {
    if (!isUsingDatabase) return false;
    
    try {
      const updates = orderedIds.map((id, index) => 
        (supabase as any)
          .from('academy_modules')
          .update({ sort_order: index + 1 })
          .eq('id', id)
      );

      await Promise.all(updates);
      await fetchDataDirect();
      return true;
    } catch (err) {
      console.error('Error reordering modules:', err);
      toast({ title: 'Chyba', description: 'Nepodařilo se změnit pořadí', variant: 'destructive' });
      return false;
    }
  };

  const reorderVideos = async (moduleId: string, orderedIds: string[]): Promise<boolean> => {
    if (!isUsingDatabase) return false;
    
    try {
      const updates = orderedIds.map((id, index) => 
        (supabase as any)
          .from('academy_videos')
          .update({ sort_order: index + 1 })
          .eq('id', id)
      );

      await Promise.all(updates);
      await fetchDataDirect();
      return true;
    } catch (err) {
      console.error('Error reordering videos:', err);
      toast({ title: 'Chyba', description: 'Nepodařilo se změnit pořadí', variant: 'destructive' });
      return false;
    }
  };

  return (
    <AcademyDataContext.Provider value={{
      modules,
      isLoading,
      error,
      isUsingDatabase,
      refetch: fetchDataDirect,
      createModule,
      updateModule,
      deleteModule,
      createVideo,
      updateVideo,
      deleteVideo,
      reorderModules,
      reorderVideos,
    }}>
      {children}
    </AcademyDataContext.Provider>
  );
}

export function useAcademyData() {
  const context = useContext(AcademyDataContext);
  if (context === undefined) {
    throw new Error('useAcademyData must be used within an AcademyDataProvider');
  }
  return context;
}
