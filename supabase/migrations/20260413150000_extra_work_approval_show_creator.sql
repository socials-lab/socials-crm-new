-- Public extra work approval should show who created the record in CRM.
-- Fallback order: creator from history -> upsell owner -> execution colleague.

CREATE OR REPLACE FUNCTION get_extra_work_by_approval_token(p_token UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  amount DECIMAL,
  currency TEXT,
  hours_worked DECIMAL,
  hourly_rate DECIMAL,
  status TEXT,
  client_name TEXT,
  engagement_name TEXT,
  colleague_name TEXT,
  client_approved_at TIMESTAMPTZ,
  client_rejected_at TIMESTAMPTZ,
  client_rejection_reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ew.id,
    ew.name,
    ew.description,
    ew.amount,
    ew.currency,
    ew.hours_worked,
    ew.hourly_rate,
    ew.status::TEXT,
    c.name AS client_name,
    e.name AS engagement_name,
    COALESCE(
      NULLIF(ew_created.changed_by_name, ''),
      upsold_col.full_name,
      col.full_name
    ) AS colleague_name,
    ew.client_approved_at,
    ew.client_rejected_at,
    ew.client_rejection_reason
  FROM extra_works ew
  LEFT JOIN clients c ON ew.client_id = c.id
  LEFT JOIN engagements e ON ew.engagement_id = e.id
  LEFT JOIN colleagues col ON ew.colleague_id = col.id
  LEFT JOIN colleagues upsold_col ON ew.upsold_by_id = upsold_col.id
  LEFT JOIN LATERAL (
    SELECT ewh.changed_by_name
    FROM extra_work_history ewh
    WHERE ewh.extra_work_id = ew.id
      AND ewh.change_type = 'created'
    ORDER BY ewh.created_at ASC
    LIMIT 1
  ) ew_created ON TRUE
  WHERE ew.approval_token = p_token
    AND ew.deleted_at IS NULL;
END;
$$;

