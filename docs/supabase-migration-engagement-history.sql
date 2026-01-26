-- Migration: Engagement History Log
-- This creates a comprehensive audit log for engagement changes

-- 1. Create the engagement_history table
CREATE TABLE IF NOT EXISTS public.engagement_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id uuid REFERENCES public.engagements(id) ON DELETE CASCADE NOT NULL,
    entity_type text NOT NULL, -- 'assignment', 'service', 'engagement'
    entity_id uuid, -- ID of the assignment or service
    change_type text NOT NULL, -- 'created', 'updated', 'deleted'
    field_name text, -- specific field that changed (null for create/delete)
    old_value text, -- previous value (as text for flexibility)
    new_value text, -- new value (as text for flexibility)
    changed_by uuid, -- who made the change (may be null for system changes)
    changed_at timestamp with time zone DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb -- additional context like colleague name, service name
);

-- 2. Enable RLS
ALTER TABLE public.engagement_history ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
CREATE POLICY "CRM users can read engagement_history"
ON public.engagement_history FOR SELECT
USING (is_crm_user(auth.uid()));

CREATE POLICY "CRM users can manage engagement_history"
ON public.engagement_history FOR ALL
USING (is_crm_user(auth.uid()));

-- 4. Create trigger function for engagement_assignments
CREATE OR REPLACE FUNCTION public.log_assignment_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    colleague_name TEXT;
    v_change_type TEXT;
