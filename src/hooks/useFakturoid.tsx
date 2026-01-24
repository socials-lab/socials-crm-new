import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export function useFakturoid() {
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingSubject, setIsCreatingSubject] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSubjectInFakturoid = async (clientId: string) => {
    setIsCreatingSubject(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('fakturoid-create-subject', {
        body: { client_id: clientId },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success('Klient byl vytvořen ve Fakturoid');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Chyba při vytváření kontaktu';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsCreatingSubject(false);
    }
  };

  const createInvoiceInFakturoid = async (invoiceId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('fakturoid-create-invoice', {
        body: { invoice_id: invoiceId },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success('Faktura byla vytvořena ve Fakturoid');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Chyba při vytváření faktury';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const syncInvoiceStatus = async (invoiceId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would call a separate sync function or directly check Fakturoid API
      // For now, webhooks handle status updates automatically
      toast.info('Status faktury se aktualizuje automaticky přes webhook');
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Chyba při synchronizaci';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createSubjectInFakturoid,
    createInvoiceInFakturoid,
    syncInvoiceStatus,
    isLoading,
    isCreatingSubject,
    error,
  };
}
