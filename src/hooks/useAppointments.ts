import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { 
  notifyAppointmentCreated, 
  notifyAppointmentUpdated, 
  notifyAppointmentCancelled 
} from "@/lib/notifications";

export type AppointmentRow = Tables<"appointments">;
export type AppointmentInsert = TablesInsert<"appointments">;
export type AppointmentUpdate = TablesUpdate<"appointments">;

export type AppointmentStatus = "scheduled" | "confirmed" | "done" | "cancelled";

const formatDateForEmail = (dateString: string) => {
  try {
    const date = parseISO(dateString);
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return dateString;
  }
};

const formatTimeForEmail = (dateString: string) => {
  try {
    const date = parseISO(dateString);
    return format(date, "HH:mm");
  } catch {
    return "";
  }
};

export const useAppointments = () => {
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchAppointments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .order("date_time", { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast({
        title: "Erro ao carregar agendamentos",
        description: "Não foi possível carregar os agendamentos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const createAppointment = async (
    appointment: Omit<AppointmentInsert, "id" | "created_at" | "updated_at">,
    sendNotification = true
  ) => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .insert(appointment)
        .select()
        .single();

      if (error) throw error;
      
      setAppointments((prev) => [...prev, data]);
      
      // Send notification email
      if (sendNotification && data.date_time) {
        notifyAppointmentCreated(
          data.patient_id,
          formatDateForEmail(data.date_time),
          formatTimeForEmail(data.date_time),
          data.mode || undefined
        ).catch(console.error);
      }
      
      toast({
        title: "Agendamento criado",
        description: "O agendamento foi criado com sucesso.",
      });
      return data;
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast({
        title: "Erro ao criar agendamento",
        description: "Não foi possível criar o agendamento.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateAppointment = async (
    id: string, 
    updates: AppointmentUpdate,
    sendNotification = true
  ) => {
    try {
      // Get the original appointment for comparison
      const original = appointments.find((a) => a.id === id);
      
      const { data, error } = await supabase
        .from("appointments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      
      setAppointments((prev) => 
        prev.map((appt) => (appt.id === id ? data : appt))
      );
      
      // Send notification for significant changes
      if (sendNotification && data.date_time) {
        const dateChanged = original?.date_time !== data.date_time;
        const statusChanged = original?.status !== data.status;
        
        if (data.status === "cancelled" && statusChanged) {
          // Appointment was cancelled
          notifyAppointmentCancelled(
            data.patient_id,
            formatDateForEmail(data.date_time),
            formatTimeForEmail(data.date_time)
          ).catch(console.error);
        } else if (dateChanged) {
          // Date/time was changed
          notifyAppointmentUpdated(
            data.patient_id,
            formatDateForEmail(data.date_time),
            formatTimeForEmail(data.date_time),
            data.mode || undefined,
            original?.date_time ? formatDateForEmail(original.date_time) : undefined,
            original?.date_time ? formatTimeForEmail(original.date_time) : undefined
          ).catch(console.error);
        }
      }
      
      toast({
        title: "Agendamento atualizado",
        description: "O agendamento foi atualizado com sucesso.",
      });
      return data;
    } catch (error) {
      console.error("Error updating appointment:", error);
      toast({
        title: "Erro ao atualizar agendamento",
        description: "Não foi possível atualizar o agendamento.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateAppointmentDate = async (id: string, newDateTime: string) => {
    return updateAppointment(id, { date_time: newDateTime }, true);
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    return updateAppointment(id, { status }, true);
  };

  const deleteAppointment = async (id: string) => {
    try {
      // Get the appointment before deleting to send notification
      const appointment = appointments.find((a) => a.id === id);
      
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      // Send cancellation notification
      if (appointment?.date_time) {
        notifyAppointmentCancelled(
          appointment.patient_id,
          formatDateForEmail(appointment.date_time),
          formatTimeForEmail(appointment.date_time)
        ).catch(console.error);
      }
      
      setAppointments((prev) => prev.filter((appt) => appt.id !== id));
      toast({
        title: "Agendamento excluído",
        description: "O agendamento foi excluído com sucesso.",
      });
      return true;
    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast({
        title: "Erro ao excluir agendamento",
        description: "Não foi possível excluir o agendamento.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    appointments,
    isLoading,
    fetchAppointments,
    createAppointment,
    updateAppointment,
    updateAppointmentDate,
    updateAppointmentStatus,
    deleteAppointment,
  };
};
