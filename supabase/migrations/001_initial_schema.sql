-- ============================================
-- Sub-Plan 01: Database Schema
-- Complete Supabase database schema from scratch
-- ============================================

-- ============================================
-- ENUM Types (26 total)
-- ============================================

-- User roles
CREATE TYPE app_role AS ENUM (
  'admin',
  'management',
  'project_manager',
  'specialist',
  'finance',
  'client'
);

-- Client enums
CREATE TYPE client_status AS ENUM (
  'lead',
  'active',
  'paused',
  'lost',
  'potential'
);

CREATE TYPE client_tier AS ENUM (
  'standard',
  'gold',
  'platinum',
  'diamond'
);

-- Colleague enums
CREATE TYPE colleague_status AS ENUM (
  'active',
  'on_hold',
  'left'
);

CREATE TYPE seniority AS ENUM (
  'junior',
  'mid',
  'senior',
  'partner'
);

-- Engagement enums
CREATE TYPE engagement_type AS ENUM (
  'retainer',
  'one_off',
  'internal'
);

CREATE TYPE engagement_status AS ENUM (
  'planned',
  'active',
  'paused',
  'completed',
  'cancelled'
);

CREATE TYPE billing_model AS ENUM (
  'fixed_fee',
  'spend_based',
  'hybrid'
);

CREATE TYPE cost_model AS ENUM (
  'hourly',
  'fixed_monthly',
  'percentage'
);

-- Service enums
CREATE TYPE service_type AS ENUM (
  'core',
  'addon'
);

CREATE TYPE service_category AS ENUM (
  'performance',
  'creative',
  'lead_gen',
  'analytics',
  'consulting'
);

CREATE TYPE service_tier AS ENUM (
  'growth',
  'pro',
  'elite'
);

-- Lead enums
CREATE TYPE lead_stage AS ENUM (
  'new_lead',
  'meeting_done',
  'waiting_access',
  'access_received',
  'preparing_offer',
  'offer_sent',
  'won',
  'lost',
  'postponed'
);

CREATE TYPE lead_source AS ENUM (
  'referral',
  'inbound',
  'cold_outreach',
  'event',
  'linkedin',
  'website',
  'other'
);

CREATE TYPE lead_change_type AS ENUM (
  'created',
  'stage_change',
  'field_update',
  'owner_change',
  'note_added',
  'converted'
);

-- Engagement history enums
CREATE TYPE engagement_change_type AS ENUM (
  'created',
  'status_change',
  'field_update',
  'service_added',
  'service_removed',
  'service_updated',
  'colleague_assigned',
  'colleague_removed',
  'colleague_updated',
  'end_date_set'
);

-- Extra work enums
CREATE TYPE extra_work_status AS ENUM (
  'pending_approval',
  'in_progress',
  'ready_to_invoice',
  'invoiced'
);

-- Invoice enums
CREATE TYPE invoice_status AS ENUM (
  'draft',
  'ready',
  'issued',
  'paid'
);

CREATE TYPE line_item_source AS ENUM (
  'engagement',
  'manual',
  'creative_boost',
  'extra_work',
  'one_off'
);

CREATE TYPE one_off_invoicing_status AS ENUM (
  'not_applicable',
  'pending',
  'invoiced'
);

-- Creative Boost enums
CREATE TYPE output_category AS ENUM (
  'banner',
  'banner_translation',
  'banner_revision',
  'ai_photo',
  'video',
  'video_translation',
  'video_revision'
);

CREATE TYPE month_status AS ENUM (
  'active',
  'inactive'
);

CREATE TYPE settings_change_type AS ENUM (
  'max_credits',
  'price_per_credit',
  'status',
  'colleague'
);

-- Meeting enums
CREATE TYPE meeting_type AS ENUM (
  'internal',
  'client'
);

CREATE TYPE meeting_status AS ENUM (
  'scheduled',
  'in_progress',
  'completed',
  'cancelled'
);

CREATE TYPE participant_role AS ENUM (
  'organizer',
  'required',
  'optional'
);

CREATE TYPE attendance_status AS ENUM (
  'pending',
  'confirmed',
  'declined',
  'attended'
);

CREATE TYPE meeting_task_status AS ENUM (
  'todo',
  'in_progress',
  'done'
);

CREATE TYPE meeting_task_priority AS ENUM (
  'low',
  'medium',
  'high'
);

