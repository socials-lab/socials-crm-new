// Creative Boost Types

export type OutputCategory = 
  | 'banner' 
  | 'banner_translation' 
  | 'banner_revision' 
  | 'ai_photo' 
  | 'video' 
  | 'video_translation' 
  | 'video_revision';

export type ItemStatus = 'draft' | 'confirmed';

export type MonthStatus = 'active' | 'inactive';

export interface OutputType {
  id: string;
  name: string;
  category: OutputCategory;
  baseCredits: number;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// New simplified type for spreadsheet mode
export interface ClientMonthOutput {
  id: string;
  clientId: string;
  year: number;
  month: number;
  outputTypeId: string;
  normalCount: number;     // Počet normálních kusů
  expressCount: number;    // Počet express kusů (×1.5)
  colleagueId: string;     // Who worked on it
  createdAt: string;
  updatedAt: string;
}

// Legacy type - keeping for backwards compatibility
export interface CreativeBoostItem {
  id: string;
  clientId: string;
  year: number;
  month: number;
  outputTypeId: string;
  description: string;
  date: string;
  colleagueId: string;
  isExpress: boolean;
  extraRevisions: number;
  baseCredits: number;
  expressCredits: number;
  revisionCredits: number;
  totalCredits: number;
  status: ItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreativeBoostClientMonth {
  id: string;
  clientId: string;
  year: number;
  month: number;
  minCredits: number;
  maxCredits: number;
  pricePerCredit: number;
  colleagueId: string;     // Assigned colleague for this month
  status: MonthStatus;
  // Link to engagement service
  engagementServiceId: string | null;
  engagementId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreativeBoostClient {
  clientId: string;
  isActive: boolean;
  defaultMinCredits: number;
  defaultMaxCredits: number;
  defaultPricePerCredit: number;
}

// Computed types for display
export interface ClientMonthSummary {
  clientId: string;
  clientName: string;
  brandName: string;
  year: number;
  month: number;
  minCredits: number;
  maxCredits: number;
  usedCredits: number;
  expressCredits: number;
  normalCredits: number;
  remainingCredits: number;
  estimatedInvoice: number;
  pricePerCredit: number;
  status: MonthStatus;
  itemCount: number;
}

// Settings change history
export type SettingsChangeType = 'max_credits' | 'price_per_credit' | 'status' | 'colleague';

export interface CreativeBoostSettingsChange {
  id: string;
  clientMonthId: string;
  clientId: string;
  year: number;
  month: number;
  changeType: SettingsChangeType;
  fieldName: string;
  oldValue: string | number;
  newValue: string | number;
  changedBy: string;
  changedByName: string;
  changedAt: string;
}
