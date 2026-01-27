import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
}

// Default mock data while database tables aren't created
const DEFAULT_MODULES: AcademyModule[] = [
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
    videos: [
      { id: 'clients-1', module_id: 'clients', title: 'Onboarding nového klienta', description: 'Proces nástupu nového klienta krok za krokem', duration: '10:15', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnail_url: null, sort_order: 1, is_active: true },
      { id: 'clients-2', module_id: 'clients', title: 'Pravidelná komunikace', description: 'Jak a kdy komunikovat s klienty', duration: '6:30', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnail_url: null, sort_order: 2, is_active: true },
      { id: 'clients-3', module_id: 'clients', title: 'Řešení problémů', description: 'Co dělat když něco nejde podle plánu', duration: '7:00', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnail_url: null, sort_order: 3, is_active: true },
    ],
  },
  {
    id: 'performance',
    title: 'Performance marketing 📈',
    description: 'Základy výkonnostní reklamy',
    icon: 'Target',
    required: false,
    sort_order: 4,
    is_active: true,
    videos: [
      { id: 'perf-1', module_id: 'performance', title: 'Meta Ads základy', description: 'Úvod do Facebook a Instagram reklamy', duration: '12:00', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnail_url: null, sort_order: 1, is_active: true },
      { id: 'perf-2', module_id: 'performance', title: 'Google Ads základy', description: 'Úvod do Google vyhledávání a PMax', duration: '11:30', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnail_url: null, sort_order: 2, is_active: true },
      { id: 'perf-3', module_id: 'performance', title: 'Reporting a analýza', description: 'Jak číst data a připravit report', duration: '9:45', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnail_url: null, sort_order: 3, is_active: true },
    ],
  },
  {
    id: 'creative',
    title: 'Creative Boost 🎨',
    description: 'Vše o naší kreativní službě',
    icon: 'Sparkles',
    required: false,
    sort_order: 5,
    is_active: true,
    videos: [
      { id: 'creative-1', module_id: 'creative', title: 'Co je Creative Boost', description: 'Představení služby a jak funguje', duration: '5:00', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnail_url: null, sort_order: 1, is_active: true },
      { id: 'creative-2', module_id: 'creative', title: 'Kreditový systém', description: 'Jak fungují kredity a odměny', duration: '6:30', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnail_url: null, sort_order: 2, is_active: true },
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
