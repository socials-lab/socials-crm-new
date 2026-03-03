import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_ROLES = ['admin', 'management', 'project_manager', 'specialist', 'finance', 'client'] as const;
const SENIORITIES = ['junior', 'mid', 'senior', 'partner'] as const;

function toNullableNumber(v: unknown): number | null {
  if (v === '' || v === undefined || v === null) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function toBoolean(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (v === 'true' || v === 1) return true;
  return false;
}

interface ApproveRequest {
  user_id: string;
  role: string;
  full_name: string;
  position: string;
  seniority?: string;
  phone?: string;
  notes?: string;
  is_freelancer?: boolean;
  internal_hourly_cost?: number;
  monthly_fixed_cost?: number;
  capacity_hours_per_month?: number;
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

    // Verify the caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Chybí autorizace" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: "Neplatná autorizace" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if caller is admin or super_admin
    const { data: callerRole } = await supabaseAdmin
      .from("user_roles")
      .select("is_super_admin, role")
      .eq("user_id", caller.id)
      .eq("is_active", true)
      .single();

    if (!callerRole?.is_super_admin && callerRole?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Nemáte oprávnění schvalovat uživatele" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      user_id,
      role,
      full_name,
      position,
      seniority,
      phone,
      notes,
      is_freelancer,
      internal_hourly_cost,
      monthly_fixed_cost,
      capacity_hours_per_month,
    }: ApproveRequest = await req.json();

    // Validate required fields
    const missingFields: string[] = [];
    if (!user_id) missingFields.push("user_id");
    if (!role) missingFields.push("role");
    if (!full_name) missingFields.push("full_name (jméno)");
    if (!position) missingFields.push("position (pozice)");

    if (missingFields.length > 0) {
      console.error("Missing fields:", missingFields);
      return new Response(
        JSON.stringify({ error: `Chybí povinná pole: ${missingFields.join(", ")}`, missingFields }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const roleNorm = String(role).toLowerCase();
    if (!APP_ROLES.includes(roleNorm as typeof APP_ROLES[number])) {
      return new Response(
        JSON.stringify({ error: `Neplatná role: ${role}. Povolené: ${APP_ROLES.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const seniorityNorm = seniority ? String(seniority).toLowerCase() : 'mid';
    if (!SENIORITIES.includes(seniorityNorm as typeof SENIORITIES[number])) {
      return new Response(
        JSON.stringify({ error: `Neplatná seniorita: ${seniority}. Povolené: ${SENIORITIES.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the profile exists
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name")
      .eq("id", user_id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Uživatelský profil nebyl nalezen" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for existing role (active or inactive - UNIQUE(user_id) means at most one row)
    const { data: existingRole } = await supabaseAdmin
      .from("user_roles")
      .select("id, is_active")
      .eq("user_id", user_id)
      .maybeSingle();

    if (existingRole?.is_active) {
      return new Response(
        JSON.stringify({ error: "Uživatel již má přiřazenou aktivní roli" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Approving user: ${profile.email} (${user_id}) with role: ${roleNorm}`);

    // Update the profile name if it differs
    if (full_name !== profile.full_name) {
      await supabaseAdmin
        .from("profiles")
        .update({ full_name })
        .eq("id", user_id);
    }

    // Upsert user_roles: update if row exists (inactive), insert if not
    const rolePayload = { role: roleNorm, is_super_admin: false, is_active: true };
    const { error: roleError } = existingRole
      ? await supabaseAdmin.from("user_roles").update(rolePayload).eq("id", existingRole.id)
      : await supabaseAdmin.from("user_roles").insert({ user_id, ...rolePayload });

    if (roleError) {
      console.error("Role assignment error:", roleError);
      return new Response(
        JSON.stringify({ error: "Nepodařilo se přiřadit roli: " + roleError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Role ${role} assigned to user ${user_id}`);

    // Reuse existing colleague by email/profile when present to avoid duplicates.
    const normalizedEmail = profile.email.trim().toLowerCase();
    const { data: colleaguesByEmail, error: colleaguesByEmailError } = await supabaseAdmin
      .from("colleagues")
      .select("id, profile_id")
      .ilike("email", normalizedEmail);

    if (colleaguesByEmailError) {
      console.error("Colleagues-by-email query error:", colleaguesByEmailError);
      return new Response(
        JSON.stringify({ error: "Role přiřazena, ale nepodařilo se načíst kolegy podle emailu: " + colleaguesByEmailError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: colleaguesByProfile, error: colleaguesByProfileError } = await supabaseAdmin
      .from("colleagues")
      .select("id")
      .eq("profile_id", user_id);

    if (colleaguesByProfileError) {
      console.error("Colleagues-by-profile query error:", colleaguesByProfileError);
      return new Response(
        JSON.stringify({ error: "Role přiřazena, ale nepodařilo se načíst kolegy podle profilu: " + colleaguesByProfileError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if ((colleaguesByEmail?.length || 0) > 1) {
      return new Response(
        JSON.stringify({ error: "Nalezeno více kolegů se stejným emailem. Nejprve opravte duplicity v databázi." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if ((colleaguesByProfile?.length || 0) > 1) {
      return new Response(
        JSON.stringify({ error: "Nalezeno více kolegů napojených na stejný profil. Nejprve opravte duplicity v databázi." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const colleagueByEmail = colleaguesByEmail?.[0];
    const colleagueByProfile = colleaguesByProfile?.[0];

    if (colleagueByEmail && colleagueByProfile && colleagueByEmail.id !== colleagueByProfile.id) {
      return new Response(
        JSON.stringify({ error: "Konflikt vazeb kolegy (email vs. profil). Nejprve opravte data v databázi." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const internalCost = toNullableNumber(internal_hourly_cost);
    const monthlyCost = toNullableNumber(monthly_fixed_cost);
    const capacityHours = toNullableNumber(capacity_hours_per_month);

    const colleaguePayload = {
      email: normalizedEmail,
      full_name,
      position,
      status: "active",
      seniority: seniorityNorm,
      phone: (phone && String(phone).trim()) || null,
      notes: notes ? String(notes) : "",
      is_freelancer: toBoolean(is_freelancer),
      internal_hourly_cost: internalCost ?? 0,
      monthly_fixed_cost: monthlyCost,
      capacity_hours_per_month: capacityHours,
      profile_id: user_id,
    };

    const targetColleagueId = colleagueByEmail?.id || colleagueByProfile?.id;
    const colleagueMutation = targetColleagueId
      ? await supabaseAdmin.from("colleagues").update(colleaguePayload).eq("id", targetColleagueId)
      : await supabaseAdmin.from("colleagues").insert(colleaguePayload);
    const colleagueError = colleagueMutation.error;

    if (colleagueError) {
      console.error("Colleague upsert error:", colleagueError);
      return new Response(
        JSON.stringify({ error: "Role přiřazena, ale nepodařilo se vytvořit nebo aktualizovat kolegu: " + colleagueError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`${targetColleagueId ? "Colleague updated" : "Colleague created"} and linked to profile for ${profile.email}`);

    // Create access_granted notification
    try {
      await supabaseAdmin.from("notifications").insert({
        user_id,
        type: "access_granted",
        title: "Vítejte v CRM!",
        message: `Byl vám udělen přístup do systému s rolí: ${role}.`,
        link: "/",
        metadata: { role },
      });
    } catch (notifError) {
      console.error("Failed to create notification:", notifError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Uživatel byl úspěšně schválen",
        userId: user_id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in approve-user function:", error);
    const errorMessage = error instanceof Error ? error.message : "Interní chyba serveru";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
