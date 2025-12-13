-- =====================================================
-- KOMPLETNÍ DATABÁZOVÉ SCHÉMA PRO CRM
-- Migrace zahrnuje všechny tabulky + RLS politiky + seed data
-- =====================================================

-- =====================================================
-- ČÁST 1: ENUMS
-- =====================================================

CREATE TYPE public.app_role AS ENUM ('admin', 'management', 'project_manager', 'specialist', 'finance');
CREATE TYPE public.client_status AS ENUM ('lead', 'active', 'paused', 'lost', 'potential');
CREATE TYPE public.client_tier AS ENUM ('standard', 'gold', 'platinum', 'diamond');
CREATE TYPE public.engagement_type AS ENUM ('retainer', 'one_off', 'internal');
CREATE TYPE public.billing_model AS ENUM ('fixed_fee', 'spend_based', 'hybrid');
CREATE TYPE public.engagement_status AS ENUM ('planned', 'active', 'paused', 'completed', 'cancelled');
CREATE TYPE public.seniority AS ENUM ('junior', 'mid', 'senior', 'partner');
CREATE TYPE public.colleague_status AS ENUM ('active', 'on_hold', 'left');
CREATE TYPE public.cost_model AS ENUM ('hourly', 'fixed_monthly', 'percentage');
CREATE TYPE public.service_type AS ENUM ('core', 'addon');
CREATE TYPE public.service_category AS ENUM ('performance', 'creative', 'lead_gen', 'analytics', 'consulting');
CREATE TYPE public.service_tier AS ENUM ('growth', 'pro', 'elite');
CREATE TYPE public.extra_work_status AS ENUM ('pending_approval', 'in_progress', 'ready_to_invoice', 'invoiced');
CREATE TYPE public.lead_stage AS ENUM ('new_lead', 'meeting_done', 'waiting_access', 'access_received', 'preparing_offer', 'offer_sent', 'won', 'lost', 'postponed');
CREATE TYPE public.lead_source AS ENUM ('referral', 'inbound', 'cold_outreach', 'event', 'linkedin', 'website', 'other');
CREATE TYPE public.invoice_status AS ENUM ('draft', 'ready', 'issued', 'paid');

-- =====================================================
-- ČÁST 2: ZÁKLADNÍ TABULKY
-- =====================================================

