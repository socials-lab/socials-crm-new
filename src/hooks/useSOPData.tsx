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

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [catRes, artRes] = await Promise.all([
        supabase.from('sop_categories' as any).select('*').eq('is_active', true).order('sort_order'),
        supabase.from('sop_articles' as any).select('*').order('sort_order'),
      ]);
      if (catRes.data) setCategories(catRes.data as any);
      if (artRes.data) setArticles(artRes.data as any);
    } catch (e) {
      console.error('Error fetching SOP data:', e);
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
