import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subject, body, recipients, cc_emails, bcc_emails } = await req.json();

    console.log('=== BROADCAST EMAIL ===');
    console.log('Subject:', subject);
    console.log('Recipients count:', recipients?.length);
    console.log('CC:', cc_emails);
    console.log('BCC:', bcc_emails);
    console.log('Body template:', body?.substring(0, 200));
    
    // Log each personalized recipient
    for (const r of recipients || []) {
      const personalizedBody = body
        .replace(/\{contact_name\}/g, r.contact_name || '')
        .replace(/\{company\}/g, r.company || '');
      console.log(`→ To: ${r.email} (${r.contact_name} @ ${r.company})`);
    }

    console.log('=== END BROADCAST ===');
    // TODO: Integrate with Resend API for actual email sending

    return new Response(JSON.stringify({ success: true, sent: recipients?.length || 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Broadcast error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
