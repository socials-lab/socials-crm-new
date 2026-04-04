import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ONBOARDING_PROJECT_ID = 455865;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FREELO_API_KEY = Deno.env.get('FREELO_API_KEY');
    const FREELO_USER_EMAIL = Deno.env.get('FREELO_USER_EMAIL');

    if (!FREELO_API_KEY) throw new Error('FREELO_API_KEY is not configured');
    if (!FREELO_USER_EMAIL) throw new Error('FREELO_USER_EMAIL is not configured');

    const { email, project_id } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Valid email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetProjectId = project_id || ONBOARDING_PROJECT_ID;

    const basicAuth = btoa(`${FREELO_USER_EMAIL}:${FREELO_API_KEY}`);
    const headers = {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/json',
      'User-Agent': 'SocialsAgencyCRM (crm@socials.cz)',
    };

    const inviteResponse = await fetch(`https://api.freelo.io/v1/users/manage-workers`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        projects_ids: [targetProjectId],
        emails: [email],
      }),
    });

    if (!inviteResponse.ok) {
      const errorText = await inviteResponse.text();
      console.error(`Freelo invite error [${inviteResponse.status}]: ${errorText}`);
      return new Response(
        JSON.stringify({ error: `Freelo API error: ${inviteResponse.status}`, details: errorText }),
        { status: inviteResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await inviteResponse.json();
    const invitedCount = (result.newly_invited_users?.length || 0) + (result.newly_created_users?.length || 0);
    const alreadyExists = result.already_existing_users?.length || 0;

    console.log(`Freelo invite: ${email} to project ${targetProjectId} — invited: ${invitedCount}, existing: ${alreadyExists}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: alreadyExists > 0
          ? `${email} již má přístup do Freelo projektu`
          : `${email} pozván do Freelo projektu`,
        invited_count: invitedCount,
        already_existing: alreadyExists,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error inviting to Freelo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
