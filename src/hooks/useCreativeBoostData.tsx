import { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCRMData } from '@/hooks/useCRMData';
import { useAuth } from '@/hooks/useAuth';

// Default reward per credit when not configured in assignment
const DEFAULT_REWARD_PER_CREDIT = 80;
import type {
  OutputType,
  CreativeBoostClientMonth,
  CreativeBoostClient,
  ClientMonthSummary,
  ClientMonthOutput,
  MonthStatus,
  CreativeBoostSettingsChange,
  OutputCategory,
} from '@/types/creativeBoost';

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

interface ColleagueClientRewardSummary {
  clientId: string;
  clientName: string;
  brandName: string;
  engagementId: string | null;
  engagementName: string;
  totalCredits: number;
  bannerCredits: number;
  videoCredits: number;
  rewardPerCredit: number;
  bannerRewardPerCredit: number;
  videoRewardPerCredit: number;
  totalReward: number;
}

interface CreativeBoostContextType {
  // Data
  outputTypes: OutputType[];
  clientMonths: CreativeBoostClientMonth[];
  outputs: ClientMonthOutput[];
  settingsHistory: CreativeBoostSettingsChange[];
  isLoading: boolean;

  // Output type operations
  addOutputType: (data: Omit<OutputType, 'id' | 'createdAt' | 'updatedAt'>) => Promise<OutputType>;
  updateOutputType: (id: string, data: Partial<OutputType>) => Promise<void>;

  // Client month operations
  addClientToMonth: (clientId: string, year: number, month: number, settings?: Partial<CreativeBoostClientMonth>) => Promise<CreativeBoostClientMonth>;
  removeClientFromMonth: (clientId: string, year: number, month: number) => Promise<void>;
  updateClientMonth: (id: string, data: Partial<CreativeBoostClientMonth>) => Promise<void>;
  getClientsForMonth: (year: number, month: number) => string[];
  getAvailableClientsForMonth: (year: number, month: number) => CreativeBoostClient[];
  getClientMonthByClientId: (clientId: string, year: number, month: number) => CreativeBoostClientMonth | undefined;

  // Output operations (spreadsheet mode)
  getClientOutputs: (clientId: string, year: number, month: number) => ClientMonthOutput[];
  updateClientOutput: (clientId: string, outputTypeId: string, year: number, month: number, data: Partial<ClientMonthOutput>) => Promise<void>;

  // Computed data
  getClientMonthSummaries: (year: number, month: number) => ClientMonthSummary[];
  calculateOutputCredits: (outputTypeId: string, normalCount: number, expressCount: number) => {
    normalCredits: number;
    expressCredits: number;
    totalCredits: number;
  };

  // Colleague credits
  getColleagueCredits: (colleagueId: string, year: number, month: number) => number;
  getColleagueCreditsYear: (colleagueId: string, year: number) => number;
  getColleagueCreditsDetail: (colleagueId: string, year?: number, month?: number) => ColleagueCreditDetail[];
  getColleagueCreditsByClient: (colleagueId: string, year: number, month: number) => ColleagueClientRewardSummary[];

  // Engagement service integration
  getClientMonthByEngagementServiceId: (engagementServiceId: string, year: number, month: number) => CreativeBoostClientMonth | undefined;
  getClientMonthSummaryByEngagementServiceId: (engagementServiceId: string, year: number, month: number) => ClientMonthSummary | undefined;

  // Settings history
  getSettingsHistory: (clientId: string, year?: number, month?: number) => CreativeBoostSettingsChange[];

  // Auto-sync for active engagements
  ensureClientMonthsForActiveEngagements: (year: number, month: number) => Promise<void>;

  // Helpers
  getOutputTypeById: (id: string) => OutputType | undefined;
  getActiveOutputTypes: () => OutputType[];
}

