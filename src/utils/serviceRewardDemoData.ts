/**
 * Demo data: enriches services with reward_config when the DB column doesn't exist yet.
 * Once the migration (docs/supabase-migration-reward-config.sql) is run, this file can be removed.
 */

import type { Service, ServiceRewardTierConfig } from '@/types/crm';

const DEMO_REWARD_CONFIGS: Record<string, ServiceRewardTierConfig[]> = {
  SOCIALS_BOOST: [
    { tier: 'growth', roles: [{ role: 'Meta Ads Specialist', hours: 13, reward: 9100, reward_type: 'fixed_monthly' }] },
    { tier: 'pro', roles: [{ role: 'Meta Ads Specialist', hours: 17, reward: 11900, reward_type: 'fixed_monthly' }] },
    { tier: 'elite', roles: [{ role: 'Meta Ads Specialist', hours: 22, reward: 15400, reward_type: 'fixed_monthly' }] },
  ],
  PPC_BOOST: [
    { tier: 'growth', roles: [{ role: 'PPC Specialist', hours: 10, reward: 7000, reward_type: 'fixed_monthly' }] },
    { tier: 'pro', roles: [{ role: 'PPC Specialist', hours: 15, reward: 10500, reward_type: 'fixed_monthly' }] },
    { tier: 'elite', roles: [{ role: 'PPC Specialist', hours: 20, reward: 14000, reward_type: 'fixed_monthly' }] },
  ],
  PERFORMANCE_BOOST: [
    { tier: 'growth', roles: [
      { role: 'Meta Ads Specialist', hours: 13, reward: 9100, reward_type: 'fixed_monthly' },
      { role: 'PPC Specialist', hours: 8, reward: 5600, reward_type: 'fixed_monthly' },
    ]},
    { tier: 'pro', roles: [
      { role: 'Meta Ads Specialist', hours: 17, reward: 11900, reward_type: 'fixed_monthly' },
      { role: 'PPC Specialist', hours: 12, reward: 8400, reward_type: 'fixed_monthly' },
    ]},
    { tier: 'elite', roles: [
      { role: 'Meta Ads Specialist', hours: 22, reward: 15400, reward_type: 'fixed_monthly' },
      { role: 'PPC Specialist', hours: 16, reward: 11200, reward_type: 'fixed_monthly' },
    ]},
  ],
  CREATIVE_BOOST: [
    { roles: [
      { role: 'Graphic Designer', hours: 0, reward: 150, reward_type: 'per_credit' },
      { role: 'Video Editor', hours: 0, reward: 100, reward_type: 'per_credit' },
    ] },
  ],
  TIKTOK_ADS: [
    { roles: [{ role: 'Meta Ads Specialist', hours: 7, reward: 4900, reward_type: 'fixed_monthly' }] },
  ],
  HEUREKA_ZBOZI: [
    { roles: [{ role: 'PPC Specialist', hours: 4, reward: 2800, reward_type: 'fixed_monthly' }] },
  ],
  GLAMI: [
    { roles: [{ role: 'PPC Specialist', hours: 2, reward: 1400, reward_type: 'fixed_monthly' }] },
  ],
  FAVI: [
    { roles: [{ role: 'PPC Specialist', hours: 2, reward: 1400, reward_type: 'fixed_monthly' }] },
  ],
  AI_SEO: [
    { roles: [{ role: 'SEO Specialist', hours: 10, reward: 6000, reward_type: 'fixed_monthly' }] },
  ],
  COMPARATOR_SETUP: [
    { roles: [{ role: 'PPC Specialist', hours: 4, reward: 2800, reward_type: 'fixed_monthly' }] },
  ],
  ANALYTICS_MEASUREMENT: [
    { roles: [{ role: 'PPC Specialist', hours: 0, reward: 700, reward_type: 'hourly' }] },
  ],
};

/**
 * Enriches a service with demo reward_config if it doesn't already have one.
 */
export function enrichServiceWithDemoRewards(service: Service): Service {
  if (service.reward_config && service.reward_config.length > 0) {
    return service;
  }
  const demoConfig = DEMO_REWARD_CONFIGS[service.code];
  if (!demoConfig) return service;
  return { ...service, reward_config: demoConfig };
}

/**
 * Enriches all services with demo reward_config data.
 */
export function enrichServicesWithDemoRewards(services: Service[]): Service[] {
  return services.map(enrichServiceWithDemoRewards);
}
