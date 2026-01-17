import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ActionRequest {
  action: "validate" | "confirm" | "cancel" | "reschedule" | "generate_tokens";
  token?: string;
  appointment_id?: string;
  new_date_time?: string;
  reason?: string;
}

const getSupabaseClient = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseServiceKey);
};

const generateSecureToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, "0")).join("");
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, token, appointment_id, new_date_time, reason }: ActionRequest = await req.json();
    const supabase = getSupabaseClient();

    switch (action) {
      case "generate_tokens": {
        if (!appointment_id) {
          return new Response(
            JSON.stringify({ error: "appointment_id is required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Generate tokens for each action type
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        const actionTypes = ["confirm", "cancel", "reschedule"] as const;
        const tokens: Record<string, string> = {};

        for (const actionType of actionTypes) {
          const newToken = generateSecureToken();
          
          // Delete existing token of same type for this appointment
          await supabase
            .from("appointment_action_tokens")
            .delete()
            .eq("appointment_id", appointment_id)
            .eq("action_type", actionType);

          // Create new token
          const { error } = await supabase
            .from("appointment_action_tokens")
            .insert({
              appointment_id,
              token: newToken,
              action_type: actionType,
              expires_at: expiresAt.toISOString(),
            });

          if (error) {
            console.error(`Failed to generate ${actionType} token:`, error);
            continue;
          }

          tokens[actionType] = newToken;
        }

        console.log(`Generated action tokens for appointment ${appointment_id}`);

        return new Response(
          JSON.stringify({ success: true, tokens, expires_at: expiresAt.toISOString() }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "validate": {
        if (!token) {
          return new Response(
            JSON.stringify({ error: "token is required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const { data: tokenData, error: tokenError } = await supabase
          .from("appointment_action_tokens")
          .select(`
            *,
            appointments!inner (
              id,
              date_time,
              duration_minutes,
              mode,
              status,
              service,
              patients:patient_id (id, name, email, phone)
            )
          `)
          .eq("token", token)
          .gt("expires_at", new Date().toISOString())
          .is("used_at", null)
          .single();

        if (tokenError || !tokenData) {
          return new Response(
            JSON.stringify({ error: "Invalid or expired token", valid: false }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        return new Response(
          JSON.stringify({
            valid: true,
            action_type: tokenData.action_type,
            appointment: tokenData.appointments,
            expires_at: tokenData.expires_at,
          }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "confirm": {
        if (!token) {
          return new Response(
            JSON.stringify({ error: "token is required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Get token and validate
        const { data: tokenData, error: tokenError } = await supabase
          .from("appointment_action_tokens")
          .select("*, appointments!inner (id, status)")
          .eq("token", token)
          .eq("action_type", "confirm")
          .gt("expires_at", new Date().toISOString())
          .is("used_at", null)
          .single();

        if (tokenError || !tokenData) {
          return new Response(
            JSON.stringify({ error: "Invalid or expired token" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Update appointment status
        const { error: updateError } = await supabase
          .from("appointments")
          .update({ status: "confirmed" })
          .eq("id", tokenData.appointment_id);

        if (updateError) {
          return new Response(
            JSON.stringify({ error: "Failed to confirm appointment" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Mark token as used
        await supabase
          .from("appointment_action_tokens")
          .update({ used_at: new Date().toISOString() })
          .eq("id", tokenData.id);

        console.log(`Appointment ${tokenData.appointment_id} confirmed via token`);

        return new Response(
          JSON.stringify({ success: true, message: "Sessão confirmada com sucesso!" }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "cancel": {
        if (!token) {
          return new Response(
            JSON.stringify({ error: "token is required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Get token and validate
        const { data: tokenData, error: tokenError } = await supabase
          .from("appointment_action_tokens")
          .select("*, appointments!inner (id, status)")
          .eq("token", token)
          .eq("action_type", "cancel")
          .gt("expires_at", new Date().toISOString())
          .is("used_at", null)
          .single();

        if (tokenError || !tokenData) {
          return new Response(
            JSON.stringify({ error: "Invalid or expired token" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Update appointment status
        const { error: updateError } = await supabase
          .from("appointments")
          .update({ 
            status: "cancelled",
            notes: reason ? `Cancelado pelo paciente: ${reason}` : "Cancelado pelo paciente via link"
          })
          .eq("id", tokenData.appointment_id);

        if (updateError) {
          return new Response(
            JSON.stringify({ error: "Failed to cancel appointment" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Mark token as used
        await supabase
          .from("appointment_action_tokens")
          .update({ used_at: new Date().toISOString() })
          .eq("id", tokenData.id);

        console.log(`Appointment ${tokenData.appointment_id} cancelled via token`);

        return new Response(
          JSON.stringify({ success: true, message: "Sessão cancelada. Entre em contato para reagendar." }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "reschedule": {
        if (!token || !new_date_time) {
          return new Response(
            JSON.stringify({ error: "token and new_date_time are required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Get token and validate
        const { data: tokenData, error: tokenError } = await supabase
          .from("appointment_action_tokens")
          .select("*, appointments!inner (id, status, date_time)")
          .eq("token", token)
          .eq("action_type", "reschedule")
          .gt("expires_at", new Date().toISOString())
          .is("used_at", null)
          .single();

        if (tokenError || !tokenData) {
          return new Response(
            JSON.stringify({ error: "Invalid or expired token" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Check for conflicts
        const newDateTime = new Date(new_date_time);
        const { data: conflictingAppts } = await supabase
          .from("appointments")
          .select("id")
          .eq("date_time", newDateTime.toISOString())
          .neq("id", tokenData.appointment_id)
          .neq("status", "cancelled");

        if (conflictingAppts && conflictingAppts.length > 0) {
          return new Response(
            JSON.stringify({ error: "Horário indisponível. Escolha outro horário." }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Update appointment
        const { error: updateError } = await supabase
          .from("appointments")
          .update({ 
            date_time: newDateTime.toISOString(),
            status: "scheduled",
            notes: `Reagendado pelo paciente. Anterior: ${tokenData.appointments.date_time}`
          })
          .eq("id", tokenData.appointment_id);

        if (updateError) {
          return new Response(
            JSON.stringify({ error: "Failed to reschedule appointment" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Mark token as used
        await supabase
          .from("appointment_action_tokens")
          .update({ used_at: new Date().toISOString() })
          .eq("id", tokenData.id);

        console.log(`Appointment ${tokenData.appointment_id} rescheduled via token`);

        return new Response(
          JSON.stringify({ success: true, message: "Sessão reagendada com sucesso!" }),
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
    console.error("Error in appointment-actions:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
