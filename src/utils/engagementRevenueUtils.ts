import type { EngagementService } from '@/types/crm';
import { getEffectiveServicePrice } from '@/utils/introDiscountUtils';

/**
 * Calculate the total monthly revenue for an engagement, including Creative Boost
 * credit-based revenue (maxCredits × pricePerCredit) on top of the base monthly_fee.
 * Also accounts for active intro discounts on individual services.
 */
export function getEngagementMonthlyRevenue(
  engagementId: string,
  monthlyFee: number,
  engagementServices: EngagementService[]
): number {
  const activeServices = engagementServices.filter(
    s => s.engagement_id === engagementId && s.is_active
  );

  // Calculate discount adjustment: sum of (full price - effective price) for services with active discounts
  let discountAdjustment = 0;
  activeServices.forEach(s => {
    if (s.intro_discount_percent && s.billing_type === 'monthly') {
      const effectivePrice = getEffectiveServicePrice(
        s.price, s.intro_discount_percent, s.intro_discount_months, s.intro_discount_start_date
      );
      discountAdjustment += (s.price - effectivePrice);
    }
  });

  // CB revenue
  const cbRevenue = activeServices
    .filter(s => s.creative_boost_max_credits)
    .reduce((sum, s) => {
      const maxCredits = s.creative_boost_max_credits || 0;
      const pricePerCredit = s.creative_boost_price_per_credit || 400;
      return sum + (maxCredits * pricePerCredit);
    }, 0);

  return (monthlyFee || 0) + cbRevenue - discountAdjustment;
}
