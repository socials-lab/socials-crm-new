// Frontend-only mock data for Creative Boost colleague rewards per credit
// This simulates the reward configuration at engagement assignment level without DB changes

// Map of engagement_assignment_id -> reward per credit for colleague
// Default is 80 CZK if not configured
export const creativeBoostRewardPerCredit: Record<string, number> = {
  // Demo data - these will be populated when assignments are configured
};

// Default reward per credit when not configured
export const DEFAULT_REWARD_PER_CREDIT = 80;

/**
 * Get reward per credit for a specific assignment
 */
export function getRewardPerCredit(assignmentId: string | null): number {
  if (!assignmentId) return DEFAULT_REWARD_PER_CREDIT;
  return creativeBoostRewardPerCredit[assignmentId] ?? DEFAULT_REWARD_PER_CREDIT;
}

/**
 * Set reward per credit for assignment (mock update)
 */
export function setRewardPerCredit(assignmentId: string, rewardPerCredit: number): void {
  creativeBoostRewardPerCredit[assignmentId] = rewardPerCredit;
}

/**
 * Get all assignments with per-credit rewards
 */
export function getAllPerCreditRewards(): Record<string, number> {
  return { ...creativeBoostRewardPerCredit };
}
