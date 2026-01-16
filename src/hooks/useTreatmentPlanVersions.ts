import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { TreatmentPlan } from "./useTreatmentPlan";

export interface TreatmentPlanVersion {
  id: string;
  treatment_plan_id: string;
  version_number: number;
  snapshot: TreatmentPlan;
  change_summary: string | null;
  created_at: string;
  created_by: string | null;
}

export const useTreatmentPlanVersions = (treatmentPlanId: string | undefined) => {
  const [versions, setVersions] = useState<TreatmentPlanVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadVersions = useCallback(async () => {
    if (!treatmentPlanId) {
      setVersions([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("treatment_plan_versions")
        .select("*")
        .eq("treatment_plan_id", treatmentPlanId)
        .order("version_number", { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map((v: any) => ({
        id: v.id,
        treatment_plan_id: v.treatment_plan_id,
        version_number: v.version_number,
        snapshot: v.snapshot as TreatmentPlan,
        change_summary: v.change_summary,
        created_at: v.created_at,
        created_by: v.created_by,
      }));

      setVersions(mapped);
    } catch (error) {
      console.error("Error loading versions:", error);
    } finally {
      setLoading(false);
    }
  }, [treatmentPlanId]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  const createVersion = useCallback(async (
    plan: TreatmentPlan,
    changeSummary?: string
  ): Promise<boolean> => {
    if (!plan.id) return false;

    setSaving(true);
    try {
      // Get the next version number
      const { data: existing } = await supabase
        .from("treatment_plan_versions")
        .select("version_number")
        .eq("treatment_plan_id", plan.id)
        .order("version_number", { ascending: false })
        .limit(1);

      const nextVersion = existing && existing.length > 0 
        ? (existing[0].version_number || 0) + 1 
        : 1;

      const { data: session } = await supabase.auth.getSession();

      const { error } = await supabase
        .from("treatment_plan_versions")
        .insert({
          treatment_plan_id: plan.id,
          version_number: nextVersion,
          snapshot: plan as any,
          change_summary: changeSummary || `Versão ${nextVersion}`,
          created_by: session.session?.user?.id,
        });

      if (error) throw error;

      await loadVersions();
      return true;
    } catch (error) {
      console.error("Error creating version:", error);
      toast.error("Erro ao criar versão do plano");
      return false;
    } finally {
      setSaving(false);
    }
  }, [loadVersions]);

  const compareVersions = (v1: TreatmentPlanVersion, v2: TreatmentPlanVersion) => {
    const differences: { field: string; old: any; new: any }[] = [];
    const s1 = v1.snapshot;
    const s2 = v2.snapshot;

    // Compare arrays
    const compareArrays = (field: string, arr1: string[], arr2: string[]) => {
      const added = arr2.filter(item => !arr1.includes(item));
      const removed = arr1.filter(item => !arr2.includes(item));
      if (added.length > 0 || removed.length > 0) {
        differences.push({ 
          field, 
          old: removed.length > 0 ? `Removido: ${removed.join(", ")}` : null, 
          new: added.length > 0 ? `Adicionado: ${added.join(", ")}` : null 
        });
      }
    };

    // Simple fields
    if (s1.estimated_sessions !== s2.estimated_sessions) {
      differences.push({ 
        field: "Sessões estimadas", 
        old: s1.estimated_sessions, 
        new: s2.estimated_sessions 
      });
    }
    if (s1.current_status !== s2.current_status) {
      differences.push({ 
        field: "Status", 
        old: s1.current_status, 
        new: s2.current_status 
      });
    }
    if (s1.current_progress !== s2.current_progress) {
      differences.push({ 
        field: "Progresso", 
        old: `${s1.current_progress}%`, 
        new: `${s2.current_progress}%` 
      });
    }
    if (s1.notes !== s2.notes) {
      differences.push({ 
        field: "Observações", 
        old: s1.notes?.slice(0, 50) + "...", 
        new: s2.notes?.slice(0, 50) + "..." 
      });
    }

    // Array fields
    compareArrays("Objetivos", s1.objectives, s2.objectives);
    compareArrays("Critérios de alta", s1.discharge_objectives, s2.discharge_objectives);
    compareArrays("Metas curto prazo", s1.short_term_goals, s2.short_term_goals);
    compareArrays("Metas longo prazo", s1.long_term_goals, s2.long_term_goals);
    compareArrays("Abordagens", s1.approaches, s2.approaches);

    // Improvements count
    if (s1.improvements.length !== s2.improvements.length) {
      differences.push({ 
        field: "Melhoras registradas", 
        old: s1.improvements.length, 
        new: s2.improvements.length 
      });
    }

    // Goal results
    const completedGoals1 = s1.goal_results.filter(g => g.completed).length;
    const completedGoals2 = s2.goal_results.filter(g => g.completed).length;
    if (completedGoals1 !== completedGoals2) {
      differences.push({ 
        field: "Metas concluídas", 
        old: completedGoals1, 
        new: completedGoals2 
      });
    }

    return differences;
  };

  return {
    versions,
    loading,
    saving,
    createVersion,
    compareVersions,
    refreshVersions: loadVersions,
  };
};
