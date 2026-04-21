-- Fix applicant delete flow:
-- applicant_history has FK to applicants, so writing a "deleted" history row
-- after removing applicant causes FK violation.
-- Keep insert/update history tracking, skip delete logging.

CREATE OR REPLACE FUNCTION public.trigger_applicant_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_applicant_change(NEW.id, 'created');
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.stage IS DISTINCT FROM NEW.stage THEN
      PERFORM log_applicant_change(NEW.id, 'stage_change', 'stage', 'Stage',
        OLD.stage::TEXT, NEW.stage::TEXT);
    END IF;

    IF OLD.owner_id IS DISTINCT FROM NEW.owner_id THEN
      PERFORM log_applicant_change(NEW.id, 'field_update', 'owner_id', 'Owner',
        COALESCE(OLD.owner_id::TEXT, ''), COALESCE(NEW.owner_id::TEXT, ''));
    END IF;

    IF OLD.converted_to_colleague_id IS NULL AND NEW.converted_to_colleague_id IS NOT NULL THEN
      PERFORM log_applicant_change(NEW.id, 'converted', 'converted_to_colleague_id', 'Converted to Colleague',
        NULL, NEW.converted_to_colleague_id::TEXT);
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
