import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AISummaryRequest {
  meeting_id: string;
  transcript?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

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

    const { meeting_id, transcript }: AISummaryRequest = await req.json();
    
    if (!meeting_id) {
      return new Response(
        JSON.stringify({ error: "Chybí meeting_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch meeting
    const { data: meeting, error: meetingError } = await supabaseAdmin
      .from("meetings")
      .select("*")
      .eq("id", meeting_id)
      .single();

    if (meetingError || !meeting) {
      return new Response(
        JSON.stringify({ error: "Meeting nenalezen" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use provided transcript or meeting transcript
    const meetingTranscript = transcript || meeting.transcript || meeting.notes || meeting.agenda || "";

    if (!meetingTranscript.trim()) {
      return new Response(
        JSON.stringify({ error: "Meeting nemá žádný text k shrnutí" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get AI API key (prefer Anthropic, fallback to OpenAI)
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!ANTHROPIC_API_KEY && !OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI není nakonfigurováno" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare prompt
    const prompt = `Jste asistent pro shrnutí meetingů. Shrňte následující meeting transcript.

Zahrňte:
1. Klíčová témata diskutovaná na meetingu
2. Rozhodnutí, která byla učiněna
3. Akční body s přiřazenými osobami (pokud jsou zmíněny)
4. Další kroky

Transcript:
${meetingTranscript}

Shrnutí:`;

    let summary = "";

    // Use Anthropic Claude if available, otherwise OpenAI
    if (ANTHROPIC_API_KEY) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-sonnet-20240229",
          max_tokens: 2000,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API error: ${errorText}`);
      }

      const data = await response.json();
      summary = data.content[0].text;
    } else if (OPENAI_API_KEY) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "Jste asistent pro shrnutí meetingů. Shrňte meeting transcripty stručně a přehledně.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${errorText}`);
      }

      const data = await response.json();
      summary = data.choices[0].message.content;
    }

    // Update meeting with AI summary
    const { error: updateError } = await supabaseAdmin
      .from("meetings")
      .update({
        ai_summary: summary,
      })
      .eq("id", meeting_id);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Shrnutí vygenerováno, ale nepodařilo se uložit" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        summary,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI generate summary error:", error);
    const errorMessage = error instanceof Error ? error.message : "Interní chyba serveru";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
