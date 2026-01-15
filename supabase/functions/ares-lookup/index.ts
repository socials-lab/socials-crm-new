import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

  try {
    const { ico } = await req.json();
    
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
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ error: "Subjekt nenalezen" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`ARES error: ${response.status}`);
    }

    const data: AresResponse = await response.json();
    
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
    console.error("ARES lookup error:", error);
    return new Response(
      JSON.stringify({ error: "Chyba při vyhledávání v ARES" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
