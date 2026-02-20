import { supabase } from "@/integrations/supabase/client";

const BUCKET = "session-files";
const MAX_HISTORY_LENGTH = 8000; // chars to keep in history file

function getHistoryPath(patientId: string): string {
  return `ai-history/${patientId}.txt`;
}

export async function loadPatientAIHistory(patientId: string): Promise<string> {
  try {
    const path = getHistoryPath(patientId);
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .download(path);

    if (error || !data) return "";
    return await data.text();
  } catch {
    return "";
  }
}

export async function savePatientAIHistory(
  patientId: string,
  userMessage: string,
  assistantResponse: string
): Promise<void> {
  try {
    const path = getHistoryPath(patientId);
    const existing = await loadPatientAIHistory(patientId);

    const timestamp = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const newEntry = `
--- ${timestamp} ---
Paciente/Profissional: ${userMessage}
Assistente: ${assistantResponse}
`;
    
    let updatedHistory = existing + newEntry;

    // Trim to max length, keeping the most recent entries
    if (updatedHistory.length > MAX_HISTORY_LENGTH) {
      updatedHistory = updatedHistory.slice(-MAX_HISTORY_LENGTH);
      // Clean up partial entry at the beginning
      const firstSeparator = updatedHistory.indexOf("\n---");
      if (firstSeparator > 0) {
        updatedHistory = updatedHistory.slice(firstSeparator);
      }
    }

    const blob = new Blob([updatedHistory], { type: "text/plain" });
    const file = new File([blob], `${patientId}.txt`, { type: "text/plain" });

    await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true });
  } catch (error) {
    console.error("Error saving AI history:", error);
  }
}
