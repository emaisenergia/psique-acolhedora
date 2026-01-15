import { supabase } from "@/integrations/supabase/client";

type NotificationType = 
  | "new_message" 
  | "new_activity" 
  | "activity_response"
  | "appointment_reminder" 
  | "appointment_confirmation"
  | "appointment_created"
  | "appointment_updated"
  | "appointment_cancelled";

interface NotificationData {
  content?: string;
  activityTitle?: string;
  patientName?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  appointmentMode?: string;
  previousDate?: string;
  previousTime?: string;
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

// Notify admin/psychologist when patient submits activity response
export const notifyActivityResponse = async (
  patientId: string, 
  activityTitle: string,
  patientName: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: response, error } = await supabase.functions.invoke("send-notification-email", {
      body: { 
        type: "activity_response", 
        patientId, 
        data: { activityTitle, patientName },
        notifyAdmin: true 
      },
    });

    if (error) {
      console.error("Error sending activity response notification:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error invoking notification function:", err);
    return { success: false, error: err.message };
  }
};

// Convenience functions for messages and activities
export const notifyNewMessage = (patientId: string, content: string) =>
  sendNotificationEmail("new_message", patientId, { content });

export const notifyNewActivity = (patientId: string, activityTitle: string) =>
  sendNotificationEmail("new_activity", patientId, { activityTitle });

// Appointment-specific notifications
export const notifyAppointmentCreated = (
  patientId: string, 
  appointmentDate: string, 
  appointmentTime: string,
  appointmentMode?: string
) =>
  sendNotificationEmail("appointment_created", patientId, { 
    appointmentDate, 
    appointmentTime,
    appointmentMode 
  });

export const notifyAppointmentUpdated = (
  patientId: string, 
  appointmentDate: string, 
  appointmentTime: string,
  appointmentMode?: string,
  previousDate?: string,
  previousTime?: string
) =>
  sendNotificationEmail("appointment_updated", patientId, { 
    appointmentDate, 
    appointmentTime,
    appointmentMode,
    previousDate,
    previousTime
  });

export const notifyAppointmentCancelled = (
  patientId: string, 
  appointmentDate: string, 
  appointmentTime: string
) =>
  sendNotificationEmail("appointment_cancelled", patientId, { 
    appointmentDate, 
    appointmentTime 
  });

export const notifyAppointmentReminder = (
  patientId: string, 
  appointmentDate: string, 
  appointmentTime: string,
  appointmentMode?: string
) =>
  sendNotificationEmail("appointment_reminder", patientId, { 
    appointmentDate, 
    appointmentTime,
    appointmentMode 
  });

export const notifyAppointmentConfirmation = (
  patientId: string, 
  appointmentDate: string, 
  appointmentTime: string
) =>
  sendNotificationEmail("appointment_confirmation", patientId, { 
    appointmentDate, 
    appointmentTime 
  });
