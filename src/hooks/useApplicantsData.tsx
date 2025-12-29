import React, { createContext, useContext, ReactNode, useMemo, useState, useCallback } from 'react';
import type { Applicant, ApplicantStage, ApplicantNote } from '@/types/applicant';
import { useAuth } from './useAuth';
import { useCRMData } from './useCRMData';

// Mock data for testing without Supabase
const INITIAL_MOCK_APPLICANTS: Applicant[] = [
  {
    id: 'mock-applicant-1',
    full_name: 'Jan Novák',
    email: 'jan.novak@email.cz',
    phone: '+420 777 123 456',
    position: 'Performance Specialist',
    cover_letter: 'Dobrý den,\n\nzajímám se o pozici Performance Specialist ve vaší agentuře. Mám 3 roky zkušeností s Google Ads a Meta Ads, pracoval jsem pro několik e-commerce klientů.\n\nTěším se na případný pohovor.\n\nS pozdravem,\nJan Novák',
    cv_url: 'https://drive.google.com/file/d/example-cv',
    video_url: 'https://www.youtube.com/watch?v=example',
    stage: 'new_applicant',
    owner_id: null,
    notes: [],
    source: 'linkedin',
    source_custom: null,
    onboarding_sent_at: null,
    onboarding_completed_at: null,
    converted_to_colleague_id: null,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

interface ApplicantsDataContextType {
  applicants: Applicant[];
  isLoading: boolean;
  error: Error | null;
  addApplicant: (applicant: Omit<Applicant, 'id' | 'created_at' | 'updated_at' | 'notes'>) => void;
  updateApplicant: (id: string, updates: Partial<Applicant>) => void;
  deleteApplicant: (id: string) => void;
  updateApplicantStage: (id: string, stage: ApplicantStage) => void;
  addNote: (applicantId: string, text: string) => void;
  getApplicantById: (id: string) => Applicant | undefined;
  getApplicantsByStage: (stage: ApplicantStage) => Applicant[];
  sendOnboarding: (applicantId: string) => void;
}

const ApplicantsDataContext = createContext<ApplicantsDataContextType | undefined>(undefined);

export function ApplicantsDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { colleagues } = useCRMData();
  
  // Use local state with mock data (no Supabase)
  const [applicants, setApplicants] = useState<Applicant[]>(INITIAL_MOCK_APPLICANTS);
  const [isLoading] = useState(false);
  const [error] = useState<Error | null>(null);

  const addApplicant = useCallback((applicant: Omit<Applicant, 'id' | 'created_at' | 'updated_at' | 'notes'>) => {
    const newApplicant: Applicant = {
      ...applicant,
      id: crypto.randomUUID(),
      notes: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setApplicants(prev => [newApplicant, ...prev]);
  }, []);

  const updateApplicant = useCallback((id: string, updates: Partial<Applicant>) => {
    setApplicants(prev => prev.map(a => 
      a.id === id 
        ? { ...a, ...updates, updated_at: new Date().toISOString() } 
        : a
    ));
  }, []);

  const deleteApplicant = useCallback((id: string) => {
    setApplicants(prev => prev.filter(a => a.id !== id));
  }, []);

  const updateApplicantStage = useCallback((id: string, stage: ApplicantStage) => {
    updateApplicant(id, { stage });
  }, [updateApplicant]);

  const addNote = useCallback((applicantId: string, text: string) => {
    const currentUser = colleagues.find(c => c.profile_id === user?.id);
    
    const newNote: ApplicantNote = {
      id: crypto.randomUUID(),
      applicant_id: applicantId,
      author_id: user?.id || '',
      author_name: currentUser?.full_name || user?.email || 'Unknown',
      text,
      created_at: new Date().toISOString(),
    };

    setApplicants(prev => prev.map(a => 
      a.id === applicantId 
        ? { ...a, notes: [...a.notes, newNote], updated_at: new Date().toISOString() } 
        : a
    ));
  }, [colleagues, user]);

  const sendOnboarding = useCallback((applicantId: string) => {
    updateApplicant(applicantId, { 
      onboarding_sent_at: new Date().toISOString() 
    });
  }, [updateApplicant]);

  const getApplicantById = useCallback((id: string) => {
    return applicants.find(a => a.id === id);
  }, [applicants]);

  const getApplicantsByStage = useCallback((stage: ApplicantStage) => {
    return applicants.filter(a => a.stage === stage);
  }, [applicants]);

  const value = useMemo(() => ({
    applicants,
    isLoading,
    error,
    addApplicant,
    updateApplicant,
    deleteApplicant,
    updateApplicantStage,
    addNote,
    getApplicantById,
    getApplicantsByStage,
    sendOnboarding,
  }), [applicants, isLoading, error, addApplicant, updateApplicant, deleteApplicant, updateApplicantStage, addNote, getApplicantById, getApplicantsByStage, sendOnboarding]);

  return (
    <ApplicantsDataContext.Provider value={value}>
      {children}
    </ApplicantsDataContext.Provider>
  );
}

export function useApplicantsData() {
  const context = useContext(ApplicantsDataContext);
  if (!context) {
    throw new Error('useApplicantsData must be used within ApplicantsDataProvider');
  }
  return context;
}
