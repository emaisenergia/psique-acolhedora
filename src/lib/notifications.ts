import { supabase } from "@/integrations/supabase/client";

type NotificationType = "new_message" | "new_activity" | "appointment_reminder" | "appointment_confirmation";

interface NotificationData {
  content?: string;
  activityTitle?: string;
  appointmentDate?: string;
  appointmentTime?: string;
}

export const sendNotificationEmail = async (
  type: NotificationType,
  patientId: string,
  data?: NotificationData
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: response, error } = await supabase.functions.invoke("send-notification-email", {
      body: { type, patientId, data },
    });

    if (error) {
      console.error("Error sending notification:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error invoking notification function:", err);
    return { success: false, error: err.message };
  }
};

// Convenience functions
export const notifyNewMessage = (patientId: string, content: string) =>
  sendNotificationEmail("new_message", patientId, { content });

export const notifyNewActivity = (patientId: string, activityTitle: string) =>
  sendNotificationEmail("new_activity", patientId, { activityTitle });

export const notifyAppointmentReminder = (patientId: string, appointmentDate: string, appointmentTime: string) =>
  sendNotificationEmail("appointment_reminder", patientId, { appointmentDate, appointmentTime });

export const notifyAppointmentConfirmation = (patientId: string, appointmentDate: string, appointmentTime: string) =>
  sendNotificationEmail("appointment_confirmation", patientId, { appointmentDate, appointmentTime });
