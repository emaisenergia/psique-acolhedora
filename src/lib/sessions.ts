import { supabase } from "@/integrations/supabase/client";

export type SessionStatus = "scheduled" | "completed" | "cancelled" | "rescheduled" | "no_show";

export interface Session {
  id: string;
  patient_id: string;
  appointment_id?: string;
  psychologist_id?: string;
  session_date: string;
  duration_minutes?: number;
  status: SessionStatus;
  cancellation_reason?: string;
  detailed_notes?: string;
  summary?: string;
  ai_generated_summary?: string;
  clinical_observations?: string;
  transcription?: string;
  ai_insights?: {
    keyPoints?: string[];
    emotionalThemes?: string[];
    suggestedActions?: string[];
    riskFactors?: string[];
    progressIndicators?: string[];
  };
  recurring_themes?: string[];
  treatment_goals?: string[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface SessionFile {
  id: string;
  session_id: string;
  file_name: string;
  file_type: string;
  file_size?: number;
  storage_path: string;
  is_recording: boolean;
  created_at: string;
}

export const sessionsService = {
  async getPatientSessions(patientId: string): Promise<Session[]> {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("patient_id", patientId)
      .order("session_date", { ascending: false });

    if (error) throw error;
    return (data || []) as Session[];
  },

  async getSession(sessionId: string): Promise<Session | null> {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();

    if (error) throw error;
    return data as Session | null;
  },

  async createSession(session: Omit<Session, "id" | "created_at" | "updated_at">): Promise<Session> {
    const { data, error } = await supabase
      .from("sessions")
      .insert(session)
      .select()
      .single();

    if (error) throw error;
    return data as Session;
  },

  async updateSession(sessionId: string, updates: Partial<Session>): Promise<Session> {
    const { data, error } = await supabase
      .from("sessions")
      .update(updates)
      .eq("id", sessionId)
      .select()
      .single();

    if (error) throw error;
    return data as Session;
  },

  async deleteSession(sessionId: string): Promise<void> {
    const { error } = await supabase.from("sessions").delete().eq("id", sessionId);
    if (error) throw error;
  },

  async getSessionFiles(sessionId: string): Promise<SessionFile[]> {
    const { data, error } = await supabase
      .from("session_files")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as SessionFile[];
  },

  async uploadSessionFile(
    sessionId: string,
    file: File,
    isRecording = false
  ): Promise<SessionFile> {
    const timestamp = Date.now();
    const storagePath = `${sessionId}/${timestamp}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("session-files")
      .upload(storagePath, file);

    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from("session_files")
      .insert({
        session_id: sessionId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: storagePath,
        is_recording: isRecording,
      })
      .select()
      .single();

    if (error) throw error;
    return data as SessionFile;
  },

  async deleteSessionFile(fileId: string, storagePath: string): Promise<void> {
    const { error: storageError } = await supabase.storage
      .from("session-files")
      .remove([storagePath]);

    if (storageError) throw storageError;

    const { error } = await supabase.from("session_files").delete().eq("id", fileId);
    if (error) throw error;
  },

  async getFileUrl(storagePath: string): Promise<string> {
    const { data } = await supabase.storage
      .from("session-files")
      .createSignedUrl(storagePath, 3600);

    return data?.signedUrl || "";
  },

  async generateSummary(
    type: "summary" | "insights" | "evolution",
    options: {
      detailedNotes?: string;
      transcription?: string;
      patientName?: string;
      previousSessions?: Session[];
    }
  ): Promise<{ content?: string; insights?: Session["ai_insights"] }> {
    const { data, error } = await supabase.functions.invoke("generate-session-summary", {
      body: { type, ...options },
    });

    if (error) throw error;
    return data;
  },

  async transcribeAudio(audioBlob: Blob): Promise<string> {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );

    const { data, error } = await supabase.functions.invoke("transcribe-audio", {
      body: { audioBase64: base64, mimeType: audioBlob.type },
    });

    if (error) throw error;
    return data.transcription;
  },
};

export const SESSION_STATUS_CONFIG: Record<
  SessionStatus,
  { label: string; color: string; bgColor: string }
> = {
  scheduled: { label: "Agendada", color: "text-blue-700", bgColor: "bg-blue-100" },
  completed: { label: "Realizada", color: "text-emerald-700", bgColor: "bg-emerald-100" },
  cancelled: { label: "Cancelada", color: "text-rose-700", bgColor: "bg-rose-100" },
  rescheduled: { label: "Remarcada", color: "text-amber-700", bgColor: "bg-amber-100" },
  no_show: { label: "Faltou", color: "text-gray-700", bgColor: "bg-gray-100" },
};
