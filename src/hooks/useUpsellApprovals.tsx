import { useState, useCallback, useMemo } from 'react';
import { useCRMData } from '@/hooks/useCRMData';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

const STORAGE_KEY = 'upsell_commission_approvals';

interface ApprovalData {
  approved: boolean;
  approvedAt: string;
  approvedBy: string;
}

interface ApprovalStore {
  [key: string]: ApprovalData;
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
  isOneOff?: boolean; // For distinguishing one-off vs monthly services
}

const getStorageKey = (type: 'extra_work' | 'service', id: string) => `${type}_${id}`;

const getApprovals = (): ApprovalStore => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveApprovals = (approvals: ApprovalStore) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(approvals));
};

export function useUpsellApprovals() {
  const { 
    extraWorks, 
    engagementServices, 
    engagements, 
    clients, 
    colleagues,
    getClientById,
    getEngagementById,
    getColleagueById,
  } = useCRMData();
  
  const [version, setVersion] = useState(0);
  const forceUpdate = useCallback(() => setVersion(v => v + 1), []);

  // Get approval status for an item
  const getApprovalStatus = useCallback((type: 'extra_work' | 'service', id: string): ApprovalData | null => {
    const approvals = getApprovals();
    const key = getStorageKey(type, id);
    return approvals[key] || null;
  }, [version]);

  // Approve a commission
  const approveCommission = useCallback((type: 'extra_work' | 'service', id: string, approvedBy: string) => {
    const approvals = getApprovals();
    const key = getStorageKey(type, id);
    approvals[key] = {
      approved: true,
      approvedAt: new Date().toISOString(),
      approvedBy,
    };
    saveApprovals(approvals);
    forceUpdate();
  }, [forceUpdate]);

  // Revoke approval
  const revokeApproval = useCallback((type: 'extra_work' | 'service', id: string) => {
    const approvals = getApprovals();
    const key = getStorageKey(type, id);
    delete approvals[key];
    saveApprovals(approvals);
    forceUpdate();
  }, [forceUpdate]);

  // Mock data for demonstration
  const getMockUpsells = useCallback((year: number, month: number): UpsellItem[] => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    // Only show mock data for current month
    if (year !== currentYear || month !== currentMonth) {
      return [];
    }

    const mockData: UpsellItem[] = [
      {
        id: 'mock-extra-work-1',
        type: 'extra_work',
        clientId: 'mock-client-1',
        clientName: 'ACME Corporation s.r.o.',
        brandName: 'ACME Corp',
        engagementId: 'mock-engagement-1',
        engagementName: 'Performance Marketing 2026',
        itemName: 'Dodatečné bannery pro zimní kampaň',
        amount: 15000,
        currency: 'CZK',
        upsoldById: 'mock-colleague-1',
        upsoldByName: 'Jan Novák',
        commissionPercent: 10,
        commissionAmount: 1500,
        isApproved: false,
        approvedAt: null,
        approvedBy: null,
        createdAt: new Date(year, month - 1, 15).toISOString(),
      },
      {
        id: 'mock-service-1',
        type: 'service',
        clientId: 'mock-client-2',
        clientName: 'Beta Technologies a.s.',
        brandName: 'BetaTech',
        engagementId: 'mock-engagement-2',
        engagementName: 'Creative Retainer',
        itemName: 'Creative Boost',
        amount: 20000, // 50 credits × 400 CZK
        currency: 'CZK',
        upsoldById: 'mock-colleague-2',
        upsoldByName: 'Petra Svobodová',
        commissionPercent: 10,
        commissionAmount: 2000,
        isApproved: false,
        approvedAt: null,
        approvedBy: null,
        createdAt: new Date(year, month - 1, 10).toISOString(),
      },
      {
        id: 'mock-extra-work-2',
        type: 'extra_work',
        clientId: 'mock-client-3',
        clientName: 'Gamma Industries s.r.o.',
        brandName: 'Gamma',
        engagementId: 'mock-engagement-3',
        engagementName: 'Social Media Management',
        itemName: 'Urgentní video produkce',
        amount: 25000,
        currency: 'CZK',
        upsoldById: 'mock-colleague-1',
        upsoldByName: 'Jan Novák',
        commissionPercent: 10,
        commissionAmount: 2500,
        isApproved: false,
        approvedAt: null,
        approvedBy: null,
        createdAt: new Date(year, month - 1, 5).toISOString(),
      },
    ];

    // Apply approval status from localStorage
    return mockData.map(item => {
      const approval = getApprovalStatus(item.type, item.id);
      return {
        ...item,
        isApproved: approval?.approved || false,
        approvedAt: approval?.approvedAt || null,
        approvedBy: approval?.approvedBy || null,
      };
    });
  }, [getApprovalStatus, version]);

  // Get all upsells for a specific month
  const getUpsellsForMonth = useCallback((year: number, month: number): UpsellItem[] => {
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(new Date(year, month - 1));
    const results: UpsellItem[] = [];

    // Add mock data for demonstration
    const mockUpsells = getMockUpsells(year, month);
    results.push(...mockUpsells);

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
    // For monthly services with mid-month start (effective_from), commission is in the NEXT full month
    // For one-off services, commission is immediate based on the creation date
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
        // One-off: commission is immediate (based on creation date)
        commissionDate = parseISO(es.created_at);
      } else if (es.effective_from) {
        // Monthly with effective_from: commission is in the first FULL month
        const effectiveDate = parseISO(es.effective_from);
        const dayOfMonth = effectiveDate.getDate();
        
        if (dayOfMonth === 1) {
          // Starts on 1st - commission in the same month
          commissionDate = effectiveDate;
        } else {
          // Starts mid-month - commission in the NEXT month (first full month)
          commissionDate = new Date(effectiveDate.getFullYear(), effectiveDate.getMonth() + 1, 1);
        }
      } else {
        // No effective_from - use creation date
        commissionDate = parseISO(es.created_at);
      }

      // Check if this commission belongs to the requested month
      if (!isWithinInterval(commissionDate, { start: monthStart, end: monthEnd })) return;

      const approval = getApprovalStatus('service', es.id);
      
      // Calculate amount - always use FULL price (not prorated)
      // For Creative Boost use max_credits * price_per_credit
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

    // Sort by created_at descending
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [extraWorks, engagementServices, getClientById, getEngagementById, getColleagueById, getApprovalStatus, version]);

  // Get approved commissions for a specific colleague
  const getApprovedCommissionsForColleague = useCallback((colleagueId: string, year?: number, month?: number): UpsellItem[] => {
    const allUpsells: UpsellItem[] = [];
    
    // Get all extra works and services with upsold_by matching colleagueId
    extraWorks.forEach(ew => {
      if (ew.upsold_by_id !== colleagueId || !ew.upsell_commission_percent) return;
      
      const approval = getApprovalStatus('extra_work', ew.id);
      if (!approval?.approved) return;

      // Filter by month if specified
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

      // Determine when commission should be counted (same logic as getUpsellsForMonth)
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

      // Filter by month if specified
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
  }, [extraWorks, engagementServices, getClientById, getEngagementById, getColleagueById, getApprovalStatus, version]);

  return {
    getApprovalStatus,
    approveCommission,
    revokeApproval,
    getUpsellsForMonth,
    getApprovedCommissionsForColleague,
  };
}
