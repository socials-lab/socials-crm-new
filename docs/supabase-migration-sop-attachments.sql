-- Storage bucket for SOP attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('sop-attachments', 'sop-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: CRM users can upload files
CREATE POLICY "CRM users can upload sop attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'sop-attachments' AND is_crm_user(auth.uid()));

-- RLS: Anyone authenticated can read (download)
CREATE POLICY "CRM users can read sop attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'sop-attachments' AND is_crm_user(auth.uid()));

-- RLS: Admins can delete attachments
CREATE POLICY "Admins can delete sop attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'sop-attachments' AND is_admin(auth.uid()));

-- Add attachments JSONB column to sop_articles
-- Format: [{ "name": "checklist.pdf", "path": "article-id/file.pdf", "size": 12345, "type": "application/pdf" }]
ALTER TABLE public.sop_articles
  ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
