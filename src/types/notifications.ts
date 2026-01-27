export type NotificationType = 
  | 'new_lead'
  | 'form_completed'
  | 'contract_signed'
  | 'lead_converted'
  | 'lead_qualified'
  | 'access_granted'
  | 'offer_sent'
  | 'offer_viewed'
  | 'colleague_birthday'
  | 'new_feedback_idea'
  | 'modification_approved'
  | 'client_approved_modification'
  | 'engagement_assigned'
  | 'engagement_service_added'
  | 'engagement_ending_soon'
  | 'extra_work_approved'
  | 'extra_work_ready_to_invoice'
  | 'creative_boost_activated'
  | 'creative_boost_deadline';

export type EntityType = 'lead' | 'engagement' | 'extra_work' | 'creative_boost' | 'modification' | 'colleague' | 'feedback';

export interface Notification {
  id: string;
  user_id?: string;
  type: NotificationType;
  title: string;
  message: string;
  entity_type?: EntityType;
  entity_id?: string;
  link?: string;
  is_read: boolean;
  read_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// Legacy type for backwards compatibility with existing code
export interface LegacyNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
  metadata?: {
    lead_id?: string;
    client_id?: string;
    company_name?: string;
    colleague_id?: string;
    colleague_name?: string;
    modification_request_id?: string;
    engagement_name?: string;
  };
}

export const NOTIFICATION_CONFIG: Record<NotificationType, { 
  icon: string; 
  color: string;
  bgColor: string;
  entityType?: EntityType;
}> = {
  new_lead: { 
    icon: '🎯', 
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    entityType: 'lead'
  },
  form_completed: { 
    icon: '📋', 
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
    entityType: 'lead'
  },
  contract_signed: { 
    icon: '✍️', 
    color: 'text-purple-600',
    bgColor: 'bg-purple-500/10',
    entityType: 'lead'
  },
  lead_converted: { 
    icon: '🎉', 
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    entityType: 'engagement'
  },
  access_granted: { 
    icon: '🔑', 
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
    entityType: 'lead'
  },
  offer_sent: { 
    icon: '📤', 
    color: 'text-pink-600',
    bgColor: 'bg-pink-500/10',
    entityType: 'lead'
  },
  offer_viewed: { 
    icon: '👁️', 
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-500/10',
    entityType: 'lead'
  },
  colleague_birthday: { 
    icon: '🎂', 
    color: 'text-rose-600',
    bgColor: 'bg-rose-500/10',
    entityType: 'colleague'
  },
  new_feedback_idea: { 
    icon: '💡', 
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-500/10'
  },
  lead_qualified: {
    icon: '✓',
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    entityType: 'lead'
  },
  modification_approved: { 
    icon: '✅', 
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    entityType: 'modification'
  },
  client_approved_modification: { 
    icon: '✅', 
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    entityType: 'modification'
  },
  engagement_assigned: {
    icon: '👤',
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    entityType: 'engagement'
  },
  engagement_service_added: {
    icon: '➕',
    color: 'text-teal-600',
    bgColor: 'bg-teal-500/10',
    entityType: 'engagement'
  },
  engagement_ending_soon: {
    icon: '⏰',
    color: 'text-orange-600',
    bgColor: 'bg-orange-500/10',
    entityType: 'engagement'
  },
  extra_work_approved: {
    icon: '✅',
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    entityType: 'extra_work'
  },
  extra_work_ready_to_invoice: {
    icon: '💰',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
    entityType: 'extra_work'
  },
  creative_boost_activated: {
    icon: '🎨',
    color: 'text-violet-600',
    bgColor: 'bg-violet-500/10',
    entityType: 'creative_boost'
  },
  creative_boost_deadline: {
    icon: '⚠️',
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
    entityType: 'creative_boost'
  },
};

// Filter categories for the notifications page
export const NOTIFICATION_FILTERS = [
  { key: 'all', label: 'Všechny', entityTypes: null },
  { key: 'leads', label: 'Leady', entityTypes: ['lead'] },
  { key: 'engagements', label: 'Zakázky', entityTypes: ['engagement', 'modification'] },
  { key: 'extra_work', label: 'Vícepráce', entityTypes: ['extra_work'] },
  { key: 'creative_boost', label: 'Creative Boost', entityTypes: ['creative_boost'] },
] as const;

export type NotificationFilterKey = typeof NOTIFICATION_FILTERS[number]['key'];
