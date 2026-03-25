import { useCallback, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';
import type { Prospect, ProspectInteraction, ProspectStatus, ProspectNote, ProspectWithInteractions } from '@/types/prospect';
import type { LeadNoteType } from '@/types/crm';

function parseProspectStatus(value: unknown): ProspectStatus {
  if (value === 'new' || value === 'contacted' || value === 'qualified' || value === 'converted' || value === 'irrelevant') {
    return value;
  }
  throw new Error('Invalid prospect status');
}

function parseProspect(row: Record<string, unknown>): Prospect {
  const notes = Array.isArray(row.notes) ? (row.notes as ProspectNote[]) : [];
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    phone: row.phone === null ? null : row.phone ? String(row.phone) : null,
    company: row.company === null ? null : row.company ? String(row.company) : null,
    status: parseProspectStatus(row.status),
    converted_to_lead_id: row.converted_to_lead_id === null ? null : row.converted_to_lead_id ? String(row.converted_to_lead_id) : null,
    notes,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function parseInteractionType(value: unknown): ProspectInteraction['type'] {
  if (value === 'webinar_registration' || value === 'lead_magnet_download' || value === 'webinar_attended' || value === 'other') {
    return value;
  }
  throw new Error('Invalid prospect interaction type');
}

function parseInteraction(row: Record<string, unknown>): ProspectInteraction {
  return {
    id: String(row.id),
    prospect_id: String(row.prospect_id),
    type: parseInteractionType(row.type),
    title: String(row.title),
    metadata: (row.metadata as Record<string, unknown> | null | undefined) ?? null,
    occurred_at: String(row.occurred_at),
    created_at: String(row.created_at),
  };
}

export function useProspectsData() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: prospects = [],
    isLoading: isProspectsLoading,
    error: prospectsError,
  } = useQuery<Prospect[], Error>({
    queryKey: ['prospects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prospects' as never)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return ((data ?? []) as Array<Record<string, unknown>>).map(parseProspect);
    },
    enabled: !!user,
  });

  const {
    data: interactions = [],
    isLoading: isInteractionsLoading,
    error: interactionsError,
  } = useQuery<ProspectInteraction[], Error>({
    queryKey: ['prospect_interactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prospect_interactions' as never)
        .select('*')
        .order('occurred_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }
      return ((data ?? []) as Array<Record<string, unknown>>).map(parseInteraction);
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (prospectsError) {
      toast.error(`Nepodařilo se načíst zájemce: ${prospectsError.message}`);
    }
  }, [prospectsError]);

  useEffect(() => {
    if (interactionsError) {
      toast.error(`Nepodařilo se načíst interakce zájemců: ${interactionsError.message}`);
    }
  }, [interactionsError]);

  const prospectsWithInteractions = useMemo<ProspectWithInteractions[]>(() => {
    return prospects.map((prospect) => {
      const prospectInteractions = interactions.filter((interaction) => interaction.prospect_id === prospect.id);
      return {
        ...prospect,
        interactions: prospectInteractions,
        interaction_count: prospectInteractions.length,
        last_interaction_at: prospectInteractions.length > 0 ? prospectInteractions[0].occurred_at : null,
      };
    });
  }, [prospects, interactions]);

  const updateStatus = useCallback(async (prospectId: string, status: ProspectStatus) => {
    const { error } = await supabase
      .from('prospects' as never)
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
      .from('prospects' as never)
      .update({ notes: updatedNotes as unknown as Json })
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
      .from('prospects' as never)
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
    isLoading: isProspectsLoading || isInteractionsLoading,
    error: prospectsError ?? interactionsError ?? null,
    updateStatus,
    addNote,
    markConverted,
  };
}
