import { useState, useCallback, createContext, useContext, ReactNode, useMemo } from 'react';
import {
  outputTypes as initialOutputTypes,
  creativeBoostClients as initialClients,
  creativeBoostClientMonths as initialClientMonths,
  clientMonthOutputs as initialOutputs,
} from '@/data/creativeBoostMockData';
import { useCRMData } from '@/hooks/useCRMData';
import type {
  OutputType,
  CreativeBoostClientMonth,
  CreativeBoostClient,
  ClientMonthSummary,
  ClientMonthOutput,
  MonthStatus,
  CreativeBoostSettingsChange,
} from '@/types/creativeBoost';
import { currentUser } from '@/data/mockData';

interface ColleagueCreditDetail {
  clientId: string;
  clientName: string;
  outputTypeName: string;
  normalCount: number;
  expressCount: number;
  normalCredits: number;
  expressCredits: number;
  totalCredits: number;
}

interface CreativeBoostContextType {
  // Data
  outputTypes: OutputType[];
  clients: CreativeBoostClient[];
  clientMonths: CreativeBoostClientMonth[];
  outputs: ClientMonthOutput[];
  settingsHistory: CreativeBoostSettingsChange[];

  // Output type operations
  addOutputType: (data: Omit<OutputType, 'id' | 'createdAt' | 'updatedAt'>) => OutputType;
  updateOutputType: (id: string, data: Partial<OutputType>) => void;

  // Client operations
  addCreativeBoostClient: (clientId: string, defaults?: Partial<CreativeBoostClient>) => CreativeBoostClient;

  // Client month operations
  addClientToMonth: (clientId: string, year: number, month: number, settings?: Partial<CreativeBoostClientMonth>) => CreativeBoostClientMonth;
  removeClientFromMonth: (clientId: string, year: number, month: number) => void;
  updateClientMonth: (id: string, data: Partial<CreativeBoostClientMonth>) => void;
  getClientsForMonth: (year: number, month: number) => string[];
  getAvailableClientsForMonth: (year: number, month: number) => CreativeBoostClient[];
  getClientMonthByClientId: (clientId: string, year: number, month: number) => CreativeBoostClientMonth | undefined;

  // Output operations (spreadsheet mode)
  getClientOutputs: (clientId: string, year: number, month: number) => ClientMonthOutput[];
  updateClientOutput: (clientId: string, outputTypeId: string, year: number, month: number, data: Partial<ClientMonthOutput>) => void;

  // Computed data
  getClientMonthSummaries: (year: number, month: number) => ClientMonthSummary[];
  calculateOutputCredits: (outputTypeId: string, quantity: number, expressCount: number) => {
    normalCredits: number;
    expressCredits: number;
    totalCredits: number;
  };

  // Colleague credits
  getColleagueCredits: (colleagueId: string, year: number, month: number) => number;
  getColleagueCreditsYear: (colleagueId: string, year: number) => number;
  getColleagueCreditsDetail: (colleagueId: string, year?: number, month?: number) => ColleagueCreditDetail[];

  // Engagement service integration
  getClientMonthByEngagementServiceId: (engagementServiceId: string, year: number, month: number) => CreativeBoostClientMonth | undefined;
  getClientMonthSummaryByEngagementServiceId: (engagementServiceId: string, year: number, month: number) => ClientMonthSummary | undefined;

  // Settings history
  getSettingsHistory: (clientId: string, year?: number, month?: number) => CreativeBoostSettingsChange[];

  // Auto-sync for active engagements
  ensureClientMonthsForActiveEngagements: (year: number, month: number) => void;

  // Helpers
  getOutputTypeById: (id: string) => OutputType | undefined;
  getActiveOutputTypes: () => OutputType[];
}

const CreativeBoostContext = createContext<CreativeBoostContextType | null>(null);

