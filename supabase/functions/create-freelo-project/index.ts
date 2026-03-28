import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FREELO_API_KEY = Deno.env.get('FREELO_API_KEY');
    const FREELO_USER_EMAIL = Deno.env.get('FREELO_USER_EMAIL');
    const FREELO_TEMPLATE_PROJECT_ID = Deno.env.get('FREELO_TEMPLATE_PROJECT_ID');

    if (!FREELO_API_KEY) throw new Error('FREELO_API_KEY is not configured');
    if (!FREELO_USER_EMAIL) throw new Error('FREELO_USER_EMAIL is not configured');
    if (!FREELO_TEMPLATE_PROJECT_ID) throw new Error('FREELO_TEMPLATE_PROJECT_ID is not configured');

    const { project_name, currency } = await req.json();

    if (!project_name || typeof project_name !== 'string') {
      return new Response(
        JSON.stringify({ error: 'project_name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Basic Auth: email:api_key encoded as base64
    const basicAuth = btoa(`${FREELO_USER_EMAIL}:${FREELO_API_KEY}`);

    const freeloResponse = await fetch(
      `https://api.freelo.io/v1/project/create-from-template/${FREELO_TEMPLATE_PROJECT_ID}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
          'User-Agent': 'SocialsAgencyCRM (crm@socials.cz)',
        },
        body: JSON.stringify({
          name: project_name,
          currency_iso: currency || 'CZK',
        }),
      }
    );

    if (!freeloResponse.ok) {
      const errorText = await freeloResponse.text();
      console.error(`Freelo API error [${freeloResponse.status}]: ${errorText}`);
      return new Response(
        JSON.stringify({ 
          error: `Freelo API error: ${freeloResponse.status}`,
          details: errorText 
        }),
        { status: freeloResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const freeloProject = await freeloResponse.json();
    const projectUrl = `https://app.freelo.io/project/${freeloProject.id}`;

    return new Response(
      JSON.stringify({ 
        success: true, 
        project_id: freeloProject.id,
        project_name: freeloProject.name,
        project_url: projectUrl,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error creating Freelo project:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
