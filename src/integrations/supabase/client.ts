import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// In-memory promise-based mutex to serialize token refresh calls within the same tab.
// This replaces the noOpLock that was allowing concurrent refresh attempts, which caused
// race conditions: the first refresh invalidates the old token, then the second sends
// the now-invalid token, causing Supabase to revoke the entire session.
const locks = new Map<string, Promise<unknown>>();

const inMemoryLock = async <R>(
  name: string,
  acquireTimeout: number,
  fn: () => Promise<R>
): Promise<R> => {
  const existing = locks.get(name) ?? Promise.resolve();

  let resolve: () => void;
  const next = new Promise<void>((r) => { resolve = r; });
  locks.set(name, next);

  try {
    // Wait for the previous holder to finish before running fn
    await existing;
    return await fn();
  } finally {
    resolve!();
    // Clean up if we're still the latest entry
    if (locks.get(name) === next) {
      locks.delete(name);
    }
  }
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    lock: inMemoryLock, // In-memory mutex to serialize token refreshes within the same tab
  }
});