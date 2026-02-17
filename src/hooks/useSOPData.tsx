import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { createNotification, notifyAdmins } from '@/services/notificationService';

export interface SOPCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SOPArticle {
  id: string;
  category_id: string;
  title: string;
  content: string;
  search_text: string;
  tags: string[];
  sort_order: number;
  is_published: boolean;
  owner_id: string | null;
  attachments: Array<{ name: string; path: string; size: number; type: string }>;
  view_count: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SOPSuggestion {
  id: string;
  article_id: string;
  suggested_by: string;
  suggested_by_name?: string;
  reason: string;
  status: 'pending' | 'accepted' | 'dismissed';
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

interface SOPDataContextType {
  categories: SOPCategory[];
  articles: SOPArticle[];
  suggestions: SOPSuggestion[];
  isLoading: boolean;
  searchResults: SOPArticle[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  toggleTag: (tag: string) => void;
  allTags: string[];
  addCategory: (cat: Partial<SOPCategory>) => Promise<string | undefined>;
  updateCategory: (id: string, cat: Partial<SOPCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addArticle: (article: Partial<SOPArticle>) => Promise<void>;
  updateArticle: (id: string, article: Partial<SOPArticle>) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
  suggestUpdate: (articleId: string, reason: string) => Promise<void>;
  resolveSuggestion: (id: string, status: 'accepted' | 'dismissed') => Promise<void>;
  incrementViewCount: (articleId: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const SOPDataContext = createContext<SOPDataContextType | undefined>(undefined);

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

const demoCategories: SOPCategory[] = [
  { id: 'cat-1', title: 'Onboarding klienta', description: 'Jak správně naonboardovat nového klienta', icon: 'Briefcase', sort_order: 0, is_active: true, created_at: '', updated_at: '' },
  { id: 'cat-2', title: 'Performance marketing', description: 'Postupy pro správu PPC kampaní', icon: 'BarChart3', sort_order: 1, is_active: true, created_at: '', updated_at: '' },
  { id: 'cat-3', title: 'Interní procesy', description: 'Jak fungujeme uvnitř Socials', icon: 'Settings', sort_order: 2, is_active: true, created_at: '', updated_at: '' },
  { id: 'cat-4', title: 'Social media management', description: 'Správa sociálních sítí klientů', icon: 'Palette', sort_order: 3, is_active: true, created_at: '', updated_at: '' },
  { id: 'cat-5', title: 'Fakturace a finance', description: 'Procesy kolem fakturace a plateb', icon: 'FileText', sort_order: 4, is_active: true, created_at: '', updated_at: '' },
  { id: 'cat-6', title: 'Prodej a leady', description: 'Jak pracovat s leady a obchodem', icon: 'Target', sort_order: 5, is_active: true, created_at: '', updated_at: '' },
  { id: 'cat-7', title: 'Klientský servis', description: 'Řešení reklamací a eskalací', icon: 'Users', sort_order: 6, is_active: true, created_at: '', updated_at: '' },
  { id: 'cat-8', title: 'Nástroje a technologie', description: 'Google Analytics, GTM, nástroje', icon: 'Zap', sort_order: 7, is_active: true, created_at: '', updated_at: '' },
  { id: 'cat-9', title: 'HR a tým', description: 'Onboarding kolegů, hodnocení, 1-on-1', icon: 'Users', sort_order: 8, is_active: true, created_at: '', updated_at: '' },
  { id: 'cat-10', title: 'Brand a design', description: 'Brand manuály, šablony, guidelines', icon: 'Palette', sort_order: 9, is_active: true, created_at: '', updated_at: '' },
  { id: 'cat-11', title: 'Reporty a analytika', description: 'Měsíční reporty, KPI dashboardy', icon: 'BarChart3', sort_order: 10, is_active: true, created_at: '', updated_at: '' },
  { id: 'cat-12', title: 'SEO a obsah', description: 'Keyword research, obsahový audit', icon: 'BookOpen', sort_order: 11, is_active: true, created_at: '', updated_at: '' },
];

const demoArticles: SOPArticle[] = [
  { id: 'art-1', category_id: 'cat-1', title: 'Jak nastavit nového klienta v CRM', content: '<h1>Nastavení nového klienta</h1><p>Po podpisu smlouvy je potřeba klienta správně zavést do systému. Následuj tyto kroky:</p><ol><li>Vyplň název firmy, IČO a kontaktní údaje</li><li>Přiřaď obchodníka</li><li>Nastav billing údaje</li><li>Přidej první engagement</li></ol><img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80" alt="CRM Dashboard" style="width: 600px; height: auto; display: block;"><p>Na obrázku výše vidíš ukázku CRM dashboardu pro správu klientů.</p><h2>Video návod</h2><p>Podívej se na video návod, jak nastavit nového klienta krok za krokem:</p><div data-loom-embed=""><iframe src="https://www.loom.com/embed/e64b1aa8ef4e4d47a73ef00253bc8521" frameborder="0" allowfullscreen="true" class="w-full h-full"></iframe></div><p>Detaily najdeš v přiloženém checklistu.</p>', search_text: 'Nastavení nového klienta v CRM, postup, onboarding, billing, engagement', tags: ['onboarding', 'klient', 'CRM'], sort_order: 0, is_published: true, owner_id: 'demo-profile-1', attachments: [{ name: 'Onboarding checklist.pdf', path: 'art-1/onboarding-checklist.pdf', size: 245000, type: 'application/pdf' }, { name: 'CRM template.xlsx', path: 'art-1/crm-template.xlsx', size: 89000, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }], view_count: 42, created_by: null, updated_by: null, created_at: '2025-09-01T10:00:00Z', updated_at: '2026-01-15T14:30:00Z' },
  { id: 'art-2', category_id: 'cat-1', title: 'První brief s klientem', content: '<h1>První brief</h1><p>Postup pro vedení prvního briefu s klientem. Připrav si seznam otázek a nezapomeň na zápis.</p>', search_text: 'První brief s klientem, meeting, zápis', tags: ['onboarding', 'brief', 'meeting'], sort_order: 1, is_published: true, owner_id: 'demo-profile-2', attachments: [{ name: 'Brief šablona.docx', path: 'art-2/brief-sablona.docx', size: 52000, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }], view_count: 38, created_by: null, updated_by: null, created_at: '2025-09-05T09:00:00Z', updated_at: '2026-01-10T11:00:00Z' },
  { id: 'art-3', category_id: 'cat-2', title: 'Spuštění Google Ads kampaně', content: '<h1>Spuštění Google Ads</h1><p>Jak připravit a spustit novou kampaň v Google Ads. Obsahuje checklist pro nastavení konverzí.</p>', search_text: 'Spuštění Google Ads kampaně, konverze, PPC', tags: ['google-ads', 'PPC', 'kampaně'], sort_order: 0, is_published: true, owner_id: 'demo-profile-3', attachments: [{ name: 'Google Ads checklist.pdf', path: 'art-3/gads-checklist.pdf', size: 180000, type: 'application/pdf' }], view_count: 35, created_by: null, updated_by: null, created_at: '2025-10-01T08:00:00Z', updated_at: '2026-02-01T09:00:00Z' },
  { id: 'art-4', category_id: 'cat-2', title: 'Meta Ads setup a best practices', content: '<h1>Meta Ads Setup</h1><p>Nastavení Facebook a Instagram reklam. Zahrnuje pixel setup a audience targeting.</p>', search_text: 'Meta Ads setup, Facebook, Instagram, pixel', tags: ['meta-ads', 'PPC', 'facebook'], sort_order: 1, is_published: true, owner_id: 'demo-profile-3', attachments: [], view_count: 29, created_by: null, updated_by: null, created_at: '2025-10-05T08:00:00Z', updated_at: '2026-01-20T10:00:00Z' },
  { id: 'art-5', category_id: 'cat-3', title: 'Jak správně vyplnit vícepráce', content: '<h1>Vyplnění víceprací</h1><p>Vícepráce musí být schválena klientem před zahájením. Vyplň formulář a pošli ke schválení.</p>', search_text: 'Vyplnění víceprací, schválení, formulář', tags: ['vícepráce', 'fakturace', 'proces'], sort_order: 0, is_published: true, owner_id: 'demo-profile-1', attachments: [{ name: 'Šablona vícepráce.pdf', path: 'art-5/sablona-viceprace.pdf', size: 95000, type: 'application/pdf' }], view_count: 27, created_by: null, updated_by: null, created_at: '2025-11-01T08:00:00Z', updated_at: '2026-01-05T16:00:00Z' },
  { id: 'art-6', category_id: 'cat-3', title: 'Žádost o dovolenou', content: '<h1>Dovolená</h1><p>Jak si zažádat o dovolenou. Minimálně 2 týdny předem.</p>', search_text: 'Žádost o dovolenou, HR', tags: ['HR', 'dovolená', 'proces'], sort_order: 1, is_published: true, owner_id: 'demo-profile-4', attachments: [], view_count: 24, created_by: null, updated_by: null, created_at: '2025-11-10T08:00:00Z', updated_at: '2025-12-01T08:00:00Z' },
  { id: 'art-7', category_id: 'cat-4', title: 'Tvorba content plánu', content: '<h1>Content plán</h1><p>Postup pro tvorbu content plánu. Používej přiloženou šablonu pro plánování.</p>', search_text: 'Tvorba content plánu, social media', tags: ['content', 'social-media', 'plánování'], sort_order: 0, is_published: true, owner_id: 'demo-profile-5', attachments: [{ name: 'Content plán šablona.xlsx', path: 'art-7/content-plan-template.xlsx', size: 67000, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }], view_count: 21, created_by: null, updated_by: null, created_at: '2025-09-15T08:00:00Z', updated_at: '2026-01-28T12:00:00Z' },
  { id: 'art-8', category_id: 'cat-4', title: 'Schvalovací proces příspěvků', content: '<h1>Schvalování</h1><p>Jak probíhá schvalování příspěvků klientem.</p>', search_text: 'Schvalovací proces příspěvků, klient', tags: ['content', 'schvalování', 'klient'], sort_order: 1, is_published: true, owner_id: 'demo-profile-5', attachments: [], view_count: 18, created_by: null, updated_by: null, created_at: '2025-09-20T08:00:00Z', updated_at: '2025-12-15T08:00:00Z' },
  { id: 'art-9', category_id: 'cat-5', title: 'Vystavení faktury v systému', content: '<h1>Fakturace</h1><p>Jak vystavit fakturu. Používáme Fakturoid – viz přiložený návod.</p>', search_text: 'Vystavení faktury v systému, Fakturoid', tags: ['fakturace', 'finance', 'proces'], sort_order: 0, is_published: true, owner_id: 'demo-profile-1', attachments: [{ name: 'Fakturoid návod.pdf', path: 'art-9/fakturoid-navod.pdf', size: 320000, type: 'application/pdf' }], view_count: 15, created_by: null, updated_by: null, created_at: '2025-10-15T08:00:00Z', updated_at: '2026-02-10T08:00:00Z' },
  { id: 'art-10', category_id: 'cat-6', title: 'Kvalifikace nového leadu', content: '<h1>Kvalifikace leadu</h1><p>Jak kvalifikovat nový lead. Hodnotíme budget, timeline a decision-making process.</p>', search_text: 'Kvalifikace nového leadu, budget, sales', tags: ['lead', 'prodej', 'kvalifikace'], sort_order: 0, is_published: true, owner_id: 'demo-profile-2', attachments: [{ name: 'Lead scoring matice.pdf', path: 'art-10/lead-scoring.pdf', size: 110000, type: 'application/pdf' }], view_count: 33, created_by: null, updated_by: null, created_at: '2025-08-01T08:00:00Z', updated_at: '2026-01-30T08:00:00Z' },
  { id: 'art-11', category_id: 'cat-6', title: 'Příprava nabídky pro klienta', content: '<h1>Nabídka</h1><p>Jak připravit nabídku. Vyber správný tier a služby dle potřeb klienta.</p>', search_text: 'Příprava nabídky, tier, služby', tags: ['nabídka', 'prodej', 'klient'], sort_order: 1, is_published: true, owner_id: 'demo-profile-2', attachments: [{ name: 'Nabídka šablona.pptx', path: 'art-11/nabidka-sablona.pptx', size: 2400000, type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }], view_count: 31, created_by: null, updated_by: null, created_at: '2025-08-10T08:00:00Z', updated_at: '2026-02-05T08:00:00Z' },
  { id: 'art-12', category_id: 'cat-7', title: 'Řešení reklamace klienta', content: '<h1>Reklamace</h1><p>Postup při reklamaci. Eskaluj na project managera.</p>', search_text: 'Řešení reklamace, eskalace', tags: ['reklamace', 'servis', 'escalace'], sort_order: 0, is_published: true, owner_id: 'demo-profile-4', attachments: [], view_count: 12, created_by: null, updated_by: null, created_at: '2025-12-01T08:00:00Z', updated_at: '2026-01-05T08:00:00Z' },
  { id: 'art-13', category_id: 'cat-8', title: 'Nastavení Google Analytics 4', content: '<h1>GA4</h1><p>Jak nastavit GA4 pro nového klienta. Viz přiložený checklist.</p>', search_text: 'Nastavení Google Analytics 4, GA4, tracking', tags: ['analytics', 'GA4', 'nástroje'], sort_order: 0, is_published: true, owner_id: 'demo-profile-3', attachments: [{ name: 'GA4 setup checklist.pdf', path: 'art-13/ga4-checklist.pdf', size: 150000, type: 'application/pdf' }], view_count: 20, created_by: null, updated_by: null, created_at: '2025-09-10T08:00:00Z', updated_at: '2026-01-25T08:00:00Z' },
  { id: 'art-14', category_id: 'cat-8', title: 'Google Tag Manager – základní setup', content: '<h1>GTM Setup</h1><p>Základní nastavení GTM. Container, tagy, triggery.</p>', search_text: 'Google Tag Manager, GTM, container, tagy', tags: ['GTM', 'tracking', 'nástroje'], sort_order: 1, is_published: true, owner_id: 'demo-profile-3', attachments: [], view_count: 17, created_by: null, updated_by: null, created_at: '2025-09-12T08:00:00Z', updated_at: '2025-12-20T08:00:00Z' },
  { id: 'art-15', category_id: 'cat-9', title: 'Onboarding nového kolegy', content: '<h1>Onboarding kolegy</h1><p>Checklist pro nového kolegu. Přiděl mentora a projdi přiložený dokument.</p>', search_text: 'Onboarding nového kolegy, checklist, mentor', tags: ['HR', 'onboarding', 'tým'], sort_order: 0, is_published: true, owner_id: 'demo-profile-4', attachments: [{ name: 'Onboarding checklist kolega.pdf', path: 'art-15/onboarding-kolega.pdf', size: 200000, type: 'application/pdf' }, { name: 'IT setup guide.pdf', path: 'art-15/it-setup.pdf', size: 150000, type: 'application/pdf' }], view_count: 26, created_by: null, updated_by: null, created_at: '2025-08-20T08:00:00Z', updated_at: '2026-02-01T08:00:00Z' },
  { id: 'art-16', category_id: 'cat-10', title: 'Práce s brand manuálem klienta', content: '<h1>Brand manuál</h1><p>Jak pracovat s brand manuálem klienta. Vždy si stáhni aktuální verzi.</p>', search_text: 'Brand manuál, design, guidelines', tags: ['brand', 'design', 'guidelines'], sort_order: 0, is_published: true, owner_id: 'demo-profile-5', attachments: [], view_count: 9, created_by: null, updated_by: null, created_at: '2025-11-15T08:00:00Z', updated_at: '2025-12-10T08:00:00Z' },
  { id: 'art-17', category_id: 'cat-11', title: 'Příprava měsíčního reportu', content: '<h1>Report</h1><p>Jak připravit měsíční report pro klienta. Použij přiloženou šablonu.</p>', search_text: 'Měsíční report, KPI, šablona', tags: ['report', 'analytika', 'KPI'], sort_order: 0, is_published: true, owner_id: 'demo-profile-3', attachments: [{ name: 'Report šablona.pptx', path: 'art-17/report-sablona.pptx', size: 1800000, type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }], view_count: 22, created_by: null, updated_by: null, created_at: '2025-10-20T08:00:00Z', updated_at: '2026-02-10T08:00:00Z' },
  { id: 'art-18', category_id: 'cat-12', title: 'Keyword research postup', content: '<h1>Keyword Research</h1><p>Jak provést keyword research. Používáme Ahrefs a Google Keyword Planner.</p>', search_text: 'Keyword research, Ahrefs, SEO', tags: ['SEO', 'keyword', 'obsah'], sort_order: 0, is_published: true, owner_id: 'demo-profile-3', attachments: [], view_count: 14, created_by: null, updated_by: null, created_at: '2025-11-01T08:00:00Z', updated_at: '2026-01-15T08:00:00Z' },
  { id: 'art-19', category_id: 'cat-12', title: 'Obsahový audit webu', content: '<h1>Obsahový audit</h1><p>Postup pro obsahový audit webu. Viz přiložená šablona.</p>', search_text: 'Obsahový audit, SEO, web', tags: ['SEO', 'audit', 'obsah'], sort_order: 1, is_published: true, owner_id: 'demo-profile-3', attachments: [{ name: 'Audit šablona.xlsx', path: 'art-19/audit-sablona.xlsx', size: 45000, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }], view_count: 11, created_by: null, updated_by: null, created_at: '2025-11-05T08:00:00Z', updated_at: '2026-01-20T08:00:00Z' },
  { id: 'art-20', category_id: 'cat-2', title: 'LinkedIn Ads – rozpracovaný postup', content: '<h1>LinkedIn Ads</h1><p>Rozpracovaný postup pro LinkedIn Ads kampaně...</p>', search_text: 'LinkedIn Ads, B2B, kampaně', tags: [], sort_order: 2, is_published: false, owner_id: 'demo-profile-3', attachments: [], view_count: 0, created_by: null, updated_by: null, created_at: '2026-02-15T08:00:00Z', updated_at: '2026-02-15T08:00:00Z' },
  { id: 'art-21', category_id: 'cat-3', title: 'Nový proces schvalování rozpočtů', content: '<h1>Schvalování rozpočtů</h1><p>Draft nového procesu...</p>', search_text: 'Schvalování rozpočtů, proces, finance', tags: [], sort_order: 2, is_published: false, owner_id: 'demo-profile-1', attachments: [], view_count: 0, created_by: null, updated_by: null, created_at: '2026-02-10T08:00:00Z', updated_at: '2026-02-14T10:00:00Z' },
];

const demoSuggestions: SOPSuggestion[] = [
  { id: 'sug-1', article_id: 'art-3', suggested_by: 'demo-profile-5', suggested_by_name: 'Tereza Malá', reason: 'Google Ads rozhraní se změnilo, screenshots jsou zastaralé a postup pro konverze je jiný.', status: 'pending', created_at: '2026-02-10T14:00:00Z' },
  { id: 'sug-2', article_id: 'art-1', suggested_by: 'demo-profile-3', suggested_by_name: 'Pavel Dvořák', reason: 'Chybí krok pro nastavení billing údajů v novém CRM modulu.', status: 'pending', created_at: '2026-02-12T09:30:00Z' },
  { id: 'sug-3', article_id: 'art-5', suggested_by: 'demo-profile-2', suggested_by_name: 'Marie Kovářová', reason: 'Formulář pro vícepráce se změnil, aktualizujte prosím odkaz.', status: 'accepted', resolved_by: 'demo-profile-1', resolved_at: '2026-02-14T11:00:00Z', created_at: '2026-02-08T16:00:00Z' },
  { id: 'sug-4', article_id: 'art-15', suggested_by: 'demo-profile-1', suggested_by_name: 'Jan Novák', reason: 'Onboarding checklist neobsahuje přístup do nového project management nástroje.', status: 'pending', created_at: '2026-02-15T10:00:00Z' },
];

// Map demo profile IDs to colleague names for owner display
export const demoProfileNames: Record<string, string> = {
  'demo-profile-1': 'Jan Novák',
  'demo-profile-2': 'Marie Kovářová',
  'demo-profile-3': 'Pavel Dvořák',
  'demo-profile-4': 'Lucie Svobodová',
  'demo-profile-5': 'Tereza Malá',
};

export function SOPDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<SOPCategory[]>([]);
  const [articles, setArticles] = useState<SOPArticle[]>([]);
  const [suggestions, setSuggestions] = useState<SOPSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SOPArticle[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    articles.forEach(a => a.tags.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [articles]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }, []);

  // Apply locally persisted article edits on top of demo data
  const applyLocalEdits = (baseArticles: SOPArticle[]): SOPArticle[] => {
    try {
      const stored = localStorage.getItem('sop-local-article-edits');
      if (!stored) return baseArticles;
      const edits: Record<string, Partial<SOPArticle>> = JSON.parse(stored);
      return baseArticles.map(a => edits[a.id] ? { ...a, ...edits[a.id] } : a);
    } catch { return baseArticles; }
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [catRes, artRes, sugRes] = await Promise.all([
        supabase.from('sop_categories' as any).select('*').eq('is_active', true).order('sort_order'),
        supabase.from('sop_articles' as any).select('*').order('sort_order'),
        supabase.from('sop_update_suggestions' as any).select('*, profiles:suggested_by(first_name, last_name)').order('created_at', { ascending: false }),
      ]);
      setCategories((catRes.data && catRes.data.length > 0) ? catRes.data as any : demoCategories);
      const useDemo = !(artRes.data && artRes.data.length > 0);
      setArticles(useDemo ? applyLocalEdits(demoArticles) : artRes.data as any);
      
      if (sugRes.data && sugRes.data.length > 0) {
        setSuggestions((sugRes.data as any[]).map((s: any) => ({
          ...s,
          suggested_by_name: s.profiles ? `${s.profiles.first_name || ''} ${s.profiles.last_name || ''}`.trim() : undefined,
        })));
      } else {
        setSuggestions(demoSuggestions);
      }
    } catch (e) {
      console.error('Error fetching SOP data, using demo:', e);
      setCategories(demoCategories);
      setArticles(applyLocalEdits(demoArticles));
      setSuggestions(demoSuggestions);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { if (user) fetchData(); }, [user, fetchData]);

  // Search + tag filtering
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    const hasQuery = q.length > 0;
    const hasTags = selectedTags.length > 0;

    if (!hasQuery && !hasTags) {
      setSearchResults([]);
      return;
    }

    const results = articles.filter(a => {
      if (!a.is_published) return false;
      const matchesTag = !hasTags || selectedTags.some(t => a.tags.some(at => at.toLowerCase() === t.toLowerCase()));
      const matchesQuery = !hasQuery || a.title.toLowerCase().includes(q) || (a.search_text || '').toLowerCase().includes(q) || a.tags.some(t => t.toLowerCase().includes(q));
      return matchesTag && matchesQuery;
    });
    setSearchResults(results);
  }, [searchQuery, selectedTags, articles]);

  const addCategory = async (cat: Partial<SOPCategory>): Promise<string | undefined> => {
    const { data, error } = await supabase.from('sop_categories' as any).insert(cat as any).select('id').single();
    if (error) {
      const newId = `cat-${Date.now()}`;
      const newCat: SOPCategory = {
        id: newId, title: cat.title || '', description: cat.description || '', icon: cat.icon || 'BookOpen',
        sort_order: categories.length, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      };
      setCategories(prev => [...prev, newCat]);
      toast({ title: 'Kategorie vytvořena' });
      return newId;
    }
    await fetchData();
    toast({ title: 'Kategorie vytvořena' });
    return (data as any)?.id;
  };

  const updateCategory = async (id: string, cat: Partial<SOPCategory>) => {
    const { error } = await supabase.from('sop_categories' as any).update(cat as any).eq('id', id);
    if (error) { toast({ title: 'Chyba', description: error.message, variant: 'destructive' }); return; }
    await fetchData();
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('sop_categories' as any).delete().eq('id', id);
    if (error) { toast({ title: 'Chyba', description: error.message, variant: 'destructive' }); return; }
    await fetchData();
    toast({ title: 'Kategorie smazána' });
  };

  const addArticle = async (article: Partial<SOPArticle>) => {
    const searchText = stripHtml(article.content || '');
    const { error } = await supabase.from('sop_articles' as any).insert({
      ...article, search_text: searchText, created_by: user?.id, updated_by: user?.id,
    } as any);
    if (error) { toast({ title: 'Chyba', description: error.message, variant: 'destructive' }); return; }
    await fetchData();
    toast({ title: 'Článek vytvořen' });
  };

  const updateArticle = async (id: string, article: Partial<SOPArticle>) => {
    const updates: any = { ...article, updated_by: user?.id };
    if (article.content !== undefined) updates.search_text = stripHtml(article.content);
    const { error } = await supabase.from('sop_articles' as any).update(updates).eq('id', id);
    if (error) {
      // Fallback: update in local state for demo articles and persist
      const updatedFields = { ...article, updated_at: new Date().toISOString() };
      setArticles(prev => prev.map(a => a.id === id ? { ...a, ...updatedFields } : a));
      try {
        const stored = localStorage.getItem('sop-local-article-edits');
        const edits: Record<string, Partial<SOPArticle>> = stored ? JSON.parse(stored) : {};
        edits[id] = { ...(edits[id] || {}), ...updatedFields };
        localStorage.setItem('sop-local-article-edits', JSON.stringify(edits));
      } catch {}
      toast({ title: 'Změny uloženy' });
      return;
    }
    await fetchData();
  };

  const deleteArticle = async (id: string) => {
    const { error } = await supabase.from('sop_articles' as any).delete().eq('id', id);
    if (error) { toast({ title: 'Chyba', description: error.message, variant: 'destructive' }); return; }
    await fetchData();
    toast({ title: 'Článek smazán' });
  };

  const suggestUpdate = async (articleId: string, reason: string) => {
    if (!user) return;
    const { error } = await supabase.from('sop_update_suggestions' as any).insert({
      article_id: articleId,
      suggested_by: user.id,
      reason,
    } as any);

    if (error) {
      // Demo fallback
      const newSuggestion: SOPSuggestion = {
        id: `sug-${Date.now()}`, article_id: articleId, suggested_by: user.id,
        suggested_by_name: user.email || 'Aktuální uživatel', reason, status: 'pending',
        created_at: new Date().toISOString(),
      };
      setSuggestions(prev => [newSuggestion, ...prev]);
    } else {
      await fetchData();
    }

    // Send notifications to owner + admins
    const article = articles.find(a => a.id === articleId);
    if (article) {
      if (article.owner_id) {
        createNotification({
          recipientUserId: article.owner_id,
          type: 'sop_update_suggested',
          title: 'Návrh na úpravu SOP',
          message: `Někdo navrhl úpravu článku "${article.title}": ${reason.substring(0, 100)}`,
          entityType: 'sop',
          entityId: articleId,
          link: `/sop/${articleId}`,
        });
      }
      notifyAdmins({
        type: 'sop_update_suggested',
        title: 'Návrh na úpravu SOP',
        message: `Návrh na úpravu článku "${article.title}": ${reason.substring(0, 100)}`,
        entityType: 'sop',
        entityId: articleId,
        link: `/sop/${articleId}`,
      });
    }

    toast({ title: 'Návrh odeslán', description: 'Správce bude informován.' });
  };

  const resolveSuggestion = async (id: string, status: 'accepted' | 'dismissed') => {
    const { error } = await supabase.from('sop_update_suggestions' as any).update({
      status, resolved_by: user?.id, resolved_at: new Date().toISOString(),
    } as any).eq('id', id);

    if (error) {
      // Demo fallback
      setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status, resolved_by: user?.id, resolved_at: new Date().toISOString() } : s));
    } else {
      await fetchData();
    }
    toast({ title: status === 'accepted' ? 'Návrh přijat' : 'Návrh zamítnut' });
  };

  const incrementViewCount = async (articleId: string) => {
    // Increment in DB (best-effort, no error toast)
    await supabase.rpc('increment_sop_view_count' as any, { article_id: articleId }).then(() => {});
    // Also update local state for immediate feedback
    setArticles(prev => prev.map(a => a.id === articleId ? { ...a, view_count: (a.view_count || 0) + 1 } : a));
  };

  return (
    <SOPDataContext.Provider value={{
      categories, articles, suggestions, isLoading, searchResults, searchQuery, setSearchQuery,
      selectedTags, setSelectedTags, toggleTag, allTags,
      addCategory, updateCategory, deleteCategory,
      addArticle, updateArticle, deleteArticle,
      suggestUpdate, resolveSuggestion, incrementViewCount,
      refreshData: fetchData,
    }}>
      {children}
    </SOPDataContext.Provider>
  );
}

export function useSOPData() {
  const context = useContext(SOPDataContext);
  if (!context) throw new Error('useSOPData must be used within SOPDataProvider');
  return context;
}
