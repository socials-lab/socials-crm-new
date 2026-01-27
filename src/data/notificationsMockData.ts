import type { Notification } from '@/types/notifications';

// Mock data for notifications - will be replaced by Supabase data
// Uses is_read for compatibility with new schema
export const mockNotifications: Notification[] = [
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
];
