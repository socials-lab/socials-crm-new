SET ROLE postgres;

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
      'graphic_design',
      'other'
    )
  );
