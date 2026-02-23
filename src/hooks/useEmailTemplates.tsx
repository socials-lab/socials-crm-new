import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCallback } from 'react';

export interface EmailTemplate {
  id: string;
  template_key: string;
  name: string;
  subject_template: string;
  body_template: string;
  description: string;
  available_variables: string[];
  updated_at: string | null;
  updated_by: string | null;
}

// Hardcoded defaults as fallback
const DEFAULT_TEMPLATES: Record<string, Omit<EmailTemplate, 'id' | 'updated_at' | 'updated_by'>> = {
  send_offer: {
    template_key: 'send_offer',
    name: 'Nabídka spolupráce',
    subject_template: 'Nabídka spolupráce - {domain} / Socials',
    body_template: 'Dobrý den {contact_name},\n\nděkuji za náš nedávný rozhovor ohledně spolupráce se společností {company}.\n\nNa základě našeho jednání jsem pro Vás připravil/a nabídku:\n\n{services_list}\n\n{price_summary}\n\n{offer_url_line}\n\nBudu rád/a, když se mi ozvete s případnými dotazy.\n\n{signature}',
    description: 'Email s nabídkou spolupráce',
    available_variables: ['contact_name', 'company', 'domain', 'services_list', 'price_summary', 'offer_url_line', 'signature'],
  },
  send_onboarding_form: {
    template_key: 'send_onboarding_form',
    name: 'Onboarding formulář',
    subject_template: 'Onboarding formulář - {domain} / Socials',
    body_template: 'Dobrý den {contact_name},\n\nděkujeme za Váš zájem o spolupráci s agenturou Socials.\n\nPro zahájení spolupráce prosím vyplňte náš onboarding formulář.\n\n👉 Odkaz na formulář: {url}\n\n{signature}',
    description: 'Onboarding formulář pro nového klienta',
    available_variables: ['contact_name', 'company', 'domain', 'url', 'signature'],
  },
  request_access: {
    template_key: 'request_access',
    name: 'Žádost o přístupy',
    subject_template: 'Žádost o nasdílení přístupů - {company} / Socials',
    body_template: 'Dobrý den,\n\nNa základě našeho telefonátu Vás prosíme o nasdílení přístupů...\n\n{signature}',
    description: 'Žádost o nasdílení přístupů',
    available_variables: ['company', 'signature'],
  },
  send_approval: {
    template_key: 'send_approval',
    name: 'Schválení vícepráce',
    subject_template: 'Schválení vícepráce: {work_name}',
    body_template: 'Dobrý den,\n\nrádi bychom Vás požádali o schválení následující vícepráce:\n\nNázev: {work_name}\n{work_description}\nCelková částka: {amount}\n\nOdkaz: {url}\n\n{signature}',
    description: 'Email pro schválení vícepráce',
    available_variables: ['work_name', 'work_description', 'hours_line', 'amount', 'engagement_line', 'colleague_line', 'url', 'signature'],
  },
  send_modification: {
    template_key: 'send_modification',
    name: 'Návrh změny zakázky',
    subject_template: '{type} – {client} / Socials',
    body_template: '{greeting}\n\nrádi bychom Vás informovali o navrhované změně ve spolupráci:\n\n{change_type}\n{change_details}\n\nPlatnost od: {effective_from}\n\nOdkaz: {upgrade_link}\n\n{signature}',
    description: 'Návrh změny zakázky',
    available_variables: ['greeting', 'client', 'type', 'change_type', 'change_details', 'effective_from', 'upgrade_link', 'valid_until', 'signature'],
  },
  interview_invite: {
    template_key: 'interview_invite',
    name: 'Pozvánka na pohovor',
    subject_template: 'Pozvánka na pohovor – {position} | Socials',
    body_template: 'Dobrý den {name},\n\nděkujeme za Váš zájem o pozici {position} v agentuře Socials.\n\nRádi bychom se s Vámi spojili na krátký telefonát nebo online schůzku.\n\nDejte prosím vědět, kdy se Vám hodí 15-30 minutový call.\n\n{signature}',
    description: 'Pozvánka na pohovor',
    available_variables: ['name', 'position', 'signature'],
  },
  rejection_email: {
    template_key: 'rejection_email',
    name: 'Odmítnutí kandidáta',
    subject_template: 'Vyjádření k Vaší přihlášce – {position} | Socials',
    body_template: 'Dobrý den {name},\n\nděkujeme za Váš zájem o pozici {position} v agentuře Socials a čas, který jste věnoval/a přípravě své přihlášky.\n\nPo pečlivém zvážení jsme se rozhodli pokračovat s jinými kandidáty.\n\nPřejeme Vám mnoho úspěchů.\n\n{signature}',
    description: 'Odmítací email pro uchazeče',
    available_variables: ['name', 'position', 'signature'],
  },
  applicant_onboarding: {
    template_key: 'applicant_onboarding',
    name: 'Onboarding kandidáta',
    subject_template: 'Onboarding - {position} | Socials.cz',
    body_template: 'Dobrý den {name},\n\ngratulujeme k přijetí na pozici {position}!\n\nPro dokončení nástupu prosím vyplňte onboarding formulář:\n{url}\n\nFormulář obsahuje předvyplněné údaje z Vaší přihlášky. Prosím zkontrolujte je a doplňte zbývající informace potřebné pro pracovní smlouvu.\n\nTěšíme se na spolupráci!\n\n{signature}',
    description: 'Onboarding formulář pro přijatého kandidáta',
    available_variables: ['name', 'position', 'url', 'signature'],
  },
};

