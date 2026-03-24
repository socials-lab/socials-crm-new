import { addMonths, isAfter, differenceInMonths, differenceInDays } from 'date-fns';

export interface IntroDiscountInfo {
  /** Whether the discount is currently active */
  isActive: boolean;
  /** Discount percentage (e.g. 10) */
  percent: number;
  /** Total discount months */
  totalMonths: number;
  /** Remaining months of discount */
  remainingMonths: number;
  /** Remaining days of discount */
  remainingDays: number;
  /** Discounted price */
  discountedPrice: number;
  /** Original (full) price */
  fullPrice: number;
  /** Discount amount */
  discountAmount: number;
  /** End date of discount */
  endDate: Date;
}

/**
 * Calculate intro discount status for an engagement service.
 * Returns null if no discount is configured.
 */
export function getIntroDiscountInfo(
  price: number,
  discountPercent: number | null,
  discountMonths: number | null,
  discountStartDate: string | null
): IntroDiscountInfo | null {
  if (!discountPercent || !discountMonths || !discountStartDate) return null;

  const startDate = new Date(discountStartDate);
  const endDate = addMonths(startDate, discountMonths);
  const now = new Date();
  const isActive = isAfter(endDate, now);
  
  const remainingDays = isActive ? differenceInDays(endDate, now) : 0;
  const remainingMonths = isActive ? Math.ceil(remainingDays / 30) : 0;
  
  const discountAmount = Math.round(price * discountPercent / 100);
  const discountedPrice = price - discountAmount;

  return {
    isActive,
    percent: discountPercent,
    totalMonths: discountMonths,
    remainingMonths,
    remainingDays,
    discountedPrice,
    fullPrice: price,
    discountAmount,
    endDate,
  };
}

/**
 * Get the effective monthly price for a service, considering active intro discounts.
 */
export function getEffectiveServicePrice(
  price: number,
  discountPercent: number | null,
  discountMonths: number | null,
  discountStartDate: string | null
): number {
  const info = getIntroDiscountInfo(price, discountPercent, discountMonths, discountStartDate);
  if (!info || !info.isActive) return price;
  return info.discountedPrice;
}
