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

  const lines: string[] = [];
  lines.push(colleague?.full_name?.trim() || options.fallbackName || 'Tým Socials');

  if (options.includePosition && colleague?.position?.trim()) {
    lines.push(colleague.position.trim());
  }

  if (options.includeEmail && colleague?.email?.trim()) {
    lines.push(colleague.email.trim());
  }

  if (options.includePhone && colleague?.phone?.trim()) {
    lines.push(colleague.phone.trim());
  }

  return lines.join('\n');
}
