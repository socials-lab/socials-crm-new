const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
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

    // Scrape Hlídač státu public page (no API key needed)
    let hlidacData: Record<string, any> = {};
    try {
      const hlidacRes = await fetch(`https://www.hlidacstatu.cz/subjekt/${encodeURIComponent(ico)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CRM/1.0)' },
      });
      if (hlidacRes.ok) {
        const html = await hlidacRes.text();
        hlidacData = parseHlidacHtml(html, ico);
      } else {
        await hlidacRes.text(); // consume body
      }
    } catch (e) {
      console.log('Hlídač státu scrape failed:', e.message);
    }

    // Scrape kurzy.cz for additional data (základní kapitál, DIČ, etc.)
    let kurzyData: Record<string, any> = {};
    try {
      const kurzyRes = await fetch(`https://rejstrik-firem.kurzy.cz/${encodeURIComponent(ico)}/`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CRM/1.0)' },
      });
      if (kurzyRes.ok) {
        const html = await kurzyRes.text();
        kurzyData = parseKurzyHtml(html);
      } else {
        await kurzyRes.text();
      }
    } catch (e) {
      console.log('Kurzy.cz scrape failed:', e.message);
    }

    const result = {
      ico,
      name: hlidacData.name || kurzyData.name || null,
      datoveSchranky: hlidacData.datoveSchranky || [],
      zalozena: hlidacData.zalozena || kurzyData.zalozena || null,
      zakladniKapital: kurzyData.zakladniKapital || null,
      dic: kurzyData.dic || null,
      platceDPH: kurzyData.dic ? 'ano' : null,
      // Contracts from Hlídač státu
      smlouvyCount: hlidacData.smlouvyCount ?? null,
      smlouvyTotal: hlidacData.smlouvyTotal ?? null,
      smlouvyRok: hlidacData.smlouvyRok ?? null,
      smlouvyRokCount: hlidacData.smlouvyRokCount ?? null,
      smlouvyRokTotal: hlidacData.smlouvyRokTotal ?? null,
      // Subsidies
      dotace: hlidacData.dotace || null,
      // Insolvency
      insolvence: hlidacData.insolvence || null,
      // Profile URLs
      profileUrl: `https://www.hlidacstatu.cz/subjekt/${ico}`,
      kurzyUrl: `https://rejstrik-firem.kurzy.cz/${ico}/`,
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

function parseHlidacHtml(html: string, ico: string): Record<string, any> {
  const result: Record<string, any> = {};

  // Company name - look for h3 tag with company name
  const nameMatch = html.match(/<h3[^>]*>\s*([^<]+)\s*<\/h3>/i);
  if (nameMatch) {
    result.name = nameMatch[1].trim();
  }

  // Založeno (founded date)
  const zalozenaMatch = html.match(/Založeno\s*<\/td>\s*<td[^>]*>\s*([^<]+)/i) 
    || html.match(/Založeno[^<]*<[^>]*>\s*(\d{1,2}\.\d{1,2}\.\d{4})/i);
  if (zalozenaMatch) {
    result.zalozena = zalozenaMatch[1].trim();
  }

  // Datová schránka
  const dsMatch = html.match(/Datová schránka\s*<\/td>\s*<td[^>]*>\s*([a-z0-9]+)/i)
    || html.match(/Datová schránka[^<]*<[^>]*>\s*([a-z0-9]+)/i);
  if (dsMatch) {
    result.datoveSchranky = [dsMatch[1].trim()];
  }

  // Contracts - "evidujeme <a>X smluv</a> za celkem <span>Y Kč</span>"
  // Strip HTML tags first for easier matching
  const textOnly = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
  
  const smlouvyMatch = textOnly.match(/evidujeme\s+(\d+)\s+smluv[^z]*za celkem\s+([\d\s,]+)\s*Kč/i);
  if (smlouvyMatch) {
    result.smlouvyCount = parseInt(smlouvyMatch[1]);
    result.smlouvyTotal = smlouvyMatch[2].trim();
  }

  // Current year contracts - "V roce 2025 uzavřel subjekt X smluv za Y Kč"
  const rokMatch = textOnly.match(/V roce (\d{4}) uzavřel subjekt\s+(\d+)\s+smluv/i);
  if (rokMatch) {
    result.smlouvyRok = rokMatch[1];
    result.smlouvyRokCount = parseInt(rokMatch[2]);
  }
  const rokTotalMatch = textOnly.match(/V roce \d{4} uzavřel subjekt\s+\d+\s+smluv[^K]*za\s+([\d\s,]+)\s*Kč/i);
  if (rokTotalMatch) {
    result.smlouvyRokTotal = rokTotalMatch[1].trim();
  }

  return result;
}

function parseKurzyHtml(html: string): Record<string, any> {
  const result: Record<string, any> = {};
  const textOnly = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');

  // Základní kapitál - "Z. KAPITÁL: 100 000 Kč"
  const kapitalMatch = textOnly.match(/Z\.\s*KAPITÁL[:\s]+([\d\s]+)\s*Kč/i);
  if (kapitalMatch) {
    result.zakladniKapital = kapitalMatch[1].trim().replace(/\s+/g, ' ') + ' Kč';
  }

  // DIČ
  const dicMatch = textOnly.match(/DIČ[^:]*:\s*(CZ\d+)/i);
  if (dicMatch) {
    result.dic = dicMatch[1];
  }

  // Company name
  const nameMatch = textOnly.match(/NÁZEV:\s+([^\n]+?)(?:\s+IČO|\s+Z\.\s*KAPITÁL)/i);
  if (nameMatch) {
    result.name = nameMatch[1].trim();
  }

  // Founded date
  const zalozenaMatch = textOnly.match(/Datum vzniku[^:]*:\s*(\d{1,2}\.\s*\w+\s*\d{4})/i);
  if (zalozenaMatch) {
    result.zalozena = zalozenaMatch[1].trim();
  }

  return result;
}
