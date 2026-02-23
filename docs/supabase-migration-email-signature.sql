-- Add email_signature column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_signature text DEFAULT '';
