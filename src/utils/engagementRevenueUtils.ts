import type { EngagementService } from '@/types/crm';
import { getEffectiveServicePrice } from '@/utils/introDiscountUtils';

function assertCreativeBoostPricing(service: EngagementService): { maxCredits: number; pricePerCredit: number } {
  if (service.creative_boost_max_credits === null || service.creative_boost_price_per_credit === null) {
    throw new Error(`Creative Boost service ${service.id} is missing max credits or price per credit.`);
  }
  if (service.creative_boost_max_credits < 0 || service.creative_boost_price_per_credit < 0) {
    throw new Error(`Creative Boost service ${service.id} has invalid negative pricing configuration.`);
  }
  return {
    maxCredits: service.creative_boost_max_credits,
    pricePerCredit: service.creative_boost_price_per_credit,
  };
}

export function getCreativeBoostExpectedMonthlyRevenue(service: EngagementService): number {
  const { maxCredits, pricePerCredit } = assertCreativeBoostPricing(service);
  return maxCredits * pricePerCredit;
}

export function getEngagementMonthlyRevenue(
  engagementId: string,
  monthlyFee: number,
  engagementServices: EngagementService[],
): number {
  const monthlyServices = engagementServices.filter((service) =>
    service.engagement_id === engagementId &&
    service.is_active &&
    service.billing_type === 'monthly',
  );

  if (monthlyServices.length === 0) {
    return monthlyFee;
  }

  return monthlyServices.reduce((sum, service) => {
    const isCreativeBoostService =
      service.creative_boost_max_credits !== null || service.creative_boost_price_per_credit !== null;
    if (isCreativeBoostService) {
      return sum + getCreativeBoostExpectedMonthlyRevenue(service);
    }
    return sum + getEffectiveServicePrice(
      service.price,
      service.intro_discount_percent,
      service.intro_discount_months,
      service.intro_discount_start_date,
    );
  }, 0);
}