-- Profiles (rozšíření auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Roles (oddělená tabulka pro role)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    is_super_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- =====================================================
-- ČÁST 3: BUSINESS TABULKY
-- =====================================================

-- Colleagues (zaměstnanci/kolegové)
CREATE TABLE public.colleagues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    position TEXT NOT NULL,
    seniority seniority NOT NULL DEFAULT 'mid',
    is_freelancer BOOLEAN DEFAULT FALSE,
    internal_hourly_cost NUMERIC(10,2) DEFAULT 0,
    monthly_fixed_cost NUMERIC(10,2),
    capacity_hours_per_month INTEGER,
    status colleague_status DEFAULT 'active',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services (služby)
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    service_type service_type NOT NULL DEFAULT 'core',
    category service_category NOT NULL DEFAULT 'performance',
    description TEXT DEFAULT '',
    external_url TEXT,
    base_price NUMERIC(10,2) DEFAULT 0,
    currency TEXT DEFAULT 'CZK',
    tier_pricing JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients (klienti)
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    brand_name TEXT DEFAULT '',
    ico TEXT DEFAULT '',
    dic TEXT,
    website TEXT DEFAULT '',
    country TEXT DEFAULT 'CZ',
    industry TEXT DEFAULT '',
    status client_status DEFAULT 'active',
    tier client_tier DEFAULT 'standard',
    sales_representative_id UUID REFERENCES public.colleagues(id) ON DELETE SET NULL,
    billing_street TEXT,
    billing_city TEXT,
    billing_zip TEXT,
    billing_country TEXT,
    billing_email TEXT,
    main_contact_name TEXT DEFAULT '',
    main_contact_email TEXT DEFAULT '',
    main_contact_phone TEXT DEFAULT '',
    acquisition_channel TEXT DEFAULT '',
    start_date DATE,
    end_date DATE,
    notes TEXT DEFAULT '',
    pinned_notes TEXT DEFAULT '',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client Contacts
CREATE TABLE public.client_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position TEXT,
    email TEXT,
    phone TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    is_decision_maker BOOLEAN DEFAULT FALSE,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Engagements (zakázky)
CREATE TABLE public.engagements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    contact_person_id UUID REFERENCES public.client_contacts(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    type engagement_type NOT NULL DEFAULT 'retainer',
    billing_model billing_model NOT NULL DEFAULT 'fixed_fee',
    currency TEXT DEFAULT 'CZK',
    monthly_fee NUMERIC(10,2) DEFAULT 0,
    one_off_fee NUMERIC(10,2) DEFAULT 0,
    status engagement_status DEFAULT 'active',
    start_date DATE,
    end_date DATE,
    notice_period_months INTEGER,
    freelo_url TEXT,
    platforms TEXT[] DEFAULT '{}',
    notes TEXT DEFAULT '',
    offer_url TEXT,
    contract_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Engagement Services
CREATE TABLE public.engagement_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    price NUMERIC(10,2) DEFAULT 0,
    billing_type TEXT DEFAULT 'monthly' CHECK (billing_type IN ('monthly', 'one_off')),
    currency TEXT DEFAULT 'CZK',
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT DEFAULT '',
    selected_tier service_tier,
    creative_boost_min_credits INTEGER,
    creative_boost_max_credits INTEGER,
    creative_boost_price_per_credit NUMERIC(10,2),
    invoicing_status TEXT DEFAULT 'not_applicable' CHECK (invoicing_status IN ('not_applicable', 'pending', 'invoiced')),
    invoiced_at TIMESTAMPTZ,
    invoiced_in_period TEXT,
    invoice_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Engagement Assignments
CREATE TABLE public.engagement_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
    engagement_service_id UUID REFERENCES public.engagement_services(id) ON DELETE CASCADE,
    colleague_id UUID NOT NULL REFERENCES public.colleagues(id) ON DELETE CASCADE,
    role_on_engagement TEXT DEFAULT '',
    cost_model cost_model DEFAULT 'hourly',
    hourly_cost NUMERIC(10,2),
    monthly_cost NUMERIC(10,2),
    percentage_of_revenue NUMERIC(5,2),
    start_date DATE,
    end_date DATE,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extra Works
CREATE TABLE public.extra_works (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    engagement_id UUID REFERENCES public.engagements(id) ON DELETE SET NULL,
    colleague_id UUID NOT NULL REFERENCES public.colleagues(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    amount NUMERIC(10,2) NOT NULL,
    currency TEXT DEFAULT 'CZK',
    hours_worked NUMERIC(10,2),
    hourly_rate NUMERIC(10,2),
    work_date DATE NOT NULL,
    billing_period TEXT NOT NULL,
    status extra_work_status DEFAULT 'pending_approval',
    approval_date TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id),
    invoice_id TEXT,
    invoice_number TEXT,
    invoiced_at TIMESTAMPTZ,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    ico TEXT DEFAULT '',
    dic TEXT,
    website TEXT,
    industry TEXT,
    billing_street TEXT,
    billing_city TEXT,
    billing_zip TEXT,
    billing_country TEXT,
    billing_email TEXT,
    contact_name TEXT NOT NULL,
    contact_position TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    stage lead_stage DEFAULT 'new_lead',
    owner_id UUID REFERENCES public.colleagues(id) ON DELETE SET NULL,
    source lead_source DEFAULT 'inbound',
    source_custom TEXT,
    client_message TEXT,
    ad_spend_monthly NUMERIC(10,2),
    summary TEXT DEFAULT '',
    potential_service TEXT DEFAULT '',
    potential_services JSONB DEFAULT '[]',
    offer_type TEXT DEFAULT 'retainer',
    estimated_price NUMERIC(10,2) DEFAULT 0,
    currency TEXT DEFAULT 'CZK',
    probability_percent INTEGER DEFAULT 50,
    offer_url TEXT,
    offer_created_at TIMESTAMPTZ,
    offer_sent_at TIMESTAMPTZ,
    offer_sent_by_id UUID,
    notes JSONB DEFAULT '[]',
    converted_to_client_id UUID REFERENCES public.clients(id),
    converted_to_engagement_id UUID REFERENCES public.engagements(id),
    converted_at TIMESTAMPTZ,
    access_request_sent_at TIMESTAMPTZ,
    access_request_platforms TEXT[] DEFAULT '{}',
    access_received_at TIMESTAMPTZ,
    onboarding_form_sent_at TIMESTAMPTZ,
    onboarding_form_url TEXT,
    onboarding_form_completed_at TIMESTAMPTZ,
    contract_url TEXT,
    contract_created_at TIMESTAMPTZ,
    contract_sent_at TIMESTAMPTZ,
    contract_signed_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Issued Invoices
CREATE TABLE public.issued_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID REFERENCES public.engagements(id) ON DELETE SET NULL,
    engagement_name TEXT,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    client_name TEXT,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    invoice_number TEXT NOT NULL,
    fakturoid_id TEXT,
    fakturoid_url TEXT,
    line_items JSONB DEFAULT '[]',
    total_amount NUMERIC(10,2) NOT NULL,
    currency TEXT DEFAULT 'CZK',
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    issued_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ČÁST 4: ENABLE RLS
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extra_works ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issued_invoices ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ČÁST 5: SECURITY DEFINER FUNKCE
-- =====================================================

-- Kontrola role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Kontrola super admina
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND is_super_admin = TRUE
    )
$$;

-- Kontrola, zda je uživatel v systému (má nějakou roli)
CREATE OR REPLACE FUNCTION public.is_crm_user(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
    )
$$;

-- =====================================================
-- ČÁST 6: RLS POLICIES
-- =====================================================

-- Profiles policies
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "CRM users can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.is_crm_user(auth.uid()));

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.is_admin(auth.uid()));

-- CRM Data policies (authenticated CRM users can read all)
CREATE POLICY "CRM users can read colleagues"
ON public.colleagues FOR SELECT TO authenticated
USING (public.is_crm_user(auth.uid()));

CREATE POLICY "CRM users can manage colleagues"
ON public.colleagues FOR ALL TO authenticated
USING (public.is_crm_user(auth.uid()));

CREATE POLICY "CRM users can read services"
ON public.services FOR SELECT TO authenticated
USING (public.is_crm_user(auth.uid()));

CREATE POLICY "CRM users can manage services"
ON public.services FOR ALL TO authenticated
USING (public.is_crm_user(auth.uid()));

CREATE POLICY "CRM users can read clients"
ON public.clients FOR SELECT TO authenticated
USING (public.is_crm_user(auth.uid()));

CREATE POLICY "CRM users can manage clients"
ON public.clients FOR ALL TO authenticated
USING (public.is_crm_user(auth.uid()));

CREATE POLICY "CRM users can read client_contacts"
ON public.client_contacts FOR SELECT TO authenticated
USING (public.is_crm_user(auth.uid()));

CREATE POLICY "CRM users can manage client_contacts"
ON public.client_contacts FOR ALL TO authenticated
USING (public.is_crm_user(auth.uid()));

CREATE POLICY "CRM users can read engagements"
ON public.engagements FOR SELECT TO authenticated
USING (public.is_crm_user(auth.uid()));

CREATE POLICY "CRM users can manage engagements"
ON public.engagements FOR ALL TO authenticated
USING (public.is_crm_user(auth.uid()));

CREATE POLICY "CRM users can read engagement_services"
ON public.engagement_services FOR SELECT TO authenticated
USING (public.is_crm_user(auth.uid()));

CREATE POLICY "CRM users can manage engagement_services"
ON public.engagement_services FOR ALL TO authenticated
USING (public.is_crm_user(auth.uid()));

CREATE POLICY "CRM users can read engagement_assignments"
ON public.engagement_assignments FOR SELECT TO authenticated
USING (public.is_crm_user(auth.uid()));

CREATE POLICY "CRM users can manage engagement_assignments"
ON public.engagement_assignments FOR ALL TO authenticated
USING (public.is_crm_user(auth.uid()));

CREATE POLICY "CRM users can read extra_works"
ON public.extra_works FOR SELECT TO authenticated
USING (public.is_crm_user(auth.uid()));

CREATE POLICY "CRM users can manage extra_works"
ON public.extra_works FOR ALL TO authenticated
USING (public.is_crm_user(auth.uid()));

CREATE POLICY "CRM users can read leads"
ON public.leads FOR SELECT TO authenticated
USING (public.is_crm_user(auth.uid()));

CREATE POLICY "CRM users can manage leads"
ON public.leads FOR ALL TO authenticated
USING (public.is_crm_user(auth.uid()));

CREATE POLICY "CRM users can read issued_invoices"
ON public.issued_invoices FOR SELECT TO authenticated
USING (public.is_crm_user(auth.uid()));

CREATE POLICY "CRM users can manage issued_invoices"
ON public.issued_invoices FOR ALL TO authenticated
USING (public.is_crm_user(auth.uid()));

-- =====================================================
-- ČÁST 7: TRIGGERS
-- =====================================================

-- Trigger pro automatické vytvoření profilu při registraci
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, email)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data ->> 'first_name',
        NEW.raw_user_meta_data ->> 'last_name',
        NEW.email
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger pro aktualizaci updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_colleagues_updated_at
    BEFORE UPDATE ON public.colleagues
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_contacts_updated_at
    BEFORE UPDATE ON public.client_contacts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_engagements_updated_at
    BEFORE UPDATE ON public.engagements
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_engagement_services_updated_at
    BEFORE UPDATE ON public.engagement_services
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_engagement_assignments_updated_at
    BEFORE UPDATE ON public.engagement_assignments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_extra_works_updated_at
    BEFORE UPDATE ON public.extra_works
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ČÁST 8: SEED DATA (1ks od každého typu)
-- =====================================================

