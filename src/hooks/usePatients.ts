import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type PatientRow = Tables<"patients">;
export type PatientInsert = TablesInsert<"patients">;

export const usePatients = () => {
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchPatients = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast({
        title: "Erro ao carregar pacientes",
        description: "Não foi possível carregar a lista de pacientes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const createPatient = async (patient: Omit<PatientInsert, "id" | "created_at" | "updated_at">) => {
    try {
      const { data, error } = await supabase
        .from("patients")
        .insert(patient)
        .select()
        .single();

      if (error) throw error;
      
      setPatients((prev) => [...prev, data]);
      toast({
        title: "Paciente cadastrado",
        description: "O paciente foi cadastrado com sucesso.",
      });
      return data;
    } catch (error) {
      console.error("Error creating patient:", error);
      toast({
        title: "Erro ao cadastrar paciente",
        description: "Não foi possível cadastrar o paciente.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updatePatient = async (id: string, updates: Partial<PatientRow>) => {
    try {
      const { data, error } = await supabase
        .from("patients")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      
      setPatients((prev) => prev.map((p) => (p.id === id ? data : p)));
      return data;
    } catch (error) {
      console.error("Error updating patient:", error);
      toast({
        title: "Erro ao atualizar paciente",
        description: "Não foi possível atualizar o paciente.",
        variant: "destructive",
      });
      return null;
    }
  };

  const toggleFavorite = async (id: string) => {
    const patient = patients.find((p) => p.id === id);
    if (!patient) return null;

    const newValue = !patient.is_favorite;
    const result = await updatePatient(id, { is_favorite: newValue });
    
    if (result) {
      toast({
        title: newValue ? "Paciente favoritado" : "Favorito removido",
        description: newValue 
          ? `${patient.name} foi adicionado aos favoritos.`
          : `${patient.name} foi removido dos favoritos.`,
      });
    }
    
    return result;
  };

  return {
    patients,
    isLoading,
    fetchPatients,
    createPatient,
    updatePatient,
    toggleFavorite,
  };
};
