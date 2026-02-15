-- Create table for public Creative Boost shares
-- This enables token-based public access to view CB pricing for a specific client/month

CREATE TABLE IF NOT EXISTS creative_boost_public_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  client_month_id UUID NOT NULL REFERENCES creative_boost_client_months(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Snapshot data at time of share creation
  client_name TEXT NOT NULL,
  brand_name TEXT,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  max_credits INTEGER NOT NULL,
  price_per_credit DECIMAL(12,2) NOT NULL,

  -- Tracking
  view_count INTEGER NOT NULL DEFAULT 0,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table for storing output snapshots
CREATE TABLE IF NOT EXISTS creative_boost_share_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id UUID NOT NULL REFERENCES creative_boost_public_shares(id) ON DELETE CASCADE,
  output_type_name TEXT NOT NULL,
  category TEXT NOT NULL,
  base_credits DECIMAL(5,2) NOT NULL,
  normal_count INTEGER NOT NULL DEFAULT 0,
  express_count INTEGER NOT NULL DEFAULT 0,
  credits DECIMAL(10,2) NOT NULL
);

-- Enable RLS
ALTER TABLE creative_boost_public_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_boost_share_outputs ENABLE ROW LEVEL SECURITY;

-- RLS policies for shares
CREATE POLICY cb_shares_crm_select ON creative_boost_public_shares
  FOR SELECT TO authenticated
  USING (has_crm_access(auth.uid()));

CREATE POLICY cb_shares_crm_insert ON creative_boost_public_shares
  FOR INSERT TO authenticated
  WITH CHECK (has_crm_access(auth.uid()));

CREATE POLICY cb_shares_crm_update ON creative_boost_public_shares
  FOR UPDATE TO authenticated
  USING (has_crm_access(auth.uid()));

-- RLS for share outputs (CRM users can manage)
CREATE POLICY cb_share_outputs_crm_all ON creative_boost_share_outputs
  FOR ALL TO authenticated
  USING (share_id IN (SELECT id FROM creative_boost_public_shares WHERE has_crm_access(auth.uid())));

-- Function to get share data by token (public access)
CREATE OR REPLACE FUNCTION get_creative_boost_share_by_token(p_token UUID)
RETURNS TABLE (
  id UUID,
  token UUID,
  client_name TEXT,
  brand_name TEXT,
  year INTEGER,
  month INTEGER,
  max_credits INTEGER,
  price_per_credit DECIMAL,
  is_active BOOLEAN,
  valid_until TIMESTAMPTZ,
  outputs JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Increment view count
  UPDATE creative_boost_public_shares
  SET view_count = view_count + 1, updated_at = now()
  WHERE creative_boost_public_shares.token = p_token AND is_active = true;

  RETURN QUERY
  SELECT
    s.id,
    s.token,
    s.client_name,
    s.brand_name,
    s.year,
    s.month,
    s.max_credits,
    s.price_per_credit,
    s.is_active,
    s.valid_until,
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'typeName', o.output_type_name,
          'category', o.category,
          'baseCredits', o.base_credits,
          'normalCount', o.normal_count,
          'expressCount', o.express_count,
          'credits', o.credits
        )
      )
      FROM creative_boost_share_outputs o
      WHERE o.share_id = s.id),
      '[]'::jsonb
    ) AS outputs
  FROM creative_boost_public_shares s
  WHERE s.token = p_token
    AND s.is_active = true
    AND (s.valid_until IS NULL OR s.valid_until > now());
END;
$$;

-- Grant execute to anon for public access
GRANT EXECUTE ON FUNCTION get_creative_boost_share_by_token(UUID) TO anon;

-- Function to create a share (authenticated users)
CREATE OR REPLACE FUNCTION create_creative_boost_share(
  p_client_month_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share_id UUID;
  v_token UUID;
  v_client_month RECORD;
  v_client RECORD;
BEGIN
  -- Get client month data
  SELECT * INTO v_client_month
  FROM creative_boost_client_months
  WHERE id = p_client_month_id;

  IF v_client_month IS NULL THEN
    RAISE EXCEPTION 'Client month not found';
  END IF;

  -- Get client data
  SELECT * INTO v_client
  FROM clients
  WHERE id = v_client_month.client_id;

  -- Generate token
  v_token := gen_random_uuid();

  -- Create share record
  INSERT INTO creative_boost_public_shares (
    token,
    client_month_id,
    client_id,
    client_name,
    brand_name,
    year,
    month,
    max_credits,
    price_per_credit,
    created_by
  ) VALUES (
    v_token,
    p_client_month_id,
    v_client_month.client_id,
    v_client.name,
    v_client.brand_name,
    v_client_month.year,
    v_client_month.month,
    v_client_month.max_credits,
    v_client_month.price_per_credit,
    auth.uid()
  ) RETURNING id INTO v_share_id;

  -- Copy current outputs as snapshot
  INSERT INTO creative_boost_share_outputs (
    share_id,
    output_type_name,
    category,
    base_credits,
    normal_count,
    express_count,
    credits
  )
  SELECT
    v_share_id,
    ot.name,
    ot.category::TEXT,
    ot.base_credits,
    COALESCE(o.normal_count, 0),
    COALESCE(o.express_count, 0),
    COALESCE(o.normal_count, 0) * ot.base_credits + COALESCE(o.express_count, 0) * ot.base_credits * 1.5
  FROM output_types ot
  LEFT JOIN creative_boost_outputs o ON o.output_type_id = ot.id
    AND o.client_month_id = p_client_month_id
  WHERE ot.is_active = true
    AND (o.normal_count > 0 OR o.express_count > 0);

  RETURN v_token;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION create_creative_boost_share(UUID) TO authenticated;
