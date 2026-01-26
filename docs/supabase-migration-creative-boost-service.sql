-- Migration: Add Creative Boost service and attach to engagement
-- Run this in Supabase SQL Editor

-- 1. Insert Creative Boost service
INSERT INTO services (id, code, name, service_type, category, description, base_price, currency, is_active)
VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'CREATIVE_BOOST',
  'Creative Boost',
  'addon',
  'creative',
  'Kreativní výstupy na kreditní bázi - bannery, videa, AI fotky a další grafické materiály pro sociální sítě a reklamy.',
  50000,
  'CZK',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price;

-- 2. Add Creative Boost to existing engagement (Test Client - Retainer 2025)
INSERT INTO engagement_services (
  id, 
  engagement_id, 
  service_id, 
  name, 
  price, 
  billing_type, 
  currency, 
  is_active,
  creative_boost_min_credits,
  creative_boost_max_credits,
  creative_boost_price_per_credit
)
VALUES (
  'f0000000-0000-0000-0000-000000000002',
  'e0000000-0000-0000-0000-000000000001',  -- Test Client - Retainer 2025
  'a0000000-0000-0000-0000-000000000002',  -- Creative Boost service
  'Creative Boost',
  75000,  -- 50 credits × 1500 Kč
  'monthly',
  'CZK',
  true,
  30,     -- min credits
  50,     -- max credits (balíček)
  1500    -- cena za kredit
)
ON CONFLICT (id) DO UPDATE SET
  creative_boost_min_credits = EXCLUDED.creative_boost_min_credits,
  creative_boost_max_credits = EXCLUDED.creative_boost_max_credits,
  creative_boost_price_per_credit = EXCLUDED.creative_boost_price_per_credit;