export function useEmailTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('email_templates')
        .select('*')
        .order('name');
      if (error) {
        console.warn('Failed to load email templates from DB, using defaults:', error);
        return [];
      }
      return data as EmailTemplate[];
    },
  });

  const getTemplate = (key: string): EmailTemplate => {
    const dbTemplate = templates.find(t => t.template_key === key);
    if (dbTemplate) return dbTemplate;
    
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
      subject_template: '',
      body_template: '',
      description: '',
      available_variables: [],
      updated_at: null,
      updated_by: null,
    };
  };

  // Fetch user's email signature
  const { data: userSignature = '' } = useQuery({
    queryKey: ['email-signature', user?.id],
    queryFn: async () => {
      if (!user?.id) return '';
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('email_signature')
        .eq('id', user.id)
        .single();
      if (error) return '';
      return (data?.email_signature as string) || '';
    },
    enabled: !!user?.id,
  });

  const fillTemplate = useCallback((key: string, variables: Record<string, string>): { subject: string; body: string } => {
    const template = getTemplate(key);
    let subject = template.subject_template;
    let body = template.body_template;
    
    // Merge user-provided variables with auto-injected signature
    const allVars = { signature: userSignature, ...variables };
    
    for (const [varName, value] of Object.entries(allVars)) {
      const regex = new RegExp(`\\{${varName}\\}`, 'g');
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    }
    
    return { subject, body };
  }, [templates, userSignature]);

  const updateMutation = useMutation({
    mutationFn: async ({ key, subject, body }: { key: string; subject: string; body: string }) => {
      const { error } = await (supabase as any)
        .from('email_templates')
        .update({
          subject_template: subject,
          body_template: body,
          updated_by: user?.id,
        })
        .eq('template_key', key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
    },
  });

  const updateTemplate = (key: string, subject: string, body: string) => {
    return updateMutation.mutateAsync({ key, subject, body });
  };

  const allTemplateKeys = Object.keys(DEFAULT_TEMPLATES);

  // Merge DB templates with defaults for the settings manager
  const allTemplates: EmailTemplate[] = allTemplateKeys.map(key => getTemplate(key));

  return {
    templates: allTemplates,
    isLoading,
    getTemplate,
    fillTemplate,
    updateTemplate,
    isUpdating: updateMutation.isPending,
  };
}
