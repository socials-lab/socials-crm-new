-- Allow soft-deleting engagements without termination-status blockers.
-- Deletion in app is implemented as UPDATE deleted_at + status='cancelled'.
-- When deleted_at is being set, skip status-transition and notice-period rules.

CREATE OR REPLACE FUNCTION public.validate_engagement_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_super_admin BOOLEAN;
BEGIN
  -- Soft-delete flow should not be blocked by status transition checks.
  IF NEW.deleted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Skip if status hasn't changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Check if user is super admin
  v_is_super_admin := is_user_super_admin();

  -- Check standard transitions
  IF (OLD.status = 'planned' AND NEW.status IN ('active', 'cancelled')) OR
     (OLD.status = 'active' AND NEW.status IN ('paused', 'completed', 'cancelled')) OR
     (OLD.status = 'paused' AND NEW.status IN ('active', 'completed', 'cancelled')) THEN
    RETURN NEW;
  END IF;

  -- Check admin-only transitions
  IF v_is_super_admin THEN
    IF (OLD.status = 'completed' AND NEW.status = 'active') OR
       (OLD.status = 'cancelled' AND NEW.status = 'active') THEN
      RETURN NEW;
    END IF;
  END IF;

  RAISE EXCEPTION 'Invalid engagement status transition from % to %. Only super admins can reopen completed/cancelled engagements.', OLD.status, NEW.status
    USING HINT = 'Contact a super admin to change this status';
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_notice_period()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_super_admin BOOLEAN;
  v_notice_end_date DATE;
BEGIN
  -- Soft-delete flow should not be blocked by notice period checks.
  IF NEW.deleted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

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
$$;
