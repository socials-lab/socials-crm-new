import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VatReliabilityRequest {
  dic: string;
}

interface VatReliabilityResponse {
  dic: string;
  status: 'reliable' | 'unreliable' | 'not_found' | 'error';
  message?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dic }: VatReliabilityRequest = await req.json();

    if (!dic || dic.length < 10) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Neplatné DIČ' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Clean the DIC - remove 'CZ' prefix if present
    const cleanDic = dic.replace(/^CZ/i, '');

    // Build SOAP request for Czech Ministry of Finance (MFCR) API
    const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:roz="http://adis.mfcr.cz/rozhraniCRPDPH/">
  <soap:Body>
    <roz:StatusNespsRequest>
      <roz:dic>${cleanDic}</roz:dic>
    </roz:StatusNespsRequest>
  </soap:Body>
</soap:Envelope>`;

    const response = await fetch(
      "https://adisrws.mfcr.cz/dpr/axis2/services/rozhraniCRPDPH.rozhraniCRPDPHSOAP",
      {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          "SOAPAction": "http://adis.mfcr.cz/rozhraniCRPDPH/StatusNespsRequest",
        },
        body: soapBody,
      }
    );

    if (!response.ok) {
      console.error("MFCR API error:", await response.text());
      return new Response(
        JSON.stringify({
          dic,
          status: 'error',
          message: 'Nepodařilo se ověřit spolehlivost plátce'
        } as VatReliabilityResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const xmlText = await response.text();

    // Parse the response - look for nespolehlivyPlatce attribute
    // 'ANO' = unreliable, 'NE' = reliable
    const unreliableMatch = xmlText.match(/nespolehlivyPlatce[^>]*>([^<]+)</);

    if (!unreliableMatch) {
      // Check if DIC was found at all
      if (xmlText.includes('nenalezeno') || xmlText.includes('neexistuje')) {
        return new Response(
          JSON.stringify({
            dic,
            status: 'not_found',
            message: 'DIČ nebylo nalezeno v registru'
          } as VatReliabilityResponse),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          dic,
          status: 'error',
          message: 'Nepodařilo se zpracovat odpověď'
        } as VatReliabilityResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isUnreliable = unreliableMatch[1].trim().toUpperCase() === 'ANO';

    return new Response(
      JSON.stringify({
        dic,
        status: isUnreliable ? 'unreliable' : 'reliable'
      } as VatReliabilityResponse),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("VAT reliability check error:", error);
    return new Response(
      JSON.stringify({
        status: 'error',
        message: error instanceof Error ? error.message : 'Interní chyba'
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
