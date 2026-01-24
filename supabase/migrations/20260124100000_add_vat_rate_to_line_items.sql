-- Add VAT rate and unit name columns to invoice_line_items for Fakturoid integration
ALTER TABLE invoice_line_items
  ADD COLUMN IF NOT EXISTS vat_rate INTEGER DEFAULT 21,
  ADD COLUMN IF NOT EXISTS unit_name TEXT DEFAULT 'ks';

COMMENT ON COLUMN invoice_line_items.vat_rate IS 'VAT rate percentage (21, 12, 10, 0)';
COMMENT ON COLUMN invoice_line_items.unit_name IS 'Unit name for Fakturoid (ks, hod, etc.)';
