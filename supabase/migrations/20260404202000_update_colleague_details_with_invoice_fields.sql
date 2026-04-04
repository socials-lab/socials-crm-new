CREATE OR REPLACE FUNCTION public.update_colleague_details(
  p_colleague_id UUID,
  p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    is_admin_or_management(auth.uid())
    OR p_colleague_id = get_colleague_id(auth.uid())
  ) THEN
    RAISE EXCEPTION 'Nemáte oprávnění upravit tohoto kolegu';
  END IF;

  UPDATE public.colleagues
  SET
    full_name = CASE WHEN p_payload ? 'full_name' THEN p_payload->>'full_name' ELSE full_name END,
    email = CASE WHEN p_payload ? 'email' THEN p_payload->>'email' ELSE email END,
    phone = CASE WHEN p_payload ? 'phone' THEN p_payload->>'phone' ELSE phone END,
    position = CASE WHEN p_payload ? 'position' THEN p_payload->>'position' ELSE position END,
    seniority = CASE WHEN p_payload ? 'seniority' THEN (p_payload->>'seniority')::public.seniority ELSE seniority END,
    is_freelancer = CASE WHEN p_payload ? 'is_freelancer' THEN (p_payload->>'is_freelancer')::BOOLEAN ELSE is_freelancer END,
    internal_hourly_cost = CASE WHEN p_payload ? 'internal_hourly_cost' THEN (p_payload->>'internal_hourly_cost')::NUMERIC ELSE internal_hourly_cost END,
    monthly_fixed_cost = CASE WHEN p_payload ? 'monthly_fixed_cost' THEN (p_payload->>'monthly_fixed_cost')::NUMERIC ELSE monthly_fixed_cost END,
    max_engagements = CASE WHEN p_payload ? 'max_engagements' THEN (p_payload->>'max_engagements')::INTEGER ELSE max_engagements END,
    capacity_slots = CASE WHEN p_payload ? 'capacity_slots' THEN p_payload->'capacity_slots' ELSE capacity_slots END,
    status = CASE WHEN p_payload ? 'status' THEN (p_payload->>'status')::public.colleague_status ELSE status END,
    notes = CASE WHEN p_payload ? 'notes' THEN p_payload->>'notes' ELSE notes END,
    birthday = CASE WHEN p_payload ? 'birthday' THEN (p_payload->>'birthday')::DATE ELSE birthday END,
    personal_email = CASE WHEN p_payload ? 'personal_email' THEN p_payload->>'personal_email' ELSE personal_email END,
    ico = CASE WHEN p_payload ? 'ico' THEN p_payload->>'ico' ELSE ico END,
    dic = CASE WHEN p_payload ? 'dic' THEN p_payload->>'dic' ELSE dic END,
    company_name = CASE WHEN p_payload ? 'company_name' THEN p_payload->>'company_name' ELSE company_name END,
    billing_street = CASE WHEN p_payload ? 'billing_street' THEN p_payload->>'billing_street' ELSE billing_street END,
    billing_city = CASE WHEN p_payload ? 'billing_city' THEN p_payload->>'billing_city' ELSE billing_city END,
    billing_zip = CASE WHEN p_payload ? 'billing_zip' THEN p_payload->>'billing_zip' ELSE billing_zip END,
    bank_account = CASE WHEN p_payload ? 'bank_account' THEN p_payload->>'bank_account' ELSE bank_account END,
    invoice_display_name = CASE WHEN p_payload ? 'invoice_display_name' THEN p_payload->>'invoice_display_name' ELSE invoice_display_name END,
    invoice_currency = CASE WHEN p_payload ? 'invoice_currency' THEN (p_payload->>'invoice_currency')::text ELSE invoice_currency END,
    updated_at = NOW()
  WHERE id = p_colleague_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kolega nebyl nalezen';
  END IF;
END;
$$;
