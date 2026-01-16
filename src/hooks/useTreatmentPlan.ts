import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GoalResult {
  goal: string;
  completed: boolean;
  result?: string;
  completedAt?: string;
}

export interface Improvement {
  id: string;
  description: string;
  date: string;
  category: string;
}

export interface TreatmentPlan {
  id: string;
  patient_id: string;
  start_date: string | null;
  estimated_sessions: number;
  current_progress: number;
  objectives: string[];
  discharge_objectives: string[];
  approaches: string[];
  short_term_goals: string[];
  long_term_goals: string[];
  notes: string | null;
  status: string;
  goal_results: GoalResult[];
  improvements: Improvement[];
  current_status: string;
  current_status_notes: string | null;
  last_review_date: string | null;
  next_review_date: string | null;
  is_shared_with_patient: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export const useTreatmentPlan = (patientId: string) => {
  const [plan, setPlan] = useState<TreatmentPlan | null>(null);
  const [archivedPlans, setArchivedPlans] = useState<TreatmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadPlans = useCallback(async () => {
    if (!patientId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch active plan
      const { data: activePlan, error: activeError } = await supabase
        .from("treatment_plans")
        .select("*")
        .eq("patient_id", patientId)
        .eq("status", "active")
        .maybeSingle();

      if (activeError) throw activeError;

      // Fetch archived plans
      const { data: archived, error: archivedError } = await supabase
        .from("treatment_plans")
        .select("*")
        .eq("patient_id", patientId)
        .eq("status", "archived")
        .order("created_at", { ascending: false });

      if (archivedError) throw archivedError;

      if (activePlan) {
        setPlan(mapDbToPlan(activePlan));
      } else {
        setPlan(null);
      }

      setArchivedPlans((archived || []).map(mapDbToPlan));
    } catch (error) {
      console.error("Error loading treatment plans:", error);
      toast.error("Erro ao carregar plano de tratamento");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const mapDbToPlan = (dbPlan: any): TreatmentPlan => ({
    id: dbPlan.id,
    patient_id: dbPlan.patient_id,
    start_date: dbPlan.start_date,
    estimated_sessions: dbPlan.estimated_sessions || 12,
    current_progress: dbPlan.current_progress || 0,
    objectives: Array.isArray(dbPlan.objectives) ? dbPlan.objectives : [],
    discharge_objectives: Array.isArray(dbPlan.discharge_objectives) ? dbPlan.discharge_objectives : [],
    approaches: Array.isArray(dbPlan.approaches) ? dbPlan.approaches : [],
    short_term_goals: Array.isArray(dbPlan.short_term_goals) ? dbPlan.short_term_goals : [],
    long_term_goals: Array.isArray(dbPlan.long_term_goals) ? dbPlan.long_term_goals : [],
    notes: dbPlan.notes,
    status: dbPlan.status,
    goal_results: Array.isArray(dbPlan.goal_results) ? dbPlan.goal_results : [],
    improvements: Array.isArray(dbPlan.improvements) ? dbPlan.improvements : [],
    current_status: dbPlan.current_status || "em_andamento",
    current_status_notes: dbPlan.current_status_notes,
    last_review_date: dbPlan.last_review_date,
    next_review_date: dbPlan.next_review_date,
    is_shared_with_patient: dbPlan.is_shared_with_patient || false,
    created_at: dbPlan.created_at,
    updated_at: dbPlan.updated_at,
    created_by: dbPlan.created_by,
  });

  const mapPlanToDb = (plan: TreatmentPlan) => ({
    patient_id: plan.patient_id,
    start_date: plan.start_date,
    estimated_sessions: plan.estimated_sessions,
    current_progress: plan.current_progress,
    objectives: plan.objectives as unknown as any,
    discharge_objectives: plan.discharge_objectives as unknown as any,
    approaches: plan.approaches,
    short_term_goals: plan.short_term_goals as unknown as any,
    long_term_goals: plan.long_term_goals as unknown as any,
    notes: plan.notes,
    status: plan.status,
    goal_results: plan.goal_results as unknown as any,
    improvements: plan.improvements as unknown as any,
    current_status: plan.current_status,
    current_status_notes: plan.current_status_notes,
    last_review_date: plan.last_review_date,
    next_review_date: plan.next_review_date,
    is_shared_with_patient: plan.is_shared_with_patient,
  });

  // Helper to create a version snapshot
  const createVersionSnapshot = useCallback(async (planId: string, planData: TreatmentPlan, changeSummary: string) => {
    try {
      // Get the next version number
      const { data: existing } = await supabase
        .from("treatment_plan_versions")
        .select("version_number")
        .eq("treatment_plan_id", planId)
        .order("version_number", { ascending: false })
        .limit(1);

      const nextVersion = existing && existing.length > 0 
        ? (existing[0].version_number || 0) + 1 
        : 1;

      const { data: session } = await supabase.auth.getSession();

      await supabase
        .from("treatment_plan_versions")
        .insert({
          treatment_plan_id: planId,
          version_number: nextVersion,
          snapshot: planData as any,
          change_summary: changeSummary,
          created_by: session.session?.user?.id,
        });
    } catch (error) {
      console.error("Error creating version snapshot:", error);
    }
  }, []);

  const savePlan = useCallback(async (updatedPlan: TreatmentPlan, changeSummary?: string): Promise<boolean> => {
    setSaving(true);
    try {
      const dbData = mapPlanToDb(updatedPlan);
      const isNewPlan = !updatedPlan.id || updatedPlan.id.length !== 36;

      if (!isNewPlan) {
        // Update existing plan
        const { error } = await supabase
          .from("treatment_plans")
          .update(dbData)
          .eq("id", updatedPlan.id);

        if (error) throw error;

        // Create version snapshot for significant changes
        if (changeSummary) {
          await createVersionSnapshot(updatedPlan.id, updatedPlan, changeSummary);
        }
      } else {
        // Create new plan
        const { data: session } = await supabase.auth.getSession();
        const { data, error } = await supabase
          .from("treatment_plans")
          .insert({
            ...dbData,
            created_by: session.session?.user?.id,
          } as any)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          const newPlan = mapDbToPlan(data);
          setPlan(newPlan);
          // Create initial version
          await createVersionSnapshot(data.id, newPlan, "Versão inicial");
          return true;
        }
      }

      await loadPlans();
      return true;
    } catch (error) {
      console.error("Error saving treatment plan:", error);
      toast.error("Erro ao salvar plano de tratamento");
      return false;
    } finally {
      setSaving(false);
    }
  }, [loadPlans, createVersionSnapshot]);

  const archivePlan = useCallback(async (planId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("treatment_plans")
        .update({ status: "archived" })
        .eq("id", planId);

      if (error) throw error;

      await loadPlans();
      toast.success("Plano arquivado com sucesso!");
      return true;
    } catch (error) {
      console.error("Error archiving treatment plan:", error);
      toast.error("Erro ao arquivar plano de tratamento");
      return false;
    }
  }, [loadPlans]);

  const deletePlan = useCallback(async (planId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("treatment_plans")
        .delete()
        .eq("id", planId);

      if (error) throw error;

      await loadPlans();
      toast.success("Plano excluído com sucesso!");
      return true;
    } catch (error) {
      console.error("Error deleting treatment plan:", error);
      toast.error("Erro ao excluir plano de tratamento");
      return false;
    }
  }, [loadPlans]);

  return {
    plan,
    setPlan,
    archivedPlans,
    loading,
    saving,
    savePlan,
    archivePlan,
    deletePlan,
    refreshPlans: loadPlans,
  };
};
