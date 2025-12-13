import type { ServiceTierConfig } from '@/types/crm';

export const SERVICE_TIER_CONFIGS: ServiceTierConfig[] = [
  { tier: 'growth', label: 'GROWTH', spend_description: 'do 100 000 Kč', min_spend: 0, max_spend: 100000 },
  { tier: 'pro', label: 'PRO', spend_description: '100 001 - 500 000 Kč', min_spend: 100001, max_spend: 500000 },
  { tier: 'elite', label: 'ELITE', spend_description: 'nad 500 000 Kč', min_spend: 500001, max_spend: null },
];

// Alias for backward compatibility
export const serviceTierConfigs = SERVICE_TIER_CONFIGS;
