import { useCallback, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCRMData } from './useCRMData';
import { getTodaysBirthdays, wasBirthdayNotificationShown, markBirthdayNotificationShown } from '@/utils/birthdayUtils';
import type { Notification } from '@/types/notifications';

// Transformer function
const transformNotification = (row: Record<string, unknown>): Notification => ({
  id: row.id,
  type: row.type,
  title: row.title,
  message: row.message,
  link: row.link,
  read: row.read,
  created_at: row.created_at,
  metadata: row.metadata || {},
});

export function useNotifications() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { colleagues } = useCRMData();

  // Query
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(transformNotification);
    },
    enabled: !!user?.id,
  });

  // Mutations
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const addNotificationMutation = useMutation({
    mutationFn: async (notification: Omit<Notification, 'id' | 'created_at' | 'read'>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          link: notification.link,
          metadata: notification.metadata || {},
          read: false,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Stabilize mutation reference to avoid dependency issues
  const addNotificationRef = useRef(addNotificationMutation.mutateAsync);
  useEffect(() => {
    addNotificationRef.current = addNotificationMutation.mutateAsync;
  }, [addNotificationMutation.mutateAsync]);

  // Birthday notifications check - run in parallel for better performance
  useEffect(() => {
    if (!user?.id || !colleagues || colleagues.length === 0) return;

    const todaysBirthdays = getTodaysBirthdays(colleagues);
    if (todaysBirthdays.length === 0) return;

    const checkAndCreateBirthdayNotifications = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Process all birthdays in parallel
      await Promise.all(
        todaysBirthdays.map(async (colleague) => {
          // Check localStorage first to avoid unnecessary DB queries
          if (wasBirthdayNotificationShown(colleague.id)) return;

          // Check if notification already exists in DB for today
          const { data: existingNotifications } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', user.id)
            .eq('type', 'colleague_birthday')
            .eq('metadata->>colleague_id', colleague.id)
            .gte('created_at', today.toISOString())
            .lt('created_at', tomorrow.toISOString())
            .limit(1);

          if (existingNotifications && existingNotifications.length > 0) {
            markBirthdayNotificationShown(colleague.id);
            return;
          }

          // Create birthday notification using stable ref
          await addNotificationRef.current({
            type: 'colleague_birthday',
            title: '🎂 Narozeniny!',
            message: `${colleague.full_name} má dnes narozeniny! Nezapomeňte popřát.`,
            link: `/colleagues?highlight=${colleague.id}`,
            metadata: {
              colleague_id: colleague.id,
              colleague_name: colleague.full_name,
            },
          });

          markBirthdayNotificationShown(colleague.id);
        })
      );
    };

    checkAndCreateBirthdayNotifications();
  }, [colleagues, user?.id]);

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications]
  );

  const markAsRead = useCallback(
    (id: string) => {
      markAsReadMutation.mutate(id);
    },
    [markAsReadMutation]
  );

  const markAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  const deleteNotification = useCallback(
    (id: string) => {
      deleteNotificationMutation.mutate(id);
    },
    [deleteNotificationMutation]
  );

  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'created_at' | 'read'>) => {
      addNotificationMutation.mutate(notification);
    },
    [addNotificationMutation]
  );

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
