import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DIGISIGN_API_URL = "https://api.digisign.org/api";
const FETCH_TIMEOUT_MS = 30000; // 30 seconds timeout

// Fetch with timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

interface Signatory {
  name: string;
  position?: string;
  email: string;
  phone?: string;
}

interface ContractData {
  company_name: string;
  billing_address: string;
  ico: string;
  dic: string | null;
  court_name: string;
  court_file_number: string;
  signatories: Signatory[];
  website_url: string;
  additional_emails: string;
  invoice_email: string;
  monthly_fee: number;
  setup_fee: number;
  contract_date: string;
  products: string;
}

// Step 1: Get auth token
async function getAuthToken(accessKey: string, secretKey: string): Promise<string> {
  const response = await fetchWithTimeout(`${DIGISIGN_API_URL}/auth-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessKey, secretKey }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Auth failed: ${error}`);
  }

  const data = await response.json();
  return data.token;
}

// Step 2: Create empty envelope
async function createEnvelope(token: string, name: string, emailBody: string): Promise<{ envelopeId: string; selfLink: string }> {
  const response = await fetchWithTimeout(`${DIGISIGN_API_URL}/envelopes`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      emailBody,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Create envelope failed: ${error}`);
  }

  const data = await response.json();
  // DigiSign returns _links.self with the API path, we'll use it to build the app URL
  const selfLink = data._links?.self || `/api/envelopes/${data.id}`;
  return { envelopeId: data.id, selfLink };
}

// Step 3: Upload PDF file
async function uploadFile(token: string, pdfBuffer: ArrayBuffer, filename: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", new Blob([pdfBuffer], { type: "application/pdf" }), filename);

  const response = await fetchWithTimeout(`${DIGISIGN_API_URL}/files`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Upload file failed: ${error}`);
  }

  const data = await response.json();
  return data.id;
}

// Step 4: Attach document to envelope
async function attachDocument(token: string, envelopeId: string, fileId: string, documentName: string): Promise<string> {
  const response = await fetchWithTimeout(`${DIGISIGN_API_URL}/envelopes/${envelopeId}/documents`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      file: `/api/files/${fileId}`,
      name: documentName,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Attach document failed: ${error}`);
  }

  const data = await response.json();
  return data.id;
}

// Recipient data for PATCH request
interface RecipientInput {
  role: string;
  signatureType: string;
  name: string;
  email: string;
  mobile?: string;
  company?: string;
  identificationNumber?: string;
}

// Step 5: Add all recipients at once (PATCH with array)
async function addRecipients(
  token: string,
  envelopeId: string,
  recipients: RecipientInput[]
): Promise<string[]> {
  const response = await fetchWithTimeout(`${DIGISIGN_API_URL}/envelopes/${envelopeId}/recipients`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(recipients),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Add recipients failed: ${error}`);
  }

  const data = await response.json();
  // Response is an array of recipient objects with ids
  return Array.isArray(data) ? data.map((r: { id: string }) => r.id) : [data.id];
}

// Step 6: Add signature tag by placeholder
async function addSignatureTag(
  token: string,
  envelopeId: string,
  recipientId: string,
  placeholder: string
): Promise<void> {
  const response = await fetchWithTimeout(`${DIGISIGN_API_URL}/envelopes/${envelopeId}/tags/by-placeholder`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recipient: `/api/envelopes/${envelopeId}/recipients/${recipientId}`,
      type: "signature",
      placeholder,
      positioning: "center",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Add tag failed: ${error}`);
  }
}

// Step 7: Send envelope
async function sendEnvelope(token: string, envelopeId: string): Promise<void> {
  const response = await fetchWithTimeout(`${DIGISIGN_API_URL}/envelopes/${envelopeId}/send`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Send envelope failed: ${error}`);
  }
}

// Generate PDF via our service
async function generateContractPdf(pdfGeneratorUrl: string, contractData: ContractData): Promise<ArrayBuffer> {
  const response = await fetchWithTimeout(`${pdfGeneratorUrl}/generate/contract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(contractData),
  }, 60000); // 60s for PDF generation

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PDF generation failed: ${error}`);
  }

  return response.arrayBuffer();
}

