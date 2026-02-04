import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Check if caller is admin
    const { data: callerRole } = await supabaseAdmin
      .from("user_roles")
      .select("is_super_admin, role")
      .eq("user_id", caller.id)
      .eq("is_active", true)
      .single();

    if (!callerRole?.is_super_admin && callerRole?.role !== "admin") {
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

    console.log(`Inviting user: ${email} with role: ${role}`);

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

    // Pre-create colleague record with all provided data AND link to profile
    // We set profile_id directly since the invite already created the user/profile
    const { error: colleagueError } = await supabaseAdmin
      .from("colleagues")
      .insert({
        email,
        full_name: fullName,
        position: position || "Team Member",
        status: "active",
        seniority: seniority || "mid",
        phone: phone || null,
        notes: notes || "",
        is_freelancer: is_freelancer || false,
        internal_hourly_cost: internal_hourly_cost || 0,
        monthly_fixed_cost: monthly_fixed_cost || null,
        capacity_hours_per_month: capacity_hours_per_month || null,
        profile_id: inviteData.user.id, // Link colleague to user profile directly
      });

    if (colleagueError) {
      console.error("Colleague creation error:", colleagueError);
      return new Response(
        JSON.stringify({ error: "Nepodařilo se vytvořit kolegu: " + colleagueError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Colleague created and linked to profile for ${email}`);

    // Pre-assign role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: inviteData.user.id,
        role: role,
        is_super_admin: false,
        is_active: true,
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
