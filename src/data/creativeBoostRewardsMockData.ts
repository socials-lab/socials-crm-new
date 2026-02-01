// Frontend-only mock data for Creative Boost colleague rewards per credit
// This simulates the reward configuration at engagement service level without DB changes

// Map of engagement_service_id -> reward per credit for colleague
// Default is 80 CZK if not configured
export const creativeBoostRewardPerCredit: Record<string, number> = {
  // Test Client s.r.o.
  'f0000000-0000-0000-0000-000000000001': 80,
  // ModaPlus
  'es-2': 100,
  // TechGadgets  
  'es-5': 75,
  // QuickBite
  'es-10': 90,
};

// Default reward per credit when not configured
export const DEFAULT_REWARD_PER_CREDIT = 80;

/**
 * Get reward per credit for a specific engagement service
 */
export function getRewardPerCredit(engagementServiceId: string | null): number {
  if (!engagementServiceId) return DEFAULT_REWARD_PER_CREDIT;
  return creativeBoostRewardPerCredit[engagementServiceId] ?? DEFAULT_REWARD_PER_CREDIT;
}

/**
 * Set reward per credit for engagement service (mock update)
 */
export function setRewardPerCredit(engagementServiceId: string, rewardPerCredit: number): void {
  creativeBoostRewardPerCredit[engagementServiceId] = rewardPerCredit;
}