-- 1. Service
INSERT INTO public.services (id, code, name, service_type, category, description, base_price, currency, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'SOCIALS_BOOST',
    'Socials Boost',
    'core',
    'creative',
    'Správa sociálních sítí a kreativní výstupy',
    25000,
    'CZK',
    true
);

-- 2. Colleague (Super Admin)
INSERT INTO public.colleagues (id, full_name, email, phone, position, seniority, is_freelancer, internal_hourly_cost, status)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'Admin User',
    'admin@company.cz',
    '+420 777 888 999',
    'Managing Director',
    'partner',
    false,
    1500,
    'active'
);

-- 3. Client
INSERT INTO public.clients (id, name, brand_name, ico, website, country, industry, status, tier, main_contact_name, main_contact_email, acquisition_channel, start_date)
VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'Test Client s.r.o.',
    'TestBrand',
    '12345678',
    'https://testclient.cz',
    'CZ',
    'E-commerce',
    'active',
    'gold',
    'Jan Novák',
    'jan.novak@testclient.cz',
    'referral',
    '2025-01-01'
);

-- 4. Client Contact
INSERT INTO public.client_contacts (id, client_id, name, position, email, phone, is_primary, is_decision_maker)
VALUES (
    'd0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'Jan Novák',
    'Marketing Manager',
    'jan.novak@testclient.cz',
    '+420 777 111 222',
    true,
    true
);

