import { addMonths, differenceInDays, isAfter } from 'date-fns';

export interface IntroDiscountInfo {
  isActive: boolean;
  percent: number;
  totalMonths: number;
  remainingMonths: number;
  remainingDays: number;
  discountedPrice: number;
  fullPrice: number;
  discountAmount: number;
  endDate: Date;
}

export function getIntroDiscountInfo(
  price: number,
  discountPercent: number | null,
  discountMonths: number | null,
  discountStartDate: string | null,
): IntroDiscountInfo | null {
  if (!discountPercent || !discountMonths || !discountStartDate) {
    return null;
  }

  const startDate = new Date(discountStartDate);
  if (Number.isNaN(startDate.getTime())) {
    throw new Error(`Invalid intro discount start date: ${discountStartDate}`);
  }
  const endDate = addMonths(startDate, discountMonths);
  const now = new Date();
  const isActive = isAfter(endDate, now);

  const remainingDays = isActive ? Math.max(0, differenceInDays(endDate, now)) : 0;
  const remainingMonths = isActive ? Math.ceil(remainingDays / 30) : 0;

  const discountAmount = Math.round((price * discountPercent) / 100);
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

export function getEffectiveServicePrice(
  price: number,
  discountPercent: number | null,
  discountMonths: number | null,
  discountStartDate: string | null,
): number {
  const info = getIntroDiscountInfo(price, discountPercent, discountMonths, discountStartDate);
  if (!info || !info.isActive) {
    return price;
  }
  return info.discountedPrice;
}
