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

interface InviteRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  position?: string;
  seniority?: string;
  phone?: string;
  notes?: string;
  is_freelancer?: boolean;
  internal_hourly_cost?: number;
  monthly_fixed_cost?: number;
  capacity_hours_per_month?: number;
  invoice_display_name?: string | null;
  invoice_currency?: string;
  colleague_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify the caller is an admin
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

    // Check if caller is admin/management
    const { data: callerRole } = await supabaseAdmin
      .from("user_roles")
      .select("is_super_admin, role")
      .eq("user_id", caller.id)
      .eq("is_active", true)
      .single();

    const hasInvitePermission =
      callerRole?.is_super_admin === true
      || callerRole?.role === "admin"
      || callerRole?.role === "management";

    if (!hasInvitePermission) {
      return new Response(
        JSON.stringify({ error: "Nemáte oprávnění přidávat uživatele" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { 
      email, 
      firstName, 
      lastName, 
      role, 
      position,
      seniority,
      phone,
      notes,
      is_freelancer,
      internal_hourly_cost,
      monthly_fixed_cost,
      capacity_hours_per_month,
      invoice_display_name,
      invoice_currency,
    }: InviteRequest = await req.json();

    // Validate required fields with specific error messages
    // Note: lastName is optional - single-name users are allowed
    const missingFields: string[] = [];
    if (!email) missingFields.push('email');
    if (!firstName) missingFields.push('firstName (jméno)');
    if (!role) missingFields.push('role');
    
    if (missingFields.length > 0) {
      console.error("Missing fields:", missingFields, "Received data:", { email, firstName, lastName, role });
      return new Response(
        JSON.stringify({ 
          error: `Chybí povinná pole: ${missingFields.join(', ')}`,
          missingFields 
        }),
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

    console.log(`Inviting user: ${email} with role: ${roleNorm}`);

    // Check if user already exists in auth.users
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "Uživatel s tímto emailem již existuje" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get origin for redirect URL
    const origin = req.headers.get("origin") || "https://empndmpeyrdycjdesoxr.lovable.app";

    // Build full name (handle single-name users)
    const fullName = lastName ? `${firstName} ${lastName}` : firstName;
    
    // Invite user using Supabase Admin API
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          full_name: fullName,
        },
        redirectTo: `${origin}/auth/callback`,
      }
    );

    if (inviteError) {
      console.error("Invite error:", inviteError);
      return new Response(
        JSON.stringify({ error: inviteError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`User invited successfully, ID: ${inviteData.user.id}`);

    // Reuse existing colleague by email/profile when present to avoid duplicates.
    const normalizedEmail = email.trim().toLowerCase();
    const { data: colleaguesByEmail, error: colleaguesByEmailError } = await supabaseAdmin
      .from("colleagues")
      .select("id, profile_id")
      .ilike("email", normalizedEmail);

    if (colleaguesByEmailError) {
      console.error("Colleagues-by-email query error:", colleaguesByEmailError);
      return new Response(
        JSON.stringify({ error: "Nepodařilo se načíst kolegy podle emailu: " + colleaguesByEmailError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: colleaguesByProfile, error: colleaguesByProfileError } = await supabaseAdmin
      .from("colleagues")
      .select("id")
      .eq("profile_id", inviteData.user.id);

    if (colleaguesByProfileError) {
      console.error("Colleagues-by-profile query error:", colleaguesByProfileError);
      return new Response(
        JSON.stringify({ error: "Nepodařilo se načíst kolegy podle profilu: " + colleaguesByProfileError.message }),
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
      full_name: fullName,
      position: position || "Team Member",
      status: "active",
      seniority: seniorityNorm,
      phone: (phone && String(phone).trim()) || null,
      notes: notes ? String(notes) : "",
      is_freelancer: toBoolean(is_freelancer),
      internal_hourly_cost: internalCost ?? 0,
      monthly_fixed_cost: monthlyCost,
      capacity_hours_per_month: capacityHours,
      invoice_display_name: (invoice_display_name && String(invoice_display_name).trim()) || null,
      invoice_currency: (invoice_currency && String(invoice_currency).toUpperCase() === 'EUR') ? 'EUR' : 'CZK',
      profile_id: inviteData.user.id,
    };

    const targetColleagueId = colleagueByEmail?.id || colleagueByProfile?.id;
    const colleagueMutation = targetColleagueId
      ? await supabaseAdmin.from("colleagues").update(colleaguePayload).eq("id", targetColleagueId)
      : await supabaseAdmin.from("colleagues").insert(colleaguePayload);
    const colleagueError = colleagueMutation.error;

    if (colleagueError) {
      console.error("Colleague upsert error:", colleagueError);
      return new Response(
        JSON.stringify({ error: "Nepodařilo se vytvořit nebo aktualizovat kolegu: " + colleagueError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`${targetColleagueId ? "Colleague updated" : "Colleague created"} and linked to profile for ${email}`);

    // Pre-assign role (invited users are new - no existing user_roles row)
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: inviteData.user.id,
        role: roleNorm,
        is_super_admin: false,
        is_active: true,
        can_see_financials: false,
        page_permissions: [
          {
            page: 'my-work',
            can_view: true,
            can_edit: false,
          },
          {
            page: 'sop',
            can_view: true,
            can_edit: false,
          },
          {
            page: 'bug-reports',
            can_view: true,
            can_edit: false,
          },
        ],
      });

    if (roleError) {
      console.error("Role assignment error:", roleError);
      return new Response(
        JSON.stringify({ error: "Pozvánka odeslána, ale nepodařilo se přiřadit roli" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Role ${role} assigned to user ${inviteData.user.id}`);

    // Create access_granted notification for the invited user
    try {
      await supabaseAdmin.from("notifications").insert({
        user_id: inviteData.user.id,
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
        message: "Pozvánka úspěšně odeslána",
        userId: inviteData.user.id
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in invite-user function:", error);
    const errorMessage = error instanceof Error ? error.message : "Interní chyba serveru";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
