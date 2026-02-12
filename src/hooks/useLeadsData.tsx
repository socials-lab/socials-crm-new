import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Lead, LeadStage, LeadNote, LeadChangeType, LeadHistoryEntry, LeadNoteType } from '@/types/crm';

// Field labels for history display
const LEAD_FIELD_LABELS: Record<string, string> = {
  company_name: 'Název společnosti',
  ico: 'IČO',
  dic: 'DIČ',
  website: 'Web',
  industry: 'Obor',
  contact_name: 'Kontaktní osoba',
  contact_position: 'Pozice',
  contact_email: 'E-mail kontaktu',
  contact_phone: 'Telefon kontaktu',
  stage: 'Stav',
  owner_id: 'Odpovědná osoba',
  source: 'Zdroj',
  source_custom: 'Vlastní zdroj',
  client_message: 'Zpráva od klienta',
  ad_spend_monthly: 'Měsíční investice do reklamy',
  summary: 'Shrnutí',
  potential_service: 'Potenciální služba',
  offer_type: 'Typ nabídky',
  estimated_price: 'Odhadovaná cena',
  probability_percent: 'Pravděpodobnost',
  offer_url: 'URL nabídky',
  offer_created_at: 'Nabídka vytvořena',
  billing_street: 'Ulice',
  billing_city: 'Město',
  billing_zip: 'PSČ',
  billing_country: 'Země',
  billing_email: 'Fakturační e-mail',
};

const STAGE_LABELS: Record<LeadStage, string> = {
  new_lead: 'Nový lead',
  meeting_done: 'Schůzka proběhla',
  waiting_access: 'Čekáme na přístupy',
  access_received: 'Přístupy přijaty',
  preparing_offer: 'Příprava nabídky',
  offer_sent: 'Nabídka odeslána',
  won: 'Vyhráno',
  lost: 'Prohráno',
  postponed: 'Odloženo',
};

export { STAGE_LABELS };

interface LeadsDataContextType {
  leads: Lead[];
  leadHistory: LeadHistoryEntry[];
  isLoading: boolean;
  
  // CRUD operations
  addLead: (data: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'notes' | 'converted_to_client_id' | 'converted_to_engagement_id' | 'converted_at'>) => Promise<Lead>;
  updateLead: (id: string, data: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  
  // Stage management
  updateLeadStage: (id: string, stage: LeadStage) => Promise<void>;
  
  // Notes
  addNote: (leadId: string, text: string, noteType?: LeadNoteType, callDate?: string | null, subject?: string | null, recipients?: string[] | null) => Promise<void>;
  
  // Helpers
  getLeadById: (id: string) => Lead | undefined;
  getLeadsByStage: (stage: LeadStage) => Lead[];
  getLeadsByOwner: (ownerId: string) => Lead[];
  getLeadHistory: (leadId: string) => LeadHistoryEntry[];
  
  // Conversion
  markLeadAsConverted: (leadId: string, clientId: string, engagementId: string) => Promise<void>;
}

const LeadsDataContext = createContext<LeadsDataContextType | null>(null);

export function LeadsDataProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [leadHistory, setLeadHistory] = useState<LeadHistoryEntry[]>([]);

  const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = () => new Date().toISOString();

