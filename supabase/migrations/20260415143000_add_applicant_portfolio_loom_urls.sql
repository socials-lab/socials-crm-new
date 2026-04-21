ALTER TABLE public.applicants
  ADD COLUMN IF NOT EXISTS loom_video_url TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_url TEXT;
