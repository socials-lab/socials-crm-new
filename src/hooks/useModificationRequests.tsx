import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCRMData } from '@/hooks/useCRMData';
import { toast } from 'sonner';
import type {
  ModificationRequestType,
  ModificationProposedChanges,
} from '@/types/crm';

const REQUEST_TYPE_LABELS: Record<ModificationRequestType, string> = {
  add_service: 'Přidání služby',
  update_service_price: 'Změna ceny',
  deactivate_service: 'Ukončení služby',
  add_assignment: 'Přiřazení kolegy',
  update_assignment: 'Změna odměny',
  remove_assignment: 'Odebrání kolegy',
};

// Email sent record type
export interface EmailSentRecord {
  id: string;
  modification_request_id: string;
  sent_at: string;
  sent_to: string;
  sent_by_id: string | null;
  sent_by_name: string;
}

// Stored modification request type matching Supabase schema
export interface StoredModificationRequest {
  id: string;
  engagement_id: string;
  request_type: ModificationRequestType;
  status: 'pending' | 'approved' | 'client_approved' | 'applied' | 'rejected';
  proposed_changes: ModificationProposedChanges;
  engagement_service_id: string | null;
  engagement_assignment_id: string | null;
  effective_from: string | null;
  upsold_by_id: string | null;
  upsell_commission_percent: number;
  requested_by: string | null;
  requested_at: string;
  note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  upgrade_offer_token: string | null;
  upgrade_offer_valid_until: string | null;
  client_email: string | null;
  client_approved_at: string | null;
  created_at: string;
  updated_at: string;
  // Denormalized data for display
  engagement_name: string;
  client_id: string;
  client_name: string;
  client_brand_name: string | null;
  upsold_by_name: string | null;
  upsold_by_email: string | null;
  // Email history (joined from separate table)
  emails_sent?: EmailSentRecord[];
}

