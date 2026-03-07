import type { Colleague } from '@/types/crm';

type SignatureColleague = Pick<
  Colleague,
  'email_signature' | 'full_name' | 'position' | 'email' | 'phone'
>;

interface EmailSignatureOptions {
  fallbackName?: string;
  includePosition?: boolean;
  includeEmail?: boolean;
  includePhone?: boolean;
}

export function getDefaultEmailSignature(
  colleague: SignatureColleague | null | undefined,
  options: EmailSignatureOptions = {}
): string {
  const customSignature = colleague?.email_signature?.trim();
  if (customSignature) {
    return customSignature;
  }

  const fullName = colleague?.full_name?.trim() || '';
  const position = colleague?.position?.trim() || '';
  const lines: string[] = [
    fullName,
    position,
    '',
    'Socials.cz',
    '',
    '🌐 www.socials.cz',
    '🎙️ Poslechněte si Socials Podcast (link: https://www.youtube.com/@socials_cz/videos)',
    '',
    '💡 Pomáháme firmám získávat zákazníky díky výkonnostní reklamě.',
  ];

  if (options.includeEmail && colleague?.email?.trim()) {
    lines.splice(2, 0, colleague.email.trim());
  }

  if (options.includePhone && colleague?.phone?.trim()) {
    lines.splice(2, 0, colleague.phone.trim());
  }

  return lines.join('\n').trim();
}
