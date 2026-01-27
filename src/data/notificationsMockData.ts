import type { Notification } from '@/types/notifications';

export const NOTIFICATIONS_STORAGE_KEY = 'crm_notifications';

// Default mock notifications for demo
const DEFAULT_MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    type: 'new_lead',
    title: 'Nový lead',
    message: 'Společnost ABC Solutions s.r.o. projevila zájem o Performance Boost.',
    link: '/leads',
    is_read: false,
    entity_type: 'lead',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min ago
    metadata: {
      lead_id: 'lead-1',
      company_name: 'ABC Solutions s.r.o.',
    },
  },
  {
    id: 'notif-2',
    type: 'form_completed',
    title: 'Onboarding formulář vyplněn',
    message: 'PetShop Online s.r.o. vyplnil onboarding formulář.',
    link: '/leads',
    is_read: false,
    entity_type: 'lead',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 min ago
    metadata: {
      lead_id: 'lead-2',
      company_name: 'PetShop Online s.r.o.',
    },
  },
  {
    id: 'notif-3',
    type: 'access_granted',
    title: '🔑 Přístupy nasdíleny',
    message: 'LuxuryWatches s.r.o. nasdílel přístupy k Meta Ads, Google Ads, S-klik.',
    link: '/leads',
    is_read: false,
    entity_type: 'lead',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(), // 1 hour ago
    metadata: {
      lead_id: 'lead-4',
      company_name: 'LuxuryWatches s.r.o.',
    },
  },
  {
    id: 'notif-4',
    type: 'offer_sent',
    title: '📤 Nabídka odeslána',
    message: 'Nabídka pro GreenEnergy CZ s.r.o. byla odeslána.',
    link: '/leads',
    is_read: false,
    entity_type: 'lead',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    metadata: {
      lead_id: 'lead-3',
      company_name: 'GreenEnergy CZ s.r.o.',
    },
  },
  {
    id: 'notif-5',
    type: 'contract_signed',
    title: 'Smlouva podepsána',
    message: 'TechGadgets s.r.o. podepsal smlouvu o spolupráci.',
    link: '/clients',
    is_read: false,
    entity_type: 'lead',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
    metadata: {
      client_id: 'client-1',
      company_name: 'TechGadgets s.r.o.',
    },
  },
  {
    id: 'notif-6',
    type: 'lead_converted',
    title: 'Lead převeden na zakázku',
    message: 'FashionBrand a.s. byl úspěšně převeden na aktivního klienta.',
    link: '/engagements',
    is_read: true,
    entity_type: 'engagement',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    metadata: {
      client_id: 'client-2',
      company_name: 'FashionBrand a.s.',
    },
  },
  {
    id: 'notif-7',
    type: 'new_lead',
    title: 'Nový lead',
    message: 'SportEquip s.r.o. vyplnil kontaktní formulář na webu.',
    link: '/leads',
    is_read: true,
    entity_type: 'lead',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
    metadata: {
      lead_id: 'lead-4',
      company_name: 'SportEquip s.r.o.',
    },
  },
  // Additional historical notifications for demo
  {
    id: 'notif-8',
    type: 'modification_approved',
    title: '✅ Modifikace schválena',
    message: 'Klient schválil úpravu zakázky pro AutoParts CZ.',
    link: '/modifications',
    is_read: true,
    entity_type: 'engagement',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    metadata: {
      engagement_id: 'eng-1',
      company_name: 'AutoParts CZ',
    },
  },
  {
    id: 'notif-9',
    type: 'new_feedback_idea',
    title: '💡 Nový nápad!',
    message: 'Jan Novák přidal nápad: "Automatické reporty pro klienty"',
    link: '/feedback',
    is_read: true,
    entity_type: 'feedback',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), // 4 days ago
    metadata: {
      colleague_id: 'col-1',
      colleague_name: 'Jan Novák',
    },
  },
  {
    id: 'notif-10',
    type: 'lead_qualified',
    title: '✓ Lead kvalifikován',
    message: 'HealthCare Plus s.r.o. byl označen jako kvalifikovaný lead.',
    link: '/leads',
    is_read: true,
    entity_type: 'lead',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(), // 5 days ago
    metadata: {
      lead_id: 'lead-5',
      company_name: 'HealthCare Plus s.r.o.',
    },
  },
];

// Initialize localStorage with mock data if empty
export function initializeNotifications(): Notification[] {
  const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
  
  if (!stored) {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(DEFAULT_MOCK_NOTIFICATIONS));
    return DEFAULT_MOCK_NOTIFICATIONS;
  }
  
  try {
    return JSON.parse(stored) as Notification[];
  } catch {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(DEFAULT_MOCK_NOTIFICATIONS));
    return DEFAULT_MOCK_NOTIFICATIONS;
  }
}

// Save notifications to localStorage
export function saveNotifications(notifications: Notification[]): void {
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
}

// Legacy export for backwards compatibility
export const mockNotifications = DEFAULT_MOCK_NOTIFICATIONS;
