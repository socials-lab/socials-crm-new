/**
 * DB payload normalization utilities.
 * Use these when building payloads for Supabase insert/update to avoid type mismatches.
 */
import { format } from 'date-fns';

/** Format date for DATE columns (YYYY-MM-DD) using local timezone. Avoids toISOString() timezone shift. */
export function toDateOnlyString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** Parse to number or null. Preserves 0; treats empty string, undefined, NaN as null. */
export function toNullableNumber(value: unknown): number | null {
  if (value === '' || value === undefined || value === null) return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Coerce to boolean. Handles string "true"/"false" from JSON. */
export function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 1) return true;
  if (value === 'false' || value === 0 || value === '' || value === null || value === undefined) return false;
  return Boolean(value);
}
