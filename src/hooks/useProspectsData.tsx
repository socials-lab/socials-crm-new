import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Prospect, ProspectInteraction, ProspectStatus, ProspectNote, ProspectWithInteractions } from '@/types/prospect';
import type { LeadNoteType } from '@/types/crm';

export function useProspectsData() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: prospects = [], isLoading } = useQuery({
    queryKey: ['prospects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prospects' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        notes: Array.isArray(p.notes) ? p.notes : [],
      })) as Prospect[];
    },
    enabled: !!user,
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['prospect_interactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prospect_interactions' as any)
        .select('*')
        .order('occurred_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ProspectInteraction[];
    },
    enabled: !!user,
  });

  // Combine prospects with their interactions
  const prospectsWithInteractions: ProspectWithInteractions[] = prospects.map(p => {
    const pInteractions = interactions.filter(i => i.prospect_id === p.id);
    return {
      ...p,
      interactions: pInteractions,
      interaction_count: pInteractions.length,
      last_interaction_at: pInteractions.length > 0 ? pInteractions[0].occurred_at : null,
    };
  });

  const updateStatus = useCallback(async (prospectId: string, status: ProspectStatus) => {
    const { error } = await supabase
      .from('prospects' as any)
      .update({ status })
      .eq('id', prospectId);

    if (error) {
      toast.error('Nepodařilo se změnit status');
      return;
    }
    toast.success('Status změněn');
    queryClient.invalidateQueries({ queryKey: ['prospects'] });
  }, [queryClient]);

  const addNote = useCallback(async (prospectId: string, text: string, noteType: LeadNoteType, authorName: string, callDate?: string | null) => {
    const prospect = prospects.find(p => p.id === prospectId);
    if (!prospect) return;

    const newNote: ProspectNote = {
      id: crypto.randomUUID(),
      text,
      note_type: noteType,
      author_name: authorName,
      created_at: new Date().toISOString(),
      call_date: callDate || null,
    };

    const updatedNotes = [...prospect.notes, newNote];

    const { error } = await supabase
      .from('prospects' as any)
      .update({ notes: updatedNotes as any })
      .eq('id', prospectId);

    if (error) {
      toast.error('Nepodařilo se přidat poznámku');
      return;
    }
    toast.success('Poznámka přidána');
    queryClient.invalidateQueries({ queryKey: ['prospects'] });
  }, [prospects, queryClient]);

  const markConverted = useCallback(async (prospectId: string, leadId: string) => {
    const { error } = await supabase
      .from('prospects' as any)
      .update({ status: 'converted', converted_to_lead_id: leadId })
      .eq('id', prospectId);

    if (error) {
      toast.error('Nepodařilo se označit jako převedený');
      return;
    }
    toast.success('Zájemce převeden na lead');
    queryClient.invalidateQueries({ queryKey: ['prospects'] });
  }, [queryClient]);

  return {
    prospects: prospectsWithInteractions,
    isLoading,
    updateStatus,
    addNote,
    markConverted,
  };
}
