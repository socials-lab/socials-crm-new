import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logActivity } from '@/services/activityLogger';
import { toast } from 'sonner';
import type { Prospect, ProspectInteraction, ProspectStatus, ProspectNote, ProspectWithInteractions } from '@/types/prospect';
import type { LeadNoteType } from '@/types/crm';

const DEMO_PROSPECTS: Prospect[] = [
  {
    id: 'demo-1',
    name: 'Jan Novák',
    email: 'jan.novak@firma.cz',
    phone: '+420 601 234 567',
    company: 'Novák Digital s.r.o.',
    status: 'new',
    converted_to_lead_id: null,
    notes: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    name: 'Petra Svobodová',
    email: 'petra@marketingpro.cz',
    phone: '+420 776 543 210',
    company: 'MarketingPro s.r.o.',
    status: 'contacted',
    converted_to_lead_id: null,
    notes: [{ id: 'n1', text: 'Volali jsme, má zájem o PPC', note_type: 'call' as LeadNoteType, author_name: 'Admin', created_at: new Date(Date.now() - 86400000).toISOString(), call_date: new Date(Date.now() - 86400000).toISOString() }],
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'demo-3',
    name: 'Tomáš Dvořák',
    email: 'tomas@eshopmaster.cz',
    phone: null,
    company: 'E-shop Master',
    status: 'qualified',
    converted_to_lead_id: null,
    notes: [],
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'demo-4',
    name: 'Lucie Černá',
    email: 'lucie@beautybrands.cz',
    phone: '+420 604 111 222',
    company: 'Beauty Brands',
    status: 'converted',
    converted_to_lead_id: 'some-lead-id',
    notes: [],
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

const DEMO_INTERACTIONS: ProspectInteraction[] = [
  { id: 'di-1', prospect_id: 'demo-1', type: 'webinar_registration', title: 'Webinář: Facebook Ads 2026', metadata: null, occurred_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: 'di-2', prospect_id: 'demo-2', type: 'lead_magnet_download', title: 'E-book: 10 tipů pro PPC', metadata: null, occurred_at: new Date(Date.now() - 7 * 86400000).toISOString(), created_at: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: 'di-3', prospect_id: 'demo-2', type: 'webinar_attended', title: 'Webinář: Facebook Ads 2026', metadata: null, occurred_at: new Date(Date.now() - 3 * 86400000).toISOString(), created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'di-4', prospect_id: 'demo-3', type: 'webinar_registration', title: 'Webinář: Google Ads pro e-shopy', metadata: null, occurred_at: new Date(Date.now() - 14 * 86400000).toISOString(), created_at: new Date(Date.now() - 14 * 86400000).toISOString() },
  { id: 'di-5', prospect_id: 'demo-3', type: 'lead_magnet_download', title: 'E-book: 10 tipů pro PPC', metadata: null, occurred_at: new Date(Date.now() - 10 * 86400000).toISOString(), created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: 'di-6', prospect_id: 'demo-3', type: 'webinar_attended', title: 'Webinář: Google Ads pro e-shopy', metadata: null, occurred_at: new Date(Date.now() - 13 * 86400000).toISOString(), created_at: new Date(Date.now() - 13 * 86400000).toISOString() },
  { id: 'di-7', prospect_id: 'demo-4', type: 'webinar_registration', title: 'Webinář: Facebook Ads 2026', metadata: null, occurred_at: new Date(Date.now() - 30 * 86400000).toISOString(), created_at: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: 'di-8', prospect_id: 'demo-4', type: 'webinar_attended', title: 'Webinář: Facebook Ads 2026', metadata: null, occurred_at: new Date(Date.now() - 29 * 86400000).toISOString(), created_at: new Date(Date.now() - 29 * 86400000).toISOString() },
];

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

      if (error) {
        console.warn('Prospects table not available, using demo data');
        return DEMO_PROSPECTS;
      }
      if (!data || data.length === 0) return DEMO_PROSPECTS;
      return data.map((p: any) => ({
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

      if (error) {
        console.warn('Prospect interactions table not available, using demo data');
        return DEMO_INTERACTIONS;
      }
      if (!data || data.length === 0) return DEMO_INTERACTIONS;
      return (data || []) as unknown as ProspectInteraction[];
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
