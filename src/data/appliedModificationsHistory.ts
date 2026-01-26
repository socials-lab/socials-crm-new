import type { StoredModificationRequest } from './modificationRequestsMockData';

const STORAGE_KEY = 'applied_modifications_history';

export interface AppliedModificationHistory {
  id: string;
  modification_request_id: string;
  engagement_id: string;
  engagement_name: string;
  client_id: string;
  client_name: string;
  client_brand_name: string | null;
  request_type: string;
  proposed_changes: Record<string, unknown>;
  // Client confirmation details
  client_email: string | null;
  client_approved_at: string | null;
  // Application details
  applied_at: string;
  applied_by: string | null;
  // For filtering
  applied_month: string; // Format: "2024-01"
  // Original request data for reference
  effective_from: string | null;
  upsold_by_id: string | null;
  upsold_by_name: string | null;
  upsell_commission_percent: number;
  note: string | null;
}

// Get all applied modifications history
export function getAppliedModificationsHistory(): AppliedModificationHistory[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Save to localStorage
function saveHistory(history: AppliedModificationHistory[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

// Add a new applied modification to history
export function addAppliedModificationToHistory(
  request: StoredModificationRequest,
  appliedBy: string | null
): AppliedModificationHistory {
  const history = getAppliedModificationsHistory();
  const now = new Date();
  
  const newEntry: AppliedModificationHistory = {
    id: crypto.randomUUID(),
    modification_request_id: request.id,
    engagement_id: request.engagement_id,
    engagement_name: request.engagement_name,
    client_id: request.client_id,
    client_name: request.client_name,
    client_brand_name: request.client_brand_name,
    request_type: request.request_type,
    proposed_changes: request.proposed_changes as unknown as Record<string, unknown>,
    client_email: request.client_email,
    client_approved_at: request.client_approved_at,
    applied_at: now.toISOString(),
    applied_by: appliedBy,
    applied_month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    effective_from: request.effective_from,
    upsold_by_id: request.upsold_by_id,
    upsold_by_name: request.upsold_by_name,
    note: request.note,
    upsell_commission_percent: request.upsell_commission_percent,
  };
  
  history.push(newEntry);
  saveHistory(history);
  
  return newEntry;
}

// Get history for a specific engagement
export function getHistoryByEngagementId(engagementId: string): AppliedModificationHistory[] {
  const history = getAppliedModificationsHistory();
  return history.filter(h => h.engagement_id === engagementId);
}

// Get history filtered by month
export function getHistoryByMonth(month: string): AppliedModificationHistory[] {
  const history = getAppliedModificationsHistory();
  return history.filter(h => h.applied_month === month);
}

// Get available months with history
export function getAvailableMonths(): string[] {
  const history = getAppliedModificationsHistory();
  const months = new Set(history.map(h => h.applied_month));
  return Array.from(months).sort().reverse();
}

// Get history by client
export function getHistoryByClientId(clientId: string): AppliedModificationHistory[] {
  const history = getAppliedModificationsHistory();
  return history.filter(h => h.client_id === clientId);
}