  // Fetch leads from Supabase
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('leads').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      // Transform leads to include notes array and mock conversion data
      const transformedLeads = (data || []).map((lead: any) => {
        // Mock conversion data for TestBrand client demo
        if (lead.id === '20000000-0000-0000-0000-000000000001') {
          return {
            ...lead,
            notes: [],
            stage: 'won' as const,
            potential_services: lead.potential_services || [],
            access_request_platforms: lead.access_request_platforms || [],
            // Conversion links
            converted_to_client_id: 'c0000000-0000-0000-0000-000000000001',
            converted_to_engagement_id: 'e0000000-0000-0000-0000-000000000001',
            converted_at: '2025-01-01T10:00:00Z',
            // Onboarding form data
            onboarding_form_sent_at: '2024-12-27T09:00:00Z',
            onboarding_form_completed_at: '2024-12-28T14:30:00Z',
            billing_street: 'Vinohradská 123',
            billing_city: 'Praha',
            billing_zip: '120 00',
            billing_country: 'Česká republika',
            billing_email: 'fakturace@potentialclient.cz',
            // Offer
            offer_sent_at: '2024-12-20T11:00:00Z',
            // Contract
            contract_url: 'https://digisign.example.com/contract/abc123',
            contract_created_at: '2024-12-29T08:00:00Z',
            contract_sent_at: '2024-12-29T09:00:00Z',
            contract_signed_at: '2024-12-30T15:00:00Z',
            // Notes
            summary: 'Klient hledá komplexní správu sociálních sítí a kreativní výstupy. Měsíční budget na reklamu cca 50 000 CZK.',
            client_message: 'Máme zájem o dlouhodobou spolupráci na správě našich sociálních sítí. Rádi bychom začali od února.',
          };
        }
        return {
          ...lead,
          notes: [],
          stage: lead.stage || 'new_lead',
          potential_services: lead.potential_services || [],
          access_request_platforms: lead.access_request_platforms || [],
          qualification_status: lead.qualification_status || 'pending',
          qualification_reason: lead.qualification_reason || null,
          qualified_at: lead.qualified_at || null,
          vat_payer_status: lead.vat_payer_status || null,
        };
      });

      // Add demo lead Socials Advertising (not in DB)
      const demoSocialsLead: any = {
        id: '20000000-0000-0000-0000-000000000002',
        company_name: 'Socials Advertising s.r.o.',
        ico: '08186464',
        dic: 'CZ08186464',
        website: 'https://www.socials.cz',
        industry: 'Marketing / Online reklama',
        contact_name: 'Daniel Bauer',
        contact_position: 'Jednatel',
        contact_email: 'danny@socials.cz',
        contact_phone: '+420 774 536 699',
        stage: 'preparing_offer',
        source: 'inbound',
        source_custom: null,
        client_message: 'Zajímá nás spolupráce na správě kampaní pro naše klienty – white-label model.',
        ad_spend_monthly: 200000,
        summary: 'Agentura zaměřená na výkonnostní reklamu (Meta Ads, PPC, video/banner kreativy). Hledají white-label partnera.',
        potential_service: '',
        potential_services: [
          {
            id: 'ls-demo-1',
            service_id: 'a0000000-0000-0000-0000-000000000001',
            name: 'Socials Boost',
            selected_tier: 'pro',
            price: 35000,
            currency: 'CZK',
            billing_type: 'monthly',
          },
          {
            id: 'ls-demo-2',
            service_id: '',
            name: 'Creative Boost',
            selected_tier: null,
            price: 15000,
            currency: 'CZK',
            billing_type: 'monthly',
          },
        ],
        offer_type: 'retainer',
        estimated_price: 50000,
        currency: 'CZK',
        probability_percent: 60,
        offer_url: null,
        offer_created_at: null,
        offer_sent_at: null,
        offer_sent_by_id: null,
        owner_id: null,
        access_request_sent_at: '2025-02-11T09:00:00Z',
        access_request_platforms: ['Google Analytics 4', 'Facebook Business Manager', 'Google Ads'],
        access_received_at: '2025-02-12T14:00:00Z',
        onboarding_form_sent_at: null,
        onboarding_form_completed_at: null,
        onboarding_form_url: null,
        contract_url: null,
        contract_created_at: null,
        contract_sent_at: null,
        contract_signed_at: null,
        converted_to_client_id: null,
        converted_to_engagement_id: null,
        converted_at: null,
        billing_street: 'Korunní 2569/108',
        billing_city: 'Praha 10',
        billing_zip: '101 00',
        billing_country: 'Česká republika',
        billing_email: 'fakturace@socials.cz',
        notes: [
          {
            id: 'note-demo-1',
            lead_id: '20000000-0000-0000-0000-000000000002',
            author_id: '',
            author_name: 'System',
            text: 'Dobrý den,\n\nNa základě našeho telefonátu Vás prosíme o nasdílení přístupů do Google Analytics 4, Facebook Business Manager a Google Ads.\n\nDěkujeme,\nTým Socials',
            note_type: 'email_sent',
            call_date: null,
            subject: 'Žádost o nasdílení přístupů - socials.cz / Socials',
            recipients: ['danny@socials.cz'],
            created_at: '2025-02-11T09:00:00Z',
          },
          {
            id: 'note-demo-2',
            lead_id: '20000000-0000-0000-0000-000000000002',
            author_id: '',
            author_name: 'System',
            text: 'Schůzka proběhla online. Klient má zájem o white-label správu Meta Ads a Google Ads pro své klienty. Měsíční budget cca 200k CZK. Chtějí i kreativní výstupy.',
            note_type: 'call',
            call_date: '2025-02-10T14:00:00Z',
            subject: null,
            recipients: null,
            created_at: '2025-02-10T14:30:00Z',
          },
        ],
        qualification_status: 'qualified',
        qualification_reason: null,
        qualified_at: '2025-02-10T15:00:00Z',
        vat_payer_status: 'reliable',
        legal_form: 'Společnost s ručením omezeným',
        founded_date: '2019-05-23',
        directors: [
          { name: 'Daniel Bauer', role: 'Jednatel (od 23.5.2019)', ownership_percent: 80 },
          { name: 'Otakar Lucák', role: 'Jednatel (od 26.8.2021)', ownership_percent: 20 },
        ],
        ares_nace: '73110 - Činnosti reklamních agentur',
        court_registration: 'C 314420, Městský soud v Praze',
        created_at: '2025-02-10T08:00:00Z',
        updated_at: '2025-02-12T14:00:00Z',
        created_by: null,
        updated_by: null,
      };

