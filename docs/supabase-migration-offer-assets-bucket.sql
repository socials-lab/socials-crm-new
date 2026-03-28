-- Create storage bucket for offer assets (client logos, certifications)
INSERT INTO storage.buckets (id, name, public)
VALUES ('offer-assets', 'offer-assets', true);

-- Allow anyone to view files (public bucket)
CREATE POLICY "Public can view offer assets"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'offer-assets');

-- CRM users can upload
CREATE POLICY "CRM users can upload offer assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'offer-assets' AND is_crm_user(auth.uid()));

-- CRM users can delete
CREATE POLICY "CRM users can delete offer assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'offer-assets' AND is_crm_user(auth.uid()));

-- CRM users can update
CREATE POLICY "CRM users can update offer assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'offer-assets' AND is_crm_user(auth.uid()));
