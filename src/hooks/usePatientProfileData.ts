import { useState, useCallback, useEffect } from "react";
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
  feedbackThread?: { id: string; author: "patient" | "psychologist"; message: string; createdAt: string }[];
};

export type SecureMessage = {
  id: string;
  patientId: string;
  author: "patient" | "psychologist";
  content: string;
  createdAt: string;
  urgent: boolean;
  read: boolean;
};

export type JournalEntry = {
  id: string;
  patientId: string;
  mood: "muito_bem" | "bem" | "neutro" | "desafiador" | "dificil";
  note: string;
  tags?: string[];
  createdAt: string;
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

export const usePatientProfileData = (patientId: string | null) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [messages, setMessages] = useState<SecureMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [journalsLoading, setJournalsLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    if (!patientId) { setActivities([]); setActivitiesLoading(false); return; }
    setActivitiesLoading(true);
    const { data, error } = await supabase
      .from("activities").select("*").eq("patient_id", patientId)
      .order("created_at", { ascending: false });
    if (!error && data) setActivities(data.map(mapActivity));
    setActivitiesLoading(false);
  }, [patientId]);

  const fetchMessages = useCallback(async () => {
    if (!patientId) { setMessages([]); setMessagesLoading(false); return; }
    setMessagesLoading(true);
    const { data, error } = await supabase
      .from("secure_messages").select("*").eq("patient_id", patientId)
      .order("created_at", { ascending: true });
    if (!error && data) {
      setMessages(data.map((item) => ({
        id: item.id, patientId: item.patient_id,
        author: item.author as "patient" | "psychologist",
        content: item.content, createdAt: item.created_at,
        urgent: item.urgent, read: item.read,
      })));
    }
    setMessagesLoading(false);
  }, [patientId]);

  const fetchJournals = useCallback(async () => {
    if (!patientId) { setJournals([]); setJournalsLoading(false); return; }
    setJournalsLoading(true);
    const { data, error } = await supabase
      .from("journal_entries").select("*").eq("patient_id", patientId)
      .order("created_at", { ascending: false });
    if (!error && data) {
      setJournals(data.map((item) => ({
        id: item.id, patientId: item.patient_id,
        mood: item.mood as JournalEntry["mood"],
        note: item.note, createdAt: item.created_at,
      })));
    }
    setJournalsLoading(false);
  }, [patientId]);

  useEffect(() => {
    fetchActivities();
    fetchMessages();
    fetchJournals();
  }, [fetchActivities, fetchMessages, fetchJournals]);

  // --- Activity CRUD ---
  const handleCreateActivity = async (data: {
    title: string; description?: string; dueDate?: string;
    assignedBy?: string; fields?: ActivityField[];
    attachmentUrl?: string; attachmentName?: string;
  }) => {
    if (!patientId) return;
    const { data: newActivity, error } = await supabase
      .from("activities")
      .insert({
        patient_id: patientId, title: data.title,
        description: data.description || null, due_date: data.dueDate || null,
        status: "pending", assigned_by: data.assignedBy || null,
        custom_fields: data.fields || null,
        attachment_url: data.attachmentUrl || null,
        attachment_name: data.attachmentName || null,
      })
      .select().single();
    if (error) { console.error("Error creating activity:", error); toast.error("Erro ao criar atividade"); return; }
    if (newActivity) {
      setActivities((prev) => [mapActivity(newActivity), ...prev]);
      try {
        await notifyNewActivity(patientId, data.title);
        toast.success("Atividade criada e notificação enviada ao paciente");
      } catch { toast.success("Atividade criada (notificação não enviada)"); }
    }
  };

  const toggleActivityStatus = async (activityId: string) => {
    const activity = activities.find((a) => a.id === activityId);
    if (!activity) return;
    const newStatus = activity.status === "completed" ? "pending" : "completed";
    const completedAt = newStatus === "completed" ? new Date().toISOString() : null;
    const { error } = await supabase.from("activities").update({ status: newStatus, completed_at: completedAt }).eq("id", activityId);
    if (!error) {
      setActivities((prev) => prev.map((a) => a.id === activityId ? { ...a, status: newStatus, completedAt: completedAt || undefined } : a));
    }
  };

  const deleteActivity = async (activityId: string) => {
    const { error } = await supabase.from("activities").delete().eq("id", activityId);
    if (!error) setActivities((prev) => prev.filter((a) => a.id !== activityId));
  };

  const saveFeedback = async (activityId: string, feedback: string) => {
    const activityToUpdate = activities.find(a => a.id === activityId);
    if (!activityToUpdate) return;
    await supabase.from("activities").update({ psychologist_feedback: feedback, feedback_at: new Date().toISOString() }).eq("id", activityId);
    const updated = { ...activityToUpdate, psychologistFeedback: feedback, feedbackAt: new Date().toISOString() };
    setActivities((prev) => prev.map(a => a.id === activityId ? updated : a));
    toast.success("Feedback salvo com sucesso!");
    return updated;
  };

  const addThreadComment = async (activityId: string, comment: string) => {
    const activityToUpdate = activities.find(a => a.id === activityId);
    if (!activityToUpdate) return;
    const currentThread = activityToUpdate.feedbackThread || [];
    const newComment = { id: uid(), author: "psychologist" as const, message: comment, createdAt: new Date().toISOString() };
    const updatedThread = [...currentThread, newComment];
    await supabase.from("activities").update({ feedback_thread: updatedThread }).eq("id", activityId);
    const updated = { ...activityToUpdate, feedbackThread: updatedThread };
    setActivities((prev) => prev.map(a => a.id === activityId ? updated : a));
    if (patientId && activityToUpdate.title) {
      try { await notifyThreadCommentToPatient(patientId, activityToUpdate.title, comment); } catch {}
    }
    toast.success("Comentário adicionado!");
    return updated;
  };

  // --- Journal CRUD ---
  const addJournalEntry = async (mood: string, note: string) => {
    if (!patientId) return;
    const { data: newEntry, error } = await supabase
      .from("journal_entries").insert({ patient_id: patientId, mood, note })
      .select().single();
    if (!error && newEntry) {
      setJournals((prev) => [{
        id: newEntry.id, patientId: newEntry.patient_id,
        mood: newEntry.mood as JournalEntry["mood"], note: newEntry.note, createdAt: newEntry.created_at,
      }, ...prev]);
    }
  };

  const deleteJournalEntry = async (entryId: string) => {
    if (typeof window !== "undefined" && !window.confirm("Remover esta evolução do prontuário?")) return;
    const { error } = await supabase.from("journal_entries").delete().eq("id", entryId);
    if (!error) setJournals((prev) => prev.filter((e) => e.id !== entryId));
  };

  // --- Messages ---
  const markMessageRead = async (messageId: string) => {
    const { error } = await supabase.from("secure_messages").update({ read: true }).eq("id", messageId);
    if (!error) setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, read: true } : m)));
  };

  const sendReply = async (content: string) => {
    if (!patientId) return;
    const trimmed = content.trim();
    if (!trimmed) return;
    const { data: newMessage, error } = await supabase
      .from("secure_messages")
      .insert({ patient_id: patientId, author: "psychologist", content: trimmed, urgent: false, read: true })
      .select().single();
    if (!error && newMessage) {
      setMessages((prev) => [...prev, {
        id: newMessage.id, patientId: newMessage.patient_id,
        author: newMessage.author as "patient" | "psychologist",
        content: newMessage.content, createdAt: newMessage.created_at,
        urgent: newMessage.urgent, read: newMessage.read,
      }]);
    }
  };

  return {
    activities, activitiesLoading, setActivities,
    messages, messagesLoading,
    journals, journalsLoading,
    handleCreateActivity, toggleActivityStatus, deleteActivity, saveFeedback, addThreadComment,
    addJournalEntry, deleteJournalEntry,
    markMessageRead, sendReply,
  };
};
