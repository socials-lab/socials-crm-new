// Applicant/Recruitment types

export type ApplicantStage = 
  | 'new_applicant'       // Nový uchazeč
  | 'invited_interview'   // Pozván na pohovor
  | 'interview_done'      // Pohovor proběhl
  | 'offer_sent'          // Nabídka odeslána
  | 'hired'               // Přijat
  | 'rejected'            // Zamítnut
  | 'withdrawn';          // Stáhnul přihlášku

export type ApplicantSource = 'website' | 'linkedin' | 'referral' | 'job_portal' | 'other';

export interface ApplicantNote {
  id: string;
  applicant_id: string;
  author_id: string;
  author_name: string;
  text: string;
  created_at: string;
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
  
  // Onboarding (after hiring)
  onboarding_sent_at: string | null;
  onboarding_completed_at: string | null;
  converted_to_colleague_id: string | null;
  
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
  rejected: { title: 'Zamítnut', color: 'bg-red-100 text-red-800 border-red-200' },
  withdrawn: { title: 'Stáhnul přihlášku', color: 'bg-gray-100 text-gray-800 border-gray-200' },
};

export const APPLICANT_STAGE_ORDER: ApplicantStage[] = [
  'new_applicant',
  'invited_interview', 
  'interview_done',
  'offer_sent',
  'hired',
  'rejected',
  'withdrawn',
];

export const APPLICANT_SOURCE_LABELS: Record<ApplicantSource, string> = {
  website: 'Web',
  linkedin: 'LinkedIn',
  referral: 'Doporučení',
  job_portal: 'Pracovní portál',
  other: 'Jiný',
};
