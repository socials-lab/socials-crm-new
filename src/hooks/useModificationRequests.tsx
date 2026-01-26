import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { 
  ModificationRequest, 
  ModificationRequestWithDetails,
  ModificationRequestType,
  ModificationRequestStatus,
  ModificationProposedChanges,
} from '@/types/crm';

// Type for database row (matches Supabase schema)
interface ModificationRequestRow {
  id: string;
  engagement_id: string;
  request_type: string;
  status: string;
  proposed_changes: Record<string, unknown>;
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
  created_at: string;
  updated_at: string;
}

// Convert database row to typed interface
function rowToModificationRequest(row: ModificationRequestRow): ModificationRequest {
  return {
    ...row,
    request_type: row.request_type as ModificationRequestType,
    status: row.status as ModificationRequestStatus,
    proposed_changes: row.proposed_changes as unknown as ModificationProposedChanges,
    upgrade_offer_token: (row as any).upgrade_offer_token || null,
    upgrade_offer_valid_until: (row as any).upgrade_offer_valid_until || null,
    client_email: (row as any).client_email || null,
    client_approved_at: (row as any).client_approved_at || null,
  };
}

export function useModificationRequests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all pending modification requests (for admin dashboard)
  const { data: pendingRequests = [], isLoading: isLoadingPending } = useQuery({
    queryKey: ['modification-requests', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('engagement_modification_requests' as never)
        .select(`
          *,
          engagements!inner (
            id,
            name,
            client_id,
            status,
            type,
            clients!inner (
              id,
              name,
              brand_name
            )
          ),
          colleagues:upsold_by_id (
            id,
            full_name
          )
        `)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending requests:', error);
        return [];
      }

      // Transform data to include relations
      return (data || []).map((row: any) => ({
        ...rowToModificationRequest(row),
        engagement: row.engagements,
        client: row.engagements?.clients,
        upsold_by_colleague: row.colleagues,
      })) as ModificationRequestWithDetails[];
    },
    enabled: !!user,
  });

  // Fetch modification requests for a specific engagement
  const getRequestsByEngagementId = (engagementId: string) => {
    return useQuery({
      queryKey: ['modification-requests', 'engagement', engagementId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('engagement_modification_requests' as never)
          .select('*')
          .eq('engagement_id', engagementId)
          .order('requested_at', { ascending: false });

        if (error) {
          console.error('Error fetching requests for engagement:', error);
          return [];
        }

        return (data || []).map((row: any) => rowToModificationRequest(row));
      },
      enabled: !!engagementId,
    });
  };

  // Create a new modification request
  const createRequestMutation = useMutation({
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

      const { data, error } = await supabase
        .from('engagement_modification_requests' as never)
        .insert({
          engagement_id: params.engagement_id,
          request_type: params.request_type,
          status: 'pending',
          proposed_changes: params.proposed_changes,
          engagement_service_id: params.engagement_service_id || null,
          engagement_assignment_id: params.engagement_assignment_id || null,
          effective_from: params.effective_from || null,
          upsold_by_id: params.upsold_by_id || null,
          upsell_commission_percent: params.upsell_commission_percent || 10,
          requested_by: user.id,
          note: params.note || null,
        } as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modification-requests'] });
      toast.success('Požadavek na úpravu byl odeslán ke schválení');
    },
    onError: (error) => {
      console.error('Error creating modification request:', error);
      toast.error('Nepodařilo se vytvořit požadavek');
    },
  });

  // Approve a modification request
  const approveRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('engagement_modification_requests' as never)
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        } as never)
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modification-requests'] });
    },
    onError: (error) => {
      console.error('Error approving request:', error);
      toast.error('Nepodařilo se schválit požadavek');
    },
  });

  // Reject a modification request
  const rejectRequestMutation = useMutation({
    mutationFn: async (params: { requestId: string; reason: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('engagement_modification_requests' as never)
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: params.reason,
        } as never)
        .eq('id', params.requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modification-requests'] });
      toast.success('Požadavek byl zamítnut');
    },
    onError: (error) => {
      console.error('Error rejecting request:', error);
      toast.error('Nepodařilo se zamítnout požadavek');
    },
  });

  return {
    pendingRequests,
    isLoadingPending,
    getRequestsByEngagementId,
    createRequest: createRequestMutation.mutateAsync,
    isCreating: createRequestMutation.isPending,
    approveRequest: approveRequestMutation.mutateAsync,
    isApproving: approveRequestMutation.isPending,
    rejectRequest: rejectRequestMutation.mutateAsync,
    isRejecting: rejectRequestMutation.isPending,
  };
}
