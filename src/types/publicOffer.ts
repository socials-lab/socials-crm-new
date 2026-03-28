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
  original_price?: number;        // Original price before discount
  discount_reason?: string;       // Reason for the discount
  currency: string;
  billing_type: 'monthly' | 'one_off';
  service_type?: 'core' | 'addon'; // Core or add-on service
  // Extended service details
  deliverables?: string[];        // What client gets (specific outputs)
  frequency?: string;             // How often (e.g., "8 posts/month")
  turnaround?: string;            // Delivery time (e.g., "within 14 days")
  requirements?: string[];        // What we need from client
  start_timeline?: string;        // When we can start
  detailed_sections?: ServiceDetailSection[];  // Expandable structured detail sections
}

// Structured detail section for "Více informací" expandable
export interface ServiceDetailSection {
  emoji: string;
  title: string;
  items: string[];
}

// Public offer for clients
export interface PublicOfferHistoryEntry {
  timestamp: string;
  changed_by: string | null;
  summary: string;  // e.g. "Změna cen, přidána služba Creative Boost"
  snapshot: Omit<PublicOffer, 'history'>;  // Full snapshot of the offer at that point
}

export interface PublicOffer {
  id: string;
  lead_id: string;
  token: string;
  company_name: string;
  website: string | null;
  contact_name: string;
  audit_summary: string | null;
  recommendation_intro: string | null;
  custom_note: string | null;
  loom_url: string | null;
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
  estimated_start_date?: string;
  monthly_discount_percent?: number;
  discount_scope?: 'core_only' | 'all_services';
  intro_discount_percent?: number;
  intro_discount_months?: number;
  // Contact person info (lead owner)
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
  // Edit history
  history?: PublicOfferHistoryEntry[];
  // Snapshot of offer_content_blocks at creation time
  content_blocks_snapshot?: Record<string, {
    section_key: string;
    title: string | null;
    subtitle: string | null;
    content: Record<string, any>;
  }>;
}

// Form data for creating offer
export interface CreateOfferFormData {
  audit_summary: string;
  custom_note: string;
  loom_url: string;
  valid_until: string;
  portfolio_links: PortfolioLink[];
}
