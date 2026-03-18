UPDATE public.email_templates
SET
  name = 'Žádost o schůzku',
  description = 'Email s odkazem na sjednání online schůzky.',
  subject_template = 'Schůzka ohledně spolupráce - {company} / Socials',
  body_template = 'Dobrý den {name},\n\nděkuji za Váš zájem o spolupráci.\n\nRádi bychom si s Vámi domluvili krátký telefonát, abychom zjistili, jak Vám můžeme nejlépe pomoci.\n\nSjednejte si se mnou hovor kliknutím na odkaz níže:\n👉 {meeting_url}\n\nDěkuji a budu se těšit na náš rozhovor.\n\n{signature}',
  available_variables = ARRAY['name', 'company', 'meeting_url', 'signature']::text[]
WHERE template_key = 'meeting_request';
