import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface EmailTemplate {
  id: string;
  template_key: string;
  name: string;
  description: string;
  subject_template: string;
  body_template: string;
  available_variables: string[];
  updated_at: string | null;
  updated_by: string | null;
}

const DEFAULT_TEMPLATES: Record<string, Omit<EmailTemplate, 'id' | 'updated_at' | 'updated_by'>> = {
  request_access: {
    template_key: 'request_access',
    name: 'Žádost o přístupy',
    description: 'Žádost o nasdílení marketingových přístupů.',
    subject_template: 'Žádost o nasdílení přístupů - {company} / Socials',
    body_template: `Dobrý den,\n\nNa základě našeho telefonátu Vás prosíme o nasdílení přístupů do níže uvedených marketingových nástrojů. Uděláme audit a připravíme pro vás nabídku na případnou spolupráci.\n\nGoogle Analytics 4 - Přístup na úrovni celého účtu s oprávněním "Čtení" pošlete na e-mail analytics@socials.cz\n\nFacebook Business Manager - Přidejte nás jako partnery (ID našeho účtu: 1196977750459552) s nejnižší úrovní přístupů k těmto položkám: Reklamní účet, Katalog produktů, Meta Pixel (Datový set), FB stránka.\n\nGoogle Ads - Zašlete nám ID reklamního účtu. Zašleme žádost o přístup která dorazí na e-mail, na který máte Google Ads účet vedený.\n\nS-klik - Nasdílejte na e-mail mysocials@seznam.cz\n\nPokud si nebudete vědět rady, zde naleznete návod. Případně klidně napište a pomůžeme :)\n\n{signature}`,
    available_variables: ['company', 'signature'],
  },
  send_offer: {
    template_key: 'send_offer',
    name: 'Nabídka spolupráce',
    description: 'Email s obchodní nabídkou klientovi.',
    subject_template: 'Nabídka spolupráce - {domain} / Socials',
    body_template: `Dobrý den {contact_name},\n\nděkuji za náš nedávný rozhovor ohledně spolupráce se společností {company}.\n\nNa základě našeho jednání jsem pro Vás připravil/a nabídku:\n\n{services_list}\n\n{price_summary}\n\n{offer_url_line}\n\nBudu rád/a, když se mi ozvete s případnými dotazy.\n\n{signature}`,
    available_variables: ['contact_name', 'company', 'domain', 'services_list', 'price_summary', 'offer_url_line', 'signature'],
  },
  send_onboarding_form: {
    template_key: 'send_onboarding_form',
    name: 'Onboarding formulář',
    description: 'Email s onboarding formulářem pro klienta.',
    subject_template: 'Onboarding formulář - {domain} / Socials',
    body_template: `Dobrý den {contact_name},\n\nděkujeme za Váš zájem o spolupráci s agenturou Socials.\n\nPro zahájení spolupráce prosím vyplňte náš onboarding formulář, kde doplníte potřebné údaje pro nastavení služeb a fakturaci.\n\nFormulář je předvyplněný údaji, které již o Vás máme. Prosím zkontrolujte je a případně upravte nebo doplňte.\n\n👉 Odkaz na formulář: {url}\n\nPo vyplnění formuláře Vás budeme kontaktovat s dalšími kroky.\n\n{signature}`,
    available_variables: ['contact_name', 'domain', 'url', 'signature'],
  },
  send_modification: {
    template_key: 'send_modification',
    name: 'Návrh změny zakázky',
    description: 'Email klientovi s návrhem změny spolupráce.',
    subject_template: '{type} – {client} / Socials',
    body_template: `{greeting}\n\nrádi bychom Vás informovali o navrhované změně ve spolupráci:\n\n{change_type}\n{change_details}\n\nPlatnost od: {effective_from}\n\nPro potvrzení této změny prosím klikněte na následující odkaz:\n{upgrade_link}\n\nOdkaz je platný do: {valid_until}\n\nV případě dotazů nás neváhejte kontaktovat.\n\n{signature}`,
    available_variables: ['greeting', 'type', 'client', 'change_type', 'change_details', 'effective_from', 'upgrade_link', 'valid_until', 'signature'],
  },
  send_approval: {
    template_key: 'send_approval',
    name: 'Schválení vícepráce',
    description: 'Email pro schválení vícepráce klientem.',
    subject_template: 'Schválení vícepráce: {work_name}',
    body_template: `Dobrý den,\n\nrádi bychom Vás požádali o schválení následující vícepráce:\n\nNázev: {work_name}\n{work_description}\nCelková částka: {amount}\n{hours_line}\n{engagement_line}\n{colleague_line}\n\nPro schválení nebo zamítnutí klikněte na odkaz níže:\n{url}\n\n{signature}`,
    available_variables: ['work_name', 'work_description', 'amount', 'hours_line', 'engagement_line', 'colleague_line', 'url', 'signature'],
  },
  interview_invite: {
    template_key: 'interview_invite',
    name: 'Pozvánka na pohovor',
    description: 'Pozvánka kandidáta na pohovor.',
    subject_template: 'Pozvánka na pohovor – {position} | Socials',
    body_template: `Dobrý den {name},\n\nděkujeme za Váš zájem o pozici {position} v agentuře Socials.\n\nRádi bychom se s Vámi spojili na krátký telefonát nebo online schůzku, abychom si vzájemně přiblížili detaily spolupráce.\n\nDejte prosím vědět, kdy se Vám hodí 15-30 minutový call.\n\n{signature}`,
    available_variables: ['name', 'position', 'signature'],
  },
  rejection_email: {
    template_key: 'rejection_email',
    name: 'Odmítnutí kandidáta',
    description: 'Odmítací email uchazeči.',
    subject_template: 'Vyjádření k Vaší přihlášce – {position} | Socials',
    body_template: `Dobrý den {name},\n\nděkujeme za Váš zájem o pozici {position} v agentuře Socials a za čas, který jste věnoval/a přípravě své přihlášky.\n\nPo pečlivém zvážení jsme se rozhodli pokračovat s jinými kandidáty, jejichž profil je v tuto chvíli blíže našim aktuálním potřebám.\n\nPřejeme Vám mnoho úspěchů v dalším profesním směřování a věříme, že najdete pozici, která bude přesně pro Vás.\n\n{signature}`,
    available_variables: ['name', 'position', 'signature'],
  },
  applicant_onboarding: {
    template_key: 'applicant_onboarding',
    name: 'Onboarding kandidáta',
    description: 'Email s onboarding formulářem pro nového kolegu.',
    subject_template: 'Onboarding - {position} | Socials.cz',
    body_template: `Dobrý den {name},\n\ngratulujeme k přijetí na pozici {position}!\n\nPro dokončení nástupu prosím vyplňte onboarding formulář:\n{url}\n\nFormulář obsahuje předvyplněné údaje z Vaší přihlášky. Prosím zkontrolujte je a doplňte zbývající informace potřebné pro pracovní smlouvu.\n\nTěšíme se na spolupráci!\n\n{signature}`,
    available_variables: ['name', 'position', 'url', 'signature'],
  },
};

