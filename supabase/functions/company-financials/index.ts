import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const ico = url.searchParams.get('ico');

    if (!ico) {
      return new Response(JSON.stringify({ error: 'Missing ico parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('HLIDAC_STATU_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use basic endpoint - returns company name and basic info
    const apiUrl = `https://api.hlidacstatu.cz/api/v2/firmy/ico/${encodeURIComponent(ico)}`;
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Token ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Hlidac statu API error: ${response.status} - ${errorText}`);
      return new Response(JSON.stringify({ error: `API returned ${response.status}` }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();

    // Try GetDetailInfo for financial data (may require paid license)
    let detailData = null;
    try {
      const detailUrl = `https://api.hlidacstatu.cz/api/v2/firmy/GetDetailInfo?icos=${encodeURIComponent(ico)}`;
      const detailResponse = await fetch(detailUrl, {
        headers: { 'Authorization': `Token ${apiKey}` },
      });
      if (detailResponse.ok) {
        const detailArray = await detailResponse.json();
        detailData = Array.isArray(detailArray) ? detailArray[0] : detailArray;
      } else {
        await detailResponse.text(); // consume body
      }
    } catch (e) {
      console.log('GetDetailInfo not available:', e.message);
    }

    const bi = detailData?.business_info || {};

    const result = {
      ico: data.ico || ico,
      name: data.jmeno || detailData?.nazev || null,
      datoveSchranky: data.datoveSchranky || [],
      zalozena: data.zalozena || null,
      // Financial data from GetDetailInfo (if available)
      obrat: bi.obrat || null,
      pocetZamestnancu: bi.pocet_Zamestnancu || null,
      oborPodnikani: bi.obor_Podnikani || null,
      platceDPH: bi.platce_DPH || null,
      nespolehlivyPlatce: bi.je_nespolehlivym_platcem_DPHKod || null,
      dluhVZP: bi.ma_dluh_vzp || null,
      rizika: detailData?.rizika || null,
      // Profile URL for full info
      profileUrl: `https://www.hlidacstatu.cz/subjekt/${ico}`,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
