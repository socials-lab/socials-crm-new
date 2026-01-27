import type { LeadStage } from '@/types/crm';

export interface MockTransition {
  id: string;
  lead_id: string;
  from_stage: LeadStage;
  to_stage: LeadStage;
  transition_value: number;
  confirmed_at: string;
  confirmed_by: string | null;
  created_at: string;
}

// Generate a random ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// Historical mock data - 6 months of realistic lead transitions
// Designed to show ~85% meeting, ~70% access request, ~80% access received, 
// ~90% preparing offer, ~95% offer sent, ~40% won = ~20% overall conversion
export const MOCK_TRANSITIONS: MockTransition[] = [
  // ===== SRPEN 2025 =====
  // Lead A - Full journey to won
  { id: generateId(), lead_id: 'lead-a', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 65000, confirmed_at: '2025-08-02T10:00:00Z', confirmed_by: null, created_at: '2025-08-02T10:00:00Z' },
  { id: generateId(), lead_id: 'lead-a', from_stage: 'meeting_done', to_stage: 'waiting_access', transition_value: 65000, confirmed_at: '2025-08-05T14:00:00Z', confirmed_by: null, created_at: '2025-08-05T14:00:00Z' },
  { id: generateId(), lead_id: 'lead-a', from_stage: 'waiting_access', to_stage: 'access_received', transition_value: 65000, confirmed_at: '2025-08-08T09:00:00Z', confirmed_by: null, created_at: '2025-08-08T09:00:00Z' },
  { id: generateId(), lead_id: 'lead-a', from_stage: 'access_received', to_stage: 'preparing_offer', transition_value: 65000, confirmed_at: '2025-08-10T11:00:00Z', confirmed_by: null, created_at: '2025-08-10T11:00:00Z' },
  { id: generateId(), lead_id: 'lead-a', from_stage: 'preparing_offer', to_stage: 'offer_sent', transition_value: 65000, confirmed_at: '2025-08-12T16:00:00Z', confirmed_by: null, created_at: '2025-08-12T16:00:00Z' },
  { id: generateId(), lead_id: 'lead-a', from_stage: 'offer_sent', to_stage: 'won', transition_value: 65000, confirmed_at: '2025-08-18T10:00:00Z', confirmed_by: null, created_at: '2025-08-18T10:00:00Z' },
  
  // Lead B - Full journey to won
  { id: generateId(), lead_id: 'lead-b', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 45000, confirmed_at: '2025-08-04T11:00:00Z', confirmed_by: null, created_at: '2025-08-04T11:00:00Z' },
  { id: generateId(), lead_id: 'lead-b', from_stage: 'meeting_done', to_stage: 'waiting_access', transition_value: 45000, confirmed_at: '2025-08-07T10:00:00Z', confirmed_by: null, created_at: '2025-08-07T10:00:00Z' },
  { id: generateId(), lead_id: 'lead-b', from_stage: 'waiting_access', to_stage: 'access_received', transition_value: 45000, confirmed_at: '2025-08-11T15:00:00Z', confirmed_by: null, created_at: '2025-08-11T15:00:00Z' },
  { id: generateId(), lead_id: 'lead-b', from_stage: 'access_received', to_stage: 'preparing_offer', transition_value: 45000, confirmed_at: '2025-08-13T09:00:00Z', confirmed_by: null, created_at: '2025-08-13T09:00:00Z' },
  { id: generateId(), lead_id: 'lead-b', from_stage: 'preparing_offer', to_stage: 'offer_sent', transition_value: 45000, confirmed_at: '2025-08-15T14:00:00Z', confirmed_by: null, created_at: '2025-08-15T14:00:00Z' },
  { id: generateId(), lead_id: 'lead-b', from_stage: 'offer_sent', to_stage: 'won', transition_value: 45000, confirmed_at: '2025-08-22T11:00:00Z', confirmed_by: null, created_at: '2025-08-22T11:00:00Z' },

  // Lead C - Lost at offer_sent
  { id: generateId(), lead_id: 'lead-c', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 80000, confirmed_at: '2025-08-08T09:00:00Z', confirmed_by: null, created_at: '2025-08-08T09:00:00Z' },
  { id: generateId(), lead_id: 'lead-c', from_stage: 'meeting_done', to_stage: 'waiting_access', transition_value: 80000, confirmed_at: '2025-08-12T11:00:00Z', confirmed_by: null, created_at: '2025-08-12T11:00:00Z' },
  { id: generateId(), lead_id: 'lead-c', from_stage: 'waiting_access', to_stage: 'access_received', transition_value: 80000, confirmed_at: '2025-08-16T10:00:00Z', confirmed_by: null, created_at: '2025-08-16T10:00:00Z' },
  { id: generateId(), lead_id: 'lead-c', from_stage: 'access_received', to_stage: 'preparing_offer', transition_value: 80000, confirmed_at: '2025-08-18T15:00:00Z', confirmed_by: null, created_at: '2025-08-18T15:00:00Z' },
  { id: generateId(), lead_id: 'lead-c', from_stage: 'preparing_offer', to_stage: 'offer_sent', transition_value: 80000, confirmed_at: '2025-08-20T14:00:00Z', confirmed_by: null, created_at: '2025-08-20T14:00:00Z' },

  // Lead D - Lost at meeting_done (didn't proceed to access)
  { id: generateId(), lead_id: 'lead-d', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 35000, confirmed_at: '2025-08-15T10:00:00Z', confirmed_by: null, created_at: '2025-08-15T10:00:00Z' },

  // ===== ZÁŘÍ 2025 =====
  // Lead E - Full journey to won
  { id: generateId(), lead_id: 'lead-e', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 120000, confirmed_at: '2025-09-02T09:00:00Z', confirmed_by: null, created_at: '2025-09-02T09:00:00Z' },
  { id: generateId(), lead_id: 'lead-e', from_stage: 'meeting_done', to_stage: 'waiting_access', transition_value: 120000, confirmed_at: '2025-09-05T11:00:00Z', confirmed_by: null, created_at: '2025-09-05T11:00:00Z' },
  { id: generateId(), lead_id: 'lead-e', from_stage: 'waiting_access', to_stage: 'access_received', transition_value: 120000, confirmed_at: '2025-09-09T14:00:00Z', confirmed_by: null, created_at: '2025-09-09T14:00:00Z' },
  { id: generateId(), lead_id: 'lead-e', from_stage: 'access_received', to_stage: 'preparing_offer', transition_value: 120000, confirmed_at: '2025-09-11T10:00:00Z', confirmed_by: null, created_at: '2025-09-11T10:00:00Z' },
  { id: generateId(), lead_id: 'lead-e', from_stage: 'preparing_offer', to_stage: 'offer_sent', transition_value: 120000, confirmed_at: '2025-09-14T16:00:00Z', confirmed_by: null, created_at: '2025-09-14T16:00:00Z' },
  { id: generateId(), lead_id: 'lead-e', from_stage: 'offer_sent', to_stage: 'won', transition_value: 120000, confirmed_at: '2025-09-20T10:00:00Z', confirmed_by: null, created_at: '2025-09-20T10:00:00Z' },

  // Lead F - Lost at offer_sent
  { id: generateId(), lead_id: 'lead-f', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 55000, confirmed_at: '2025-09-05T10:00:00Z', confirmed_by: null, created_at: '2025-09-05T10:00:00Z' },
  { id: generateId(), lead_id: 'lead-f', from_stage: 'meeting_done', to_stage: 'waiting_access', transition_value: 55000, confirmed_at: '2025-09-08T14:00:00Z', confirmed_by: null, created_at: '2025-09-08T14:00:00Z' },
  { id: generateId(), lead_id: 'lead-f', from_stage: 'waiting_access', to_stage: 'access_received', transition_value: 55000, confirmed_at: '2025-09-12T09:00:00Z', confirmed_by: null, created_at: '2025-09-12T09:00:00Z' },
  { id: generateId(), lead_id: 'lead-f', from_stage: 'access_received', to_stage: 'preparing_offer', transition_value: 55000, confirmed_at: '2025-09-15T11:00:00Z', confirmed_by: null, created_at: '2025-09-15T11:00:00Z' },
  { id: generateId(), lead_id: 'lead-f', from_stage: 'preparing_offer', to_stage: 'offer_sent', transition_value: 55000, confirmed_at: '2025-09-18T15:00:00Z', confirmed_by: null, created_at: '2025-09-18T15:00:00Z' },

  // Lead G - Lost at waiting_access
  { id: generateId(), lead_id: 'lead-g', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 40000, confirmed_at: '2025-09-10T11:00:00Z', confirmed_by: null, created_at: '2025-09-10T11:00:00Z' },
  { id: generateId(), lead_id: 'lead-g', from_stage: 'meeting_done', to_stage: 'waiting_access', transition_value: 40000, confirmed_at: '2025-09-14T10:00:00Z', confirmed_by: null, created_at: '2025-09-14T10:00:00Z' },

  // Lead H - Won
  { id: generateId(), lead_id: 'lead-h', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 75000, confirmed_at: '2025-09-12T14:00:00Z', confirmed_by: null, created_at: '2025-09-12T14:00:00Z' },
  { id: generateId(), lead_id: 'lead-h', from_stage: 'meeting_done', to_stage: 'waiting_access', transition_value: 75000, confirmed_at: '2025-09-16T09:00:00Z', confirmed_by: null, created_at: '2025-09-16T09:00:00Z' },
  { id: generateId(), lead_id: 'lead-h', from_stage: 'waiting_access', to_stage: 'access_received', transition_value: 75000, confirmed_at: '2025-09-19T11:00:00Z', confirmed_by: null, created_at: '2025-09-19T11:00:00Z' },
  { id: generateId(), lead_id: 'lead-h', from_stage: 'access_received', to_stage: 'preparing_offer', transition_value: 75000, confirmed_at: '2025-09-22T15:00:00Z', confirmed_by: null, created_at: '2025-09-22T15:00:00Z' },
  { id: generateId(), lead_id: 'lead-h', from_stage: 'preparing_offer', to_stage: 'offer_sent', transition_value: 75000, confirmed_at: '2025-09-24T10:00:00Z', confirmed_by: null, created_at: '2025-09-24T10:00:00Z' },
  { id: generateId(), lead_id: 'lead-h', from_stage: 'offer_sent', to_stage: 'won', transition_value: 75000, confirmed_at: '2025-09-28T14:00:00Z', confirmed_by: null, created_at: '2025-09-28T14:00:00Z' },

  // ===== ŘÍJEN 2025 =====
  // Lead I - Won
  { id: generateId(), lead_id: 'lead-i', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 95000, confirmed_at: '2025-10-03T10:00:00Z', confirmed_by: null, created_at: '2025-10-03T10:00:00Z' },
  { id: generateId(), lead_id: 'lead-i', from_stage: 'meeting_done', to_stage: 'waiting_access', transition_value: 95000, confirmed_at: '2025-10-07T11:00:00Z', confirmed_by: null, created_at: '2025-10-07T11:00:00Z' },
  { id: generateId(), lead_id: 'lead-i', from_stage: 'waiting_access', to_stage: 'access_received', transition_value: 95000, confirmed_at: '2025-10-10T14:00:00Z', confirmed_by: null, created_at: '2025-10-10T14:00:00Z' },
  { id: generateId(), lead_id: 'lead-i', from_stage: 'access_received', to_stage: 'preparing_offer', transition_value: 95000, confirmed_at: '2025-10-13T09:00:00Z', confirmed_by: null, created_at: '2025-10-13T09:00:00Z' },
  { id: generateId(), lead_id: 'lead-i', from_stage: 'preparing_offer', to_stage: 'offer_sent', transition_value: 95000, confirmed_at: '2025-10-15T16:00:00Z', confirmed_by: null, created_at: '2025-10-15T16:00:00Z' },
  { id: generateId(), lead_id: 'lead-i', from_stage: 'offer_sent', to_stage: 'won', transition_value: 95000, confirmed_at: '2025-10-22T10:00:00Z', confirmed_by: null, created_at: '2025-10-22T10:00:00Z' },

  // Lead J - Lost at offer
  { id: generateId(), lead_id: 'lead-j', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 60000, confirmed_at: '2025-10-08T09:00:00Z', confirmed_by: null, created_at: '2025-10-08T09:00:00Z' },
  { id: generateId(), lead_id: 'lead-j', from_stage: 'meeting_done', to_stage: 'waiting_access', transition_value: 60000, confirmed_at: '2025-10-11T14:00:00Z', confirmed_by: null, created_at: '2025-10-11T14:00:00Z' },
  { id: generateId(), lead_id: 'lead-j', from_stage: 'waiting_access', to_stage: 'access_received', transition_value: 60000, confirmed_at: '2025-10-15T10:00:00Z', confirmed_by: null, created_at: '2025-10-15T10:00:00Z' },
  { id: generateId(), lead_id: 'lead-j', from_stage: 'access_received', to_stage: 'preparing_offer', transition_value: 60000, confirmed_at: '2025-10-18T11:00:00Z', confirmed_by: null, created_at: '2025-10-18T11:00:00Z' },
  { id: generateId(), lead_id: 'lead-j', from_stage: 'preparing_offer', to_stage: 'offer_sent', transition_value: 60000, confirmed_at: '2025-10-21T15:00:00Z', confirmed_by: null, created_at: '2025-10-21T15:00:00Z' },

  // Lead K - Lost early
  { id: generateId(), lead_id: 'lead-k', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 30000, confirmed_at: '2025-10-14T10:00:00Z', confirmed_by: null, created_at: '2025-10-14T10:00:00Z' },

  // ===== LISTOPAD 2025 =====
  // Lead L - Won
  { id: generateId(), lead_id: 'lead-l', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 85000, confirmed_at: '2025-11-04T09:00:00Z', confirmed_by: null, created_at: '2025-11-04T09:00:00Z' },
  { id: generateId(), lead_id: 'lead-l', from_stage: 'meeting_done', to_stage: 'waiting_access', transition_value: 85000, confirmed_at: '2025-11-07T11:00:00Z', confirmed_by: null, created_at: '2025-11-07T11:00:00Z' },
  { id: generateId(), lead_id: 'lead-l', from_stage: 'waiting_access', to_stage: 'access_received', transition_value: 85000, confirmed_at: '2025-11-11T14:00:00Z', confirmed_by: null, created_at: '2025-11-11T14:00:00Z' },
  { id: generateId(), lead_id: 'lead-l', from_stage: 'access_received', to_stage: 'preparing_offer', transition_value: 85000, confirmed_at: '2025-11-13T10:00:00Z', confirmed_by: null, created_at: '2025-11-13T10:00:00Z' },
  { id: generateId(), lead_id: 'lead-l', from_stage: 'preparing_offer', to_stage: 'offer_sent', transition_value: 85000, confirmed_at: '2025-11-16T16:00:00Z', confirmed_by: null, created_at: '2025-11-16T16:00:00Z' },
  { id: generateId(), lead_id: 'lead-l', from_stage: 'offer_sent', to_stage: 'won', transition_value: 85000, confirmed_at: '2025-11-22T10:00:00Z', confirmed_by: null, created_at: '2025-11-22T10:00:00Z' },

  // Lead M - Lost at offer
  { id: generateId(), lead_id: 'lead-m', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 50000, confirmed_at: '2025-11-10T10:00:00Z', confirmed_by: null, created_at: '2025-11-10T10:00:00Z' },
  { id: generateId(), lead_id: 'lead-m', from_stage: 'meeting_done', to_stage: 'waiting_access', transition_value: 50000, confirmed_at: '2025-11-13T14:00:00Z', confirmed_by: null, created_at: '2025-11-13T14:00:00Z' },
  { id: generateId(), lead_id: 'lead-m', from_stage: 'waiting_access', to_stage: 'access_received', transition_value: 50000, confirmed_at: '2025-11-17T09:00:00Z', confirmed_by: null, created_at: '2025-11-17T09:00:00Z' },
  { id: generateId(), lead_id: 'lead-m', from_stage: 'access_received', to_stage: 'preparing_offer', transition_value: 50000, confirmed_at: '2025-11-19T11:00:00Z', confirmed_by: null, created_at: '2025-11-19T11:00:00Z' },
  { id: generateId(), lead_id: 'lead-m', from_stage: 'preparing_offer', to_stage: 'offer_sent', transition_value: 50000, confirmed_at: '2025-11-22T15:00:00Z', confirmed_by: null, created_at: '2025-11-22T15:00:00Z' },

  // ===== PROSINEC 2025 =====
  // Lead N - Won
  { id: generateId(), lead_id: 'lead-n', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 110000, confirmed_at: '2025-12-02T10:00:00Z', confirmed_by: null, created_at: '2025-12-02T10:00:00Z' },
  { id: generateId(), lead_id: 'lead-n', from_stage: 'meeting_done', to_stage: 'waiting_access', transition_value: 110000, confirmed_at: '2025-12-05T11:00:00Z', confirmed_by: null, created_at: '2025-12-05T11:00:00Z' },
  { id: generateId(), lead_id: 'lead-n', from_stage: 'waiting_access', to_stage: 'access_received', transition_value: 110000, confirmed_at: '2025-12-09T14:00:00Z', confirmed_by: null, created_at: '2025-12-09T14:00:00Z' },
  { id: generateId(), lead_id: 'lead-n', from_stage: 'access_received', to_stage: 'preparing_offer', transition_value: 110000, confirmed_at: '2025-12-11T10:00:00Z', confirmed_by: null, created_at: '2025-12-11T10:00:00Z' },
  { id: generateId(), lead_id: 'lead-n', from_stage: 'preparing_offer', to_stage: 'offer_sent', transition_value: 110000, confirmed_at: '2025-12-13T16:00:00Z', confirmed_by: null, created_at: '2025-12-13T16:00:00Z' },
  { id: generateId(), lead_id: 'lead-n', from_stage: 'offer_sent', to_stage: 'won', transition_value: 110000, confirmed_at: '2025-12-19T10:00:00Z', confirmed_by: null, created_at: '2025-12-19T10:00:00Z' },

  // Lead O - Lost at offer
  { id: generateId(), lead_id: 'lead-o', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 70000, confirmed_at: '2025-12-06T09:00:00Z', confirmed_by: null, created_at: '2025-12-06T09:00:00Z' },
  { id: generateId(), lead_id: 'lead-o', from_stage: 'meeting_done', to_stage: 'waiting_access', transition_value: 70000, confirmed_at: '2025-12-10T14:00:00Z', confirmed_by: null, created_at: '2025-12-10T14:00:00Z' },
  { id: generateId(), lead_id: 'lead-o', from_stage: 'waiting_access', to_stage: 'access_received', transition_value: 70000, confirmed_at: '2025-12-14T10:00:00Z', confirmed_by: null, created_at: '2025-12-14T10:00:00Z' },
  { id: generateId(), lead_id: 'lead-o', from_stage: 'access_received', to_stage: 'preparing_offer', transition_value: 70000, confirmed_at: '2025-12-17T11:00:00Z', confirmed_by: null, created_at: '2025-12-17T11:00:00Z' },
  { id: generateId(), lead_id: 'lead-o', from_stage: 'preparing_offer', to_stage: 'offer_sent', transition_value: 70000, confirmed_at: '2025-12-19T15:00:00Z', confirmed_by: null, created_at: '2025-12-19T15:00:00Z' },

  // Lead P - Won
  { id: generateId(), lead_id: 'lead-p', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 55000, confirmed_at: '2025-12-10T10:00:00Z', confirmed_by: null, created_at: '2025-12-10T10:00:00Z' },
  { id: generateId(), lead_id: 'lead-p', from_stage: 'meeting_done', to_stage: 'waiting_access', transition_value: 55000, confirmed_at: '2025-12-13T11:00:00Z', confirmed_by: null, created_at: '2025-12-13T11:00:00Z' },
  { id: generateId(), lead_id: 'lead-p', from_stage: 'waiting_access', to_stage: 'access_received', transition_value: 55000, confirmed_at: '2025-12-17T14:00:00Z', confirmed_by: null, created_at: '2025-12-17T14:00:00Z' },
  { id: generateId(), lead_id: 'lead-p', from_stage: 'access_received', to_stage: 'preparing_offer', transition_value: 55000, confirmed_at: '2025-12-19T09:00:00Z', confirmed_by: null, created_at: '2025-12-19T09:00:00Z' },
  { id: generateId(), lead_id: 'lead-p', from_stage: 'preparing_offer', to_stage: 'offer_sent', transition_value: 55000, confirmed_at: '2025-12-21T16:00:00Z', confirmed_by: null, created_at: '2025-12-21T16:00:00Z' },
  { id: generateId(), lead_id: 'lead-p', from_stage: 'offer_sent', to_stage: 'won', transition_value: 55000, confirmed_at: '2025-12-28T10:00:00Z', confirmed_by: null, created_at: '2025-12-28T10:00:00Z' },

  // ===== LEDEN 2026 =====
  // Lead Q - Won (current month)
  { id: generateId(), lead_id: 'lead-q', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 90000, confirmed_at: '2026-01-06T10:00:00Z', confirmed_by: null, created_at: '2026-01-06T10:00:00Z' },
  { id: generateId(), lead_id: 'lead-q', from_stage: 'meeting_done', to_stage: 'waiting_access', transition_value: 90000, confirmed_at: '2026-01-09T11:00:00Z', confirmed_by: null, created_at: '2026-01-09T11:00:00Z' },
  { id: generateId(), lead_id: 'lead-q', from_stage: 'waiting_access', to_stage: 'access_received', transition_value: 90000, confirmed_at: '2026-01-13T14:00:00Z', confirmed_by: null, created_at: '2026-01-13T14:00:00Z' },
  { id: generateId(), lead_id: 'lead-q', from_stage: 'access_received', to_stage: 'preparing_offer', transition_value: 90000, confirmed_at: '2026-01-15T10:00:00Z', confirmed_by: null, created_at: '2026-01-15T10:00:00Z' },
  { id: generateId(), lead_id: 'lead-q', from_stage: 'preparing_offer', to_stage: 'offer_sent', transition_value: 90000, confirmed_at: '2026-01-17T16:00:00Z', confirmed_by: null, created_at: '2026-01-17T16:00:00Z' },
  { id: generateId(), lead_id: 'lead-q', from_stage: 'offer_sent', to_stage: 'won', transition_value: 90000, confirmed_at: '2026-01-23T10:00:00Z', confirmed_by: null, created_at: '2026-01-23T10:00:00Z' },

  // Lead R - In progress (at offer_sent)
  { id: generateId(), lead_id: 'lead-r', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 65000, confirmed_at: '2026-01-10T09:00:00Z', confirmed_by: null, created_at: '2026-01-10T09:00:00Z' },
  { id: generateId(), lead_id: 'lead-r', from_stage: 'meeting_done', to_stage: 'waiting_access', transition_value: 65000, confirmed_at: '2026-01-14T14:00:00Z', confirmed_by: null, created_at: '2026-01-14T14:00:00Z' },
  { id: generateId(), lead_id: 'lead-r', from_stage: 'waiting_access', to_stage: 'access_received', transition_value: 65000, confirmed_at: '2026-01-18T10:00:00Z', confirmed_by: null, created_at: '2026-01-18T10:00:00Z' },
  { id: generateId(), lead_id: 'lead-r', from_stage: 'access_received', to_stage: 'preparing_offer', transition_value: 65000, confirmed_at: '2026-01-20T11:00:00Z', confirmed_by: null, created_at: '2026-01-20T11:00:00Z' },
  { id: generateId(), lead_id: 'lead-r', from_stage: 'preparing_offer', to_stage: 'offer_sent', transition_value: 65000, confirmed_at: '2026-01-24T15:00:00Z', confirmed_by: null, created_at: '2026-01-24T15:00:00Z' },

  // Lead S - In progress (at meeting)
  { id: generateId(), lead_id: 'lead-s', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 42000, confirmed_at: '2026-01-20T10:00:00Z', confirmed_by: null, created_at: '2026-01-20T10:00:00Z' },
];

export const STORAGE_KEY = 'lead-stage-transitions';

// Initialize localStorage with mock data if empty
export function initializeTransitions(): MockTransition[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_TRANSITIONS));
    return MOCK_TRANSITIONS;
  }
  
  try {
    return JSON.parse(stored) as MockTransition[];
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_TRANSITIONS));
    return MOCK_TRANSITIONS;
  }
}

// Add a new transition to localStorage
export function addTransition(transition: Omit<MockTransition, 'id' | 'created_at'>): MockTransition {
  const transitions = initializeTransitions();
  
  const newTransition: MockTransition = {
    ...transition,
    id: generateId(),
    created_at: new Date().toISOString(),
  };
  
  transitions.unshift(newTransition);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transitions));
  
  return newTransition;
}
