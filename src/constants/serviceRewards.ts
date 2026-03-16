/**
 * Hardcoded reward lookup table for colleague compensation recommendations.
 * Maps service_code + tier → array of role-based compensations.
 *
 * For expansion scenarios (new country/shop), rewards are multiplied
 * by the same multiplier as the price.
 */

export type RewardType = 'fixed_monthly' | 'per_credit' | 'hourly';

export interface RoleReward {
  role: string;
  hours: number;
  reward: number;
  rewardType: RewardType;
}

export interface ServiceRewardConfig {
  /** Match key: lowercase service name keyword */
  serviceKey: string;
  tier?: 'growth' | 'pro' | 'elite';
  roles: RoleReward[];
}

/**
 * Core services — monthly fixed rewards by tier
 */
const CORE_SERVICE_REWARDS: ServiceRewardConfig[] = [
  // Socials Boost
  { serviceKey: 'socials boost', tier: 'growth', roles: [
    { role: 'Meta Ads Specialist', hours: 13, reward: 9100, rewardType: 'fixed_monthly' },
  ]},
  { serviceKey: 'socials boost', tier: 'pro', roles: [
    { role: 'Meta Ads Specialist', hours: 17, reward: 11900, rewardType: 'fixed_monthly' },
  ]},
  { serviceKey: 'socials boost', tier: 'elite', roles: [
    { role: 'Meta Ads Specialist', hours: 22, reward: 15400, rewardType: 'fixed_monthly' },
  ]},

  // PPC Boost
  { serviceKey: 'ppc boost', tier: 'growth', roles: [
    { role: 'PPC Specialist', hours: 10, reward: 7000, rewardType: 'fixed_monthly' },
  ]},
  { serviceKey: 'ppc boost', tier: 'pro', roles: [
    { role: 'PPC Specialist', hours: 15, reward: 10500, rewardType: 'fixed_monthly' },
  ]},
  { serviceKey: 'ppc boost', tier: 'elite', roles: [
    { role: 'PPC Specialist', hours: 20, reward: 14000, rewardType: 'fixed_monthly' },
  ]},

  // Performance Boost
  { serviceKey: 'performance boost', tier: 'growth', roles: [
    { role: 'Meta Ads Specialist', hours: 13, reward: 9100, rewardType: 'fixed_monthly' },
    { role: 'PPC Specialist', hours: 8, reward: 5600, rewardType: 'fixed_monthly' },
  ]},
  { serviceKey: 'performance boost', tier: 'pro', roles: [
    { role: 'Meta Ads Specialist', hours: 17, reward: 11900, rewardType: 'fixed_monthly' },
    { role: 'PPC Specialist', hours: 12, reward: 8400, rewardType: 'fixed_monthly' },
  ]},
  { serviceKey: 'performance boost', tier: 'elite', roles: [
    { role: 'Meta Ads Specialist', hours: 22, reward: 15400, rewardType: 'fixed_monthly' },
    { role: 'PPC Specialist', hours: 16, reward: 11200, rewardType: 'fixed_monthly' },
  ]},
];

/**
 * Addon services — fixed rewards (no tier)
 */
const ADDON_SERVICE_REWARDS: ServiceRewardConfig[] = [
  { serviceKey: 'creative boost', roles: [
    { role: 'Graphic Designer', hours: 0, reward: 150, rewardType: 'per_credit' },
  ]},
  { serviceKey: 'tiktok', roles: [
    { role: 'Meta Ads Specialist', hours: 7, reward: 4900, rewardType: 'fixed_monthly' },
  ]},
  { serviceKey: 'heureka', roles: [
    { role: 'PPC Specialist', hours: 4, reward: 2800, rewardType: 'fixed_monthly' },
  ]},
  { serviceKey: 'zboží', roles: [
    { role: 'PPC Specialist', hours: 4, reward: 2800, rewardType: 'fixed_monthly' },
  ]},
  { serviceKey: 'glami', roles: [
    { role: 'PPC Specialist', hours: 2, reward: 1400, rewardType: 'fixed_monthly' },
  ]},
  { serviceKey: 'favi', roles: [
    { role: 'PPC Specialist', hours: 2, reward: 1400, rewardType: 'fixed_monthly' },
  ]},
];

const ALL_REWARDS = [...CORE_SERVICE_REWARDS, ...ADDON_SERVICE_REWARDS];

/**
 * Look up recommended colleague rewards for a service name + optional tier.
 * Matches by keyword in service name (case-insensitive).
 */
export function getServiceRewardRecommendation(
  serviceName: string,
  tier?: string | null
): RoleReward[] | null {
  const nameLower = serviceName.toLowerCase();

  // Try exact tier match first for core services
  if (tier) {
    const tierLower = tier.toLowerCase();
    const match = ALL_REWARDS.find(
      r => r.tier === tierLower && nameLower.includes(r.serviceKey)
    );
    if (match) return match.roles;
  }

  // Fallback: match without tier (addons)
  const match = ALL_REWARDS.find(
    r => !r.tier && nameLower.includes(r.serviceKey)
  );
  if (match) return match.roles;

  return null;
}

/**
 * Apply expansion multiplier to role rewards.
 */
export function applyMultiplierToRewards(roles: RoleReward[], multiplier: number): RoleReward[] {
  return roles.map(r => ({
    ...r,
    hours: Math.round(r.hours * multiplier * 10) / 10,
    reward: r.rewardType === 'per_credit' ? r.reward : Math.round(r.reward * multiplier),
  }));
}
