-- ============================================
-- Add engagement_service_id to invoice_line_items
-- ============================================

-- Add column to track which engagement service a line item came from
-- This is needed to mark one-off services as 'invoiced'
ALTER TABLE invoice_line_items
  ADD COLUMN engagement_service_id UUID REFERENCES engagement_services(id) ON DELETE SET NULL;

-- Add index for efficient lookups
CREATE INDEX idx_invoice_line_items_engagement_service_id 
  ON invoice_line_items(engagement_service_id) 
  WHERE engagement_service_id IS NOT NULL;

-- ============================================
-- Seed initial output types for Creative Boost
-- ============================================

INSERT INTO output_types (name, category, base_credits, description, is_active) VALUES
  ('Banner', 'banner', 1, 'Statický banner', TRUE),
  ('Banner překlad', 'banner_translation', 0.5, 'Překlad banneru', TRUE),
  ('Banner revize', 'banner_revision', 0.5, 'Revize banneru', TRUE),
  ('AI Fotka', 'ai_photo', 2, 'AI generovaná fotka', TRUE),
  ('Video', 'video', 3, 'Video obsah', TRUE),
  ('Video překlad', 'video_translation', 1.5, 'Překlad videa', TRUE),
  ('Video revize', 'video_revision', 1, 'Revize videa', TRUE)
ON CONFLICT DO NOTHING;