-- Applicant enums
CREATE TYPE applicant_stage AS ENUM (
  'new_applicant',
  'invited_interview',
  'interview_done',
  'offer_sent',
  'hired',
  'rejected',
  'withdrawn'
);

CREATE TYPE applicant_source AS ENUM (
  'website',
  'linkedin',
  'referral',
  'job_portal',
  'other'
);

-- Feedback enums
CREATE TYPE feedback_category AS ENUM (
  'process',
  'service',
  'communication',
  'system',
  'other'
);

CREATE TYPE feedback_status AS ENUM (
  'new',
  'in_review',
  'accepted',
  'rejected',
  'implemented'
);

-- Notification enums
CREATE TYPE notification_type AS ENUM (
  'new_lead',
  'form_completed',
  'contract_signed',
  'lead_converted',
  'access_granted',
  'offer_sent',
  'colleague_birthday',
  'new_feedback_idea'
);

-- ============================================
-- Core Tables
-- ============================================

-- Profiles: Extended auth user profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles: Role assignments and permissions
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  is_super_admin BOOLEAN DEFAULT FALSE,
  can_see_financials BOOLEAN DEFAULT FALSE,
  page_permissions JSONB DEFAULT '[]'::jsonb, -- Array of {page, can_view, can_edit}
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Colleagues: Team members
CREATE TABLE colleagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  position TEXT NOT NULL,
  seniority seniority NOT NULL,
  is_freelancer BOOLEAN DEFAULT FALSE,
  internal_hourly_cost DECIMAL(12,2),
  monthly_fixed_cost DECIMAL(12,2),
  capacity_hours_per_month INTEGER,
  status colleague_status DEFAULT 'active',
  notes TEXT,
  birthday DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services: Service catalog
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  service_type service_type NOT NULL,
  category service_category NOT NULL,
  description TEXT,
  external_url TEXT,
  base_price DECIMAL(12,2),
  currency TEXT DEFAULT 'CZK',
  tier_pricing JSONB, -- Array of {tier, price, original_price}
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Client Tables
-- ============================================

-- Clients: Client companies
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand_name TEXT,
  ico TEXT NOT NULL,
  dic TEXT,
  website TEXT,
  country TEXT,
  industry TEXT,
  status client_status DEFAULT 'active',
  tier client_tier DEFAULT 'standard',
  sales_representative_id UUID REFERENCES colleagues(id) ON DELETE SET NULL,
  -- Billing address
  billing_street TEXT,
  billing_city TEXT,
  billing_zip TEXT,
  billing_country TEXT,
  billing_email TEXT,
  -- Legacy main contact (deprecated, use client_contacts instead)
  main_contact_name TEXT,
  main_contact_email TEXT,
  main_contact_phone TEXT,
  acquisition_channel TEXT,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  pinned_notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client contacts: Contacts per client
CREATE TABLE client_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position TEXT,
  email TEXT,
  phone TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  is_decision_maker BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client services: Direct client-service links
CREATE TABLE client_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Lead Tables
-- ============================================

-- Leads: Sales pipeline
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Company
  company_name TEXT NOT NULL,
  ico TEXT NOT NULL,
  dic TEXT,
  website TEXT,
  industry TEXT,
  -- Billing address
  billing_street TEXT,
  billing_city TEXT,
  billing_zip TEXT,
  billing_country TEXT,
  billing_email TEXT,
  -- Contact
  contact_name TEXT NOT NULL,
  contact_position TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  -- Sales info
  stage lead_stage DEFAULT 'new_lead',
  owner_id UUID REFERENCES colleagues(id) ON DELETE SET NULL,
  source lead_source,
  source_custom TEXT,
  client_message TEXT,
  ad_spend_monthly DECIMAL(12,2),
  summary TEXT,
  -- Offer
  potential_service TEXT,
  potential_services JSONB DEFAULT '[]'::jsonb, -- Array of LeadService objects
  offer_type TEXT, -- 'retainer' | 'one_off'
  estimated_price DECIMAL(12,2),
  currency TEXT DEFAULT 'CZK',
  probability_percent INTEGER,
  offer_url TEXT,
  offer_created_at TIMESTAMPTZ,
  offer_sent_at TIMESTAMPTZ,
  offer_sent_by_id UUID REFERENCES colleagues(id) ON DELETE SET NULL,
  -- Notes (JSONB array)
  notes JSONB DEFAULT '[]'::jsonb, -- Array of LeadNote objects
  -- Conversion tracking
  converted_to_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  converted_to_engagement_id UUID, -- Will add FK constraint after engagements table is created
  converted_at TIMESTAMPTZ,
  -- Access request tracking
  access_request_sent_at TIMESTAMPTZ,
  access_request_platforms TEXT[] DEFAULT '{}',
  access_received_at TIMESTAMPTZ,
  -- Onboarding form tracking
  onboarding_form_sent_at TIMESTAMPTZ,
  onboarding_form_url TEXT,
  onboarding_form_completed_at TIMESTAMPTZ,
  -- Contract tracking
  contract_url TEXT,
  contract_created_at TIMESTAMPTZ,
  contract_sent_at TIMESTAMPTZ,
  contract_signed_at TIMESTAMPTZ,
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Lead history: Lead audit log
CREATE TABLE lead_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  change_type lead_change_type NOT NULL,
  field_name TEXT,
  field_label TEXT,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  changed_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Engagement Tables
