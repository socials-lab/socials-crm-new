-- Lead pipeline detail parity with main UX (bad_fit stage + enrichment fields)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumlabel = 'bad_fit'
      AND enumtypid = 'lead_stage'::regtype
  ) THEN
    ALTER TYPE public.lead_stage ADD VALUE 'bad_fit';
  END IF;
END $$;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS vat_payer_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS digisign_envelope_id text,
  ADD COLUMN IF NOT EXISTS digisign_document_url text,
  ADD COLUMN IF NOT EXISTS enrichment_platform text,
  ADD COLUMN IF NOT EXISTS enrichment_ad_spend_range text,
  ADD COLUMN IF NOT EXISTS enrichment_services_needed text,
  ADD COLUMN IF NOT EXISTS marketing_experience text,
  ADD COLUMN IF NOT EXISTS marketing_maturity text,
  ADD COLUMN IF NOT EXISTS has_creative_team text,
  ADD COLUMN IF NOT EXISTS pain_point text,
  ADD COLUMN IF NOT EXISTS has_ga4 boolean,
  ADD COLUMN IF NOT EXISTS has_gtm boolean,
  ADD COLUMN IF NOT EXISTS has_meta_pixel boolean,
  ADD COLUMN IF NOT EXISTS has_google_ads boolean,
  ADD COLUMN IF NOT EXISTS tracking_detected boolean,
  ADD COLUMN IF NOT EXISTS lead_score integer,
  ADD COLUMN IF NOT EXISTS credibility_score integer,
  ADD COLUMN IF NOT EXISTS enrichment_qualification_tier text,
  ADD COLUMN IF NOT EXISTS is_vat_payer boolean,
  ADD COLUMN IF NOT EXISTS is_ecommerce boolean,
  ADD COLUMN IF NOT EXISTS business_type text,
  ADD COLUMN IF NOT EXISTS company_address text,
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS booking_status text,
  ADD COLUMN IF NOT EXISTS booking_datetime timestamptz,
  ADD COLUMN IF NOT EXISTS booking_meet_link text,
  ADD COLUMN IF NOT EXISTS company_research text,
  ADD COLUMN IF NOT EXISTS enrichment_completed boolean,
  ADD COLUMN IF NOT EXISTS enrichment_id text;
