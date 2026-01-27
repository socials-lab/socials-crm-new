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
// Reality: ~30% of leads are qualified (get to meeting), ~70% are bad fit
// Of qualified leads: ~70% get to offer, ~50% of those win
// Overall conversion from new lead to won: ~10% or less
export const MOCK_TRANSITIONS: MockTransition[] = [
  // ===== SRPEN 2025 =====
  // 10 new leads entered, 3 qualified (30%), 2 won
  
  // Lead A1 - Full journey to won (qualified)
  { id: generateId(), lead_id: 'lead-a1', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 65000, confirmed_at: '2025-08-02T10:00:00Z', confirmed_by: null, created_at: '2025-08-02T10:00:00Z' },
  { id: generateId(), lead_id: 'lead-a1', from_stage: 'meeting_done', to_stage: 'waiting_access', transition_value: 65000, confirmed_at: '2025-08-05T14:00:00Z', confirmed_by: null, created_at: '2025-08-05T14:00:00Z' },
  { id: generateId(), lead_id: 'lead-a1', from_stage: 'waiting_access', to_stage: 'access_received', transition_value: 65000, confirmed_at: '2025-08-08T09:00:00Z', confirmed_by: null, created_at: '2025-08-08T09:00:00Z' },
  { id: generateId(), lead_id: 'lead-a1', from_stage: 'access_received', to_stage: 'preparing_offer', transition_value: 65000, confirmed_at: '2025-08-10T11:00:00Z', confirmed_by: null, created_at: '2025-08-10T11:00:00Z' },
  { id: generateId(), lead_id: 'lead-a1', from_stage: 'preparing_offer', to_stage: 'offer_sent', transition_value: 65000, confirmed_at: '2025-08-12T16:00:00Z', confirmed_by: null, created_at: '2025-08-12T16:00:00Z' },
  { id: generateId(), lead_id: 'lead-a1', from_stage: 'offer_sent', to_stage: 'won', transition_value: 65000, confirmed_at: '2025-08-18T10:00:00Z', confirmed_by: null, created_at: '2025-08-18T10:00:00Z' },
  
  // Lead A2 - Full journey to won (qualified)
  { id: generateId(), lead_id: 'lead-a2', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 45000, confirmed_at: '2025-08-04T11:00:00Z', confirmed_by: null, created_at: '2025-08-04T11:00:00Z' },
  { id: generateId(), lead_id: 'lead-a2', from_stage: 'meeting_done', to_stage: 'waiting_access', transition_value: 45000, confirmed_at: '2025-08-07T10:00:00Z', confirmed_by: null, created_at: '2025-08-07T10:00:00Z' },
  { id: generateId(), lead_id: 'lead-a2', from_stage: 'waiting_access', to_stage: 'access_received', transition_value: 45000, confirmed_at: '2025-08-11T15:00:00Z', confirmed_by: null, created_at: '2025-08-11T15:00:00Z' },
  { id: generateId(), lead_id: 'lead-a2', from_stage: 'access_received', to_stage: 'preparing_offer', transition_value: 45000, confirmed_at: '2025-08-13T09:00:00Z', confirmed_by: null, created_at: '2025-08-13T09:00:00Z' },
  { id: generateId(), lead_id: 'lead-a2', from_stage: 'preparing_offer', to_stage: 'offer_sent', transition_value: 45000, confirmed_at: '2025-08-15T14:00:00Z', confirmed_by: null, created_at: '2025-08-15T14:00:00Z' },
  { id: generateId(), lead_id: 'lead-a2', from_stage: 'offer_sent', to_stage: 'won', transition_value: 45000, confirmed_at: '2025-08-22T11:00:00Z', confirmed_by: null, created_at: '2025-08-22T11:00:00Z' },

  // Lead A3 - Lost at offer_sent (qualified but didn't close)
  { id: generateId(), lead_id: 'lead-a3', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 80000, confirmed_at: '2025-08-08T09:00:00Z', confirmed_by: null, created_at: '2025-08-08T09:00:00Z' },
  { id: generateId(), lead_id: 'lead-a3', from_stage: 'meeting_done', to_stage: 'waiting_access', transition_value: 80000, confirmed_at: '2025-08-12T11:00:00Z', confirmed_by: null, created_at: '2025-08-12T11:00:00Z' },
  { id: generateId(), lead_id: 'lead-a3', from_stage: 'waiting_access', to_stage: 'access_received', transition_value: 80000, confirmed_at: '2025-08-16T10:00:00Z', confirmed_by: null, created_at: '2025-08-16T10:00:00Z' },
  { id: generateId(), lead_id: 'lead-a3', from_stage: 'access_received', to_stage: 'preparing_offer', transition_value: 80000, confirmed_at: '2025-08-18T15:00:00Z', confirmed_by: null, created_at: '2025-08-18T15:00:00Z' },
  { id: generateId(), lead_id: 'lead-a3', from_stage: 'preparing_offer', to_stage: 'offer_sent', transition_value: 80000, confirmed_at: '2025-08-20T14:00:00Z', confirmed_by: null, created_at: '2025-08-20T14:00:00Z' },

  // ===== ZÁŘÍ 2025 =====
  // 12 new leads entered, 4 qualified (33%), 2 won
  
  // Lead B1 - Full journey to won
  { id: generateId(), lead_id: 'lead-b1', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 120000, confirmed_at: '2025-09-02T09:00:00Z', confirmed_by: null, created_at: '2025-09-02T09:00:00Z' },
  { id: generateId(), lead_id: 'lead-b1', from_stage: 'meeting_done', to_stage: 'waiting_access', transition_value: 120000, confirmed_at: '2025-09-05T11:00:00Z', confirmed_by: null, created_at: '2025-09-05T11:00:00Z' },
  { id: generateId(), lead_id: 'lead-b1', from_stage: 'waiting_access', to_stage: 'access_received', transition_value: 120000, confirmed_at: '2025-09-09T14:00:00Z', confirmed_by: null, created_at: '2025-09-09T14:00:00Z' },
  { id: generateId(), lead_id: 'lead-b1', from_stage: 'access_received', to_stage: 'preparing_offer', transition_value: 120000, confirmed_at: '2025-09-11T10:00:00Z', confirmed_by: null, created_at: '2025-09-11T10:00:00Z' },
  { id: generateId(), lead_id: 'lead-b1', from_stage: 'preparing_offer', to_stage: 'offer_sent', transition_value: 120000, confirmed_at: '2025-09-14T16:00:00Z', confirmed_by: null, created_at: '2025-09-14T16:00:00Z' },
  { id: generateId(), lead_id: 'lead-b1', from_stage: 'offer_sent', to_stage: 'won', transition_value: 120000, confirmed_at: '2025-09-20T10:00:00Z', confirmed_by: null, created_at: '2025-09-20T10:00:00Z' },

  // Lead B2 - Lost at offer_sent
  { id: generateId(), lead_id: 'lead-b2', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 55000, confirmed_at: '2025-09-05T10:00:00Z', confirmed_by: null, created_at: '2025-09-05T10:00:00Z' },
  { id: generateId(), lead_id: 'lead-b2', from_stage: 'meeting_done', to_stage: 'waiting_access', transition_value: 55000, confirmed_at: '2025-09-08T14:00:00Z', confirmed_by: null, created_at: '2025-09-08T14:00:00Z' },
  { id: generateId(), lead_id: 'lead-b2', from_stage: 'waiting_access', to_stage: 'access_received', transition_value: 55000, confirmed_at: '2025-09-12T09:00:00Z', confirmed_by: null, created_at: '2025-09-12T09:00:00Z' },
  { id: generateId(), lead_id: 'lead-b2', from_stage: 'access_received', to_stage: 'preparing_offer', transition_value: 55000, confirmed_at: '2025-09-15T11:00:00Z', confirmed_by: null, created_at: '2025-09-15T11:00:00Z' },
  { id: generateId(), lead_id: 'lead-b2', from_stage: 'preparing_offer', to_stage: 'offer_sent', transition_value: 55000, confirmed_at: '2025-09-18T15:00:00Z', confirmed_by: null, created_at: '2025-09-18T15:00:00Z' },

  // Lead B3 - Lost at waiting_access
  { id: generateId(), lead_id: 'lead-b3', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 40000, confirmed_at: '2025-09-10T11:00:00Z', confirmed_by: null, created_at: '2025-09-10T11:00:00Z' },
  { id: generateId(), lead_id: 'lead-b3', from_stage: 'meeting_done', to_stage: 'waiting_access', transition_value: 40000, confirmed_at: '2025-09-14T10:00:00Z', confirmed_by: null, created_at: '2025-09-14T10:00:00Z' },

  // Lead B4 - Won
  { id: generateId(), lead_id: 'lead-b4', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 75000, confirmed_at: '2025-09-12T14:00:00Z', confirmed_by: null, created_at: '2025-09-12T14:00:00Z' },
  { id: generateId(), lead_id: 'lead-b4', from_stage: 'meeting_done', to_stage: 'waiting_access', transition_value: 75000, confirmed_at: '2025-09-16T09:00:00Z', confirmed_by: null, created_at: '2025-09-16T09:00:00Z' },
  { id: generateId(), lead_id: 'lead-b4', from_stage: 'waiting_access', to_stage: 'access_received', transition_value: 75000, confirmed_at: '2025-09-19T11:00:00Z', confirmed_by: null, created_at: '2025-09-19T11:00:00Z' },
  { id: generateId(), lead_id: 'lead-b4', from_stage: 'access_received', to_stage: 'preparing_offer', transition_value: 75000, confirmed_at: '2025-09-22T15:00:00Z', confirmed_by: null, created_at: '2025-09-22T15:00:00Z' },
  { id: generateId(), lead_id: 'lead-b4', from_stage: 'preparing_offer', to_stage: 'offer_sent', transition_value: 75000, confirmed_at: '2025-09-24T10:00:00Z', confirmed_by: null, created_at: '2025-09-24T10:00:00Z' },
  { id: generateId(), lead_id: 'lead-b4', from_stage: 'offer_sent', to_stage: 'won', transition_value: 75000, confirmed_at: '2025-09-28T14:00:00Z', confirmed_by: null, created_at: '2025-09-28T14:00:00Z' },

  // ===== ŘÍJEN 2025 =====
  // 8 new leads entered, 3 qualified (37%), 1 won
  
  // Lead C1 - Won
  { id: generateId(), lead_id: 'lead-c1', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 95000, confirmed_at: '2025-10-03T10:00:00Z', confirmed_by: null, created_at: '2025-10-03T10:00:00Z' },
  { id: generateId(), lead_id: 'lead-c1', from_stage: 'meeting_done', to_stage: 'waiting_access', transition_value: 95000, confirmed_at: '2025-10-07T11:00:00Z', confirmed_by: null, created_at: '2025-10-07T11:00:00Z' },
  { id: generateId(), lead_id: 'lead-c1', from_stage: 'waiting_access', to_stage: 'access_received', transition_value: 95000, confirmed_at: '2025-10-10T14:00:00Z', confirmed_by: null, created_at: '2025-10-10T14:00:00Z' },
  { id: generateId(), lead_id: 'lead-c1', from_stage: 'access_received', to_stage: 'preparing_offer', transition_value: 95000, confirmed_at: '2025-10-13T09:00:00Z', confirmed_by: null, created_at: '2025-10-13T09:00:00Z' },
  { id: generateId(), lead_id: 'lead-c1', from_stage: 'preparing_offer', to_stage: 'offer_sent', transition_value: 95000, confirmed_at: '2025-10-15T16:00:00Z', confirmed_by: null, created_at: '2025-10-15T16:00:00Z' },
  { id: generateId(), lead_id: 'lead-c1', from_stage: 'offer_sent', to_stage: 'won', transition_value: 95000, confirmed_at: '2025-10-22T10:00:00Z', confirmed_by: null, created_at: '2025-10-22T10:00:00Z' },

  // Lead C2 - Lost at offer
  { id: generateId(), lead_id: 'lead-c2', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 60000, confirmed_at: '2025-10-08T09:00:00Z', confirmed_by: null, created_at: '2025-10-08T09:00:00Z' },
  { id: generateId(), lead_id: 'lead-c2', from_stage: 'meeting_done', to_stage: 'waiting_access', transition_value: 60000, confirmed_at: '2025-10-11T14:00:00Z', confirmed_by: null, created_at: '2025-10-11T14:00:00Z' },
  { id: generateId(), lead_id: 'lead-c2', from_stage: 'waiting_access', to_stage: 'access_received', transition_value: 60000, confirmed_at: '2025-10-15T10:00:00Z', confirmed_by: null, created_at: '2025-10-15T10:00:00Z' },
  { id: generateId(), lead_id: 'lead-c2', from_stage: 'access_received', to_stage: 'preparing_offer', transition_value: 60000, confirmed_at: '2025-10-18T11:00:00Z', confirmed_by: null, created_at: '2025-10-18T11:00:00Z' },
  { id: generateId(), lead_id: 'lead-c2', from_stage: 'preparing_offer', to_stage: 'offer_sent', transition_value: 60000, confirmed_at: '2025-10-21T15:00:00Z', confirmed_by: null, created_at: '2025-10-21T15:00:00Z' },

  // Lead C3 - Lost at meeting
  { id: generateId(), lead_id: 'lead-c3', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 30000, confirmed_at: '2025-10-14T10:00:00Z', confirmed_by: null, created_at: '2025-10-14T10:00:00Z' },

  // ===== LISTOPAD 2025 =====
  // 9 new leads entered, 3 qualified (33%), 1 won
  
  // Lead D1 - Won
  { id: generateId(), lead_id: 'lead-d1', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 85000, confirmed_at: '2025-11-04T09:00:00Z', confirmed_by: null, created_at: '2025-11-04T09:00:00Z' },
  { id: generateId(), lead_id: 'lead-d1', from_stage: 'meeting_done', to_stage: 'waiting_access', transition_value: 85000, confirmed_at: '2025-11-07T11:00:00Z', confirmed_by: null, created_at: '2025-11-07T11:00:00Z' },
  { id: generateId(), lead_id: 'lead-d1', from_stage: 'waiting_access', to_stage: 'access_received', transition_value: 85000, confirmed_at: '2025-11-11T14:00:00Z', confirmed_by: null, created_at: '2025-11-11T14:00:00Z' },
  { id: generateId(), lead_id: 'lead-d1', from_stage: 'access_received', to_stage: 'preparing_offer', transition_value: 85000, confirmed_at: '2025-11-13T10:00:00Z', confirmed_by: null, created_at: '2025-11-13T10:00:00Z' },
  { id: generateId(), lead_id: 'lead-d1', from_stage: 'preparing_offer', to_stage: 'offer_sent', transition_value: 85000, confirmed_at: '2025-11-16T16:00:00Z', confirmed_by: null, created_at: '2025-11-16T16:00:00Z' },
  { id: generateId(), lead_id: 'lead-d1', from_stage: 'offer_sent', to_stage: 'won', transition_value: 85000, confirmed_at: '2025-11-22T10:00:00Z', confirmed_by: null, created_at: '2025-11-22T10:00:00Z' },

  // Lead D2 - Lost at offer
  { id: generateId(), lead_id: 'lead-d2', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 50000, confirmed_at: '2025-11-10T10:00:00Z', confirmed_by: null, created_at: '2025-11-10T10:00:00Z' },
  { id: generateId(), lead_id: 'lead-d2', from_stage: 'meeting_done', to_stage: 'waiting_access', transition_value: 50000, confirmed_at: '2025-11-13T14:00:00Z', confirmed_by: null, created_at: '2025-11-13T14:00:00Z' },
  { id: generateId(), lead_id: 'lead-d2', from_stage: 'waiting_access', to_stage: 'access_received', transition_value: 50000, confirmed_at: '2025-11-17T09:00:00Z', confirmed_by: null, created_at: '2025-11-17T09:00:00Z' },
  { id: generateId(), lead_id: 'lead-d2', from_stage: 'access_received', to_stage: 'preparing_offer', transition_value: 50000, confirmed_at: '2025-11-19T11:00:00Z', confirmed_by: null, created_at: '2025-11-19T11:00:00Z' },
  { id: generateId(), lead_id: 'lead-d2', from_stage: 'preparing_offer', to_stage: 'offer_sent', transition_value: 50000, confirmed_at: '2025-11-22T15:00:00Z', confirmed_by: null, created_at: '2025-11-22T15:00:00Z' },

  // Lead D3 - Lost at meeting
  { id: generateId(), lead_id: 'lead-d3', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 35000, confirmed_at: '2025-11-18T10:00:00Z', confirmed_by: null, created_at: '2025-11-18T10:00:00Z' },

  // ===== PROSINEC 2025 =====
  // 11 new leads entered, 4 qualified (36%), 2 won
  
  // Lead E1 - Won
  { id: generateId(), lead_id: 'lead-e1', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 110000, confirmed_at: '2025-12-02T10:00:00Z', confirmed_by: null, created_at: '2025-12-02T10:00:00Z' },
  { id: generateId(), lead_id: 'lead-e1', from_stage: 'meeting_done', to_stage: 'waiting_access', transition_value: 110000, confirmed_at: '2025-12-05T11:00:00Z', confirmed_by: null, created_at: '2025-12-05T11:00:00Z' },
  { id: generateId(), lead_id: 'lead-e1', from_stage: 'waiting_access', to_stage: 'access_received', transition_value: 110000, confirmed_at: '2025-12-09T14:00:00Z', confirmed_by: null, created_at: '2025-12-09T14:00:00Z' },
  { id: generateId(), lead_id: 'lead-e1', from_stage: 'access_received', to_stage: 'preparing_offer', transition_value: 110000, confirmed_at: '2025-12-11T10:00:00Z', confirmed_by: null, created_at: '2025-12-11T10:00:00Z' },
  { id: generateId(), lead_id: 'lead-e1', from_stage: 'preparing_offer', to_stage: 'offer_sent', transition_value: 110000, confirmed_at: '2025-12-13T16:00:00Z', confirmed_by: null, created_at: '2025-12-13T16:00:00Z' },
  { id: generateId(), lead_id: 'lead-e1', from_stage: 'offer_sent', to_stage: 'won', transition_value: 110000, confirmed_at: '2025-12-19T10:00:00Z', confirmed_by: null, created_at: '2025-12-19T10:00:00Z' },

  // Lead E2 - Lost at offer
  { id: generateId(), lead_id: 'lead-e2', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 70000, confirmed_at: '2025-12-06T09:00:00Z', confirmed_by: null, created_at: '2025-12-06T09:00:00Z' },
  { id: generateId(), lead_id: 'lead-e2', from_stage: 'meeting_done', to_stage: 'waiting_access', transition_value: 70000, confirmed_at: '2025-12-10T14:00:00Z', confirmed_by: null, created_at: '2025-12-10T14:00:00Z' },
  { id: generateId(), lead_id: 'lead-e2', from_stage: 'waiting_access', to_stage: 'access_received', transition_value: 70000, confirmed_at: '2025-12-14T10:00:00Z', confirmed_by: null, created_at: '2025-12-14T10:00:00Z' },
  { id: generateId(), lead_id: 'lead-e2', from_stage: 'access_received', to_stage: 'preparing_offer', transition_value: 70000, confirmed_at: '2025-12-17T11:00:00Z', confirmed_by: null, created_at: '2025-12-17T11:00:00Z' },
  { id: generateId(), lead_id: 'lead-e2', from_stage: 'preparing_offer', to_stage: 'offer_sent', transition_value: 70000, confirmed_at: '2025-12-19T15:00:00Z', confirmed_by: null, created_at: '2025-12-19T15:00:00Z' },

  // Lead E3 - Won
  { id: generateId(), lead_id: 'lead-e3', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 55000, confirmed_at: '2025-12-10T10:00:00Z', confirmed_by: null, created_at: '2025-12-10T10:00:00Z' },
  { id: generateId(), lead_id: 'lead-e3', from_stage: 'meeting_done', to_stage: 'waiting_access', transition_value: 55000, confirmed_at: '2025-12-13T11:00:00Z', confirmed_by: null, created_at: '2025-12-13T11:00:00Z' },
  { id: generateId(), lead_id: 'lead-e3', from_stage: 'waiting_access', to_stage: 'access_received', transition_value: 55000, confirmed_at: '2025-12-17T14:00:00Z', confirmed_by: null, created_at: '2025-12-17T14:00:00Z' },
  { id: generateId(), lead_id: 'lead-e3', from_stage: 'access_received', to_stage: 'preparing_offer', transition_value: 55000, confirmed_at: '2025-12-19T09:00:00Z', confirmed_by: null, created_at: '2025-12-19T09:00:00Z' },
  { id: generateId(), lead_id: 'lead-e3', from_stage: 'preparing_offer', to_stage: 'offer_sent', transition_value: 55000, confirmed_at: '2025-12-21T16:00:00Z', confirmed_by: null, created_at: '2025-12-21T16:00:00Z' },
  { id: generateId(), lead_id: 'lead-e3', from_stage: 'offer_sent', to_stage: 'won', transition_value: 55000, confirmed_at: '2025-12-28T10:00:00Z', confirmed_by: null, created_at: '2025-12-28T10:00:00Z' },

  // Lead E4 - Lost at meeting
  { id: generateId(), lead_id: 'lead-e4', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 42000, confirmed_at: '2025-12-15T10:00:00Z', confirmed_by: null, created_at: '2025-12-15T10:00:00Z' },

  // ===== LEDEN 2026 =====
  // 10 new leads entered, 3 qualified (30%), 1 won so far
  
  // Lead F1 - Won (current month)
  { id: generateId(), lead_id: 'lead-f1', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 90000, confirmed_at: '2026-01-06T10:00:00Z', confirmed_by: null, created_at: '2026-01-06T10:00:00Z' },
  { id: generateId(), lead_id: 'lead-f1', from_stage: 'meeting_done', to_stage: 'waiting_access', transition_value: 90000, confirmed_at: '2026-01-09T11:00:00Z', confirmed_by: null, created_at: '2026-01-09T11:00:00Z' },
  { id: generateId(), lead_id: 'lead-f1', from_stage: 'waiting_access', to_stage: 'access_received', transition_value: 90000, confirmed_at: '2026-01-13T14:00:00Z', confirmed_by: null, created_at: '2026-01-13T14:00:00Z' },
  { id: generateId(), lead_id: 'lead-f1', from_stage: 'access_received', to_stage: 'preparing_offer', transition_value: 90000, confirmed_at: '2026-01-15T10:00:00Z', confirmed_by: null, created_at: '2026-01-15T10:00:00Z' },
  { id: generateId(), lead_id: 'lead-f1', from_stage: 'preparing_offer', to_stage: 'offer_sent', transition_value: 90000, confirmed_at: '2026-01-17T16:00:00Z', confirmed_by: null, created_at: '2026-01-17T16:00:00Z' },
  { id: generateId(), lead_id: 'lead-f1', from_stage: 'offer_sent', to_stage: 'won', transition_value: 90000, confirmed_at: '2026-01-23T10:00:00Z', confirmed_by: null, created_at: '2026-01-23T10:00:00Z' },

  // Lead F2 - In progress (at offer_sent)
  { id: generateId(), lead_id: 'lead-f2', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 65000, confirmed_at: '2026-01-10T09:00:00Z', confirmed_by: null, created_at: '2026-01-10T09:00:00Z' },
  { id: generateId(), lead_id: 'lead-f2', from_stage: 'meeting_done', to_stage: 'waiting_access', transition_value: 65000, confirmed_at: '2026-01-14T14:00:00Z', confirmed_by: null, created_at: '2026-01-14T14:00:00Z' },
  { id: generateId(), lead_id: 'lead-f2', from_stage: 'waiting_access', to_stage: 'access_received', transition_value: 65000, confirmed_at: '2026-01-18T10:00:00Z', confirmed_by: null, created_at: '2026-01-18T10:00:00Z' },
  { id: generateId(), lead_id: 'lead-f2', from_stage: 'access_received', to_stage: 'preparing_offer', transition_value: 65000, confirmed_at: '2026-01-20T11:00:00Z', confirmed_by: null, created_at: '2026-01-20T11:00:00Z' },
  { id: generateId(), lead_id: 'lead-f2', from_stage: 'preparing_offer', to_stage: 'offer_sent', transition_value: 65000, confirmed_at: '2026-01-24T15:00:00Z', confirmed_by: null, created_at: '2026-01-24T15:00:00Z' },

  // Lead F3 - In progress (at meeting)
  { id: generateId(), lead_id: 'lead-f3', from_stage: 'new_lead', to_stage: 'meeting_done', transition_value: 42000, confirmed_at: '2026-01-20T10:00:00Z', confirmed_by: null, created_at: '2026-01-20T10:00:00Z' },
];

