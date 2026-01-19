import type { ServiceTier, LeadOfferType } from './crm';

// Portfolio link for showcasing work
export interface PortfolioLink {
  id: string;
  title: string;
  url: string;
  type: 'case_study' | 'presentation' | 'reference' | 'video';
}

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
  // Extended service details
  deliverables?: string[];        // What client gets (specific outputs)
  frequency?: string;             // How often (e.g., "8 posts/month")
  turnaround?: string;            // Delivery time (e.g., "within 14 days")
  requirements?: string[];        // What we need from client
  start_timeline?: string;        // When we can start
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
  portfolio_links: PortfolioLink[];
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
  estimated_start_date?: string;  // When collaboration can start
}

// Form data for creating offer
export interface CreateOfferFormData {
  audit_summary: string;
  custom_note: string;
  notion_url: string;
  valid_until: string;
  portfolio_links: PortfolioLink[];
}
