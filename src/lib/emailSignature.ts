import type { Colleague } from '@/types/crm';
// @ts-ignore - no types available
import { vokativ } from 'vokativ';

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

export function inflectVocativeFullName(fullName: string): string {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '';

  return parts
    .map((part, index) => {
      const isSurnamePart = index > 0;
      try {
        const inflected = vokativ(part, null, isSurnamePart);
        return inflected.replace(/^./, (c: string) => c.toUpperCase());
      } catch {
        return part.replace(/^./, (c: string) => c.toUpperCase());
      }
    })
    .join(' ');
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
    '🎙️ Poslechněte si [Socials Podcast](https://www.youtube.com/@socials_cz/videos)',
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toSafeHref(url: string): string {
  return escapeHtml(url);
}

function renderInlineWithLinks(line: string): string {
  const tokenRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<]+)/g;
  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(line)) !== null) {
    const [fullMatch, markdownText, markdownUrl, plainUrl] = match;
    result += escapeHtml(line.slice(lastIndex, match.index));

    if (markdownText && markdownUrl) {
      const href = toSafeHref(markdownUrl);
      const text = escapeHtml(markdownText);
      result += `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;text-decoration:underline;">${text}</a>`;
    } else if (plainUrl) {
      const href = toSafeHref(plainUrl);
      result += `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;text-decoration:underline;word-break:break-all;">${href}</a>`;
    } else {
      result += escapeHtml(fullMatch);
    }

    lastIndex = match.index + fullMatch.length;
  }

  result += escapeHtml(line.slice(lastIndex));
  return result;
}

function isListItem(line: string): boolean {
  return line.startsWith('•') || line.startsWith('-') || /^\d+\./.test(line);
}

export function formatEmailTextToHtml(content: string): string {
  const lines = content.split('\n');
  const htmlParts: string[] = [];
  let currentParagraph: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === '') {
      if (currentParagraph.length > 0) {
        htmlParts.push(`<p style="margin: 0 0 16px 0;">${currentParagraph.join('<br>')}</p>`);
        currentParagraph = [];
      }
      continue;
    }

    if (isListItem(trimmed)) {
      if (currentParagraph.length > 0) {
        htmlParts.push(`<p style="margin: 0 0 16px 0;">${currentParagraph.join('<br>')}</p>`);
        currentParagraph = [];
      }
      htmlParts.push(`<p style="margin: 0 0 8px 0; padding-left: 20px;">${renderInlineWithLinks(trimmed)}</p>`);
      continue;
    }

    currentParagraph.push(renderInlineWithLinks(trimmed));
  }

  if (currentParagraph.length > 0) {
    htmlParts.push(`<p style="margin: 0 0 16px 0;">${currentParagraph.join('<br>')}</p>`);
  }

  return htmlParts.join('');
}
