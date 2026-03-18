ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS meeting_schedule_url text;

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS meeting_request_sent_at timestamptz;

INSERT INTO public.email_templates (
  template_key,
  name,
  description,
  subject_template,
  body_template,
  available_variables
)
VALUES (
  'meeting_request',
  'Žádost o schůzku',
  'Email s odkazem na sjednání online schůzky.',
  'Schůzka ohledně spolupráce - {company} / Socials',
  'Dobrý den {name},\n\nděkuji za Váš zájem o spolupráci.\n\nRádi bychom si s Vámi domluvili krátký telefonát, abychom zjistili, jak Vám můžeme nejlépe pomoci.\n\nSjednejte si se mnou hovor kliknutím na odkaz níže:\n👉 {meeting_url}\n\nDěkuji a budu se těšit na náš rozhovor.\n\n{signature}',
  ARRAY['name', 'company', 'meeting_url', 'signature']::text[]
)
ON CONFLICT (template_key) DO NOTHING;
