import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    // This is a PUBLIC endpoint - no auth required (applicant fills the form)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    if (req.method === 'GET') {
      // Get applicant data for pre-filling the form
      const url = new URL(req.url);
      const applicantId = url.searchParams.get('applicantId');
      
      if (!applicantId) {
        return new Response(JSON.stringify({ error: 'applicantId is required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data, error } = await supabase
        .from('applicants')
        .select('*')
        .eq('id', applicantId)
        .single();

      if (error || !data) {
        return new Response(JSON.stringify({ error: 'Applicant not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Only allow onboarding for hired applicants
      if (data.stage !== 'hired') {
        return new Response(JSON.stringify({ error: 'Applicant is not in hired stage' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        applicant: data,
        already_completed: !!data.onboarding_completed_at,
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { applicantId, ...onboardingData } = body;

      if (!applicantId) {
        return new Response(JSON.stringify({ error: 'applicantId is required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Verify applicant exists and is hired
      const { data: applicant, error: fetchError } = await supabase
        .from('applicants')
        .select('id, stage')
        .eq('id', applicantId)
        .single();

      if (fetchError || !applicant) {
        return new Response(JSON.stringify({ error: 'Applicant not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (applicant.stage !== 'hired') {
        return new Response(JSON.stringify({ error: 'Applicant is not in hired stage' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Update applicant with onboarding data
      const { error: updateError } = await supabase
        .from('applicants')
        .update({
          // Personal data
          birthday: onboardingData.birthday || null,
          personal_email: onboardingData.personal_email || null,
          avatar_url: onboardingData.avatar_url || null,
          // Billing data
          ico: onboardingData.ico || null,
          company_name: onboardingData.company_name || null,
          dic: onboardingData.dic || null,
          billing_street: onboardingData.billing_street || null,
          billing_city: onboardingData.billing_city || null,
          billing_zip: onboardingData.billing_zip || null,
          // Financial data
          hourly_rate: onboardingData.hourly_rate || null,
          bank_account: onboardingData.bank_account || null,
          // Update contact info if changed
          phone: onboardingData.phone || undefined,
          // Mark onboarding as completed
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('id', applicantId);

      if (updateError) {
        console.error('Error updating applicant:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to save onboarding data' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Onboarding data saved successfully' 
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error in applicant-onboarding:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
