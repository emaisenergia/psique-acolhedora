import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "new_message" | "new_activity" | "appointment_reminder" | "appointment_confirmation";
  patientId: string;
  data?: {
    content?: string;
    activityTitle?: string;
    appointmentDate?: string;
    appointmentTime?: string;
  };
}

const getEmailContent = (type: string, patientName: string, data?: NotificationRequest["data"]) => {
  switch (type) {
    case "new_message":
      return {
        subject: "Nova mensagem da sua psicóloga",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb; margin-bottom: 20px;">Olá, ${patientName}!</h1>
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
              Você recebeu uma nova mensagem da sua psicóloga.
            </p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="font-size: 14px; color: #6b7280; margin: 0;">Prévia da mensagem:</p>
              <p style="font-size: 16px; color: #1f2937; margin-top: 8px;">${data?.content?.substring(0, 150)}${(data?.content?.length || 0) > 150 ? "..." : ""}</p>
            </div>
            <a href="${Deno.env.get("SITE_URL") || "https://id-preview--8e860f77-0c7c-487f-81b8-1b842b8bb60f.lovable.app"}/portal/mensagens" 
               style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Ver mensagem completa
            </a>
            <p style="font-size: 14px; color: #9ca3af; margin-top: 30px;">
              Esta é uma notificação automática. Por favor, não responda este email.
            </p>
          </div>
        `,
      };

    case "new_activity":
      return {
        subject: "Nova atividade atribuída",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb; margin-bottom: 20px;">Olá, ${patientName}!</h1>
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
              Uma nova atividade foi atribuída a você pela sua psicóloga.
            </p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="font-size: 14px; color: #6b7280; margin: 0;">Atividade:</p>
              <p style="font-size: 18px; color: #1f2937; font-weight: 600; margin-top: 8px;">${data?.activityTitle}</p>
            </div>
            <a href="${Deno.env.get("SITE_URL") || "https://id-preview--8e860f77-0c7c-487f-81b8-1b842b8bb60f.lovable.app"}/portal/atividades" 
               style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Ver atividade
            </a>
            <p style="font-size: 14px; color: #9ca3af; margin-top: 30px;">
              Esta é uma notificação automática. Por favor, não responda este email.
            </p>
          </div>
        `,
      };

    case "appointment_reminder":
      return {
        subject: "Lembrete: Sua sessão está chegando",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb; margin-bottom: 20px;">Olá, ${patientName}!</h1>
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
              Este é um lembrete da sua próxima sessão de terapia.
            </p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="font-size: 14px; color: #6b7280; margin: 0;">Data e horário:</p>
              <p style="font-size: 18px; color: #1f2937; font-weight: 600; margin-top: 8px;">
                ${data?.appointmentDate} às ${data?.appointmentTime}
              </p>
            </div>
            <a href="${Deno.env.get("SITE_URL") || "https://id-preview--8e860f77-0c7c-487f-81b8-1b842b8bb60f.lovable.app"}/portal/sessoes" 
               style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Ver sessões
            </a>
            <p style="font-size: 14px; color: #9ca3af; margin-top: 30px;">
              Esta é uma notificação automática. Por favor, não responda este email.
            </p>
          </div>
        `,
      };

    case "appointment_confirmation":
      return {
        subject: "Sessão confirmada",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb; margin-bottom: 20px;">Olá, ${patientName}!</h1>
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
              Sua sessão foi confirmada com sucesso!
            </p>
            <div style="background-color: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #22c55e;">
              <p style="font-size: 14px; color: #166534; margin: 0;">✓ Sessão agendada para:</p>
              <p style="font-size: 18px; color: #166534; font-weight: 600; margin-top: 8px;">
                ${data?.appointmentDate} às ${data?.appointmentTime}
              </p>
            </div>
            <a href="${Deno.env.get("SITE_URL") || "https://id-preview--8e860f77-0c7c-487f-81b8-1b842b8bb60f.lovable.app"}/portal/sessoes" 
               style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Ver minhas sessões
            </a>
            <p style="font-size: 14px; color: #9ca3af; margin-top: 30px;">
              Esta é uma notificação automática. Por favor, não responda este email.
            </p>
          </div>
        `,
      };

    default:
      return {
        subject: "Notificação",
        html: `<p>Você tem uma nova notificação.</p>`,
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, patientId, data }: NotificationRequest = await req.json();

    if (!type || !patientId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: type and patientId" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get patient data
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("name, email")
      .eq("id", patientId)
      .single();

    if (patientError || !patient) {
      console.error("Patient not found:", patientError);
      return new Response(
        JSON.stringify({ error: "Patient not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!patient.email) {
      console.log("Patient has no email, skipping notification");
      return new Response(
        JSON.stringify({ message: "Patient has no email, notification skipped" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailContent = getEmailContent(type, patient.name, data);

    // Send email using Resend REST API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Consultório <onboarding@resend.dev>",
        to: [patient.email],
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailResult);
      return new Response(
        JSON.stringify({ error: emailResult.message || "Failed to send email" }),
        { status: emailResponse.status, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Email sent successfully:", emailResult);

    return new Response(JSON.stringify({ success: true, emailResult }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending notification email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
