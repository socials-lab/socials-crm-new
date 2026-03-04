import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subject, body, recipients, cc_emails, bcc_emails, broadcast_id } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const trackingBaseUrl = `${supabaseUrl}/functions/v1/broadcast-track`;

    console.log('=== BROADCAST — INDIVIDUAL EMAILS ===');
    console.log('Subject:', subject);
    console.log('Recipients count:', recipients?.length);
    console.log('Broadcast ID:', broadcast_id);

    for (const r of recipients || []) {
      // Create recipient record with tracking ID
      const { data: recipientRecord, error: insertError } = await supabase
        .from('broadcast_recipients')
        .insert({
          broadcast_id,
          email: r.email,
          contact_name: r.contact_name,
          company: r.company,
        })
        .select('tracking_id')
        .single();

      if (insertError) {
        console.error(`Failed to create recipient record for ${r.email}:`, insertError);
        continue;
      }

      const trackingId = recipientRecord.tracking_id;

      // Personalize body
      let personalizedBody = body
        .replace(/\{contact_name\}/g, r.contact_name || '')
        .replace(/\{company\}/g, r.company || '');

      // Rewrite links for click tracking
      personalizedBody = personalizedBody.replace(
        /href="(https?:\/\/[^"]+)"/g,
        (match: string, url: string) => {
          const trackUrl = `${trackingBaseUrl}?id=${trackingId}&type=click&url=${encodeURIComponent(url)}`;
          return `href="${trackUrl}"`;
        }
      );

      // Add tracking pixel at the end
      const trackingPixel = `<img src="${trackingBaseUrl}?id=${trackingId}&type=open" width="1" height="1" style="display:none" alt="" />`;
      const htmlBody = personalizedBody + trackingPixel;

      console.log(`→ Individual email to: ${r.email} (tracking: ${trackingId})`);
      // TODO: Resend API call:
      // await resend.emails.send({ from, to: r.email, subject, html: htmlBody, cc: cc_emails, bcc: bcc_emails })
    }

    console.log('=== END BROADCAST ===');

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
