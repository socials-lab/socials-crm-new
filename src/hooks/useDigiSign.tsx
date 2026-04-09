import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useQueryClient } from '@tanstack/react-query';
import { invokeWithTimeout } from '@/lib/supabaseUtils';

export function useDigiSign() {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createContract = async (
    leadId: string,
    templateId?: string,
    googleDocsUrl?: string,
    previewOnly?: boolean,
    forceNewDraft?: boolean,
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        throw new Error('Nejste přihlášeni. Obnovte prosím stránku a přihlaste se znovu.');
      }

      const payload = {
        lead_id: leadId,
        template_id: templateId,
        google_docs_url: googleDocsUrl || null,
        preview_only: previewOnly === true,
        force_new_draft: forceNewDraft === true,
      };

      const { data, error } = await invokeWithTimeout<{ error?: string; success?: boolean; digisign_id?: string; google_doc_url?: string }>(
        'digisign-create-contract',
        {
          body: payload,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        },
        90000
      );

      let effectiveData = data;
      let effectiveError = error;

      // Supabase client sometimes surfaces a generic network invoke error even when
      // the edge endpoint is reachable. Retry once via direct fetch for better reliability.
      if (effectiveError?.message?.includes('Failed to send a request to the Edge Function')) {
        try {
          const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/digisign-create-contract`;
          const response = await fetch(fnUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify(payload),
          });

          const text = await response.text();
          const parsed = text ? JSON.parse(text) : null;

          if (!response.ok) {
            throw new Error(parsed?.error || `Edge function error (${response.status})`);
          }

          effectiveData = parsed;
          effectiveError = null;
        } catch (directFetchError) {
          // Keep original invoke error if fallback fails too.
          console.error('Direct edge fallback failed:', directFetchError);
        }
      }

      // Check for error in response data first (Edge Function error messages)
      if (effectiveData?.error) {
        throw new Error(effectiveData.error);
      }

      // Then check for Supabase client error (non-2xx status codes)
      if (effectiveError) {
        throw new Error(effectiveError.message || 'Chyba při volání DigiSign API');
      }

      // Invalidate leads cache to refresh with new contract data
      queryClient.invalidateQueries({ queryKey: ['leads'] });

      if (previewOnly) {
        toast.success('Smlouva byla připravena v Google Docs');
      } else {
        toast.success('Smlouva byla vytvořena v DigiSign');
      }
      return effectiveData;
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

  const checkDigiSignStatus = async (leadId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: result, error } = await invokeWithTimeout<{
        success: boolean;
        envelope_status: string;
        is_completed: boolean;
        signed_contract_url: string | null;
        envelope_detail_url: string;
        recipients: { name: string; email: string; signedAt: string | null }[];
        propagated_to_engagement: string | null;
      }>(
        'digisign-check-status',
        {
          body: { lead_id: leadId },
          // This check is safe to run with anon fallback if user JWT is stale.
          authMode: 'optional',
        },
        45000
      );

      if (error) {
        throw error;
      }

      if (!result) {
        throw new Error('DigiSign status check nevrátil data');
      }

      queryClient.invalidateQueries({ queryKey: ['leads'] });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Chyba při kontrole DigiSign';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { createContract, getContractStatus, checkDigiSignStatus, isLoading, error };
}