-- 5. Engagement
INSERT INTO public.engagements (id, client_id, contact_person_id, name, type, billing_model, currency, monthly_fee, status, start_date, platforms)
VALUES (
    'e0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'Test Client - Retainer 2025',
    'retainer',
    'fixed_fee',
    'CZK',
    50000,
    'active',
    '2025-01-01',
    ARRAY['Meta Ads', 'Google Ads']
);

-- 6. Engagement Service
INSERT INTO public.engagement_services (id, engagement_id, service_id, name, price, billing_type, currency, is_active)
VALUES (
    'f0000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Socials Boost',
    25000,
    'monthly',
    'CZK',
    true
);

-- 7. Engagement Assignment
INSERT INTO public.engagement_assignments (id, engagement_id, engagement_service_id, colleague_id, role_on_engagement, cost_model, hourly_cost)
VALUES (
    '10000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Account Manager',
    'hourly',
    1500
);

-- 8. Lead
INSERT INTO public.leads (id, company_name, ico, website, industry, contact_name, contact_email, stage, owner_id, source, estimated_price, currency, probability_percent)
VALUES (
    '20000000-0000-0000-0000-000000000001',
    'Potential Client a.s.',
    '87654321',
    'https://potentialclient.cz',
    'Retail',
    'Marie Svobodová',
    'marie@potentialclient.cz',
    'new_lead',
    'b0000000-0000-0000-0000-000000000001',
    'inbound',
    75000,
    'CZK',
    30
);

-- 9. Extra Work
INSERT INTO public.extra_works (id, client_id, engagement_id, colleague_id, name, description, amount, currency, hours_worked, hourly_rate, work_date, billing_period, status)
VALUES (
    '30000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Ad-hoc Kreativa',
    'Dodatečné kreativní výstupy pro kampaň',
    7500,
    'CZK',
    5,
    1500,
    '2025-01-15',
    '2025-01',
    'pending_approval'
);
