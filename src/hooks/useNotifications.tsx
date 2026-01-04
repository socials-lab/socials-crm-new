import { useState, useCallback, useMemo, useEffect } from 'react';
import { mockNotifications } from '@/data/notificationsMockData';
import type { Notification } from '@/types/notifications';
import { useCRMData } from '@/hooks/useCRMData';
import { 
  getTodaysBirthdays, 
  wasBirthdayNotificationShown, 
  markBirthdayNotificationShown 
} from '@/utils/birthdayUtils';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const { colleagues } = useCRMData();

  // Check for birthday notifications on load and when colleagues change
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
          read: false,
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
    () => notifications.filter(n => !n.read).length,
    [notifications]
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'created_at' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      created_at: new Date().toISOString(),
      read: false,
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
