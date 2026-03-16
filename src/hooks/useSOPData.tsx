import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { createNotification, notifyAdmins } from '@/services/notificationService';
import { withAbortTimeout } from '@/utils/asyncUtils';

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

function isAbortLikeError(error: unknown): boolean {
  if (!error) return false;

  if (error instanceof DOMException) {
    return error.name === 'AbortError' || error.message.toLowerCase().includes('aborted');
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return error.name === 'AbortError' || message.includes('aborterror') || message.includes('aborted') || message.includes('cancel') || message.includes('timeout');
  }

  if (typeof error === 'object') {
    const maybeError = error as { name?: unknown; message?: unknown; code?: unknown };
    const name = typeof maybeError.name === 'string' ? maybeError.name.toLowerCase() : '';
    const message = typeof maybeError.message === 'string' ? maybeError.message.toLowerCase() : '';
    const code = typeof maybeError.code === 'string' ? maybeError.code.toLowerCase() : '';
    return name.includes('abort') || message.includes('aborterror') || message.includes('aborted') || message.includes('cancel') || message.includes('timeout') || code.includes('abort') || code.includes('timeout');
  }

  return false;
}

export function SOPDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
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
        withAbortTimeout(
          (signal) => supabase.from('sop_categories').select('*').eq('is_active', true).order('sort_order').abortSignal(signal),
          12000,
          'Timeout while loading SOP categories'
        ),
        withAbortTimeout(
          (signal) => supabase.from('sop_articles').select('*').order('sort_order').abortSignal(signal),
          12000,
          'Timeout while loading SOP articles'
        ),
        withAbortTimeout(
          (signal) => supabase.from('sop_update_suggestions').select('*, profiles:suggested_by(full_name)').order('created_at', { ascending: false }).abortSignal(signal),
          12000,
          'Timeout while loading SOP suggestions'
        ),
      ]);

      if (catRes.error) {
        if (isAbortLikeError(catRes.error)) {
          console.warn('SOP categories fetch aborted:', catRes.error);
        } else {
          console.error('Error fetching SOP categories:', catRes.error);
          toast.error('Nepodařilo se načíst kategorie SOP.');
        }
      } else {
        setCategories(catRes.data || []);
      }

      if (artRes.error) {
        if (isAbortLikeError(artRes.error)) {
          console.warn('SOP articles fetch aborted:', artRes.error);
        } else {
          console.error('Error fetching SOP articles:', artRes.error);
          toast.error('Nepodařilo se načíst články SOP.');
        }
      } else {
        setArticles(artRes.data || []);
      }

      if (sugRes.error) {
        if (isAbortLikeError(sugRes.error)) {
          console.warn('SOP suggestions fetch aborted:', sugRes.error);
        } else {
          console.error('Error fetching SOP suggestions:', sugRes.error);
          toast.error('Nepodařilo se načíst návrhy úprav SOP.');
        }
      } else {
        setSuggestions((sugRes.data || []).map((s: SOPSuggestion & { profiles?: { full_name?: string } }) => ({
          ...s,
          suggested_by_name: s.profiles?.full_name || undefined,
        })));
      }
    } catch (e) {
      if (isAbortLikeError(e)) {
        console.warn('SOP data fetch aborted:', e);
      } else {
        console.error('Error fetching SOP data:', e);
        toast.error('Nepodařilo se načíst SOP data.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    fetchData();
  }, [user, fetchData]);

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
    const { data, error } = await supabase.from('sop_categories').insert({
      title: cat.title || '',
      description: cat.description || '',
      icon: cat.icon || 'BookOpen',
      sort_order: categories.length,
      is_active: true,
    }).select('id').single();

    if (error) {
      console.error('Error creating category:', error);
      toast.error('Chyba', { description: error.message });
      return undefined;
    }

    await fetchData();
    toast.success('Kategorie vytvořena');
    return data?.id;
  };

  const updateCategory = async (id: string, cat: Partial<SOPCategory>) => {
    const { error } = await supabase.from('sop_categories').update(cat).eq('id', id);
    if (error) {
      console.error('Error updating category:', error);
      toast.error('Chyba', { description: error.message });
      return;
    }
    await fetchData();
    toast.success('Kategorie aktualizována');
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('sop_categories').delete().eq('id', id);
    if (error) {
      console.error('Error deleting category:', error);
      toast.error('Chyba', { description: error.message });
      return;
    }
    await fetchData();
    toast.success('Kategorie smazána');
  };

  const addArticle = async (article: Partial<SOPArticle>) => {
    const searchText = stripHtml(article.content || '');

    try {
      const { error } = await supabase.from('sop_articles').insert({
        category_id: article.category_id,
        title: article.title || '',
        content: article.content || '',
        search_text: searchText,
        tags: article.tags || [],
        sort_order: article.sort_order || 0,
        is_published: article.is_published ?? false,
        owner_id: article.owner_id || user?.id,
        attachments: article.attachments || [],
        created_by: user?.id,
        updated_by: user?.id,
      });

      if (error) {
        console.error('Error creating article:', error);
        toast.error('Chyba', { description: error.message });
        throw new Error(error.message);
      }

      // Don't wait for fetchData - do it in background
      fetchData().catch(console.error);
      toast.success('Článek vytvořen');
    } catch (err) {
      console.error('Exception creating article:', err);
      throw err;
    }
  };

  const updateArticle = async (id: string, article: Partial<SOPArticle>) => {
    const updates: Record<string, unknown> = { ...article, updated_by: user?.id };
    if (article.content !== undefined) {
      updates.search_text = stripHtml(article.content);
    }

    try {
      const { error } = await supabase.from('sop_articles').update(updates).eq('id', id);
      if (error) {
        console.error('Error updating article:', error);
        toast.error('Chyba', { description: error.message });
        throw new Error(error.message);
      }

      // Don't wait for fetchData - do it in background
      fetchData().catch(console.error);
      toast.success('Článek uložen');
    } catch (err) {
      console.error('Exception updating article:', err);
      throw err;
    }
  };

  const deleteArticle = async (id: string) => {
    const { error } = await supabase.from('sop_articles').delete().eq('id', id);
    if (error) {
      console.error('Error deleting article:', error);
      toast.error('Chyba', { description: error.message });
      return;
    }
    await fetchData();
    toast.success('Článek smazán');
  };

  const suggestUpdate = async (articleId: string, reason: string) => {
    if (!user) return;

    const { error } = await supabase.from('sop_update_suggestions').insert({
      article_id: articleId,
      suggested_by: user.id,
      reason,
      status: 'pending',
    });

    if (error) {
      console.error('Error creating suggestion:', error);
      toast.error('Chyba', { description: error.message });
      return;
    }

    await fetchData();

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

    toast.success('Návrh odeslán', { description: 'Správce bude informován.' });
  };

  const resolveSuggestion = async (id: string, status: 'accepted' | 'dismissed') => {
    const { error } = await supabase.from('sop_update_suggestions').update({
      status,
      resolved_by: user?.id,
      resolved_at: new Date().toISOString(),
    }).eq('id', id);

    if (error) {
      console.error('Error resolving suggestion:', error);
      toast.error('Chyba', { description: error.message });
      return;
    }

    await fetchData();
    toast.success(status === 'accepted' ? 'Návrh přijat' : 'Návrh zamítnut');
  };

  const incrementViewCount = async (articleId: string) => {
    // Increment in DB using the RPC function
    await supabase.rpc('increment_sop_view_count', { article_id: articleId });
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