// Separate tracking for total new leads (including bad fits that never got meeting)
// This represents the full picture: many leads never even get to a meeting
export interface NewLeadEntry {
  id: string;
  lead_id: string;
  entered_at: string;
  value: number;
  is_qualified: boolean; // Did they get to meeting_done?
}

// Mock new lead entries - represents ALL leads that came in (including bad fits)
// ~30% are qualified, ~70% are bad fit (never get to meeting)
export const MOCK_NEW_LEAD_ENTRIES: NewLeadEntry[] = [
  // August 2025: 10 new leads, 3 qualified (30%)
  { id: generateId(), lead_id: 'lead-a1', entered_at: '2025-08-01T09:00:00Z', value: 65000, is_qualified: true },
  { id: generateId(), lead_id: 'lead-a2', entered_at: '2025-08-03T10:00:00Z', value: 45000, is_qualified: true },
  { id: generateId(), lead_id: 'lead-a3', entered_at: '2025-08-06T11:00:00Z', value: 80000, is_qualified: true },
  { id: generateId(), lead_id: 'lead-bad-a1', entered_at: '2025-08-04T14:00:00Z', value: 15000, is_qualified: false },
  { id: generateId(), lead_id: 'lead-bad-a2', entered_at: '2025-08-07T09:00:00Z', value: 20000, is_qualified: false },
  { id: generateId(), lead_id: 'lead-bad-a3', entered_at: '2025-08-10T16:00:00Z', value: 10000, is_qualified: false },
  { id: generateId(), lead_id: 'lead-bad-a4', entered_at: '2025-08-12T11:00:00Z', value: 25000, is_qualified: false },
  { id: generateId(), lead_id: 'lead-bad-a5', entered_at: '2025-08-18T10:00:00Z', value: 18000, is_qualified: false },
  { id: generateId(), lead_id: 'lead-bad-a6', entered_at: '2025-08-22T14:00:00Z', value: 12000, is_qualified: false },
  { id: generateId(), lead_id: 'lead-bad-a7', entered_at: '2025-08-28T09:00:00Z', value: 8000, is_qualified: false },

  // September 2025: 12 new leads, 4 qualified (33%)
  { id: generateId(), lead_id: 'lead-b1', entered_at: '2025-09-01T09:00:00Z', value: 120000, is_qualified: true },
  { id: generateId(), lead_id: 'lead-b2', entered_at: '2025-09-04T10:00:00Z', value: 55000, is_qualified: true },
  { id: generateId(), lead_id: 'lead-b3', entered_at: '2025-09-08T11:00:00Z', value: 40000, is_qualified: true },
  { id: generateId(), lead_id: 'lead-b4', entered_at: '2025-09-11T14:00:00Z', value: 75000, is_qualified: true },
  { id: generateId(), lead_id: 'lead-bad-b1', entered_at: '2025-09-02T14:00:00Z', value: 15000, is_qualified: false },
  { id: generateId(), lead_id: 'lead-bad-b2', entered_at: '2025-09-06T09:00:00Z', value: 22000, is_qualified: false },
  { id: generateId(), lead_id: 'lead-bad-b3', entered_at: '2025-09-10T16:00:00Z', value: 9000, is_qualified: false },
  { id: generateId(), lead_id: 'lead-bad-b4', entered_at: '2025-09-15T11:00:00Z', value: 18000, is_qualified: false },
  { id: generateId(), lead_id: 'lead-bad-b5', entered_at: '2025-09-19T10:00:00Z', value: 14000, is_qualified: false },
  { id: generateId(), lead_id: 'lead-bad-b6', entered_at: '2025-09-22T14:00:00Z', value: 11000, is_qualified: false },
  { id: generateId(), lead_id: 'lead-bad-b7', entered_at: '2025-09-25T09:00:00Z', value: 7000, is_qualified: false },
  { id: generateId(), lead_id: 'lead-bad-b8', entered_at: '2025-09-28T16:00:00Z', value: 13000, is_qualified: false },

  // October 2025: 8 new leads, 3 qualified (37%)
  { id: generateId(), lead_id: 'lead-c1', entered_at: '2025-10-02T09:00:00Z', value: 95000, is_qualified: true },
  { id: generateId(), lead_id: 'lead-c2', entered_at: '2025-10-06T10:00:00Z', value: 60000, is_qualified: true },
  { id: generateId(), lead_id: 'lead-c3', entered_at: '2025-10-12T11:00:00Z', value: 30000, is_qualified: true },
  { id: generateId(), lead_id: 'lead-bad-c1', entered_at: '2025-10-04T14:00:00Z', value: 16000, is_qualified: false },
  { id: generateId(), lead_id: 'lead-bad-c2', entered_at: '2025-10-09T09:00:00Z', value: 19000, is_qualified: false },
  { id: generateId(), lead_id: 'lead-bad-c3', entered_at: '2025-10-16T16:00:00Z', value: 12000, is_qualified: false },
  { id: generateId(), lead_id: 'lead-bad-c4', entered_at: '2025-10-22T11:00:00Z', value: 8000, is_qualified: false },
  { id: generateId(), lead_id: 'lead-bad-c5', entered_at: '2025-10-28T10:00:00Z', value: 14000, is_qualified: false },

  // November 2025: 9 new leads, 3 qualified (33%)
  { id: generateId(), lead_id: 'lead-d1', entered_at: '2025-11-03T09:00:00Z', value: 85000, is_qualified: true },
  { id: generateId(), lead_id: 'lead-d2', entered_at: '2025-11-08T10:00:00Z', value: 50000, is_qualified: true },
  { id: generateId(), lead_id: 'lead-d3', entered_at: '2025-11-16T11:00:00Z', value: 35000, is_qualified: true },
  { id: generateId(), lead_id: 'lead-bad-d1', entered_at: '2025-11-02T14:00:00Z', value: 17000, is_qualified: false },
  { id: generateId(), lead_id: 'lead-bad-d2', entered_at: '2025-11-06T09:00:00Z', value: 21000, is_qualified: false },
  { id: generateId(), lead_id: 'lead-bad-d3', entered_at: '2025-11-12T16:00:00Z', value: 11000, is_qualified: false },
  { id: generateId(), lead_id: 'lead-bad-d4', entered_at: '2025-11-20T11:00:00Z', value: 9000, is_qualified: false },
  { id: generateId(), lead_id: 'lead-bad-d5', entered_at: '2025-11-24T10:00:00Z', value: 15000, is_qualified: false },
  { id: generateId(), lead_id: 'lead-bad-d6', entered_at: '2025-11-28T14:00:00Z', value: 13000, is_qualified: false },

  // December 2025: 11 new leads, 4 qualified (36%)
  { id: generateId(), lead_id: 'lead-e1', entered_at: '2025-12-01T09:00:00Z', value: 110000, is_qualified: true },
  { id: generateId(), lead_id: 'lead-e2', entered_at: '2025-12-04T10:00:00Z', value: 70000, is_qualified: true },
  { id: generateId(), lead_id: 'lead-e3', entered_at: '2025-12-08T11:00:00Z', value: 55000, is_qualified: true },
  { id: generateId(), lead_id: 'lead-e4', entered_at: '2025-12-13T14:00:00Z', value: 42000, is_qualified: true },
  { id: generateId(), lead_id: 'lead-bad-e1', entered_at: '2025-12-02T14:00:00Z', value: 16000, is_qualified: false },
  { id: generateId(), lead_id: 'lead-bad-e2', entered_at: '2025-12-06T09:00:00Z', value: 23000, is_qualified: false },
  { id: generateId(), lead_id: 'lead-bad-e3', entered_at: '2025-12-11T16:00:00Z', value: 10000, is_qualified: false },
  { id: generateId(), lead_id: 'lead-bad-e4', entered_at: '2025-12-16T11:00:00Z', value: 19000, is_qualified: false },
  { id: generateId(), lead_id: 'lead-bad-e5', entered_at: '2025-12-20T10:00:00Z', value: 14000, is_qualified: false },
  { id: generateId(), lead_id: 'lead-bad-e6', entered_at: '2025-12-24T14:00:00Z', value: 8000, is_qualified: false },
  { id: generateId(), lead_id: 'lead-bad-e7', entered_at: '2025-12-28T09:00:00Z', value: 12000, is_qualified: false },

  // January 2026: 10 new leads, 3 qualified (30%)
  { id: generateId(), lead_id: 'lead-f1', entered_at: '2026-01-05T09:00:00Z', value: 90000, is_qualified: true },
  { id: generateId(), lead_id: 'lead-f2', entered_at: '2026-01-08T10:00:00Z', value: 65000, is_qualified: true },
  { id: generateId(), lead_id: 'lead-f3', entered_at: '2026-01-18T11:00:00Z', value: 42000, is_qualified: true },
  { id: generateId(), lead_id: 'lead-bad-f1', entered_at: '2026-01-03T14:00:00Z', value: 18000, is_qualified: false },
  { id: generateId(), lead_id: 'lead-bad-f2', entered_at: '2026-01-07T09:00:00Z', value: 22000, is_qualified: false },
  { id: generateId(), lead_id: 'lead-bad-f3', entered_at: '2026-01-12T16:00:00Z', value: 9000, is_qualified: false },
  { id: generateId(), lead_id: 'lead-bad-f4', entered_at: '2026-01-16T11:00:00Z', value: 15000, is_qualified: false },
  { id: generateId(), lead_id: 'lead-bad-f5', entered_at: '2026-01-21T10:00:00Z', value: 13000, is_qualified: false },
  { id: generateId(), lead_id: 'lead-bad-f6', entered_at: '2026-01-24T14:00:00Z', value: 11000, is_qualified: false },
  { id: generateId(), lead_id: 'lead-bad-f7', entered_at: '2026-01-26T09:00:00Z', value: 7000, is_qualified: false },
];

