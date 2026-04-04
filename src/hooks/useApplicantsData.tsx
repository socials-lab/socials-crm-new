import { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCRMData } from './useCRMData';
import { withTimeout } from '@/utils/asyncUtils';
import type { Applicant, ApplicantStage, ApplicantNote, ApplicantNoteType } from '@/types/applicant';
import type { Colleague } from '@/types/crm';

interface ApplicantsDataContextType {
  applicants: Applicant[];
  isLoading: boolean;
  error: Error | null;
  addApplicant: (applicant: Omit<Applicant, 'id' | 'created_at' | 'updated_at' | 'notes'>) => Promise<Applicant>;
  updateApplicant: (id: string, updates: Partial<Applicant>) => Promise<void>;
  deleteApplicant: (id: string) => Promise<void>;
  updateApplicantStage: (id: string, stage: ApplicantStage) => Promise<void>;
  addNote: (applicantId: string, text: string, noteType?: ApplicantNoteType, subject?: string | null, recipients?: string[] | null) => Promise<void>;
  getApplicantById: (id: string) => Applicant | undefined;
  getApplicantsByStage: (stage: ApplicantStage) => Applicant[];
  sendInterviewInvite: (applicantId: string, emailData?: { subject: string; message: string; recipients: string[] }) => Promise<void>;
  sendRejection: (applicantId: string, emailData?: { subject: string; message: string; recipients: string[] }) => Promise<void>;
  sendOnboarding: (applicantId: string) => Promise<void>;
  completeOnboarding: (applicantId: string, data: OnboardingData) => Promise<Colleague>;
}

export interface OnboardingData {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  ico: string;
  company_name: string;
  dic?: string;
  hourly_rate: number;
  billing_street: string;
  billing_city: string;
  billing_zip: string;
  bank_account: string;
  // Additional fields from applicant onboarding
  birthday?: string | null;
  personal_email?: string | null;
}

const ApplicantsDataContext = createContext<ApplicantsDataContextType | undefined>(undefined);

