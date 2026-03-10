-- Add meeting_schedule_url to profiles (user's Calendly/Cal.com link)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS meeting_schedule_url TEXT DEFAULT NULL;

-- Add email_signature to profiles (was referenced in code but missing from DB)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_signature TEXT DEFAULT NULL;

-- Add meeting_request_sent_at to leads (tracking when meeting request was sent)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS meeting_request_sent_at TIMESTAMPTZ DEFAULT NULL;
