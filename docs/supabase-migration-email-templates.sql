-- Create email_templates table
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text UNIQUE NOT NULL,
  name text NOT NULL,
  subject_template text NOT NULL DEFAULT '',
  body_template text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  available_variables text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- CRM users can read
CREATE POLICY "CRM users can read email_templates"
  ON public.email_templates
  FOR SELECT
  USING (is_crm_user(auth.uid()));

-- Admins can manage
CREATE POLICY "Admins can manage email_templates"
  ON public.email_templates
  FOR ALL
  USING (is_admin(auth.uid()));

-- Update trigger
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed default templates
INSERT INTO public.email_templates (template_key, name, subject_template, body_template, description, available_variables) VALUES
(
  'send_offer',
  'Nabídka spolupráce',
  'Nabídka spolupráce - {domain} / Socials',
  E'Dobrý den {contact_name},\n\nděkuji za náš nedávný rozhovor ohledně spolupráce se společností {company}.\n\nNa základě našeho jednání jsem pro Vás připravil/a nabídku:\n\n{services_list}\n\n{price_summary}\n\n{offer_url_line}\n\nBudu rád/a, když se mi ozvete s případnými dotazy.\n\nS pozdravem,\n{sender_name}\n{sender_position}\n{sender_email}\n{sender_phone}',
  'Email s nabídkou spolupráce odesílaný z detailu leadu',
  ARRAY['contact_name', 'company', 'domain', 'services_list', 'price_summary', 'offer_url_line', 'sender_name', 'sender_position', 'sender_email', 'sender_phone']
),
(
  'send_onboarding_form',
  'Onboarding formulář',
  'Onboarding formulář - {domain} / Socials',
  E'Dobrý den {contact_name},\n\nděkujeme za Váš zájem o spolupráci s agenturou Socials.\n\nPro zahájení spolupráce prosím vyplňte náš onboarding formulář, kde doplníte potřebné údaje pro nastavení služeb a fakturaci.\n\nFormulář je předvyplněný údaji, které již o Vás máme. Prosím zkontrolujte je a případně upravte nebo doplňte.\n\n👉 Odkaz na formulář: {url}\n\nPo vyplnění formuláře Vás budeme kontaktovat s dalšími kroky.\n\nDěkujeme,\nTým Socials',
  'Email s onboarding formulářem pro nového klienta',
  ARRAY['contact_name', 'company', 'domain', 'url']
),
(
  'request_access',
  'Žádost o přístupy',
  'Žádost o nasdílení přístupů - {company} / Socials',
  E'Dobrý den,\n\nNa základě našeho telefonátu Vás prosíme o nasdílení přístupů do níže uvedených marketingových nástrojů. Uděláme audit a připravíme pro vás nabídku na případnou spolupráci.\n\nGoogle Analytics 4 - Přístup na úrovni celého účtu s oprávněním "Čtení" pošlete na e-mail analytics@socials.cz\n\nFacebook Business Manager - Přidejte nás jako partnery (ID našeho účtu: 1196977750459552) s nejnižší úrovní přístupů k těmto položkám: Reklamní účet, Katalog produktů, Meta Pixel (Datový set), FB stránka.\n\nGoogle Ads - Zašlete nám ID reklamního účtu. Zašleme žádost o přístup která dorazí na e-mail, na který máte Google Ads účet vedený.\n\nS-klik - Nasdílejte na e-mail mysocials@seznam.cz\n\nPokud si nebudete vědět rady, zde naleznete návod. Případně klidně napište a pomůžeme :)\n\nDěkujeme a přejeme hezký den,\nTým Socials',
  'Žádost o nasdílení přístupů k marketingovým nástrojům',
  ARRAY['company']
),
(
  'send_approval',
  'Schválení vícepráce',
  'Schválení vícepráce: {work_name}',
  E'Dobrý den,\n\nrádi bychom Vás požádali o schválení následující vícepráce:\n\nNázev: {work_name}\n{work_description}\n{hours_line}\nCelková částka: {amount}\n{engagement_line}\n{colleague_line}\n\nPro schválení nebo zamítnutí klikněte na odkaz níže:\n{url}\n\nDěkujeme za spolupráci.\n\nS pozdravem,\nSocials',
  'Email pro schválení vícepráce klientem',
  ARRAY['work_name', 'work_description', 'hours_line', 'amount', 'engagement_line', 'colleague_line', 'url']
),
(
  'send_modification',
  'Návrh změny zakázky',
  '{type} – {client} / Socials',
  E'{greeting}\n\nrádi bychom Vás informovali o navrhované změně ve spolupráci:\n\n{change_type}\n{change_details}\n\nPlatnost od: {effective_from}\n\nPro potvrzení této změny prosím klikněte na následující odkaz:\n{upgrade_link}\n\nOdkaz je platný do: {valid_until}\n\nV případě dotazů nás neváhejte kontaktovat.\n\nS pozdravem,\n{sender_name}\n{sender_position}\n{sender_email}\n{sender_phone}',
  'Email s návrhem změny zakázky (přidání služby, změna ceny, ukončení)',
  ARRAY['greeting', 'client', 'type', 'change_type', 'change_details', 'effective_from', 'upgrade_link', 'valid_until', 'sender_name', 'sender_position', 'sender_email', 'sender_phone']
),
(
  'interview_invite',
  'Pozvánka na pohovor',
  'Pozvánka na pohovor – {position} | Socials',
  E'Dobrý den {name},\n\nděkujeme za Váš zájem o pozici {position} v agentuře Socials.\n\nRádi bychom se s Vámi spojili na krátký telefonát nebo online schůzku, abychom Vás lépe poznali a probrali detaily případné spolupráce.\n\nDejte prosím vědět, kdy se Vám hodí 15-30 minutový call.\n\nDěkujeme a těšíme se na Vás,\n{sender}',
  'Pozvánka na pohovor pro uchazeče',
  ARRAY['name', 'position', 'sender']
),
(
  'rejection_email',
  'Odmítnutí kandidáta',
  'Vyjádření k Vaší přihlášce – {position} | Socials',
  E'Dobrý den {name},\n\nděkujeme za Váš zájem o pozici {position} v agentuře Socials a čas, který jste věnoval/a přípravě své přihlášky.\n\nPo pečlivém zvážení jsme se rozhodli pokračovat s jinými kandidáty, jejichž profil lépe odpovídá našim aktuálním potřebám.\n\nPřejeme Vám mnoho úspěchů v dalším profesním směřování a věříme, že najdete pozici, která bude přesně pro Vás.\n\nS pozdravem,\n{sender}',
  'Odmítací email pro uchazeče',
  ARRAY['name', 'position', 'sender']
),
(
  'applicant_onboarding',
  'Onboarding kandidáta',
  'Onboarding - {position} | Socials.cz',
  E'Dobrý den {name},\n\ngratulujeme k přijetí na pozici {position}!\n\nPro dokončení nástupu prosím vyplňte onboarding formulář:\n{url}\n\nFormulář obsahuje předvyplněné údaje z Vaší přihlášky. Prosím zkontrolujte je a doplňte zbývající informace potřebné pro pracovní smlouvu.\n\nTěšíme se na spolupráci!\n\nS pozdravem,\n{sender}',
  'Onboarding formulář pro přijatého kandidáta',
  ARRAY['name', 'position', 'url', 'sender']
)
ON CONFLICT (template_key) DO NOTHING;
