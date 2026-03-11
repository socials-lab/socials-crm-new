CREATE OR REPLACE FUNCTION public.build_default_email_signature(signature_name text, signature_position text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    COALESCE(trim(signature_name), '')
    || E'\n'
    || COALESCE(trim(signature_position), '')
    || E'\n\nSocials.cz\n\n🌐 www.socials.cz\n🎙️ Poslechněte si [Socials Podcast](https://www.youtube.com/@socials_cz/videos)\n\n💡 Pomáháme firmám získávat zákazníky díky výkonnostní reklamě.';
$$;

UPDATE public.colleagues
SET email_signature = public.build_default_email_signature(full_name, position);
