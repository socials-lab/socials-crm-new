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
      console.log('Creating contract for lead:', leadId);
      const { data, error } = await supabase.functions.invoke('digisign-create-contract', {
        body: { lead_id: leadId, template_id: templateId },
      });
      
      console.log('Edge Function response:', { data, error });
      
      // Check for error in response data first (Edge Function error messages)
      if (data?.error) {
        throw new Error(data.error);
      }
      
      // Then check for Supabase client error
      if (error) {
        // Extract detailed error info
        const context = (error as any).context;
        
        // If context is a Response, try to read the body
        if (context instanceof Response) {
          try {
            const responseBody = await context.json();
            console.error('Edge Function error response:', responseBody);
            if (responseBody?.error) {
              throw new Error(responseBody.error);
            }
          } catch (parseError) {
            // Try to read as text if JSON parsing fails
            try {
              const textBody = await context.text();
              console.error('Edge Function error response (text):', textBody);
              if (textBody) {
                throw new Error(textBody);
              }
            } catch {
              // Ignore if we can't read the body
            }
          }
        }
        
        console.error('Supabase function error details:', {
          message: error.message,
          name: error.name,
          status: (error as any).status,
        });
        
        throw new Error(error.message || 'Edge Function error');
      }
      
      // Invalidate leads cache to refresh with new contract data
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      
      toast.success('Smlouva byla vytvořena v DigiSign');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Chyba při vytváření smlouvy';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('DigiSign contract creation error:', err);
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
