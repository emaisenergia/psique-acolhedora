import { useMemo } from "react";
import type { AppointmentRow } from "@/hooks/useAppointments";
import type { Activity, JournalEntry, SecureMessage } from "@/hooks/usePatientProfileData";
import type { MoodValue } from "@/components/patient-profile/PatientProfileHelpers";
import { clampPercent, formatDayMonth, formatDateTimeLong } from "@/components/patient-profile/PatientProfileHelpers";
import { CheckCircle2, Activity as ActivityIcon, Target, UserCheck, Clock, CalendarDays, XCircle } from "lucide-react";

export const usePatientProfileStats = (
  patientId: string | null,
  appts: AppointmentRow[],
  activities: Activity[],
  messages: SecureMessage[],
  journals: JournalEntry[]
) => {
  const myActivities = useMemo(() => {
    if (!patientId) return [] as Activity[];
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
  const lastActivity = useMemo(() => myActivities.length === 0 ? null : myActivities.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0], [myActivities]);
  const nextDueActivity = useMemo(() => {
    if (pendingActivities.length === 0) return null;
    return pendingActivities.slice().sort((a, b) => {
      const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
      const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
      return aDue - bDue;
    })[0];
  }, [pendingActivities]);

  const patientMessages = useMemo(() => {
    if (!patientId) return [] as SecureMessage[];
    return messages.filter((m) => m.patientId === patientId).slice().sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messages, patientId]);

  const unreadPatientMessages = useMemo(() => patientMessages.filter((m) => m.author === "patient" && !m.read), [patientMessages]);
  const urgentPatientMessages = useMemo(() => patientMessages.filter((m) => m.author === "patient" && m.urgent), [patientMessages]);

  const patientJournals = useMemo(() => {
    if (!patientId) return [] as JournalEntry[];
    return journals.filter((e) => e.patientId === patientId).slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [journals, patientId]);

  const lastJournalEntry = useMemo(() => patientJournals[0] || null, [patientJournals]);
  const firstJournalEntry = useMemo(() => patientJournals.length > 0 ? patientJournals[patientJournals.length - 1] : null, [patientJournals]);

  const journalMoodDistribution = useMemo(() => {
    const base: Record<MoodValue, number> = { muito_bem: 0, bem: 0, neutro: 0, desafiador: 0, dificil: 0 };
    patientJournals.forEach((entry) => { base[entry.mood] = (base[entry.mood] || 0) + 1; });
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
    let topMood: MoodValue | null = null;
    let topCount = 0;
    (Object.entries(journalMoodDistribution) as [MoodValue, number][]).forEach(([mood, count]) => {
      if (count > topCount) { topMood = mood; topCount = count; }
    });
    return topMood;
  }, [journalMoodDistribution]);

  const journalTags = useMemo(() => {
    const s = new Set<string>();
    patientJournals.forEach((e) => e.tags?.forEach((t) => s.add(t)));
    return Array.from(s);
  }, [patientJournals]);

  // --- Appointment stats ---
  const apptsSortedAsc = useMemo(() => appts.slice().sort((a, b) => new Date(a.date_time || 0).getTime() - new Date(b.date_time || 0).getTime()), [appts]);
  const apptsSortedDesc = useMemo(() => apptsSortedAsc.slice().reverse(), [apptsSortedAsc]);

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthAppointments = useMemo(() => apptsSortedAsc.filter((a) => (a.date_time || "").startsWith(monthKey)), [apptsSortedAsc, monthKey]);
  const monthDone = monthAppointments.filter((a) => a.status === "done").length;
  const monthScheduled = monthAppointments.length;
  const progressPct = monthScheduled ? clampPercent((monthDone / monthScheduled) * 100) : 0;
  const monthPending = Math.max(monthScheduled - monthDone, 0);

  const pastSessionsDesc = useMemo(() => apptsSortedDesc.filter((a) => !!a.date_time && new Date(a.date_time).getTime() <= Date.now()), [apptsSortedDesc]);
  const doneHistory = useMemo(() => pastSessionsDesc.filter((a) => a.status === "done"), [pastSessionsDesc]);
  const totalSessoes = appts.filter((a) => a.status !== "cancelled").length;
  const totalRecebido = appts.filter((a) => a.status === "done").reduce((s, a) => s + (a.payment_value || 0), 0);
  const pendentes = appts.filter((a) => a.status === "scheduled" || a.status === "confirmed").length;
  const cancellations = appts.filter((a) => a.status === "cancelled").length;
  const attendanceRate = apptsSortedAsc.length ? clampPercent((doneHistory.length / apptsSortedAsc.length) * 100) : 0;

  const streak = useMemo(() => {
    let count = 0;
    for (const appt of pastSessionsDesc) {
      if (appt.status === "done") count += 1; else break;
    }
    return count;
  }, [pastSessionsDesc]);

  const averageIntervalDays = useMemo(() => {
    if (doneHistory.length < 2) return null;
    const ordered = doneHistory.slice().sort((a, b) => new Date(a.date_time || 0).getTime() - new Date(b.date_time || 0).getTime());
    let total = 0;
    for (let i = 1; i < ordered.length; i++) {
      total += new Date(ordered[i].date_time || 0).getTime() - new Date(ordered[i - 1].date_time || 0).getTime();
    }
    return Math.round(total / (ordered.length - 1) / (1000 * 60 * 60 * 24));
  }, [doneHistory]);

  const nextAppointment = useMemo(() => apptsSortedAsc.find((a) => !!a.date_time && new Date(a.date_time).getTime() > Date.now() && a.status !== "cancelled") || null, [apptsSortedAsc]);
  const timelineItems = apptsSortedDesc.slice(0, 6);
  const contentReady = apptsSortedAsc.length > 0;

  const objectives = useMemo(() => {
    // This will come from patient notes; return defaults
    return [
      "Registrar notas estruturadas após cada sessão",
      "Identificar fatores de risco e proteção a serem acompanhados",
      "Garantir adesão aos combinados terapêuticos da semana",
      "Encerrar cada encontro com plano de ação claro",
    ];
  }, []);

  const milestone = useMemo(() => {
    const total = doneHistory.length;
    if (total >= 12) return { title: "Rotina consolidada", description: "Mais de 12 sessões concluídas indicam forte aderência ao plano terapêutico." };
    if (total >= 6) return { title: "Evolução consistente", description: "Seis sessões registradas permitem análises de progresso comparativas." };
    if (total >= 3) return { title: "Jornada em andamento", description: "Três sessões concluídas demonstram engajamento inicial satisfatório." };
    if (total >= 1) return { title: "Primeiro passo", description: "Ao menos uma sessão concluída já oferece dados para acompanhamento." };
    return { title: "Aguardando registros", description: "Adicione sessões na agenda para acompanhar indicadores automaticamente." };
  }, [doneHistory.length]);

  const focusAreas = useMemo(() => [
    { title: "Consistência", description: streak > 0 ? `Últimas ${streak} sessão(ões) concluídas sem faltas.` : "Sem sequência ativa registrada.", icon: CheckCircle2, highlight: `${doneHistory.length} sessões concluídas no total` },
    { title: "Ritmo", description: averageIntervalDays && averageIntervalDays > 0 ? `Intervalo médio de ${averageIntervalDays} dia(s) entre sessões.` : "Complete mais sessões para calcular o intervalo médio.", icon: ActivityIcon, highlight: `${attendanceRate}% de presença` },
    { title: "Próximo passo", description: nextAppointment ? `Próxima sessão em ${formatDayMonth(nextAppointment.date_time)}${nextAppointment.service ? ` · ${nextAppointment.service}` : ""}.` : "Nenhuma sessão futura agendada.", icon: Target, highlight: nextAppointment ? formatDateTimeLong(nextAppointment.date_time) : "Agende na aba Sessões" },
  ], [attendanceRate, averageIntervalDays, doneHistory.length, nextAppointment, streak]);

  const quickStats = useMemo(() => [
    { label: "Taxa de presença", value: `${attendanceRate}%`, helper: `${doneHistory.length} de ${apptsSortedAsc.length || 0} sessões concluídas`, icon: UserCheck },
    { label: "Sequência atual", value: streak > 0 ? `${streak} sessão(ões)` : "Sem sequência ativa", helper: streak > 0 ? "Considera apenas sessões concluídas consecutivas" : "Registre presença para iniciar uma sequência", icon: CheckCircle2 },
    { label: "Intervalo médio", value: averageIntervalDays && averageIntervalDays > 0 ? `${averageIntervalDays} dia(s)` : "—", helper: "Entre sessões concluídas", icon: Clock },
    { label: "Próxima sessão", value: nextAppointment ? formatDayMonth(nextAppointment.date_time) : "Sem agendamento", helper: nextAppointment ? formatDateTimeLong(nextAppointment.date_time) : "Agende na aba Sessões", icon: CalendarDays },
    { label: "Cancelamentos", value: cancellations, helper: "Sessões canceladas registradas", icon: XCircle },
  ], [attendanceRate, averageIntervalDays, apptsSortedAsc.length, cancellations, doneHistory.length, nextAppointment, streak]);

  return {
    // Activity stats
    myActivities, pendingActivities, completedActivities, lastActivity, nextDueActivity,
    // Message stats
    patientMessages, unreadPatientMessages, urgentPatientMessages,
    // Journal stats
    patientJournals, lastJournalEntry, firstJournalEntry, journalMoodDistribution, journalEntriesThisMonth, predominantMood, journalTags,
    // Appointment stats
    totalSessoes, totalRecebido, pendentes, cancellations, attendanceRate, streak, averageIntervalDays, nextAppointment,
    progressPct, monthDone, monthScheduled, monthPending,
    doneHistory, timelineItems, contentReady, objectives, milestone, focusAreas, quickStats,
  };
};
