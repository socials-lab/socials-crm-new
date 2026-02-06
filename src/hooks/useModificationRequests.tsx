import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCRMData } from '@/hooks/useCRMData';
import { toast } from 'sonner';
import type {
  ModificationRequestType,
  ModificationProposedChanges,
} from '@/types/crm';

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
  // Email history (joined from separate table)
  emails_sent?: EmailSentRecord[];
}

export function useModificationRequests() {
  const { user } = useAuth();
  const { engagements, clients, colleagues } = useCRMData();
  const queryClient = useQueryClient();

  // Fetch all modification requests
  const {
    data: pendingRequests = [],
    isLoading: isLoadingPending,
    refetch: refresh,
  } = useQuery({
    queryKey: ['modification_requests'],
    queryFn: async () => {
      // Fetch requests
      const { data: requests, error } = await supabase
        .from('modification_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch emails for all requests
      const requestIds = requests?.map(r => r.id) || [];
      const { data: emails } = await supabase
        .from('modification_request_emails')
        .select('*')
        .in('modification_request_id', requestIds);

      // Map emails to requests
      return (requests || []).map(r => ({
        ...r,
        // Cast proposed_changes from Json to proper type
        proposed_changes: r.proposed_changes as ModificationProposedChanges,
        // Cast enums
        request_type: r.request_type as ModificationRequestType,
        status: r.status as StoredModificationRequest['status'],
        upsell_commission_percent: r.upsell_commission_percent || 10,
        emails_sent: (emails || []).filter(e => e.modification_request_id === r.id),
      })) as StoredModificationRequest[];
    },
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

      const { data, error } = await supabase
        .rpc('approve_modification_request', {
          p_request_id: requestId,
          p_reviewed_by: user.id,
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modification_requests'] });
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
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modification_requests'] });
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
    return approveMutation.mutateAsync(requestId);
  };

  const rejectRequest = async (params: { requestId: string; reason: string }) => {
    return rejectMutation.mutateAsync(params);
  };

  const applyRequest = async (requestId: string) => {
    return applyMutation.mutateAsync(requestId);
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
    return deleteMutation.mutateAsync(requestId);
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
    createRequest,
    isCreating: createMutation.isPending,
    approveRequest,
    isApproving: approveMutation.isPending,
    rejectRequest,
    isRejecting: rejectMutation.isPending,
    applyRequest,
    isApplying: applyMutation.isPending,
    updateRequest,
    isUpdating: updateMutation.isPending,
    deleteRequest,
    isDeleting: deleteMutation.isPending,
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

  return { success: true, request: request || undefined };
}
