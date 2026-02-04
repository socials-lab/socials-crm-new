export type NotificationType =
  | 'new_lead'
  | 'form_completed'
  | 'contract_signed'
  | 'lead_converted'
  | 'access_granted'
  | 'offer_sent'
  | 'colleague_birthday'
  | 'new_feedback_idea'
  | 'client_approved_modification';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  entity_type?: string;
  entity_id?: string;
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
}> = {
  new_lead: { 
    icon: '🎯', 
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10'
  },
  form_completed: { 
    icon: '📋', 
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10'
  },
  contract_signed: { 
    icon: '✍️', 
    color: 'text-purple-600',
    bgColor: 'bg-purple-500/10'
  },
  lead_converted: { 
    icon: '🎉', 
    color: 'text-green-600',
    bgColor: 'bg-green-500/10'
  },
  access_granted: { 
    icon: '🔑', 
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10'
  },
  offer_sent: { 
    icon: '📤', 
    color: 'text-pink-600',
    bgColor: 'bg-pink-500/10'
  },
  colleague_birthday: { 
    icon: '🎂', 
    color: 'text-rose-600',
    bgColor: 'bg-rose-500/10'
  },
  new_feedback_idea: {
    icon: '💡',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-500/10'
  },
  client_approved_modification: {
    icon: '✅',
    color: 'text-green-600',
    bgColor: 'bg-green-500/10'
  },
};
