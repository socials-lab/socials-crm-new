import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ImpersonatedProfile {
  id: string;
  fullName: string | null;
  email: string | null;
}

interface ImpersonationContextType {
  effectiveUserId: string | null;
  impersonatorUserId: string | null;
  impersonatedUserId: string | null;
  impersonatedProfile: ImpersonatedProfile | null;
  isImpersonating: boolean;
  isImpersonationLoading: boolean;
  startImpersonation: (targetUserId: string) => Promise<void>;
  stopImpersonation: () => void;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

async function loadProfile(userId: string): Promise<ImpersonatedProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    fullName: data.full_name,
    email: data.email,
  };
}

function parseImpersonatedProfile(value: unknown): ImpersonatedProfile | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const id = typeof row.id === 'string' ? row.id : null;
  if (!id) return null;
  return {
    id,
    fullName: typeof row.full_name === 'string' ? row.full_name : null,
    email: typeof row.email === 'string' ? row.email : null,
  };
}

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [impersonatorUserId, setImpersonatorUserId] = useState<string | null>(null);
  const [impersonatedUserId, setImpersonatedUserId] = useState<string | null>(null);
  const [impersonatedProfile, setImpersonatedProfile] = useState<ImpersonatedProfile | null>(null);
  const [isImpersonationLoading, setIsImpersonationLoading] = useState(false);

  const stopImpersonation = useCallback(() => {
    setImpersonatorUserId(null);
    setImpersonatedUserId(null);
    setImpersonatedProfile(null);
  }, []);

  const syncImpersonationStatus = useCallback(async () => {
    if (!user?.id) {
      stopImpersonation();
      return;
    }

    const { data, error } = await supabase.functions.invoke('impersonation-session', {
      body: { action: 'status' },
    });
    if (error) {
      const status = (error as { context?: { status?: number } })?.context?.status;
      if (status === 401) {
        // Keep UX stable when token/session is in a transient invalid state.
        stopImpersonation();
        return;
      }
      throw error;
    }
    if (data?.error) throw new Error(data.error);

    const targetUserId = typeof data?.impersonated_user_id === 'string' ? data.impersonated_user_id : null;
    if (!targetUserId) {
      stopImpersonation();
      return;
    }

    setImpersonatorUserId(user.id);
    setImpersonatedUserId(targetUserId);
    const profileFromServer = parseImpersonatedProfile(data?.impersonated_profile);
    if (profileFromServer) {
      setImpersonatedProfile(profileFromServer);
      return;
    }

    const fallbackProfile = await loadProfile(targetUserId);
    setImpersonatedProfile(fallbackProfile);
  }, [stopImpersonation, user?.id]);

  useEffect(() => {
    if (!user?.id) {
      stopImpersonation();
      return;
    }

    setIsImpersonationLoading(true);
    void syncImpersonationStatus()
      .catch((error) => {
        console.error('Failed to sync impersonation status:', error);
        stopImpersonation();
      })
      .finally(() => {
        setIsImpersonationLoading(false);
      });
  }, [stopImpersonation, syncImpersonationStatus, user?.id]);

  const startImpersonation = useCallback(async (targetUserId: string) => {
    if (!user?.id) {
      throw new Error('Cannot impersonate without an authenticated user.');
    }

    if (targetUserId === user.id) {
      throw new Error('Cannot impersonate your own user.');
    }

    setIsImpersonationLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('impersonation-session', {
        body: {
          action: 'start',
          target_user_id: targetUserId,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      await syncImpersonationStatus();
      toast.success('Impersonation started.');
    } finally {
      setIsImpersonationLoading(false);
    }
  }, [syncImpersonationStatus, user?.id]);

  const stopImpersonationRemote = useCallback(async () => {
    if (!impersonatedUserId) {
      stopImpersonation();
      return;
    }

    setIsImpersonationLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('impersonation-session', {
        body: { action: 'stop' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      await syncImpersonationStatus();
      toast.success('Impersonation stopped.');
    } finally {
      setIsImpersonationLoading(false);
    }
  }, [impersonatedUserId, stopImpersonation, syncImpersonationStatus]);

  const effectiveUserId = impersonatedUserId ?? user?.id ?? null;

  const value = useMemo<ImpersonationContextType>(
    () => ({
      effectiveUserId,
      impersonatorUserId,
      impersonatedUserId,
      impersonatedProfile,
      isImpersonating: !!impersonatedUserId,
      isImpersonationLoading,
      startImpersonation,
      stopImpersonation: stopImpersonationRemote,
    }),
    [
      effectiveUserId,
      impersonatorUserId,
      impersonatedUserId,
      impersonatedProfile,
      isImpersonationLoading,
      startImpersonation,
      stopImpersonationRemote,
    ],
  );

  return <ImpersonationContext.Provider value={value}>{children}</ImpersonationContext.Provider>;
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext);
  if (!context) {
    throw new Error('useImpersonation must be used within an ImpersonationProvider');
  }
  return context;
}
