-- Migration: Add notice period enforcement trigger
-- Prevents terminating engagements before notice period expires (super admin can override)

CREATE OR REPLACE FUNCTION validate_notice_period()
RETURNS TRIGGER AS $$
DECLARE
  v_is_super_admin BOOLEAN;
  v_notice_end_date DATE;
BEGIN
  -- Only check when transitioning to terminal status (completed or cancelled)
  IF NEW.status NOT IN ('completed', 'cancelled') THEN
    RETURN NEW;
  END IF;

  -- If no status change, allow
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- If no notice period set, allow
  IF NEW.notice_period_months IS NULL OR NEW.notice_period_months = 0 THEN
    RETURN NEW;
  END IF;

  -- Check if user is super admin (they can override)
  SELECT is_user_super_admin() INTO v_is_super_admin;
  IF v_is_super_admin THEN
    RETURN NEW;
  END IF;

  -- Calculate notice period end date
  v_notice_end_date := NEW.start_date + (NEW.notice_period_months || ' months')::INTERVAL;

  -- Check if notice period has passed
  IF CURRENT_DATE < v_notice_end_date THEN
    RAISE EXCEPTION 'Nelze ukončit zakázku před vypršením výpovědní lhůty (%). Pouze super admin může tuto podmínku přeskočit.',
      v_notice_end_date
    USING HINT = 'Výpovědní lhůta činí ' || NEW.notice_period_months || ' měsíců od začátku zakázky.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on engagements
DROP TRIGGER IF EXISTS check_notice_period ON engagements;
CREATE TRIGGER check_notice_period
  BEFORE UPDATE ON engagements
  FOR EACH ROW
  EXECUTE FUNCTION validate_notice_period();

-- Add comment for documentation
COMMENT ON FUNCTION validate_notice_period() IS 'Enforces notice period before engagement termination. Super admins can override.';
