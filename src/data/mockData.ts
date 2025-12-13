// Minimal stub - mock data removed, using Supabase
// This file provides empty defaults for components that still reference it during migration

import type { CRMUser, Service, ServiceTierConfig, Client, Engagement, Colleague } from '@/types/crm';

// Empty arrays - data now comes from Supabase via useCRMData hook
export const crmUsers: CRMUser[] = [];
export const services: Service[] = [];
export const clients: Client[] = [];
export const engagements: Engagement[] = [];
export const engagementServices: any[] = [];
export const colleagues: Colleague[] = [];

export const serviceTierConfigs: ServiceTierConfig[] = [
  { tier: 'growth', label: 'GROWTH', spend_description: 'do 100 000 Kč', min_spend: 0, max_spend: 100000 },
  { tier: 'pro', label: 'PRO', spend_description: '100 001 - 500 000 Kč', min_spend: 100001, max_spend: 500000 },
  { tier: 'elite', label: 'ELITE', spend_description: 'nad 500 000 Kč', min_spend: 500001, max_spend: null },
];

// Current user placeholder - will be replaced by auth context
export const currentUser = {
  id: '',
  full_name: 'User',
  email: '',
  role: 'admin' as const,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Helper functions - now return undefined, use useCRMData hook instead
export function getClientById(_id: string): Client | undefined { return undefined; }
export function getServiceById(_id: string): Service | undefined { return undefined; }
export function getColleagueById(_id: string): Colleague | undefined { return undefined; }
export function getEngagementById(_id: string): Engagement | undefined { return undefined; }

// Demo user functions - now no-ops, auth handled by Supabase
export function getCurrentCRMUser(): CRMUser | null { return null; }
export function isSuperAdmin(): boolean { return false; }
export function setCurrentDemoUser(_userId: string): void {}
export function resetDemoUser(): void {}
export function canCurrentUserSeeFinancials(): boolean { return true; }
export function generateFullPermissions() { return []; }
