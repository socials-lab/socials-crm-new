import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PortfolioItem {
  id: string;
  title: string;
  file_url: string;
  type: 'image' | 'video';
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

// Use any-cast because portfolio_items is not in generated types yet
const portfolioTable = () => (supabase as any).from('portfolio_items');

export function usePortfolioData() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await portfolioTable()
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching portfolio items:', error);
    } else {
      setItems(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const uploadFile = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from('portfolio')
      .upload(fileName, file, { cacheControl: '31536000', upsert: false });

    if (error) {
      toast({ title: 'Chyba při nahrávání', description: error.message, variant: 'destructive' });
      return null;
    }

    const { data: urlData } = supabase.storage.from('portfolio').getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const addItem = async (file: File, title: string) => {
    const fileUrl = await uploadFile(file);
    if (!fileUrl) return;

    const type = file.type.startsWith('video/') ? 'video' : 'image';
    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) + 1 : 0;

    const { error } = await portfolioTable()
      .insert({ title, file_url: fileUrl, type, sort_order: maxOrder });

    if (error) {
      toast({ title: 'Chyba při ukládání', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Položka přidána' });
      fetchItems();
    }
  };

  const updateItem = async (id: string, updates: Partial<Pick<PortfolioItem, 'title' | 'sort_order' | 'is_active'>>) => {
    const { error } = await portfolioTable()
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({ title: 'Chyba při ukládání', description: error.message, variant: 'destructive' });
    } else {
      fetchItems();
    }
  };

  const deleteItem = async (item: PortfolioItem) => {
    const url = new URL(item.file_url);
    const pathParts = url.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1];

    await supabase.storage.from('portfolio').remove([fileName]);
    const { error } = await portfolioTable()
      .delete()
      .eq('id', item.id);

    if (error) {
      toast({ title: 'Chyba při mazání', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Položka smazána' });
      fetchItems();
    }
  };

  return { items, isLoading, fetchItems, addItem, updateItem, deleteItem, uploadFile };
}

export function usePublicPortfolio() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await portfolioTable()
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      setItems(data || []);
      setIsLoading(false);
    }
    fetch();
  }, []);

  return { items, isLoading };
}
