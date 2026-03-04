import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 1x1 transparent GIF
const TRACKING_PIXEL = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
  0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21,
  0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
  0x01, 0x00, 0x3b,
]);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const trackingId = url.searchParams.get('id');
    const type = url.searchParams.get('type'); // 'open' or 'click'
    const redirectUrl = url.searchParams.get('url');

    if (!trackingId || !type) {
      return new Response('Missing params', { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    if (type === 'open') {
      // Record open — only first time (idempotent)
      const { data: recipient } = await supabase
        .from('broadcast_recipients')
        .select('id, broadcast_id, opened_at')
        .eq('tracking_id', trackingId)
        .single();

      if (recipient && !recipient.opened_at) {
        await supabase
          .from('broadcast_recipients')
          .update({ opened_at: new Date().toISOString() })
          .eq('id', recipient.id);

        await supabase.rpc('increment_broadcast_counter', {
          _broadcast_id: recipient.broadcast_id,
          _column: 'open_count',
        }).catch(() => {
          // Fallback: direct update
          return supabase
            .from('broadcasts')
            .update({ open_count: supabase.rpc ? undefined : 0 })
            .eq('id', recipient.broadcast_id);
        });

        // Direct SQL increment via raw update
        await supabase
          .from('broadcasts')
          .select('open_count')
          .eq('id', recipient.broadcast_id)
          .single()
          .then(async ({ data }) => {
            if (data) {
              await supabase
                .from('broadcasts')
                .update({ open_count: (data.open_count || 0) + 1 })
                .eq('id', recipient.broadcast_id);
            }
          });
      }

      return new Response(TRACKING_PIXEL, {
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          ...corsHeaders,
        },
      });
    }

    if (type === 'click' && redirectUrl) {
      const { data: recipient } = await supabase
        .from('broadcast_recipients')
        .select('id, broadcast_id, clicked_at, opened_at')
        .eq('tracking_id', trackingId)
        .single();

      if (recipient && !recipient.clicked_at) {
        const updates: Record<string, string> = { clicked_at: new Date().toISOString() };
        // If they clicked, they also opened
        if (!recipient.opened_at) {
          updates.opened_at = new Date().toISOString();
        }

        await supabase
          .from('broadcast_recipients')
          .update(updates)
          .eq('id', recipient.id);

        // Increment click_count
        const { data: broadcast } = await supabase
          .from('broadcasts')
          .select('open_count, click_count')
          .eq('id', recipient.broadcast_id)
          .single();

        if (broadcast) {
          const updateData: Record<string, number> = {
            click_count: (broadcast.click_count || 0) + 1,
          };
          if (!recipient.opened_at) {
            updateData.open_count = (broadcast.open_count || 0) + 1;
          }
          await supabase
            .from('broadcasts')
            .update(updateData)
            .eq('id', recipient.broadcast_id);
        }
      }

      return new Response(null, {
        status: 302,
        headers: { Location: redirectUrl, ...corsHeaders },
      });
    }

    return new Response('Invalid type', { status: 400 });
  } catch (error) {
    console.error('Tracking error:', error);
    // Always return something valid — don't break the email client
    return new Response(TRACKING_PIXEL, {
      headers: { 'Content-Type': 'image/gif', ...corsHeaders },
    });
  }
});
