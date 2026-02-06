-- Academy progress tracking table
-- Tracks which videos each user has watched

CREATE TABLE IF NOT EXISTS public.academy_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES public.academy_videos(id) ON DELETE CASCADE,
    watched_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, video_id)
);

-- Enable RLS
ALTER TABLE public.academy_progress ENABLE ROW LEVEL SECURITY;

-- Users can only see their own progress
CREATE POLICY "academy_progress_select" ON public.academy_progress
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Users can only insert their own progress
CREATE POLICY "academy_progress_insert" ON public.academy_progress
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Users can only delete their own progress
CREATE POLICY "academy_progress_delete" ON public.academy_progress
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_academy_progress_user ON public.academy_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_academy_progress_video ON public.academy_progress(video_id);
