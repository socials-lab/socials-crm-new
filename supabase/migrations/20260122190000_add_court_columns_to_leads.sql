-- Add court registration columns to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS court_name text,
ADD COLUMN IF NOT EXISTS court_file_number text;

-- Add comments
COMMENT ON COLUMN public.leads.court_name IS 'Název soudu (z obchodního rejstříku)';
COMMENT ON COLUMN public.leads.court_file_number IS 'Spisová značka v obchodním rejstříku';
