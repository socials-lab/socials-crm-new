import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mockNotifications } from '@/data/notificationsMockData';
import { useAuth } from '@/hooks/useAuth';
import { useCRMData } from '@/hooks/useCRMData';
import { 
  getTodaysBirthdays, 
  wasBirthdayNotificationShown, 
  markBirthdayNotificationShown 
} from '@/utils/birthdayUtils';
import type { Notification, NotificationType, EntityType } from '@/types/notifications';
import { toast } from 'sonner';

// Check if the notifications table exists in the database
// For now, we'll use a hybrid approach - try Supabase first, fall back to localStorage
const USE_SUPABASE_NOTIFICATIONS = true;

export function useNotifications() {
  const { user } = useAuth();
  const { colleagues } = useCRMData();
  const queryClient = useQueryClient();
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([]);

  // Fetch notifications from Supabase
  const { data: supabaseNotifications, refetch } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id || !USE_SUPABASE_NOTIFICATIONS) return null;
      
      try {
        const { data, error } = await supabase
          .from('notifications' as any)
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (error) {
          // Table doesn't exist yet, fall back to mock data
          console.log('Notifications table not available, using mock data');
          return null;
        }
        
        return data as unknown as Notification[];
      } catch {
        return null;
      }
    },
    enabled: !!user?.id && USE_SUPABASE_NOTIFICATIONS,
    refetchInterval: 30000, // Poll every 30 seconds
    retry: false, // Don't retry if table doesn't exist
  });

  // Initialize with mock data if Supabase is not available
  useEffect(() => {
    if (supabaseNotifications === null) {
      setLocalNotifications(mockNotifications);
    }
  }, [supabaseNotifications]);

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!user?.id || !USE_SUPABASE_NOTIFICATIONS) return;

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          refetch();
          // Show toast for new notification
          if (payload.new) {
            toast(payload.new.title, {
              description: payload.new.message,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetch]);

  // Check for birthday notifications
  useEffect(() => {
    if (!colleagues || colleagues.length === 0) return;

    const todaysBirthdays = getTodaysBirthdays(colleagues);
    
    todaysBirthdays.forEach((colleague) => {
      if (!wasBirthdayNotificationShown(colleague.id)) {
        const birthdayNotification: Notification = {
          id: `birthday-${colleague.id}-${Date.now()}`,
          type: 'colleague_birthday',
          title: '🎂 Narozeniny!',
          message: `${colleague.full_name} má dnes narozeniny! Nezapomeňte popřát.`,
          link: '/colleagues',
          is_read: false,
          entity_type: 'colleague',
          created_at: new Date().toISOString(),
          metadata: {
            colleague_id: colleague.id,
            colleague_name: colleague.full_name,
          },
        };
        
        setLocalNotifications(prev => [birthdayNotification, ...prev]);
        markBirthdayNotificationShown(colleague.id);
      }
    });
  }, [colleagues]);

  // Combine Supabase and local notifications
  const notifications = useMemo(() => {
    const supabaseData = supabaseNotifications || [];
    const combined = [...supabaseData, ...localNotifications];
    
    // Remove duplicates by ID
    const seen = new Set<string>();
    return combined.filter(n => {
      if (seen.has(n.id)) return false;
      seen.add(n.id);
      return true;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [supabaseNotifications, localNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.is_read).length,
    [notifications]
  );

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      // Try Supabase first
      if (user?.id && USE_SUPABASE_NOTIFICATIONS) {
        const { error } = await supabase
          .from('notifications' as any)
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', user.id);
        
        if (!error) return { source: 'supabase', id };
      }
      
      // Fall back to local state
      return { source: 'local', id };
    },
    onSuccess: (result) => {
      if (result.source === 'supabase') {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      } else {
        setLocalNotifications(prev => 
          prev.map(n => n.id === result.id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
        );
      }
    },
  });

  const markAsRead = useCallback((id: string) => {
    markAsReadMutation.mutate(id);
  }, [markAsReadMutation]);

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (user?.id && USE_SUPABASE_NOTIFICATIONS) {
        const { error } = await supabase
          .from('notifications' as any)
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('is_read', false);
        
        if (!error) return 'supabase';
      }
      return 'local';
    },
    onSuccess: (source) => {
      if (source === 'supabase') {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
      setLocalNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
    },
  });

  const markAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      if (user?.id && USE_SUPABASE_NOTIFICATIONS) {
        const { error } = await supabase
          .from('notifications' as any)
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
        
        if (!error) return { source: 'supabase', id };
      }
      return { source: 'local', id };
    },
    onSuccess: (result) => {
      if (result.source === 'supabase') {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
      setLocalNotifications(prev => prev.filter(n => n.id !== result.id));
    },
  });

  const deleteNotification = useCallback((id: string) => {
    deleteNotificationMutation.mutate(id);
  }, [deleteNotificationMutation]);

  // Add notification (local only for backwards compatibility)
  const addNotification = useCallback((notification: {
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    entityType?: EntityType;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }) => {
    const newNotification: Notification = {
      id: `notif-${Date.now()}`,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      entity_type: notification.entityType,
      entity_id: notification.entityId,
      is_read: false,
      created_at: new Date().toISOString(),
      metadata: notification.metadata,
    };
    setLocalNotifications(prev => [newNotification, ...prev]);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
  };
}
