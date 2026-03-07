ALTER TABLE public.engagements
ADD COLUMN IF NOT EXISTS managed_countries text[] DEFAULT '{}'::text[];
