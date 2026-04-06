SET ROLE postgres;

ALTER TABLE public.marketing_work_logs
  ADD COLUMN IF NOT EXISTS main_activity TEXT;

ALTER TABLE public.marketing_work_logs
  DROP CONSTRAINT IF EXISTS marketing_work_logs_main_activity_check;

ALTER TABLE public.marketing_work_logs
  ADD CONSTRAINT marketing_work_logs_main_activity_check
  CHECK (
    main_activity IS NULL
    OR main_activity IN (
      'content_management',
      'video_editing_production',
      'podcast_postproduction',
      'graphic_design'
    )
  );

UPDATE public.marketing_work_logs
SET main_activity = CASE
  WHEN title = 'Podcast' THEN 'podcast_postproduction'
  WHEN role = 'content_manager' THEN 'content_management'
  WHEN role = 'graphic_designer' THEN 'graphic_design'
  ELSE 'video_editing_production'
END
WHERE main_activity IS NULL;
