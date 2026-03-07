UPDATE public.colleagues
SET email_signature = public.build_default_email_signature(full_name, position);
