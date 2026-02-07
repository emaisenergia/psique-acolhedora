import { Card, CardContent } from "@/components/ui/card";
import React from "react";

// --- Format helpers ---
export const formatDayMonth = (iso?: string) => {
  if (!iso) return "—";
  const date = new Date(iso);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date);
};

export const formatDateTimeLong = (iso?: string) => {
  if (!iso) return "—";
  const date = new Date(iso);
  const dayMonth = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
  const time = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${dayMonth}, ${time}`;
};

export const formatDueDate = (iso?: string) => {
  if (!iso) return "Sem prazo definido";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long" }).format(new Date(iso));
};

export const clampPercent = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

// --- Mood constants ---
export type MoodValue = "muito_bem" | "bem" | "neutro" | "desafiador" | "dificil";

export const MOOD_OPTIONS: { value: MoodValue; label: string; description: string }[] = [
  { value: "muito_bem", label: "Muito bem", description: "Estado positivo, engajado e confiante." },
  { value: "bem", label: "Bem", description: "Estável, com leve bem-estar percebido." },
  { value: "neutro", label: "Neutro", description: "Humor equilibrado, sem grandes oscilações." },
  { value: "desafiador", label: "Desafiador", description: "Enfrentando situações complexas ou estressantes." },
  { value: "dificil", label: "Difícil", description: "Humor fragilizado, demanda atenção e suporte." },
];

export const MOOD_LABELS: Record<MoodValue, string> = MOOD_OPTIONS.reduce(
  (acc, item) => ({ ...acc, [item.value]: item.label }),
  {} as Record<MoodValue, string>
);

export const MOOD_BADGE_CLASSES: Record<MoodValue, string> = {
  muito_bem: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  bem: "bg-teal-100 text-teal-700 border border-teal-200",
  neutro: "bg-slate-100 text-slate-700 border border-slate-200",
  desafiador: "bg-amber-100 text-amber-700 border border-amber-200",
  dificil: "bg-rose-100 text-rose-700 border border-rose-200",
};

// --- Shared UI components ---
export const MetricCard = ({ icon, title, value, subtitle }: { icon: React.ReactNode; title: string; value: React.ReactNode; subtitle?: string }) => (
  <Card className="card-glass">
    <CardContent className="p-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">{icon}{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
    </CardContent>
  </Card>
);

export const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
  <div className="py-3 border-b border-border/50">
    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">{icon}{label.toUpperCase()}</div>
    <div className="text-foreground">{value}</div>
  </div>
);

export const ActivitySummaryRow = ({ label, value, helper }: { label: string; value: React.ReactNode; helper?: React.ReactNode }) => (
  <div className="rounded-xl border border-border/60 bg-card px-4 py-3">
    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
    <div className="text-lg font-semibold text-foreground">{value}</div>
    {helper && <div className="text-xs text-muted-foreground">{helper}</div>}
  </div>
);
