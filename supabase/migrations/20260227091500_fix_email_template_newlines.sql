-- Convert mistakenly escaped "\n" sequences to real newlines in seeded templates.
UPDATE public.email_templates
SET
  subject_template = REPLACE(subject_template, '\n', E'\n'),
  body_template = REPLACE(body_template, '\n', E'\n')
WHERE subject_template LIKE '%\\n%'
   OR body_template LIKE '%\\n%';
