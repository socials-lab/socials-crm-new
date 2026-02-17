import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
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
  addCategory: (cat: Partial<SOPCategory>) => Promise<void>;
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

export function SOPDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<SOPCategory[]>([]);
  const [articles, setArticles] = useState<SOPArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SOPArticle[]>([]);

  const demoCategories: SOPCategory[] = [
    { id: 'cat-1', title: 'Onboarding klienta', description: 'Jak správně naonboardovat nového klienta', icon: 'Briefcase', sort_order: 0, is_active: true, created_at: '', updated_at: '' },
    { id: 'cat-2', title: 'Performance marketing', description: 'Postupy pro správu PPC kampaní', icon: 'BarChart3', sort_order: 1, is_active: true, created_at: '', updated_at: '' },
    { id: 'cat-3', title: 'Interní procesy', description: 'Jak fungujeme uvnitř Socials', icon: 'Settings', sort_order: 2, is_active: true, created_at: '', updated_at: '' },
  ];

  const demoArticles: SOPArticle[] = [
    {
      id: 'art-1', category_id: 'cat-1', title: 'Jak nastavit nového klienta v CRM',
      content: '<h1>Nastavení nového klienta</h1><p>Po podpisu smlouvy je potřeba klienta správně zavést do systému.</p><h2>Kroky</h2><ol><li>Přejděte do sekce <strong>Klienti</strong> a klikněte na „Nový klient"</li><li>Vyplňte IČO — systém automaticky doplní údaje z ARES</li><li>Přidejte kontaktní osobu a nastavte ji jako primární</li><li>Vytvořte zakázku a přiřaďte služby</li></ol><h2>Video návod</h2><p>Podívejte se na podrobný walkthrough:</p><div data-loom-embed=""><iframe src="https://www.loom.com/embed/example123" frameborder="0" allowfullscreen="true" class="w-full h-full"></iframe></div><p>Po dokončení informujte project managera na Slacku.</p>',
      search_text: 'Nastavení nového klienta Po podpisu smlouvy je potřeba klienta správně zavést do systému. Kroky Přejděte do sekce Klienti a klikněte na Nový klient Vyplňte IČO systém automaticky doplní údaje z ARES Přidejte kontaktní osobu a nastavte ji jako primární Vytvořte zakázku a přiřaďte služby',
      tags: ['onboarding', 'klient', 'CRM'], sort_order: 0, is_published: true, created_by: null, updated_by: null, created_at: '', updated_at: '',
    },
    {
      id: 'art-2', category_id: 'cat-2', title: 'Spuštění Google Ads kampaně',
      content: '<h1>Spuštění Google Ads kampaně</h1><p>Tento postup popisuje jak připravit a spustit novou kampaň pro klienta.</p><h2>Příprava</h2><ul><li>Zkontrolujte přístupy do Google Ads účtu klienta</li><li>Ověřte nastavení konverzí a Google Tag Manager</li><li>Projděte si brief od klienta a odsouhlasenou strategii</li></ul><h2>Nastavení kampaně</h2><ol><li>Vytvořte novou kampaň podle šablony v Google Sheets</li><li>Nastavte cílení, rozpočet a bidding strategii</li><li>Připravte reklamní sestavy a ad copy</li><li>Nechte zkontrolovat kolegou (4-eyes princip)</li></ol><h2>Po spuštění</h2><p>První 3 dny kontrolujte výkon denně. Po týdnu proveďte první optimalizaci.</p>',
      search_text: 'Spuštění Google Ads kampaně Tento postup popisuje jak připravit a spustit novou kampaň pro klienta. Příprava Zkontrolujte přístupy do Google Ads účtu klienta Ověřte nastavení konverzí a Google Tag Manager Projděte si brief od klienta a odsouhlasenou strategii Nastavení kampaně',
      tags: ['google-ads', 'PPC', 'kampaně'], sort_order: 0, is_published: true, created_by: null, updated_by: null, created_at: '', updated_at: '',
    },
    {
      id: 'art-3', category_id: 'cat-3', title: 'Jak správně vyplnit vícepráce',
      content: '<h1>Vyplnění víceprací</h1><p>Vícepráce je práce nad rámec běžného retaineru. Každá vícepráce musí být schválena klientem <strong>před</strong> zahájením.</p><h2>Postup</h2><ol><li>Přejděte do sekce <strong>Vícepráce</strong></li><li>Klikněte na „Nová vícepráce"</li><li>Vyberte klienta a zakázku</li><li>Popište rozsah práce a odhadněte čas</li><li>Odešlete ke schválení klientovi</li></ol><h2>Důležité</h2><ul><li>Vždy uveďte hodinovou sazbu a předpokládaný počet hodin</li><li>Po schválení změňte status na „V realizaci"</li><li>Po dokončení označte jako „Připraveno k fakturaci"</li></ul>',
      search_text: 'Vyplnění víceprací Vícepráce je práce nad rámec běžného retaineru. Každá vícepráce musí být schválena klientem před zahájením. Postup Přejděte do sekce Vícepráce Klikněte na Nová vícepráce Vyberte klienta a zakázku Popište rozsah práce a odhadněte čas',
      tags: ['vícepráce', 'fakturace', 'proces'], sort_order: 0, is_published: true, created_by: null, updated_by: null, created_at: '', updated_at: '',
    },
  ];

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [catRes, artRes] = await Promise.all([
        supabase.from('sop_categories' as any).select('*').eq('is_active', true).order('sort_order'),
        supabase.from('sop_articles' as any).select('*').order('sort_order'),
      ]);
      // Use DB data if available, otherwise fall back to demo
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

  // Client-side search with debounce effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const results = articles.filter(a =>
      a.is_published &&
      (a.title.toLowerCase().includes(q) || (a.search_text || '').toLowerCase().includes(q) || a.tags.some(t => t.toLowerCase().includes(q)))
    );
    setSearchResults(results);
  }, [searchQuery, articles]);

  const addCategory = async (cat: Partial<SOPCategory>) => {
    const { error } = await supabase.from('sop_categories' as any).insert(cat as any);
    if (error) { toast({ title: 'Chyba', description: error.message, variant: 'destructive' }); return; }
    await fetchData();
    toast({ title: 'Kategorie vytvořena' });
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
