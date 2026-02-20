import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const usePatientAccount = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [hasAccount, setHasAccount] = useState<boolean | null>(null);

  const checkAccount = async (email: string | undefined) => {
    if (!email) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("user_id")
        .eq("email", email)
        .single();
      if (error && error.code !== "PGRST116") console.error("Error checking patient account:", error);
      setHasAccount(!!data?.user_id);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createAccount = async (email: string, name: string, password: string, confirmPassword: string) => {
    if (!email || !password) {
      toast.error("Email e senha são obrigatórios");
      return false;
    }
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return false;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return false;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-admin-user", {
        body: { email, password, name, role: "patient" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const userId = data?.user?.id;
      if (!userId) throw new Error("Falha ao criar usuário");

      const { error: updateError } = await supabase.from("patients").update({ user_id: userId }).eq("email", email);
      if (updateError) throw updateError;

      toast.success("Conta do paciente criada com sucesso!");
      setHasAccount(true);
      return true;
    } catch (error: unknown) {
      console.error("Error creating patient account:", error);
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(`Erro ao criar conta: ${message}`);
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  return { isLoading, isCreating, hasAccount, checkAccount, createAccount };
};
