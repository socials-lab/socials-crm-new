-- Create applicant_stage enum
CREATE TYPE public.applicant_stage AS ENUM (
  'new_applicant',
  'invited_interview',
  'interview_done',
  'offer_sent',
  'hired',
  'bad_fit',
  'withdrawn',
  'postponed'
);

-- Create applicant_source enum
CREATE TYPE public.applicant_source AS ENUM (
  'website',
  'linkedin',
  'referral',
  'job_portal',
  'other'
);

-- Create applicants table
CREATE TABLE public.applicants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic info
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  
  -- Position
  position text NOT NULL,
  
  -- Application content
  cover_letter text,
  ai_usage text,
  cv_url text,
  video_url text,
  
  -- Pipeline
  stage applicant_stage NOT NULL DEFAULT 'new_applicant',
  owner_id uuid,
  
  -- Notes (JSONB array)
  notes jsonb NOT NULL DEFAULT '[]'::jsonb,
  
  -- Source
  source applicant_source NOT NULL DEFAULT 'other',
  source_custom text,
  
  -- Freelancer/Company info (filled during onboarding)
  ico text,
  company_name text,
  dic text,
  hourly_rate numeric,
  billing_street text,
  billing_city text,
  billing_zip text,
  bank_account text,
  
  -- Personal info (filled during onboarding)
  birthday date,
  personal_email text,
  avatar_url text,
  
  -- Communication tracking
  interview_invite_sent_at timestamptz,
  rejection_sent_at timestamptz,
  
  -- Onboarding (after hiring)
  onboarding_sent_at timestamptz,
  onboarding_completed_at timestamptz,
  converted_to_colleague_id uuid,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;

-- CRM users can manage applicants
CREATE POLICY "CRM users can manage applicants"
  ON public.applicants
  FOR ALL
  TO authenticated
  USING (is_crm_user(auth.uid()));

-- CRM users can read applicants
CREATE POLICY "CRM users can read applicants"
  ON public.applicants
  FOR SELECT
  TO authenticated
  USING (is_crm_user(auth.uid()));

-- Public can update their own onboarding data (via service role in edge function)
-- No public read access needed - edge function uses service role

-- Add updated_at trigger
CREATE TRIGGER update_applicants_updated_at
  BEFORE UPDATE ON public.applicants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
