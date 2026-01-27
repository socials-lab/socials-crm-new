import { useState, useCallback, useMemo, useEffect } from 'react';
import { useCRMData } from '@/hooks/useCRMData';
import { 
  getTodaysBirthdays, 
  wasBirthdayNotificationShown, 
  markBirthdayNotificationShown 
} from '@/utils/birthdayUtils';
import type { Notification, NotificationType, EntityType } from '@/types/notifications';
import { 
  initializeNotifications, 
  saveNotifications, 
  NOTIFICATIONS_STORAGE_KEY 
} from '@/data/notificationsMockData';

export function useNotifications() {
  const { colleagues } = useCRMData();
  
  // Initialize notifications from localStorage (with mock data if needed)
  const [notifications, setNotifications] = useState<Notification[]>(() => 
    initializeNotifications()
  );

  // Sync to localStorage on changes
  useEffect(() => {
    saveNotifications(notifications);
  }, [notifications]);

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
        
        setNotifications(prev => [birthdayNotification, ...prev]);
        markBirthdayNotificationShown(colleague.id);
      }
    });
  }, [colleagues]);

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.is_read).length,
    [notifications]
  );

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
    );
  }, []);

  // Delete notification
  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Add notification
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
    setNotifications(prev => [newNotification, ...prev]);
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
