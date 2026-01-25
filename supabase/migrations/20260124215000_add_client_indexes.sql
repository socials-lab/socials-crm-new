-- ============================================
-- Add missing indexes for clients table
-- Improves query performance for common operations
-- ============================================

-- Text search indexes
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_brand_name ON clients(brand_name);
CREATE INDEX IF NOT EXISTS idx_clients_industry ON clients(industry);

-- Filter indexes
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_tier ON clients(tier);

-- Lookup indexes
CREATE INDEX IF NOT EXISTS idx_clients_fakturoid_subject_id ON clients(fakturoid_subject_id);
CREATE INDEX IF NOT EXISTS idx_clients_sales_representative_id ON clients(sales_representative_id);

-- Composite index for common query pattern (status + tier filter)
CREATE INDEX IF NOT EXISTS idx_clients_status_tier ON clients(status, tier);

-- IČO lookup index (for search by IČO)
CREATE INDEX IF NOT EXISTS idx_clients_ico ON clients(ico);
