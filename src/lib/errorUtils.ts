/**
 * Error parsing utilities for user-friendly error messages.
 * Maps database constraint violations and trigger errors to Czech messages.
 */

interface ParsedError {
  message: string;
  type: 'constraint' | 'trigger' | 'permission' | 'network' | 'unknown';
  originalError?: unknown;
}

/**
 * Error message mappings for common database constraints and triggers.
 */
const ERROR_MAPPINGS: Record<string, string> = {
  // Unique constraint violations
  'idx_unique_primary_contact': 'Tento klient již má primární kontakt. Nejprve odeberte primární status z jiného kontaktu.',
  'unique_primary_contact': 'Tento klient již má primární kontakt. Nejprve odeberte primární status z jiného kontaktu.',
  'client_contacts_client_id_email_key': 'Kontakt s tímto e-mailem již u klienta existuje.',

  // Foreign key violations
  'client_contacts_client_id_fkey': 'Zadaný klient neexistuje.',
  'engagements_contact_person_id_fkey': 'Kontakt nelze smazat, protože je přiřazen k zakázce.',

  // Trigger errors (Czech messages from DB)
  'Nelze smazat jediný kontakt klienta': 'Nelze smazat jediný kontakt klienta. Každý klient musí mít alespoň jeden kontakt.',
  'Nelze smazat primární kontakt': 'Nelze smazat primární kontakt. Nejprve nastavte jiný kontakt jako primární.',

  // Issue #20: Additional error mappings for soft-delete and lead conversion
  'Kontakt je přiřazen k': 'Kontakt nelze smazat, protože je přiřazen k zakázce.',
  'Kontakt byl smazán jiným uživatelem': 'Kontakt byl smazán jiným uživatelem.',
  'Kontakt nebyl nalezen': 'Kontakt nebyl nalezen nebo již byl smazán.',
  'Primární kontakt musí mít vyplněný email': 'Primární kontakt musí mít vyplněný email.',
  'Email primárního kontaktu není ve správném formátu': 'Email primárního kontaktu není ve správném formátu.',
  'Kontakt nebyl nalezen nebo byl smazán': 'Kontakt nebyl nalezen nebo byl smazán.',

  // RLS policy errors
  'new row violates row-level security policy': 'Nemáte oprávnění provést tuto akci.',
  'violates row-level security policy': 'Nemáte oprávnění provést tuto akci.',

  // Network errors
  'Failed to fetch': 'Nepodařilo se připojit k serveru. Zkontrolujte připojení k internetu.',
  'NetworkError': 'Chyba sítě. Zkontrolujte připojení k internetu.',
  'PGRST301': 'Relace vypršela. Přihlaste se znovu.',
};

/**
 * Patterns for extracting error details from Supabase error messages.
 */
const ERROR_PATTERNS = [
  // Constraint name in error message
  /violates.*constraint "([^"]+)"/i,
  /constraint "([^"]+)" violated/i,
  // Trigger RAISE EXCEPTION message
  /ERROR:\s*(.+?)(?:\s*CONTEXT:|$)/i,
  // Generic PostgreSQL error
  /PGRST\d+/,
];

/**
 * Parses a Supabase error and returns a user-friendly message.
 */
export function parseSupabaseError(error: unknown): ParsedError {
  // Handle null/undefined
  if (!error) {
    return {
      message: 'Neznámá chyba',
      type: 'unknown',
      originalError: error,
    };
  }

  // Extract error message from various error shapes
  let errorMessage = '';

  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    errorMessage =
      (errorObj.message as string) ||
      (errorObj.error as string) ||
      (errorObj.details as string) ||
      (errorObj.hint as string) ||
      JSON.stringify(error);
  }

  // Check for network errors
  if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
    return {
      message: ERROR_MAPPINGS['Failed to fetch'],
      type: 'network',
      originalError: error,
    };
  }

  // Check for RLS policy errors
  if (errorMessage.toLowerCase().includes('row-level security policy')) {
    return {
      message: ERROR_MAPPINGS['violates row-level security policy'],
      type: 'permission',
      originalError: error,
    };
  }

  // Check for direct error message matches
  for (const [key, message] of Object.entries(ERROR_MAPPINGS)) {
    if (errorMessage.includes(key)) {
      return {
        message,
        type: errorMessage.includes('constraint') ? 'constraint' : 'trigger',
        originalError: error,
      };
    }
  }

  // Try to extract constraint name from error message
  for (const pattern of ERROR_PATTERNS) {
    const match = errorMessage.match(pattern);
    if (match && match[1]) {
      const constraintName = match[1];
      if (ERROR_MAPPINGS[constraintName]) {
        return {
          message: ERROR_MAPPINGS[constraintName],
          type: 'constraint',
          originalError: error,
        };
      }
    }
  }

  // Return generic message for unrecognized errors
  return {
    message: 'Nastala neočekávaná chyba. Zkuste to prosím znovu.',
    type: 'unknown',
    originalError: error,
  };
}

/**
 * Returns a user-friendly error message from a Supabase error.
 * Use this as a simple wrapper when you just need the message string.
 */
export function getErrorMessage(error: unknown, fallbackMessage = 'Nastala chyba'): string {
  const parsed = parseSupabaseError(error);
  return parsed.message || fallbackMessage;
}

/**
 * Checks if an error is a specific constraint violation.
 */
export function isConstraintError(error: unknown, constraintName: string): boolean {
  if (!error) return false;

  const errorMessage = typeof error === 'string'
    ? error
    : (error as Record<string, unknown>)?.message as string || '';

  return errorMessage.includes(constraintName);
}

/**
 * Checks if an error is a unique constraint violation for primary contact.
 */
export function isPrimaryContactConstraintError(error: unknown): boolean {
  return isConstraintError(error, 'idx_unique_primary_contact') ||
         isConstraintError(error, 'unique_primary_contact');
}

/**
 * Checks if an error is related to engagement foreign key reference.
 */
export function isEngagementReferenceError(error: unknown): boolean {
  return isConstraintError(error, 'engagements_contact_person_id_fkey');
}
