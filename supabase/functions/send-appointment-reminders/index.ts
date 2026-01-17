import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const generateSecureToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, "0")).join("");
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const siteUrl = Deno.env.get("SITE_URL") || "https://id-preview--8e860f77-0c7c-487f-81b8-1b842b8bb60f.lovable.app";

    // Get admin preferences for reminder configuration
    const { data: prefsData } = await supabase
      .from("admin_preferences")
      .select("reminder_hours_before")
      .limit(1)
      .single();

    const reminderHours = prefsData?.reminder_hours_before || 24;
    console.log(`Using reminder hours: ${reminderHours}`);

    // Calculate time window based on configuration
    const now = new Date();
    const reminderStart = new Date(now.getTime() + reminderHours * 60 * 60 * 1000);
    const reminderEnd = new Date(reminderStart.getTime() + 60 * 60 * 1000); // 1 hour window

    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select(`
        id,
        date_time,
        mode,
        patient_id,
        status,
        service,
        patients!inner (
          id,
          name,
          email,
          phone
        )
      `)
      .gte("date_time", reminderStart.toISOString())
      .lte("date_time", reminderEnd.toISOString())
      .in("status", ["scheduled", "confirmed"]);

    if (appointmentsError) {
      console.error("Error fetching appointments:", appointmentsError);
      return new Response(
        JSON.stringify({ error: appointmentsError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${appointments?.length || 0} appointments for reminders (${reminderHours}h before)`);

    const results: { success: number; failed: number; skipped: number; whatsappPending: number } = {
      success: 0,
      failed: 0,
      skipped: 0,
      whatsappPending: 0,
    };

    for (const appointment of appointments || []) {
      const patient = (appointment as any).patients;
      
      if (!patient?.email) {
        console.log(`Skipping appointment ${appointment.id}: no patient email`);
        results.skipped++;
        continue;
      }

      // Check if reminder already sent
      const { data: existingReminder } = await supabase
        .from("reminder_logs")
        .select("id")
        .eq("appointment_id", appointment.id)
        .eq("reminder_type", "email")
        .single();

      if (existingReminder) {
        console.log(`Skipping appointment ${appointment.id}: reminder already sent`);
        results.skipped++;
        continue;
      }

      const appointmentDate = new Date(appointment.date_time);
      const formattedDate = appointmentDate.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const formattedTime = appointmentDate.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Generate action tokens
      const expiresAt = new Date(appointmentDate.getTime() + 24 * 60 * 60 * 1000); // 24h after appointment
      const confirmToken = generateSecureToken();
      const cancelToken = generateSecureToken();
      const rescheduleToken = generateSecureToken();

      // Create tokens in database
      const tokens = [
        { token: confirmToken, action_type: "confirm" },
        { token: cancelToken, action_type: "cancel" },
        { token: rescheduleToken, action_type: "reschedule" },
      ];

      for (const tokenData of tokens) {
        await supabase
          .from("appointment_action_tokens")
          .upsert({
            appointment_id: appointment.id,
            token: tokenData.token,
            action_type: tokenData.action_type,
            expires_at: expiresAt.toISOString(),
          }, { onConflict: "appointment_id,action_type" });
      }

      const confirmUrl = `${siteUrl}/agendamento/confirmar?token=${confirmToken}`;
      const cancelUrl = `${siteUrl}/agendamento/cancelar?token=${cancelToken}`;
      const rescheduleUrl = `${siteUrl}/agendamento/reagendar?token=${rescheduleToken}`;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; margin-bottom: 20px;">Olá, ${patient.name}!</h1>
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            Este é um lembrete da sua próxima sessão de terapia.
          </p>
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #f59e0b;">
            <p style="font-size: 14px; color: #92400e; margin: 0;">📅 Data e horário:</p>
            <p style="font-size: 18px; color: #92400e; font-weight: 600; margin-top: 8px;">
              ${formattedDate} às ${formattedTime}
            </p>
            <p style="font-size: 14px; color: #92400e; margin-top: 8px;">
              Modalidade: ${appointment.mode === "online" ? "Online" : "Presencial"}
            </p>
          </div>
          
          <div style="margin: 30px 0;">
            <p style="font-size: 14px; color: #374151; margin-bottom: 15px;">Escolha uma ação:</p>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              <a href="${confirmUrl}" 
                 style="display: inline-block; background-color: #10b981; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                ✓ Confirmar Presença
              </a>
              <a href="${rescheduleUrl}" 
                 style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                📅 Reagendar
              </a>
              <a href="${cancelUrl}" 
                 style="display: inline-block; background-color: #ef4444; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                ✗ Cancelar
              </a>
            </div>
          </div>

          <a href="${siteUrl}/portal/sessoes" 
             style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Ver minhas sessões
          </a>
          <p style="font-size: 14px; color: #9ca3af; margin-top: 30px;">
            Esta é uma notificação automática. Por favor, não responda este email.
          </p>
        </div>
      `;

      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Consultório <onboarding@resend.dev>",
            to: [patient.email],
            subject: `🔔 Lembrete: Sua sessão é em ${reminderHours}h!`,
            html: emailHtml,
          }),
        });

        if (emailResponse.ok) {
          console.log(`Reminder sent for appointment ${appointment.id} to ${patient.email}`);
          
          // Log the reminder
          await supabase.from("reminder_logs").insert({
            appointment_id: appointment.id,
            reminder_type: "email",
            status: "sent",
          });

          results.success++;
        } else {
          const errorData = await emailResponse.json();
          console.error(`Failed to send reminder for appointment ${appointment.id}:`, errorData);
          
          await supabase.from("reminder_logs").insert({
            appointment_id: appointment.id,
            reminder_type: "email",
            status: "failed",
            error_message: JSON.stringify(errorData),
          });

          results.failed++;
        }
      } catch (emailError) {
        console.error(`Error sending reminder for appointment ${appointment.id}:`, emailError);
        results.failed++;
      }

      // Log WhatsApp pending if phone exists
      if (patient.phone) {
        await supabase.from("reminder_logs").insert({
          appointment_id: appointment.id,
          reminder_type: "whatsapp_pending",
          status: "pending",
        });
        results.whatsappPending++;
        console.log(`WhatsApp reminder pending for ${patient.phone}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Reminder processing complete",
        results,
        appointmentsFound: appointments?.length || 0,
        reminderHoursConfig: reminderHours,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error processing reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
