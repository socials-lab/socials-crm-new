import type { ServiceTier, LeadOfferType } from './crm';

// Service snapshot for public offer
export interface PublicOfferService {
  id: string;
  service_id: string;
  name: string;
  description: string;
  offer_description: string | null;
  selected_tier: ServiceTier | null;
  price: number;
  currency: string;
  billing_type: 'monthly' | 'one_off';
}

// Public offer for clients
export interface PublicOffer {
  id: string;
  lead_id: string;
  token: string;
  company_name: string;
  contact_name: string;
  audit_summary: string | null;
  custom_note: string | null;
  notion_url: string | null;
  services: PublicOfferService[];
  total_price: number;
  currency: string;
  offer_type: LeadOfferType;
  valid_until: string | null;
  is_active: boolean;
  viewed_at: string | null;
  view_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Form data for creating offer
export interface CreateOfferFormData {
  audit_summary: string;
  custom_note: string;
  notion_url: string;
  valid_until: string;
}