// Format date in Czech
function formatCzechDate(date: Date): string {
  const day = date.getDate();
  const months = [
    "ledna", "února", "března", "dubna", "května", "června",
    "července", "srpna", "září", "října", "listopadu", "prosince"
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}. ${month} ${year}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let leadId: string | null = null;
  let userId: string | null = null;

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Chybí autorizace" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Neplatná autorizace" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    userId = user.id;
    const { lead_id }: { lead_id: string } = await req.json();
    leadId = lead_id;

    if (!lead_id) {
      return new Response(
        JSON.stringify({ error: "Chybí lead_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get environment variables
    const DIGISIGN_ACCESS_KEY = Deno.env.get("DIGISIGN_ACCESS_KEY");
    const DIGISIGN_SECRET_KEY = Deno.env.get("DIGISIGN_SECRET_KEY");
    const PDF_GENERATOR_URL = Deno.env.get("PDF_GENERATOR_URL") || "http://188.245.148.53:8094";

    if (!DIGISIGN_ACCESS_KEY || !DIGISIGN_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: "DigiSign není nakonfigurováno (chybí DIGISIGN_ACCESS_KEY nebo DIGISIGN_SECRET_KEY)" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch lead data with all needed fields
    console.log("Fetching lead with ID:", lead_id);
    const { data: lead, error: leadError } = await supabaseAdmin
      .from("leads")
      .select(`
        id,
        company_name,
        ico,
        dic,
        billing_street,
        billing_city,
        billing_zip,
        contact_email,
        billing_email,
        website,
        court_name,
        court_file_number,
        onboarding_signatories,
        potential_services,
        digisign_id,
        estimated_price
      `)
      .eq("id", lead_id)
      .single();

    console.log("Lead query result:", { lead: lead ? "found" : "not found", error: leadError });

    if (leadError || !lead) {
      console.error("Lead not found. Error:", leadError, "Lead ID:", lead_id);
      return new Response(
        JSON.stringify({ error: "Lead nenalezen", details: leadError?.message, lead_id }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Idempotency check - prevent duplicate envelope creation
    if (lead.digisign_id) {
      return new Response(
        JSON.stringify({
          error: "Smlouva již byla vytvořena",
          digisign_id: lead.digisign_id
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate required fields
    const signatories: Signatory[] = lead.onboarding_signatories || [];
    if (signatories.length === 0) {
      return new Response(
        JSON.stringify({ error: "Chybí podpisující osoby (onboarding_signatories)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate all signatories have email (DigiSign requires email for all recipients)
    const signatoriesWithoutEmail = signatories.filter(s => !s.email || s.email.trim() === '');
    if (signatoriesWithoutEmail.length > 0) {
      const missingNames = signatoriesWithoutEmail.map(s => s.name || 'Neznámé jméno').join(', ');
      return new Response(
        JSON.stringify({
          error: `Následující podpisující osoby nemají vyplněný e-mail: ${missingNames}`,
          missing_email_signatories: signatoriesWithoutEmail.map(s => s.name),
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate all signatories have phone numbers (DigiSign requires mobile for all recipients)
    const signatoriesWithoutPhone = signatories.filter(s => !s.phone || s.phone.trim() === '');
    if (signatoriesWithoutPhone.length > 0) {
      const missingNames = signatoriesWithoutPhone.map(s => s.name).join(', ');
      return new Response(
        JSON.stringify({
          error: `Následující podpisující osoby nemají vyplněný telefon (DigiSign vyžaduje telefon pro všechny podepisující): ${missingNames}`,
          missing_phone_signatories: signatoriesWithoutPhone.map(s => s.name),
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build billing address
    const billingAddress = [lead.billing_street, lead.billing_city, lead.billing_zip]
      .filter(Boolean)
      .join(", ");

    // Build products string from potential_services
    // potential_services is a JSONB array of LeadService objects with { name, price, billing_type, ... }
    const services = lead.potential_services || [];

    // Validate services exist
    if (services.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nelze vytvořit smlouvu bez služeb" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const products = services.map((s: { name: string }) => s.name).join(", ");

    // Calculate monthly fee from services (sum of monthly billing_type services)
    const monthlyFee = services
      .filter((s: { billing_type: string }) => s.billing_type === 'monthly')
      .reduce((sum: number, s: { price: number }) => sum + (s.price || 0), 0);

    // Calculate one-off fee (sum of one_off billing_type services)
    const setupFee = services
      .filter((s: { billing_type: string }) => s.billing_type === 'one_off')
      .reduce((sum: number, s: { price: number }) => sum + (s.price || 0), 0);

    // Validate monthly fee is present (required), setup fee is optional
    if (monthlyFee <= 0) {
      return new Response(
        JSON.stringify({ error: "Smlouva musí obsahovat měsíční poplatek" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare contract data for PDF generation
    const contractData: ContractData = {
      company_name: lead.company_name || "",
      billing_address: billingAddress,
      ico: lead.ico || "",
      dic: lead.dic || null,
      court_name: lead.court_name || "Městským soudem v Praze",
      court_file_number: lead.court_file_number || "",
      signatories,
      website_url: lead.website || "",
      additional_emails: lead.contact_email || "",
      invoice_email: lead.billing_email || lead.contact_email || "",
      monthly_fee: monthlyFee,
      setup_fee: setupFee,
      contract_date: formatCzechDate(new Date()),
      products,
    };

    // Step 1: Generate PDF
    console.log("Generating PDF...");
    const pdfBuffer = await generateContractPdf(PDF_GENERATOR_URL, contractData);
    console.log(`PDF generated, size: ${pdfBuffer.byteLength} bytes`);

    // Step 2: Get DigiSign auth token
    console.log("Getting DigiSign auth token...");
    const digisignToken = await getAuthToken(DIGISIGN_ACCESS_KEY, DIGISIGN_SECRET_KEY);

// Step 3: Create envelope
  console.log("Creating envelope...");
  const envelopeName = `Smlouva o spolupráci - ${lead.company_name}`;
  const emailBody = `Dobrý den,\n\nprosím o podpis přiložené smlouvy o spolupráci mezi společností ${lead.company_name} a Socials s.r.o.\n\nDěkujeme,\nSocials`;
  const { envelopeId, selfLink } = await createEnvelope(digisignToken, envelopeName, emailBody);
  console.log(`Envelope created: ${envelopeId}`);

    // Note: We do NOT save digisign_id here to avoid race conditions.
    // If subsequent steps fail, we don't want the lead marked as having a contract.
    // The digisign_id will be saved after the envelope is fully sent.

    // Step 4: Upload PDF
    console.log("Uploading PDF...");
    const filename = `smlouva-${lead_id}.pdf`;
    const fileId = await uploadFile(digisignToken, pdfBuffer, filename);
    console.log(`File uploaded: ${fileId}`);

    // Step 5: Attach document
    console.log("Attaching document...");
    await attachDocument(digisignToken, envelopeId, fileId, "Smlouva o spolupráci");
    console.log("Document attached");

    // Step 6: Add all recipients at once
    console.log("Adding recipients...");
    
    // Build recipients array: Socials first, then client signatories
    const recipientsData: RecipientInput[] = [
      {
        role: "signer",
        signatureType: "simple",
        name: "Daniel Bauer",
        email: "danny@socials.cz",
        mobile: "+420774536699",
        company: "Socials Advertising s.r.o.",
        identificationNumber: "08186464",
      },
      ...signatories.map((signatory) => ({
        role: "signer",
        signatureType: "simple",
        name: signatory.name,
        email: signatory.email,
        mobile: signatory.phone!.trim(),
        company: lead.company_name || undefined,
        identificationNumber: lead.ico || undefined,
      })),
    ];

    const recipientIds = await addRecipients(digisignToken, envelopeId, recipientsData);
    console.log(`Added ${recipientIds.length} recipients`);

    // Add signature tags for each recipient
    for (let i = 0; i < recipientIds.length; i++) {
      await addSignatureTag(digisignToken, envelopeId, recipientIds[i], `PODPIS${i + 1}`);
    }

    // Step 7: Send envelope
    console.log("Sending envelope...");
    await sendEnvelope(digisignToken, envelopeId);
    console.log("Envelope sent!");

    // Now that envelope is fully created and sent, save to database
    // This prevents race conditions where digisign_id is saved but envelope creation fails
    // DigiSign provides direct envelope URL in selfcare
    const contractUrl = `https://app.digisign.org/selfcare/envelope/${envelopeId}`;

    const { error: updateError } = await supabaseAdmin
      .from("leads")
      .update({
        digisign_id: envelopeId,
        contract_created_at: new Date().toISOString(),
        contract_url: contractUrl,
      })
      .eq("id", lead_id);

    if (updateError) {
      // Envelope was sent successfully but DB update failed
      // Log this critical error - manual intervention may be needed
      console.error("CRITICAL: Envelope sent but DB update failed:", updateError);
      console.error(`Envelope ID: ${envelopeId}, Lead ID: ${lead_id}`);
      // We still return success since the envelope was sent
      // The digisign_id can be manually added later
    }

    const durationMs = Date.now() - startTime;

    // Log successful integration call
    await supabaseAdmin.from("integration_log").insert({
      service: "digisign",
      action: "create_contract",
      related_table: "leads",
      related_record_id: leadId,
      request_payload: { contractData, signatories_count: signatories.length },
      response_payload: { envelopeId },
      response_status: 200,
      is_success: true,
      triggered_by: userId,
      duration_ms: durationMs,
    });

    return new Response(
      JSON.stringify({
        success: true,
        digisign_id: envelopeId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Interní chyba serveru";

    // Log error
    try {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await supabaseAdmin.from("integration_log").insert({
        service: "digisign",
        action: "create_contract",
        related_table: "leads",
        related_record_id: leadId,
        is_success: false,
        error_message: errorMessage,
        triggered_by: userId,
        duration_ms: durationMs,
      });
    } catch (logError) {
      console.error("Failed to log integration error:", logError);
    }

    console.error("DigiSign create contract error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
