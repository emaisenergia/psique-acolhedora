import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuthRequest {
  action: "get_auth_url" | "exchange_code" | "refresh_token" | "disconnect" | "status";
  code?: string;
  redirect_uri?: string;
}

const getSupabaseClient = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseServiceKey);
};

const getUserIdFromRequest = async (req: Request): Promise<string | null> => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  const token = authHeader.replace("Bearer ", "");
  const supabase = getSupabaseClient();
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  
  return user.id;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { action, code, redirect_uri }: AuthRequest = await req.json();
    const supabase = getSupabaseClient();

    switch (action) {
      case "get_auth_url": {
        if (!redirect_uri) {
          return new Response(
            JSON.stringify({ error: "redirect_uri is required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const scopes = [
          "https://www.googleapis.com/auth/calendar.events",
          "https://www.googleapis.com/auth/calendar.readonly",
        ];

        const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID!);
        authUrl.searchParams.set("redirect_uri", redirect_uri);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("scope", scopes.join(" "));
        authUrl.searchParams.set("access_type", "offline");
        authUrl.searchParams.set("prompt", "consent");
        authUrl.searchParams.set("state", userId);

        return new Response(
          JSON.stringify({ auth_url: authUrl.toString() }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "exchange_code": {
        if (!code || !redirect_uri) {
          return new Response(
            JSON.stringify({ error: "code and redirect_uri are required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Exchange code for tokens
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID!,
            client_secret: GOOGLE_CLIENT_SECRET!,
            code,
            redirect_uri,
            grant_type: "authorization_code",
          }),
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
          console.error("Token exchange error:", tokenData);
          return new Response(
            JSON.stringify({ error: tokenData.error_description || "Failed to exchange code" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

        // Save tokens to database
        const { error: upsertError } = await supabase
          .from("google_calendar_tokens")
          .upsert({
            user_id: userId,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            token_expires_at: expiresAt.toISOString(),
            sync_enabled: true,
          }, { onConflict: "user_id" });

        if (upsertError) {
          console.error("Failed to save tokens:", upsertError);
          return new Response(
            JSON.stringify({ error: "Failed to save tokens" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        console.log(`Google Calendar connected for user ${userId}`);

        return new Response(
          JSON.stringify({ success: true, message: "Google Calendar connected successfully" }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "refresh_token": {
        const { data: tokenData, error: tokenError } = await supabase
          .from("google_calendar_tokens")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (tokenError || !tokenData) {
          return new Response(
            JSON.stringify({ error: "No tokens found" }),
            { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID!,
            client_secret: GOOGLE_CLIENT_SECRET!,
            refresh_token: tokenData.refresh_token,
            grant_type: "refresh_token",
          }),
        });

        const refreshData = await refreshResponse.json();

        if (refreshData.error) {
          console.error("Token refresh error:", refreshData);
          return new Response(
            JSON.stringify({ error: refreshData.error_description || "Failed to refresh token" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const expiresAt = new Date(Date.now() + (refreshData.expires_in * 1000));

        await supabase
          .from("google_calendar_tokens")
          .update({
            access_token: refreshData.access_token,
            token_expires_at: expiresAt.toISOString(),
          })
          .eq("user_id", userId);

        return new Response(
          JSON.stringify({ success: true, access_token: refreshData.access_token }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "disconnect": {
        const { error: deleteError } = await supabase
          .from("google_calendar_tokens")
          .delete()
          .eq("user_id", userId);

        if (deleteError) {
          console.error("Failed to disconnect:", deleteError);
          return new Response(
            JSON.stringify({ error: "Failed to disconnect" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: "Google Calendar disconnected" }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "status": {
        const { data: tokenData, error: tokenError } = await supabase
          .from("google_calendar_tokens")
          .select("sync_enabled, token_expires_at, updated_at")
          .eq("user_id", userId)
          .single();

        if (tokenError || !tokenData) {
          return new Response(
            JSON.stringify({ connected: false }),
            { headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        return new Response(
          JSON.stringify({
            connected: true,
            sync_enabled: tokenData.sync_enabled,
            last_sync: tokenData.updated_at,
          }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
    }
  } catch (error: unknown) {
    console.error("Error in google-calendar-auth:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
