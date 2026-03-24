import { supabase } from '@/integrations/supabase/client';

type Msg = { role: 'user' | 'assistant'; content: string };

export type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

const SUPABASE_URL = 'https://empndmpeyrdycjdesoxr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtcG5kbXBleXJkeWNqZGVzb3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1OTQ5NTUsImV4cCI6MjA4MTE3MDk1NX0.X3I3FU2QRZD16rLwePdC3C2r7UIlGQuvJ6wWZnzgGEQ';

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${session?.access_token || SUPABASE_KEY}`,
  };
}

export async function fetchConversations(): Promise<Conversation[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/assistant_conversations?order=updated_at.desc&limit=50`,
      { headers }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchConversationMessages(conversationId: string): Promise<Msg[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/assistant_messages?conversation_id=eq.${conversationId}&select=role,content&order=created_at.asc`,
      { headers }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function createConversation(title: string): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const headers = await getAuthHeaders();
    const res = await fetch(`${SUPABASE_URL}/rest/v1/assistant_conversations`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify({
        user_id: user.id,
        title: title.slice(0, 60) + (title.length > 60 ? '…' : ''),
      }),
    });
    if (!res.ok) return null;
    const [data] = await res.json();
    return data?.id || null;
  } catch {
    return null;
  }
}

export async function saveMessage(conversationId: string, msg: Msg): Promise<void> {
  try {
    const headers = await getAuthHeaders();
    await fetch(`${SUPABASE_URL}/rest/v1/assistant_messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        conversation_id: conversationId,
        role: msg.role,
        content: msg.content,
      }),
    });
  } catch { /* silent */ }
}

export async function updateConversationTimestamp(id: string): Promise<void> {
  try {
    const headers = await getAuthHeaders();
    await fetch(`${SUPABASE_URL}/rest/v1/assistant_conversations?id=eq.${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ updated_at: new Date().toISOString() }),
    });
  } catch { /* silent */ }
}

export async function deleteConversation(id: string): Promise<boolean> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${SUPABASE_URL}/rest/v1/assistant_conversations?id=eq.${id}`, {
      method: 'DELETE',
      headers,
    });
    return res.ok;
  } catch {
    return false;
  }
}
