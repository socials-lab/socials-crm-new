import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { EngagementHistoryRecord } from '@/types/crm';

export function useEngagementHistory(engagementId: string | null) {
  return useQuery({
    queryKey: ['engagement-history', engagementId],
    queryFn: async () => {
      if (!engagementId) return [];
      
      // Using raw SQL query since the table might not be in types yet
      const { data, error } = await supabase
        .rpc('get_engagement_history' as never, { p_engagement_id: engagementId } as never)
        .returns<EngagementHistoryRecord[]>();
      
      if (error) {
        // Fallback to direct query if function doesn't exist
        const { data: directData, error: directError } = await supabase
          .from('engagement_history' as never)
          .select('*')
          .eq('engagement_id', engagementId)
          .order('changed_at', { ascending: false }) as unknown as { data: EngagementHistoryRecord[] | null; error: Error | null };
        
        if (directError) {
          console.error('Error fetching engagement history:', directError);
          return [];
        }
        
        return directData || [];
      }
      
      return data || [];
    },
    enabled: !!engagementId,
  });
}

// Helper to get human-readable field labels
export function getFieldLabel(fieldName: string): string {
  const labels: Record<string, string> = {
    cost_model: 'Model odměny',
    monthly_cost: 'Měsíční náklady',
    hourly_cost: 'Hodinová sazba',
    percentage_of_revenue: 'Procento z obratu',
    role_on_engagement: 'Role na zakázce',
    end_date: 'Datum ukončení',
    price: 'Cena',
    name: 'Název',
    is_active: 'Aktivní',
    selected_tier: 'Tier',
    billing_type: 'Typ fakturace',
    creative_boost_min_credits: 'Minimální kredity',
    creative_boost_max_credits: 'Maximální kredity',
    creative_boost_price_per_credit: 'Cena za kredit',
  };
  return labels[fieldName] || fieldName;
}

// Helper to format values for display
export function formatHistoryValue(fieldName: string, value: string | null): string {
  if (value === null || value === '') return '(prázdné)';
  
  if (fieldName === 'cost_model') {
    const models: Record<string, string> = {
      hourly: 'Hodinová',
      fixed_monthly: 'Měsíční fixní',
      percentage: 'Procento z obratu',
    };
    return models[value] || value;
  }
  
  if (fieldName === 'is_active') {
    return value === 'true' ? 'Aktivní' : 'Neaktivní';
  }
  
  if (['monthly_cost', 'hourly_cost', 'price', 'creative_boost_price_per_credit'].includes(fieldName)) {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      return `${num.toLocaleString('cs-CZ')} Kč`;
    }
  }
  
  if (fieldName === 'percentage_of_revenue') {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      return `${num}%`;
    }
  }
  
  if (fieldName === 'selected_tier') {
    const tiers: Record<string, string> = {
      growth: 'Growth',
      pro: 'Pro',
      elite: 'Elite',
    };
    return tiers[value] || value;
  }
  
  if (fieldName === 'billing_type') {
    const types: Record<string, string> = {
      monthly: 'Měsíčně',
      one_off: 'Jednorázově',
    };
    return types[value] || value;
  }
  
  return value;
}
