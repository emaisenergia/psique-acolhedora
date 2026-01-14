import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type AppointmentRow = Tables<"appointments">;
export type AppointmentInsert = TablesInsert<"appointments">;
export type AppointmentUpdate = TablesUpdate<"appointments">;

export type AppointmentStatus = "scheduled" | "confirmed" | "done" | "cancelled";

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

  const createAppointment = async (appointment: Omit<AppointmentInsert, "id" | "created_at" | "updated_at">) => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .insert(appointment)
        .select()
        .single();

      if (error) throw error;
      
      setAppointments((prev) => [...prev, data]);
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

  const updateAppointment = async (id: string, updates: AppointmentUpdate) => {
    try {
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
    return updateAppointment(id, { date_time: newDateTime });
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    return updateAppointment(id, { status });
  };

  const deleteAppointment = async (id: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
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
