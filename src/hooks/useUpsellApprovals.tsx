import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCRMData } from '@/hooks/useCRMData';
import { toast } from 'sonner';
import { parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface UpsellApproval {
  id: string;
  item_type: 'extra_work' | 'service';
  item_id: string;
  approved_at: string;
  approved_by: string;
}

export interface UpsellItem {
  id: string;
  type: 'extra_work' | 'service';
  clientId: string;
  clientName: string;
  brandName: string;
  engagementId: string;
  engagementName: string;
  itemName: string;
  amount: number;
  currency: string;
  upsoldById: string;
  upsoldByName: string;
  commissionPercent: number;
  commissionAmount: number;
  isApproved: boolean;
  approvedAt: string | null;
  approvedBy: string | null;
  createdAt: string;
  isOneOff?: boolean;
}

export function useUpsellApprovals() {
  const queryClient = useQueryClient();
  const {
    extraWorks,
    engagementServices,
    getClientById,
    getEngagementById,
    getColleagueById,
  } = useCRMData();

  // Fetch all approvals from Supabase
  const { data: approvals = [] } = useQuery({
    queryKey: ['upsell_approvals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('upsell_approvals')
        .select('*');
      if (error) throw error;
      return (data || []) as UpsellApproval[];
    },
  });

  // Create a map for fast lookups
  const approvalsMap = useMemo(() => {
    const map = new Map<string, UpsellApproval>();
    approvals.forEach(a => {
      map.set(`${a.item_type}_${a.item_id}`, a);
    });
    return map;
  }, [approvals]);

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ itemType, itemId, approvedBy }: { itemType: 'extra_work' | 'service'; itemId: string; approvedBy: string }) => {
      const { error } = await supabase
        .from('upsell_approvals')
        .insert({
          item_type: itemType,
          item_id: itemId,
          approved_by: approvedBy,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsell_approvals'] });
      toast.success('Provize byla schválena');
    },
    onError: (error) => {
      console.error('Failed to approve commission:', error);
      toast.error('Nepodařilo se schválit provizi');
    },
  });

  // Revoke mutation
  const revokeMutation = useMutation({
    mutationFn: async ({ itemType, itemId }: { itemType: 'extra_work' | 'service'; itemId: string }) => {
      const { error } = await supabase
        .from('upsell_approvals')
        .delete()
        .eq('item_type', itemType)
        .eq('item_id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsell_approvals'] });
      toast.success('Schválení bylo zrušeno');
    },
    onError: (error) => {
      console.error('Failed to revoke approval:', error);
      toast.error('Nepodařilo se zrušit schválení');
    },
  });

  // Get approval status for an item
  const getApprovalStatus = useCallback((type: 'extra_work' | 'service', id: string) => {
    const key = `${type}_${id}`;
    const approval = approvalsMap.get(key);
    if (!approval) return null;
    return {
      approved: true,
      approvedAt: approval.approved_at,
      approvedBy: approval.approved_by,
    };
  }, [approvalsMap]);

  // Approve a commission
  const approveCommission = useCallback((type: 'extra_work' | 'service', id: string, approvedBy: string) => {
    return approveMutation.mutateAsync({ itemType: type, itemId: id, approvedBy });
  }, [approveMutation]);

  // Revoke approval
  const revokeApproval = useCallback((type: 'extra_work' | 'service', id: string) => {
    return revokeMutation.mutateAsync({ itemType: type, itemId: id });
  }, [revokeMutation]);

  // Get all upsells for a specific month
  const getUpsellsForMonth = useCallback((year: number, month: number): UpsellItem[] => {
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(new Date(year, month - 1));
    const results: UpsellItem[] = [];

    // Get extra works with upsold_by_id in this month
    extraWorks.forEach(ew => {
      if (!ew.upsold_by_id || !ew.upsell_commission_percent) return;

      const workDate = parseISO(ew.work_date);
      if (!isWithinInterval(workDate, { start: monthStart, end: monthEnd })) return;

      const engagement = getEngagementById(ew.engagement_id);
      const client = getClientById(ew.client_id);
      const seller = getColleagueById(ew.upsold_by_id);

      if (!client) return;

      const approval = getApprovalStatus('extra_work', ew.id);
      const commissionAmount = ew.amount * (ew.upsell_commission_percent / 100);

      results.push({
        id: ew.id,
        type: 'extra_work',
        clientId: client.id,
        clientName: client.name,
        brandName: client.brand_name || client.name,
        engagementId: engagement?.id || '',
        engagementName: engagement?.name || 'N/A',
        itemName: ew.name,
        amount: ew.amount,
        currency: ew.currency || 'CZK',
        upsoldById: ew.upsold_by_id,
        upsoldByName: seller?.full_name || 'Neznámý',
        commissionPercent: ew.upsell_commission_percent,
        commissionAmount,
        isApproved: approval?.approved || false,
        approvedAt: approval?.approvedAt || null,
        approvedBy: approval?.approvedBy || null,
        createdAt: ew.created_at,
      });
    });

    // Get engagement services with upsold_by_id
    engagementServices.forEach(es => {
      if (!es.upsold_by_id || !es.upsell_commission_percent) return;

      const engagement = getEngagementById(es.engagement_id);
      if (!engagement) return;

      const client = getClientById(engagement.client_id);
      const seller = getColleagueById(es.upsold_by_id);

      if (!client) return;

      // Determine when commission should be counted
      let commissionDate: Date;
      const isOneOff = es.billing_type === 'one_off';

      if (isOneOff) {
        commissionDate = parseISO(es.created_at);
      } else if (es.effective_from) {
        const effectiveDate = parseISO(es.effective_from);
        const dayOfMonth = effectiveDate.getDate();

        if (dayOfMonth === 1) {
          commissionDate = effectiveDate;
        } else {
          commissionDate = new Date(effectiveDate.getFullYear(), effectiveDate.getMonth() + 1, 1);
        }
      } else {
        commissionDate = parseISO(es.created_at);
      }

      if (!isWithinInterval(commissionDate, { start: monthStart, end: monthEnd })) return;

      const approval = getApprovalStatus('service', es.id);

      let amount = es.price;
      if (es.creative_boost_max_credits && es.creative_boost_price_per_credit) {
        amount = es.creative_boost_max_credits * es.creative_boost_price_per_credit;
      }

      const commissionAmount = amount * (es.upsell_commission_percent / 100);

      results.push({
        id: es.id,
        type: 'service',
        clientId: client.id,
        clientName: client.name,
        brandName: client.brand_name || client.name,
        engagementId: engagement.id,
        engagementName: engagement.name,
        itemName: es.name,
        amount,
        currency: es.currency || 'CZK',
        upsoldById: es.upsold_by_id,
        upsoldByName: seller?.full_name || 'Neznámý',
        commissionPercent: es.upsell_commission_percent,
        commissionAmount,
        isApproved: approval?.approved || false,
        approvedAt: approval?.approvedAt || null,
        approvedBy: approval?.approvedBy || null,
        createdAt: es.created_at,
        isOneOff,
      });
    });

    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [extraWorks, engagementServices, getClientById, getEngagementById, getColleagueById, getApprovalStatus]);

  // Get approved commissions for a specific colleague
  const getApprovedCommissionsForColleague = useCallback((colleagueId: string, year?: number, month?: number): UpsellItem[] => {
    const allUpsells: UpsellItem[] = [];

    extraWorks.forEach(ew => {
      if (ew.upsold_by_id !== colleagueId || !ew.upsell_commission_percent) return;

      const approval = getApprovalStatus('extra_work', ew.id);
      if (!approval?.approved) return;

      if (year && month) {
        const workDate = parseISO(ew.work_date);
        const monthStart = startOfMonth(new Date(year, month - 1));
        const monthEnd = endOfMonth(new Date(year, month - 1));
        if (!isWithinInterval(workDate, { start: monthStart, end: monthEnd })) return;
      }

      const engagement = getEngagementById(ew.engagement_id);
      const client = getClientById(ew.client_id);
      const seller = getColleagueById(ew.upsold_by_id);

      if (!client) return;

      const commissionAmount = ew.amount * (ew.upsell_commission_percent / 100);

      allUpsells.push({
        id: ew.id,
        type: 'extra_work',
        clientId: client.id,
        clientName: client.name,
        brandName: client.brand_name || client.name,
        engagementId: engagement?.id || '',
        engagementName: engagement?.name || 'N/A',
        itemName: ew.name,
        amount: ew.amount,
        currency: ew.currency || 'CZK',
        upsoldById: ew.upsold_by_id,
        upsoldByName: seller?.full_name || 'Neznámý',
        commissionPercent: ew.upsell_commission_percent,
        commissionAmount,
        isApproved: true,
        approvedAt: approval.approvedAt,
        approvedBy: approval.approvedBy,
        createdAt: ew.created_at,
      });
    });

    engagementServices.forEach(es => {
      if (es.upsold_by_id !== colleagueId || !es.upsell_commission_percent) return;

      const approval = getApprovalStatus('service', es.id);
      if (!approval?.approved) return;

      const engagement = getEngagementById(es.engagement_id);
      if (!engagement) return;

      const client = getClientById(engagement.client_id);
      const seller = getColleagueById(es.upsold_by_id);

      if (!client) return;

      const isOneOff = es.billing_type === 'one_off';
      let commissionDate: Date;

      if (isOneOff) {
        commissionDate = parseISO(es.created_at);
      } else if (es.effective_from) {
        const effectiveDate = parseISO(es.effective_from);
        const dayOfMonth = effectiveDate.getDate();

        if (dayOfMonth === 1) {
          commissionDate = effectiveDate;
        } else {
          commissionDate = new Date(effectiveDate.getFullYear(), effectiveDate.getMonth() + 1, 1);
        }
      } else {
        commissionDate = parseISO(es.created_at);
      }

      if (year && month) {
        const monthStart = startOfMonth(new Date(year, month - 1));
        const monthEnd = endOfMonth(new Date(year, month - 1));
        if (!isWithinInterval(commissionDate, { start: monthStart, end: monthEnd })) return;
      }

      let amount = es.price;
      if (es.creative_boost_max_credits && es.creative_boost_price_per_credit) {
        amount = es.creative_boost_max_credits * es.creative_boost_price_per_credit;
      }

      const commissionAmount = amount * (es.upsell_commission_percent / 100);

      allUpsells.push({
        id: es.id,
        type: 'service',
        clientId: client.id,
        clientName: client.name,
        brandName: client.brand_name || client.name,
        engagementId: engagement.id,
        engagementName: engagement.name,
        itemName: es.name,
        amount,
        currency: es.currency || 'CZK',
        upsoldById: es.upsold_by_id,
        upsoldByName: seller?.full_name || 'Neznámý',
        commissionPercent: es.upsell_commission_percent,
        commissionAmount,
        isApproved: true,
        approvedAt: approval.approvedAt,
        approvedBy: approval.approvedBy,
        createdAt: es.created_at,
        isOneOff,
      });
    });

    return allUpsells.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [extraWorks, engagementServices, getClientById, getEngagementById, getColleagueById, getApprovalStatus]);

  return {
    getApprovalStatus,
    approveCommission,
    revokeApproval,
    getUpsellsForMonth,
    getApprovedCommissionsForColleague,
  };
}
