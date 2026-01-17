import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AresResponse {
  ico: string;
  obchodniJmeno: string;
  sidlo?: { textovaAdresa: string };
  dic?: string;
  pravniForma?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let userId: string | null = null;
  let icoValue: string | null = null;

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

    const { ico } = await req.json();
    icoValue = ico;
    
    // Validate ICO format (8 digits)
    if (!ico || !/^\d{8}$/.test(ico.toString().padStart(8, '0'))) {
      return new Response(
        JSON.stringify({ error: "Neplatné IČO" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const paddedIco = ico.toString().padStart(8, '0');
    const aresUrl = `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${paddedIco}`;
    
    const response = await fetch(aresUrl, {
      headers: { "Accept": "application/json" },
    });

    if (!response.ok) {
      const durationMs = Date.now() - startTime;
      
      if (response.status === 404) {
        // Log not found
        await supabaseAdmin.from('integration_log').insert({
          service: 'ares',
          action: 'lookup_company',
          request_payload: { ico: icoValue },
          response_status: response.status,
          is_success: false,
          error_message: 'Subjekt nenalezen',
          triggered_by: userId,
          duration_ms: durationMs,
        });
        
        return new Response(
          JSON.stringify({ error: "Subjekt nenalezen" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Log other errors
      await supabaseAdmin.from('integration_log').insert({
        service: 'ares',
        action: 'lookup_company',
        request_payload: { ico: icoValue },
        response_status: response.status,
        is_success: false,
        error_message: `ARES error: ${response.status}`,
        triggered_by: userId,
        duration_ms: durationMs,
      });
      
      throw new Error(`ARES error: ${response.status}`);
    }

    const data: AresResponse = await response.json();
    const durationMs = Date.now() - startTime;
    
    // Log successful lookup
    await supabaseAdmin.from('integration_log').insert({
      service: 'ares',
      action: 'lookup_company',
      request_payload: { ico: icoValue },
      response_status: response.status,
      response_payload: data,
      is_success: true,
      triggered_by: userId,
      duration_ms: durationMs,
    });
    
    return new Response(
      JSON.stringify({
        ico: data.ico,
        name: data.obchodniJmeno,
        address: data.sidlo?.textovaAdresa || '',
        dic: data.dic || null,
        legal_form: data.pravniForma || null,
      }),
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
        action: 'lookup_company',
        request_payload: { ico: icoValue },
        is_success: false,
        error_message: errorMessage,
        triggered_by: userId,
        duration_ms: durationMs,
      });
    } catch (logError) {
      console.error("Failed to log integration error:", logError);
    }
    
    console.error("ARES lookup error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
