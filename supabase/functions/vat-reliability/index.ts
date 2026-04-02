import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VatReliabilityRequest {
  dic: string;
}

interface VatReliabilityResponse {
  dic: string;
  status: "reliable" | "unreliable" | "not_found" | "error";
  message?: string;
  requestId?: string;
  elapsedMs?: number;
  upstreamStatus?: number;
}

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ status: "error", message: "Missing or invalid authorization header", requestId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 },
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData.user?.id) {
      return new Response(
        JSON.stringify({ status: "error", message: "Invalid authorization token", requestId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 },
      );
    }

    const { dic }: VatReliabilityRequest = await req.json();

    if (!dic) {
      return new Response(
        JSON.stringify({ status: "error", message: "Neplatné DIČ", requestId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    // Clean DIČ for MFCR service (expects numeric part without CZ prefix)
    const cleanDic = dic.replace(/^CZ/i, "").trim();

    if (!/^\d{8,10}$/.test(cleanDic)) {
      return new Response(
        JSON.stringify({ status: "error", message: "Neplatné DIČ", requestId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    // MFCR SOAP operation for VAT payer reliability
    const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:roz="http://adis.mfcr.cz/rozhraniCRPDPH/">
  <soapenv:Header/>
  <soapenv:Body>
    <roz:StatusNespolehlivyPlatceRequest>
      <roz:dic>${cleanDic}</roz:dic>
    </roz:StatusNespolehlivyPlatceRequest>
  </soapenv:Body>
</soapenv:Envelope>`;

    // Prevent endless waiting when MFCR is slow/unavailable
    const timeoutMs = 10000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    let xmlText = "";

    try {
      const upstreamStartedAt = Date.now();
      response = await fetch(
        "https://adisrws.mfcr.cz/dpr/axis2/services/rozhraniCRPDPH.rozhraniCRPDPHSOAP",
        {
          method: "POST",
          headers: {
            "Content-Type": "text/xml; charset=utf-8",
            // This endpoint accepts empty SOAPAction; explicit operation strings can fail on Axis routing
            "SOAPAction": "",
          },
          body: soapBody,
          signal: controller.signal,
        },
      );
      const upstreamElapsedMs = Date.now() - upstreamStartedAt;

      xmlText = await response.text();

      console.info("[vat-reliability] upstream response", {
        requestId,
        dic: cleanDic,
        upstreamStatus: response.status,
        upstreamElapsedMs,
        totalElapsedMs: Date.now() - startedAt,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.warn("[vat-reliability] upstream timeout", {
          requestId,
          dic: cleanDic,
          timeoutMs,
          totalElapsedMs: Date.now() - startedAt,
        });

        return new Response(
          JSON.stringify({
            dic,
            status: "error",
            message: "Vypršel čas pro ověření spolehlivosti plátce",
            requestId,
            elapsedMs: Date.now() - startedAt,
          } as VatReliabilityResponse),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok || xmlText.includes("<soapenv:Fault")) {
      console.error("[vat-reliability] MFCR API fault", {
        requestId,
        dic: cleanDic,
        upstreamStatus: response.status,
        responsePreview: xmlText.slice(0, 500),
        totalElapsedMs: Date.now() - startedAt,
      });

      return new Response(
        JSON.stringify({
          dic,
          status: "error",
          message: "Nepodařilo se ověřit spolehlivost plátce",
          requestId,
          elapsedMs: Date.now() - startedAt,
          upstreamStatus: response.status,
        } as VatReliabilityResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // MFCR returns reliability as attribute nespolehlivyPlatce="ANO|NE"
    const unreliableAttrMatch = xmlText.match(/nespolehlivyPlatce="([^"]+)"/i);
    if (unreliableAttrMatch) {
      const isUnreliable = unreliableAttrMatch[1].trim().toUpperCase() === "ANO";

      return new Response(
        JSON.stringify({
          dic,
          status: isUnreliable ? "unreliable" : "reliable",
          requestId,
          elapsedMs: Date.now() - startedAt,
          upstreamStatus: response.status,
        } as VatReliabilityResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // MFCR not-found / invalid VAT payer style responses
    if (
      /statusCode="1"/i.test(xmlText) ||
      xmlText.includes("nenalezen") ||
      xmlText.includes("neexistuje")
    ) {
      return new Response(
        JSON.stringify({
          dic,
          status: "not_found",
          message: "DIČ nebylo nalezeno v registru",
          requestId,
          elapsedMs: Date.now() - startedAt,
          upstreamStatus: response.status,
        } as VatReliabilityResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.error("[vat-reliability] unparsable upstream response", {
      requestId,
      dic: cleanDic,
      upstreamStatus: response.status,
      responsePreview: xmlText.slice(0, 500),
      totalElapsedMs: Date.now() - startedAt,
    });

    return new Response(
      JSON.stringify({
        dic,
        status: "error",
        message: "Nepodařilo se zpracovat odpověď",
        requestId,
        elapsedMs: Date.now() - startedAt,
        upstreamStatus: response.status,
      } as VatReliabilityResponse),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[vat-reliability] unexpected error", {
      requestId,
      totalElapsedMs: Date.now() - startedAt,
      error,
    });

    return new Response(
      JSON.stringify({
        status: "error",
        message: error instanceof Error ? error.message : "Interní chyba",
        requestId,
        elapsedMs: Date.now() - startedAt,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
