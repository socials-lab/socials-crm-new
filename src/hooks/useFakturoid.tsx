import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

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
    setIsCreatingInvoice(true);
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
      const { data, error } = await supabase.functions.invoke('fakturoid-sync-subject', {
        body: { client_id: clientId },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success('Klient byl synchronizován ve Fakturoid');
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
      const { data, error } = await supabase.functions.invoke('fakturoid-get-subject', {
        body: { subject_id: subjectId },
      });

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
      const { data, error } = await supabase.functions.invoke('fakturoid-bidirectional-sync', {
        body: { client_id: clientId, import_missing: importMissing },
      });

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
