import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { invokeWithTimeout } from '@/lib/supabaseUtils';

export interface FakturoidSubjectData {
  id: number;
  name: string;
  registration_no?: string;
  vat_no?: string;
  street?: string;
  city?: string;
  zip?: string;
  country?: string;
  email?: string;
  phone?: string;
  web?: string;
  html_url?: string;
  updated_at?: string;
}

export interface BidirectionalSyncResult {
  success: boolean;
  action: 'no_changes' | 'crm_pushed' | 'imported' | 'both';
  fields_pushed_to_fakturoid?: string[];
  fields_imported_from_fakturoid?: string[];
  message: string;
}

export function useFakturoid() {
  // Separate loading states for each operation
  const queryClient = useQueryClient();
  const [isCreatingSubject, setIsCreatingSubject] = useState(false);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [isSyncingSubject, setIsSyncingSubject] = useState(false);
  const [isFetchingSubject, setIsFetchingSubject] = useState(false);
  const [isBidirectionalSyncing, setIsBidirectionalSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Combined loading state for backwards compatibility
  const isLoading = isCreatingSubject || isCreatingInvoice || isSyncingSubject || isFetchingSubject || isBidirectionalSyncing;

  const createSubjectInFakturoid = async (clientId: string) => {
    setIsCreatingSubject(true);
    setError(null);

    try {
      const { data, error } = await invokeWithTimeout<{ error?: string }>(
        'fakturoid-create-subject',
        { body: { client_id: clientId } },
        30000,
      );

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success('Klient byl vytvořen ve Fakturoid');
      // Refresh clients list immediately so fakturoid_subject_id badge updates without page reload
      queryClient.invalidateQueries({ queryKey: ['clients'] });
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
    setIsCreatingInvoice(true);
    setError(null);

    try {
      const { data, error } = await invokeWithTimeout<{ error?: string }>(
        'fakturoid-create-invoice',
        { body: { invoice_id: invoiceId } },
        30000,
      );

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
      setIsCreatingInvoice(false);
    }
  };

  const syncInvoiceStatus = async (_invoiceId: string) => {
    // This is a no-op - webhooks handle status updates automatically
    toast.info('Status faktury se aktualizuje automaticky přes webhook');
    return null;
  };

  const syncSubjectToFakturoid = async (clientId: string) => {
    setIsSyncingSubject(true);
    setError(null);

    try {
      const { data, error } = await invokeWithTimeout<{ error?: string }>(
        'fakturoid-sync-subject',
        { body: { client_id: clientId } },
        30000,
      );

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success('Klient byl synchronizován ve Fakturoid');
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Chyba při synchronizaci kontaktu';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsSyncingSubject(false);
    }
  };

  const getSubjectFromFakturoid = async (subjectId: number): Promise<FakturoidSubjectData | null> => {
    setIsFetchingSubject(true);
    setError(null);

    try {
      const { data, error } = await invokeWithTimeout<{ error?: string; subject?: FakturoidSubjectData }>(
        'fakturoid-get-subject',
        { body: { subject_id: subjectId } },
        30000,
      );

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      return data.subject as FakturoidSubjectData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Chyba při načítání kontaktu z Fakturoid';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsFetchingSubject(false);
    }
  };

  /**
   * Bidirectional sync between CRM and Fakturoid.
   * CRM WINS on conflicts - CRM data is pushed to Fakturoid.
   * If import_missing is true, empty CRM fields are filled from Fakturoid.
   */
  const bidirectionalSync = async (clientId: string, importMissing = false): Promise<BidirectionalSyncResult | null> => {
    setIsBidirectionalSyncing(true);
    setError(null);

    try {
      const { data, error } = await invokeWithTimeout<{ error?: string }>(
        'fakturoid-bidirectional-sync',
        { body: { client_id: clientId, import_missing: importMissing } },
        30000,
      );

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      const result = data as BidirectionalSyncResult;

      if (result.action === 'no_changes') {
        toast.info(result.message);
      } else {
        toast.success(result.message);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Chyba při bidirektální synchronizaci';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsBidirectionalSyncing(false);
    }
  };

  return {
    createSubjectInFakturoid,
    createInvoiceInFakturoid,
    syncInvoiceStatus,
    syncSubjectToFakturoid,
    getSubjectFromFakturoid,
    bidirectionalSync,
    // Individual loading states for each operation
    isCreatingSubject,
    isCreatingInvoice,
    isSyncingSubject,
    isFetchingSubject,
    isBidirectionalSyncing,
    // Combined loading state (any operation in progress)
    isLoading,
    error,
  };
}
