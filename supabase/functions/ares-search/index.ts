import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AresSearchResponse {
  ekonomickeSubjekty?: Array<{
    ico: string;
    obchodniJmeno: string;
    sidlo?: { textovaAdresa: string };
    dic?: string;
    pravniForma?: string;
  }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let userId: string | null = null;
  let queryValue: string | null = null;

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Try to get user from auth header if present
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) {
        userId = user.id;
      }
    }

    const { query } = await req.json();
    queryValue = query;
    
    // Validate query (min 3 characters)
    if (!query || typeof query !== 'string' || query.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: "Dotaz musí obsahovat alespoň 3 znaky" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aresUrl = `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/vyhledat`;
    
    const requestBody = {
      obchodniJmeno: query.trim(),
      start: 0,
      pocet: 10,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(aresUrl, {
      method: "POST",
      headers: { 
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      const durationMs = Date.now() - startTime;
      
      // Log error
      await supabaseAdmin.from('integration_log').insert({
        service: 'ares',
        action: 'search_companies',
        request_payload: { query: queryValue },
        response_status: response.status,
        is_success: false,
        error_message: `ARES search error: ${response.status}`,
        triggered_by: userId,
        duration_ms: durationMs,
      });
      
      return new Response(
        JSON.stringify({ error: `Chyba při vyhledávání: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data: AresSearchResponse = await response.json();
    const durationMs = Date.now() - startTime;
    
    // Transform ARES response to our format
    const companies = (data.ekonomickeSubjekty || []).map((subjekt) => {
      // Parse address if available
      const address = subjekt.sidlo?.textovaAdresa || '';
      let billing_street = '';
      let billing_city = '';
      let billing_zip = '';
      const billing_country = 'Česká republika';

      if (address) {
        // Try to parse address (format: "Street, ZIP City" or similar)
        const addressParts = address.split(',');
        if (addressParts.length >= 2) {
          billing_street = addressParts[0].trim();
          const cityZip = addressParts[addressParts.length - 1].trim().split(' ');
          if (cityZip.length >= 2) {
            billing_zip = cityZip[0];
            billing_city = cityZip.slice(1).join(' ');
          } else {
            billing_city = cityZip[0];
          }
        } else {
          billing_street = address;
        }
      }

      return {
        ico: subjekt.ico,
        name: subjekt.obchodniJmeno,
        dic: subjekt.dic || null,
        address: address,
        billing_street: billing_street,
        billing_city: billing_city,
        billing_zip: billing_zip,
        billing_country: billing_country,
        legal_form: subjekt.pravniForma || null,
      };
    });
    
    // Log successful search
    await supabaseAdmin.from('integration_log').insert({
      service: 'ares',
      action: 'search_companies',
      request_payload: { query: queryValue },
      response_status: response.status,
      response_payload: { count: companies.length },
      is_success: true,
      triggered_by: userId,
      duration_ms: durationMs,
    });
    
    return new Response(
      JSON.stringify({ companies }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Chyba při vyhledávání v ARES";
    
    // Log error
    try {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await supabaseAdmin.from('integration_log').insert({
        service: 'ares',
        action: 'search_companies',
        request_payload: { query: queryValue },
        is_success: false,
        error_message: errorMessage,
        triggered_by: userId,
        duration_ms: durationMs,
      });
    } catch (logError) {
      console.error("Failed to log integration error:", logError);
    }
    
    console.error("ARES search error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
