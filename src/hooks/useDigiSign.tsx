import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useQueryClient } from '@tanstack/react-query';

export function useDigiSign() {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createContract = async (leadId: string, templateId?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('digisign-create-contract', {
        body: { lead_id: leadId, template_id: templateId },
      });
      
      if (error) throw error;
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      // Invalidate leads cache to refresh with new contract data
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      
      toast.success('Smlouva byla vytvořena v DigiSign');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Chyba při vytváření smlouvy';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getContractStatus = async (leadId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch lead to get contract status
      const { data, error } = await supabase
        .from('leads')
        .select('digisign_id, contract_url, contract_signed_at')
        .eq('id', leadId)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Chyba při načítání stavu smlouvy';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { createContract, getContractStatus, isLoading, error };
}
