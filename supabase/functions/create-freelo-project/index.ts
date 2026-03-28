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

    const { project_name, currency, team_emails } = await req.json();

    if (!project_name || typeof project_name !== 'string') {
      return new Response(
        JSON.stringify({ error: 'project_name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const basicAuth = btoa(`${FREELO_USER_EMAIL}:${FREELO_API_KEY}`);
    const headers = {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/json',
      'User-Agent': 'SocialsAgencyCRM (crm@socials.cz)',
    };

    // 1. Create project from template
    const freeloResponse = await fetch(
      `https://api.freelo.io/v1/project/create-from-template/${FREELO_TEMPLATE_PROJECT_ID}`,
      {
        method: 'POST',
        headers,
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

    const filterEmails = (emails: unknown): string[] =>
      Array.isArray(emails) ? emails.filter((e: string) => e && typeof e === 'string' && e.includes('@')) : [];

    // 2. Invite team members by email
    let invitedTeamCount = 0;
    const validTeamEmails = filterEmails(team_emails);

    if (validTeamEmails.length > 0) {
      try {
        const inviteResponse = await fetch(`https://api.freelo.io/v1/users/manage-workers`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            projects_ids: [freeloProject.id],
            emails: validTeamEmails,
          }),
        });

        if (inviteResponse.ok) {
          const inviteResult = await inviteResponse.json();
          invitedTeamCount = (inviteResult.newly_invited_users?.length || 0) + 
                             (inviteResult.newly_created_users?.length || 0);
          console.log(`Invited ${invitedTeamCount} team members to Freelo project ${freeloProject.id}`);
        } else {
          const inviteError = await inviteResponse.text();
          console.error(`Freelo team invite error [${inviteResponse.status}]: ${inviteError}`);
        }
      } catch (inviteErr) {
        console.error('Error inviting team to Freelo:', inviteErr);
      }
    }

    // 3. Invite client contacts by email
    let invitedClientCount = 0;
    const validClientEmails = filterEmails(client_emails);

    if (validClientEmails.length > 0) {
      try {
        const clientInviteResponse = await fetch(`https://api.freelo.io/v1/users/manage-workers`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            projects_ids: [freeloProject.id],
            emails: validClientEmails,
          }),
        });

        if (clientInviteResponse.ok) {
          const clientResult = await clientInviteResponse.json();
          invitedClientCount = (clientResult.newly_invited_users?.length || 0) + 
                               (clientResult.newly_created_users?.length || 0);
          console.log(`Invited ${invitedClientCount} client contacts to Freelo project ${freeloProject.id}`);
        } else {
          const clientError = await clientInviteResponse.text();
          console.error(`Freelo client invite error [${clientInviteResponse.status}]: ${clientError}`);
        }
      } catch (clientErr) {
        console.error('Error inviting client contacts to Freelo:', clientErr);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        project_id: freeloProject.id,
        project_name: freeloProject.name,
        project_url: projectUrl,
        invited_team_count: invitedTeamCount,
        invited_client_count: invitedClientCount,
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
