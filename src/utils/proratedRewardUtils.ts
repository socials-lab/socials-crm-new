import { parseISO, startOfMonth, getDaysInMonth, isBefore, isSameMonth, getDate } from 'date-fns';

export interface ProratedRewardResult {
  fullAmount: number;
  proratedAmount: number;
  isProrated: boolean;
  startDay: number | null;
  daysInMonth: number;
  daysWorked: number;
  percentOfMonth: number;
}

/**
 * Calculate prorated reward for an assignment that may have started mid-month
 */
export function calculateProratedReward(
  monthlyAmount: number,
  startDate: string | null | undefined,
  targetYear: number,
  targetMonth: number
): ProratedRewardResult {
  const monthStart = startOfMonth(new Date(targetYear, targetMonth - 1));
  const daysInMonth = getDaysInMonth(monthStart);

  // No start date = full amount
  if (!startDate) {
    return {
      fullAmount: monthlyAmount,
      proratedAmount: monthlyAmount,
      isProrated: false,
      startDay: null,
      daysInMonth,
      daysWorked: daysInMonth,
      percentOfMonth: 100,
    };
  }

  const start = parseISO(startDate);

  // If start is before this month = full amount
  if (isBefore(start, monthStart)) {
    return {
      fullAmount: monthlyAmount,
      proratedAmount: monthlyAmount,
      isProrated: false,
      startDay: null,
      daysInMonth,
      daysWorked: daysInMonth,
      percentOfMonth: 100,
    };
  }

  // If start is in this month
  if (isSameMonth(start, monthStart)) {
    const startDay = getDate(start);
    
    // Started on 1st = full amount
    if (startDay === 1) {
      return {
        fullAmount: monthlyAmount,
        proratedAmount: monthlyAmount,
        isProrated: false,
        startDay: 1,
        daysInMonth,
        daysWorked: daysInMonth,
        percentOfMonth: 100,
      };
    }

    // Started mid-month = prorated
    const daysWorked = daysInMonth - startDay + 1;
    const proratedAmount = Math.round((monthlyAmount / daysInMonth) * daysWorked);
    const percentOfMonth = Math.round((daysWorked / daysInMonth) * 100);

    return {
      fullAmount: monthlyAmount,
      proratedAmount,
      isProrated: true,
      startDay,
      daysInMonth,
      daysWorked,
      percentOfMonth,
    };
  }

  // Start is in the future = no reward yet
  return {
    fullAmount: monthlyAmount,
    proratedAmount: 0,
    isProrated: true,
    startDay: null,
    daysInMonth,
    daysWorked: 0,
    percentOfMonth: 0,
  };
}
