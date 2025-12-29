import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Applicant, ApplicantStage, ApplicantNote } from '@/types/applicant';
import { useAuth } from './useAuth';
import { useCRMData } from './useCRMData';

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
}

const ApplicantsDataContext = createContext<ApplicantsDataContextType | undefined>(undefined);

export function ApplicantsDataProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { colleagues } = useCRMData();

  // Fetch applicants - using any type until table is created in DB
  const { data: applicantsData = [], isLoading, error } = useQuery({
    queryKey: ['applicants'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('applicants')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((row: any) => ({
        id: row.id,
        full_name: row.full_name,
        email: row.email,
        phone: row.phone,
        position: row.position,
        cover_letter: row.cover_letter,
        cv_url: row.cv_url,
        video_url: row.video_url,
        stage: row.stage as ApplicantStage,
        owner_id: row.owner_id,
        notes: (row.notes as ApplicantNote[]) || [],
        source: row.source || 'website',
        source_custom: row.source_custom,
        onboarding_sent_at: row.onboarding_sent_at,
        onboarding_completed_at: row.onboarding_completed_at,
        converted_to_colleague_id: row.converted_to_colleague_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })) as Applicant[];
    },
    enabled: !!user,
  });

  // Add applicant mutation
  const addMutation = useMutation({
    mutationFn: async (applicant: Omit<Applicant, 'id' | 'created_at' | 'updated_at' | 'notes'>) => {
      const { data, error } = await (supabase as any)
        .from('applicants')
        .insert({
          full_name: applicant.full_name,
          email: applicant.email,
          phone: applicant.phone,
          position: applicant.position,
          cover_letter: applicant.cover_letter,
          cv_url: applicant.cv_url,
          video_url: applicant.video_url,
          stage: applicant.stage,
          owner_id: applicant.owner_id,
          source: applicant.source,
          source_custom: applicant.source_custom,
          notes: [],
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
    },
  });

  // Update applicant mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Applicant> }) => {
      const { notes, ...restUpdates } = updates;
      const updateData: Record<string, any> = { ...restUpdates };
      
      if (notes !== undefined) {
        updateData.notes = notes;
      }
      
      const { error } = await (supabase as any)
        .from('applicants')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
    },
  });

  // Delete applicant mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('applicants')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
    },
  });

  // Helper functions
  const addApplicant = (applicant: Omit<Applicant, 'id' | 'created_at' | 'updated_at' | 'notes'>) => {
    addMutation.mutate(applicant);
  };

  const updateApplicant = (id: string, updates: Partial<Applicant>) => {
    updateMutation.mutate({ id, updates });
  };

  const deleteApplicant = (id: string) => {
    deleteMutation.mutate(id);
  };

  const updateApplicantStage = (id: string, stage: ApplicantStage) => {
    updateMutation.mutate({ id, updates: { stage } });
  };

  const addNote = (applicantId: string, text: string) => {
    const applicant = applicantsData.find(a => a.id === applicantId);
    if (!applicant) return;

    const currentUser = colleagues.find(c => c.profile_id === user?.id);
    
    const newNote: ApplicantNote = {
      id: crypto.randomUUID(),
      applicant_id: applicantId,
      author_id: user?.id || '',
      author_name: currentUser?.full_name || user?.email || 'Unknown',
      text,
      created_at: new Date().toISOString(),
    };

    const updatedNotes = [...applicant.notes, newNote];
    updateMutation.mutate({ id: applicantId, updates: { notes: updatedNotes } });
  };

  const getApplicantById = (id: string) => {
    return applicantsData.find(a => a.id === id);
  };

  const getApplicantsByStage = (stage: ApplicantStage) => {
    return applicantsData.filter(a => a.stage === stage);
  };

  const value = useMemo(() => ({
    applicants: applicantsData,
    isLoading,
    error: error as Error | null,
    addApplicant,
    updateApplicant,
    deleteApplicant,
    updateApplicantStage,
    addNote,
    getApplicantById,
    getApplicantsByStage,
  }), [applicantsData, isLoading, error, colleagues, user]);

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
