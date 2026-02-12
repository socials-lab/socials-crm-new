// Frontend-only mock data for Creative Boost colleague rewards per credit
// This simulates the reward configuration at engagement assignment level without DB changes

export interface CreativeBoostRewards {
  bannerRewardPerCredit: number;
  videoRewardPerCredit: number;
}

// Map of engagement_assignment_id -> reward per credit for colleague (banner & video)
// Defaults are 80 CZK for banners, 80 CZK for videos
export const creativeBoostRewards: Record<string, CreativeBoostRewards> = {
  // Demo data - these will be populated when assignments are configured
};

// Default rewards per credit when not configured
export const DEFAULT_BANNER_REWARD = 80;
export const DEFAULT_VIDEO_REWARD = 80;

// Legacy default for backward compatibility
export const DEFAULT_REWARD_PER_CREDIT = 80;

/**
 * Get rewards per credit for a specific assignment (banner & video)
 */
export function getRewards(assignmentId: string | null): CreativeBoostRewards {
  if (!assignmentId) return { bannerRewardPerCredit: DEFAULT_BANNER_REWARD, videoRewardPerCredit: DEFAULT_VIDEO_REWARD };
  return creativeBoostRewards[assignmentId] ?? { bannerRewardPerCredit: DEFAULT_BANNER_REWARD, videoRewardPerCredit: DEFAULT_VIDEO_REWARD };
}

/**
 * Get reward per credit for a specific assignment (legacy - returns banner reward for backward compat)
 */
export function getRewardPerCredit(assignmentId: string | null): number {
  const rewards = getRewards(assignmentId);
  return rewards.bannerRewardPerCredit;
}

/**
 * Set rewards per credit for assignment (mock update)
 */
export function setRewards(assignmentId: string, rewards: CreativeBoostRewards): void {
  creativeBoostRewards[assignmentId] = rewards;
}

/**
 * Legacy: Set reward per credit for assignment (sets both banner and video to same value)
 */
export function setRewardPerCredit(assignmentId: string, rewardPerCredit: number): void {
  const existing = creativeBoostRewards[assignmentId];
  if (existing) {
    existing.bannerRewardPerCredit = rewardPerCredit;
  } else {
    creativeBoostRewards[assignmentId] = { bannerRewardPerCredit: rewardPerCredit, videoRewardPerCredit: DEFAULT_VIDEO_REWARD };
  }
}

/**
 * Get all assignments with per-credit rewards
 */
export function getAllPerCreditRewards(): Record<string, CreativeBoostRewards> {
  return { ...creativeBoostRewards };
}
