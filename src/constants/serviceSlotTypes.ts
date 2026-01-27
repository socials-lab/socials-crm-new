// Service slot types for colleague capacity tracking
// Each colleague can have different capacity for different service types

export const SERVICE_SLOT_TYPES = ['meta', 'google', 'graphics'] as const;

export type ServiceSlotType = typeof SERVICE_SLOT_TYPES[number];

export interface CapacitySlots {
  meta: number;
  google: number;
  graphics: number;
}

export const SERVICE_SLOT_LABELS: Record<ServiceSlotType, string> = {
  meta: 'Meta Ads',
  google: 'Google Ads',
  graphics: 'Grafika',
};

export const SERVICE_SLOT_COLORS: Record<ServiceSlotType, string> = {
  meta: 'bg-blue-500',
  google: 'bg-yellow-500',
  graphics: 'bg-purple-500',
};

export const SERVICE_SLOT_TEXT_COLORS: Record<ServiceSlotType, string> = {
  meta: 'text-blue-600',
  google: 'text-yellow-600',
  graphics: 'text-purple-600',
};

export const SERVICE_SLOT_BORDER_COLORS: Record<ServiceSlotType, string> = {
  meta: 'border-blue-200',
  google: 'border-yellow-200',
  graphics: 'border-purple-200',
};

export const SERVICE_SLOT_BG_COLORS: Record<ServiceSlotType, string> = {
  meta: 'bg-blue-50',
  google: 'bg-yellow-50',
  graphics: 'bg-purple-50',
};

// Default capacity slots for new colleagues
export const DEFAULT_CAPACITY_SLOTS: CapacitySlots = {
  meta: 3,
  google: 2,
  graphics: 2,
};

// Get capacity slots from colleague data with fallback
export function getCapacitySlots(capacitySlots: unknown): CapacitySlots {
  if (!capacitySlots || typeof capacitySlots !== 'object') {
    return DEFAULT_CAPACITY_SLOTS;
  }
  
  const slots = capacitySlots as Record<string, unknown>;
  
  return {
    meta: typeof slots.meta === 'number' ? slots.meta : DEFAULT_CAPACITY_SLOTS.meta,
    google: typeof slots.google === 'number' ? slots.google : DEFAULT_CAPACITY_SLOTS.google,
    graphics: typeof slots.graphics === 'number' ? slots.graphics : DEFAULT_CAPACITY_SLOTS.graphics,
  };
}

// Map engagement service to slot type based on service name/code
export function getSlotTypeFromService(serviceName: string, serviceCode?: string): ServiceSlotType | null {
  const name = (serviceName || '').toLowerCase();
  const code = (serviceCode || '').toLowerCase();
  
  // Meta Ads
  if (
    name.includes('meta') || 
    name.includes('facebook') || 
    name.includes('instagram') || 
    name.includes('socials') ||
    code.includes('meta') ||
    code.includes('socials')
  ) {
    return 'meta';
  }
  
  // Google Ads / PPC
  if (
    name.includes('google') || 
    name.includes('ppc') || 
    name.includes('search') ||
    name.includes('s-klik') ||
    name.includes('sklik') ||
    code.includes('google') ||
    code.includes('ppc') ||
    code.includes('search')
  ) {
    return 'google';
  }
  
  // Graphics / Creative
  if (
    name.includes('grafi') || 
    name.includes('design') || 
    name.includes('creative') ||
    name.includes('boost') ||
    code.includes('creative') ||
    code.includes('graphics')
  ) {
    return 'graphics';
  }
  
  return null;
}

// Map position to primary slot type
export function getSlotTypeFromPosition(position: string): ServiceSlotType | null {
  const pos = (position || '').toLowerCase();
  
  if (pos.includes('meta') || pos.includes('facebook') || pos.includes('socials')) {
    return 'meta';
  }
  
  if (pos.includes('ppc') || pos.includes('google') || pos.includes('performance')) {
    return 'google';
  }
  
  if (pos.includes('grafi') || pos.includes('design') || pos.includes('creative')) {
    return 'graphics';
  }
  
  return null;
}