export function useModificationRequests() {
  const { user } = useAuth();
  const { engagements, clients, colleagues } = useCRMData();
  const queryClient = useQueryClient();

  // Track which specific request is being processed (to avoid all cards showing loading)
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch all modification requests with timeout protection
  const {
    data: pendingRequests = [],
    isLoading: isLoadingPending,
    error: loadingError,
    refetch: refresh,
  } = useQuery({
    queryKey: ['modification_requests'],
    queryFn: async () => {
      // Create a timeout promise
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout: načítání trvá příliš dlouho')), 15000)
      );

      const fetchData = async () => {
        // Fetch requests
        const { data: requests, error } = await supabase
          .from('modification_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch emails for all requests
        const requestIds = requests?.map(r => r.id) || [];
        let emails: { modification_request_id: string; id: string; sent_at: string; sent_to: string; sent_by_id: string | null; sent_by_name: string }[] = [];

        if (requestIds.length > 0) {
          const { data: emailsData } = await supabase
            .from('modification_request_emails')
            .select('*')
            .in('modification_request_id', requestIds);
          emails = emailsData || [];
        }

        // Map emails to requests and enrich with colleague info
        return (requests || []).map(r => {
          // Look up colleague info if upsold_by_id exists
          let upsoldByName = r.upsold_by_name;
          let upsoldByEmail: string | null = null;

          if (r.upsold_by_id && colleagues.length > 0) {
            const colleague = colleagues.find(c => c.id === r.upsold_by_id);
            if (colleague) {
              if (!upsoldByName) {
                upsoldByName = colleague.full_name || null;
              }
              upsoldByEmail = colleague.email || null;
            }
          }

          return {
            ...r,
            // Cast proposed_changes from Json to proper type
            proposed_changes: r.proposed_changes as ModificationProposedChanges,
            // Cast enums
            request_type: r.request_type as ModificationRequestType,
            status: r.status as StoredModificationRequest['status'],
            upsell_commission_percent: r.upsell_commission_percent || 10,
            upsold_by_name: upsoldByName,
            upsold_by_email: upsoldByEmail,
            emails_sent: emails.filter(e => e.modification_request_id === r.id),
          };
        }) as StoredModificationRequest[];
      };

      return Promise.race([fetchData(), timeout]);
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
    retry: 2, // Retry twice on failure
    retryDelay: 1000, // Wait 1 second between retries
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (params: {
      engagement_id: string;
      request_type: ModificationRequestType;
      proposed_changes: ModificationProposedChanges;
      engagement_service_id?: string | null;
      engagement_assignment_id?: string | null;
      effective_from?: string | null;
      upsold_by_id?: string | null;
      upsell_commission_percent?: number;
      note?: string | null;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Get engagement and client info
      const engagement = engagements.find(e => e.id === params.engagement_id);
      if (!engagement) throw new Error('Engagement not found');

      const client = clients.find(c => c.id === engagement.client_id);
      if (!client) throw new Error('Client not found');

      const upsoldByColleague = params.upsold_by_id
        ? colleagues.find(c => c.id === params.upsold_by_id)
        : null;

      const { data, error } = await supabase
        .from('modification_requests')
        .insert({
          engagement_id: params.engagement_id,
          request_type: params.request_type,
          status: 'pending',
          proposed_changes: params.proposed_changes as unknown as Record<string, unknown>,
          engagement_service_id: params.engagement_service_id || null,
          engagement_assignment_id: params.engagement_assignment_id || null,
          effective_from: params.effective_from || null,
          upsold_by_id: params.upsold_by_id || null,
          upsold_by_name: upsoldByColleague?.full_name || null,
          upsell_commission_percent: params.upsell_commission_percent || 10,
          note: params.note || null,
          requested_by: user.id,
          // Denormalized fields
          engagement_name: engagement.name,
          client_id: client.id,
          client_name: client.name,
          client_brand_name: client.brand_name,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modification_requests'] });
      toast.success('Požadavek na úpravu byl odeslán ke schválení');
    },
    onError: (error) => {
      console.error('Error creating modification request:', error);
      toast.error('Nepodařilo se vytvořit požadavek');
    },
  });

  // Approve mutation (uses RPC function)
  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      if (!user) throw new Error('User not authenticated');

      // Get request details first to know who to notify
      const request = pendingRequests.find(r => r.id === requestId);

      const { data, error } = await supabase
        .rpc('approve_modification_request', {
          p_request_id: requestId,
          p_reviewed_by: user.id,
        });

      if (error) throw error;

      // Send notification to the requester
      if (request?.requested_by && request.requested_by !== user.id) {
        const typeLabel = REQUEST_TYPE_LABELS[request.request_type] || 'Změna';
        const { error: notifError } = await supabase.from('notifications').insert({
          user_id: request.requested_by,
          type: 'modification_approved',
          title: 'Návrh na změnu byl schválen',
          message: `Váš návrh "${typeLabel}" pro ${request.client_brand_name || request.client_name} byl schválen. Čeká se na potvrzení klientem.`,
          link: '/engagements',
          metadata: {
            request_id: requestId,
            client_name: request.client_brand_name || request.client_name,
            engagement_name: request.engagement_name,
          },
          read: false,
        });
        if (notifError) console.error('Failed to send approval notification:', notifError);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modification_requests'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Požadavek byl schválen');
    },
    onError: (error) => {
      console.error('Error approving request:', error);
      toast.error('Nepodařilo se schválit požadavek');
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async (params: { requestId: string; reason: string }) => {
      if (!user) throw new Error('User not authenticated');

      // Get request details first to know who to notify
      const request = pendingRequests.find(r => r.id === params.requestId);

      const { data, error } = await supabase
        .from('modification_requests')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: params.reason,
        })
        .eq('id', params.requestId)
        .select()
        .single();

      if (error) throw error;

      // Send notification to the requester about rejection
      if (request?.requested_by && request.requested_by !== user.id) {
        const typeLabel = REQUEST_TYPE_LABELS[request.request_type] || 'Změna';
        const { error: notifError } = await supabase.from('notifications').insert({
          user_id: request.requested_by,
          type: 'modification_rejected',
          title: 'Návrh na změnu byl zamítnut',
          message: `Váš návrh "${typeLabel}" pro ${request.client_brand_name || request.client_name} byl zamítnut. Důvod: ${params.reason}`,
          link: '/engagements',
          metadata: {
            request_id: params.requestId,
            client_name: request.client_brand_name || request.client_name,
            engagement_name: request.engagement_name,
            rejection_reason: params.reason,
          },
          read: false,
        });
        if (notifError) console.error('Failed to send rejection notification:', notifError);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modification_requests'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Požadavek byl zamítnut');
    },
    onError: (error) => {
      console.error('Error rejecting request:', error);
      toast.error('Nepodařilo se zamítnout požadavek');
    },
  });

  // Apply mutation (uses RPC function that actually applies the changes)
  const applyMutation = useMutation({
    mutationFn: async (requestId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .rpc('apply_modification_request', {
          p_request_id: requestId,
          p_applied_by: user.id,
        });

      if (error) throw error;

      // Check if the function returned success
      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Failed to apply modification');
      }

      return result;
    },
    onSuccess: () => {
      // Invalidate both modification requests and CRM data (services, assignments)
      queryClient.invalidateQueries({ queryKey: ['modification_requests'] });
      queryClient.invalidateQueries({ queryKey: ['engagement_services'] });
      queryClient.invalidateQueries({ queryKey: ['engagement_assignments'] });
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      toast.success('Změna byla aplikována');
    },
    onError: (error) => {
      console.error('Error applying request:', error);
      toast.error(`Nepodařilo se aplikovat změnu: ${error.message}`);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (params: {
      requestId: string;
      updates: {
        proposed_changes?: ModificationProposedChanges;
        effective_from?: string | null;
        note?: string | null;
        upsell_commission_percent?: number;
      };
    }) => {
      const { data, error } = await supabase
        .from('modification_requests')
        .update({
          ...(params.updates.proposed_changes && {
            proposed_changes: params.updates.proposed_changes as unknown as Record<string, unknown>,
          }),
          ...(params.updates.effective_from !== undefined && {
            effective_from: params.updates.effective_from,
          }),
          ...(params.updates.note !== undefined && {
            note: params.updates.note,
          }),
          ...(params.updates.upsell_commission_percent !== undefined && {
            upsell_commission_percent: params.updates.upsell_commission_percent,
          }),
        })
        .eq('id', params.requestId)
        .in('status', ['pending', 'approved'])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modification_requests'] });
      toast.success('Požadavek byl upraven');
    },
    onError: (error) => {
      console.error('Error updating request:', error);
      toast.error('Nepodařilo se upravit požadavek');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('modification_requests')
        .delete()
        .eq('id', requestId)
        .in('status', ['pending', 'approved', 'rejected']);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modification_requests'] });
      toast.success('Návrh změny byl smazán');
    },
    onError: (error) => {
      console.error('Error deleting request:', error);
      toast.error('Nepodařilo se smazat návrh');
    },
  });

  // Record email sent
  const recordEmailMutation = useMutation({
    mutationFn: async (params: {
      requestId: string;
      sentTo: string;
      sentByName: string;
    }) => {
      const { data, error } = await supabase
        .from('modification_request_emails')
        .insert({
          modification_request_id: params.requestId,
          sent_to: params.sentTo,
          sent_by_id: user?.id || null,
          sent_by_name: params.sentByName,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modification_requests'] });
    },
  });

  // Wrapper functions to match existing API
  const createRequest = async (params: Parameters<typeof createMutation.mutateAsync>[0]) => {
    return createMutation.mutateAsync(params);
  };

  const approveRequest = async (requestId: string) => {
    setApprovingId(requestId);
    try {
      return await approveMutation.mutateAsync(requestId);
    } finally {
      setApprovingId(null);
    }
  };

  const rejectRequest = async (params: { requestId: string; reason: string }) => {
    setRejectingId(params.requestId);
    try {
      return await rejectMutation.mutateAsync(params);
    } finally {
      setRejectingId(null);
    }
  };

  const applyRequest = async (requestId: string) => {
    setApplyingId(requestId);
    try {
      return await applyMutation.mutateAsync(requestId);
    } finally {
      setApplyingId(null);
    }
  };

  const updateRequest = async (requestId: string, updates: {
    proposed_changes?: ModificationProposedChanges;
    effective_from?: string | null;
    note?: string | null;
    upsell_commission_percent?: number;
  }) => {
    return updateMutation.mutateAsync({ requestId, updates });
  };

  const deleteRequest = async (requestId: string) => {
    setDeletingId(requestId);
    try {
      return await deleteMutation.mutateAsync(requestId);
    } finally {
      setDeletingId(null);
    }
  };

  const recordEmailSent = async (
    requestId: string,
    sentTo: string,
    sentById: string,
    sentByName: string
  ) => {
    return recordEmailMutation.mutateAsync({ requestId, sentTo, sentByName });
  };

  return {
    pendingRequests,
    isLoadingPending,
    loadingError,
    createRequest,
    isCreating: createMutation.isPending,
    approveRequest,
    approvingId, // Specific ID being approved
    rejectRequest,
    rejectingId, // Specific ID being rejected
    applyRequest,
    applyingId, // Specific ID being applied
    updateRequest,
    isUpdating: updateMutation.isPending,
    deleteRequest,
    deletingId, // Specific ID being deleted
    recordEmailSent,
    refresh,
  };
}

// Standalone function to get request by token (for public approval page)
export async function getModificationRequestByToken(token: string): Promise<StoredModificationRequest | null> {
  const { data, error } = await supabase
    .from('modification_requests')
    .select('*')
    .eq('upgrade_offer_token', token)
    .single();

  if (error || !data) return null;

  return {
    ...data,
    proposed_changes: data.proposed_changes as ModificationProposedChanges,
    request_type: data.request_type as ModificationRequestType,
    status: data.status as StoredModificationRequest['status'],
    upsell_commission_percent: data.upsell_commission_percent || 10,
    emails_sent: [],
  };
}

// Standalone function for client to accept offer (for public approval page)
export async function clientAcceptOffer(token: string, email: string): Promise<{
  success: boolean;
  error?: string;
  request?: StoredModificationRequest;
}> {
  // Get request details first to know who to notify
  const requestBefore = await getModificationRequestByToken(token);

  const { data, error } = await supabase
    .rpc('client_accept_modification', {
      p_token: token,
      p_client_email: email,
    });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as { success: boolean; error?: string };
  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Fetch the updated request
  const request = await getModificationRequestByToken(token);

  // Send notification to the requester about client approval
  // Note: This may fail on public pages due to RLS - that's expected and handled silently
  // The notification will be created when an admin views the "client approved" requests
  if (requestBefore?.requested_by) {
    try {
      const typeLabel = REQUEST_TYPE_LABELS[requestBefore.request_type] || 'Změna';
      // Fire and forget - don't await, don't block the flow
      supabase.from('notifications').insert({
        user_id: requestBefore.requested_by,
        type: 'modification_client_approved',
        title: 'Klient potvrdil návrh na změnu',
        message: `Klient ${requestBefore.client_brand_name || requestBefore.client_name} potvrdil váš návrh "${typeLabel}". Nyní můžete změnu aktivovat.`,
        link: '/engagements',
        metadata: {
          request_id: requestBefore.id,
          client_name: requestBefore.client_brand_name || requestBefore.client_name,
          engagement_name: requestBefore.engagement_name,
          client_email: email,
        },
        read: false,
      }).then(() => {
        // Notification sent successfully (may not happen on public pages)
      });
    } catch {
      // Silently ignore notification errors - this is expected on public pages
    }
  }

  return { success: true, request: request || undefined };
}
