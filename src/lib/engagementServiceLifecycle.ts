import { endOfMonth, parseISO, startOfMonth } from 'date-fns';
import type { EngagementService } from '@/types/crm';

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  return parseISO(value);
}

// Service is considered active in a period when its active interval overlaps that period.
// end_date is treated as exclusive ("terminated from this date").
export function isEngagementServiceActiveInPeriod(
  service: EngagementService,
  periodStart: Date,
  periodEnd: Date,
): boolean {
  const serviceStart = parseDate(service.effective_from);
  const serviceEnd = parseDate(service.end_date);

  if (serviceEnd) {
    const startsBeforeOrOnPeriodEnd = !serviceStart || serviceStart <= periodEnd;
    const endsAfterPeriodStart = serviceEnd > periodStart;
    return startsBeforeOrOnPeriodEnd && endsAfterPeriodStart;
  }

  if (!service.is_active) {
    return false;
  }

  return !serviceStart || serviceStart <= periodEnd;
}

export function isEngagementServiceActiveInMonth(
  service: EngagementService,
  year: number,
  month: number,
): boolean {
  const periodStart = startOfMonth(new Date(year, month - 1));
  const periodEnd = endOfMonth(new Date(year, month - 1));
  return isEngagementServiceActiveInPeriod(service, periodStart, periodEnd);
}
