SET ROLE postgres;

CREATE TABLE IF NOT EXISTS public.notification_email_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type public.notification_type NOT NULL UNIQUE,
  recipient_emails TEXT[] NOT NULL DEFAULT '{}'::text[],
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notification_email_routes_type_idx
  ON public.notification_email_routes (notification_type);

ALTER TABLE public.notification_email_routes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CRM users can read notification_email_routes" ON public.notification_email_routes;
CREATE POLICY "CRM users can read notification_email_routes"
  ON public.notification_email_routes
  FOR SELECT
  TO authenticated
  USING (has_crm_access(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage notification_email_routes" ON public.notification_email_routes;
CREATE POLICY "Admins can manage notification_email_routes"
  ON public.notification_email_routes
  FOR ALL
  TO authenticated
  USING (
    has_crm_access(auth.uid())
    AND (
      is_super_admin(auth.uid())
      OR is_admin_or_management(auth.uid())
    )
  )
  WITH CHECK (
    has_crm_access(auth.uid())
    AND (
      is_super_admin(auth.uid())
      OR is_admin_or_management(auth.uid())
    )
  );

-- Seed route rows for all notification types.
INSERT INTO public.notification_email_routes (notification_type)
SELECT enum_val::public.notification_type
FROM unnest(ARRAY[
  'new_lead',
  'form_completed',
  'contract_signed',
  'lead_converted',
  'access_granted',
  'offer_sent',
  'colleague_birthday',
  'new_feedback_idea'
]) AS enum_val
ON CONFLICT (notification_type) DO NOTHING;

-- Required routing change requested by business:
-- New leads + onboarding completion must always notify both Danny and David.
UPDATE public.notification_email_routes
SET
  recipient_emails = ARRAY['danny@socials.cz', 'david.hala@socials.cz'],
  is_enabled = TRUE,
  updated_at = now()
WHERE notification_type IN ('new_lead', 'form_completed');
