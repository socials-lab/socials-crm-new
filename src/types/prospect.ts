import type { LeadNoteType } from './crm';

export type ProspectStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'irrelevant';

export type ProspectInteractionType = 'webinar_registration' | 'lead_magnet_download' | 'webinar_attended' | 'other';

export const PROSPECT_STATUS_LABELS: Record<ProspectStatus, string> = {
  new: 'Nový',
  contacted: 'Kontaktován',
  qualified: 'Kvalifikovaný',
  converted: 'Převedený',
  irrelevant: 'Nerelevantní',
};

export const PROSPECT_STATUS_COLORS: Record<ProspectStatus, string> = {
  new: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
  contacted: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  qualified: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
  converted: 'bg-purple-500/10 text-purple-700 border-purple-500/30',
  irrelevant: 'bg-muted text-muted-foreground',
};

export const INTERACTION_TYPE_LABELS: Record<ProspectInteractionType, string> = {
  webinar_registration: 'Registrace na webinář',
  lead_magnet_download: 'Stažení lead magnetu',
  webinar_attended: 'Účast na webináři',
  other: 'Jiná aktivita',
};

export const INTERACTION_TYPE_EMOJI: Record<ProspectInteractionType, string> = {
  webinar_registration: '📋',
  lead_magnet_download: '📥',
  webinar_attended: '🎥',
  other: '📌',
};

export interface ProspectNote {
  id: string;
  text: string;
  note_type: LeadNoteType;
  author_name: string;
  created_at: string;
  call_date?: string | null;
}

export interface Prospect {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  status: ProspectStatus;
  converted_to_lead_id: string | null;
  notes: ProspectNote[];
  created_at: string;
  updated_at: string;
}

export interface ProspectInteraction {
  id: string;
  prospect_id: string;
  type: ProspectInteractionType;
  title: string;
  metadata: Record<string, unknown> | null;
  occurred_at: string;
  created_at: string;
}

export interface ProspectWithInteractions extends Prospect {
  interactions: ProspectInteraction[];
  interaction_count: number;
  last_interaction_at: string | null;
}
