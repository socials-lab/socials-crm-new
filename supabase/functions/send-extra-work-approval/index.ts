import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // Action: get extra work by token (public, no auth needed)
    if (req.method === 'GET' && action === 'get-by-token') {
      const token = url.searchParams.get('token');
      if (!token) {
        return new Response(JSON.stringify({ error: 'Token is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabase
        .from('extra_works')
        .select('*, clients(name, brand_name), engagements(name), colleagues(full_name)')
        .eq('approval_token', token)
        .single();

      if (error || !data) {
        return new Response(JSON.stringify({ error: 'Extra work not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Action: approve extra work (public)
    if (req.method === 'POST' && action === 'approve') {
      const { token } = await req.json();
      
      const { data: work, error: fetchError } = await supabase
        .from('extra_works')
        .select('id, status')
        .eq('approval_token', token)
        .single();

      if (fetchError || !work) {
        return new Response(JSON.stringify({ error: 'Extra work not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (work.status !== 'pending_approval') {
        return new Response(JSON.stringify({ error: 'Already processed', status: work.status }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error: updateError } = await supabase
        .from('extra_works')
        .update({
          status: 'in_progress',
          client_approved_at: new Date().toISOString(),
          approval_date: new Date().toISOString(),
        })
        .eq('id', work.id);

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Action: reject extra work (public)
    if (req.method === 'POST' && action === 'reject') {
      const { token, reason } = await req.json();

      const { data: work, error: fetchError } = await supabase
        .from('extra_works')
        .select('id, status')
        .eq('approval_token', token)
        .single();

      if (fetchError || !work) {
        return new Response(JSON.stringify({ error: 'Extra work not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (work.status !== 'pending_approval') {
        return new Response(JSON.stringify({ error: 'Already processed', status: work.status }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error: updateError } = await supabase
        .from('extra_works')
        .update({
          status: 'rejected',
          client_rejected_at: new Date().toISOString(),
          client_rejection_reason: reason || null,
        })
        .eq('id', work.id);

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Action: send email (stub - logs payload)
    if (req.method === 'POST' && action === 'send-email') {
      const payload = await req.json();

      console.log('=== EXTRA WORK APPROVAL EMAIL ===');
      console.log(JSON.stringify(payload, null, 2));
      console.log('=== END ===');

      // TODO: Connect to Resend API
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
