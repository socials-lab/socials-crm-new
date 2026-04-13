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
  const customSignature = (colleague?.email_signature || '').trim();
  if (customSignature) {
    return customSignature;
  }

  const fullName = colleague?.full_name?.trim() || '';
  const position = colleague?.position?.trim() || '';
  const fallbackName = options.fallbackName?.trim() || 'Tým Socials';
  const resolvedName = fullName || fallbackName;
  const resolvedRole = position || 'Tým Socials';
  const lines: string[] = [
    resolvedName,
    `${resolvedRole} @socials.cz`,
    '',
    '🌐 [www.socials.cz](https://www.socials.cz)',
    '[🎙️ Poslechněte si Social Podcast](https://www.youtube.com/@socials_cz/videos)',
    '',
    '💡 Pomáháme firmám získávat zákazníky díky výkonnostní reklamě.',
  ];

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

export function signatureTextToEditableHtml(signatureText: string | null | undefined): string {
  const source = (signatureText || '').trim();
  if (!source) return '<p></p>';

  const lines = source.split('\n');
  const htmlParts: string[] = [];
  let currentParagraph: string[] = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed === '') {
      if (currentParagraph.length > 0) {
        htmlParts.push(`<p>${currentParagraph.join('<br>')}</p>`);
        currentParagraph = [];
      }
      return;
    }
    currentParagraph.push(renderInlineWithLinks(trimmed));
  });

  if (currentParagraph.length > 0) {
    htmlParts.push(`<p>${currentParagraph.join('<br>')}</p>`);
  }

  return htmlParts.join('') || '<p></p>';
}

export function signatureHtmlToStoredText(signatureHtml: string | null | undefined): string {
  const source = (signatureHtml || '').trim();
  if (!source) return '';

  if (typeof window === 'undefined' || !window.document) {
    return source
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .trim();
  }

  const container = document.createElement('div');
  container.innerHTML = source;

  const blockTags = new Set(['P', 'DIV', 'LI', 'UL', 'OL']);

  const toText = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const element = node as HTMLElement;
    const tag = element.tagName;

    if (tag === 'BR') {
      return '\n';
    }

    if (tag === 'A') {
      const label = Array.from(element.childNodes).map(toText).join('').trim() || element.textContent?.trim() || '';
      const href = element.getAttribute('href') || '';
      if (!href) return label;
      return `[${label}](${href})`;
    }

    const content = Array.from(element.childNodes).map(toText).join('');
    if (tag === 'LI') {
      return `• ${content.trim()}\n`;
    }
    if (blockTags.has(tag)) {
      return `${content}\n`;
    }
    return content;
  };

  const rawText = Array.from(container.childNodes).map(toText).join('');
  return rawText
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();
}
