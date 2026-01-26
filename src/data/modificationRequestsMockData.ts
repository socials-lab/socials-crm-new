import type { 
  ModificationRequestType,
  ModificationRequestStatus,
  ModificationProposedChanges,
} from '@/types/crm';

const STORAGE_KEY = 'modification_requests';

// Simplified interface for localStorage storage
export interface StoredModificationRequest {
  id: string;
  engagement_id: string;
  request_type: ModificationRequestType;
  status: ModificationRequestStatus;
  proposed_changes: ModificationProposedChanges;
  engagement_service_id: string | null;
  engagement_assignment_id: string | null;
  effective_from: string | null;
  upsold_by_id: string | null;
  upsell_commission_percent: number;
  requested_by: string | null;
  requested_at: string;
  note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  upgrade_offer_token: string | null;
  upgrade_offer_valid_until: string | null;
  client_email: string | null;
  client_approved_at: string | null;
  created_at: string;
  updated_at: string;
  // Denormalized data for display
  engagement_name: string;
  client_id: string;
  client_name: string;
  client_brand_name: string | null;
  upsold_by_name: string | null;
}

// Generate unique token
function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Get all requests from localStorage
export function getModificationRequests(): StoredModificationRequest[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Save requests to localStorage
function saveRequests(requests: StoredModificationRequest[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

// Create a new modification request
export function createModificationRequest(params: {
  engagement_id: string;
  engagement_name: string;
  client_id: string;
  client_name: string;
  client_brand_name?: string;
  request_type: ModificationRequestType;
  proposed_changes: ModificationProposedChanges;
  engagement_service_id?: string | null;
  engagement_assignment_id?: string | null;
  effective_from?: string | null;
  upsold_by_id?: string | null;
  upsold_by_name?: string | null;
  upsell_commission_percent?: number;
  note?: string | null;
  requested_by: string;
}): StoredModificationRequest {
  const requests = getModificationRequests();
  
  const newRequest: StoredModificationRequest = {
    id: crypto.randomUUID(),
    engagement_id: params.engagement_id,
    request_type: params.request_type,
    status: 'pending',
    proposed_changes: params.proposed_changes,
    engagement_service_id: params.engagement_service_id || null,
    engagement_assignment_id: params.engagement_assignment_id || null,
    effective_from: params.effective_from || null,
    upsold_by_id: params.upsold_by_id || null,
    upsell_commission_percent: params.upsell_commission_percent || 10,
    requested_by: params.requested_by,
    requested_at: new Date().toISOString(),
    note: params.note || null,
    reviewed_by: null,
    reviewed_at: null,
    rejection_reason: null,
    upgrade_offer_token: null,
    upgrade_offer_valid_until: null,
    client_email: null,
    client_approved_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    // Denormalized
    engagement_name: params.engagement_name,
    client_id: params.client_id,
    client_name: params.client_name,
    client_brand_name: params.client_brand_name || null,
    upsold_by_name: params.upsold_by_name || null,
  };
  
  requests.push(newRequest);
  saveRequests(requests);
  
  return newRequest;
}

// Update request status (approve)
export function approveModificationRequest(
  requestId: string, 
  reviewedBy: string
): StoredModificationRequest | null {
  const requests = getModificationRequests();
  const index = requests.findIndex(r => r.id === requestId);
  
  if (index === -1) return null;
  
  const request = requests[index];
  
  // Generate token for client-facing request types
  const isClientFacing = ['add_service', 'update_service_price', 'deactivate_service'].includes(request.request_type);
  
  requests[index] = {
    ...request,
    status: 'approved',
    reviewed_by: reviewedBy,
    reviewed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    // Generate token for client approval
    upgrade_offer_token: isClientFacing ? generateToken() : null,
    upgrade_offer_valid_until: isClientFacing 
      ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() 
      : null,
  };
  
  saveRequests(requests);
  return requests[index];
}

// Reject request
export function rejectModificationRequest(
  requestId: string,
  reviewedBy: string,
  reason: string
): StoredModificationRequest | null {
  const requests = getModificationRequests();
  const index = requests.findIndex(r => r.id === requestId);
  
  if (index === -1) return null;
  
  requests[index] = {
    ...requests[index],
    status: 'rejected',
    reviewed_by: reviewedBy,
    reviewed_at: new Date().toISOString(),
    rejection_reason: reason,
    updated_at: new Date().toISOString(),
  };
  
  saveRequests(requests);
  return requests[index];
}

// Get request by token (for public page)
export function getModificationRequestByToken(token: string): StoredModificationRequest | null {
  const requests = getModificationRequests();
  return requests.find(r => r.upgrade_offer_token === token) || null;
}

// Client accepts the offer
export function clientAcceptOffer(token: string, email: string): StoredModificationRequest | null {
  const requests = getModificationRequests();
  const index = requests.findIndex(r => r.upgrade_offer_token === token);
  
  if (index === -1) return null;
  
  requests[index] = {
    ...requests[index],
    status: 'client_approved',
    client_email: email,
    client_approved_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  saveRequests(requests);
  return requests[index];
}

// Apply the change (final step)
export function applyModificationRequest(requestId: string): StoredModificationRequest | null {
  const requests = getModificationRequests();
  const index = requests.findIndex(r => r.id === requestId);
  
  if (index === -1) return null;
  
  requests[index] = {
    ...requests[index],
    status: 'applied',
    updated_at: new Date().toISOString(),
  };
  
  saveRequests(requests);
  return requests[index];
}

// Filter requests by status
export function getRequestsByStatus(status?: ModificationRequestStatus): StoredModificationRequest[] {
  const requests = getModificationRequests();
  if (!status) return requests;
  return requests.filter(r => r.status === status);
}

// Get request by ID
export function getModificationRequestById(id: string): StoredModificationRequest | null {
  const requests = getModificationRequests();
  return requests.find(r => r.id === id) || null;
}
