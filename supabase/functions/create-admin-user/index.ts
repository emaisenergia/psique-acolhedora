import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation helpers
const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 255;
};

const isValidPassword = (password: string): boolean => {
  return typeof password === "string" && password.length >= 8 && password.length <= 128;
};

const sanitizeString = (str: string, maxLength = 200): string => {
  return String(str).trim().slice(0, maxLength);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { email, password, name, role } = body;
    const targetRole = role || "admin";

    // Validate required fields
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate password strength
    if (!isValidPassword(password)) {
      return new Response(
        JSON.stringify({ error: "Password must be between 8 and 128 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sanitizedName = name ? sanitizeString(name, 100) : email.split("@")[0];

    // Use service role key to create users
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Create user in auth.users
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: sanitizedName },
    });

    if (userError) {
      console.error("Error creating user:", userError);
      return new Response(
        JSON.stringify({ error: userError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = userData.user.id;

    if (targetRole === "patient") {
      // Add patient role only
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role: "patient" });

      if (roleError) {
        console.error("Error adding patient role:", roleError);
      }

      console.log(`Patient user created successfully: ${userId}`);
    } else {
      // Add admin role
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" });

      if (roleError) {
        console.error("Error adding role:", roleError);
      }

      // Also add psychologist role for full access
      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role: "psychologist" });

      // Create admin profile
      const { error: profileError } = await supabaseAdmin
        .from("admin_profiles")
        .insert({
          user_id: userId,
          name: sanitizedName,
          phone: null,
          credential: null,
          bio: null,
          timezone: "America/Sao_Paulo",
        });

      if (profileError) {
        console.error("Error creating profile:", profileError);
      }

      console.log(`Admin user created successfully: ${userId}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${targetRole} user created successfully`,
        user: { id: userId },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
