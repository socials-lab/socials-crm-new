import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/components/ui/sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { invokeWithTimeout } from '@/lib/supabaseUtils';

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  htmlLink?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  organizer?: {
    email: string;
    displayName?: string;
  };
  status?: string;
  created?: string;
  updated?: string;
}

export function useGoogleCalendar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hasGmailScope, setHasGmailScope] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);

  const checkConnection = useCallback(async () => {
    if (!user?.id) {
      setIsCheckingConnection(false);
      return;
    }
    
    setIsCheckingConnection(true);
    try {
      const { data, error } = await supabase
        .from('calendar_tokens')
        .select('expires_at, scopes, refresh_token')
        .eq('user_id', user.id)
        .single();

      if (data) {
        // User is considered "connected" if they have a refresh_token
        // (access_token expires after ~1 hour, but can be refreshed by Edge Functions)
        const hasRefreshToken = !!data.refresh_token;
        setIsConnected(hasRefreshToken);
        
        // Check if user has Gmail send scope
        const hasGmail = data.scopes && Array.isArray(data.scopes) && 
          data.scopes.includes('https://www.googleapis.com/auth/gmail.send');
        setHasGmailScope(hasGmail && hasRefreshToken);
      } else {
        setIsConnected(false);
        setHasGmailScope(false);
      }
    } catch {
      setIsConnected(false);
      setHasGmailScope(false);
    } finally {
      setIsCheckingConnection(false);
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
      toast.success('Google účet byl úspěšně propojen (kalendář a email)');
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
    const scope = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.send';
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

  const sendEmail = async (to: string, subject: string, html: string, bcc?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await invokeWithTimeout('gmail-send-email', {
        body: { to, subject, html, bcc },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Chyba při odesílání emailu';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch calendar events
  const fetchCalendarEvents = useCallback(async (options?: {
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
  }): Promise<GoogleCalendarEvent[]> => {
    try {
      // Check current session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session ? 'exists' : 'null', session?.user?.email);

      if (!session) {
        console.error('No active session');
        toast.error('Nejste přihlášeni');
        return [];
      }

      // Convert to snake_case for the edge function
      const body = options ? {
        time_min: options.timeMin,
        time_max: options.timeMax,
        max_results: options.maxResults,
      } : {};

      console.log('Fetching calendar events with options:', body);

      const { data, error } = await supabase.functions.invoke('calendar-fetch-events', {
        body,
      });

      console.log('Calendar fetch response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        toast.error('Chyba při načítání kalendáře: ' + error.message);
        return [];
      }

      if (data?.error) {
        console.error('Calendar fetch error:', data.error);
        toast.error('Chyba z Google Calendar: ' + data.error);
        return [];
      }

      console.log('Fetched events count:', data?.events?.length || 0);
      return data?.events || [];
    } catch (err) {
      console.error('Failed to fetch calendar events:', err);
      toast.error('Nepodařilo se načíst kalendář');
      return [];
    }
  }, []);

  return {
    connectGoogleCalendar,
    handleOAuthCallback,
    createCalendarEvent,
    sendEmail,
    fetchCalendarEvents,
    checkConnection,
    isConnected,
    hasGmailScope,
    isCheckingConnection,
    isLoading,
    error
  };
}
