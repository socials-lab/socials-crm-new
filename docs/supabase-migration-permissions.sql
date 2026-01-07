-- Migration: Add granular per-user permissions
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/empndmpeyrdycjdesoxr/sql/new

-- Add columns for granular per-user permissions
ALTER TABLE public.user_roles
ADD COLUMN IF NOT EXISTS allowed_pages TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS can_see_financials BOOLEAN DEFAULT FALSE;

-- Comment for clarity
COMMENT ON COLUMN public.user_roles.allowed_pages IS 'Array of page IDs the user can access';
COMMENT ON COLUMN public.user_roles.can_see_financials IS 'Whether user can see financial data (amounts, invoices, etc.)';

-- Grant super admins full access by default (optional - they already bypass checks in code)
-- UPDATE public.user_roles 
-- SET can_see_financials = TRUE 
-- WHERE is_super_admin = TRUE;
