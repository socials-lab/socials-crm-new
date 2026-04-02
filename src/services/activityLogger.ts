import { supabase } from '@/integrations/supabase/client';
import type { PostgrestError } from '@supabase/supabase-js';

export function logActivity(
  action: string,
  entityType: string,
  entityId?: string | null,
  entityName?: string | null,
  metadata?: Record<string, unknown> | null,
) {
  // Fire-and-forget — no await needed
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (!user) return;
    supabase
      .from('user_activity_log')
      .insert({
        user_id: user.id,
        action,
        entity_type: entityType,
        entity_id: entityId || null,
        entity_name: entityName || null,
        metadata: metadata || null,
      })
      .then(({ error }: { error: PostgrestError | null }) => {
        if (error) console.error('Activity log error:', error);
      });
  });
}
