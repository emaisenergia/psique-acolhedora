import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { startOfMonth, format } from "date-fns";

export interface FinancialGoal {
  id: string;
  month: string;
  revenue_goal: number;
  sessions_goal: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinancialGoalInsert {
  month: string;
  revenue_goal: number;
  sessions_goal: number;
  notes?: string | null;
}

export const useFinancialGoals = () => {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchGoals = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("financial_goals")
        .select("*")
        .order("month", { ascending: false });

      if (error) throw error;
      setGoals((data as FinancialGoal[]) || []);
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const getGoalForMonth = useCallback((date: Date) => {
    const monthKey = format(startOfMonth(date), "yyyy-MM-dd");
    return goals.find(g => g.month === monthKey);
  }, [goals]);

  const upsertGoal = async (goal: FinancialGoalInsert) => {
    try {
      // Check if goal exists for this month
      const existing = goals.find(g => g.month === goal.month);
      
      if (existing) {
        const { data, error } = await supabase
          .from("financial_goals")
          .update({
            revenue_goal: goal.revenue_goal,
            sessions_goal: goal.sessions_goal,
            notes: goal.notes,
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        setGoals(prev => prev.map(g => g.id === existing.id ? data as FinancialGoal : g));
        toast({ title: "Meta atualizada", description: "A meta foi atualizada com sucesso." });
        return data as FinancialGoal;
      } else {
        const { data, error } = await supabase
          .from("financial_goals")
          .insert(goal)
          .select()
          .single();

        if (error) throw error;
        setGoals(prev => [data as FinancialGoal, ...prev]);
        toast({ title: "Meta criada", description: "A meta foi criada com sucesso." });
        return data as FinancialGoal;
      }
    } catch (error) {
      console.error("Error saving goal:", error);
      toast({
        title: "Erro ao salvar meta",
        description: "Não foi possível salvar a meta.",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      const { error } = await supabase
        .from("financial_goals")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setGoals(prev => prev.filter(g => g.id !== id));
      toast({ title: "Meta excluída", description: "A meta foi removida." });
      return true;
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast({
        title: "Erro ao excluir meta",
        description: "Não foi possível excluir a meta.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    goals,
    isLoading,
    fetchGoals,
    getGoalForMonth,
    upsertGoal,
    deleteGoal,
  };
};
