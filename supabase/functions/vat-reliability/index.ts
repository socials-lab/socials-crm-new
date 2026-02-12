const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MFCR_URL = 'https://adisrws.mfcr.cz/dpr/axis2/services/rozhraniCRPDPH.rozhraniCRPDPHSOAP';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const dic = url.searchParams.get('dic');

    if (!dic) {
      return new Response(
        JSON.stringify({ error: 'Parameter "dic" is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean DIČ - ensure it has CZ prefix
    const cleanDic = dic.trim().toUpperCase();

    const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:roz="http://adis.mfcr.cz/rozhraniCRPDPH/">
  <soapenv:Header/>
  <soapenv:Body>
    <roz:StatusNespolehlivyPlatceRequest>
      <roz:dic>${cleanDic}</roz:dic>
    </roz:StatusNespolehlivyPlatceRequest>
  </soapenv:Body>
</soapenv:Envelope>`;

    const response = await fetch(MFCR_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'getStatusNespolehlivyPlatce',
      },
      body: soapBody,
    });

    const xml = await response.text();
    console.log('MFCR response:', xml);

    // Parse nespolehlivyPlatce attribute from XML
    const statusMatch = xml.match(/nespolehlivyPlatce="([^"]+)"/);
    const status = statusMatch ? statusMatch[1] : null;

    if (!status) {
      // Check for fault/error
      const faultMatch = xml.match(/<faultstring[^>]*>([^<]+)<\/faultstring>/);
      if (faultMatch) {
        return new Response(
          JSON.stringify({ error: faultMatch[1], status: 'error' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ error: 'Could not parse MFCR response', status: 'error' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map to our status values
    let vatStatus: string;
    if (status === 'NE') {
      vatStatus = 'reliable';
    } else if (status === 'ANO') {
      vatStatus = 'unreliable';
    } else {
      vatStatus = 'not_found';
    }

    return new Response(
      JSON.stringify({ 
        dic: cleanDic,
        nespolehlivyPlatce: status,
        vatStatus,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('VAT reliability check error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', status: 'error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
