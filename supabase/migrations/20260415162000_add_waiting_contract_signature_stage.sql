DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumlabel = 'waiting_contract_signature'
      AND enumtypid = 'lead_stage'::regtype
  ) THEN
    ALTER TYPE public.lead_stage ADD VALUE 'waiting_contract_signature';
  END IF;
END $$;
