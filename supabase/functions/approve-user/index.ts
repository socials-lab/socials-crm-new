import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Check that user doesn't already have an active role
    const { data: existingRole } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", user_id)
      .eq("is_active", true)
      .single();

    if (existingRole) {
      return new Response(
        JSON.stringify({ error: "Uživatel již má přiřazenou aktivní roli" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Approving user: ${profile.email} (${user_id}) with role: ${role}`);

    // Update the profile name if it differs
    if (full_name !== profile.full_name) {
      await supabaseAdmin
        .from("profiles")
        .update({ full_name })
        .eq("id", user_id);
    }

    // Create the user_roles entry
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id,
        role,
        is_super_admin: false,
        is_active: true,
      });

    if (roleError) {
      console.error("Role assignment error:", roleError);
      return new Response(
        JSON.stringify({ error: "Nepodařilo se přiřadit roli: " + roleError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Role ${role} assigned to user ${user_id}`);

    // Create colleague record linked to the profile
    const { error: colleagueError } = await supabaseAdmin
      .from("colleagues")
      .insert({
        email: profile.email,
        full_name,
        position,
        status: "active",
        seniority: seniority || "mid",
        phone: phone || null,
        notes: notes || "",
        is_freelancer: is_freelancer || false,
        internal_hourly_cost: internal_hourly_cost || 0,
        monthly_fixed_cost: monthly_fixed_cost || null,
        capacity_hours_per_month: capacity_hours_per_month || null,
        profile_id: user_id,
      });

    if (colleagueError) {
      console.error("Colleague creation error:", colleagueError);
      return new Response(
        JSON.stringify({ error: "Role přiřazena, ale nepodařilo se vytvořit kolegu: " + colleagueError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Colleague created and linked to profile for ${profile.email}`);

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
