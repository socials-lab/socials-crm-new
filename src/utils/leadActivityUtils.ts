import type { Lead } from '@/types/crm';

export interface LeadActivityInfo {
  lastActivityDate: Date | null;
  daysSinceActivity: number;
  isStale: boolean; // true if > 3 days
  activityLabel: string; // "před 2 dny", "dnes", etc.
}

export function getLeadLastActivity(lead: Lead): LeadActivityInfo {
  const activityDates = [
    lead.offer_sent_at,
    lead.offer_created_at,
    lead.access_request_sent_at,
    lead.access_received_at,
    lead.onboarding_form_sent_at,
    lead.onboarding_form_completed_at,
    lead.contract_created_at,
    lead.contract_sent_at,
    lead.contract_signed_at,
    lead.updated_at,
  ]
    .filter(Boolean)
    .map(d => new Date(d!))
    .sort((a, b) => b.getTime() - a.getTime());

  const lastActivityDate = activityDates[0] || null;
  const now = new Date();
  const daysSinceActivity = lastActivityDate
    ? Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24))
    : Infinity;

  return {
    lastActivityDate,
    daysSinceActivity,
    isStale: daysSinceActivity > 3,
    activityLabel: formatActivityLabel(daysSinceActivity),
  };
}

function formatActivityLabel(days: number): string {
  if (days === 0) return 'dnes';
  if (days === 1) return 'včera';
  if (days < 7) return `před ${days} dny`;
  if (days < 30) return `před ${Math.floor(days / 7)} týdny`;
  if (days === Infinity) return 'nikdy';
  return `před ${Math.floor(days / 30)} měsíci`;
}
