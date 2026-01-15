import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface FinancialTransaction {
  id: string;
  type: "revenue" | "expense";
  amount: number;
  description: string | null;
  patient_id: string | null;
  clinic: string | null;
  payment_method: string | null;
  category: string | null;
  transaction_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinancialTransactionInsert {
  type: "revenue" | "expense";
  amount: number;
  description?: string | null;
  patient_id?: string | null;
  clinic?: string | null;
  payment_method?: string | null;
  category?: string | null;
  transaction_date?: string;
  notes?: string | null;
}

export const useFinancialTransactions = () => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchTransactions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("financial_transactions")
        .select("*")
        .order("transaction_date", { ascending: false });

      if (error) throw error;
      setTransactions((data as FinancialTransaction[]) || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast({
        title: "Erro ao carregar transações",
        description: "Não foi possível carregar as transações financeiras.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const createTransaction = async (transaction: FinancialTransactionInsert) => {
    try {
      const { data, error } = await supabase
        .from("financial_transactions")
        .insert(transaction)
        .select()
        .single();

      if (error) throw error;

      setTransactions((prev) => [data as FinancialTransaction, ...prev]);
      toast({
        title: transaction.type === "revenue" ? "Receita adicionada" : "Despesa adicionada",
        description: "Transação registrada com sucesso.",
      });
      return data as FinancialTransaction;
    } catch (error) {
      console.error("Error creating transaction:", error);
      toast({
        title: "Erro ao criar transação",
        description: "Não foi possível registrar a transação.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<FinancialTransactionInsert>) => {
    try {
      const { data, error } = await supabase
        .from("financial_transactions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? (data as FinancialTransaction) : t))
      );
      toast({
        title: "Transação atualizada",
        description: "As alterações foram salvas.",
      });
      return data as FinancialTransaction;
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast({
        title: "Erro ao atualizar transação",
        description: "Não foi possível atualizar a transação.",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from("financial_transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setTransactions((prev) => prev.filter((t) => t.id !== id));
      toast({
        title: "Transação excluída",
        description: "A transação foi removida.",
      });
      return true;
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast({
        title: "Erro ao excluir transação",
        description: "Não foi possível excluir a transação.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    transactions,
    isLoading,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
};
