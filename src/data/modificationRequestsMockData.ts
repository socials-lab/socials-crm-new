import type { 
  ModificationRequestType,
  ModificationRequestStatus,
  ModificationProposedChanges,
  ModificationRequestItem,
} from '@/types/crm';
import type { Notification } from '@/types/notifications';
import type { PricingSnapshot } from '@/utils/pricingEngine';

const STORAGE_KEY = 'modification_requests';
const NOTIFICATIONS_STORAGE_KEY = 'crm_notifications';

// Email sent record
export interface EmailSentRecord {
  sent_at: string;
  sent_to: string;
  sent_by_id: string;
  sent_by_name: string;
}

// Onboarding data filled by client for new SRO
export interface OnboardingData {
  company_name: string;
  ico: string;
  dic?: string;
  website?: string;
  industry?: string;
  billing_street?: string;
  billing_city?: string;
  billing_zip?: string;
  billing_country?: string;
  billing_email?: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  contact_position?: string;
  filled_at: string;
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
  // Pricing engine snapshot
  pricing_snapshot: PricingSnapshot | null;
  // Multi-item bundle support
  items?: ModificationRequestItem[];
  // Bundle discount
  bundle_discount_percent?: number;
  // Client-chosen effective date
  client_chosen_effective_from: string | null;
  // Onboarding data for new SRO
  onboarding_data?: OnboardingData | null;
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
  pricing_snapshot?: PricingSnapshot | null;
  items?: ModificationRequestItem[];
  bundle_discount_percent?: number;
}): StoredModificationRequest {
  const requests = getModificationRequests();
  
  const newRequest: StoredModificationRequest = {
    id: crypto.randomUUID(),
    engagement_id: params.engagement_id,
    request_type: params.request_type,
    status: (params as any).status === 'draft' ? 'draft' : 'pending',
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
    // Pricing engine snapshot
    pricing_snapshot: params.pricing_snapshot || null,
    // Multi-item bundle
    items: params.items && params.items.length > 0 ? params.items : undefined,
    bundle_discount_percent: params.bundle_discount_percent || undefined,
    // Denormalized
    engagement_name: params.engagement_name,
    client_id: params.client_id,
    client_name: params.client_name,
    client_brand_name: params.client_brand_name || null,
    upsold_by_name: params.upsold_by_name || null,
    client_chosen_effective_from: null,
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
  // For bundles, check if any item is client-facing
  const hasItems = request.items && request.items.length > 0;
  const isClientFacing = hasItems
    ? request.items!.some(item => ['add_service', 'update_service_price', 'deactivate_service', 'new_engagement', 'expand_country'].includes(item.request_type))
    : ['add_service', 'update_service_price', 'deactivate_service', 'new_engagement', 'expand_country'].includes(request.request_type);
  
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
export function clientAcceptOffer(token: string, email: string, chosenEffectiveFrom?: string): StoredModificationRequest | null {
  const requests = getModificationRequests();
  const index = requests.findIndex(r => r.upgrade_offer_token === token);
  
  if (index === -1) return null;
  
  const request = requests[index];
  
  requests[index] = {
    ...request,
    status: 'client_approved',
    client_email: email,
    client_approved_at: new Date().toISOString(),
    client_chosen_effective_from: chosenEffectiveFrom || request.effective_from || null,
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
    expand_country: 'přidání nové země',
    add_service: 'přidání služby',
    update_service_price: 'změnu ceny',
    deactivate_service: 'deaktivaci služby',
    add_assignment: 'přiřazení kolegy',
    update_assignment: 'změnu odměny',
    new_engagement: 'novou zakázku',
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

// Submit a draft (move from draft → pending)
export function submitDraftRequest(requestId: string): StoredModificationRequest | null {
  const requests = getModificationRequests();
  const index = requests.findIndex(r => r.id === requestId);
  
  if (index === -1) return null;
  if (requests[index].status !== 'draft') return null;
  
  requests[index] = {
    ...requests[index],
    status: 'pending',
    requested_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  saveRequests(requests);
  return requests[index];
}


export function updateModificationRequest(
  requestId: string,
  updates: {
    proposed_changes?: ModificationProposedChanges;
    effective_from?: string | null;
    note?: string | null;
    upsell_commission_percent?: number;
    upsold_by_id?: string | null;
    upsold_by_name?: string | null;
    pricing_snapshot?: PricingSnapshot | null;
    items?: ModificationRequestItem[];
    bundle_discount_percent?: number;
  }
): StoredModificationRequest | null {
  const requests = getModificationRequests();
  const index = requests.findIndex(r => r.id === requestId);
  
  if (index === -1) return null;
  
  const request = requests[index];
  
  // Only allow editing draft, pending or approved (waiting for client) requests
  if (!['draft', 'pending', 'approved'].includes(request.status)) {
    return null;
  }
  
  requests[index] = {
    ...request,
    proposed_changes: updates.proposed_changes ?? request.proposed_changes,
    effective_from: updates.effective_from !== undefined ? updates.effective_from : request.effective_from,
    note: updates.note !== undefined ? updates.note : request.note,
    upsell_commission_percent: updates.upsell_commission_percent ?? request.upsell_commission_percent,
    upsold_by_id: updates.upsold_by_id !== undefined ? updates.upsold_by_id : request.upsold_by_id,
    upsold_by_name: updates.upsold_by_name !== undefined ? updates.upsold_by_name : request.upsold_by_name,
    pricing_snapshot: updates.pricing_snapshot !== undefined ? updates.pricing_snapshot : request.pricing_snapshot,
    items: updates.items !== undefined ? updates.items : request.items,
    bundle_discount_percent: updates.bundle_discount_percent !== undefined ? updates.bundle_discount_percent : request.bundle_discount_percent,
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
  
  // Only allow deleting draft, pending, approved (waiting for client), or rejected requests
  if (!['draft', 'pending', 'approved', 'rejected'].includes(request.status)) {
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

// Seed a demo "new_engagement" request for testing the client-facing page
export function seedNewEngagementDemo(): StoredModificationRequest {
  const DEMO_TOKEN = 'demo-new-engagement-sro';
  const requests = getModificationRequests();
  const existing = requests.find(r => r.upgrade_offer_token === DEMO_TOKEN);
  if (existing) return existing;

  const now = new Date().toISOString();
  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const effectiveFrom = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const demo: StoredModificationRequest = {
    id: crypto.randomUUID(),
    engagement_id: 'demo-eng-001',
    request_type: 'new_engagement',
    status: 'approved',
    proposed_changes: {
      is_different_sro: true,
      new_client_data: {
        company_name: 'NovaBrand s.r.o.',
        brand_name: 'NovaBrand',
      },
      engagement_name: 'NovaBrand – Performance Marketing',
      services: [
        {
          service_id: null,
          name: 'Socials Boost PRO',
          price: 25000,
          currency: 'CZK',
          billing_type: 'monthly',
          selected_tier: 'pro',
          description: 'Kompletní správa sociálních sítí včetně strategie, tvorby obsahu a community managementu.',
          deliverables: [
            'Správa Meta Ads kampaní',
            'Tvorba kreativ a copywritingu',
            'Měsíční reporting a optimalizace',
            'Community management',
          ],
          assignments: [
            { colleague_id: 'c1', colleague_name: 'Tereza Nováková', role: 'Meta Ads Specialist', cost_model: 'fixed_monthly', monthly_cost: 8000 },
            { colleague_id: 'c2', colleague_name: 'Martin Dvořák', role: 'Content Creator', cost_model: 'fixed_monthly', monthly_cost: 6000 },
          ],
        },
        {
          service_id: null,
          name: 'PPC Boost PRO',
          price: 20000,
          currency: 'CZK',
          billing_type: 'monthly',
          selected_tier: 'pro',
          description: 'Správa PPC kampaní na Google Ads s pokročilou optimalizací.',
          deliverables: [
            'Správa Google Ads kampaní',
            'A/B testing reklam',
            'Měsíční reporting s doporučeními',
          ],
          assignments: [
            { colleague_id: 'c3', colleague_name: 'Jan Procházka', role: 'PPC Specialist', cost_model: 'fixed_monthly', monthly_cost: 9000 },
          ],
        },
      ],
      total_monthly_price: 45000,
      currency: 'CZK',
      onboarding_email: 'novabrand@example.com',
      send_onboarding_form: true,
    } as any,
    engagement_service_id: null,
    engagement_assignment_id: null,
    effective_from: effectiveFrom,
    upsold_by_id: null,
    upsell_commission_percent: 10,
    requested_by: 'demo-user',
    requested_at: now,
    note: 'Demo: nová zakázka pod jiným SRO – klient vyplní onboarding formulář.',
    reviewed_by: 'admin',
    reviewed_at: now,
    rejection_reason: null,
    upgrade_offer_token: DEMO_TOKEN,
    upgrade_offer_valid_until: validUntil,
    client_email: null,
    client_approved_at: null,
    created_at: now,
    updated_at: now,
    emails_sent: [],
    pricing_snapshot: null,
    client_chosen_effective_from: null,
    engagement_name: 'NovaBrand – Performance Marketing',
    client_id: 'demo-client-001',
    client_name: 'TestBrand s.r.o.',
    client_brand_name: 'TestBrand',
    upsold_by_name: null,
  };

  requests.push(demo);
  saveRequests(requests);
  return demo;
}

// Seed demo data for client_approved and applied statuses
export function seedDemoModificationStatuses(): { clientApproved: StoredModificationRequest; applied: StoredModificationRequest } {
  const requests = getModificationRequests();
  const now = new Date().toISOString();
  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
  const fiveDaysAgo = new Date(Date.now() - 5 * 86400000).toISOString();
  const tenDaysAgo = new Date(Date.now() - 10 * 86400000).toISOString();

  // Check if we already have these demos
  const existingClientApproved = requests.find(r => r.id === 'demo-client-approved-001');
  const existingApplied = requests.find(r => r.id === 'demo-applied-001');
  
  if (existingClientApproved && existingApplied) {
    return { clientApproved: existingClientApproved, applied: existingApplied };
  }

  // 1) Client Approved — bundle with add_service + expand_country
  const clientApprovedRequest: StoredModificationRequest = {
    id: 'demo-client-approved-001',
    engagement_id: 'e0000000-0000-0000-0000-000000000001',
    request_type: 'add_service',
    status: 'client_approved',
    proposed_changes: {
      name: 'Socials Boost PRO',
      price: 22000,
      currency: 'CZK',
      billing_type: 'monthly',
      service_id: null,
      selected_tier: 'pro',
    } as any,
    engagement_service_id: null,
    engagement_assignment_id: null,
    effective_from: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    upsold_by_id: null,
    upsell_commission_percent: 10,
    requested_by: 'demo-user',
    requested_at: fiveDaysAgo,
    note: 'Klient chce rozšířit spolupráci o správu sociálních sítí.',
    reviewed_by: 'admin',
    reviewed_at: fiveDaysAgo,
    rejection_reason: null,
    upgrade_offer_token: 'demo-token-client-approved',
    upgrade_offer_valid_until: new Date(Date.now() + 30 * 86400000).toISOString(),
    client_email: 'jan.novak@testbrand.cz',
    client_approved_at: threeDaysAgo,
    created_at: fiveDaysAgo,
    updated_at: threeDaysAgo,
    emails_sent: [{
      sent_at: fiveDaysAgo,
      sent_to: 'jan.novak@testbrand.cz',
      sent_by_id: 'admin',
      sent_by_name: 'Marek Admin',
    }],
    pricing_snapshot: null,
    items: [
      {
        id: 'demo-item-ca-001',
        request_type: 'add_service',
        proposed_changes: {
          name: 'Socials Boost PRO',
          price: 22000,
          currency: 'CZK',
          billing_type: 'monthly',
          service_id: null,
          selected_tier: 'pro',
          description: 'Kompletní správa Meta Ads kampaní s pokročilou optimalizací.',
          deliverables: ['Správa Meta Ads', 'A/B testing kreativ', 'Měsíční reporting'],
          colleague_rewards: [
            { role: 'Meta Ads Specialist', colleague_id: 'c1', colleague_name: 'Tereza Nováková', cost_model: 'fixed_monthly', monthly_cost: 7500 },
          ],
        } as any,
        engagement_service_id: null,
      },
      {
        request_type: 'expand_country',
        proposed_changes: {
          reference_service_name: 'PPC Boost PRO',
          service_name: 'PPC Boost PRO SK',
          new_country_code: 'SK',
          multiplier: 0.5,
          price: 10000,
          currency: 'CZK',
          billing_type: 'monthly',
        } as any,
        engagement_service_id: null,
      },
    ],
    bundle_discount_percent: 5,
    client_chosen_effective_from: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    engagement_name: 'Test Client - Retainer 2025',
    client_id: 'c0000000-0000-0000-0000-000000000001',
    client_name: 'Test Client s.r.o.',
    client_brand_name: 'TestBrand',
    upsold_by_name: null,
    onboarding_data: null,
  };

  // 2) Applied — simple update_service_price
  const appliedRequest: StoredModificationRequest = {
    id: 'demo-applied-001',
    engagement_id: 'e0000000-0000-0000-0000-000000000001',
    request_type: 'update_service_price',
    status: 'applied',
    proposed_changes: {
      engagement_service_id: 'es-demo-001',
      service_name: 'PPC Boost PRO',
      old_price: 18000,
      new_price: 21000,
      currency: 'CZK',
      changed_assignments: [
        {
          assignment_id: 'a-demo-001',
          colleague_name: 'Jan Procházka',
          role: 'PPC Specialist',
          old_value: 7000,
          new_value: 8500,
        },
      ],
    } as any,
    engagement_service_id: 'es-demo-001',
    engagement_assignment_id: null,
    effective_from: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    upsold_by_id: null,
    upsell_commission_percent: 10,
    requested_by: 'demo-user',
    requested_at: tenDaysAgo,
    note: 'Navýšení ceny z důvodu rozšíření scope kampaní.',
    reviewed_by: 'admin',
    reviewed_at: tenDaysAgo,
    rejection_reason: null,
    upgrade_offer_token: 'demo-token-applied',
    upgrade_offer_valid_until: new Date(Date.now() + 20 * 86400000).toISOString(),
    client_email: 'jan.novak@testbrand.cz',
    client_approved_at: fiveDaysAgo,
    created_at: tenDaysAgo,
    updated_at: threeDaysAgo,
    emails_sent: [{
      sent_at: tenDaysAgo,
      sent_to: 'jan.novak@testbrand.cz',
      sent_by_id: 'admin',
      sent_by_name: 'Marek Admin',
    }],
    pricing_snapshot: null,
    client_chosen_effective_from: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    engagement_name: 'Test Client - Retainer 2025',
    client_id: 'c0000000-0000-0000-0000-000000000001',
    client_name: 'Test Client s.r.o.',
    client_brand_name: 'TestBrand',
    upsold_by_name: null,
  };

  // Remove existing demos if any, then add
  const filtered = requests.filter(r => r.id !== 'demo-client-approved-001' && r.id !== 'demo-applied-001');
  filtered.push(clientApprovedRequest, appliedRequest);
  saveRequests(filtered);

  return { clientApproved: clientApprovedRequest, applied: appliedRequest };
}
