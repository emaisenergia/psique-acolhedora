import { supabase } from "@/integrations/supabase/client";

export interface AIAction {
  id: string;
  type: "update_session" | "update_patient_notes" | "create_activity" | "update_treatment_plan";
  label: string;
  description: string;
  data: Record<string, unknown>;
  status: "pending" | "confirmed" | "rejected";
}

const ACTION_REGEX = /:::ACTION:::([\s\S]*?):::END_ACTION:::/g;

export function parseActionsFromContent(content: string): { cleanContent: string; actions: AIAction[] } {
  const actions: AIAction[] = [];
  let cleanContent = content;

  let match;
  while ((match = ACTION_REGEX.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      actions.push({
        id: crypto.randomUUID(),
        type: parsed.type,
        label: parsed.label || getDefaultLabel(parsed.type),
        description: parsed.description || "",
        data: parsed.data || {},
        status: "pending",
      });
    } catch {
      console.error("Failed to parse AI action:", match[1]);
    }
  }

  // Remove action blocks from visible content
  cleanContent = content.replace(ACTION_REGEX, "").trim();

  return { cleanContent, actions };
}

function getDefaultLabel(type: string): string {
  const labels: Record<string, string> = {
    update_session: "Atualizar sessão",
    update_patient_notes: "Atualizar anotações do paciente",
    create_activity: "Criar atividade",
    update_treatment_plan: "Atualizar plano de tratamento",
  };
  return labels[type] || "Ação";
}

export async function executeAIAction(action: AIAction): Promise<{ success: boolean; error?: string }> {
  try {
    switch (action.type) {
      case "update_session": {
        const { session_id, ...fields } = action.data as { session_id: string; [key: string]: unknown };
        if (!session_id) return { success: false, error: "ID da sessão não informado" };

        // Only allow safe fields
        const allowedFields = ["summary", "clinical_observations", "detailed_notes", "patient_mood", "ai_generated_summary"];
        const safeUpdate: Record<string, unknown> = {};
        for (const key of allowedFields) {
          if (fields[key] !== undefined) safeUpdate[key] = fields[key];
        }

        const { error } = await supabase
          .from("sessions")
          .update(safeUpdate)
          .eq("id", session_id);

        if (error) return { success: false, error: error.message };
        return { success: true };
      }

      case "update_patient_notes": {
        const { patient_id, notes } = action.data as { patient_id: string; notes: string };
        if (!patient_id) return { success: false, error: "ID do paciente não informado" };

        const { error } = await supabase
          .from("patients")
          .update({ notes })
          .eq("id", patient_id);

        if (error) return { success: false, error: error.message };
        return { success: true };
      }

      case "create_activity": {
        const { patient_id, title, description, due_date } = action.data as {
          patient_id: string;
          title: string;
          description?: string;
          due_date?: string;
        };
        if (!patient_id || !title) return { success: false, error: "Dados insuficientes para criar atividade" };

        const { data: session } = await supabase.auth.getSession();
        const userId = session?.session?.user?.id;

        const { error } = await supabase
          .from("activities")
          .insert({
            patient_id,
            title,
            description: description || null,
            due_date: due_date || null,
            assigned_by: userId || null,
            status: "pending",
          });

        if (error) return { success: false, error: error.message };
        return { success: true };
      }

      case "update_treatment_plan": {
        const { patient_id, ...fields } = action.data as { patient_id: string; [key: string]: unknown };
        if (!patient_id) return { success: false, error: "ID do paciente não informado" };

        const allowedFields = ["notes", "current_status_notes", "current_progress", "current_status"];
        const safeUpdate: Record<string, unknown> = {};
        for (const key of allowedFields) {
          if (fields[key] !== undefined) safeUpdate[key] = fields[key];
        }

        const { error } = await supabase
          .from("treatment_plans")
          .update(safeUpdate)
          .eq("patient_id", patient_id)
          .eq("status", "active");

        if (error) return { success: false, error: error.message };
        return { success: true };
      }

      default:
        return { success: false, error: "Tipo de ação desconhecido" };
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro desconhecido" };
  }
}
