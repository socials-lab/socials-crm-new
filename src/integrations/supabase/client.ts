import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// In-memory promise-based mutex to serialize token refresh calls within one tab.
// Browser LockManager (navigator.locks) should be preferred because it also coordinates
// across tabs/windows. This in-memory fallback is used only when LockManager is unavailable.
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
    // Wait for the previous holder to finish before running fn.
    // Respect Supabase's acquire timeout to avoid indefinite waiting.
    if (Number.isFinite(acquireTimeout) && acquireTimeout > 0) {
      await Promise.race([
        existing,
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Lock acquire timeout: ${name}`)), acquireTimeout);
        }),
      ]);
    } else {
      await existing;
    }
    return await fn();
  } finally {
    resolve!();
    // Clean up if we're still the latest entry
    if (locks.get(name) === next) {
      locks.delete(name);
    }
  }
};

// Browser LockManager can deadlock in long-lived dev sessions with multiple tabs/clients.
// Use the local mutex consistently to keep auth calls responsive.
const authLock = inMemoryLock;

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
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

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    fetch: fetchWithTimeout,
  },
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    ...(authLock ? { lock: authLock } : {}),
  }
});