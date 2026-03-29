import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function getGoogleAccessToken(serviceAccountKey: any, adminEmail: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccountKey.client_email,
    sub: adminEmail,
    scope: "https://www.googleapis.com/auth/admin.directory.user",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encode = (obj: any) => {
    const json = JSON.stringify(obj);
    return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  const headerEncoded = encode(header);
  const payloadEncoded = encode(payload);
  const signInput = `${headerEncoded}.${payloadEncoded}`;

  const pemContent = serviceAccountKey.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');
  const binaryDer = Uint8Array.from(atob(pemContent), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8", binaryDer, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(signInput));
  const signatureEncoded = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const jwt = `${signInput}.${signatureEncoded}`;
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.text();
    throw new Error(`Failed to get Google access token: ${errorData}`);
  }
  return (await tokenResponse.json()).access_token;
}

async function suspendGoogleUser(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const serviceAccountKeyStr = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
    const adminEmail = Deno.env.get('GOOGLE_ADMIN_EMAIL');
    if (!serviceAccountKeyStr || !adminEmail) {
      return { success: false, error: 'Google credentials not configured' };
    }

    const serviceAccountKey = JSON.parse(serviceAccountKeyStr);
    const accessToken = await getGoogleAccessToken(serviceAccountKey, adminEmail);

    const response = await fetch(
      `https://admin.googleapis.com/admin/directory/v1/users/${encodeURIComponent(email)}`,
      {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ suspended: true }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Google suspend error:", JSON.stringify(errorData));
      return { success: false, error: errorData.error?.message || `HTTP ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    console.error("Google suspend exception:", error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function deactivateSlackUser(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const slackBotToken = Deno.env.get('SLACK_BOT_TOKEN');
    const slackAdminToken = Deno.env.get('SLACK_ADMIN_TOKEN');
    if (!slackAdminToken) {
      return { success: false, error: 'SLACK_ADMIN_TOKEN not configured' };
    }

    // Look up user by email
    const lookupToken = slackBotToken || slackAdminToken;
    const lookupResponse = await fetch(
      `https://slack.com/api/users.lookupByEmail?email=${encodeURIComponent(email)}`,
      { headers: { "Authorization": `Bearer ${lookupToken}` } }
    );
    const lookupData = await lookupResponse.json();

    if (!lookupData.ok) {
      return { success: false, error: `User not found: ${lookupData.error}` };
    }

    const userId = lookupData.user.id;

    // Deactivate via admin API
    const deactivateResponse = await fetch("https://slack.com/api/users.admin.setInactive", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${slackAdminToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ user: userId }),
    });
    const deactivateData = await deactivateResponse.json();

    if (!deactivateData.ok) {
      return { success: false, error: deactivateData.error || 'Failed to deactivate' };
    }

    return { success: true };
  } catch (error) {
    console.error("Slack deactivate exception:", error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function removeFromFreelo(email: string): Promise<{ success: boolean; removedFromProjects?: number; error?: string }> {
  try {
    const FREELO_API_KEY = Deno.env.get('FREELO_API_KEY');
    const FREELO_USER_EMAIL = Deno.env.get('FREELO_USER_EMAIL');
    if (!FREELO_API_KEY || !FREELO_USER_EMAIL) {
      return { success: false, error: 'Freelo credentials not configured' };
    }

    const basicAuth = btoa(`${FREELO_USER_EMAIL}:${FREELO_API_KEY}`);
    const headers = {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/json',
      'User-Agent': 'SocialsAgencyCRM (crm@socials.cz)',
    };

    // Get all projects
    const projectsResponse = await fetch('https://api.freelo.io/v1/projects', { headers });
    if (!projectsResponse.ok) {
      return { success: false, error: `Failed to list projects: ${projectsResponse.status}` };
    }
    const projects = await projectsResponse.json();

    // For each project, try to remove the user by email
    let removedCount = 0;
    for (const project of projects) {
      try {
        const removeResponse = await fetch('https://api.freelo.io/v1/users/manage-workers', {
          method: 'DELETE',
          headers,
          body: JSON.stringify({
            projects_ids: [project.id],
            emails: [email],
          }),
        });
        if (removeResponse.ok) {
          removedCount++;
        }
      } catch {
        // Continue with other projects
      }
    }

    return { success: true, removedFromProjects: removedCount };
  } catch (error) {
    console.error("Freelo remove exception:", error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const { email, deactivate_google, deactivate_slack, remove_freelo } = await req.json();

    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'email is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const results: Record<string, any> = {};

    // Run all enabled operations in parallel
    const operations: Promise<void>[] = [];

    if (deactivate_google) {
      operations.push(
        suspendGoogleUser(email).then(r => { results.google = r; })
      );
    }

    if (deactivate_slack) {
      operations.push(
        deactivateSlackUser(email).then(r => { results.slack = r; })
      );
    }

    if (remove_freelo) {
      operations.push(
        removeFromFreelo(email).then(r => { results.freelo = r; })
      );
    }

    await Promise.all(operations);

    const allSuccess = Object.values(results).every((r: any) => r.success);

    return new Response(JSON.stringify({
      success: allSuccess,
      results,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in offboard-colleague:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
