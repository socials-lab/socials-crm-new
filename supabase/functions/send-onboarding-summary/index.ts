import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    console.log('=== ONBOARDING SUMMARY PAYLOAD ===');
    console.log(JSON.stringify(payload, null, 2));
    console.log('=== RECIPIENTS ===');
    console.log('To:', payload.recipients?.to);
    console.log('BCC:', payload.recipients?.bcc);
    console.log('=== END ===');

    // TODO: Napojení na Resend API
    // const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    // const res = await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     from: 'Socials <noreply@socials.cz>',
    //     to: payload.recipients.to,
    //     bcc: payload.recipients.bcc,
    //     subject: `Souhrn objednávky – ${payload.companyName}`,
    //     html: buildEmailHtml(payload),
    //   }),
    // });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing onboarding summary:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