      // Only add if not already fetched from DB
      if (!transformedLeads.find((l: any) => l.id === demoSocialsLead.id)) {
        transformedLeads.push(demoSocialsLead);
      }

      return transformedLeads;
    },
  });

  // Add history entry helper (local state for now)
  const addHistoryEntry = useCallback((
    leadId: string,
    changeType: LeadChangeType,
    fieldName: string | null,
    oldValue: string | null,
    newValue: string | null
  ) => {
    const entry: LeadHistoryEntry = {
      id: generateId('lh'),
      lead_id: leadId,
      change_type: changeType,
      field_name: fieldName,
      field_label: fieldName ? LEAD_FIELD_LABELS[fieldName] || fieldName : null,
      old_value: oldValue,
      new_value: newValue,
      changed_by: '',
      changed_by_name: 'User',
      created_at: now(),
    };
    setLeadHistory(prev => [entry, ...prev]);
  }, []);

  // Mutations
  const addLeadMutation = useMutation({
    mutationFn: async (data: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'notes' | 'converted_to_client_id' | 'converted_to_engagement_id' | 'converted_at'>) => {
      const insertData = {
        ...data,
        notes: [],
        converted_to_client_id: null,
        converted_to_engagement_id: null,
        converted_at: null,
      };
      const { data: result, error } = await (supabase as any).from('leads').insert(insertData).select().single();
      if (error) throw error;
      return { ...result, notes: [] };
    },
    onSuccess: (newLead) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      addHistoryEntry(newLead.id, 'created', null, null, newLead.company_name);
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Lead> }) => {
      const { error } = await (supabase as any).from('leads').update({
        ...data,
        updated_at: now(),
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('leads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  });

  const addLead = useCallback(async (data: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'notes' | 'converted_to_client_id' | 'converted_to_engagement_id' | 'converted_at'>): Promise<Lead> => {
    return addLeadMutation.mutateAsync(data);
  }, [addLeadMutation]);

  const updateLead = useCallback(async (id: string, data: Partial<Lead>) => {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;
    
    // Log field changes
    Object.keys(data).forEach(key => {
      if (key === 'updated_at' || key === 'updated_by') return;
      const oldVal = String((lead as any)[key] ?? '');
      const newVal = String((data as any)[key] ?? '');
      if (oldVal !== newVal) {
        if (key === 'owner_id') {
          addHistoryEntry(id, 'owner_change', key, oldVal, newVal);
        } else {
          addHistoryEntry(id, 'field_update', key, oldVal, newVal);
        }
      }
    });
    
    await updateLeadMutation.mutateAsync({ id, data });
  }, [leads, updateLeadMutation, addHistoryEntry]);

  const deleteLead = useCallback(async (id: string) => {
    await deleteLeadMutation.mutateAsync(id);
  }, [deleteLeadMutation]);

  const updateLeadStage = useCallback(async (id: string, stage: LeadStage) => {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;
    
    const oldStageLabel = STAGE_LABELS[lead.stage];
    const newStageLabel = STAGE_LABELS[stage];
    
    addHistoryEntry(id, 'stage_change', 'stage', oldStageLabel, newStageLabel);
    
    await updateLeadMutation.mutateAsync({ id, data: { stage } });
  }, [leads, updateLeadMutation, addHistoryEntry]);

  // Get current user display name
  const getCurrentUserName = useCallback(async (): Promise<string> => {
    if (!user) return 'Neznámý';
    // Try to get name from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', user.id)
      .single();
    if (profile?.first_name || profile?.last_name) {
      return [profile.first_name, profile.last_name].filter(Boolean).join(' ');
    }
    return profile?.email || user.email || 'Neznámý';
  }, [user]);

  const addNote = useCallback(async (leadId: string, text: string, noteType: LeadNoteType = 'general', callDate: string | null = null, subject: string | null = null, recipients: string[] | null = null) => {
    // For now, notes are stored in lead history (will be proper table later)
    addHistoryEntry(leadId, 'note_added', null, null, text.substring(0, 100) + (text.length > 100 ? '...' : ''));
    
    const authorName = await getCurrentUserName();
    
    // Add note to lead's notes array
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      const newNote: LeadNote = {
        id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        lead_id: leadId,
        author_id: user?.id || '',
        author_name: authorName,
        text,
        note_type: noteType,
        call_date: callDate,
        subject: subject,
        recipients: recipients,
        created_at: new Date().toISOString(),
      };
      const updatedNotes = [...lead.notes, newNote];
      await updateLeadMutation.mutateAsync({ id: leadId, data: { notes: updatedNotes as any } });
    } else {
      await updateLeadMutation.mutateAsync({ id: leadId, data: {} });
    }
  }, [leads, updateLeadMutation, addHistoryEntry, getCurrentUserName, user]);

  const getLeadById = useCallback((id: string) => leads.find(l => l.id === id), [leads]);
  
  const getLeadsByStage = useCallback((stage: LeadStage) => 
    leads.filter(l => l.stage === stage), [leads]);
  
  const getLeadsByOwner = useCallback((ownerId: string) => 
    leads.filter(l => l.owner_id === ownerId), [leads]);

  const getLeadHistory = useCallback((leadId: string) => 
    leadHistory.filter(h => h.lead_id === leadId), [leadHistory]);

  const markLeadAsConverted = useCallback(async (leadId: string, clientId: string, engagementId: string) => {
    addHistoryEntry(leadId, 'converted', null, null, 'Převedeno na zakázku');
    
    await updateLeadMutation.mutateAsync({
      id: leadId,
      data: {
        stage: 'won' as LeadStage,
        converted_to_client_id: clientId,
        converted_to_engagement_id: engagementId,
        converted_at: now(),
      },
    });
  }, [updateLeadMutation, addHistoryEntry]);

  return (
    <LeadsDataContext.Provider value={{
      leads,
      leadHistory,
      isLoading,
      addLead,
      updateLead,
      deleteLead,
      updateLeadStage,
      addNote,
      getLeadById,
      getLeadsByStage,
      getLeadsByOwner,
      getLeadHistory,
      markLeadAsConverted,
    }}>
      {children}
    </LeadsDataContext.Provider>
  );
}

export function useLeadsData() {
  const context = useContext(LeadsDataContext);
  if (!context) {
    throw new Error('useLeadsData must be used within a LeadsDataProvider');
  }
  return context;
}
