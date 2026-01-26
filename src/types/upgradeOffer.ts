import type { ModificationRequestType, ModificationProposedChanges } from './crm';

// Re-export from crm.ts for backwards compatibility
export { isClientFacingRequestType } from './crm';

export type UpgradeOfferChangeType = 'add_service' | 'update_service_price' | 'deactivate_service';

export type UpgradeOfferStatus = 'pending' | 'accepted' | 'expired';

// This interface is for display purposes - data comes from modification_requests table
export interface EngagementUpgradeOffer {
  id: string;
  token: string;
  modification_request_id: string;
  
  // Engagement info
  engagement_id: string;
  engagement_name: string;
  client_name: string;
  
  // Change details
  change_type: UpgradeOfferChangeType;
  change_summary: string;
  proposed_changes: ModificationProposedChanges;
  
  // Financial info
  new_monthly_price?: number;
  price_difference?: number;
  effective_from: string;
  prorated_first_month?: number;
  currency: string;
  
  // Status
  status: UpgradeOfferStatus;
  valid_until: string;
  
  // Client acceptance
  accepted_at?: string;
  accepted_by_email?: string;
  
  // Contact person (from our side)
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  
  created_at: string;
}
