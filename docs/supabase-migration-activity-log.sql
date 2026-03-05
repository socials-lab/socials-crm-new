-- Create user_activity_log table
CREATE TABLE public.user_activity_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    action text NOT NULL,
    entity_type text,
    entity_id uuid,
    entity_name text,
    metadata jsonb,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- Super admins can read all logs
CREATE POLICY "Admins can read all activity logs"
ON public.user_activity_log
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Users can read their own logs
CREATE POLICY "Users can read own activity logs"
ON public.user_activity_log
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Any authenticated user can insert their own logs
CREATE POLICY "Users can insert own activity logs"
ON public.user_activity_log
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create index for fast lookups
CREATE INDEX idx_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX idx_activity_log_created_at ON public.user_activity_log(created_at DESC);