-- ============================================

-- Engagements: Contracts/projects
CREATE TABLE engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  contact_person_id UUID REFERENCES client_contacts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type engagement_type NOT NULL,
  billing_model billing_model NOT NULL,
  currency TEXT DEFAULT 'CZK',
  monthly_fee DECIMAL(12,2),
  one_off_fee DECIMAL(12,2),
  status engagement_status DEFAULT 'planned',
  start_date DATE NOT NULL,
  end_date DATE,
  notice_period_months INTEGER,
  freelo_url TEXT,
  platforms TEXT[] DEFAULT '{}',
  notes TEXT,
  -- Document links from lead conversion
  offer_url TEXT,
  contract_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Engagement services: Services per engagement
CREATE TABLE engagement_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  billing_type TEXT NOT NULL, -- 'monthly' | 'one_off'
  currency TEXT DEFAULT 'CZK',
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  -- Core service tier selection
  selected_tier service_tier,
  -- Creative Boost specific fields
  creative_boost_min_credits INTEGER,
  creative_boost_max_credits INTEGER,
  creative_boost_price_per_credit DECIMAL(12,2),
  -- One-off invoicing tracking
  invoicing_status one_off_invoicing_status DEFAULT 'not_applicable',
  invoiced_at TIMESTAMPTZ,
  invoiced_in_period TEXT, -- Format: "2025-02" (year-month)
  invoice_id UUID, -- Will add FK constraint after issued_invoices table is created
  -- Upsell tracking
  upsold_by_id UUID REFERENCES colleagues(id) ON DELETE SET NULL,
  upsell_commission_percent DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Engagement assignments: Colleague assignments
CREATE TABLE engagement_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  engagement_service_id UUID REFERENCES engagement_services(id) ON DELETE CASCADE,
  colleague_id UUID NOT NULL REFERENCES colleagues(id) ON DELETE CASCADE,
  role_on_engagement TEXT,
  cost_model cost_model,
  hourly_cost DECIMAL(12,2),
  monthly_cost DECIMAL(12,2),
  percentage_of_revenue DECIMAL(5,2),
  start_date DATE NOT NULL,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Engagement history: Engagement audit log
CREATE TABLE engagement_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  change_type engagement_change_type NOT NULL,
  field_name TEXT,
  field_label TEXT,
  old_value TEXT,
  new_value TEXT,
  related_entity_id UUID,
  related_entity_name TEXT,
  changed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  changed_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Engagement monthly metrics: Monthly revenue/cost tracking
CREATE TABLE engagement_monthly_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
  cost_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  margin_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  margin_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(engagement_id, year, month)
);

-- ============================================
-- Billing Tables
-- ============================================

