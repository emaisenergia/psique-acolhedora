import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { type ActivityField, uid } from "@/lib/storage";
import { notifyNewActivity, notifyThreadCommentToPatient } from "@/lib/notifications";

export type Activity = {
  id: string;
  patientId: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: "pending" | "completed";
  assignedBy?: string;
  createdAt: string;
  completedAt?: string;
  fields?: ActivityField[];
  attachmentUrl?: string;
  attachmentName?: string;
  patientResponses?: Record<string, string | boolean>;
  responseHistory?: { timestamp: string; responses: Record<string, string | boolean> }[];
  psychologistFeedback?: string;
  feedbackAt?: string;
  feedbackThread?: { id: string; author: "patient" | "psychologist"; content: string; created_at: string }[];
};

const mapActivity = (item: any): Activity => ({
  id: item.id,
  patientId: item.patient_id,
  title: item.title,
  description: item.description || undefined,
  dueDate: item.due_date || undefined,
  status: item.status as "pending" | "completed",
  assignedBy: item.assigned_by || undefined,
  createdAt: item.created_at,
  completedAt: item.completed_at || undefined,
  fields: (item.custom_fields as ActivityField[] | null) || undefined,
  attachmentUrl: item.attachment_url || undefined,
  attachmentName: item.attachment_name || undefined,
  patientResponses: item.patient_responses as Record<string, string | boolean> | undefined,
  responseHistory: item.response_history as Activity["responseHistory"],
  psychologistFeedback: item.psychologist_feedback || undefined,
  feedbackAt: item.feedback_at || undefined,
  feedbackThread: item.feedback_thread as Activity["feedbackThread"],
});

export const usePatientActivities = (patientId: string | null) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    if (!patientId) {
      setActivities([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setActivities(data.map(mapActivity));
    }
    setIsLoading(false);
  }, [patientId]);

  const myActivities = useMemo(() => {
    if (!patientId) return [];
    return activities
      .filter((a) => a.patientId === patientId)
      .slice()
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
        const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
        const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
        if (aDue !== bDue) return aDue - bDue;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [activities, patientId]);

  const pendingActivities = useMemo(() => myActivities.filter((a) => a.status === "pending"), [myActivities]);
  const completedActivities = useMemo(() => myActivities.filter((a) => a.status === "completed"), [myActivities]);

  const lastActivity = useMemo(() => {
    if (myActivities.length === 0) return null;
    return myActivities.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }, [myActivities]);

  const nextDueActivity = useMemo(() => {
    if (pendingActivities.length === 0) return null;
    return pendingActivities.slice().sort((a, b) => {
      const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
      const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
      return aDue - bDue;
    })[0];
  }, [pendingActivities]);

  const createActivity = async (data: {
    title: string;
    description?: string;
    dueDate?: string;
    assignedBy?: string;
    fields?: ActivityField[];
    attachmentUrl?: string;
    attachmentName?: string;
  }) => {
    if (!patientId) return;
    const { data: newActivity, error } = await supabase
      .from("activities")
      .insert({
        patient_id: patientId,
        title: data.title,
        description: data.description || null,
        due_date: data.dueDate || null,
        status: "pending",
        assigned_by: data.assignedBy || null,
        custom_fields: data.fields || null,
        attachment_url: data.attachmentUrl || null,
        attachment_name: data.attachmentName || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating activity:", error);
      toast.error("Erro ao criar atividade");
      return;
    }

    if (newActivity) {
      setActivities((prev) => [mapActivity(newActivity), ...prev]);
      try {
        await notifyNewActivity(patientId, data.title);
        toast.success("Atividade criada e notificação enviada ao paciente");
      } catch {
        toast.success("Atividade criada (notificação não enviada)");
      }
    }
  };

  const toggleActivityStatus = async (activityId: string) => {
    const activity = activities.find((a) => a.id === activityId);
    if (!activity) return;
    const newStatus = activity.status === "completed" ? "pending" : "completed";
    const completedAt = newStatus === "completed" ? new Date().toISOString() : null;
    const { error } = await supabase
      .from("activities")
      .update({ status: newStatus, completed_at: completedAt })
      .eq("id", activityId);
    if (!error) {
      setActivities((prev) =>
        prev.map((a) => (a.id === activityId ? { ...a, status: newStatus, completedAt: completedAt || undefined } : a))
      );
    }
  };

  const deleteActivity = async (activityId: string) => {
    const { error } = await supabase.from("activities").delete().eq("id", activityId);
    if (!error) {
      setActivities((prev) => prev.filter((a) => a.id !== activityId));
    }
  };

  const saveFeedback = async (activityId: string, feedback: string) => {
    const activityToUpdate = activities.find((a) => a.id === activityId);
    if (!activityToUpdate) return null;
    const updatedActivity = { ...activityToUpdate, psychologistFeedback: feedback, feedbackAt: new Date().toISOString() } as Activity;
    await supabase.from("activities").update({ psychologist_feedback: feedback, feedback_at: new Date().toISOString() }).eq("id", activityId);
    setActivities((prev) => prev.map((a) => (a.id === activityId ? updatedActivity : a)));
    toast.success("Feedback salvo com sucesso!");
    return updatedActivity;
  };

  const addThreadComment = async (activityId: string, comment: string) => {
    const activityToUpdate = activities.find((a) => a.id === activityId);
    if (!activityToUpdate) return null;
    const currentThread = activityToUpdate.feedbackThread || [];
    const newComment = { id: uid(), author: "psychologist" as const, content: comment, created_at: new Date().toISOString() } as any;
    const updatedThread = [...currentThread, newComment];
    const updatedActivity = { ...activityToUpdate, feedbackThread: updatedThread } as Activity;
    await supabase.from("activities").update({ feedback_thread: updatedThread }).eq("id", activityId);
    setActivities((prev) => prev.map((a) => (a.id === activityId ? updatedActivity : a)));
    if (patientId && activityToUpdate.title) {
      try {
        await notifyThreadCommentToPatient(patientId, activityToUpdate.title, comment);
      } catch (error) {
        console.error("Error sending thread notification to patient:", error);
      }
    }
    toast.success("Comentário adicionado!");
    return updatedActivity;
  };

  return {
    activities,
    isLoading,
    fetchActivities,
    myActivities,
    pendingActivities,
    completedActivities,
    lastActivity,
    nextDueActivity,
    createActivity,
    toggleActivityStatus,
    deleteActivity,
    saveFeedback,
    addThreadComment,
  };
};