const CreativeBoostContext = createContext<CreativeBoostContextType | null>(null);
const BANNER_OUTPUT_CATEGORIES: OutputCategory[] = ['banner', 'banner_translation', 'banner_revision', 'ai_photo'];
const VIDEO_OUTPUT_CATEGORIES: OutputCategory[] = ['video', 'video_translation', 'video_revision'];

// Transformer functions: snake_case DB -> camelCase TypeScript
const transformOutputType = (row: Record<string, unknown>): OutputType => ({
  id: row.id,
  name: row.name,
  category: row.category as OutputCategory,
  baseCredits: parseFloat(row.base_credits),
  description: row.description,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const transformClientMonth = (row: Record<string, unknown>): CreativeBoostClientMonth => ({
  id: row.id,
  clientId: row.client_id,
  year: row.year,
  month: row.month,
  minCredits: parseFloat(row.min_credits),
  maxCredits: parseFloat(row.max_credits),
  pricePerCredit: parseFloat(row.price_per_credit),
  colleagueId: row.colleague_id || '',
  status: row.status as MonthStatus,
  engagementServiceId: row.engagement_service_id,
  engagementId: row.engagement_id,
  invoiceId: row.invoice_id || null,
  invoicedAt: row.invoiced_at || null,
  invoicedAmount: row.invoiced_amount ? parseFloat(row.invoiced_amount) : null,
  invoicedCredits: row.invoiced_credits ? parseInt(row.invoiced_credits) : null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const transformOutput = (row: Record<string, unknown>): ClientMonthOutput => ({
  id: row.id,
  clientId: row.client_id,
  year: row.year,
  month: row.month,
  outputTypeId: row.output_type_id,
  normalCount: row.normal_count || 0,
  expressCount: row.express_count || 0,
  colleagueId: row.colleague_id || '',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const transformSettingsHistory = (row: Record<string, unknown>): CreativeBoostSettingsChange => ({
  id: row.id,
  clientMonthId: row.client_month_id,
  clientId: row.client_id,
  year: row.year,
  month: row.month,
  changeType: row.change_type,
  fieldName: row.field_name,
  oldValue: row.old_value,
  newValue: row.new_value,
  changedBy: row.changed_by,
  changedByName: row.changed_by_name,
  changedAt: row.changed_at,
});

export function CreativeBoostProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { getClientById, colleagues, engagements, engagementServices, assignments, services } = useCRMData();
  const { user } = useAuth();
  
  // Queries
  const { data: outputTypes = [], isLoading: outputTypesLoading } = useQuery({
    queryKey: ['output_types'],
    queryFn: async () => {
      const { data, error } = await supabase.from('output_types').select('*').order('name');
      if (error) throw error;
      return (data || []).map(transformOutputType);
    },
  });

  const { data: clientMonths = [], isLoading: clientMonthsLoading } = useQuery({
    queryKey: ['creative_boost_client_months'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creative_boost_client_months')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      if (error) throw error;
      return (data || []).map(transformClientMonth);
    },
  });

  const { data: outputs = [], isLoading: outputsLoading } = useQuery({
    queryKey: ['creative_boost_outputs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creative_boost_outputs')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      if (error) throw error;
      return (data || []).map(transformOutput);
    },
  });

  const { data: settingsHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['creative_boost_settings_history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creative_boost_settings_history')
        .select('*')
        .order('changed_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(transformSettingsHistory);
    },
  });

  const isLoading = outputTypesLoading || clientMonthsLoading || outputsLoading || historyLoading;

  // Mutations
  const addOutputTypeMutation = useMutation({
    mutationFn: async (data: Omit<OutputType, 'id' | 'createdAt' | 'updatedAt'>) => {
      const { data: result, error } = await supabase
        .from('output_types')
        .insert({
          name: data.name,
          category: data.category,
          base_credits: data.baseCredits,
          description: data.description,
          is_active: data.isActive,
        })
        .select()
        .single();
      if (error) throw error;
      return transformOutputType(result);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['output_types'] }),
  });

  const updateOutputTypeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<OutputType> }) => {
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.baseCredits !== undefined) updateData.base_credits = data.baseCredits;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.isActive !== undefined) updateData.is_active = data.isActive;

      const { error } = await supabase.from('output_types').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['output_types'] }),
  });

  const addClientToMonthMutation = useMutation({
    mutationFn: async ({
      clientId,
      year,
      month,
      settings,
    }: {
      clientId: string;
      year: number;
      month: number;
      settings?: Partial<CreativeBoostClientMonth>;
    }) => {
      const targetEngagementServiceId = settings?.engagementServiceId ?? null;
      const targetEngagementId = settings?.engagementId ?? null;

      // Exact match by engagement service (or both null when service is not provided).
      const existingExact = clientMonths.find(
        (cm) =>
          cm.clientId === clientId &&
          cm.year === year &&
          cm.month === month &&
          (cm.engagementServiceId ?? null) === targetEngagementServiceId
      );
      if (existingExact) return existingExact;

      // Legacy repair path:
      // Earlier versions created month rows without engagement_service_id.
      // When we now know the service, link the orphan row instead of skipping.
      if (targetEngagementServiceId !== null) {
        const orphanRows = clientMonths.filter(
          (cm) =>
            cm.clientId === clientId &&
            cm.year === year &&
            cm.month === month &&
            (cm.engagementServiceId ?? null) === null
        );

        if (orphanRows.length > 1) {
          throw new Error(
            `Creative Boost data integrity issue: multiple orphan month rows for client ${clientId} ${year}-${month}.`
          );
        }

        if (orphanRows.length === 1) {
          const orphan = orphanRows[0];
          const { data: repaired, error: repairError } = await supabase
            .from('creative_boost_client_months')
            .update({
              engagement_service_id: targetEngagementServiceId,
              engagement_id: targetEngagementId,
            })
            .eq('id', orphan.id)
            .select()
            .single();
          if (repairError) throw repairError;
          return transformClientMonth(repaired);
        }
      }

      const { data: result, error } = await supabase
        .from('creative_boost_client_months')
        .insert({
          client_id: clientId,
          year,
          month,
          min_credits: settings?.minCredits ?? 30,
          max_credits: settings?.maxCredits ?? 50,
          price_per_credit: settings?.pricePerCredit ?? 1500,
          colleague_id: settings?.colleagueId || null,
          status: settings?.status || 'active',
          engagement_service_id: settings?.engagementServiceId || null,
          engagement_id: settings?.engagementId || null,
        })
        .select()
        .single();
      if (error) throw error;
      return transformClientMonth(result);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['creative_boost_client_months'] }),
  });

  const removeClientFromMonthMutation = useMutation({
    mutationFn: async ({ clientId, year, month }: { clientId: string; year: number; month: number }) => {
      // Delete outputs first (cascade should handle this, but explicit is safer)
      await supabase
        .from('creative_boost_outputs')
        .delete()
        .eq('client_id', clientId)
        .eq('year', year)
        .eq('month', month);

      // Delete client month
      const { error } = await supabase
        .from('creative_boost_client_months')
        .delete()
        .eq('client_id', clientId)
        .eq('year', year)
        .eq('month', month);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative_boost_client_months'] });
      queryClient.invalidateQueries({ queryKey: ['creative_boost_outputs'] });
    },
  });

  const updateClientMonthMutation = useMutation({
    mutationFn: async ({
      id,
      data,
      changes,
    }: {
      id: string;
      data: Partial<CreativeBoostClientMonth>;
      changes: Omit<CreativeBoostSettingsChange, 'id' | 'changedAt'>[];
    }) => {
      const existing = clientMonths.find(cm => cm.id === id);
      if (!existing) throw new Error('Client month not found');

      // Prepare update data
      const updateData: Record<string, unknown> = {};
      if (data.minCredits !== undefined) updateData.min_credits = data.minCredits;
      if (data.maxCredits !== undefined) updateData.max_credits = data.maxCredits;
      if (data.pricePerCredit !== undefined) updateData.price_per_credit = data.pricePerCredit;
      if (data.colleagueId !== undefined) updateData.colleague_id = data.colleagueId || null;
      if (data.status !== undefined) updateData.status = data.status;

      // Update client month
      const { error: updateError } = await supabase
        .from('creative_boost_client_months')
        .update(updateData)
        .eq('id', id);
      if (updateError) throw updateError;

      // Insert history entries
      if (changes.length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated - cannot log settings history');
        
        const userName = user.user_metadata?.full_name || user.email || 'Unknown';

        const historyEntries = changes.map(change => ({
          client_month_id: id,
          client_id: change.clientId,
          year: change.year,
          month: change.month,
          change_type: change.changeType,
          field_name: change.fieldName,
          old_value: String(change.oldValue),
          new_value: String(change.newValue),
          changed_by: user.id,
          changed_by_name: userName,
        }));

        const { error: historyError } = await supabase
          .from('creative_boost_settings_history')
          .insert(historyEntries);
        if (historyError) throw historyError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative_boost_client_months'] });
      queryClient.invalidateQueries({ queryKey: ['creative_boost_settings_history'] });
    },
  });

  const updateClientOutputMutation = useMutation({
    mutationFn: async ({
      clientId,
      outputTypeId,
      year,
      month,
      data,
    }: {
      clientId: string;
      outputTypeId: string;
      year: number;
      month: number;
      data: Partial<ClientMonthOutput>;
    }) => {
      // Check if output exists
      const existing = outputs.find(
        o => o.clientId === clientId && o.outputTypeId === outputTypeId && o.year === year && o.month === month
      );
      
      const nextNormalCount = data.normalCount ?? existing?.normalCount ?? 0;
      const nextExpressCount = data.expressCount ?? existing?.expressCount ?? 0;
      const totalCount = nextNormalCount + nextExpressCount;
        
      if (existing) {
        // Always update existing rows (including zero counts).
        // This avoids requiring DELETE permission when user sets values to 0.
        const updateData: Record<string, unknown> = {};
        if (data.normalCount !== undefined) updateData.normal_count = data.normalCount;
        if (data.expressCount !== undefined) updateData.express_count = data.expressCount;

        // If output is now zero, clear colleague assignment to keep data consistent.
        if (totalCount === 0) {
          updateData.colleague_id = null;
        } else if (data.colleagueId !== undefined) {
          updateData.colleague_id = data.colleagueId || null;
        }

        const { error } = await supabase.from('creative_boost_outputs').update(updateData).eq('id', existing.id);
        if (error) throw error;
      } else if (totalCount > 0) {
        // Create new - need to get client_month_id for the FK relationship
        const { data: clientMonthData } = await supabase
          .from('creative_boost_client_months')
          .select('id')
          .eq('client_id', clientId)
          .eq('year', year)
          .eq('month', month)
          .single();
        
        const { error } = await supabase.from('creative_boost_outputs').insert({
          client_id: clientId,
          client_month_id: clientMonthData?.id || null,
          output_type_id: outputTypeId,
            year,
            month,
          normal_count: data.normalCount ?? 0,
          express_count: data.expressCount ?? 0,
          colleague_id: data.colleagueId || null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['creative_boost_outputs'] }),
  });

  // Helper functions
  const getClientsForMonth = useCallback(
    (year: number, month: number) => {
      return clientMonths.filter(cm => cm.year === year && cm.month === month).map(cm => cm.clientId);
    },
    [clientMonths]
  );

  const getAvailableClientsForMonth = useCallback(
    (year: number, month: number) => {
      const existingClientIds = getClientsForMonth(year, month);
      // Get clients with active Creative Boost engagement services
      const cbClients = engagements
        .filter(e => e.status === 'active')
        .map(e => e.client_id)
        .filter((id, index, self) => self.indexOf(id) === index)
        .map(clientId => getClientById(clientId))
        .filter((c): c is NonNullable<typeof c> => c !== undefined && !existingClientIds.includes(c.id));

      return cbClients.map(c => ({
        clientId: c.id,
        isActive: true,
        defaultMinCredits: 30,
        defaultMaxCredits: 50,
        defaultPricePerCredit: 1500,
      }));
    },
    [engagements, getClientById, getClientsForMonth]
  );

  const getClientMonthByClientId = useCallback(
    (clientId: string, year: number, month: number) => {
      return clientMonths.find(cm => cm.clientId === clientId && cm.year === year && cm.month === month);
    },
    [clientMonths]
  );

  const getClientOutputs = useCallback(
    (clientId: string, year: number, month: number) => {
      return outputs.filter(o => o.clientId === clientId && o.year === year && o.month === month);
    },
    [outputs]
  );

  // Credit calculations (pure functions)
  const calculateOutputCredits = useCallback(
    (outputTypeId: string, normalCount: number, expressCount: number) => {
    const outputType = outputTypes.find(t => t.id === outputTypeId);
    const baseCredits = outputType?.baseCredits ?? 0;
    
    const normalCredits = normalCount * baseCredits;
    const expressCredits = expressCount * baseCredits * 1.5;
    const totalCredits = normalCredits + expressCredits;

    return { normalCredits, expressCredits, totalCredits };
    },
    [outputTypes]
  );

  const getClientMonthSummaries = useCallback(
    (year: number, month: number): ClientMonthSummary[] => {
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
    },
    [clientMonths, getClientById, getClientOutputs, calculateOutputCredits]
  );

  const getColleagueCredits = useCallback(
    (colleagueId: string, year: number, month: number) => {
    return outputs
      .filter(o => o.colleagueId === colleagueId && o.year === year && o.month === month)
      .reduce((sum, output) => {
        const credits = calculateOutputCredits(output.outputTypeId, output.normalCount, output.expressCount);
        return sum + credits.totalCredits;
      }, 0);
    },
    [outputs, calculateOutputCredits]
  );

  const getColleagueCreditsYear = useCallback(
    (colleagueId: string, year: number) => {
    return outputs
      .filter(o => o.colleagueId === colleagueId && o.year === year)
      .reduce((sum, output) => {
        const credits = calculateOutputCredits(output.outputTypeId, output.normalCount, output.expressCount);
        return sum + credits.totalCredits;
      }, 0);
    },
    [outputs, calculateOutputCredits]
  );

  const getColleagueCreditsDetail = useCallback(
    (colleagueId: string, year?: number, month?: number): ColleagueCreditDetail[] => {
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
    },
    [outputs, getClientById, outputTypes, calculateOutputCredits]
  );

  const getColleagueCreditsByClient = useCallback((colleagueId: string, year: number, month: number): ColleagueClientRewardSummary[] => {
    // Group outputs by client
    const clientOutputsMap = new Map<string, { outputs: typeof outputs, clientMonth: CreativeBoostClientMonth | undefined }>();
    const dataIssues: string[] = [];

    outputs
      .filter(o => o.colleagueId === colleagueId && o.year === year && o.month === month)
      .forEach(output => {
        if (!clientOutputsMap.has(output.clientId)) {
          const clientMonth = clientMonths.find(
            cm => cm.clientId === output.clientId && cm.year === year && cm.month === month
          );
          clientOutputsMap.set(output.clientId, { outputs: [], clientMonth });
        }
        clientOutputsMap.get(output.clientId)!.outputs.push(output);
      });

    const results: ColleagueClientRewardSummary[] = [];

    clientOutputsMap.forEach(({ outputs: clientOutputs, clientMonth }, clientId) => {
      const clientData = getClientById(clientId);
      if (!clientData) return;

      let totalCredits = 0;
      let bannerCredits = 0;
      let videoCredits = 0;
      clientOutputs.forEach(output => {
        const credits = calculateOutputCredits(output.outputTypeId, output.normalCount, output.expressCount);
        const outputType = outputTypes.find((item) => item.id === output.outputTypeId);
        if (!outputType) {
          dataIssues.push(`Creative Boost output type ${output.outputTypeId} was not found.`);
          return;
        }
        if (BANNER_OUTPUT_CATEGORIES.includes(outputType.category)) {
          bannerCredits += credits.totalCredits;
        } else if (VIDEO_OUTPUT_CATEGORIES.includes(outputType.category)) {
          videoCredits += credits.totalCredits;
        } else {
          dataIssues.push(`Unsupported Creative Boost output category "${outputType.category}".`);
          return;
        }
        totalCredits += credits.totalCredits;
      });

      let engagementId: string | null = null;
      let engagementName = '';
      let rewardPerCredit = 80;
      let bannerRewardPerCredit = DEFAULT_REWARD_PER_CREDIT;
      let videoRewardPerCredit = DEFAULT_REWARD_PER_CREDIT;

      if (clientMonth?.engagementServiceId) {
        const engService = engagementServices.find(es => es.id === clientMonth.engagementServiceId);
        if (!engService) {
          dataIssues.push(`Creative Boost engagement service ${clientMonth.engagementServiceId} was not found.`);
          return;
        }
        engagementId = engService.engagement_id;
        const engagement = engagements.find(e => e.id === engService.engagement_id);
        engagementName = engagement?.name ?? '';

        if (engService.creative_boost_reward_per_credit_banner === null || engService.creative_boost_reward_per_credit_video === null) {
          dataIssues.push(`Creative Boost rewards are not configured on service ${engService.id}.`);
          return;
        }
        bannerRewardPerCredit = engService.creative_boost_reward_per_credit_banner;
        videoRewardPerCredit = engService.creative_boost_reward_per_credit_video;
        rewardPerCredit = bannerRewardPerCredit;
      } else if (clientMonth?.engagementId) {
        engagementId = clientMonth.engagementId;
        const engagement = engagements.find(e => e.id === clientMonth.engagementId);
        engagementName = engagement?.name ?? '';

        const creativeBoostService = engagementServices.find((service) => (
          service.engagement_id === clientMonth.engagementId &&
          service.is_active &&
          service.creative_boost_price_per_credit !== null
        ));
        if (!creativeBoostService) {
          dataIssues.push(`Creative Boost service for engagement ${clientMonth.engagementId} was not found.`);
          return;
        }
        if (creativeBoostService.creative_boost_reward_per_credit_banner === null || creativeBoostService.creative_boost_reward_per_credit_video === null) {
          dataIssues.push(`Creative Boost rewards are not configured on service ${creativeBoostService.id}.`);
          return;
        }
        bannerRewardPerCredit = creativeBoostService.creative_boost_reward_per_credit_banner;
        videoRewardPerCredit = creativeBoostService.creative_boost_reward_per_credit_video;
        rewardPerCredit = bannerRewardPerCredit;
      }
      const totalReward = bannerCredits * bannerRewardPerCredit + videoCredits * videoRewardPerCredit;

      results.push({
        clientId,
        clientName: clientData.name,
        brandName: clientData.brand_name ?? clientData.name,
        engagementId,
        engagementName,
        totalCredits,
        bannerCredits,
        videoCredits,
        rewardPerCredit,
        bannerRewardPerCredit,
        videoRewardPerCredit,
        totalReward,
      });
    });

    if (dataIssues.length > 0) {
      console.error('Creative Boost data issues detected while calculating colleague rewards:', dataIssues);
    }

    return results.sort((a, b) => b.totalReward - a.totalReward);
  }, [outputs, clientMonths, engagementServices, engagements, getClientById, calculateOutputCredits, outputTypes]);

  const getClientMonthByEngagementServiceId = useCallback(
    (engagementServiceId: string, year: number, month: number) => {
    return clientMonths.find(
      cm => cm.engagementServiceId === engagementServiceId && cm.year === year && cm.month === month
    );
    },
    [clientMonths]
  );

  const getClientMonthSummaryByEngagementServiceId = useCallback(
    (engagementServiceId: string, year: number, month: number): ClientMonthSummary | undefined => {
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
    },
    [clientMonths, outputs, getClientById, calculateOutputCredits]
  );

  const getSettingsHistory = useCallback(
    (clientId: string, year?: number, month?: number): CreativeBoostSettingsChange[] => {
    return settingsHistory
      .filter(h => {
        if (h.clientId !== clientId) return false;
        if (year !== undefined && h.year !== year) return false;
        if (month !== undefined && h.month !== month) return false;
        return true;
      })
      .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
    },
    [settingsHistory]
  );

  const getOutputTypeById = useCallback(
    (id: string) => {
      return outputTypes.find(t => t.id === id);
    },
    [outputTypes]
  );

  const getActiveOutputTypes = useCallback(() => {
    return outputTypes.filter(t => t.isActive);
  }, [outputTypes]);

  // Auto-sync: Ensure CreativeBoostClientMonth records exist for all active engagements with CB service
  // Find Creative Boost service by name pattern
  const cbServiceId = useMemo(() => {
    const cbService = services.find(s => 
      s.name.toLowerCase().includes('creative boost') || 
      s.name.toLowerCase().includes('cb')
    );
    return cbService?.id;
  }, [services]);
  
  const ensureClientMonthsForActiveEngagements = useCallback(
    async (year: number, month: number) => {
      if (!cbServiceId) return; // No Creative Boost service found
      
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);

      const promises: Promise<void>[] = [];
    
    engagements.forEach(engagement => {
      if (engagement.status !== 'active') return;
      
      const startDate = new Date(engagement.start_date);
      const endDate = engagement.end_date ? new Date(engagement.end_date) : null;
      
      if (startDate > monthEnd) return;
      if (endDate && endDate < monthStart) return;
      
      const cbService = engagementServices.find(
          es => es.engagement_id === engagement.id && es.service_id === cbServiceId
      );
      
      if (!cbService) return;
      
      const existingMonth = clientMonths.find(
        cm => cm.engagementServiceId === cbService.id && cm.year === year && cm.month === month
      );
      
      if (existingMonth) return;
      
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const previousMonth = clientMonths.find(
        cm => cm.engagementServiceId === cbService.id && cm.year === prevYear && cm.month === prevMonth
      );
      
        const promise = addClientToMonthMutation.mutateAsync({
        clientId: engagement.client_id,
        year,
        month,
          settings: {
        minCredits: previousMonth?.minCredits ?? cbService.creative_boost_min_credits ?? 0,
        maxCredits: previousMonth?.maxCredits ?? cbService.creative_boost_max_credits ?? 50,
        pricePerCredit: previousMonth?.pricePerCredit ?? cbService.creative_boost_price_per_credit ?? 1500,
        colleagueId: previousMonth?.colleagueId ?? '',
        status: 'active',
        engagementServiceId: cbService.id,
        engagementId: engagement.id,
          },
        });

        promises.push(promise);
      });

      await Promise.all(promises);
    },
    [engagements, engagementServices, clientMonths, addClientToMonthMutation, cbServiceId]
  );

  // Wrapper functions for mutations
  const addOutputType = async (data: Omit<OutputType, 'id' | 'createdAt' | 'updatedAt'>): Promise<OutputType> => {
    return addOutputTypeMutation.mutateAsync(data);
  };

  const updateOutputType = async (id: string, data: Partial<OutputType>): Promise<void> => {
    await updateOutputTypeMutation.mutateAsync({ id, data });
  };

  const addClientToMonth = async (
    clientId: string,
    year: number,
    month: number,
    settings?: Partial<CreativeBoostClientMonth>
  ): Promise<CreativeBoostClientMonth> => {
    return addClientToMonthMutation.mutateAsync({ clientId, year, month, settings });
  };

  const removeClientFromMonth = async (clientId: string, year: number, month: number): Promise<void> => {
    await removeClientFromMonthMutation.mutateAsync({ clientId, year, month });
  };

  const updateClientMonth = async (id: string, data: Partial<CreativeBoostClientMonth>): Promise<void> => {
    const existing = clientMonths.find(cm => cm.id === id);
    if (!existing) throw new Error('Client month not found');

    const changes: Omit<CreativeBoostSettingsChange, 'id' | 'changedAt'>[] = [];

    if (data.maxCredits !== undefined && data.maxCredits !== existing.maxCredits) {
      changes.push({
        clientMonthId: id,
        clientId: existing.clientId,
        year: existing.year,
        month: existing.month,
        changeType: 'max_credits',
        fieldName: 'Max. kreditů',
        oldValue: existing.maxCredits,
        newValue: data.maxCredits,
        changedBy: user?.id || '',
        changedByName: user?.email || 'Neznámý',
      });
    }

    if (data.pricePerCredit !== undefined && data.pricePerCredit !== existing.pricePerCredit) {
      changes.push({
        clientMonthId: id,
        clientId: existing.clientId,
        year: existing.year,
        month: existing.month,
        changeType: 'price_per_credit',
        fieldName: 'Cena za kredit',
        oldValue: existing.pricePerCredit,
        newValue: data.pricePerCredit,
        changedBy: user?.id || '',
        changedByName: user?.email || 'Neznámý',
      });
    }

    if (data.status !== undefined && data.status !== existing.status) {
      const statusLabels: Record<string, string> = {
        active: 'Aktivní',
        inactive: 'Neaktivní',
      };
      changes.push({
        clientMonthId: id,
        clientId: existing.clientId,
        year: existing.year,
        month: existing.month,
        changeType: 'status',
        fieldName: 'Status',
        oldValue: statusLabels[existing.status] || existing.status,
        newValue: statusLabels[data.status] || data.status,
        changedBy: user?.id || '',
        changedByName: user?.email || 'Neznámý',
      });
    }

    if (data.colleagueId !== undefined && data.colleagueId !== existing.colleagueId) {
      const oldColleague = colleagues.find(c => c.id === existing.colleagueId);
      const newColleague = colleagues.find(c => c.id === data.colleagueId);
      changes.push({
        clientMonthId: id,
        clientId: existing.clientId,
        year: existing.year,
        month: existing.month,
        changeType: 'colleague',
        fieldName: 'Přiřazený kolega',
        oldValue: oldColleague?.full_name || '',
        newValue: newColleague?.full_name || '',
        changedBy: user?.id || '',
        changedByName: user?.email || 'Neznámý',
      });
    }

    await updateClientMonthMutation.mutateAsync({ id, data, changes });
  };

  const updateClientOutput = async (
    clientId: string,
    outputTypeId: string,
    year: number,
    month: number,
    data: Partial<ClientMonthOutput>
  ): Promise<void> => {
    await updateClientOutputMutation.mutateAsync({ clientId, outputTypeId, year, month, data });
  };

  return (
    <CreativeBoostContext.Provider
      value={{
      outputTypes,
      clientMonths,
      outputs,
      settingsHistory,
      isLoading,
      addOutputType,
      updateOutputType,
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
      getColleagueCreditsByClient,
      getClientMonthByEngagementServiceId,
      getClientMonthSummaryByEngagementServiceId,
      getSettingsHistory,
      ensureClientMonthsForActiveEngagements,
      getOutputTypeById,
      getActiveOutputTypes,
      }}
    >
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
