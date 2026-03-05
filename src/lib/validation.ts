/**
 * Shared validation utilities for the CRM application
 */
import { z } from 'zod';

/**
 * Normalizes URL input by prepending https:// when protocol is missing
 */
export function normalizeUrlProtocol(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

/**
 * Validates URL-like input with optional protocol
 */
export function isValidUrlInput(value: string): boolean {
  const normalized = normalizeUrlProtocol(value);
  if (!normalized) return true;

  try {
    const parsed = new URL(normalized);
    return Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * Validates Czech IČO checksum using modulo 11 algorithm
 * @param ico - 8 digit Czech company identification number
 * @returns true if checksum is valid
 */
export function validateIcoChecksum(ico: string): boolean {
  if (!/^\d{8}$/.test(ico)) return false;

  // Weights for positions 1-7 (8th is checksum)
  const weights = [8, 7, 6, 5, 4, 3, 2];
  let sum = 0;

  for (let i = 0; i < 7; i++) {
    sum += parseInt(ico[i], 10) * weights[i];
  }

  const remainder = sum % 11;
  let checkDigit: number;

  if (remainder === 0) {
    checkDigit = 1;
  } else if (remainder === 1) {
    checkDigit = 0;
  } else {
    checkDigit = 11 - remainder;
  }

  return checkDigit === parseInt(ico[7], 10);
}

/**
 * Zod schema for optional email validation
 * - Transforms empty strings to null
 * - Validates email format if provided
 * @deprecated Use requiredEmail for contacts - email is now required
 */
export const optionalEmail = z.string()
  .transform(val => val?.trim() || '')
  .refine(
    val => val === '' || z.string().email().safeParse(val).success,
    'Zadejte platný email'
  )
  .transform(val => val === '' ? null : val);

/**
 * Zod schema for required email validation
 * - Validates email format
 * - Cannot be empty
 */
export const requiredEmail = z.string()
  .min(1, 'Email je povinný')
  .transform(val => val?.trim() || '')
  .refine(
    val => z.string().email().safeParse(val).success,
    'Zadejte platný email'
  );

/**
 * Zod schema for optional phone validation
 * - Transforms empty strings to null
 * - Validates phone format (digits, spaces, dashes, parentheses, dots, extensions)
 */
export const optionalPhone = z.string()
  .max(50, 'Telefon je příliš dlouhý')
  .transform(val => val?.trim() || null)
  .refine(
    // Fixed regex: allows only single extension at the end (x followed by digits)
    val => val === null || /^[+]?[\d\s\-().]+(?:x\d+)?$/i.test(val),
    'Zadejte platné telefonní číslo'
  )
  .nullable();

/**
 * Zod schema for required name with whitespace handling
 * - Trims whitespace first, then validates length
 */
export const requiredName = (maxLength = 255) => z.string()
  .transform(s => s.trim())
  .refine(s => s.length >= 1, 'Jméno je povinné')
  .refine(s => s.length <= maxLength, `Jméno je příliš dlouhé (max ${maxLength} znaků)`);

/**
 * Validates Czech IČO format and checksum
 */
export const czechIco = z.string()
  .min(1, 'IČO je povinné')
  .transform(s => s.trim())
  .refine(val => /^\d{8}$/.test(val), 'IČO musí být 8 číslic')
  .refine(val => validateIcoChecksum(val), 'Neplatné IČO - kontrolní součet nesouhlasí');

/**
 * Validates supported DIČ/VAT formats (optional)
 * - Czech VAT: CZ + 8-10 digits
 * - Slovak VAT: SK + 10 digits
 * - Slovak local DIČ: 10 digits (without country prefix)
 */
function isSupportedDicFormat(value: string): boolean {
  return /^CZ\d{8,10}$/.test(value) || /^SK\d{10}$/.test(value) || /^\d{10}$/.test(value);
}

export const czechDic = z.string()
  .transform(val => val?.trim() || '')
  .refine(
    val => val === '' || isSupportedDicFormat(val),
    'DIČ musí být ve formátu CZ12345678, SK1234567890 nebo 10 číslic'
  )
  .transform(val => val === '' ? null : val);

/**
 * Shared schema for client contact validation
 * Used in AddContactDialog and Contacts page
 * Note: Email is now required (for Freelo/DigiSign integrations)
 */
export const contactSchema = z.object({
  name: requiredName(255),
  position: z.string().max(100, 'Pozice je příliš dlouhá').nullable().transform(v => v?.trim() || null),
  email: requiredEmail,
  phone: optionalPhone,
  is_primary: z.boolean().default(false),
  is_decision_maker: z.boolean().default(false),
  notes: z.string().max(2000, 'Poznámky jsou příliš dlouhé').default(''),
});

export type ContactFormData = z.infer<typeof contactSchema>;