BEGIN
    -- Get colleague name for metadata
    IF TG_OP = 'DELETE' THEN
        SELECT full_name INTO colleague_name FROM colleagues WHERE id = OLD.colleague_id;
    ELSE
        SELECT full_name INTO colleague_name FROM colleagues WHERE id = NEW.colleague_id;
    END IF;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO engagement_history (
            engagement_id, entity_type, entity_id, change_type, 
            field_name, old_value, new_value, changed_by, metadata
        ) VALUES (
            NEW.engagement_id, 'assignment', NEW.id, 'created',
            NULL, NULL, NULL, auth.uid(),
            jsonb_build_object(
                'colleague_name', colleague_name,
                'colleague_id', NEW.colleague_id,
                'cost_model', NEW.cost_model,
                'monthly_cost', NEW.monthly_cost,
                'hourly_cost', NEW.hourly_cost,
                'percentage_of_revenue', NEW.percentage_of_revenue,
                'role_on_engagement', NEW.role_on_engagement
            )
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Log cost_model changes
        IF OLD.cost_model IS DISTINCT FROM NEW.cost_model THEN
            INSERT INTO engagement_history (engagement_id, entity_type, entity_id, change_type, field_name, old_value, new_value, changed_by, metadata)
            VALUES (NEW.engagement_id, 'assignment', NEW.id, 'updated', 'cost_model', OLD.cost_model::text, NEW.cost_model::text, auth.uid(), jsonb_build_object('colleague_name', colleague_name));
        END IF;
        -- Log monthly_cost changes
        IF OLD.monthly_cost IS DISTINCT FROM NEW.monthly_cost THEN
            INSERT INTO engagement_history (engagement_id, entity_type, entity_id, change_type, field_name, old_value, new_value, changed_by, metadata)
            VALUES (NEW.engagement_id, 'assignment', NEW.id, 'updated', 'monthly_cost', OLD.monthly_cost::text, NEW.monthly_cost::text, auth.uid(), jsonb_build_object('colleague_name', colleague_name));
        END IF;
        -- Log hourly_cost changes
        IF OLD.hourly_cost IS DISTINCT FROM NEW.hourly_cost THEN
            INSERT INTO engagement_history (engagement_id, entity_type, entity_id, change_type, field_name, old_value, new_value, changed_by, metadata)
            VALUES (NEW.engagement_id, 'assignment', NEW.id, 'updated', 'hourly_cost', OLD.hourly_cost::text, NEW.hourly_cost::text, auth.uid(), jsonb_build_object('colleague_name', colleague_name));
        END IF;
        -- Log percentage_of_revenue changes
        IF OLD.percentage_of_revenue IS DISTINCT FROM NEW.percentage_of_revenue THEN
            INSERT INTO engagement_history (engagement_id, entity_type, entity_id, change_type, field_name, old_value, new_value, changed_by, metadata)
            VALUES (NEW.engagement_id, 'assignment', NEW.id, 'updated', 'percentage_of_revenue', OLD.percentage_of_revenue::text, NEW.percentage_of_revenue::text, auth.uid(), jsonb_build_object('colleague_name', colleague_name));
        END IF;
        -- Log role_on_engagement changes
        IF OLD.role_on_engagement IS DISTINCT FROM NEW.role_on_engagement THEN
            INSERT INTO engagement_history (engagement_id, entity_type, entity_id, change_type, field_name, old_value, new_value, changed_by, metadata)
            VALUES (NEW.engagement_id, 'assignment', NEW.id, 'updated', 'role_on_engagement', OLD.role_on_engagement, NEW.role_on_engagement, auth.uid(), jsonb_build_object('colleague_name', colleague_name));
        END IF;
        -- Log end_date changes (colleague removed)
        IF OLD.end_date IS DISTINCT FROM NEW.end_date THEN
            INSERT INTO engagement_history (engagement_id, entity_type, entity_id, change_type, field_name, old_value, new_value, changed_by, metadata)
            VALUES (NEW.engagement_id, 'assignment', NEW.id, 'updated', 'end_date', OLD.end_date::text, NEW.end_date::text, auth.uid(), jsonb_build_object('colleague_name', colleague_name));
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO engagement_history (
            engagement_id, entity_type, entity_id, change_type, 
            field_name, old_value, new_value, changed_by, metadata
        ) VALUES (
            OLD.engagement_id, 'assignment', OLD.id, 'deleted',
            NULL, NULL, NULL, auth.uid(),
            jsonb_build_object('colleague_name', colleague_name, 'colleague_id', OLD.colleague_id)
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- 5. Create trigger function for engagement_services
CREATE OR REPLACE FUNCTION public.log_service_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO engagement_history (
            engagement_id, entity_type, entity_id, change_type, 
            field_name, old_value, new_value, changed_by, metadata
        ) VALUES (
            NEW.engagement_id, 'service', NEW.id, 'created',
            NULL, NULL, NULL, auth.uid(),
            jsonb_build_object(
                'service_name', NEW.name,
                'price', NEW.price,
                'currency', NEW.currency,
                'billing_type', NEW.billing_type,
                'selected_tier', NEW.selected_tier
            )
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Log price changes
        IF OLD.price IS DISTINCT FROM NEW.price THEN
            INSERT INTO engagement_history (engagement_id, entity_type, entity_id, change_type, field_name, old_value, new_value, changed_by, metadata)
            VALUES (NEW.engagement_id, 'service', NEW.id, 'updated', 'price', OLD.price::text, NEW.price::text, auth.uid(), jsonb_build_object('service_name', NEW.name));
        END IF;
        -- Log name changes
        IF OLD.name IS DISTINCT FROM NEW.name THEN
            INSERT INTO engagement_history (engagement_id, entity_type, entity_id, change_type, field_name, old_value, new_value, changed_by, metadata)
            VALUES (NEW.engagement_id, 'service', NEW.id, 'updated', 'name', OLD.name, NEW.name, auth.uid(), jsonb_build_object('service_name', NEW.name));
        END IF;
        -- Log is_active changes (service deactivated/activated)
        IF OLD.is_active IS DISTINCT FROM NEW.is_active THEN
            INSERT INTO engagement_history (engagement_id, entity_type, entity_id, change_type, field_name, old_value, new_value, changed_by, metadata)
            VALUES (NEW.engagement_id, 'service', NEW.id, 'updated', 'is_active', OLD.is_active::text, NEW.is_active::text, auth.uid(), jsonb_build_object('service_name', NEW.name));
        END IF;
        -- Log selected_tier changes
        IF OLD.selected_tier IS DISTINCT FROM NEW.selected_tier THEN
            INSERT INTO engagement_history (engagement_id, entity_type, entity_id, change_type, field_name, old_value, new_value, changed_by, metadata)
            VALUES (NEW.engagement_id, 'service', NEW.id, 'updated', 'selected_tier', OLD.selected_tier::text, NEW.selected_tier::text, auth.uid(), jsonb_build_object('service_name', NEW.name));
        END IF;
        -- Log billing_type changes
        IF OLD.billing_type IS DISTINCT FROM NEW.billing_type THEN
            INSERT INTO engagement_history (engagement_id, entity_type, entity_id, change_type, field_name, old_value, new_value, changed_by, metadata)
            VALUES (NEW.engagement_id, 'service', NEW.id, 'updated', 'billing_type', OLD.billing_type, NEW.billing_type, auth.uid(), jsonb_build_object('service_name', NEW.name));
        END IF;
        -- Log Creative Boost specific changes
        IF OLD.creative_boost_min_credits IS DISTINCT FROM NEW.creative_boost_min_credits THEN
            INSERT INTO engagement_history (engagement_id, entity_type, entity_id, change_type, field_name, old_value, new_value, changed_by, metadata)
            VALUES (NEW.engagement_id, 'service', NEW.id, 'updated', 'creative_boost_min_credits', OLD.creative_boost_min_credits::text, NEW.creative_boost_min_credits::text, auth.uid(), jsonb_build_object('service_name', NEW.name));
        END IF;
        IF OLD.creative_boost_max_credits IS DISTINCT FROM NEW.creative_boost_max_credits THEN
            INSERT INTO engagement_history (engagement_id, entity_type, entity_id, change_type, field_name, old_value, new_value, changed_by, metadata)
            VALUES (NEW.engagement_id, 'service', NEW.id, 'updated', 'creative_boost_max_credits', OLD.creative_boost_max_credits::text, NEW.creative_boost_max_credits::text, auth.uid(), jsonb_build_object('service_name', NEW.name));
        END IF;
        IF OLD.creative_boost_price_per_credit IS DISTINCT FROM NEW.creative_boost_price_per_credit THEN
            INSERT INTO engagement_history (engagement_id, entity_type, entity_id, change_type, field_name, old_value, new_value, changed_by, metadata)
            VALUES (NEW.engagement_id, 'service', NEW.id, 'updated', 'creative_boost_price_per_credit', OLD.creative_boost_price_per_credit::text, NEW.creative_boost_price_per_credit::text, auth.uid(), jsonb_build_object('service_name', NEW.name));
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO engagement_history (
            engagement_id, entity_type, entity_id, change_type, 
            field_name, old_value, new_value, changed_by, metadata
        ) VALUES (
            OLD.engagement_id, 'service', OLD.id, 'deleted',
            NULL, NULL, NULL, auth.uid(),
            jsonb_build_object('service_name', OLD.name)
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- 6. Create triggers
CREATE TRIGGER log_assignment_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.engagement_assignments
FOR EACH ROW EXECUTE FUNCTION public.log_assignment_changes();

CREATE TRIGGER log_service_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.engagement_services
FOR EACH ROW EXECUTE FUNCTION public.log_service_changes();

-- 7. Create index for faster queries
CREATE INDEX idx_engagement_history_engagement_id ON public.engagement_history(engagement_id);
CREATE INDEX idx_engagement_history_changed_at ON public.engagement_history(changed_at DESC);
