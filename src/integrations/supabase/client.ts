import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const requestUrl = typeof input === 'string' ? input : input.toString();
  const isAuthRequest = requestUrl.includes('/auth/v1/');
  const timeoutMs = isAuthRequest ? 30000 : 15000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const originalSignal = init?.signal;

  if (originalSignal) {
    if (originalSignal.aborted) {
      controller.abort();
    } else {
      originalSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

const SUPABASE_CLIENT_KEY = '__socials_supabase_client__';
type SupabaseClientSingleton = ReturnType<typeof createClient<Database>>;
type SupabaseGlobal = typeof globalThis & {
  [SUPABASE_CLIENT_KEY]?: SupabaseClientSingleton;
};

const supabaseGlobal = globalThis as SupabaseGlobal;

if (!supabaseGlobal[SUPABASE_CLIENT_KEY]) {
  supabaseGlobal[SUPABASE_CLIENT_KEY] = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      fetch: fetchWithTimeout,
    },
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    }
  });
}

export const supabase = supabaseGlobal[SUPABASE_CLIENT_KEY]!;