export function CreativeBoostProvider({ children }: { children: ReactNode }) {
  const { getClientById, colleagues, engagements, engagementServices } = useCRMData();
  
  const [outputTypes, setOutputTypes] = useState<OutputType[]>(initialOutputTypes);
  const [clients, setClients] = useState<CreativeBoostClient[]>(initialClients);
  const [clientMonths, setClientMonths] = useState<CreativeBoostClientMonth[]>(initialClientMonths);
  const [outputs, setOutputs] = useState<ClientMonthOutput[]>(initialOutputs);
  const [settingsHistory, setSettingsHistory] = useState<CreativeBoostSettingsChange[]>([]);

  const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = () => new Date().toISOString();

  // Output type operations
  const addOutputType = useCallback((data: Omit<OutputType, 'id' | 'createdAt' | 'updatedAt'>): OutputType => {
    const newType: OutputType = {
      ...data,
      id: generateId('ot'),
      createdAt: now(),
      updatedAt: now(),
    };
    setOutputTypes(prev => [...prev, newType]);
    return newType;
  }, []);

  const updateOutputType = useCallback((id: string, data: Partial<OutputType>) => {
    setOutputTypes(prev => prev.map(t =>
      t.id === id ? { ...t, ...data, updatedAt: now() } : t
    ));
  }, []);

  // Client operations
  const addCreativeBoostClient = useCallback((clientId: string, defaults?: Partial<CreativeBoostClient>): CreativeBoostClient => {
    const existing = clients.find(c => c.clientId === clientId);
    if (existing) return existing;

    const newClient: CreativeBoostClient = {
      clientId,
      isActive: defaults?.isActive ?? true,
      defaultMinCredits: defaults?.defaultMinCredits ?? 30,
      defaultMaxCredits: defaults?.defaultMaxCredits ?? 50,
      defaultPricePerCredit: defaults?.defaultPricePerCredit ?? 1500,
    };
    
    setClients(prev => [...prev, newClient]);
    return newClient;
  }, [clients]);

  // Client month operations
  const addClientToMonth = useCallback((clientId: string, year: number, month: number, settings?: Partial<CreativeBoostClientMonth>): CreativeBoostClientMonth => {
    // Auto-add client to Creative Boost clients if not exists
    const clientExists = clients.find(c => c.clientId === clientId);
    if (!clientExists) {
      const newClient: CreativeBoostClient = {
        clientId,
        isActive: true,
        defaultMinCredits: settings?.minCredits ?? 30,
        defaultMaxCredits: settings?.maxCredits ?? 50,
        defaultPricePerCredit: settings?.pricePerCredit ?? 1500,
      };
      setClients(prev => [...prev, newClient]);
    }
    const existing = clientMonths.find(
      cm => cm.clientId === clientId && cm.year === year && cm.month === month
    );
    
    if (existing) return existing;

    const clientConfig = clients.find(c => c.clientId === clientId);
    const newMonth: CreativeBoostClientMonth = {
      id: generateId('cbm'),
      clientId,
      year,
      month,
      minCredits: settings?.minCredits ?? clientConfig?.defaultMinCredits ?? 30,
      maxCredits: settings?.maxCredits ?? clientConfig?.defaultMaxCredits ?? 50,
      pricePerCredit: settings?.pricePerCredit ?? clientConfig?.defaultPricePerCredit ?? 1500,
      colleagueId: settings?.colleagueId ?? '',
      status: settings?.status ?? 'active',
      engagementServiceId: settings?.engagementServiceId ?? null,
      engagementId: settings?.engagementId ?? null,
      createdAt: now(),
      updatedAt: now(),
    };
    
    setClientMonths(prev => [...prev, newMonth]);
    return newMonth;
  }, [clientMonths, clients]);

  const removeClientFromMonth = useCallback((clientId: string, year: number, month: number) => {
    setClientMonths(prev => prev.filter(
      cm => !(cm.clientId === clientId && cm.year === year && cm.month === month)
    ));
    setOutputs(prev => prev.filter(
      o => !(o.clientId === clientId && o.year === year && o.month === month)
    ));
  }, []);

  const updateClientMonth = useCallback((id: string, data: Partial<CreativeBoostClientMonth>) => {
    setClientMonths(prev => {
      const existing = prev.find(cm => cm.id === id);
      if (!existing) return prev;
      
      // Track changes for history
      const changes: CreativeBoostSettingsChange[] = [];
      
      if (data.maxCredits !== undefined && data.maxCredits !== existing.maxCredits) {
        changes.push({
          id: `cbsh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          clientMonthId: id,
          clientId: existing.clientId,
          year: existing.year,
          month: existing.month,
          changeType: 'max_credits',
          fieldName: 'Max. kreditů',
          oldValue: existing.maxCredits,
          newValue: data.maxCredits,
          changedBy: currentUser.id,
          changedByName: currentUser.full_name,
          changedAt: now(),
        });
      }
      
      if (data.pricePerCredit !== undefined && data.pricePerCredit !== existing.pricePerCredit) {
        changes.push({
          id: `cbsh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          clientMonthId: id,
          clientId: existing.clientId,
          year: existing.year,
          month: existing.month,
          changeType: 'price_per_credit',
          fieldName: 'Cena za kredit',
          oldValue: existing.pricePerCredit,
          newValue: data.pricePerCredit,
          changedBy: currentUser.id,
          changedByName: currentUser.full_name,
          changedAt: now(),
        });
      }
      
      if (data.status !== undefined && data.status !== existing.status) {
        const statusLabels: Record<string, string> = {
          active: 'Aktivní',
          inactive: 'Neaktivní',
        };
        changes.push({
          id: `cbsh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          clientMonthId: id,
          clientId: existing.clientId,
          year: existing.year,
          month: existing.month,
          changeType: 'status',
          fieldName: 'Status',
          oldValue: statusLabels[existing.status] || existing.status,
          newValue: statusLabels[data.status] || data.status,
          changedBy: currentUser.id,
          changedByName: currentUser.full_name,
          changedAt: now(),
        });
      }
      
      if (changes.length > 0) {
        setSettingsHistory(prev => [...prev, ...changes]);
      }
      
      return prev.map(cm =>
        cm.id === id ? { ...cm, ...data, updatedAt: now() } : cm
      );
    });
  }, []);

  const getClientsForMonth = useCallback((year: number, month: number) => {
    return clientMonths
      .filter(cm => cm.year === year && cm.month === month)
      .map(cm => cm.clientId);
  }, [clientMonths]);

  const getAvailableClientsForMonth = useCallback((year: number, month: number) => {
    const existingClientIds = getClientsForMonth(year, month);
    return clients.filter(c => c.isActive && !existingClientIds.includes(c.clientId));
  }, [clients, getClientsForMonth]);

  const getClientMonthByClientId = useCallback((clientId: string, year: number, month: number) => {
    return clientMonths.find(
      cm => cm.clientId === clientId && cm.year === year && cm.month === month
    );
  }, [clientMonths]);

  // Output operations
  const getClientOutputs = useCallback((clientId: string, year: number, month: number) => {
    return outputs.filter(
      o => o.clientId === clientId && o.year === year && o.month === month
    );
  }, [outputs]);

  const updateClientOutput = useCallback((clientId: string, outputTypeId: string, year: number, month: number, data: Partial<ClientMonthOutput>) => {
    setOutputs(prev => {
      const existingIndex = prev.findIndex(
        o => o.clientId === clientId && o.outputTypeId === outputTypeId && o.year === year && o.month === month
      );
      
      if (existingIndex >= 0) {
        // Update existing
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...data, updatedAt: now() };
        
        // Remove if both counts are 0
        const totalCount = (updated[existingIndex].normalCount ?? 0) + (updated[existingIndex].expressCount ?? 0);
        if (totalCount === 0) {
          updated.splice(existingIndex, 1);
        }
        
        return updated;
      } else {
        // Create new only if there's at least one item
        const totalCount = (data.normalCount ?? 0) + (data.expressCount ?? 0);
        if (totalCount > 0) {
          const newOutput: ClientMonthOutput = {
            id: generateId('cmo'),
            clientId,
            outputTypeId,
            year,
            month,
            normalCount: data.normalCount ?? 0,
            expressCount: data.expressCount ?? 0,
            colleagueId: data.colleagueId ?? '',
            createdAt: now(),
            updatedAt: now(),
          };
          return [...prev, newOutput];
        }
      }
      
      return prev;
    });
  }, []);

  // Calculate credits for output
  // Express delivery multiplies credits by 1.5x
  const calculateOutputCredits = useCallback((outputTypeId: string, normalCount: number, expressCount: number) => {
    const outputType = outputTypes.find(t => t.id === outputTypeId);
    const baseCredits = outputType?.baseCredits ?? 0;
    
    const normalCredits = normalCount * baseCredits;
    // Express items cost 1.5x the base credits
    const expressCredits = expressCount * baseCredits * 1.5;
    const totalCredits = normalCredits + expressCredits;

    return { normalCredits, expressCredits, totalCredits };
  }, [outputTypes]);

  // Computed data
  const getClientMonthSummaries = useCallback((year: number, month: number): ClientMonthSummary[] => {
    return clientMonths
      .filter(cm => cm.year === year && cm.month === month)
      .map(monthData => {
        const clientData = getClientById(monthData.clientId);
        if (!clientData) return null;

        const clientOutputs = getClientOutputs(monthData.clientId, year, month);
        
        let totalNormalCredits = 0;
        let totalExpressCredits = 0;
        
        clientOutputs.forEach(output => {
          const credits = calculateOutputCredits(output.outputTypeId, output.normalCount, output.expressCount);
          totalNormalCredits += credits.normalCredits;
          totalExpressCredits += credits.expressCredits;
        });
        
        const usedCredits = totalNormalCredits + totalExpressCredits;

        return {
          clientId: monthData.clientId,
          clientName: clientData.name,
          brandName: clientData.brand_name,
          year,
          month,
          minCredits: monthData.minCredits,
          maxCredits: monthData.maxCredits,
          usedCredits,
          normalCredits: totalNormalCredits,
          expressCredits: totalExpressCredits,
          remainingCredits: monthData.maxCredits - usedCredits,
          estimatedInvoice: usedCredits * monthData.pricePerCredit,
          pricePerCredit: monthData.pricePerCredit,
          status: monthData.status,
          itemCount: clientOutputs.length,
        };
      })
      .filter((s): s is ClientMonthSummary => s !== null);
  }, [clientMonths, getClientById, getClientOutputs, calculateOutputCredits]);

  // Colleague credits
  const getColleagueCredits = useCallback((colleagueId: string, year: number, month: number) => {
    return outputs
      .filter(o => o.colleagueId === colleagueId && o.year === year && o.month === month)
      .reduce((sum, output) => {
        const credits = calculateOutputCredits(output.outputTypeId, output.normalCount, output.expressCount);
        return sum + credits.totalCredits;
      }, 0);
  }, [outputs, calculateOutputCredits]);

  const getColleagueCreditsYear = useCallback((colleagueId: string, year: number) => {
    return outputs
      .filter(o => o.colleagueId === colleagueId && o.year === year)
      .reduce((sum, output) => {
        const credits = calculateOutputCredits(output.outputTypeId, output.normalCount, output.expressCount);
        return sum + credits.totalCredits;
      }, 0);
  }, [outputs, calculateOutputCredits]);

  const getColleagueCreditsDetail = useCallback((colleagueId: string, year?: number, month?: number): ColleagueCreditDetail[] => {
    return outputs
      .filter(o => {
        if (o.colleagueId !== colleagueId) return false;
        if (year !== undefined && o.year !== year) return false;
        if (month !== undefined && o.month !== month) return false;
        return true;
      })
      .map(output => {
        const clientData = getClientById(output.clientId);
        const outputType = outputTypes.find(t => t.id === output.outputTypeId);
        const credits = calculateOutputCredits(output.outputTypeId, output.normalCount, output.expressCount);
        
        return {
          clientId: output.clientId,
          clientName: clientData?.brand_name ?? 'Neznámý klient',
          outputTypeName: outputType?.name ?? 'Neznámý typ',
          normalCount: output.normalCount,
          expressCount: output.expressCount,
          normalCredits: credits.normalCredits,
          expressCredits: credits.expressCredits,
          totalCredits: credits.totalCredits,
        };
      });
  }, [outputs, getClientById, outputTypes, calculateOutputCredits]);

  // Helpers
  const getOutputTypeById = useCallback((id: string) => {
    return outputTypes.find(t => t.id === id);
  }, [outputTypes]);

  const getActiveOutputTypes = useCallback(() => {
    return outputTypes.filter(t => t.isActive);
  }, [outputTypes]);

  // Engagement service integration
  const getClientMonthByEngagementServiceId = useCallback((engagementServiceId: string, year: number, month: number) => {
    return clientMonths.find(
      cm => cm.engagementServiceId === engagementServiceId && cm.year === year && cm.month === month
    );
  }, [clientMonths]);

  const getClientMonthSummaryByEngagementServiceId = useCallback((engagementServiceId: string, year: number, month: number): ClientMonthSummary | undefined => {
    const monthData = clientMonths.find(
      cm => cm.engagementServiceId === engagementServiceId && cm.year === year && cm.month === month
    );
    
    if (!monthData) return undefined;

    const clientData = getClientById(monthData.clientId);
    if (!clientData) return undefined;

    const clientOutputs = outputs.filter(
      o => o.clientId === monthData.clientId && o.year === year && o.month === month
    );
    
    let totalNormalCredits = 0;
    let totalExpressCredits = 0;
    
    clientOutputs.forEach(output => {
      const credits = calculateOutputCredits(output.outputTypeId, output.normalCount, output.expressCount);
      totalNormalCredits += credits.normalCredits;
      totalExpressCredits += credits.expressCredits;
    });
    
    const usedCredits = totalNormalCredits + totalExpressCredits;

    return {
      clientId: monthData.clientId,
      clientName: clientData.name,
      brandName: clientData.brand_name,
      year,
      month,
      minCredits: monthData.minCredits,
      maxCredits: monthData.maxCredits,
      usedCredits,
      normalCredits: totalNormalCredits,
      expressCredits: totalExpressCredits,
      remainingCredits: monthData.maxCredits - usedCredits,
      estimatedInvoice: usedCredits * monthData.pricePerCredit,
      pricePerCredit: monthData.pricePerCredit,
      status: monthData.status,
      itemCount: clientOutputs.length,
    };
  }, [clientMonths, outputs, getClientById, calculateOutputCredits]);

  // Settings history
  const getSettingsHistory = useCallback((clientId: string, year?: number, month?: number): CreativeBoostSettingsChange[] => {
    return settingsHistory
      .filter(h => {
        if (h.clientId !== clientId) return false;
        if (year !== undefined && h.year !== year) return false;
        if (month !== undefined && h.month !== month) return false;
        return true;
      })
      .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
  }, [settingsHistory]);

  // Auto-sync: Ensure CreativeBoostClientMonth records exist for all active engagements with CB service
  const CREATIVE_BOOST_SERVICE_ID = 'srv-3';
  
  const ensureClientMonthsForActiveEngagements = useCallback((year: number, month: number) => {
    // Find all active engagements with Creative Boost service
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    
    engagements.forEach(engagement => {
      // Check if engagement is active for this month
      if (engagement.status !== 'active') return;
      
      const startDate = new Date(engagement.start_date);
      const endDate = engagement.end_date ? new Date(engagement.end_date) : null;
      
      // Engagement must have started before or during this month
      if (startDate > monthEnd) return;
      // Engagement must not have ended before this month
      if (endDate && endDate < monthStart) return;
      
      // Find Creative Boost service for this engagement
      const cbService = engagementServices.find(
        es => es.engagement_id === engagement.id && es.service_id === CREATIVE_BOOST_SERVICE_ID
      );
      
      if (!cbService) return;
      
      // Check if record already exists for this month
      const existingMonth = clientMonths.find(
        cm => cm.engagementServiceId === cbService.id && cm.year === year && cm.month === month
      );
      
      if (existingMonth) return;
      
      // Find previous month's settings to copy (or use service defaults)
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const previousMonth = clientMonths.find(
        cm => cm.engagementServiceId === cbService.id && cm.year === prevYear && cm.month === prevMonth
      );
      
      // Create new month record
      const newMonth: CreativeBoostClientMonth = {
        id: generateId('cbm'),
        clientId: engagement.client_id,
        year,
        month,
        minCredits: previousMonth?.minCredits ?? cbService.creative_boost_min_credits ?? 0,
        maxCredits: previousMonth?.maxCredits ?? cbService.creative_boost_max_credits ?? 50,
        pricePerCredit: previousMonth?.pricePerCredit ?? cbService.creative_boost_price_per_credit ?? 1500,
        colleagueId: previousMonth?.colleagueId ?? '',
        status: 'active',
        engagementServiceId: cbService.id,
        engagementId: engagement.id,
        createdAt: now(),
        updatedAt: now(),
      };
      
      setClientMonths(prev => [...prev, newMonth]);
      
      // Also ensure client exists in Creative Boost clients
      const clientExists = clients.find(c => c.clientId === engagement.client_id);
      if (!clientExists) {
        const newClient: CreativeBoostClient = {
          clientId: engagement.client_id,
          isActive: true,
          defaultMinCredits: newMonth.minCredits,
          defaultMaxCredits: newMonth.maxCredits,
          defaultPricePerCredit: newMonth.pricePerCredit,
        };
        setClients(prev => [...prev, newClient]);
      }
    });
  }, [engagements, engagementServices, clientMonths, clients]);

  return (
    <CreativeBoostContext.Provider value={{
      outputTypes,
      clients,
      clientMonths,
      outputs,
      settingsHistory,
      addOutputType,
      updateOutputType,
      addCreativeBoostClient,
      addClientToMonth,
      removeClientFromMonth,
      updateClientMonth,
      getClientsForMonth,
      getAvailableClientsForMonth,
      getClientMonthByClientId,
      getClientOutputs,
      updateClientOutput,
      getClientMonthSummaries,
      calculateOutputCredits,
      getColleagueCredits,
      getColleagueCreditsYear,
      getColleagueCreditsDetail,
      getClientMonthByEngagementServiceId,
      getClientMonthSummaryByEngagementServiceId,
      getSettingsHistory,
      ensureClientMonthsForActiveEngagements,
      getOutputTypeById,
      getActiveOutputTypes,
    }}>
      {children}
    </CreativeBoostContext.Provider>
  );
}

export function useCreativeBoostData() {
  const context = useContext(CreativeBoostContext);
  if (!context) {
    throw new Error('useCreativeBoostData must be used within a CreativeBoostProvider');
  }
  return context;
}