// Transformer function
const transformApplicant = (row: Record<string, unknown>): Applicant => ({
  id: row.id,
  full_name: row.full_name,
  email: row.email,
  phone: row.phone,
  position: row.position,
  cover_letter: row.cover_letter,
  cv_url: row.cv_url,
  video_url: row.video_url,
  stage: row.stage,
  owner_id: row.owner_id,
  notes: row.notes || [],
  source: row.source,
  source_custom: row.source_custom,
  birthday: row.birthday,
  avatar_url: row.avatar_url,
  personal_email: row.personal_email,
  ico: row.ico,
  company_name: row.company_name,
  dic: row.dic,
  hourly_rate: row.hourly_rate ? Number(row.hourly_rate) : null,
  billing_street: row.billing_street,
  billing_city: row.billing_city,
  billing_zip: row.billing_zip,
  bank_account: row.bank_account,
  interview_invite_sent_at: row.interview_invite_sent_at,
  rejection_sent_at: row.rejection_sent_at,
  onboarding_sent_at: row.onboarding_sent_at,
  onboarding_completed_at: row.onboarding_completed_at,
  converted_to_colleague_id: row.converted_to_colleague_id,
  buddy_id: row.buddy_id ?? null,
  buddy_meeting_done: !!row.buddy_meeting_done,
  academy_completed: !!row.academy_completed,
  first_clients_assigned: !!row.first_clients_assigned,
  fully_onboarded: !!row.fully_onboarded,
  onboarding_terminated: !!row.onboarding_terminated,
  terminated_at: row.terminated_at ?? null,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export function ApplicantsDataProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { colleagues, addColleague } = useCRMData();

  // Query
  const { data: applicants = [], isLoading, error } = useQuery({
    queryKey: ['applicants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applicants')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(transformApplicant);
    },
  });

  // Mutations - all wrapped with timeout protection
  const addApplicantMutation = useMutation({
    mutationFn: async (data: Omit<Applicant, 'id' | 'created_at' | 'updated_at' | 'notes'>) => {
      return withTimeout(
        (async () => {
          const { data: result, error } = await supabase
            .from('applicants')
            .insert({
              full_name: data.full_name,
              email: data.email,
              phone: data.phone,
              position: data.position,
              cover_letter: data.cover_letter,
              cv_url: data.cv_url,
              video_url: data.video_url,
              stage: data.stage,
              owner_id: data.owner_id,
              notes: [],
              source: data.source,
              source_custom: data.source_custom,
            })
            .select()
            .single();
          if (error) throw error;
          return transformApplicant(result);
        })(),
        30000
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applicants'] }),
  });

  const updateApplicantMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Applicant> }) => {
      return withTimeout(
        (async () => {
          const updateData: Record<string, unknown> = {};
          if (updates.full_name !== undefined) updateData.full_name = updates.full_name;
          if (updates.email !== undefined) updateData.email = updates.email;
          if (updates.phone !== undefined) updateData.phone = updates.phone;
          if (updates.position !== undefined) updateData.position = updates.position;
          if (updates.cover_letter !== undefined) updateData.cover_letter = updates.cover_letter;
          if (updates.cv_url !== undefined) updateData.cv_url = updates.cv_url;
          if (updates.video_url !== undefined) updateData.video_url = updates.video_url;
          if (updates.stage !== undefined) updateData.stage = updates.stage;
          if (updates.owner_id !== undefined) updateData.owner_id = updates.owner_id;
          if (updates.source !== undefined) updateData.source = updates.source;
          if (updates.source_custom !== undefined) updateData.source_custom = updates.source_custom;
          if (updates.ico !== undefined) updateData.ico = updates.ico;
          if (updates.company_name !== undefined) updateData.company_name = updates.company_name;
          if (updates.dic !== undefined) updateData.dic = updates.dic;
          if (updates.hourly_rate !== undefined) updateData.hourly_rate = updates.hourly_rate;
          if (updates.billing_street !== undefined) updateData.billing_street = updates.billing_street;
          if (updates.billing_city !== undefined) updateData.billing_city = updates.billing_city;
          if (updates.billing_zip !== undefined) updateData.billing_zip = updates.billing_zip;
          if (updates.bank_account !== undefined) updateData.bank_account = updates.bank_account;
          if (updates.interview_invite_sent_at !== undefined) updateData.interview_invite_sent_at = updates.interview_invite_sent_at;
          if (updates.rejection_sent_at !== undefined) updateData.rejection_sent_at = updates.rejection_sent_at;
          if (updates.onboarding_sent_at !== undefined) updateData.onboarding_sent_at = updates.onboarding_sent_at;
          if (updates.onboarding_completed_at !== undefined) updateData.onboarding_completed_at = updates.onboarding_completed_at;
          if (updates.converted_to_colleague_id !== undefined) updateData.converted_to_colleague_id = updates.converted_to_colleague_id;
          if (updates.buddy_id !== undefined) updateData.buddy_id = updates.buddy_id;
          if (updates.buddy_meeting_done !== undefined) updateData.buddy_meeting_done = updates.buddy_meeting_done;
          if (updates.academy_completed !== undefined) updateData.academy_completed = updates.academy_completed;
          if (updates.first_clients_assigned !== undefined) updateData.first_clients_assigned = updates.first_clients_assigned;
          if (updates.fully_onboarded !== undefined) updateData.fully_onboarded = updates.fully_onboarded;
          if (updates.onboarding_terminated !== undefined) updateData.onboarding_terminated = updates.onboarding_terminated;
          if (updates.terminated_at !== undefined) updateData.terminated_at = updates.terminated_at;

          const { error } = await supabase.from('applicants').update(updateData).eq('id', id);
          if (error) throw error;
        })(),
        30000
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applicants'] }),
  });

  const deleteApplicantMutation = useMutation({
    mutationFn: async (id: string) => {
      return withTimeout(
        (async () => {
          const { error } = await supabase.from('applicants').delete().eq('id', id);
          if (error) throw error;
        })(),
        30000
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applicants'] }),
  });

  const addNoteMutation = useMutation({
    mutationFn: async ({
      applicantId,
      text,
      noteType = 'general',
      subject = null,
      recipients = null,
    }: {
      applicantId: string;
      text: string;
      noteType?: ApplicantNoteType;
      subject?: string | null;
      recipients?: string[] | null;
    }) => {
      return withTimeout(
        (async () => {
          // Fetch current applicant to get existing notes
          const { data: applicantData, error: fetchError } = await supabase
            .from('applicants')
            .select('notes')
            .eq('id', applicantId)
            .single();
          if (fetchError) throw fetchError;
          if (!applicantData) throw new Error('Applicant not found');

          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated for note creation');

          const currentUser = colleagues.find(c => c.profile_id === user.id);
          const userName = currentUser?.full_name || user.email || 'Unknown';

          const currentNotes = applicantData.notes || [];
          const newNote: ApplicantNote = {
            id: crypto.randomUUID(),
            applicant_id: applicantId,
            author_id: user.id,
            author_name: userName,
            text,
            note_type: noteType,
            subject,
            recipients,
            created_at: new Date().toISOString(),
          };

          const { error } = await supabase
            .from('applicants')
            .update({ notes: [...currentNotes, newNote] })
            .eq('id', applicantId);
          if (error) throw error;
        })(),
        30000
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applicants'] }),
  });

  const completeOnboardingMutation = useMutation({
    mutationFn: async ({ applicantId, data }: { applicantId: string; data: OnboardingData }) => {
      return withTimeout(
        (async () => {
          // Create colleague with all fields from onboarding
          const newColleague = await addColleague({
            full_name: data.full_name,
            email: data.email,
            phone: data.phone,
            position: data.position,
            seniority: 'mid',
            status: 'active',
            is_freelancer: true,
            internal_hourly_cost: data.hourly_rate,
            capacity_hours_per_month: null,
            monthly_fixed_cost: null,
            notes: '',
            profile_id: null,
            // Pass all billing and personal fields properly
            birthday: data.birthday || null,
            personal_email: data.personal_email || null,
            ico: data.ico || null,
            dic: data.dic || null,
            company_name: data.company_name || null,
            billing_street: data.billing_street || null,
            billing_city: data.billing_city || null,
            billing_zip: data.billing_zip || null,
            bank_account: data.bank_account || null,
          });

          // Update applicant with onboarding completion and colleague link
          await updateApplicantMutation.mutateAsync({
            id: applicantId,
            updates: {
              onboarding_completed_at: new Date().toISOString(),
              converted_to_colleague_id: newColleague.id,
              ico: data.ico,
              company_name: data.company_name,
              dic: data.dic || null,
              hourly_rate: data.hourly_rate,
              billing_street: data.billing_street,
              billing_city: data.billing_city,
              billing_zip: data.billing_zip,
              bank_account: data.bank_account,
            },
          });

          return newColleague;
        })(),
        60000 // 60 seconds for onboarding since it does multiple operations
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
      queryClient.invalidateQueries({ queryKey: ['colleagues'] });
    },
  });

  // Helper functions
  const getApplicantById = useCallback(
    (id: string) => {
      return applicants.find(a => a.id === id);
    },
    [applicants]
  );

  const getApplicantsByStage = useCallback(
    (stage: ApplicantStage) => {
      return applicants.filter(a => a.stage === stage);
    },
    [applicants]
  );

  // Wrapper functions
  const addApplicant = useCallback(async (applicant: Omit<Applicant, 'id' | 'created_at' | 'updated_at' | 'notes'>): Promise<Applicant> => {
    return addApplicantMutation.mutateAsync(applicant);
  }, [addApplicantMutation]);

  const updateApplicant = useCallback(async (id: string, updates: Partial<Applicant>): Promise<void> => {
    await updateApplicantMutation.mutateAsync({ id, updates });
  }, [updateApplicantMutation]);

  const deleteApplicant = useCallback(async (id: string): Promise<void> => {
    await deleteApplicantMutation.mutateAsync(id);
  }, [deleteApplicantMutation]);

  const updateApplicantStage = useCallback(async (id: string, stage: ApplicantStage): Promise<void> => {
    await updateApplicantMutation.mutateAsync({ id, updates: { stage } });
  }, [updateApplicantMutation]);

  const addNote = useCallback(async (
    applicantId: string,
    text: string,
    noteType: ApplicantNoteType = 'general',
    subject: string | null = null,
    recipients: string[] | null = null
  ): Promise<void> => {
    await addNoteMutation.mutateAsync({ applicantId, text, noteType, subject, recipients });
  }, [addNoteMutation]);

  const sendInterviewInvite = useCallback(async (
    applicantId: string,
    emailData?: { subject: string; message: string; recipients: string[] }
  ): Promise<void> => {
    // Update applicant status
    await updateApplicantMutation.mutateAsync({
      id: applicantId,
      updates: {
        interview_invite_sent_at: new Date().toISOString(),
        stage: 'invited_interview',
      },
    });

    // If email data provided, add note with email content
    if (emailData) {
      await addNoteMutation.mutateAsync({
        applicantId,
        text: emailData.message,
        noteType: 'email_sent',
        subject: emailData.subject,
        recipients: emailData.recipients,
      });
    }
  }, [updateApplicantMutation, addNoteMutation]);

  const sendRejection = useCallback(async (
    applicantId: string,
    emailData?: { subject: string; message: string; recipients: string[] }
  ): Promise<void> => {
    // Update applicant status
    await updateApplicantMutation.mutateAsync({
      id: applicantId,
      updates: {
        rejection_sent_at: new Date().toISOString(),
        stage: 'rejected',
      },
    });

    // If email data provided, add note with email content
    if (emailData) {
      await addNoteMutation.mutateAsync({
        applicantId,
        text: emailData.message,
        noteType: 'email_sent',
        subject: emailData.subject,
        recipients: emailData.recipients,
      });
    }
  }, [updateApplicantMutation, addNoteMutation]);

  const sendOnboarding = useCallback(async (applicantId: string): Promise<void> => {
    await updateApplicantMutation.mutateAsync({
      id: applicantId,
      updates: {
        onboarding_sent_at: new Date().toISOString(),
        stage: 'offer_sent',
      },
    });
  }, [updateApplicantMutation]);

  const completeOnboarding = useCallback(async (applicantId: string, data: OnboardingData): Promise<Colleague> => {
    return completeOnboardingMutation.mutateAsync({ applicantId, data });
  }, [completeOnboardingMutation]);

  const value: ApplicantsDataContextType = useMemo(
    () => ({
      applicants,
      isLoading,
      error: error as Error | null,
      addApplicant,
      updateApplicant,
      deleteApplicant,
      updateApplicantStage,
      addNote,
      getApplicantById,
      getApplicantsByStage,
      sendInterviewInvite,
      sendRejection,
      sendOnboarding,
      completeOnboarding,
    }),
    [
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
      sendInterviewInvite,
      sendRejection,
      sendOnboarding,
      completeOnboarding,
    ]
  );

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
