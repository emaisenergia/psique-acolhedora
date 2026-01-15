import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth } from "date-fns";

export interface RecurringTransaction {
  id: string;
  type: "revenue" | "expense";
  amount: number;
  description: string | null;
  category: string | null;
  payment_method: string | null;
  day_of_month: number;
  is_active: boolean;
  last_generated_month: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecurringTransactionInsert {
  type: "revenue" | "expense";
  amount: number;
  description?: string | null;
  category?: string | null;
  payment_method?: string | null;
  day_of_month: number;
  is_active?: boolean;
  notes?: string | null;
}

export const useRecurringTransactions = () => {
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchRecurringTransactions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("recurring_transactions")
        .select("*")
        .order("day_of_month", { ascending: true });

      if (error) throw error;
      setRecurringTransactions((data as RecurringTransaction[]) || []);
    } catch (error) {
      console.error("Error fetching recurring transactions:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecurringTransactions();
  }, [fetchRecurringTransactions]);

  const createRecurringTransaction = async (transaction: RecurringTransactionInsert) => {
    try {
      const { data, error } = await supabase
        .from("recurring_transactions")
        .insert(transaction)
        .select()
        .single();

      if (error) throw error;
      setRecurringTransactions(prev => [...prev, data as RecurringTransaction]);
      toast({
        title: "Lançamento recorrente criado",
        description: "O lançamento será gerado automaticamente todo mês.",
      });
      return data as RecurringTransaction;
    } catch (error) {
      console.error("Error creating recurring transaction:", error);
      toast({
        title: "Erro ao criar lançamento recorrente",
        description: "Não foi possível criar o lançamento.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateRecurringTransaction = async (id: string, updates: Partial<RecurringTransactionInsert>) => {
    try {
      const { data, error } = await supabase
        .from("recurring_transactions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      setRecurringTransactions(prev => 
        prev.map(t => t.id === id ? data as RecurringTransaction : t)
      );
      toast({ title: "Lançamento atualizado" });
      return data as RecurringTransaction;
    } catch (error) {
      console.error("Error updating recurring transaction:", error);
      toast({
        title: "Erro ao atualizar",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteRecurringTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from("recurring_transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setRecurringTransactions(prev => prev.filter(t => t.id !== id));
      toast({ title: "Lançamento excluído" });
      return true;
    } catch (error) {
      console.error("Error deleting recurring transaction:", error);
      toast({
        title: "Erro ao excluir",
        variant: "destructive",
      });
      return false;
    }
  };

  const generateMonthlyTransactions = async () => {
    const currentMonth = format(startOfMonth(new Date()), "yyyy-MM-dd");
    const toGenerate = recurringTransactions.filter(
      rt => rt.is_active && rt.last_generated_month !== currentMonth
    );

    if (toGenerate.length === 0) {
      toast({ title: "Nenhum lançamento a gerar", description: "Todos os lançamentos recorrentes já foram gerados este mês." });
      return [];
    }

    const generated = [];
    for (const rt of toGenerate) {
      // Create the transaction
      const { error: insertError } = await supabase
        .from("financial_transactions")
        .insert({
          type: rt.type,
          amount: rt.amount,
          description: rt.description,
          category: rt.category,
          payment_method: rt.payment_method,
          notes: `Gerado automaticamente de lançamento recorrente`,
          transaction_date: format(new Date(new Date().getFullYear(), new Date().getMonth(), rt.day_of_month), "yyyy-MM-dd"),
        });

      if (!insertError) {
        // Update last_generated_month
        await supabase
          .from("recurring_transactions")
          .update({ last_generated_month: currentMonth })
          .eq("id", rt.id);

        generated.push(rt);
      }
    }

    if (generated.length > 0) {
      toast({
        title: `${generated.length} lançamento(s) gerado(s)`,
        description: "Os lançamentos recorrentes foram criados para este mês.",
      });
      fetchRecurringTransactions();
    }

    return generated;
  };

  return {
    recurringTransactions,
    isLoading,
    fetchRecurringTransactions,
    createRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    generateMonthlyTransactions,
  };
};
