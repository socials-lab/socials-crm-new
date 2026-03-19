import type { EngagementService } from '@/types/crm';

/**
 * Calculate the total monthly revenue for an engagement, including Creative Boost
 * credit-based revenue (maxCredits × pricePerCredit) on top of the base monthly_fee.
 */
export function getEngagementMonthlyRevenue(
  engagementId: string,
  monthlyFee: number,
  engagementServices: EngagementService[]
): number {
  const cbServices = engagementServices.filter(
    s => s.engagement_id === engagementId && s.is_active && s.creative_boost_max_credits
  );

  const cbRevenue = cbServices.reduce((sum, s) => {
    const maxCredits = s.creative_boost_max_credits || 0;
    const pricePerCredit = s.creative_boost_price_per_credit || 400;
    return sum + (maxCredits * pricePerCredit);
  }, 0);

  return (monthlyFee || 0) + cbRevenue;
}
