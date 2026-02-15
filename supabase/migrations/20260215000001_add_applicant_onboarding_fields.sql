-- Add additional fields for applicant onboarding
-- These fields are collected during the onboarding wizard

-- Birthday field for sending birthday wishes
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS birthday DATE;

-- Avatar URL for profile photo (stored as base64 or URL)
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Personal email (separate from work email that will be created)
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS personal_email TEXT;
