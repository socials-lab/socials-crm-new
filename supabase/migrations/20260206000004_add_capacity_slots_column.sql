-- Add capacity_slots column to colleagues table for service-type-based capacity tracking

ALTER TABLE colleagues
  ADD COLUMN IF NOT EXISTS capacity_slots JSONB DEFAULT '{"meta": 3, "google": 2, "graphics": 2}'::jsonb;

COMMENT ON COLUMN colleagues.capacity_slots IS 'Service-type-based capacity slots (meta, google, graphics)';
