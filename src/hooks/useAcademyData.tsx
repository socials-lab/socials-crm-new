import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

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

// Empty array - no hardcoded demo data, show empty state when database is empty
const DEFAULT_MODULES: AcademyModule[] = [];

interface AcademyDataContextType {
  modules: AcademyModule[];
  isLoading: boolean;
  error: string | null;
  isUsingDatabase: boolean;
  refetch: () => Promise<void>;
  // Progress tracking
  watchedVideoIds: string[];
  markVideoWatched: (videoId: string) => Promise<void>;
  isVideoWatched: (videoId: string) => boolean;
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
  const [watchedVideoIds, setWatchedVideoIds] = useState<string[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

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

  // Fetch user's progress
  const fetchProgress = useCallback(async () => {
    if (!user) {
      setWatchedVideoIds([]);
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('academy_progress')
        .select('video_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching progress:', error);
        return;
      }

      setWatchedVideoIds((data || []).map((p: { video_id: string }) => p.video_id));
    } catch (err) {
      console.error('Error fetching progress:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Mark a video as watched
  const markVideoWatched = async (videoId: string) => {
    if (!user) return;

    // Optimistically update UI
    setWatchedVideoIds(prev => [...prev, videoId]);

    try {
      const { error } = await (supabase as any)
        .from('academy_progress')
        .insert({
          user_id: user.id,
          video_id: videoId,
        });

      if (error) {
        // Revert on error
        setWatchedVideoIds(prev => prev.filter(id => id !== videoId));
        console.error('Error marking video watched:', error);
      }
    } catch (err) {
      setWatchedVideoIds(prev => prev.filter(id => id !== videoId));
      console.error('Error marking video watched:', err);
    }
  };

  // Check if a video is watched
  const isVideoWatched = (videoId: string): boolean => {
    return watchedVideoIds.includes(videoId);
  };

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
          is_active: moduleData.is_active !== undefined ? moduleData.is_active : true,
          links: moduleData.links || [],
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
          links: moduleData.links,
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
          is_active: videoData.is_active !== undefined ? videoData.is_active : true,
          links: videoData.links || [],
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
          links: videoData.links,
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
      watchedVideoIds,
      markVideoWatched,
      isVideoWatched,
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
