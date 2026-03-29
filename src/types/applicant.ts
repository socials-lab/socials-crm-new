// Applicant/Recruitment types

export type ApplicantStage = 
  | 'new_applicant'       // Nový uchazeč
  | 'invited_interview'   // Pozván na pohovor
  | 'interview_done'      // Pohovor proběhl
  | 'offer_sent'          // Nabídka odeslána
  | 'hired'               // Přijat
  | 'bad_fit'             // Bad fit
  | 'withdrawn'           // Stáhnul přihlášku
  | 'postponed';          // Odloženo

export type ApplicantSource = 'website' | 'linkedin' | 'referral' | 'job_portal' | 'other';

export type ApplicantNoteType = 'general' | 'internal' | 'email_sent' | 'email_received';

export interface ApplicantNote {
  id: string;
  applicant_id: string;
  author_id: string;
  author_name: string;
  text: string;
  created_at: string;
  note_type?: ApplicantNoteType;
  subject?: string | null;
  recipients?: string[] | null;
}

export interface Applicant {
  id: string;
  
  // Basic info
  full_name: string;
  email: string;
  phone: string | null;
  
  // Position
  position: string;
  
  // Application content
  cover_letter: string | null;
  cv_url: string | null;
  video_url: string | null;
  portfolio_url: string | null;
  ai_usage: string | null;
  personal_brand: string | null;
  social_links: string | null;
  
  // Pipeline
  stage: ApplicantStage;
  owner_id: string | null;
  
  // Notes (JSONB)
  notes: ApplicantNote[];
  
  // Source
  source: ApplicantSource;
  source_custom: string | null;
  
  // Freelancer/Company info (filled during onboarding)
  ico: string | null;
  company_name: string | null;
  dic: string | null;
  hourly_rate: number | null;
  billing_street: string | null;
  billing_city: string | null;
  billing_zip: string | null;
  bank_account: string | null;
  
  // Personal info (filled during onboarding)
  birthday: string | null;
  personal_email: string | null;
  avatar_url: string | null;
  
  // Communication tracking
  interview_invite_sent_at: string | null;
  rejection_sent_at: string | null;
  
  // Onboarding (after hiring)
  onboarding_sent_at: string | null;
  onboarding_completed_at: string | null;
  converted_to_colleague_id: string | null;
  
  // Contract tracking
  contract_sent_at: string | null;
  contract_signed_at: string | null;

  // Onboarding checklist (post-hire)
  buddy_id: string | null;              // Přidělený buddy/mentor
  buddy_meeting_done: boolean;          // Úvodní schůzka s buddym proběhla
  academy_completed: boolean;           // Prošel akademií (videa)
  first_clients_assigned: boolean;      // Přidělení prvních klientů
  fully_onboarded: boolean;             // 100% zapracovaný

  // Termination (failed onboarding)
  onboarding_terminated: boolean;       // Ukončeno během zapracování
  terminated_at: string | null;         // Datum ukončení
  termination_reason: string | null;    // Důvod ukončení
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface ApplicantWithOwner extends Applicant {
  owner?: {
    id: string;
    full_name: string;
  } | null;
}

// Stage configuration for Kanban
export const APPLICANT_STAGE_CONFIG: Record<ApplicantStage, { title: string; color: string }> = {
  new_applicant: { title: 'Nový uchazeč', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  invited_interview: { title: 'Pozván na pohovor', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  interview_done: { title: 'Pohovor proběhl', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  offer_sent: { title: 'Nabídka odeslána', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  hired: { title: 'Přijat', color: 'bg-green-100 text-green-800 border-green-200' },
  bad_fit: { title: 'Bad fit', color: 'bg-red-100 text-red-800 border-red-200' },
  withdrawn: { title: 'Stáhnul přihlášku', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  postponed: { title: 'Odloženo', color: 'bg-amber-100 text-amber-800 border-amber-200' },
};

export const APPLICANT_STAGE_ORDER: ApplicantStage[] = [
  'new_applicant',
  'invited_interview', 
  'interview_done',
  'offer_sent',
  'hired',
  'bad_fit',
  'withdrawn',
  'postponed',
];

export const APPLICANT_SOURCE_LABELS: Record<ApplicantSource, string> = {
  website: 'Web',
  linkedin: 'LinkedIn',
  referral: 'Doporučení',
  job_portal: 'Pracovní portál',
  other: 'Jiný',
};
