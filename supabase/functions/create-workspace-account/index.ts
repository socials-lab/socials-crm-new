import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateAccountRequest {
  first_name: string;
  last_name: string;
  personal_email: string;
  password?: string;
}

// Generate a JWT from the service account key for Google API auth
async function getGoogleAccessToken(serviceAccountKey: any, adminEmail: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const payload = {
    iss: serviceAccountKey.client_email,
    sub: adminEmail,
    scope: "https://www.googleapis.com/auth/admin.directory.user",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  // Base64url encode
  const encode = (obj: any) => {
    const json = JSON.stringify(obj);
    const encoded = btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return encoded;
  };

  const headerEncoded = encode(header);
  const payloadEncoded = encode(payload);
  const signInput = `${headerEncoded}.${payloadEncoded}`;

  // Import the private key
  const pemContent = serviceAccountKey.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');
  
  const binaryDer = Uint8Array.from(atob(pemContent), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signInput)
  );

  const signatureEncoded = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const jwt = `${signInput}.${signatureEncoded}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.text();
    throw new Error(`Failed to get access token: ${errorData}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

function removeDiacritics(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function generateEmail(firstName: string, lastName: string): string {
  const cleanFirst = removeDiacritics(firstName).toLowerCase().trim();
  const cleanLast = removeDiacritics(lastName).toLowerCase().trim();
  return `${cleanFirst}.${cleanLast}@socials.cz`;
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  for (let i = 0; i < 16; i++) {
    password += chars[array[i] % chars.length];
  }
  return password;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check - verify secrets are configured
  const url = new URL(req.url);
  if (url.searchParams.get('health') === 'check') {
    const hasServiceKey = !!Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
    const hasAdminEmail = !!Deno.env.get('GOOGLE_ADMIN_EMAIL');
    let serviceKeyValid = false;
    let clientEmail = '';
    
    if (hasServiceKey) {
      try {
        const raw = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY')!;
        const parsed = JSON.parse(raw);
        const keys = Object.keys(parsed);
        serviceKeyValid = !!parsed.private_key && !!parsed.client_email;
        clientEmail = parsed.client_email || '';
        if (!serviceKeyValid) {
          clientEmail = `has keys: ${keys.join(', ')}`;
        }
      } catch (e) { 
        const raw = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY')!;
        clientEmail = `parse error: ${e.message}, first 80 chars: ${raw.substring(0, 80)}`;
        serviceKeyValid = false; 
      }
    }

    return new Response(JSON.stringify({
      google_service_account_key: hasServiceKey ? (serviceKeyValid ? `✅ valid (${clientEmail})` : '❌ invalid JSON structure') : '❌ missing',
      google_admin_email: hasAdminEmail ? `✅ set (${Deno.env.get('GOOGLE_ADMIN_EMAIL')})` : '❌ missing',
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
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

    const { first_name, last_name, personal_email, password: customPassword } = await req.json() as CreateAccountRequest;

    if (!first_name || !last_name) {
      return new Response(JSON.stringify({ error: 'first_name and last_name are required' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const serviceAccountKeyStr = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
    if (!serviceAccountKeyStr) {
      return new Response(JSON.stringify({ error: 'GOOGLE_SERVICE_ACCOUNT_KEY not configured' }), { 
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const adminEmail = Deno.env.get('GOOGLE_ADMIN_EMAIL');
    if (!adminEmail) {
      return new Response(JSON.stringify({ error: 'GOOGLE_ADMIN_EMAIL not configured' }), { 
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const serviceAccountKey = JSON.parse(serviceAccountKeyStr);
    const accessToken = await getGoogleAccessToken(serviceAccountKey, adminEmail);

    const workspaceEmail = generateEmail(first_name, last_name);
    const tempPassword = customPassword || generatePassword();

    // Create Google Workspace user
    const createUserResponse = await fetch("https://admin.googleapis.com/admin/directory/v1/users", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        primaryEmail: workspaceEmail,
        name: {
          givenName: first_name,
          familyName: last_name,
        },
        password: tempPassword,
        changePasswordAtNextLogin: true,
        recoveryEmail: personal_email || undefined,
      }),
    });

    if (!createUserResponse.ok) {
      const errorData = await createUserResponse.json();
      console.error("Google API error:", JSON.stringify(errorData));
      
      if (errorData.error?.code === 409) {
        return new Response(JSON.stringify({ 
          error: 'Uživatel s tímto emailem již existuje',
          email: workspaceEmail,
        }), { 
          status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      throw new Error(`Google API error [${createUserResponse.status}]: ${JSON.stringify(errorData)}`);
    }

    const userData = await createUserResponse.json();

    return new Response(JSON.stringify({
      success: true,
      email: userData.primaryEmail,
      name: `${userData.name.givenName} ${userData.name.familyName}`,
      temporary_password: tempPassword,
      message: `Účet ${userData.primaryEmail} vytvořen. Na ${personal_email || 'recovery email'} přijde pozvánka.`,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error creating workspace account:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
