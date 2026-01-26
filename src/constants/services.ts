import type { ServiceTierConfig } from '@/types/crm';

// Updated tier configs based on Socials Boost pricing (400k/800k spend thresholds)
export const SERVICE_TIER_CONFIGS: ServiceTierConfig[] = [
  { tier: 'growth', label: 'GROWTH', spend_description: 'do 400 000 Kč', min_spend: 0, max_spend: 400000 },
  { tier: 'pro', label: 'PRO', spend_description: '400 000 - 800 000 Kč', min_spend: 400001, max_spend: 800000 },
  { tier: 'elite', label: 'ELITE', spend_description: 'nad 800 000 Kč', min_spend: 800001, max_spend: null },
];

// Alias for backward compatibility
export const serviceTierConfigs = SERVICE_TIER_CONFIGS;
