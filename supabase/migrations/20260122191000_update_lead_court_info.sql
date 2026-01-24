-- Update existing lead with court info from ARES
UPDATE public.leads
SET 
  court_name = 'Městský soud v Praze',
  court_file_number = 'C 223554/MSPH'
WHERE id = '761d27e2-d7a3-4b0b-b03c-068e236cd4db'
  AND court_name IS NULL;
