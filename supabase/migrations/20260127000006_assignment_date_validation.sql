-- Migration: Add assignment date validation
-- Ensures assignment dates fall within engagement period

-- Create trigger function to validate assignment dates
CREATE OR REPLACE FUNCTION validate_assignment_dates()
RETURNS TRIGGER AS $$
DECLARE
  v_engagement_start DATE;
  v_engagement_end DATE;
BEGIN
  -- Get engagement dates
  SELECT start_date, end_date
  INTO v_engagement_start, v_engagement_end
  FROM engagements
  WHERE id = NEW.engagement_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Engagement not found';
  END IF;

  -- Assignment start_date cannot be before engagement start_date
  IF NEW.start_date < v_engagement_start THEN
    RAISE EXCEPTION 'Assignment start date (%) cannot be before engagement start date (%)',
      NEW.start_date, v_engagement_start;
  END IF;

  -- If engagement has an end date, assignment start cannot be after it
  IF v_engagement_end IS NOT NULL AND NEW.start_date > v_engagement_end THEN
    RAISE EXCEPTION 'Assignment start date (%) cannot be after engagement end date (%)',
      NEW.start_date, v_engagement_end;
  END IF;

  -- If assignment has end_date, validate it as well
  IF NEW.end_date IS NOT NULL THEN
    -- Assignment end_date must be on or after start_date
    IF NEW.end_date < NEW.start_date THEN
      RAISE EXCEPTION 'Assignment end date (%) cannot be before assignment start date (%)',
        NEW.end_date, NEW.start_date;
    END IF;

    -- If engagement has end_date, assignment end cannot exceed it
    IF v_engagement_end IS NOT NULL AND NEW.end_date > v_engagement_end THEN
      RAISE EXCEPTION 'Assignment end date (%) cannot be after engagement end date (%)',
        NEW.end_date, v_engagement_end;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on engagement_assignments
DROP TRIGGER IF EXISTS check_assignment_dates ON engagement_assignments;
CREATE TRIGGER check_assignment_dates
  BEFORE INSERT OR UPDATE ON engagement_assignments
  FOR EACH ROW
  EXECUTE FUNCTION validate_assignment_dates();

-- Add comment for documentation
COMMENT ON FUNCTION validate_assignment_dates() IS 'Validates that assignment dates fall within the engagement period';
