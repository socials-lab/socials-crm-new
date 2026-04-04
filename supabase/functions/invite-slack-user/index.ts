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
    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { email, channels } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'email is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const slackAdminToken = Deno.env.get('SLACK_ADMIN_TOKEN');
    const slackBotToken = Deno.env.get('SLACK_BOT_TOKEN');

    if (!slackAdminToken) {
      return new Response(JSON.stringify({ error: 'SLACK_ADMIN_TOKEN not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Step 1: Invite user to workspace via undocumented admin API
    const inviteResponse = await fetch("https://slack.com/api/users.admin.invite", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${slackAdminToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        email: email,
        set_active: "true",
      }),
    });

    const inviteData = await inviteResponse.json();
    console.log("Slack invite response:", JSON.stringify(inviteData));

    let inviteSuccess = inviteData.ok;
    let alreadyInTeam = false;

    if (!inviteData.ok) {
      if (inviteData.error === 'already_in_team' || inviteData.error === 'already_invited') {
        alreadyInTeam = true;
        inviteSuccess = true; // Not a real error
      } else {
        console.error("Slack invite error:", inviteData.error);
      }
    }

    // Step 2: If user is already in team, try to add to channels
    let channelsAdded: string[] = [];
    if (alreadyInTeam && slackBotToken && channels?.length > 0) {
      // Look up user by email
      const lookupResponse = await fetch(`https://slack.com/api/users.lookupByEmail?email=${encodeURIComponent(email)}`, {
        headers: { "Authorization": `Bearer ${slackBotToken}` },
      });
      const lookupData = await lookupResponse.json();

      if (lookupData.ok && lookupData.user?.id) {
        const userId = lookupData.user.id;

        for (const channelName of channels) {
          // Find channel by name
          const listResponse = await fetch(`https://slack.com/api/conversations.list?types=public_channel&limit=200`, {
            headers: { "Authorization": `Bearer ${slackBotToken}` },
          });
          const listData = await listResponse.json();
          const channel = listData.channels?.find((c: any) => c.name === channelName.replace('#', ''));

          if (channel) {
            const addResponse = await fetch("https://slack.com/api/conversations.invite", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${slackBotToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                channel: channel.id,
                users: userId,
              }),
            });
            const addData = await addResponse.json();
            if (addData.ok || addData.error === 'already_in_channel') {
              channelsAdded.push(channelName);
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({
      success: inviteSuccess,
      already_in_team: alreadyInTeam,
      channels_added: channelsAdded,
      message: alreadyInTeam
        ? `Uživatel ${email} je již v workspace. Přidán do ${channelsAdded.length} kanálů.`
        : inviteSuccess
          ? `Pozvánka odeslána na ${email}.`
          : `Nepodařilo se pozvat: ${inviteData.error}`,
      error: inviteSuccess ? undefined : inviteData.error,
    }), {
      status: inviteSuccess ? 200 : 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error inviting to Slack:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
