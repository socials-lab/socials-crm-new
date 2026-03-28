import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SLACK_API = 'https://slack.com/api';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SLACK_BOT_TOKEN = Deno.env.get('SLACK_BOT_TOKEN');
    if (!SLACK_BOT_TOKEN) throw new Error('SLACK_BOT_TOKEN is not configured');

    const { channel_name, team_emails } = await req.json();

    if (!channel_name || typeof channel_name !== 'string') {
      return new Response(
        JSON.stringify({ error: 'channel_name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Slack channel names: lowercase, no spaces, max 80 chars, only letters/numbers/hyphens/underscores
    const sanitizedName = channel_name
      .toLowerCase()
      .replace(/[^a-z0-9čšžřďťňůúýáéíó_-]/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 80);

    const headers = {
      'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    };

    // 1. Create channel
    const createRes = await fetch(`${SLACK_API}/conversations.create`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: sanitizedName }),
    });

    const createData = await createRes.json();

    if (!createData.ok) {
      // If channel already exists, try to find it
      if (createData.error === 'name_taken') {
        console.log(`Channel "${sanitizedName}" already exists`);
        return new Response(
          JSON.stringify({ success: true, channel_name: sanitizedName, already_existed: true, invited_count: 0 }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.error('Slack create channel error:', createData);
      return new Response(
        JSON.stringify({ error: `Slack API error: ${createData.error}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const channelId = createData.channel.id;

    // 2. Invite team members by email
    let invitedCount = 0;
    const validEmails = Array.isArray(team_emails)
      ? team_emails.filter((e: string) => e && typeof e === 'string' && e.includes('@'))
      : [];

    for (const email of validEmails) {
      try {
        // Look up user by email
        const lookupRes = await fetch(`${SLACK_API}/users.lookupByEmail?email=${encodeURIComponent(email)}`, {
          headers: { 'Authorization': `Bearer ${SLACK_BOT_TOKEN}` },
        });
        const lookupData = await lookupRes.json();

        if (!lookupData.ok) {
          console.log(`User not found for email ${email}: ${lookupData.error}`);
          continue;
        }

        const userId = lookupData.user.id;

        // Invite user to channel
        const inviteRes = await fetch(`${SLACK_API}/conversations.invite`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ channel: channelId, users: userId }),
        });
        const inviteData = await inviteRes.json();

        if (inviteData.ok || inviteData.error === 'already_in_channel') {
          invitedCount++;
        } else {
          console.log(`Failed to invite ${email}: ${inviteData.error}`);
        }
      } catch (inviteErr) {
        console.error(`Error inviting ${email}:`, inviteErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        channel_id: channelId,
        channel_name: createData.channel.name,
        invited_count: invitedCount,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error creating Slack channel:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
