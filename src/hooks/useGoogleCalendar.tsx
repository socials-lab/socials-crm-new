import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/components/ui/sonner';
import { useQueryClient } from '@tanstack/react-query';

export function useGoogleCalendar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkConnection = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { data } = await supabase
        .from('calendar_tokens')
        .select('expires_at')
        .eq('user_id', user.id)
        .single();

      if (data) {
        const expiresAt = new Date(data.expires_at);
        setIsConnected(expiresAt > new Date());
      } else {
        setIsConnected(false);
      }
    } catch {
      setIsConnected(false);
    }
  }, [user?.id]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Handle OAuth callback - call this from AuthCallback page when Google OAuth code is detected
  const handleOAuthCallback = async (code: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      
      const { data, error } = await supabase.functions.invoke('calendar-oauth-callback', {
        body: { code, redirect_uri: redirectUri },
      });
      
      if (error) throw error;
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      setIsConnected(true);
      toast.success('Google kalendář byl úspěšně propojen');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Chyba při propojování kalendáře';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const connectGoogleCalendar = () => {
    // Store state to identify Google OAuth callback
    sessionStorage.setItem('oauth_type', 'google_calendar');
    
    // Redirect to Google OAuth
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!GOOGLE_CLIENT_ID) {
      toast.error('Google OAuth není nakonfigurováno');
      return;
    }
    
    const redirectUri = `${window.location.origin}/auth/callback`;
    const scope = 'https://www.googleapis.com/auth/calendar';
    const responseType = 'code';
    const accessType = 'offline';
    const prompt = 'consent';

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${encodeURIComponent(scope)}&access_type=${accessType}&prompt=${prompt}`;
    
    window.location.href = authUrl;
  };

  const createCalendarEvent = async (meetingId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('calendar-create-event', {
        body: { meeting_id: meetingId },
      });
      
      if (error) throw error;
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      toast.success('Pozvánky byly odeslány do Google kalendáře');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Chyba při vytváření události';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    connectGoogleCalendar, 
    handleOAuthCallback,
    createCalendarEvent, 
    checkConnection,
    isConnected, 
    isLoading, 
    error 
  };
}