function normalizeEscapedNewlines(value: string | null | undefined): string {
  if (!value) return '';
  return value.replace(/\\n/g, '\n');
}

export function useEmailTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: dbTemplates = [], isLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('email_templates')
        .select('*')
        .order('name');

      if (error) {
        console.warn('Failed to load email templates from DB, using defaults:', error);
        return [] as EmailTemplate[];
      }

      return ((data || []) as EmailTemplate[]).map((template) => ({
        ...template,
        subject_template: normalizeEscapedNewlines(template.subject_template),
        body_template: normalizeEscapedNewlines(template.body_template),
      }));
    },
  });

  const getTemplate = (key: string): EmailTemplate => {
    const existing = dbTemplates.find((template) => template.template_key === key);
    if (existing) return existing;

    const fallback = DEFAULT_TEMPLATES[key];
    if (fallback) {
      return {
        id: key,
        updated_at: null,
        updated_by: null,
        ...fallback,
      };
    }

    return {
      id: key,
      template_key: key,
      name: key,
      description: '',
      subject_template: '',
      body_template: '',
      available_variables: [],
      updated_at: null,
      updated_by: null,
    };
  };

  const fillTemplate = useCallback(
    (key: string, variables: Record<string, string>) => {
      const template = getTemplate(key);
      let subject = template.subject_template;
      let body = template.body_template;

      for (const [variableName, variableValue] of Object.entries(variables)) {
        const regex = new RegExp(`\\{${variableName}\\}`, 'g');
        subject = subject.replace(regex, variableValue || '');
        body = body.replace(regex, variableValue || '');
      }

      return { subject, body };
    },
    [dbTemplates]
  );

  const updateMutation = useMutation({
    mutationFn: async ({ key, subject, body }: { key: string; subject: string; body: string }) => {
      const fallback = DEFAULT_TEMPLATES[key];
      const payload = {
        template_key: key,
        name: fallback?.name || key,
        description: fallback?.description || '',
        subject_template: subject,
        body_template: body,
        available_variables: fallback?.available_variables || [],
        updated_by: user?.id || null,
      };

      const { error } = await (supabase as any)
        .from('email_templates')
        .upsert(payload, { onConflict: 'template_key' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
    },
  });

  const allTemplates = Object.keys(DEFAULT_TEMPLATES).map((key) => getTemplate(key));

  return {
    templates: allTemplates,
    isLoading,
    getTemplate,
    fillTemplate,
    updateTemplate: (key: string, subject: string, body: string) => updateMutation.mutateAsync({ key, subject, body }),
    isUpdating: updateMutation.isPending,
  };
}
