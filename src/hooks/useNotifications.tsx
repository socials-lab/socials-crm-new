import { useState, useCallback, useMemo, useEffect } from 'react';
import { mockNotifications } from '@/data/notificationsMockData';
import { getStoredNotifications } from '@/data/modificationRequestsMockData';
import type { Notification } from '@/types/notifications';
import { useCRMData } from '@/hooks/useCRMData';
import { 
  getTodaysBirthdays, 
  wasBirthdayNotificationShown, 
  markBirthdayNotificationShown 
} from '@/utils/birthdayUtils';

const NOTIFICATIONS_STORAGE_KEY = 'crm_notifications';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { colleagues } = useCRMData();

  // Load notifications from localStorage + mock data on mount
  useEffect(() => {
    const storedNotifications = getStoredNotifications();
    // Merge stored notifications with mock, avoiding duplicates
    const merged = [...storedNotifications];
    mockNotifications.forEach(mock => {
      if (!merged.find(n => n.id === mock.id)) {
        merged.push(mock);
      }
    });
    // Sort by date (newest first)
    merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setNotifications(merged);
  }, []);

  // Poll for new notifications every 5 seconds (for client confirmations)
  useEffect(() => {
    const interval = setInterval(() => {
      const storedNotifications = getStoredNotifications();
      setNotifications(prev => {
        const newNotifs = storedNotifications.filter(
          stored => !prev.find(p => p.id === stored.id)
        );
        if (newNotifs.length > 0) {
          return [...newNotifs, ...prev];
        }
        return prev;
      });
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

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
    setNotifications(prev => {
      const updated = prev.map(n => (n.id === id ? { ...n, read: true } : n));
      // Also update localStorage for stored notifications
      const stored = getStoredNotifications();
      const updatedStored = stored.map(n => (n.id === id ? { ...n, read: true } : n));
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updatedStored));
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      // Also update localStorage
      const stored = getStoredNotifications();
      const updatedStored = stored.map(n => ({ ...n, read: true }));
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updatedStored));
      return updated;
    });
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      // Also update localStorage
      const stored = getStoredNotifications();
      const updatedStored = stored.filter(n => n.id !== id);
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updatedStored));
      return updated;
    });
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
