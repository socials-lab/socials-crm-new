import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

interface SOPDataContextType {
  categories: SOPCategory[];
  articles: SOPArticle[];
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
  // Onboarding klienta
  { id: 'art-1', category_id: 'cat-1', title: 'Jak nastavit nového klienta v CRM', content: '<h1>Nastavení nového klienta</h1><p>Po podpisu smlouvy je potřeba klienta správně zavést do systému.</p><h2>Kroky</h2><ol><li>Přejděte do sekce <strong>Klienti</strong></li><li>Vyplňte IČO — systém doplní údaje z ARES</li><li>Přidejte kontaktní osobu</li><li>Vytvořte zakázku a přiřaďte služby</li></ol>', search_text: 'Nastavení nového klienta Po podpisu smlouvy je potřeba klienta správně zavést do systému.', tags: ['onboarding', 'klient', 'CRM'], sort_order: 0, is_published: true, created_by: null, updated_by: null, created_at: '', updated_at: '' },
  { id: 'art-2', category_id: 'cat-1', title: 'První brief s klientem', content: '<h1>První brief</h1><p>Postup pro vedení prvního briefu s novým klientem.</p>', search_text: 'První brief s klientem Postup pro vedení prvního briefu s novým klientem.', tags: ['onboarding', 'brief', 'meeting'], sort_order: 1, is_published: true, created_by: null, updated_by: null, created_at: '', updated_at: '' },
  // Performance marketing
  { id: 'art-3', category_id: 'cat-2', title: 'Spuštění Google Ads kampaně', content: '<h1>Spuštění Google Ads</h1><p>Jak připravit a spustit novou kampaň.</p>', search_text: 'Spuštění Google Ads kampaně Jak připravit a spustit novou kampaň pro klienta.', tags: ['google-ads', 'PPC', 'kampaně'], sort_order: 0, is_published: true, created_by: null, updated_by: null, created_at: '', updated_at: '' },
  { id: 'art-4', category_id: 'cat-2', title: 'Meta Ads setup a best practices', content: '<h1>Meta Ads Setup</h1><p>Nastavení Facebook a Instagram reklam.</p>', search_text: 'Meta Ads setup a best practices Nastavení Facebook a Instagram reklam.', tags: ['meta-ads', 'PPC', 'facebook'], sort_order: 1, is_published: true, created_by: null, updated_by: null, created_at: '', updated_at: '' },
  // Interní procesy
  { id: 'art-5', category_id: 'cat-3', title: 'Jak správně vyplnit vícepráce', content: '<h1>Vyplnění víceprací</h1><p>Vícepráce musí být schválena klientem před zahájením.</p>', search_text: 'Vyplnění víceprací Vícepráce musí být schválena klientem před zahájením.', tags: ['vícepráce', 'fakturace', 'proces'], sort_order: 0, is_published: true, created_by: null, updated_by: null, created_at: '', updated_at: '' },
  { id: 'art-6', category_id: 'cat-3', title: 'Žádost o dovolenou', content: '<h1>Dovolená</h1><p>Jak si správně zažádat o dovolenou.</p>', search_text: 'Žádost o dovolenou Jak si správně zažádat o dovolenou v systému.', tags: ['HR', 'dovolená', 'proces'], sort_order: 1, is_published: true, created_by: null, updated_by: null, created_at: '', updated_at: '' },
  // Social media management
  { id: 'art-7', category_id: 'cat-4', title: 'Tvorba content plánu', content: '<h1>Content plán</h1><p>Postup pro tvorbu měsíčního content plánu.</p>', search_text: 'Tvorba content plánu Postup pro tvorbu měsíčního content plánu.', tags: ['content', 'social-media', 'plánování'], sort_order: 0, is_published: true, created_by: null, updated_by: null, created_at: '', updated_at: '' },
  { id: 'art-8', category_id: 'cat-4', title: 'Schvalovací proces příspěvků', content: '<h1>Schvalování</h1><p>Jak probíhá schvalování příspěvků klientem.</p>', search_text: 'Schvalovací proces příspěvků Jak probíhá schvalování příspěvků klientem.', tags: ['content', 'schvalování', 'klient'], sort_order: 1, is_published: true, created_by: null, updated_by: null, created_at: '', updated_at: '' },
  // Fakturace a finance
  { id: 'art-9', category_id: 'cat-5', title: 'Vystavení faktury v systému', content: '<h1>Fakturace</h1><p>Jak vystavit fakturu klientovi.</p>', search_text: 'Vystavení faktury v systému Jak vystavit fakturu klientovi.', tags: ['fakturace', 'finance', 'proces'], sort_order: 0, is_published: true, created_by: null, updated_by: null, created_at: '', updated_at: '' },
  // Prodej a leady
  { id: 'art-10', category_id: 'cat-6', title: 'Kvalifikace nového leadu', content: '<h1>Kvalifikace leadu</h1><p>Jak správně kvalifikovat nový lead.</p>', search_text: 'Kvalifikace nového leadu Jak správně kvalifikovat nový lead v CRM.', tags: ['lead', 'prodej', 'kvalifikace'], sort_order: 0, is_published: true, created_by: null, updated_by: null, created_at: '', updated_at: '' },
  { id: 'art-11', category_id: 'cat-6', title: 'Příprava nabídky pro klienta', content: '<h1>Nabídka</h1><p>Jak připravit profesionální nabídku.</p>', search_text: 'Příprava nabídky pro klienta Jak připravit profesionální nabídku.', tags: ['nabídka', 'prodej', 'klient'], sort_order: 1, is_published: true, created_by: null, updated_by: null, created_at: '', updated_at: '' },
  // Klientský servis
  { id: 'art-12', category_id: 'cat-7', title: 'Řešení reklamace klienta', content: '<h1>Reklamace</h1><p>Postup při řešení reklamace.</p>', search_text: 'Řešení reklamace klienta Postup při řešení reklamace od klienta.', tags: ['reklamace', 'servis', 'escalace'], sort_order: 0, is_published: true, created_by: null, updated_by: null, created_at: '', updated_at: '' },
  // Nástroje a technologie
  { id: 'art-13', category_id: 'cat-8', title: 'Nastavení Google Analytics 4', content: '<h1>GA4</h1><p>Jak nastavit Google Analytics 4 pro klienta.</p>', search_text: 'Nastavení Google Analytics 4 Jak nastavit GA4 pro klienta.', tags: ['analytics', 'GA4', 'nástroje'], sort_order: 0, is_published: true, created_by: null, updated_by: null, created_at: '', updated_at: '' },
  { id: 'art-14', category_id: 'cat-8', title: 'Google Tag Manager – základní setup', content: '<h1>GTM Setup</h1><p>Základní nastavení GTM pro tracking.</p>', search_text: 'Google Tag Manager základní setup Nastavení GTM pro tracking.', tags: ['GTM', 'tracking', 'nástroje'], sort_order: 1, is_published: true, created_by: null, updated_by: null, created_at: '', updated_at: '' },
  // HR a tým
  { id: 'art-15', category_id: 'cat-9', title: 'Onboarding nového kolegy', content: '<h1>Onboarding kolegy</h1><p>Checklist pro první dny nového kolegy.</p>', search_text: 'Onboarding nového kolegy Checklist pro první dny nového kolegy.', tags: ['HR', 'onboarding', 'tým'], sort_order: 0, is_published: true, created_by: null, updated_by: null, created_at: '', updated_at: '' },
  // Brand a design
  { id: 'art-16', category_id: 'cat-10', title: 'Práce s brand manuálem klienta', content: '<h1>Brand manuál</h1><p>Jak pracovat s brand manuálem.</p>', search_text: 'Práce s brand manuálem klienta Jak pracovat s brand manuálem.', tags: ['brand', 'design', 'guidelines'], sort_order: 0, is_published: true, created_by: null, updated_by: null, created_at: '', updated_at: '' },
  // Reporty a analytika
  { id: 'art-17', category_id: 'cat-11', title: 'Příprava měsíčního reportu', content: '<h1>Měsíční report</h1><p>Jak připravit měsíční report pro klienta.</p>', search_text: 'Příprava měsíčního reportu Jak připravit měsíční report pro klienta.', tags: ['report', 'analytika', 'KPI'], sort_order: 0, is_published: true, created_by: null, updated_by: null, created_at: '', updated_at: '' },
  // SEO a obsah
  { id: 'art-18', category_id: 'cat-12', title: 'Keyword research postup', content: '<h1>Keyword Research</h1><p>Jak provést keyword research pro klienta.</p>', search_text: 'Keyword research postup Jak provést keyword research pro klienta.', tags: ['SEO', 'keyword', 'obsah'], sort_order: 0, is_published: true, created_by: null, updated_by: null, created_at: '', updated_at: '' },
  { id: 'art-19', category_id: 'cat-12', title: 'Obsahový audit webu', content: '<h1>Obsahový audit</h1><p>Postup pro provedení obsahového auditu.</p>', search_text: 'Obsahový audit webu Postup pro provedení obsahového auditu.', tags: ['SEO', 'audit', 'obsah'], sort_order: 1, is_published: true, created_by: null, updated_by: null, created_at: '', updated_at: '' },
];

