CREATE OR REPLACE FUNCTION public.build_default_email_signature(signature_name text, signature_position text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT format(
    '%s\n%s\n\nSocials.cz\n\n🌐 www.socials.cz\n🎙️ Poslechněte si Socials Podcast (link: https://www.youtube.com/@socials_cz/videos)\n\n💡 Pomáháme firmám získávat zákazníky díky výkonnostní reklamě.',
    COALESCE(trim(signature_name), ''),
    COALESCE(trim(signature_position), '')
  );
$$;

CREATE OR REPLACE FUNCTION public.set_default_colleague_email_signature()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.email_signature IS NULL OR btrim(NEW.email_signature) = '' THEN
    NEW.email_signature := public.build_default_email_signature(NEW.full_name, NEW.position);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_default_colleague_email_signature ON public.colleagues;

CREATE TRIGGER set_default_colleague_email_signature
BEFORE INSERT OR UPDATE OF full_name, position, email_signature
ON public.colleagues
FOR EACH ROW
EXECUTE FUNCTION public.set_default_colleague_email_signature();

UPDATE public.colleagues
SET email_signature = public.build_default_email_signature(full_name, position)
WHERE email_signature IS NULL OR btrim(email_signature) = '';
