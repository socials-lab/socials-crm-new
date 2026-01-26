import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCRMData } from '@/hooks/useCRMData';
import { toast } from 'sonner';
import {
  getModificationRequests,
  createModificationRequest,
  approveModificationRequest,
  rejectModificationRequest,
  applyModificationRequest,
  updateModificationRequest,
  deleteModificationRequest,
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
  const [isApplying, setIsApplying] = useState(false);

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

  // Apply a client-approved modification (just mark as applied in localStorage - no DB changes)
  const applyRequest = useCallback(async (requestId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    setIsApplying(true);
    try {
      const request = pendingRequests.find(r => r.id === requestId);
      if (!request) throw new Error('Request not found');
      
      if (request.status !== 'client_approved') {
        throw new Error('Request must be client-approved before applying');
      }

      // Just mark as applied in localStorage - no actual DB changes
      // In production, this would call addEngagementService/updateEngagementService
      const result = applyModificationRequest(requestId);
      if (!result) throw new Error('Failed to apply request');
      
      toast.success('Změna byla označena jako aktivovaná (pouze frontend)');
      refresh();
      return result;
    } catch (error) {
      console.error('Error applying request:', error);
      toast.error('Nepodařilo se aplikovat změnu');
      throw error;
    } finally {
      setIsApplying(false);
    }
  }, [user, pendingRequests, refresh]);

  // Update a modification request (before final approval)
  const [isUpdating, setIsUpdating] = useState(false);
  
  const updateRequest = useCallback(async (requestId: string, updates: {
    proposed_changes?: ModificationProposedChanges;
    effective_from?: string | null;
    note?: string | null;
    upsell_commission_percent?: number;
  }) => {
    if (!user) throw new Error('User not authenticated');
    
    setIsUpdating(true);
    try {
      const result = updateModificationRequest(requestId, updates);
      if (!result) throw new Error('Request not found or cannot be edited');
      
      toast.success('Požadavek byl upraven');
      refresh();
      return result;
    } catch (error) {
      console.error('Error updating request:', error);
      toast.error('Nepodařilo se upravit požadavek');
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [user, refresh]);

  // Delete a modification request
  const [isDeleting, setIsDeleting] = useState(false);
  
  const deleteRequest = useCallback(async (requestId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    setIsDeleting(true);
    try {
      const result = deleteModificationRequest(requestId);
      if (!result) throw new Error('Request not found or cannot be deleted');
      
      toast.success('Návrh změny byl smazán');
      refresh();
      return result;
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error('Nepodařilo se smazat návrh');
      throw error;
    } finally {
      setIsDeleting(false);
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
    applyRequest,
    isApplying,
    updateRequest,
    isUpdating,
    deleteRequest,
    isDeleting,
    refresh,
  };
}