-- Extra works: Additional billable work
CREATE TABLE extra_works (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL,
  colleague_id UUID NOT NULL REFERENCES colleagues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'CZK',
  hours_worked DECIMAL(5,2),
  hourly_rate DECIMAL(12,2),
  work_date DATE NOT NULL,
  billing_period TEXT NOT NULL, -- Format: "YYYY-MM"
  -- Unified status workflow
  status extra_work_status DEFAULT 'pending_approval',
  approval_date TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Invoice tracking
  invoice_id UUID, -- Will add FK constraint after issued_invoices table is created
  invoice_number TEXT,
  invoiced_at TIMESTAMPTZ,
  -- Upsell tracking
  upsold_by_id UUID REFERENCES colleagues(id) ON DELETE SET NULL,
  upsell_commission_percent DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Issued invoices: Invoice records
CREATE TABLE issued_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL,
  engagement_name TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  -- Fakturoid integration
  invoice_number TEXT NOT NULL UNIQUE, -- Format: "FV-YYYY-NNN"
  fakturoid_id TEXT,
  fakturoid_url TEXT,
  -- Line items snapshot (JSONB)
  line_items JSONB DEFAULT '[]'::jsonb, -- Array of InvoiceLineItem objects
  total_amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'CZK',
  -- Timestamps
  issued_at TIMESTAMPTZ NOT NULL,
  issued_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice line items: Invoice details
CREATE TABLE invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES issued_invoices(id) ON DELETE CASCADE,
  source line_item_source NOT NULL,
  engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL,
  extra_work_id UUID REFERENCES extra_works(id) ON DELETE SET NULL,
  source_description TEXT,
  source_amount DECIMAL(12,2),
  period_start DATE,
  period_end DATE,
  prorated_days INTEGER,
  total_days_in_month INTEGER,
  prorated_amount DECIMAL(12,2),
  line_description TEXT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  adjustment_amount DECIMAL(12,2) DEFAULT 0,
  adjustment_reason TEXT,
  final_amount DECIMAL(12,2) NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  note TEXT,
  -- Extended fields for manual items
  hours DECIMAL(5,2),
  hourly_rate DECIMAL(12,2),
  currency TEXT DEFAULT 'CZK',
  is_reverse_charge BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Creative Boost Tables
-- ============================================

-- Output types: Creative output types
CREATE TABLE output_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category output_category NOT NULL,
  base_credits DECIMAL(5,2) NOT NULL, -- Supports 0.5 credits
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Creative Boost client months: Monthly CB settings
CREATE TABLE creative_boost_client_months (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  min_credits INTEGER NOT NULL DEFAULT 30,
  max_credits INTEGER NOT NULL DEFAULT 50,
  price_per_credit DECIMAL(12,2) NOT NULL DEFAULT 1500,
  colleague_id UUID REFERENCES colleagues(id) ON DELETE SET NULL,
  status month_status DEFAULT 'active',
  -- Link to engagement service
  engagement_service_id UUID REFERENCES engagement_services(id) ON DELETE SET NULL,
  engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, year, month, engagement_service_id)
);

-- Creative Boost outputs: Actual CB entries
CREATE TABLE creative_boost_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  client_month_id UUID REFERENCES creative_boost_client_months(id) ON DELETE CASCADE,
  output_type_id UUID NOT NULL REFERENCES output_types(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  normal_count INTEGER NOT NULL DEFAULT 0,
  express_count INTEGER NOT NULL DEFAULT 0,
  colleague_id UUID REFERENCES colleagues(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, output_type_id, year, month)
);

-- Creative Boost settings history: CB settings changes
CREATE TABLE creative_boost_settings_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_month_id UUID NOT NULL REFERENCES creative_boost_client_months(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  change_type settings_change_type NOT NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  changed_by_name TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Meeting Tables
-- ============================================

-- Meetings: Meeting records
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type meeting_type NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  location TEXT,
  meeting_link TEXT,
  status meeting_status DEFAULT 'scheduled',
  agenda TEXT,
  transcript TEXT,
  ai_summary TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  calendar_invites_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meeting participants: Attendees
CREATE TABLE meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  colleague_id UUID REFERENCES colleagues(id) ON DELETE SET NULL,
  external_name TEXT,
  external_email TEXT,
  role participant_role DEFAULT 'optional',
  attendance attendance_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (colleague_id IS NOT NULL AND external_name IS NULL AND external_email IS NULL) OR
    (colleague_id IS NULL AND external_name IS NOT NULL)
  )
);

-- Meeting tasks: Tasks from meetings
CREATE TABLE meeting_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES colleagues(id) ON DELETE SET NULL,
  due_date DATE,
  status meeting_task_status DEFAULT 'todo',
  priority meeting_task_priority DEFAULT 'medium',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HR Tables
-- ============================================

