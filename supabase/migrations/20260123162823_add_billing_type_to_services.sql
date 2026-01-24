-- Add billing_type column to services table
ALTER TABLE services 
ADD COLUMN billing_type TEXT NOT NULL DEFAULT 'monthly' 
CHECK (billing_type IN ('monthly', 'one_off'));

-- Add comment for documentation
COMMENT ON COLUMN services.billing_type IS 'Billing frequency: monthly (recurring) or one_off (one-time service)';
