import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePatientAuth } from "@/context/PatientAuth";

export type PatientAppointment = {
  id: string;
  patient_id: string;
  psychologist_id: string | null;
  date_time: string;
  duration_minutes: number;
  service: string | null;
  mode: string;
  status: string;
  notes: string | null;
  meeting_url: string | null;
  created_at: string;
};

export type PatientActivity = {
  id: string;
  patient_id: string;
  assigned_by: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string;
  completed_at: string | null;
  created_at: string;
};

export type PatientMessage = {
  id: string;
  patient_id: string;
  author: string;
  author_user_id: string | null;
  content: string;
  urgent: boolean;
  read: boolean;
  created_at: string;
};

export type PatientJournalEntry = {
  id: string;
  patient_id: string;
  mood: string;
  note: string;
  created_at: string;
};

export const usePatientAppointments = () => {
  const { patient } = usePatientAuth();
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    if (!patient?.id) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("patient_id", patient.id)
      .order("date_time", { ascending: true });

    if (!error && data) {
      setAppointments(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();
  }, [patient?.id]);

  const createAppointment = async (appointment: Omit<PatientAppointment, "id" | "created_at">) => {
    const { data, error } = await supabase
      .from("appointments")
      .insert(appointment)
      .select()
      .single();

    if (!error && data) {
      setAppointments((prev) => [...prev, data]);
    }

    return { data, error };
  };

  const updateAppointment = async (id: string, updates: Partial<PatientAppointment>) => {
    const { data, error } = await supabase
      .from("appointments")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (!error && data) {
      setAppointments((prev) => prev.map((a) => (a.id === id ? data : a)));
    }

    return { data, error };
  };

  return { appointments, loading, fetchAppointments, createAppointment, updateAppointment };
};

export const usePatientActivities = () => {
  const { patient } = usePatientAuth();
  const [activities, setActivities] = useState<PatientActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    if (!patient?.id) {
      setActivities([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("patient_id", patient.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setActivities(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchActivities();
  }, [patient?.id]);

  const updateActivity = async (id: string, updates: Partial<PatientActivity>) => {
    const { data, error } = await supabase
      .from("activities")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (!error && data) {
      setActivities((prev) => prev.map((a) => (a.id === id ? data : a)));
    }

    return { data, error };
  };

  const toggleActivityStatus = async (id: string) => {
    const activity = activities.find((a) => a.id === id);
    if (!activity) return { error: new Error("Activity not found") };

    const newStatus = activity.status === "completed" ? "pending" : "completed";
    const completedAt = newStatus === "completed" ? new Date().toISOString() : null;

    return updateActivity(id, { status: newStatus, completed_at: completedAt });
  };

  return { activities, loading, fetchActivities, updateActivity, toggleActivityStatus };
};

export const usePatientMessages = () => {
  const { patient, user } = usePatientAuth();
  const [messages, setMessages] = useState<PatientMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    if (!patient?.id) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("secure_messages")
      .select("*")
      .eq("patient_id", patient.id)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();

    // Subscribe to realtime updates
    if (patient?.id) {
      const channel = supabase
        .channel(`messages-${patient.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "secure_messages",
            filter: `patient_id=eq.${patient.id}`,
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              setMessages((prev) => [...prev, payload.new as PatientMessage]);
            } else if (payload.eventType === "UPDATE") {
              setMessages((prev) =>
                prev.map((m) => (m.id === payload.new.id ? (payload.new as PatientMessage) : m))
              );
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [patient?.id]);

  const sendMessage = async (content: string, urgent: boolean = false) => {
    if (!patient?.id || !user?.id) return { error: new Error("Not authenticated") };

    const { data, error } = await supabase
      .from("secure_messages")
      .insert({
        patient_id: patient.id,
        author: "patient",
        author_user_id: user.id,
        content,
        urgent,
        read: false,
      })
      .select()
      .single();

    if (!error && data) {
      setMessages((prev) => [...prev, data]);
    }

    return { data, error };
  };

  return { messages, loading, fetchMessages, sendMessage };
};

export const usePatientJournal = () => {
  const { patient } = usePatientAuth();
  const [entries, setEntries] = useState<PatientJournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = async () => {
    if (!patient?.id) {
      setEntries([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("patient_id", patient.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setEntries(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();
  }, [patient?.id]);

  const createEntry = async (mood: string, note: string) => {
    if (!patient?.id) return { error: new Error("Not authenticated") };

    const { data, error } = await supabase
      .from("journal_entries")
      .insert({
        patient_id: patient.id,
        mood,
        note,
      })
      .select()
      .single();

    if (!error && data) {
      setEntries((prev) => [data, ...prev]);
    }

    return { data, error };
  };

  const updateEntry = async (id: string, mood: string, note: string) => {
    const { data, error } = await supabase
      .from("journal_entries")
      .update({ mood, note })
      .eq("id", id)
      .select()
      .single();

    if (!error && data) {
      setEntries((prev) => prev.map((e) => (e.id === id ? data : e)));
    }

    return { data, error };
  };

  return { entries, loading, fetchEntries, createEntry, updateEntry };
};
