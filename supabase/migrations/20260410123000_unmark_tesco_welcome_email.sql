-- Reset welcome email sent flag for Tesco lead(s)
-- so the step is no longer marked as completed.
UPDATE public.leads
SET welcome_email_sent_at = NULL
WHERE company_name ILIKE '%tesco%';
