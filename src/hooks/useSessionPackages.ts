import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type SessionPackage = {
  id: string;
  patient_id: string;
  name: string;
  total_sessions: number;
  used_sessions: number;
  price: number;
  price_per_session: number;
  status: string;
  notes: string | null;
  start_date: string | null;
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
};

export type SessionPackageInsert = Omit<SessionPackage, "id" | "created_at" | "updated_at" | "price_per_session">;

export const useSessionPackages = (patientId?: string) => {
  const [packages, setPackages] = useState<SessionPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchPackages = useCallback(async () => {
    try {
      let query = supabase
        .from("session_packages")
        .select("*")
        .order("created_at", { ascending: false });

      if (patientId) {
        query = query.eq("patient_id", patientId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPackages((data as SessionPackage[]) || []);
    } catch (error) {
      console.error("Error fetching packages:", error);
      toast({
        title: "Erro ao carregar pacotes",
        description: "Não foi possível carregar os pacotes de sessões.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [patientId, toast]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const createPackage = async (pkg: Omit<SessionPackageInsert, "used_sessions" | "status">) => {
    try {
      const { data, error } = await supabase
        .from("session_packages")
        .insert({
          ...pkg,
          used_sessions: 0,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;

      setPackages((prev) => [data as SessionPackage, ...prev]);
      toast({
        title: "Pacote criado",
        description: "O pacote de sessões foi criado com sucesso.",
      });
      return data as SessionPackage;
    } catch (error) {
      console.error("Error creating package:", error);
      toast({
        title: "Erro ao criar pacote",
        description: "Não foi possível criar o pacote.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updatePackage = async (id: string, updates: Partial<SessionPackageInsert>) => {
    try {
      const { data, error } = await supabase
        .from("session_packages")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setPackages((prev) =>
        prev.map((pkg) => (pkg.id === id ? (data as SessionPackage) : pkg))
      );
      toast({
        title: "Pacote atualizado",
        description: "O pacote foi atualizado com sucesso.",
      });
      return data as SessionPackage;
    } catch (error) {
      console.error("Error updating package:", error);
      toast({
        title: "Erro ao atualizar pacote",
        description: "Não foi possível atualizar o pacote.",
        variant: "destructive",
      });
      return null;
    }
  };

  const useSession = async (id: string) => {
    const pkg = packages.find((p) => p.id === id);
    if (!pkg) return null;

    if (pkg.used_sessions >= pkg.total_sessions) {
      toast({
        title: "Pacote esgotado",
        description: "Todas as sessões deste pacote já foram utilizadas.",
        variant: "destructive",
      });
      return null;
    }

    return updatePackage(id, { used_sessions: pkg.used_sessions + 1 });
  };

  const deletePackage = async (id: string) => {
    try {
      const { error } = await supabase
        .from("session_packages")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setPackages((prev) => prev.filter((pkg) => pkg.id !== id));
      toast({
        title: "Pacote excluído",
        description: "O pacote foi excluído com sucesso.",
      });
      return true;
    } catch (error) {
      console.error("Error deleting package:", error);
      toast({
        title: "Erro ao excluir pacote",
        description: "Não foi possível excluir o pacote.",
        variant: "destructive",
      });
      return false;
    }
  };

  const getActivePackagesForPatient = useCallback(
    (pid: string) => {
      return packages.filter(
        (pkg) =>
          pkg.patient_id === pid &&
          pkg.status === "active" &&
          pkg.used_sessions < pkg.total_sessions
      );
    },
    [packages]
  );

  return {
    packages,
    isLoading,
    fetchPackages,
    createPackage,
    updatePackage,
    useSession,
    deletePackage,
    getActivePackagesForPatient,
  };
};
