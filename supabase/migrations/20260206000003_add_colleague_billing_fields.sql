-- Add billing/personal fields to colleagues table for employee self-service profile

ALTER TABLE colleagues
  ADD COLUMN IF NOT EXISTS personal_email TEXT,
  ADD COLUMN IF NOT EXISTS ico TEXT,
  ADD COLUMN IF NOT EXISTS dic TEXT,
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS billing_street TEXT,
  ADD COLUMN IF NOT EXISTS billing_city TEXT,
  ADD COLUMN IF NOT EXISTS billing_zip TEXT,
  ADD COLUMN IF NOT EXISTS bank_account TEXT,
  ADD COLUMN IF NOT EXISTS max_engagements INTEGER DEFAULT 3;

-- Add comment explaining the fields
COMMENT ON COLUMN colleagues.personal_email IS 'Personal email for billing/contract purposes (different from work email)';
COMMENT ON COLUMN colleagues.ico IS 'IČO for freelancers';
COMMENT ON COLUMN colleagues.dic IS 'DIČ for freelancers';
COMMENT ON COLUMN colleagues.company_name IS 'Company name for freelancers';
COMMENT ON COLUMN colleagues.billing_street IS 'Billing address street';
COMMENT ON COLUMN colleagues.billing_city IS 'Billing address city';
COMMENT ON COLUMN colleagues.billing_zip IS 'Billing address ZIP code';
COMMENT ON COLUMN colleagues.bank_account IS 'Bank account number for payments';
COMMENT ON COLUMN colleagues.max_engagements IS 'Maximum number of concurrent engagements';
