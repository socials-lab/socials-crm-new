import type { 
  ModificationRequestType,
  ModificationRequestStatus,
  ModificationProposedChanges,
} from '@/types/crm';
import type { Notification } from '@/types/notifications';

const STORAGE_KEY = 'modification_requests';
const NOTIFICATIONS_STORAGE_KEY = 'crm_notifications';

// Email sent record
export interface EmailSentRecord {
  sent_at: string;
  sent_to: string;
  sent_by_id: string;
  sent_by_name: string;
}

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
  // Email history
  emails_sent: EmailSentRecord[];
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
    // Email history
    emails_sent: [],
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
  
  const request = requests[index];
  
  requests[index] = {
    ...request,
    status: 'client_approved',
    client_email: email,
    client_approved_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  saveRequests(requests);
  
  // Create notification for the person who created the request
  createClientApprovedNotification(requests[index]);
  
  return requests[index];
}

// Create notification when client approves modification
function createClientApprovedNotification(request: StoredModificationRequest): void {
  const notifications = getStoredNotifications();
  
  const changeTypeLabels: Record<ModificationRequestType, string> = {
    add_service: 'přidání služby',
    update_service_price: 'změnu ceny',
    deactivate_service: 'deaktivaci služby',
    add_assignment: 'přiřazení kolegy',
    update_assignment: 'změnu odměny',
    remove_assignment: 'odebrání kolegy',
  };
  
  const clientName = request.client_brand_name || request.client_name;
  const changeType = changeTypeLabels[request.request_type] || 'změnu';
  
  const newNotification: Notification = {
    id: `notif-approval-${request.id}`,
    type: 'client_approved_modification',
    title: '✅ Klient potvrdil změnu!',
    message: `${clientName} potvrdil ${changeType} pro zakázku "${request.engagement_name}". Můžete se pustit do práce!`,
    link: '/modifications',
    is_read: false,
    entity_type: 'modification',
    entity_id: request.id,
    created_at: new Date().toISOString(),
    metadata: {
      modification_request_id: request.id,
      client_id: request.client_id,
      company_name: clientName,
      engagement_name: request.engagement_name,
    },
  };
  
  notifications.unshift(newNotification);
  saveStoredNotifications(notifications);
}

// Get notifications from localStorage
export function getStoredNotifications(): Notification[] {
  const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Save notifications to localStorage
function saveStoredNotifications(notifications: Notification[]): void {
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
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

// Update modification request (for editing before final approval)
export function updateModificationRequest(
  requestId: string,
  updates: {
    proposed_changes?: ModificationProposedChanges;
    effective_from?: string | null;
    note?: string | null;
    upsell_commission_percent?: number;
  }
): StoredModificationRequest | null {
  const requests = getModificationRequests();
  const index = requests.findIndex(r => r.id === requestId);
  
  if (index === -1) return null;
  
  const request = requests[index];
  
  // Only allow editing pending or approved (waiting for client) requests
  if (!['pending', 'approved'].includes(request.status)) {
    return null;
  }
  
  requests[index] = {
    ...request,
    proposed_changes: updates.proposed_changes ?? request.proposed_changes,
    effective_from: updates.effective_from !== undefined ? updates.effective_from : request.effective_from,
    note: updates.note !== undefined ? updates.note : request.note,
    upsell_commission_percent: updates.upsell_commission_percent ?? request.upsell_commission_percent,
    updated_at: new Date().toISOString(),
  };
  
  saveRequests(requests);
  return requests[index];
}

// Delete a modification request
export function deleteModificationRequest(requestId: string): boolean {
  const requests = getModificationRequests();
  const index = requests.findIndex(r => r.id === requestId);
  
  if (index === -1) return false;
  
  const request = requests[index];
  
  // Only allow deleting pending, approved (waiting for client), or rejected requests
  if (!['pending', 'approved', 'rejected'].includes(request.status)) {
    return false;
  }
  
  requests.splice(index, 1);
  saveRequests(requests);
  return true;
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

// Record email sent
export function recordEmailSent(
  requestId: string,
  sentTo: string,
  sentById: string,
  sentByName: string
): StoredModificationRequest | null {
  const requests = getModificationRequests();
  const index = requests.findIndex(r => r.id === requestId);
  
  if (index === -1) return null;
  
  const request = requests[index];
  const emailRecord: EmailSentRecord = {
    sent_at: new Date().toISOString(),
    sent_to: sentTo,
    sent_by_id: sentById,
    sent_by_name: sentByName,
  };
  
  requests[index] = {
    ...request,
    emails_sent: [...(request.emails_sent || []), emailRecord],
    updated_at: new Date().toISOString(),
  };
  
  saveRequests(requests);
  return requests[index];
}
