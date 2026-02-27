CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  available_variables TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_templates_select_authenticated" ON public.email_templates;
CREATE POLICY "email_templates_select_authenticated"
  ON public.email_templates
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "email_templates_insert_admin" ON public.email_templates;
CREATE POLICY "email_templates_insert_admin"
  ON public.email_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_management(auth.uid()) OR is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "email_templates_update_admin" ON public.email_templates;
CREATE POLICY "email_templates_update_admin"
  ON public.email_templates
  FOR UPDATE
  TO authenticated
  USING (is_admin_or_management(auth.uid()) OR is_super_admin(auth.uid()))
  WITH CHECK (is_admin_or_management(auth.uid()) OR is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "email_templates_delete_super_admin" ON public.email_templates;
CREATE POLICY "email_templates_delete_super_admin"
  ON public.email_templates
  FOR DELETE
  TO authenticated
  USING (is_super_admin(auth.uid()));

DROP TRIGGER IF EXISTS update_email_templates_updated_at ON public.email_templates;
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

INSERT INTO public.email_templates (template_key, name, description, subject_template, body_template, available_variables)
VALUES
  (
    'request_access',
    'Žádost o přístupy',
    'Žádost o nasdílení marketingových přístupů.',
    'Žádost o nasdílení přístupů - {company} / Socials',
    'Dobrý den,\n\nNa základě našeho telefonátu Vás prosíme o nasdílení přístupů do níže uvedených marketingových nástrojů. Uděláme audit a připravíme pro vás nabídku na případnou spolupráci.\n\nGoogle Analytics 4 - Přístup na úrovni celého účtu s oprávněním "Čtení" pošlete na e-mail analytics@socials.cz\n\nFacebook Business Manager - Přidejte nás jako partnery (ID našeho účtu: 1196977750459552) s nejnižší úrovní přístupů k těmto položkám: Reklamní účet, Katalog produktů, Meta Pixel (Datový set), FB stránka.\n\nGoogle Ads - Zašlete nám ID reklamního účtu. Zašleme žádost o přístup která dorazí na e-mail, na který máte Google Ads účet vedený.\n\nS-klik - Nasdílejte na e-mail mysocials@seznam.cz\n\nPokud si nebudete vědět rady, zde naleznete návod. Případně klidně napište a pomůžeme :)\n\n{signature}',
    ARRAY['company', 'signature']::TEXT[]
  ),
  (
    'send_offer',
    'Nabídka spolupráce',
    'Email s obchodní nabídkou klientovi.',
    'Nabídka spolupráce - {domain} / Socials',
    'Dobrý den {contact_name},\n\nděkuji za náš nedávný rozhovor ohledně spolupráce se společností {company}.\n\nNa základě našeho jednání jsem pro Vás připravil/a nabídku:\n\n{services_list}\n\n{price_summary}\n\n{offer_url_line}\n\nBudu rád/a, když se mi ozvete s případnými dotazy.\n\n{signature}',
    ARRAY['contact_name', 'company', 'domain', 'services_list', 'price_summary', 'offer_url_line', 'signature']::TEXT[]
  ),
  (
    'send_onboarding_form',
    'Onboarding formulář',
    'Email s onboarding formulářem pro klienta.',
    'Onboarding formulář - {domain} / Socials',
    'Dobrý den {contact_name},\n\nděkujeme za Váš zájem o spolupráci s agenturou Socials.\n\nPro zahájení spolupráce prosím vyplňte náš onboarding formulář, kde doplníte potřebné údaje pro nastavení služeb a fakturaci.\n\nFormulář je předvyplněný údaji, které již o Vás máme. Prosím zkontrolujte je a případně upravte nebo doplňte.\n\n👉 Odkaz na formulář: {url}\n\nPo vyplnění formuláře Vás budeme kontaktovat s dalšími kroky.\n\n{signature}',
    ARRAY['contact_name', 'domain', 'url', 'signature']::TEXT[]
  ),
  (
    'send_modification',
    'Návrh změny zakázky',
    'Email klientovi s návrhem změny spolupráce.',
    '{type} – {client} / Socials',
    '{greeting}\n\nrádi bychom Vás informovali o navrhované změně ve spolupráci:\n\n{change_type}\n{change_details}\n\nPlatnost od: {effective_from}\n\nPro potvrzení této změny prosím klikněte na následující odkaz:\n{upgrade_link}\n\nOdkaz je platný do: {valid_until}\n\nV případě dotazů nás neváhejte kontaktovat.\n\n{signature}',
    ARRAY['greeting', 'type', 'client', 'change_type', 'change_details', 'effective_from', 'upgrade_link', 'valid_until', 'signature']::TEXT[]
  ),
  (
    'send_approval',
    'Schválení vícepráce',
    'Email pro schválení vícepráce klientem.',
    'Schválení vícepráce: {work_name}',
    'Dobrý den,\n\nrádi bychom Vás požádali o schválení následující vícepráce:\n\nNázev: {work_name}\n{work_description}\nCelková částka: {amount}\n{hours_line}\n{engagement_line}\n{colleague_line}\n\nPro schválení nebo zamítnutí klikněte na odkaz níže:\n{url}\n\n{signature}',
    ARRAY['work_name', 'work_description', 'amount', 'hours_line', 'engagement_line', 'colleague_line', 'url', 'signature']::TEXT[]
  ),
  (
    'interview_invite',
    'Pozvánka na pohovor',
    'Pozvánka kandidáta na pohovor.',
    'Pozvánka na pohovor – {position} | Socials',
    'Dobrý den {name},\n\nděkujeme za Váš zájem o pozici {position} v agentuře Socials.\n\nRádi bychom se s Vámi spojili na krátký telefonát nebo online schůzku, abychom si vzájemně přiblížili detaily spolupráce.\n\nDejte prosím vědět, kdy se Vám hodí 15-30 minutový call.\n\n{signature}',
    ARRAY['name', 'position', 'signature']::TEXT[]
  ),
  (
    'rejection_email',
    'Odmítnutí kandidáta',
    'Odmítací email uchazeči.',
    'Vyjádření k Vaší přihlášce – {position} | Socials',
    'Dobrý den {name},\n\nděkujeme za Váš zájem o pozici {position} v agentuře Socials a za čas, který jste věnoval/a přípravě své přihlášky.\n\nPo pečlivém zvážení jsme se rozhodli pokračovat s jinými kandidáty, jejichž profil je v tuto chvíli blíže našim aktuálním potřebám.\n\nPřejeme Vám mnoho úspěchů v dalším profesním směřování a věříme, že najdete pozici, která bude přesně pro Vás.\n\n{signature}',
    ARRAY['name', 'position', 'signature']::TEXT[]
  ),
  (
    'applicant_onboarding',
    'Onboarding kandidáta',
    'Email s onboarding formulářem pro nového kolegu.',
    'Onboarding - {position} | Socials.cz',
    'Dobrý den {name},\n\ngratulujeme k přijetí na pozici {position}!\n\nPro dokončení nástupu prosím vyplňte onboarding formulář:\n{url}\n\nFormulář obsahuje předvyplněné údaje z Vaší přihlášky. Prosím zkontrolujte je a doplňte zbývající informace potřebné pro pracovní smlouvu.\n\nTěšíme se na spolupráci!\n\n{signature}',
    ARRAY['name', 'position', 'url', 'signature']::TEXT[]
  )
ON CONFLICT (template_key) DO NOTHING;
