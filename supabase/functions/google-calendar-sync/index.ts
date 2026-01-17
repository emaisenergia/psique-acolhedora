import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SyncRequest {
  action: "create" | "update" | "delete" | "toggle_sync";
  appointment_id?: string;
  sync_enabled?: boolean;
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

const getValidAccessToken = async (supabase: ReturnType<typeof getSupabaseClient>, userId: string): Promise<string | null> => {
  const { data: tokenData, error } = await supabase
    .from("google_calendar_tokens")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !tokenData || !tokenData.sync_enabled) {
    return null;
  }

  const expiresAt = new Date(tokenData.token_expires_at);
  const now = new Date();

  // If token is expired or about to expire (within 5 minutes), refresh it
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
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
      console.error("Token refresh failed:", refreshData);
      return null;
    }

    const newExpiresAt = new Date(Date.now() + (refreshData.expires_in * 1000));

    await supabase
      .from("google_calendar_tokens")
      .update({
        access_token: refreshData.access_token,
        token_expires_at: newExpiresAt.toISOString(),
      })
      .eq("user_id", userId);

    return refreshData.access_token;
  }

  return tokenData.access_token;
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

    const { action, appointment_id, sync_enabled }: SyncRequest = await req.json();
    const supabase = getSupabaseClient();

    if (action === "toggle_sync") {
      const { error } = await supabase
        .from("google_calendar_tokens")
        .update({ sync_enabled })
        .eq("user_id", userId);

      if (error) {
        return new Response(
          JSON.stringify({ error: "Failed to update sync setting" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, sync_enabled }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!appointment_id) {
      return new Response(
        JSON.stringify({ error: "appointment_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const accessToken = await getValidAccessToken(supabase, userId);
    if (!accessToken) {
      console.log("Google Calendar not connected or sync disabled for user:", userId);
      return new Response(
        JSON.stringify({ success: false, message: "Google Calendar not connected or sync disabled" }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get appointment details
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select(`
        *,
        patients:patient_id (name, email)
      `)
      .eq("id", appointment_id)
      .single();

    if (appointmentError || !appointment) {
      return new Response(
        JSON.stringify({ error: "Appointment not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const calendarId = "primary";
    const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`;

    switch (action) {
      case "create": {
        const startTime = new Date(appointment.date_time);
        const endTime = new Date(startTime.getTime() + (appointment.duration_minutes || 50) * 60 * 1000);

        const patientName = appointment.patients?.name || "Paciente";
        const appointmentType = appointment.appointment_type === "blocked" 
          ? "Horário Bloqueado" 
          : appointment.appointment_type === "personal"
          ? "Compromisso Pessoal"
          : "Sessão de Terapia";

        const event = {
          summary: appointment.appointment_type === "session" 
            ? `${appointmentType} - ${patientName}`
            : `${appointmentType}${appointment.block_reason ? `: ${appointment.block_reason}` : ""}`,
          description: appointment.notes || "",
          start: {
            dateTime: startTime.toISOString(),
            timeZone: "America/Sao_Paulo",
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: "America/Sao_Paulo",
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: "popup", minutes: 30 },
            ],
          },
        };

        const createResponse = await fetch(baseUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        });

        const createdEvent = await createResponse.json();

        if (createdEvent.error) {
          console.error("Failed to create Google Calendar event:", createdEvent.error);
          return new Response(
            JSON.stringify({ error: "Failed to create calendar event" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Save Google event ID to appointment
        await supabase
          .from("appointments")
          .update({ google_event_id: createdEvent.id })
          .eq("id", appointment_id);

        console.log(`Created Google Calendar event ${createdEvent.id} for appointment ${appointment_id}`);

        return new Response(
          JSON.stringify({ success: true, google_event_id: createdEvent.id }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "update": {
        if (!appointment.google_event_id) {
          // No existing event, create one instead
          return handler(new Request(req.url, {
            method: "POST",
            headers: req.headers,
            body: JSON.stringify({ action: "create", appointment_id }),
          }));
        }

        const startTime = new Date(appointment.date_time);
        const endTime = new Date(startTime.getTime() + (appointment.duration_minutes || 50) * 60 * 1000);

        const patientName = appointment.patients?.name || "Paciente";
        const appointmentType = appointment.appointment_type === "blocked" 
          ? "Horário Bloqueado" 
          : appointment.appointment_type === "personal"
          ? "Compromisso Pessoal"
          : "Sessão de Terapia";

        const event = {
          summary: appointment.appointment_type === "session" 
            ? `${appointmentType} - ${patientName}`
            : `${appointmentType}${appointment.block_reason ? `: ${appointment.block_reason}` : ""}`,
          description: appointment.notes || "",
          start: {
            dateTime: startTime.toISOString(),
            timeZone: "America/Sao_Paulo",
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: "America/Sao_Paulo",
          },
        };

        const updateResponse = await fetch(`${baseUrl}/${appointment.google_event_id}`, {
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        });

        const updatedEvent = await updateResponse.json();

        if (updatedEvent.error) {
          console.error("Failed to update Google Calendar event:", updatedEvent.error);
          return new Response(
            JSON.stringify({ error: "Failed to update calendar event" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        console.log(`Updated Google Calendar event ${appointment.google_event_id}`);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "delete": {
        if (!appointment.google_event_id) {
          return new Response(
            JSON.stringify({ success: true, message: "No Google event to delete" }),
            { headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const deleteResponse = await fetch(`${baseUrl}/${appointment.google_event_id}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        });

        if (!deleteResponse.ok && deleteResponse.status !== 404) {
          console.error("Failed to delete Google Calendar event");
          return new Response(
            JSON.stringify({ error: "Failed to delete calendar event" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Clear Google event ID from appointment
        await supabase
          .from("appointments")
          .update({ google_event_id: null })
          .eq("id", appointment_id);

        console.log(`Deleted Google Calendar event for appointment ${appointment_id}`);

        return new Response(
          JSON.stringify({ success: true }),
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
    console.error("Error in google-calendar-sync:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
