import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type Insurance = {
  id: string;
  name: string;
  coverage_percentage: number;
  contact_phone: string | null;
  contact_email: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type InsuranceInsert = Omit<Insurance, "id" | "created_at" | "updated_at">;

export const useInsurances = () => {
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchInsurances = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("insurances")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setInsurances((data as Insurance[]) || []);
    } catch (error) {
      console.error("Error fetching insurances:", error);
      toast({
        title: "Erro ao carregar convênios",
        description: "Não foi possível carregar os convênios.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInsurances();
  }, [fetchInsurances]);

  const createInsurance = async (insurance: Omit<InsuranceInsert, "status">) => {
    try {
      const { data, error } = await supabase
        .from("insurances")
        .insert({
          ...insurance,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;

      setInsurances((prev) => [...prev, data as Insurance].sort((a, b) => a.name.localeCompare(b.name)));
      toast({
        title: "Convênio criado",
        description: "O convênio foi criado com sucesso.",
      });
      return data as Insurance;
    } catch (error) {
      console.error("Error creating insurance:", error);
      toast({
        title: "Erro ao criar convênio",
        description: "Não foi possível criar o convênio.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateInsurance = async (id: string, updates: Partial<InsuranceInsert>) => {
    try {
      const { data, error } = await supabase
        .from("insurances")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setInsurances((prev) =>
        prev.map((ins) => (ins.id === id ? (data as Insurance) : ins))
      );
      toast({
        title: "Convênio atualizado",
        description: "O convênio foi atualizado com sucesso.",
      });
      return data as Insurance;
    } catch (error) {
      console.error("Error updating insurance:", error);
      toast({
        title: "Erro ao atualizar convênio",
        description: "Não foi possível atualizar o convênio.",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteInsurance = async (id: string) => {
    try {
      const { error } = await supabase
        .from("insurances")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setInsurances((prev) => prev.filter((ins) => ins.id !== id));
      toast({
        title: "Convênio excluído",
        description: "O convênio foi excluído com sucesso.",
      });
      return true;
    } catch (error) {
      console.error("Error deleting insurance:", error);
      toast({
        title: "Erro ao excluir convênio",
        description: "Não foi possível excluir o convênio.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    insurances,
    isLoading,
    fetchInsurances,
    createInsurance,
    updateInsurance,
    deleteInsurance,
  };
};
