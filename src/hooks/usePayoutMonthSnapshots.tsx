import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PayoutMonthClosure {
  id: string;
  year: number;
  month: number;
  closedAt: string;
  closedBy: string | null;
  closedByName: string;
}

export interface PayoutSnapshotLineItems {
  clientItems: Array<{ name: string; amount: number; note?: string }>;
  creativeBoostItems: Array<{ name: string; credits: number; amount: number }>;
  commissionItems: Array<{ name: string; amount: number }>;
  extraWorkItems: Array<{ name: string; amount: number; hours?: number | null; rate?: number | null }>;
  manualItems: Array<{ name: string; category: 'marketing' | 'overhead' | 'client_work'; amount: number }>;
}

export interface ColleagueMonthPayoutSnapshot {
  id: string;
  year: number;
  month: number;
  colleagueId: string;
  clientTotal: number;
  marketingTotal: number;
  internalTotal: number;
  grandTotal: number;
  itemCount: number;
  lineItems: PayoutSnapshotLineItems;
  closureId: string | null;
}

interface CloseMonthPayload {
  colleague_id: string;
  client_total: number;
  marketing_total: number;
  internal_total: number;
  grand_total: number;
  item_count: number;
  line_items: PayoutSnapshotLineItems;
}

export function usePayoutMonthSnapshots() {
  const queryClient = useQueryClient();

  const { data: closures = [] } = useQuery({
    queryKey: ['payout_month_closures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payout_month_closures' as never)
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      if (error) throw error;
      return ((data || []) as Array<Record<string, unknown>>).map((row) => ({
        id: String(row.id),
        year: Number(row.year),
        month: Number(row.month),
        closedAt: String(row.closed_at),
        closedBy: row.closed_by ? String(row.closed_by) : null,
        closedByName: String(row.closed_by_name ?? 'System'),
      })) as PayoutMonthClosure[];
    },
  });

  const { data: snapshots = [] } = useQuery({
    queryKey: ['colleague_monthly_payout_snapshots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('colleague_monthly_payout_snapshots' as never)
        .select('*');
      if (error) throw error;
      return ((data || []) as Array<Record<string, unknown>>).map((row) => ({
        id: String(row.id),
        year: Number(row.year),
        month: Number(row.month),
        colleagueId: String(row.colleague_id),
        clientTotal: Number(row.client_total ?? 0),
        marketingTotal: Number(row.marketing_total ?? 0),
        internalTotal: Number(row.internal_total ?? 0),
        grandTotal: Number(row.grand_total ?? 0),
        itemCount: Number(row.item_count ?? 0),
        lineItems: (row.line_items || {
          clientItems: [],
          creativeBoostItems: [],
          commissionItems: [],
          extraWorkItems: [],
          manualItems: [],
        }) as PayoutSnapshotLineItems,
        closureId: row.closure_id ? String(row.closure_id) : null,
      })) as ColleagueMonthPayoutSnapshot[];
    },
  });

  const closeMonthMutation = useMutation({
    mutationFn: async ({ year, month, snapshotsPayload }: { year: number; month: number; snapshotsPayload: CloseMonthPayload[] }) => {
      const { error } = await supabase.rpc('close_colleague_payout_month' as never, {
        p_year: year,
        p_month: month,
        p_snapshots: snapshotsPayload,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payout_month_closures'] });
      queryClient.invalidateQueries({ queryKey: ['colleague_monthly_payout_snapshots'] });
    },
  });

  const isMonthClosed = useCallback((year: number, month: number) => {
    return closures.some((closure) => closure.year === year && closure.month === month);
  }, [closures]);

  const getSnapshotForMonth = useCallback((colleagueId: string, year: number, month: number) => {
    return snapshots.find((snapshot) =>
      snapshot.colleagueId === colleagueId &&
      snapshot.year === year &&
      snapshot.month === month
    );
  }, [snapshots]);

  const getSnapshotsForColleague = useCallback((colleagueId: string) => {
    return snapshots.filter((snapshot) => snapshot.colleagueId === colleagueId);
  }, [snapshots]);

  const closeMonth = useCallback(async (year: number, month: number, snapshotsPayload: CloseMonthPayload[]) => {
    if (snapshotsPayload.length === 0) {
      throw new Error('Cannot close payout month without snapshot payload.');
    }
    await closeMonthMutation.mutateAsync({ year, month, snapshotsPayload });
  }, [closeMonthMutation]);

  return {
    closures,
    snapshots,
    isMonthClosed,
    getSnapshotForMonth,
    getSnapshotsForColleague,
    closeMonth,
    isClosingMonth: closeMonthMutation.isPending,
  };
}