export function SOPDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<SOPCategory[]>([]);
  const [articles, setArticles] = useState<SOPArticle[]>([]);
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

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [catRes, artRes] = await Promise.all([
        supabase.from('sop_categories' as any).select('*').eq('is_active', true).order('sort_order'),
        supabase.from('sop_articles' as any).select('*').order('sort_order'),
      ]);
      setCategories((catRes.data && catRes.data.length > 0) ? catRes.data as any : demoCategories);
      setArticles((artRes.data && artRes.data.length > 0) ? artRes.data as any : demoArticles);
    } catch (e) {
      console.error('Error fetching SOP data, using demo:', e);
      setCategories(demoCategories);
      setArticles(demoArticles);
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
      // Demo mode fallback — generate local ID
      const newId = `cat-${Date.now()}`;
      const newCat: SOPCategory = {
        id: newId,
        title: cat.title || '',
        description: cat.description || '',
        icon: cat.icon || 'BookOpen',
        sort_order: categories.length,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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
      ...article,
      search_text: searchText,
      created_by: user?.id,
      updated_by: user?.id,
    } as any);
    if (error) { toast({ title: 'Chyba', description: error.message, variant: 'destructive' }); return; }
    await fetchData();
    toast({ title: 'Článek vytvořen' });
  };

  const updateArticle = async (id: string, article: Partial<SOPArticle>) => {
    const updates: any = { ...article, updated_by: user?.id };
    if (article.content !== undefined) {
      updates.search_text = stripHtml(article.content);
    }
    const { error } = await supabase.from('sop_articles' as any).update(updates).eq('id', id);
    if (error) { toast({ title: 'Chyba', description: error.message, variant: 'destructive' }); return; }
    await fetchData();
  };

  const deleteArticle = async (id: string) => {
    const { error } = await supabase.from('sop_articles' as any).delete().eq('id', id);
    if (error) { toast({ title: 'Chyba', description: error.message, variant: 'destructive' }); return; }
    await fetchData();
    toast({ title: 'Článek smazán' });
  };

  return (
    <SOPDataContext.Provider value={{
      categories, articles, isLoading, searchResults, searchQuery, setSearchQuery,
      selectedTags, setSelectedTags, toggleTag, allTags,
      addCategory, updateCategory, deleteCategory,
      addArticle, updateArticle, deleteArticle,
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