export const STORAGE_KEY = 'lead-stage-transitions';
export const NEW_LEADS_STORAGE_KEY = 'lead-new-entries';

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

// Initialize new lead entries
export function initializeNewLeadEntries(): NewLeadEntry[] {
  const stored = localStorage.getItem(NEW_LEADS_STORAGE_KEY);
  
  if (!stored) {
    localStorage.setItem(NEW_LEADS_STORAGE_KEY, JSON.stringify(MOCK_NEW_LEAD_ENTRIES));
    return MOCK_NEW_LEAD_ENTRIES;
  }
  
  try {
    return JSON.parse(stored) as NewLeadEntry[];
  } catch {
    localStorage.setItem(NEW_LEADS_STORAGE_KEY, JSON.stringify(MOCK_NEW_LEAD_ENTRIES));
    return MOCK_NEW_LEAD_ENTRIES;
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

// Add a new lead entry
export function addNewLeadEntry(entry: Omit<NewLeadEntry, 'id'>): NewLeadEntry {
  const entries = initializeNewLeadEntries();
  
  const newEntry: NewLeadEntry = {
    ...entry,
    id: generateId(),
  };
  
  entries.unshift(newEntry);
  localStorage.setItem(NEW_LEADS_STORAGE_KEY, JSON.stringify(entries));
  
  return newEntry;
}
