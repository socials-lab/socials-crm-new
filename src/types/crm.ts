export type UserRole = 'admin' | 'management' | 'project_manager' | 'specialist' | 'finance' | 'client';

// App pages for granular permissions
export type AppPage = 
  | 'dashboard'
  | 'leads'
  | 'clients'
  | 'contacts'
  | 'engagements'
  | 'extra_work'
  | 'invoicing'
  | 'creative_boost'
  | 'services'
  | 'colleagues'
  | 'analytics'
  | 'settings';

// Page permission for granular access control
export interface PagePermission {
  page: AppPage;
  can_view: boolean;
  can_edit: boolean;
}

// CRM User - represents a user with access to the CRM system
export interface CRMUser {
  id: string;
  colleague_id: string | null;
  full_name: string;
  email: string;
  role: UserRole;
  is_super_admin: boolean;
  is_active: boolean;
  can_see_financials: boolean;
  page_permissions: PagePermission[];
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export type ClientStatus = 'lead' | 'active' | 'paused' | 'lost' | 'potential';

export type EngagementType = 'retainer' | 'one_off' | 'internal';

export type BillingModel = 'fixed_fee' | 'spend_based' | 'hybrid';

export type EngagementStatus = 'planned' | 'active' | 'paused' | 'completed' | 'cancelled';

export type Seniority = 'junior' | 'mid' | 'senior' | 'partner';

export type ColleagueStatus = 'active' | 'on_hold' | 'left';

export type CostModel = 'hourly' | 'fixed_monthly' | 'percentage';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Client Contact - for multiple contacts per client
export interface ClientContact {
  id: string;
  client_id: string;
  name: string;
  position: string | null;
  email: string | null;
  phone: string | null;
  is_primary: boolean;
  is_decision_maker: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

export type ClientTier = 'standard' | 'gold' | 'platinum' | 'diamond';

export interface Client {
  id: string;
  name: string;
  brand_name: string;
  ico: string;
  dic: string | null;
  website: string;
  country: string;
  industry: string;
  status: ClientStatus;
  tier: ClientTier;
  // Sales representative who acquired the client
  sales_representative_id: string | null;
  // Billing address
  billing_street: string | null;
  billing_city: string | null;
  billing_zip: string | null;
  billing_country: string | null;
  billing_email: string | null;
  // Legacy main contact (deprecated, use ClientContact instead)
  main_contact_name: string;
  main_contact_email: string;
  main_contact_phone: string;
  acquisition_channel: string;
  start_date: string;
  end_date: string | null;
  notes: string;
  pinned_notes: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type ServiceCategory = 'performance' | 'creative' | 'lead_gen' | 'analytics' | 'consulting';

// Service type: Core (with tiered pricing) or Add-on (fixed price)
export type ServiceType = 'core' | 'addon';

// Pricing tier for Core services based on client spend
export type ServiceTier = 'growth' | 'pro' | 'elite';

// Tier pricing for Core services
export interface CoreServicePricing {
  tier: ServiceTier;
  price: number | null; // null = "Individuální kalkulace"
  original_price?: number | null; // For showing discounted price
}

// Service tier configuration with spend ranges
export interface ServiceTierConfig {
  tier: ServiceTier;
  label: string;
  spend_description: string;
  min_spend: number | null;
  max_spend: number | null;
}

export interface Service {
  id: string;
  code: string;
  name: string;
  service_type: ServiceType;
  category: ServiceCategory;
  description: string;
  external_url: string | null;
  base_price: number;
  currency: string;
  tier_pricing: CoreServicePricing[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientService {
  id: string;
  client_id: string;
  service_id: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

// Advertising platforms
export const ADVERTISING_PLATFORMS = [
  'Meta Ads',
  'Google Ads',
  'S-klik',
  'Heuréka',
  'Zboží.cz',
  'TikTok Ads',
  'Glami',
  'Favi',
  'Bing'
] as const;

export type AdvertisingPlatform = typeof ADVERTISING_PLATFORMS[number];

export interface Engagement {
  id: string;
  client_id: string;
  contact_person_id: string | null;
  name: string;
  type: EngagementType;
  billing_model: BillingModel;
  currency: string;
  monthly_fee: number;
  one_off_fee: number;
  status: EngagementStatus;
  start_date: string;
  end_date: string | null;
  notice_period_months: number | null;
  freelo_url: string | null;
  platforms: string[];
  notes: string;
  // Document links from lead conversion
  offer_url: string | null;
  contract_url: string | null;
  created_at: string;
  updated_at: string;
}

// One-off invoicing status
export type OneOffInvoicingStatus = 'not_applicable' | 'pending' | 'invoiced';

// Service assigned to an engagement with its own pricing and team
export interface EngagementService {
  id: string;
  engagement_id: string;
  service_id: string;
  name: string;
  price: number;
  billing_type: 'monthly' | 'one_off';
  currency: string;
  is_active: boolean;
  notes: string;
  // Core service tier selection (GROWTH/PRO/ELITE)
  selected_tier: ServiceTier | null;
  // Creative Boost specific fields (used when service_id is CREATIVE_BOOST)
  creative_boost_min_credits: number | null;
  creative_boost_max_credits: number | null;
  creative_boost_price_per_credit: number | null;
  // One-off invoicing tracking
  invoicing_status: OneOffInvoicingStatus;
  invoiced_at: string | null;
  invoiced_in_period: string | null; // Format: "2025-02" (year-month)
  invoice_id: string | null;
  // Upsell tracking - who sold this service
  upsold_by_id: string | null;
  upsell_commission_percent: number | null;
  created_at: string;
  updated_at: string;
}

export interface Colleague {
  id: string;
  profile_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  position: string;
  seniority: Seniority;
  is_freelancer: boolean;
  internal_hourly_cost: number;
  monthly_fixed_cost: number | null;
  capacity_hours_per_month: number | null;
  status: ColleagueStatus;
  notes: string;
  birthday: string | null;
  created_at: string;
  updated_at: string;
}

export interface EngagementAssignment {
  id: string;
  engagement_id: string;
  engagement_service_id: string | null;
  colleague_id: string;
  role_on_engagement: string;
  cost_model: CostModel;
  hourly_cost: number | null;
  monthly_cost: number | null;
  percentage_of_revenue: number | null;
  start_date: string;
  end_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface EngagementMonthlyMetrics {
  id: string;
  engagement_id: string;
  year: number;
  month: number;
  revenue: number;
  cost_total: number;
  margin_amount: number;
  margin_percent: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

// Invoice types
export type InvoiceStatus = 'draft' | 'ready' | 'issued' | 'paid';
export type LineItemSource = 'engagement' | 'manual' | 'creative_boost' | 'extra_work' | 'one_off';

// Extra Work types - unified linear workflow
export type ExtraWorkStatus = 'pending_approval' | 'in_progress' | 'ready_to_invoice' | 'invoiced';

export interface ExtraWork {
  id: string;
  client_id: string;
  engagement_id: string;
  colleague_id: string;
  
  name: string;
  description: string;
  amount: number;
  currency: string;
  hours_worked: number | null;
  hourly_rate: number | null;
  
  work_date: string;
  billing_period: string;
  
  // Unified status workflow
  status: ExtraWorkStatus;
  approval_date: string | null;
  approved_by: string | null;
  
  // Invoice tracking (set when status changes to 'invoiced')
  invoice_id: string | null;
  invoice_number: string | null;
  invoiced_at: string | null;
  
  // Upsell tracking - who sold this extra work
  upsold_by_id: string | null;
  upsell_commission_percent: number | null;
  
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ExtraWorkWithDetails extends ExtraWork {
  client: Client;
  engagement: Engagement | null;
  colleague: Colleague;
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  source: LineItemSource;
  engagement_id: string | null;
  extra_work_id: string | null;
  source_description: string;
  source_amount: number;
  period_start: string;
  period_end: string;
  prorated_days: number;
  total_days_in_month: number;
  prorated_amount: number;
  line_description: string;
  unit_price: number;
  quantity: number;
  adjustment_amount: number;
  adjustment_reason: string;
  final_amount: number;
  is_approved: boolean;
  note: string;
  // Extended fields for manual items
  hours: number | null;
  hourly_rate: number | null;
  currency: string;
  is_reverse_charge: boolean;
}

export interface MonthlyClientInvoice {
  id: string;
  client_id: string;
  year: number;
  month: number;
  line_items: InvoiceLineItem[];
  subtotal: number;
  total_adjustments: number;
  total_amount: number;
  currency: string;
  status: InvoiceStatus;
  issued_at: string | null;
  webhook_sent_at: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

// Engagement-centric invoice for future invoicing
export interface MonthlyEngagementInvoice {
  id: string;
  engagement_id: string;
  engagement_name: string;
  client_id: string;
  year: number;
  month: number;
  line_items: InvoiceLineItem[];
  subtotal: number;
  total_adjustments: number;
  total_amount: number;
  currency: string;
  status: InvoiceStatus;
  issued_at: string | null;
  webhook_sent_at: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

// Lead types
export type LeadStage = 
  | 'new_lead'           // Nový lead
  | 'meeting_done'       // Schůzka proběhla  
  | 'waiting_access'     // Čekáme na přístupy
  | 'access_received'    // Přístupy přijaty
  | 'preparing_offer'    // Příprava nabídky
  | 'offer_sent'         // Nabídka odeslána
  | 'won'                // Vyhráno
  | 'lost'               // Prohráno
  | 'postponed';         // Odloženo

export type LeadSource = 
  | 'referral'
  | 'inbound'
  | 'cold_outreach'
  | 'event'
  | 'linkedin'
  | 'website'
  | 'other';

export type LeadOfferType = 'retainer' | 'one_off';

// Service in a lead offer
export interface LeadService {
  id: string;
  service_id: string;
  name: string;
  selected_tier: ServiceTier | null;
  price: number;
  currency: string;
  billing_type: 'monthly' | 'one_off';
}

export interface LeadNote {
  id: string;
  lead_id: string;
  author_id: string;
  author_name: string;
  text: string;
  created_at: string;
}

export interface Lead {
  id: string;
  // Company
  company_name: string;
  ico: string;
  dic: string | null;
  website: string | null;
  industry: string | null;
  
  // Billing address
  billing_street: string | null;
  billing_city: string | null;
  billing_zip: string | null;
  billing_country: string | null;
  billing_email: string | null;
  
  // Contact
  contact_name: string;
  contact_position: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  
  // Sales info
  stage: LeadStage;
  owner_id: string;
  source: LeadSource;
  source_custom: string | null;
  client_message: string | null;
  ad_spend_monthly: number | null;
  summary: string;
  
  // Offer
  potential_service: string;
  potential_services: LeadService[];
  offer_type: LeadOfferType;
  estimated_price: number;
  currency: string;
  probability_percent: number;
  offer_url: string | null;
  offer_created_at: string | null;
  offer_sent_at: string | null;
  offer_sent_by_id: string | null;
  
  // Notes
  notes: LeadNote[];
  
  // Conversion tracking
  converted_to_client_id: string | null;
  converted_to_engagement_id: string | null;
  converted_at: string | null;
  
  // Access request tracking
  access_request_sent_at: string | null;
  access_request_platforms: string[];
  access_received_at: string | null;
  
  // Onboarding form tracking
  onboarding_form_sent_at: string | null;
  onboarding_form_url: string | null;
  onboarding_form_completed_at: string | null;
  
  // Contract tracking
  contract_url: string | null;
  contract_created_at: string | null;
  contract_sent_at: string | null;
  contract_signed_at: string | null;
  
  // Meta
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

// ============= History/Audit Log Types =============

// Lead change types
export type LeadChangeType = 
  | 'created'
  | 'stage_change'
  | 'field_update'
  | 'owner_change'
  | 'note_added'
  | 'converted';

export interface LeadHistoryEntry {
  id: string;
  lead_id: string;
  change_type: LeadChangeType;
  field_name: string | null;
  field_label: string | null;
  old_value: string | null;
  new_value: string | null;
  changed_by: string;
  changed_by_name: string;
  created_at: string;
}

// Engagement change types
export type EngagementChangeType = 
  | 'created'
  | 'status_change'
  | 'field_update'
  | 'service_added'
  | 'service_removed'
  | 'service_updated'
  | 'colleague_assigned'
  | 'colleague_removed'
  | 'colleague_updated'
  | 'end_date_set';

export interface EngagementHistoryEntry {
  id: string;
  engagement_id: string;
  change_type: EngagementChangeType;
  field_name: string | null;
  field_label: string | null;
  old_value: string | null;
  new_value: string | null;
  related_entity_id: string | null;
  related_entity_name: string | null;
  changed_by: string;
  changed_by_name: string;
  created_at: string;
}

// Issued Invoice - stored when invoice is actually issued
export interface IssuedInvoice {
  id: string;
  engagement_id: string;
  engagement_name: string;
  client_id: string;
  client_name: string;
  year: number;
  month: number;
  
  // Fakturoid integration
  invoice_number: string;           // e.g. "FV-2025-001"
  fakturoid_id: string | null;      // ID in Fakturoid system
  fakturoid_url: string | null;     // Direct link to invoice in Fakturoid
  
  // Line items snapshot
  line_items: InvoiceLineItem[];
  total_amount: number;
  currency: string;
  
  // Timestamps
  issued_at: string;
  issued_by: string | null;
  
  created_at: string;
}

// Extended types with relations
export interface ClientWithEngagements extends Client {
  engagements: Engagement[];
  services: (ClientService & { service: Service })[];
}

export interface ClientWithContacts extends Client {
  contacts: ClientContact[];
}

export interface EngagementServiceWithDetails extends EngagementService {
  service: Service;
  assignments: (EngagementAssignment & { colleague: Colleague })[];
}

export interface EngagementWithDetails extends Engagement {
  client: Client;
  contact_person: ClientContact | null;
  engagement_services: EngagementServiceWithDetails[];
  assignments: (EngagementAssignment & { colleague: Colleague })[];
  monthly_metrics: EngagementMonthlyMetrics[];
}
