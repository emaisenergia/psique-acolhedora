import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

    // Get appointments that are scheduled for tomorrow (24h from now)
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStart = new Date(tomorrow.setHours(0, 0, 0, 0));
    const tomorrowEnd = new Date(tomorrow.setHours(23, 59, 59, 999));

    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select(`
        id,
        date_time,
        mode,
        patient_id,
        status,
        patients!inner (
          id,
          name,
          email
        )
      `)
      .gte("date_time", tomorrowStart.toISOString())
      .lte("date_time", tomorrowEnd.toISOString())
      .in("status", ["scheduled", "confirmed"]);

    if (appointmentsError) {
      console.error("Error fetching appointments:", appointmentsError);
      return new Response(
        JSON.stringify({ error: appointmentsError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${appointments?.length || 0} appointments for tomorrow`);

    const results: { success: number; failed: number; skipped: number } = {
      success: 0,
      failed: 0,
      skipped: 0,
    };

    for (const appointment of appointments || []) {
      const patient = (appointment as any).patients;
      
      if (!patient?.email) {
        console.log(`Skipping appointment ${appointment.id}: no patient email`);
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

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; margin-bottom: 20px;">Olá, ${patient.name}!</h1>
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            Este é um lembrete da sua próxima sessão de terapia que acontecerá <strong>amanhã</strong>.
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
            subject: "🔔 Lembrete: Sua sessão é amanhã!",
            html: emailHtml,
          }),
        });

        if (emailResponse.ok) {
          console.log(`Reminder sent for appointment ${appointment.id} to ${patient.email}`);
          results.success++;
        } else {
          const errorData = await emailResponse.json();
          console.error(`Failed to send reminder for appointment ${appointment.id}:`, errorData);
          results.failed++;
        }
      } catch (emailError) {
        console.error(`Error sending reminder for appointment ${appointment.id}:`, emailError);
        results.failed++;
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Reminder processing complete",
        results,
        appointmentsFound: appointments?.length || 0,
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
