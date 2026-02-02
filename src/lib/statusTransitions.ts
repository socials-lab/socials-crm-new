import type { ClientStatus, EngagementStatus, Engagement } from '@/types/crm';

// Client status transitions
// Standard users can only do these transitions
const VALID_CLIENT_TRANSITIONS: Record<ClientStatus, ClientStatus[]> = {
  lead: ['active', 'potential', 'lost'],
  potential: ['active', 'lost'],
  active: ['paused', 'lost'],
  paused: ['active', 'lost', 'potential'], // Added potential for re-evaluation path
  lost: [], // Terminal for non-admins
};

// Super admin can also do these additional transitions
const ADMIN_ONLY_CLIENT_TRANSITIONS: Record<ClientStatus, ClientStatus[]> = {
  lost: ['active', 'potential'], // Reactivation
  lead: [],
  potential: [],
  active: [],
  paused: [],
};

/**
 * Check if a client status transition is allowed
 */
export function canTransitionClientStatus(
  from: ClientStatus,
  to: ClientStatus,
  isSuperAdmin: boolean = false
): boolean {
  // Same status always allowed (no change)
  if (from === to) return true;

  // Check standard transitions
  const standardAllowed = VALID_CLIENT_TRANSITIONS[from]?.includes(to) ?? false;
  if (standardAllowed) return true;

  // Check admin-only transitions
  if (isSuperAdmin) {
    return ADMIN_ONLY_CLIENT_TRANSITIONS[from]?.includes(to) ?? false;
  }

  return false;
}

/**
 * Get all available status options for a client based on current status and user role
 */
export function getAvailableClientStatuses(
  currentStatus: ClientStatus,
  isSuperAdmin: boolean = false
): ClientStatus[] {
  const standard = VALID_CLIENT_TRANSITIONS[currentStatus] || [];
  const adminOnly = isSuperAdmin ? (ADMIN_ONLY_CLIENT_TRANSITIONS[currentStatus] || []) : [];

  // Include current status first, then available transitions
  return [currentStatus, ...new Set([...standard, ...adminOnly])];
}

// Engagement status transitions
const VALID_ENGAGEMENT_TRANSITIONS: Record<EngagementStatus, EngagementStatus[]> = {
  planned: ['active', 'cancelled'],
  active: ['paused', 'completed', 'cancelled'],
  paused: ['active', 'completed', 'cancelled'],
  completed: [], // Terminal state
  cancelled: [], // Terminal state
};

// Admin-only engagement transitions
const ADMIN_ONLY_ENGAGEMENT_TRANSITIONS: Record<EngagementStatus, EngagementStatus[]> = {
  completed: ['active'], // Reopen completed engagement
  cancelled: ['active'], // Reopen cancelled engagement
  planned: [],
  active: [],
  paused: [],
};

/**
 * Check if an engagement status transition is allowed
 */
export function canTransitionEngagementStatus(
  from: EngagementStatus,
  to: EngagementStatus,
  isSuperAdmin: boolean = false
): boolean {
  if (from === to) return true;

  const standardAllowed = VALID_ENGAGEMENT_TRANSITIONS[from]?.includes(to) ?? false;
  if (standardAllowed) return true;

  if (isSuperAdmin) {
    return ADMIN_ONLY_ENGAGEMENT_TRANSITIONS[from]?.includes(to) ?? false;
  }

  return false;
}

/**
 * Get all available status options for an engagement based on current status and user role
 */
export function getAvailableEngagementStatuses(
  currentStatus: EngagementStatus,
  isSuperAdmin: boolean = false
): EngagementStatus[] {
  const standard = VALID_ENGAGEMENT_TRANSITIONS[currentStatus] || [];
  const adminOnly = isSuperAdmin ? (ADMIN_ONLY_ENGAGEMENT_TRANSITIONS[currentStatus] || []) : [];

  return [currentStatus, ...new Set([...standard, ...adminOnly])];
}

/**
 * Get human-readable Czech labels for client statuses
 */
export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  lead: 'Lead',
  potential: 'Potenciální',
  active: 'Aktivní',
  paused: 'Pozastavený',
  lost: 'Ztracený',
};

/**
 * Get human-readable Czech labels for engagement statuses
 */
export const ENGAGEMENT_STATUS_LABELS: Record<EngagementStatus, string> = {
  planned: 'Plánovaný',
  active: 'Aktivní',
  paused: 'Pozastavený',
  completed: 'Dokončený',
  cancelled: 'Zrušený',
};

/**
 * Check if engagement can be terminated (completed/cancelled) based on notice period
 * Returns { allowed: boolean; reason?: string; noticeEndDate?: Date }
 */
export function canTerminateEngagement(
  engagement: Engagement,
  targetStatus: 'completed' | 'cancelled',
  isSuperAdmin: boolean = false
): { allowed: boolean; reason?: string; noticeEndDate?: Date } {
  // If no notice period set, always allow
  if (!engagement.notice_period_months || engagement.notice_period_months === 0) {
    return { allowed: true };
  }

  // Super admin can override notice period
  if (isSuperAdmin) {
    return { allowed: true };
  }

  // Calculate when notice period would end
  const startDate = new Date(engagement.start_date);
  const noticeEndDate = new Date(startDate);
  noticeEndDate.setMonth(noticeEndDate.getMonth() + engagement.notice_period_months);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  noticeEndDate.setHours(0, 0, 0, 0);

  if (today < noticeEndDate) {
    return {
      allowed: false,
      reason: `Výpovědní lhůta (${engagement.notice_period_months} měsíců) vyprší ${noticeEndDate.toLocaleDateString('cs-CZ')}. Pouze super admin může tuto podmínku přeskočit.`,
      noticeEndDate,
    };
  }

  return { allowed: true };
}
