-- Atomic assignment + Creative Boost reward updates.
-- Prevent partial writes where assignment is saved but service reward update fails (or vice versa).

CREATE OR REPLACE FUNCTION public.create_assignment_with_cb_rewards(
  p_engagement_id uuid,
  p_engagement_service_id uuid,
  p_colleague_id uuid,
  p_role_on_engagement text,
  p_cost_model public.cost_model,
  p_hourly_cost numeric,
  p_monthly_cost numeric,
  p_percentage_of_revenue numeric,
  p_reward_per_credit numeric,
  p_reward_per_credit_banner numeric,
  p_reward_per_credit_video numeric,
  p_start_date date,
  p_end_date date,
  p_notes text,
  p_cb_service_id uuid DEFAULT NULL,
  p_cb_reward_banner numeric DEFAULT NULL,
  p_cb_reward_video numeric DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_assignment_id uuid;
BEGIN
  IF p_cb_service_id IS NOT NULL THEN
    UPDATE public.engagement_services
    SET
      creative_boost_reward_per_credit_banner = p_cb_reward_banner,
      creative_boost_reward_per_credit_video = p_cb_reward_video
    WHERE id = p_cb_service_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Creative Boost service % not found for atomic assignment create.', p_cb_service_id;
    END IF;
  END IF;

  INSERT INTO public.engagement_assignments (
    engagement_id,
    engagement_service_id,
    colleague_id,
    role_on_engagement,
    cost_model,
    hourly_cost,
    monthly_cost,
    percentage_of_revenue,
    reward_per_credit,
    reward_per_credit_banner,
    reward_per_credit_video,
    start_date,
    end_date,
    notes
  ) VALUES (
    p_engagement_id,
    p_engagement_service_id,
    p_colleague_id,
    p_role_on_engagement,
    p_cost_model,
    p_hourly_cost,
    p_monthly_cost,
    p_percentage_of_revenue,
    p_reward_per_credit,
    p_reward_per_credit_banner,
    p_reward_per_credit_video,
    p_start_date,
    p_end_date,
    p_notes
  )
  RETURNING id INTO v_assignment_id;

  RETURN v_assignment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_assignment_with_cb_rewards(
  p_assignment_id uuid,
  p_role_on_engagement text,
  p_cost_model public.cost_model,
  p_hourly_cost numeric,
  p_monthly_cost numeric,
  p_percentage_of_revenue numeric,
  p_reward_per_credit numeric,
  p_reward_per_credit_banner numeric,
  p_reward_per_credit_video numeric,
  p_notes text,
  p_cb_service_id uuid DEFAULT NULL,
  p_cb_reward_banner numeric DEFAULT NULL,
  p_cb_reward_video numeric DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF p_cb_service_id IS NOT NULL THEN
    UPDATE public.engagement_services
    SET
      creative_boost_reward_per_credit_banner = p_cb_reward_banner,
      creative_boost_reward_per_credit_video = p_cb_reward_video
    WHERE id = p_cb_service_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Creative Boost service % not found for atomic assignment update.', p_cb_service_id;
    END IF;
  END IF;

  UPDATE public.engagement_assignments
  SET
    role_on_engagement = p_role_on_engagement,
    cost_model = p_cost_model,
    hourly_cost = p_hourly_cost,
    monthly_cost = p_monthly_cost,
    percentage_of_revenue = p_percentage_of_revenue,
    reward_per_credit = p_reward_per_credit,
    reward_per_credit_banner = p_reward_per_credit_banner,
    reward_per_credit_video = p_reward_per_credit_video,
    notes = p_notes
  WHERE id = p_assignment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment % not found for atomic update.', p_assignment_id;
  END IF;
END;
$$;