-- Applicants: Job applicants
CREATE TABLE applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Basic info
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  -- Position
  position TEXT NOT NULL,
  -- Application content
  cover_letter TEXT,
  cv_url TEXT,
  video_url TEXT,
  -- Pipeline
  stage applicant_stage DEFAULT 'new_applicant',
  owner_id UUID REFERENCES colleagues(id) ON DELETE SET NULL,
  -- Notes (JSONB array)
  notes JSONB DEFAULT '[]'::jsonb, -- Array of ApplicantNote objects
  -- Source
  source applicant_source,
  source_custom TEXT,
  -- Freelancer/Company info (filled during onboarding)
  ico TEXT,
  company_name TEXT,
  dic TEXT,
  hourly_rate DECIMAL(12,2),
  billing_street TEXT,
  billing_city TEXT,
  billing_zip TEXT,
  bank_account TEXT,
  -- Communication tracking
  interview_invite_sent_at TIMESTAMPTZ,
  rejection_sent_at TIMESTAMPTZ,
  -- Onboarding (after hiring)
  onboarding_sent_at TIMESTAMPTZ,
  onboarding_completed_at TIMESTAMPTZ,
  converted_to_colleague_id UUID REFERENCES colleagues(id) ON DELETE SET NULL,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback ideas: Internal suggestions
CREATE TABLE feedback_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category feedback_category NOT NULL,
  author_id UUID NOT NULL REFERENCES colleagues(id) ON DELETE CASCADE,
  status feedback_status DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback votes: Votes on ideas
CREATE TABLE feedback_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES feedback_ideas(id) ON DELETE CASCADE,
  colleague_id UUID NOT NULL REFERENCES colleagues(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(idea_id, colleague_id)
);

-- Notifications: User notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb, -- Object with optional fields
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================

-- Profiles indexes
CREATE INDEX idx_profiles_email ON profiles(email);

-- User roles indexes
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- Colleagues indexes
CREATE INDEX idx_colleagues_profile_id ON colleagues(profile_id);
CREATE INDEX idx_colleagues_status ON colleagues(status);
CREATE INDEX idx_colleagues_email ON colleagues(email);

-- Services indexes
CREATE INDEX idx_services_code ON services(code);
CREATE INDEX idx_services_is_active ON services(is_active);

-- Clients indexes
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_ico ON clients(ico);
CREATE INDEX idx_clients_sales_rep ON clients(sales_representative_id);

-- Client contacts indexes
CREATE INDEX idx_client_contacts_client_id ON client_contacts(client_id);
CREATE INDEX idx_client_contacts_is_primary ON client_contacts(client_id, is_primary) WHERE is_primary = TRUE;

-- Client services indexes
CREATE INDEX idx_client_services_client_id ON client_services(client_id);
CREATE INDEX idx_client_services_service_id ON client_services(service_id);
CREATE INDEX idx_client_services_is_active ON client_services(is_active);

-- Leads indexes
CREATE INDEX idx_leads_stage ON leads(stage);
CREATE INDEX idx_leads_owner_id ON leads(owner_id);
CREATE INDEX idx_leads_converted_to_client ON leads(converted_to_client_id) WHERE converted_to_client_id IS NOT NULL;
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- Lead history indexes
CREATE INDEX idx_lead_history_lead_id ON lead_history(lead_id);
CREATE INDEX idx_lead_history_created_at ON lead_history(created_at DESC);

-- Engagements indexes
CREATE INDEX idx_engagements_client_id ON engagements(client_id);
CREATE INDEX idx_engagements_status ON engagements(status);
CREATE INDEX idx_engagements_type ON engagements(type);

-- Engagement services indexes
CREATE INDEX idx_engagement_services_engagement_id ON engagement_services(engagement_id);
CREATE INDEX idx_engagement_services_service_id ON engagement_services(service_id);
CREATE INDEX idx_engagement_services_is_active ON engagement_services(is_active);
CREATE INDEX idx_engagement_services_invoicing_status ON engagement_services(invoicing_status) WHERE invoicing_status = 'pending';

-- Engagement assignments indexes
CREATE INDEX idx_engagement_assignments_engagement_id ON engagement_assignments(engagement_id);
CREATE INDEX idx_engagement_assignments_colleague_id ON engagement_assignments(colleague_id);
CREATE INDEX idx_engagement_assignments_service_id ON engagement_assignments(engagement_service_id) WHERE engagement_service_id IS NOT NULL;

-- Engagement history indexes
CREATE INDEX idx_engagement_history_engagement_id ON engagement_history(engagement_id);
CREATE INDEX idx_engagement_history_created_at ON engagement_history(created_at DESC);

