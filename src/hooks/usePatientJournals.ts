import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type JournalEntry = {
  id: string;
  patientId: string;
  mood: "muito_bem" | "bem" | "neutro" | "desafiador" | "dificil";
  note: string;
  tags?: string[];
  createdAt: string;
};

export const MOOD_OPTIONS: { value: JournalEntry["mood"]; label: string; description: string }[] = [
  { value: "muito_bem", label: "Muito bem", description: "Estado positivo, engajado e confiante." },
  { value: "bem", label: "Bem", description: "Estável, com leve bem-estar percebido." },
  { value: "neutro", label: "Neutro", description: "Humor equilibrado, sem grandes oscilações." },
  { value: "desafiador", label: "Desafiador", description: "Enfrentando situações complexas ou estressantes." },
  { value: "dificil", label: "Difícil", description: "Humor fragilizado, demanda atenção e suporte." },
];

export const MOOD_LABELS: Record<JournalEntry["mood"], string> = MOOD_OPTIONS.reduce(
  (acc, item) => ({ ...acc, [item.value]: item.label }),
  {} as Record<JournalEntry["mood"], string>
);

export const MOOD_BADGE_CLASSES: Record<JournalEntry["mood"], string> = {
  muito_bem: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  bem: "bg-teal-100 text-teal-700 border border-teal-200",
  neutro: "bg-slate-100 text-slate-700 border border-slate-200",
  desafiador: "bg-amber-100 text-amber-700 border border-amber-200",
  dificil: "bg-rose-100 text-rose-700 border border-rose-200",
};

export const usePatientJournals = (patientId: string | null) => {
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchJournals = useCallback(async () => {
    if (!patientId) {
      setJournals([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setJournals(
        data.map((item) => ({
          id: item.id,
          patientId: item.patient_id,
          mood: item.mood as JournalEntry["mood"],
          note: item.note,
          createdAt: item.created_at,
        }))
      );
    }
    setIsLoading(false);
  }, [patientId]);

  const patientJournals = useMemo(() => {
    if (!patientId) return [];
    return journals
      .filter((e) => e.patientId === patientId)
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [journals, patientId]);

  const lastJournalEntry = useMemo(() => patientJournals[0] || null, [patientJournals]);
  const firstJournalEntry = useMemo(
    () => (patientJournals.length > 0 ? patientJournals[patientJournals.length - 1] : null),
    [patientJournals]
  );

  const journalMoodDistribution = useMemo(() => {
    const base: Record<JournalEntry["mood"], number> = { muito_bem: 0, bem: 0, neutro: 0, desafiador: 0, dificil: 0 };
    patientJournals.forEach((e) => { base[e.mood] = (base[e.mood] || 0) + 1; });
    return base;
  }, [patientJournals]);

  const journalEntriesThisMonth = useMemo(() => {
    const now = new Date();
    return patientJournals.filter((e) => {
      const d = new Date(e.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }, [patientJournals]);

  const predominantMood = useMemo(() => {
    let topMood: JournalEntry["mood"] | null = null;
    let topCount = 0;
    (Object.entries(journalMoodDistribution) as [JournalEntry["mood"], number][]).forEach(([mood, count]) => {
      if (count > topCount) { topMood = mood; topCount = count; }
    });
    return topMood;
  }, [journalMoodDistribution]);

  const journalTags = useMemo(() => {
    const tagSet = new Set<string>();
    patientJournals.forEach((e) => e.tags?.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet);
  }, [patientJournals]);

  const addJournalEntry = async (mood: JournalEntry["mood"], note: string) => {
    if (!patientId || !note.trim()) return false;
    try {
      const { data: newEntry, error } = await supabase
        .from("journal_entries")
        .insert({ patient_id: patientId, mood, note: note.trim() })
        .select()
        .single();
      if (error) throw error;
      if (newEntry) {
        setJournals((prev) => [
          { id: newEntry.id, patientId: newEntry.patient_id, mood: newEntry.mood as JournalEntry["mood"], note: newEntry.note, createdAt: newEntry.created_at },
          ...prev,
        ]);
        toast.success("Evolução registrada com sucesso!");
        return true;
      }
    } catch (error) {
      console.error("Error saving journal entry:", error);
      toast.error("Erro ao registrar evolução. Verifique se você está autenticado e tente novamente.");
    }
    return false;
  };

  const deleteJournalEntry = async (entryId: string) => {
    if (typeof window !== "undefined" && !window.confirm("Remover esta evolução do prontuário?")) return;
    const { error } = await supabase.from("journal_entries").delete().eq("id", entryId);
    if (!error) {
      setJournals((prev) => prev.filter((e) => e.id !== entryId));
    }
  };

  return {
    journals,
    isLoading,
    fetchJournals,
    patientJournals,
    lastJournalEntry,
    firstJournalEntry,
    journalMoodDistribution,
    journalEntriesThisMonth,
    predominantMood,
    journalTags,
    addJournalEntry,
    deleteJournalEntry,
  };
};
