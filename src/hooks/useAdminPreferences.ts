import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AdminPreferences {
  id?: string;
  user_id?: string;
  // Notifications
  email_notifications: boolean;
  session_reminders: boolean;
  reminder_hours_before: number;
  // Scheduling
  default_session_duration: number;
  session_interval: number;
  available_days: string[];
  work_start_time: string;
  work_end_time: string;
  // Display
  theme: string;
  language: string;
}

const defaultPreferences: AdminPreferences = {
  email_notifications: true,
  session_reminders: true,
  reminder_hours_before: 24,
  default_session_duration: 50,
  session_interval: 10,
  available_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  work_start_time: "08:00",
  work_end_time: "18:00",
  theme: "light",
  language: "pt-BR",
};

export const useAdminPreferences = () => {
  const [preferences, setPreferences] = useState<AdminPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true);
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user?.id) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("admin_preferences")
        .select("*")
        .eq("user_id", session.session.user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences({
          id: data.id,
          user_id: data.user_id,
          email_notifications: data.email_notifications ?? true,
          session_reminders: data.session_reminders ?? true,
          reminder_hours_before: data.reminder_hours_before ?? 24,
          default_session_duration: data.default_session_duration ?? 50,
          session_interval: data.session_interval ?? 10,
          available_days: data.available_days ?? defaultPreferences.available_days,
          work_start_time: data.work_start_time ?? "08:00",
          work_end_time: data.work_end_time ?? "18:00",
          theme: data.theme ?? "light",
          language: data.language ?? "pt-BR",
        });
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const savePreferences = useCallback(async (newPrefs: Partial<AdminPreferences>): Promise<boolean> => {
    try {
      setSaving(true);
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user?.id) {
        toast.error("Usuário não autenticado");
        return false;
      }

      const userId = session.session.user.id;
      const updatedPrefs = { ...preferences, ...newPrefs };

      // Check if preferences exist
      const { data: existing } = await supabase
        .from("admin_preferences")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        // Update
        const { error } = await supabase
          .from("admin_preferences")
          .update({
            email_notifications: updatedPrefs.email_notifications,
            session_reminders: updatedPrefs.session_reminders,
            reminder_hours_before: updatedPrefs.reminder_hours_before,
            default_session_duration: updatedPrefs.default_session_duration,
            session_interval: updatedPrefs.session_interval,
            available_days: updatedPrefs.available_days,
            work_start_time: updatedPrefs.work_start_time,
            work_end_time: updatedPrefs.work_end_time,
            theme: updatedPrefs.theme,
            language: updatedPrefs.language,
          })
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from("admin_preferences")
          .insert({
            user_id: userId,
            email_notifications: updatedPrefs.email_notifications,
            session_reminders: updatedPrefs.session_reminders,
            reminder_hours_before: updatedPrefs.reminder_hours_before,
            default_session_duration: updatedPrefs.default_session_duration,
            session_interval: updatedPrefs.session_interval,
            available_days: updatedPrefs.available_days,
            work_start_time: updatedPrefs.work_start_time,
            work_end_time: updatedPrefs.work_end_time,
            theme: updatedPrefs.theme,
            language: updatedPrefs.language,
          });

        if (error) throw error;
      }

      setPreferences(updatedPrefs);
      toast.success("Preferências salvas!");
      return true;
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Erro ao salvar preferências");
      return false;
    } finally {
      setSaving(false);
    }
  }, [preferences]);

  return {
    preferences,
    loading,
    saving,
    savePreferences,
    refreshPreferences: fetchPreferences,
  };
};