-- Engagement monthly metrics indexes
CREATE INDEX idx_engagement_metrics_engagement_id ON engagement_monthly_metrics(engagement_id);
CREATE INDEX idx_engagement_metrics_year_month ON engagement_monthly_metrics(engagement_id, year, month);

-- Extra works indexes
CREATE INDEX idx_extra_works_client_id ON extra_works(client_id);
CREATE INDEX idx_extra_works_engagement_id ON extra_works(engagement_id);
CREATE INDEX idx_extra_works_colleague_id ON extra_works(colleague_id);
CREATE INDEX idx_extra_works_status ON extra_works(status);
CREATE INDEX idx_extra_works_billing_period ON extra_works(billing_period);

-- Issued invoices indexes
CREATE INDEX idx_issued_invoices_engagement_id ON issued_invoices(engagement_id);
CREATE INDEX idx_issued_invoices_client_id ON issued_invoices(client_id);
CREATE INDEX idx_issued_invoices_year_month ON issued_invoices(year, month);
CREATE INDEX idx_issued_invoices_invoice_number ON issued_invoices(invoice_number);

-- Invoice line items indexes
CREATE INDEX idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX idx_invoice_line_items_engagement_id ON invoice_line_items(engagement_id) WHERE engagement_id IS NOT NULL;
CREATE INDEX idx_invoice_line_items_extra_work_id ON invoice_line_items(extra_work_id) WHERE extra_work_id IS NOT NULL;

-- Output types indexes
CREATE INDEX idx_output_types_category ON output_types(category);
CREATE INDEX idx_output_types_is_active ON output_types(is_active);

-- Creative Boost client months indexes
CREATE INDEX idx_cb_client_months_client_id ON creative_boost_client_months(client_id);
CREATE INDEX idx_cb_client_months_year_month ON creative_boost_client_months(year, month);
CREATE INDEX idx_cb_client_months_engagement_service ON creative_boost_client_months(engagement_service_id) WHERE engagement_service_id IS NOT NULL;

-- Creative Boost outputs indexes
CREATE INDEX idx_cb_outputs_client_id ON creative_boost_outputs(client_id);
CREATE INDEX idx_cb_outputs_client_month_id ON creative_boost_outputs(client_month_id);
CREATE INDEX idx_cb_outputs_output_type_id ON creative_boost_outputs(output_type_id);
CREATE INDEX idx_cb_outputs_year_month ON creative_boost_outputs(year, month);
CREATE INDEX idx_cb_outputs_colleague_id ON creative_boost_outputs(colleague_id) WHERE colleague_id IS NOT NULL;

-- Creative Boost settings history indexes
CREATE INDEX idx_cb_settings_history_client_month_id ON creative_boost_settings_history(client_month_id);
CREATE INDEX idx_cb_settings_history_client_id ON creative_boost_settings_history(client_id);
CREATE INDEX idx_cb_settings_history_changed_at ON creative_boost_settings_history(changed_at DESC);

