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
  { id: 'art-1', category_id: 'cat-1', title: 'Jak nastavit nového klienta v CRM', content: '<h1>Nastavení nového klienta</h1><p>Po podpisu smlouvy je potřeba klienta správně zavést do systému.</p>', search_text: 'Nastavení nového klienta', tags: ['onboarding', 'klient', 'CRM'], sort_order: 0, is_published: true, owner_id: null, created_by: null, updated_by: null, created_at: '', updated_at: '' },
  { id: 'art-2', category_id: 'cat-1', title: 'První brief s klientem', content: '<h1>První brief</h1><p>Postup pro vedení prvního briefu.</p>', search_text: 'První brief s klientem', tags: ['onboarding', 'brief', 'meeting'], sort_order: 1, is_published: true, owner_id: null, created_by: null, updated_by: null, created_at: '', updated_at: '' },
  { id: 'art-3', category_id: 'cat-2', title: 'Spuštění Google Ads kampaně', content: '<h1>Spuštění Google Ads</h1><p>Jak připravit a spustit novou kampaň.</p>', search_text: 'Spuštění Google Ads kampaně', tags: ['google-ads', 'PPC', 'kampaně'], sort_order: 0, is_published: true, owner_id: null, created_by: null, updated_by: null, created_at: '', updated_at: '' },
  { id: 'art-4', category_id: 'cat-2', title: 'Meta Ads setup a best practices', content: '<h1>Meta Ads Setup</h1><p>Nastavení Facebook a Instagram reklam.</p>', search_text: 'Meta Ads setup', tags: ['meta-ads', 'PPC', 'facebook'], sort_order: 1, is_published: true, owner_id: null, created_by: null, updated_by: null, created_at: '', updated_at: '' },
  { id: 'art-5', category_id: 'cat-3', title: 'Jak správně vyplnit vícepráce', content: '<h1>Vyplnění víceprací</h1><p>Vícepráce musí být schválena.</p>', search_text: 'Vyplnění víceprací', tags: ['vícepráce', 'fakturace', 'proces'], sort_order: 0, is_published: true, owner_id: null, created_by: null, updated_by: null, created_at: '', updated_at: '' },
  { id: 'art-6', category_id: 'cat-3', title: 'Žádost o dovolenou', content: '<h1>Dovolená</h1><p>Jak si zažádat o dovolenou.</p>', search_text: 'Žádost o dovolenou', tags: ['HR', 'dovolená', 'proces'], sort_order: 1, is_published: true, owner_id: null, created_by: null, updated_by: null, created_at: '', updated_at: '' },
  { id: 'art-7', category_id: 'cat-4', title: 'Tvorba content plánu', content: '<h1>Content plán</h1><p>Postup pro tvorbu content plánu.</p>', search_text: 'Tvorba content plánu', tags: ['content', 'social-media', 'plánování'], sort_order: 0, is_published: true, owner_id: null, created_by: null, updated_by: null, created_at: '', updated_at: '' },
  { id: 'art-8', category_id: 'cat-4', title: 'Schvalovací proces příspěvků', content: '<h1>Schvalování</h1><p>Jak probíhá schvalování.</p>', search_text: 'Schvalovací proces příspěvků', tags: ['content', 'schvalování', 'klient'], sort_order: 1, is_published: true, owner_id: null, created_by: null, updated_by: null, created_at: '', updated_at: '' },
  { id: 'art-9', category_id: 'cat-5', title: 'Vystavení faktury v systému', content: '<h1>Fakturace</h1><p>Jak vystavit fakturu.</p>', search_text: 'Vystavení faktury v systému', tags: ['fakturace', 'finance', 'proces'], sort_order: 0, is_published: true, owner_id: null, created_by: null, updated_by: null, created_at: '', updated_at: '' },
  { id: 'art-10', category_id: 'cat-6', title: 'Kvalifikace nového leadu', content: '<h1>Kvalifikace leadu</h1><p>Jak kvalifikovat lead.</p>', search_text: 'Kvalifikace nového leadu', tags: ['lead', 'prodej', 'kvalifikace'], sort_order: 0, is_published: true, owner_id: null, created_by: null, updated_by: null, created_at: '', updated_at: '' },
  { id: 'art-11', category_id: 'cat-6', title: 'Příprava nabídky pro klienta', content: '<h1>Nabídka</h1><p>Jak připravit nabídku.</p>', search_text: 'Příprava nabídky', tags: ['nabídka', 'prodej', 'klient'], sort_order: 1, is_published: true, owner_id: null, created_by: null, updated_by: null, created_at: '', updated_at: '' },
  { id: 'art-12', category_id: 'cat-7', title: 'Řešení reklamace klienta', content: '<h1>Reklamace</h1><p>Postup při reklamaci.</p>', search_text: 'Řešení reklamace', tags: ['reklamace', 'servis', 'escalace'], sort_order: 0, is_published: true, owner_id: null, created_by: null, updated_by: null, created_at: '', updated_at: '' },
  { id: 'art-13', category_id: 'cat-8', title: 'Nastavení Google Analytics 4', content: '<h1>GA4</h1><p>Jak nastavit GA4.</p>', search_text: 'Nastavení Google Analytics 4', tags: ['analytics', 'GA4', 'nástroje'], sort_order: 0, is_published: true, owner_id: null, created_by: null, updated_by: null, created_at: '', updated_at: '' },
  { id: 'art-14', category_id: 'cat-8', title: 'Google Tag Manager – základní setup', content: '<h1>GTM Setup</h1><p>Základní nastavení GTM.</p>', search_text: 'Google Tag Manager', tags: ['GTM', 'tracking', 'nástroje'], sort_order: 1, is_published: true, owner_id: null, created_by: null, updated_by: null, created_at: '', updated_at: '' },
  { id: 'art-15', category_id: 'cat-9', title: 'Onboarding nového kolegy', content: '<h1>Onboarding kolegy</h1><p>Checklist pro nového kolegu.</p>', search_text: 'Onboarding nového kolegy', tags: ['HR', 'onboarding', 'tým'], sort_order: 0, is_published: true, owner_id: null, created_by: null, updated_by: null, created_at: '', updated_at: '' },
  { id: 'art-16', category_id: 'cat-10', title: 'Práce s brand manuálem klienta', content: '<h1>Brand manuál</h1><p>Jak pracovat s brand manuálem.</p>', search_text: 'Brand manuál', tags: ['brand', 'design', 'guidelines'], sort_order: 0, is_published: true, owner_id: null, created_by: null, updated_by: null, created_at: '', updated_at: '' },
  { id: 'art-17', category_id: 'cat-11', title: 'Příprava měsíčního reportu', content: '<h1>Report</h1><p>Jak připravit report.</p>', search_text: 'Měsíční report', tags: ['report', 'analytika', 'KPI'], sort_order: 0, is_published: true, owner_id: null, created_by: null, updated_by: null, created_at: '', updated_at: '' },
  { id: 'art-18', category_id: 'cat-12', title: 'Keyword research postup', content: '<h1>Keyword Research</h1><p>Jak provést keyword research.</p>', search_text: 'Keyword research', tags: ['SEO', 'keyword', 'obsah'], sort_order: 0, is_published: true, owner_id: null, created_by: null, updated_by: null, created_at: '', updated_at: '' },
  { id: 'art-19', category_id: 'cat-12', title: 'Obsahový audit webu', content: '<h1>Obsahový audit</h1><p>Postup pro audit.</p>', search_text: 'Obsahový audit', tags: ['SEO', 'audit', 'obsah'], sort_order: 1, is_published: true, owner_id: null, created_by: null, updated_by: null, created_at: '', updated_at: '' },
];

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

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [catRes, artRes, sugRes] = await Promise.all([
        supabase.from('sop_categories' as any).select('*').eq('is_active', true).order('sort_order'),
        supabase.from('sop_articles' as any).select('*').order('sort_order'),
        supabase.from('sop_update_suggestions' as any).select('*, profiles:suggested_by(first_name, last_name)').order('created_at', { ascending: false }),
      ]);
      setCategories((catRes.data && catRes.data.length > 0) ? catRes.data as any : demoCategories);
      setArticles((artRes.data && artRes.data.length > 0) ? artRes.data as any : demoArticles);
      
      if (sugRes.data && sugRes.data.length > 0) {
        setSuggestions((sugRes.data as any[]).map((s: any) => ({
          ...s,
          suggested_by_name: s.profiles ? `${s.profiles.first_name || ''} ${s.profiles.last_name || ''}`.trim() : undefined,
        })));
      } else {
        setSuggestions([]);
      }
    } catch (e) {
      console.error('Error fetching SOP data, using demo:', e);
      setCategories(demoCategories);
      setArticles(demoArticles);
      setSuggestions([]);
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
    if (error) { toast({ title: 'Chyba', description: error.message, variant: 'destructive' }); return; }
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

  return (
    <SOPDataContext.Provider value={{
      categories, articles, suggestions, isLoading, searchResults, searchQuery, setSearchQuery,
      selectedTags, setSelectedTags, toggleTag, allTags,
      addCategory, updateCategory, deleteCategory,
      addArticle, updateArticle, deleteArticle,
      suggestUpdate, resolveSuggestion,
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
