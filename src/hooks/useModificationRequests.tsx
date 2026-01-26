import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCRMData } from '@/hooks/useCRMData';
import { toast } from 'sonner';
import {
  getModificationRequests,
  createModificationRequest,
  approveModificationRequest,
  rejectModificationRequest,
  type StoredModificationRequest,
} from '@/data/modificationRequestsMockData';
import type { 
  ModificationRequestType,
  ModificationProposedChanges,
} from '@/types/crm';

export function useModificationRequests() {
  const { user } = useAuth();
  const { engagements, clients, colleagues } = useCRMData();
  const [isCreating, setIsCreating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  // Get all requests with refreshing
  const [refreshKey, setRefreshKey] = useState(0);
  
  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  // Get all pending requests
  const pendingRequests = getModificationRequests();

  // Create a new modification request
  const createRequest = useCallback(async (params: {
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
    
    setIsCreating(true);
    try {
      // Get engagement and client info
      const engagement = engagements.find(e => e.id === params.engagement_id);
      if (!engagement) throw new Error('Engagement not found');
      
      const client = clients.find(c => c.id === engagement.client_id);
      if (!client) throw new Error('Client not found');
      
      const upsoldByColleague = params.upsold_by_id 
        ? colleagues.find(c => c.id === params.upsold_by_id)
        : null;
      
      const result = createModificationRequest({
        engagement_id: params.engagement_id,
        engagement_name: engagement.name,
        client_id: client.id,
        client_name: client.name,
        client_brand_name: client.brand_name,
        request_type: params.request_type,
        proposed_changes: params.proposed_changes,
        engagement_service_id: params.engagement_service_id,
        engagement_assignment_id: params.engagement_assignment_id,
        effective_from: params.effective_from,
        upsold_by_id: params.upsold_by_id,
        upsold_by_name: upsoldByColleague?.full_name,
        upsell_commission_percent: params.upsell_commission_percent,
        note: params.note,
        requested_by: user.id,
      });
      
      toast.success('Požadavek na úpravu byl odeslán ke schválení');
      refresh();
      return result;
    } catch (error) {
      console.error('Error creating modification request:', error);
      toast.error('Nepodařilo se vytvořit požadavek');
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [user, engagements, clients, colleagues, refresh]);

  // Approve a modification request
  const approveRequest = useCallback(async (requestId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    setIsApproving(true);
    try {
      const result = approveModificationRequest(requestId, user.id);
      if (!result) throw new Error('Request not found');
      
      toast.success('Požadavek byl schválen');
      refresh();
      return result;
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Nepodařilo se schválit požadavek');
      throw error;
    } finally {
      setIsApproving(false);
    }
  }, [user, refresh]);

  // Reject a modification request
  const rejectRequest = useCallback(async (params: { requestId: string; reason: string }) => {
    if (!user) throw new Error('User not authenticated');
    
    setIsRejecting(true);
    try {
      const result = rejectModificationRequest(params.requestId, user.id, params.reason);
      if (!result) throw new Error('Request not found');
      
      toast.success('Požadavek byl zamítnut');
      refresh();
      return result;
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Nepodařilo se zamítnout požadavek');
      throw error;
    } finally {
      setIsRejecting(false);
    }
  }, [user, refresh]);

  return {
    pendingRequests,
    isLoadingPending: false,
    createRequest,
    isCreating,
    approveRequest,
    isApproving,
    rejectRequest,
    isRejecting,
    refresh,
  };
}