-- Meetings indexes
CREATE INDEX idx_meetings_client_id ON meetings(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_meetings_engagement_id ON meetings(engagement_id) WHERE engagement_id IS NOT NULL;
CREATE INDEX idx_meetings_scheduled_at ON meetings(scheduled_at);
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_type ON meetings(type);

-- Meeting participants indexes
CREATE INDEX idx_meeting_participants_meeting_id ON meeting_participants(meeting_id);
CREATE INDEX idx_meeting_participants_colleague_id ON meeting_participants(colleague_id) WHERE colleague_id IS NOT NULL;

-- Meeting tasks indexes
CREATE INDEX idx_meeting_tasks_meeting_id ON meeting_tasks(meeting_id);
CREATE INDEX idx_meeting_tasks_assigned_to ON meeting_tasks(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_meeting_tasks_status ON meeting_tasks(status);

-- Applicants indexes
CREATE INDEX idx_applicants_stage ON applicants(stage);
CREATE INDEX idx_applicants_owner_id ON applicants(owner_id) WHERE owner_id IS NOT NULL;
CREATE INDEX idx_applicants_email ON applicants(email);

-- Feedback ideas indexes
CREATE INDEX idx_feedback_ideas_category ON feedback_ideas(category);
CREATE INDEX idx_feedback_ideas_status ON feedback_ideas(status);
CREATE INDEX idx_feedback_ideas_author_id ON feedback_ideas(author_id);
CREATE INDEX idx_feedback_ideas_created_at ON feedback_ideas(created_at DESC);

-- Feedback votes indexes
CREATE INDEX idx_feedback_votes_idea_id ON feedback_votes(idea_id);
CREATE INDEX idx_feedback_votes_colleague_id ON feedback_votes(colleague_id);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- ============================================
-- Triggers
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_colleagues_updated_at BEFORE UPDATE ON colleagues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_contacts_updated_at BEFORE UPDATE ON client_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_services_updated_at BEFORE UPDATE ON client_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_engagements_updated_at BEFORE UPDATE ON engagements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_engagement_services_updated_at BEFORE UPDATE ON engagement_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_engagement_assignments_updated_at BEFORE UPDATE ON engagement_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_engagement_monthly_metrics_updated_at BEFORE UPDATE ON engagement_monthly_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_extra_works_updated_at BEFORE UPDATE ON extra_works FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoice_line_items_updated_at BEFORE UPDATE ON invoice_line_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_output_types_updated_at BEFORE UPDATE ON output_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_creative_boost_client_months_updated_at BEFORE UPDATE ON creative_boost_client_months FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_creative_boost_outputs_updated_at BEFORE UPDATE ON creative_boost_outputs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meeting_participants_updated_at BEFORE UPDATE ON meeting_participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meeting_tasks_updated_at BEFORE UPDATE ON meeting_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applicants_updated_at BEFORE UPDATE ON applicants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feedback_ideas_updated_at BEFORE UPDATE ON feedback_ideas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup - create profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on auth signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- Helper Functions
-- ============================================

-- Get user role
CREATE OR REPLACE FUNCTION get_user_role(_user_id UUID)
RETURNS app_role AS $$
DECLARE
  _role app_role;
BEGIN
  SELECT role INTO _role
  FROM user_roles
  WHERE user_id = _user_id;
  
  RETURN COALESCE(_role, NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  _is_super_admin BOOLEAN;
BEGIN
  SELECT is_super_admin INTO _is_super_admin
  FROM user_roles
  WHERE user_id = _user_id;
  
  RETURN COALESCE(_is_super_admin, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get colleague ID for user
CREATE OR REPLACE FUNCTION get_colleague_id(_user_id UUID)
RETURNS UUID AS $$
DECLARE
  _colleague_id UUID;
BEGIN
  SELECT id INTO _colleague_id
  FROM colleagues
  WHERE profile_id = _user_id;
  
  RETURN _colleague_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can see financials
CREATE OR REPLACE FUNCTION can_see_financials(_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  _can_see BOOLEAN;
BEGIN
  SELECT can_see_financials INTO _can_see
  FROM user_roles
  WHERE user_id = _user_id;
  
  RETURN COALESCE(_can_see, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has admin or management role
CREATE OR REPLACE FUNCTION is_admin_or_management(_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  _role app_role;
BEGIN
  SELECT role INTO _role
  FROM user_roles
  WHERE user_id = _user_id;
  
  RETURN _role IN ('admin', 'management');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has CRM access (any role)
CREATE OR REPLACE FUNCTION has_crm_access(_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  _role app_role;
BEGIN
  SELECT role INTO _role
  FROM user_roles
  WHERE user_id = _user_id;
  
  RETURN _role IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE colleagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_monthly_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE extra_works ENABLE ROW LEVEL SECURITY;
ALTER TABLE issued_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE output_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_boost_client_months ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_boost_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_boost_settings_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Add foreign key constraints that reference tables created later

-- leads.converted_to_engagement_id -> engagements.id
ALTER TABLE leads
  ADD CONSTRAINT leads_converted_to_engagement_id_fkey
  FOREIGN KEY (converted_to_engagement_id)
  REFERENCES engagements(id)
  ON DELETE SET NULL;

-- engagement_services.invoice_id -> issued_invoices.id
ALTER TABLE engagement_services
  ADD CONSTRAINT engagement_services_invoice_id_fkey
  FOREIGN KEY (invoice_id)
  REFERENCES issued_invoices(id)
  ON DELETE SET NULL;

-- extra_works.invoice_id -> issued_invoices.id
ALTER TABLE extra_works
  ADD CONSTRAINT extra_works_invoice_id_fkey
  FOREIGN KEY (invoice_id)
  REFERENCES issued_invoices(id)
  ON DELETE SET NULL;

-- Note: RLS policies will be created in Sub-Plan 02: Auth and Roles
