import { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCRMData } from '@/hooks/useCRMData';
import { 
  getTodaysBirthdays, 
  wasBirthdayNotificationShown, 
  markBirthdayNotificationShown 
} from '@/utils/birthdayUtils';
import type { Notification, NotificationType, EntityType } from '@/types/notifications';

export function useNotifications() {
  const { user } = useAuth();
  const { colleagues } = useCRMData();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch notifications from Supabase
  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const { data, error } = await (supabase.from('notifications' as any) as any)
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) {
          console.error('Error fetching notifications:', error);
          setNotifications([]);
        } else {
          setNotifications((data || []).map(rowToNotification));
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
        setNotifications([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          const newNotif = rowToNotification(payload.new);
          setNotifications(prev => [newNotif, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          const updated = rowToNotification(payload.new);
          setNotifications(prev => prev.map(n => n.id === updated.id ? updated : n));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          setNotifications(prev => prev.filter(n => n.id !== (payload.old as any).id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Check for birthday notifications
  useEffect(() => {
    if (!colleagues || colleagues.length === 0 || !user?.id) return;

    const todaysBirthdays = getTodaysBirthdays(colleagues);
    
    todaysBirthdays.forEach(async (colleague) => {
      if (!wasBirthdayNotificationShown(colleague.id)) {
        // Create birthday notification in Supabase
        await (supabase.from('notifications' as any) as any).insert({
          user_id: user.id,
          type: 'colleague_birthday',
          title: '🎂 Narozeniny!',
          message: `${colleague.full_name} má dnes narozeniny! Nezapomeňte popřát.`,
          link: '/colleagues',
          entity_type: 'colleague',
          metadata: {
            colleague_id: colleague.id,
            colleague_name: colleague.full_name,
          },
        });
        markBirthdayNotificationShown(colleague.id);
      }
    });
  }, [colleagues, user?.id]);

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.is_read).length,
    [notifications]
  );

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
    );
    await (supabase.from('notifications' as any) as any)
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id);
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    setNotifications(prev => 
      prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
    );
    await (supabase.from('notifications' as any) as any)
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_read', false);
  }, [user?.id]);

  const deleteNotification = useCallback(async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    await (supabase.from('notifications' as any) as any)
      .delete()
      .eq('id', id);
  }, []);

  const addNotification = useCallback(async (notification: {
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    entityType?: EntityType;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }) => {
    if (!user?.id) return;
    await (supabase.from('notifications' as any) as any).insert({
      user_id: user.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      entity_type: notification.entityType,
      entity_id: notification.entityId,
      metadata: notification.metadata || {},
    });
  }, [user?.id]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
  };
}

function rowToNotification(row: any): Notification {
  return {
    id: row.id,
    user_id: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    link: row.link,
    is_read: row.is_read ?? false,
    read_at: row.read_at,
    metadata: row.metadata || {},
    created_at: row.created_at,
  };
}
