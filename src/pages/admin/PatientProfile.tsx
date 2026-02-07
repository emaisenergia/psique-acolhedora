import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { type ActivityField, uid } from "@/lib/storage";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Mail, Phone, MapPin, Briefcase, CreditCard, CheckCircle2, FileText, DollarSign, Folder, ClipboardList, Save, Search, TrendingUp, Activity as ActivityIcon, Target, Award, Clock, UserCheck, XCircle, BookOpen, Plus, MessageSquare, AlertTriangle, Send, Trash2, Shield, UserPlus, Key, Loader2 } from "lucide-react";
import { notifyNewActivity, notifyThreadCommentToPatient } from "@/lib/notifications";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMemo, useState, useEffect, useCallback, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SessionsModule } from "@/components/sessions/SessionsModule";
import { TreatmentPlanTab } from "@/components/treatment/TreatmentPlanTab";
import { ActivityFormDialog } from "@/components/activities/ActivityFormDialog";
import { ActivityResponseViewer } from "@/components/activities/ActivityResponseViewer";
import { ResourcesTab } from "@/components/resources/ResourcesTab";
import { usePatients, type PatientRow } from "@/hooks/usePatients";
import { useAppointments } from "@/hooks/useAppointments";
import type { Tables } from "@/integrations/supabase/types";

type Patient = PatientRow & {
  birthDate?: string;
  gender?: string;
  address?: string;
  profession?: string;
  cpf?: string;
  cep?: string;
  color?: string;
};

type Activity = {
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

type SecureMessage = {
  id: string;
  patientId: string;
  author: "patient" | "psychologist";
  content: string;
  createdAt: string;
  urgent: boolean;
  read: boolean;
};

type JournalEntry = {
  id: string;
  patientId: string;
  mood: "muito_bem" | "bem" | "neutro" | "desafiador" | "dificil";
  note: string;
  tags?: string[];
  createdAt: string;
};

const formatDayMonth = (iso?: string) => {
  if (!iso) return "—";
  const date = new Date(iso);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date);
};

const formatDateTimeLong = (iso?: string) => {
  if (!iso) return "—";
  const date = new Date(iso);
  const dayMonth = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
  const time = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${dayMonth}, ${time}`;
};

const formatDueDate = (iso?: string) => {
  if (!iso) return "Sem prazo definido";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long" }).format(new Date(iso));
};

const clampPercent = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

const MOOD_OPTIONS: { value: JournalEntry["mood"]; label: string; description: string }[] = [
  { value: "muito_bem", label: "Muito bem", description: "Estado positivo, engajado e confiante." },
  { value: "bem", label: "Bem", description: "Estável, com leve bem-estar percebido." },
  { value: "neutro", label: "Neutro", description: "Humor equilibrado, sem grandes oscilações." },
  { value: "desafiador", label: "Desafiador", description: "Enfrentando situações complexas ou estressantes." },
  { value: "dificil", label: "Difícil", description: "Humor fragilizado, demanda atenção e suporte." },
];

const MOOD_LABELS: Record<JournalEntry["mood"], string> = MOOD_OPTIONS.reduce(
  (acc, item) => ({ ...acc, [item.value]: item.label }),
  {} as Record<JournalEntry["mood"], string>
);

const MOOD_BADGE_CLASSES: Record<JournalEntry["mood"], string> = {
  muito_bem: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  bem: "bg-teal-100 text-teal-700 border border-teal-200",
  neutro: "bg-slate-100 text-slate-700 border border-slate-200",
  desafiador: "bg-amber-100 text-amber-700 border border-amber-200",
  dificil: "bg-rose-100 text-rose-700 border border-rose-200",
};

const PatientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // URL parameters for direct navigation
  const initialTab = searchParams.get('tab') || 'perfil';
  const appointmentToOpen = searchParams.get('appointment');
  
  // Supabase hooks
  const { patients: supabasePatients, isLoading: patientsLoading, fetchPatients } = usePatients();
  const { appointments: supabaseAppointments, isLoading: appointmentsLoading } = useAppointments();
  
  // Find patient by ID from Supabase
  const patient = useMemo(() => {
    return supabasePatients.find((p) => p.id === id) as Patient | undefined;
  }, [supabasePatients, id]);
  
  // Filter appointments for this patient
  const appts = useMemo(() => {
    if (!id) return [];
    return supabaseAppointments.filter((a) => a.patient_id === id);
  }, [supabaseAppointments, id]);
  
  const [tab, setTab] = useState(initialTab);
  const [editOpen, setEditOpen] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [medsOpen, setMedsOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  
  // Activities, messages, journals from Supabase
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [messages, setMessages] = useState<SecureMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [journalsLoading, setJournalsLoading] = useState(true);
  
  const [journalForm, setJournalForm] = useState<{ mood: JournalEntry["mood"]; note: string; tags: string }>({
    mood: "bem",
    note: "",
    tags: "",
  });
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [responseViewerOpen, setResponseViewerOpen] = useState(false);
  const [selectedActivityForView, setSelectedActivityForView] = useState<Activity | null>(null);
  const [replyText, setReplyText] = useState("");
  
  // Patient user account state
  const [userAccountLoading, setUserAccountLoading] = useState(false);
  const [userAccountCreating, setUserAccountCreating] = useState(false);
  const [patientHasAccount, setPatientHasAccount] = useState<boolean | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const patientId = patient?.id || null;
  
  // Fetch activities from Supabase
  const fetchActivities = useCallback(async () => {
    if (!patientId) {
      setActivities([]);
      setActivitiesLoading(false);
      return;
    }
    
    setActivitiesLoading(true);
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      const mapped: Activity[] = data.map((item) => ({
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
      }));
      setActivities(mapped);
    }
    setActivitiesLoading(false);
  }, [patientId]);
  
  // Fetch messages from Supabase
  const fetchMessages = useCallback(async () => {
    if (!patientId) {
      setMessages([]);
      setMessagesLoading(false);
      return;
    }
    
    setMessagesLoading(true);
    const { data, error } = await supabase
      .from("secure_messages")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: true });
    
    if (!error && data) {
      const mapped: SecureMessage[] = data.map((item) => ({
        id: item.id,
        patientId: item.patient_id,
        author: item.author as "patient" | "psychologist",
        content: item.content,
        createdAt: item.created_at,
        urgent: item.urgent,
        read: item.read,
      }));
      setMessages(mapped);
    }
    setMessagesLoading(false);
  }, [patientId]);
  
  // Fetch journals from Supabase
  const fetchJournals = useCallback(async () => {
    if (!patientId) {
      setJournals([]);
      setJournalsLoading(false);
      return;
    }
    
    setJournalsLoading(true);
    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      const mapped: JournalEntry[] = data.map((item) => ({
        id: item.id,
        patientId: item.patient_id,
        mood: item.mood as JournalEntry["mood"],
        note: item.note,
        createdAt: item.created_at,
      }));
      setJournals(mapped);
    }
    setJournalsLoading(false);
  }, [patientId]);
  
  // Load data when patientId changes
  useEffect(() => {
    fetchActivities();
    fetchMessages();
    fetchJournals();
  }, [fetchActivities, fetchMessages, fetchJournals]);

  const myActivities = useMemo(() => {
    if (!patientId) return [] as Activity[];
    return activities
      .filter((a) => a.patientId === patientId)
      .slice()
      .sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === "pending" ? -1 : 1;
        }
        const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
        const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
        if (aDue !== bDue) return aDue - bDue;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [activities, patientId]);

  const pendingActivities = useMemo(
    () => myActivities.filter((a) => a.status === "pending"),
    [myActivities]
  );

  const completedActivities = useMemo(
    () => myActivities.filter((a) => a.status === "completed"),
    [myActivities]
  );

  const lastActivity = useMemo(() => {
    if (myActivities.length === 0) return null;
    return myActivities
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }, [myActivities]);

  const nextDueActivity = useMemo(() => {
    if (pendingActivities.length === 0) return null;
    return pendingActivities
      .slice()
      .sort((a, b) => {
        const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
        const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
        return aDue - bDue;
      })[0];
  }, [pendingActivities]);

  const patientMessages = useMemo(() => {
    if (!patientId) return [] as SecureMessage[];
    return messages
      .filter((message) => message.patientId === patientId)
      .slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messages, patientId]);

  const unreadPatientMessages = useMemo(
    () => patientMessages.filter((message) => message.author === "patient" && !message.read),
    [patientMessages]
  );

  const urgentPatientMessages = useMemo(
    () => patientMessages.filter((message) => message.author === "patient" && message.urgent),
    [patientMessages]
  );

  const patientJournals = useMemo(() => {
    if (!patientId) return [] as JournalEntry[];
    return journals
      .filter((entry) => entry.patientId === patientId)
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [journals, patientId]);

  const lastJournalEntry = useMemo(() => patientJournals[0] || null, [patientJournals]);
  const firstJournalEntry = useMemo(
    () => (patientJournals.length > 0 ? patientJournals[patientJournals.length - 1] : null),
    [patientJournals]
  );

  const journalMoodDistribution = useMemo(() => {
    const base: Record<JournalEntry["mood"], number> = {
      muito_bem: 0,
      bem: 0,
      neutro: 0,
      desafiador: 0,
      dificil: 0,
    };
    patientJournals.forEach((entry) => {
      base[entry.mood] = (base[entry.mood] || 0) + 1;
    });
    return base;
  }, [patientJournals]);

  const journalEntriesThisMonth = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    return patientJournals.filter((entry) => {
      const date = new Date(entry.createdAt);
      return date.getMonth() === month && date.getFullYear() === year;
    });
  }, [patientJournals]);

  const predominantMood = useMemo(() => {
    let topMood: JournalEntry["mood"] | null = null;
    let topCount = 0;
    (Object.entries(journalMoodDistribution) as [JournalEntry["mood"], number][]).forEach(([mood, count]) => {
      if (count > topCount) {
        topMood = mood;
        topCount = count;
      }
    });
    return topMood;
  }, [journalMoodDistribution]);

  const journalTags = useMemo(() => {
    const tagSet = new Set<string>();
    patientJournals.forEach((entry) => {
      entry.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }, [patientJournals]);

  const age = useMemo(() => {
    if (!patient?.birthDate) return null;
    const dob = new Date(patient.birthDate);
    const diff = Date.now() - dob.getTime();
    const d = new Date(diff);
    return Math.abs(d.getUTCFullYear() - 1970);
  }, [patient?.birthDate]);

  const initials = (patient?.name || "?")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 4)
    .toUpperCase();

  const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const totalSessoes = appts.filter((a) => a.status !== "cancelled").length;
  const totalRecebido = appts.filter((a) => a.status === "done").reduce((s, a) => s + (a.payment_value || 0), 0);
  const pendentes = appts.filter((a) => a.status === "scheduled" || a.status === "confirmed").length;

  const apptsSortedAsc = useMemo(
    () =>
      appts
        .slice()
        .sort(
          (a, b) =>
            new Date(a.date_time || 0).getTime() -
            new Date(b.date_time || 0).getTime()
        ),
    [appts]
  );

  const apptsSortedDesc = useMemo(
    () => apptsSortedAsc.slice().reverse(),
    [apptsSortedAsc]
  );

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthAppointments = useMemo(
    () => apptsSortedAsc.filter((a) => (a.date_time || "").startsWith(monthKey)),
    [apptsSortedAsc, monthKey]
  );
  const monthDone = monthAppointments.filter((a) => a.status === "done").length;
  const monthScheduled = monthAppointments.length;
  const progressPct = monthScheduled ? clampPercent((monthDone / monthScheduled) * 100) : 0;
  const monthPending = Math.max(monthScheduled - monthDone, 0);

  const pastSessionsDesc = useMemo(
    () =>
      apptsSortedDesc.filter(
        (a) => !!a.date_time && new Date(a.date_time).getTime() <= Date.now()
      ),
    [apptsSortedDesc]
  );

  const doneHistory = useMemo(
    () => pastSessionsDesc.filter((a) => a.status === "done"),
    [pastSessionsDesc]
  );

  const attendanceRate = apptsSortedAsc.length
    ? clampPercent((doneHistory.length / apptsSortedAsc.length) * 100)
    : 0;

  const streak = useMemo(() => {
    let count = 0;
    for (const appt of pastSessionsDesc) {
      if (appt.status === "done") {
        count += 1;
      } else {
        break;
      }
    }
    return count;
  }, [pastSessionsDesc]);

  const averageIntervalDays = useMemo(() => {
    if (doneHistory.length < 2) return null;
    const ordered = doneHistory
      .slice()
      .sort(
        (a, b) =>
          new Date(a.date_time || 0).getTime() -
          new Date(b.date_time || 0).getTime()
      );
    let total = 0;
    for (let i = 1; i < ordered.length; i += 1) {
      const prev = new Date(ordered[i - 1].date_time || 0).getTime();
      const curr = new Date(ordered[i].date_time || 0).getTime();
      total += curr - prev;
    }
    const avgMs = total / (ordered.length - 1);
    return Math.round(avgMs / (1000 * 60 * 60 * 24));
  }, [doneHistory]);

  const nextAppointment = useMemo(
    () =>
      apptsSortedAsc.find(
        (a) =>
          !!a.date_time &&
          new Date(a.date_time).getTime() > Date.now() &&
          a.status !== "cancelled"
      ) || null,
    [apptsSortedAsc]
  );

  const cancellations = appts.filter((a) => a.status === "cancelled").length;
  const timelineItems = apptsSortedDesc.slice(0, 6);

  const objectives = useMemo(() => {
    if (!patient?.notes) {
      return [
        "Registrar notas estruturadas após cada sessão",
        "Identificar fatores de risco e proteção a serem acompanhados",
        "Garantir adesão aos combinados terapêuticos da semana",
        "Encerrar cada encontro com plano de ação claro",
      ];
    }
    return patient.notes
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .slice(0, 4);
  }, [patient?.notes]);

  const milestone = useMemo(() => {
    const total = doneHistory.length;
    if (total >= 12) {
      return {
        title: "Rotina consolidada",
        description: "Mais de 12 sessões concluídas indicam forte aderência ao plano terapêutico.",
      };
    }
    if (total >= 6) {
      return {
        title: "Evolução consistente",
        description: "Seis sessões registradas permitem análises de progresso comparativas.",
      };
    }
    if (total >= 3) {
      return {
        title: "Jornada em andamento",
        description: "Três sessões concluídas demonstram engajamento inicial satisfatório.",
      };
    }
    if (total >= 1) {
      return {
        title: "Primeiro passo",
        description: "Ao menos uma sessão concluída já oferece dados para acompanhamento.",
      };
    }
    return {
      title: "Aguardando registros",
      description: "Adicione sessões na agenda para acompanhar indicadores automaticamente.",
    };
  }, [doneHistory.length]);

  const contentReady = apptsSortedAsc.length > 0;

  const focusAreas = useMemo(
    () => [
      {
        title: "Consistência",
        description:
          streak > 0
            ? `Últimas ${streak} sessão(ões) concluídas sem faltas.`
            : "Sem sequência ativa registrada.",
        icon: CheckCircle2,
        highlight: `${doneHistory.length} sessões concluídas no total`,
      },
      {
        title: "Ritmo",
        description:
          averageIntervalDays && averageIntervalDays > 0
            ? `Intervalo médio de ${averageIntervalDays} dia(s) entre sessões.`
            : "Complete mais sessões para calcular o intervalo médio.",
        icon: ActivityIcon,
        highlight: `${attendanceRate}% de presença`,
      },
      {
        title: "Próximo passo",
        description:
          nextAppointment
            ? `Próxima sessão em ${formatDayMonth(nextAppointment.date_time)}${
                nextAppointment.service ? ` · ${nextAppointment.service}` : ""
              }.`
            : "Nenhuma sessão futura agendada.",
        icon: Target,
        highlight: nextAppointment ? formatDateTimeLong(nextAppointment.date_time) : "Agende na aba Sessões",
      },
    ],
    [attendanceRate, averageIntervalDays, doneHistory.length, nextAppointment, streak]
  );

  const quickStats = useMemo(
    () => [
      {
        label: "Taxa de presença",
        value: `${attendanceRate}%`,
        helper: `${doneHistory.length} de ${apptsSortedAsc.length || 0} sessões concluídas`,
        icon: UserCheck,
      },
      {
        label: "Sequência atual",
        value: streak > 0 ? `${streak} sessão(ões)` : "Sem sequência ativa",
        helper: streak > 0 ? "Considera apenas sessões concluídas consecutivas" : "Registre presença para iniciar uma sequência",
        icon: CheckCircle2,
      },
      {
        label: "Intervalo médio",
        value: averageIntervalDays && averageIntervalDays > 0 ? `${averageIntervalDays} dia(s)` : "—",
        helper: "Entre sessões concluídas",
        icon: Clock,
      },
      {
        label: "Próxima sessão",
        value: nextAppointment ? formatDayMonth(nextAppointment.date_time) : "Sem agendamento",
        helper: nextAppointment ? formatDateTimeLong(nextAppointment.date_time) : "Agende na aba Sessões",
        icon: CalendarDays,
      },
      {
        label: "Cancelamentos",
        value: cancellations,
        helper: "Sessões canceladas registradas",
        icon: XCircle,
      },
    ],
    [attendanceRate, averageIntervalDays, apptsSortedAsc.length, cancellations, doneHistory.length, nextAppointment, streak]
  );

  // Create activity in Supabase
  const handleCreateActivity = async (data: {
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
      const mapped: Activity = {
        id: newActivity.id,
        patientId: newActivity.patient_id,
        title: newActivity.title,
        description: newActivity.description || undefined,
        dueDate: newActivity.due_date || undefined,
        status: newActivity.status as "pending" | "completed",
        assignedBy: newActivity.assigned_by || undefined,
        createdAt: newActivity.created_at,
        fields: (newActivity.custom_fields as ActivityField[] | null) || undefined,
        attachmentUrl: newActivity.attachment_url || undefined,
        attachmentName: newActivity.attachment_name || undefined,
      };
      setActivities((prev) => [mapped, ...prev]);
      setActivityDialogOpen(false);
      
      try {
        await notifyNewActivity(patientId, data.title);
        toast.success("Atividade criada e notificação enviada ao paciente");
      } catch (err) {
        console.error("Error sending activity notification:", err);
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
        prev.map((a) =>
          a.id === activityId
            ? { ...a, status: newStatus, completedAt: completedAt || undefined }
            : a
        )
      );
    }
  };

  const deleteActivity = async (activityId: string) => {
    const { error } = await supabase
      .from("activities")
      .delete()
      .eq("id", activityId);
    
    if (!error) {
      setActivities((prev) => prev.filter((a) => a.id !== activityId));
    }
  };

  const handleAddJournalEntry = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!patientId) return;
    const content = journalForm.note.trim();
    if (!content) return;
    
    const { data: newEntry, error } = await supabase
      .from("journal_entries")
      .insert({
        patient_id: patientId,
        mood: journalForm.mood,
        note: content,
      })
      .select()
      .single();
    
    if (!error && newEntry) {
      const mapped: JournalEntry = {
        id: newEntry.id,
        patientId: newEntry.patient_id,
        mood: newEntry.mood as JournalEntry["mood"],
        note: newEntry.note,
        createdAt: newEntry.created_at,
      };
      setJournals((prev) => [mapped, ...prev]);
      setJournalForm((prev) => ({ ...prev, note: "", tags: "" }));
    }
  };

  const handleDeleteJournalEntry = async (entryId: string) => {
    if (typeof window !== "undefined" && !window.confirm("Remover esta evolução do prontuário?")) return;
    
    const { error } = await supabase
      .from("journal_entries")
      .delete()
      .eq("id", entryId);
    
    if (!error) {
      setJournals((prev) => prev.filter((e) => e.id !== entryId));
    }
  };

  const markMessageRead = async (messageId: string) => {
    const { error } = await supabase
      .from("secure_messages")
      .update({ read: true })
      .eq("id", messageId);
    
    if (!error) {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, read: true } : m))
      );
    }
  };

  const handleSendReply = async () => {
    if (!patientId) return;
    const content = replyText.trim();
    if (!content) return;
    
    const { data: newMessage, error } = await supabase
      .from("secure_messages")
      .insert({
        patient_id: patientId,
        author: "psychologist",
        content,
        urgent: false,
        read: true,
      })
      .select()
      .single();
    
    if (!error && newMessage) {
      const mapped: SecureMessage = {
        id: newMessage.id,
        patientId: newMessage.patient_id,
        author: newMessage.author as "patient" | "psychologist",
        content: newMessage.content,
        createdAt: newMessage.created_at,
        urgent: newMessage.urgent,
        read: newMessage.read,
      };
      setMessages((prev) => [...prev, mapped]);
      setReplyText("");
    }
  };

  const updatePatient = async (patch: Partial<Patient>) => {
    if (!patient) return;
    
    // Map local field names to Supabase column names
    const supabasePatch: Record<string, unknown> = {};
    if (patch.name !== undefined) supabasePatch.name = patch.name;
    if (patch.email !== undefined) supabasePatch.email = patch.email;
    if (patch.phone !== undefined) supabasePatch.phone = patch.phone;
    if (patch.notes !== undefined) supabasePatch.notes = patch.notes;
    if (patch.status !== undefined) supabasePatch.status = patch.status;
    if (patch.birth_date !== undefined) supabasePatch.birth_date = patch.birth_date;
    if (patch.birthDate !== undefined) supabasePatch.birth_date = patch.birthDate;
    
    const { error } = await supabase
      .from("patients")
      .update(supabasePatch)
      .eq("id", patient.id);
    
    if (!error) {
      fetchPatients();
      toast.success("Paciente atualizado");
    } else {
      toast.error("Erro ao atualizar paciente");
    }
  };

  const removePatient = async () => {
    if (!patient) return;
    
    const { error } = await supabase
      .from("patients")
      .delete()
      .eq("id", patient.id);
    
    if (!error) {
      toast.success("Paciente removido");
      navigate("/admin/pacientes");
    } else {
      toast.error("Erro ao remover paciente");
    }
  };

  // Check if patient has a user account
  const checkPatientAccount = async () => {
    if (!patient?.email) return;
    setUserAccountLoading(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('user_id')
        .eq('email', patient.email)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking patient account:', error);
      }
      setPatientHasAccount(!!data?.user_id);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setUserAccountLoading(false);
    }
  };

  // Create user account for patient
  const createPatientAccount = async () => {
    if (!patient?.email || !newPassword) {
      toast.error("Email e senha são obrigatórios");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setUserAccountCreating(true);
    try {
      // Create user in auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: patient.email,
        password: newPassword,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            name: patient.name,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Falha ao criar usuário");

      // Update patient with user_id
      const { error: updateError } = await supabase
        .from('patients')
        .update({ user_id: authData.user.id })
        .eq('email', patient.email);

      if (updateError) throw updateError;

      // Add patient role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: authData.user.id, role: 'patient' });

      if (roleError) {
        console.error('Error adding role:', roleError);
      }

      toast.success("Conta do paciente criada com sucesso!");
      setPatientHasAccount(true);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      console.error('Error creating patient account:', error);
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(`Erro ao criar conta: ${message}`);
    } finally {
      setUserAccountCreating(false);
    }
  };

  // Check account status when tab changes to access
  useMemo(() => {
    if (tab === 'acesso' && patientHasAccount === null) {
      checkPatientAccount();
    }
  }, [tab]);

  if (!patient) {
    return (
      <AdminLayout>
        <div className="text-muted-foreground">Paciente não encontrado.</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Hero */}
      <div className="rounded-3xl bg-gradient-primary text-primary-foreground p-8 mb-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-background/30 flex items-center justify-center font-semibold text-xl">
              {initials}
            </div>
            <div>
              <Link to="/admin/pacientes" className="text-sm underline-offset-4 hover:underline opacity-80">Voltar para Pacientes</Link>
              <h1 className="text-4xl font-display font-semibold leading-tight mt-1">{patient.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                <span className="flex items-center gap-1"><CalendarDays className="w-4 h-4" /> {age ? `${age} anos` : "Idade não informada"}</span>
                {patient.email && <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {patient.email}</span>}
                <span className={`px-2 py-1 rounded-full text-xs ${patient.status === 'active' ? 'bg-background/30' : 'bg-background/20 opacity-70'}`}>
                  ✓ Paciente {patient.status === 'inactive' ? 'Inativo' : 'Ativo'}
                </span>
                {age && <span className="px-2 py-1 rounded-full text-xs bg-background/20">{age >= 18 ? 'adulto' : 'menor'}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="border-2 border-white/80 text-white hover:border-white hover:bg-white/10 px-6 py-2 text-sm"
              onClick={() => setEditOpen(true)}
            >
              Editar
            </Button>
            <Button
              variant="ghost"
              className="border-2 border-white/80 text-white hover:border-white hover:bg-white/10 px-6 py-2 text-sm"
              onClick={() => updatePatient({ status: patient.status === 'active' ? 'inactive' : 'active' })}
            >
              {patient.status === 'active' ? 'Desativar' : 'Ativar'}
            </Button>
            <Button variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={removePatient}>Deletar</Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<CalendarDays className="w-5 h-5"/>} title="Total de Sessões" value={totalSessoes} subtitle="realizadas"/>
        <MetricCard icon={<DollarSign className="w-5 h-5"/>} title="Total Recebido" value={brl.format(totalRecebido)} subtitle={`${pendentes} pendentes`}/>
        <MetricCard icon={<FileText className="w-5 h-5"/>} title="Remarcações" value={0} subtitle="Nenhuma remarcação"/>
        <MetricCard icon={<Folder className="w-5 h-5"/>} title="Arquivos" value={0} subtitle="Nenhum arquivo"/>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList className="w-full bg-muted/60 rounded-2xl p-1 flex-wrap">
          <TabsTrigger value="perfil" className="flex-1 rounded-xl">Perfil Completo</TabsTrigger>
          <TabsTrigger value="prontuario" className="flex-1 rounded-xl"><FileText className="w-4 h-4 mr-2"/>Prontuário</TabsTrigger>
          <TabsTrigger value="plano" className="flex-1 rounded-xl"><Target className="w-4 h-4 mr-2"/>Plano de Tratamento</TabsTrigger>
          <TabsTrigger value="sessoes" className="flex-1 rounded-xl"><CalendarDays className="w-4 h-4 mr-2"/>Sessões</TabsTrigger>
          <TabsTrigger value="atividades" className="flex-1 rounded-xl"><BookOpen className="w-4 h-4 mr-2"/>Atividades</TabsTrigger>
          <TabsTrigger value="recursos" className="flex-1 rounded-xl"><FileText className="w-4 h-4 mr-2"/>Recursos</TabsTrigger>
          <TabsTrigger value="mensagens" className="flex-1 rounded-xl"><MessageSquare className="w-4 h-4 mr-2"/>Mensagens</TabsTrigger>
          <TabsTrigger value="progresso" className="flex-1 rounded-xl"><TrendingUp className="w-4 h-4 mr-2"/>Progresso</TabsTrigger>
          <TabsTrigger value="financeiro" className="flex-1 rounded-xl"><DollarSign className="w-4 h-4 mr-2"/>Financeiro</TabsTrigger>
          <TabsTrigger value="arquivos" className="flex-1 rounded-xl"><Folder className="w-4 h-4 mr-2"/>Arquivos</TabsTrigger>
          <TabsTrigger value="anamnese" className="flex-1 rounded-xl"><ClipboardList className="w-4 h-4 mr-2"/>Anamnese</TabsTrigger>
          <TabsTrigger value="acesso" className="flex-1 rounded-xl"><Key className="w-4 h-4 mr-2"/>Acesso</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="mt-6">
          <Card className="card-glass">
            <CardContent className="p-0">
              <div className="p-6 bg-gradient-secondary/30 rounded-t-2xl">
                <div className="text-lg font-semibold">Informações Pessoais Completas</div>
                <div className="text-sm text-muted-foreground">Dados completos e atualizados do paciente</div>
              </div>
              <div className="p-6 grid md:grid-cols-2 gap-6">
                <div>
                  <div className="text-primary font-medium mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/>Dados Básicos</div>
                  <InfoRow icon={<Mail className="w-4 h-4"/>} label="Email" value={patient.email || 'Não informado'} />
                  <InfoRow icon={<Phone className="w-4 h-4"/>} label="Telefone" value={patient.phone || 'Não informado'} />
                  <InfoRow icon={<CalendarDays className="w-4 h-4"/>} label="Data de Nascimento" value={patient.birthDate ? new Date(patient.birthDate).toLocaleDateString() + (age ? ` (${age} anos)` : '') : 'Não informado'} />
                  <InfoRow icon={<CheckCircle2 className="w-4 h-4"/>} label="Gênero" value={patient.gender || 'Não informado'} />
                </div>
                <div>
                  <div className="text-primary font-medium mb-3 flex items-center gap-2"><MapPin className="w-4 h-4"/>Dados Complementares</div>
                  <InfoRow icon={<MapPin className="w-4 h-4"/>} label="Endereço" value={patient.address || 'Não informado'} />
                  <InfoRow icon={<Briefcase className="w-4 h-4"/>} label="Profissão" value={patient.profession || 'Não informada'} />
                  <InfoRow icon={<CreditCard className="w-4 h-4"/>} label="CPF" value={patient.cpf || 'Não informado'} />
                </div>
              </div>

              <div className="px-6 pb-6">
                <div className="text-primary font-medium mb-3">Informações Médicas e Observações</div>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="p-4 rounded-xl bg-muted">
                    <div className="text-sm text-muted-foreground mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/>Contatos de Emergência</span>
                      <Button size="sm" variant="outline" onClick={()=>setEmergencyOpen(true)}>Gerenciar</Button>
                    </div>
                    <div className="text-sm text-muted-foreground">Nenhum contato de emergência registrado</div>
                  </div>
                  <div className="p-4 rounded-xl bg-muted">
                    <div className="text-sm text-muted-foreground mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/>Medicações</span>
                      <Button size="sm" variant="outline" onClick={()=>setMedsOpen(true)}>Gerenciar</Button>
                    </div>
                    <div className="text-sm text-muted-foreground">Nenhuma medicação registrada</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-muted">
                  <div className="text-sm text-muted-foreground mb-2 flex items-center justify-between">
                    <span>Observações Gerais</span>
                    <Button size="sm" variant="outline" onClick={()=>setNotesOpen(true)}>Editar</Button>
                  </div>
                  <div className="text-sm text-muted-foreground">{patient.notes || 'Nenhuma observação registrada'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prontuario" className="mt-6">
          <div className="grid xl:grid-cols-[2fr,1fr] gap-6 items-start">
            <Card className="card-glass">
              <CardContent className="p-6 space-y-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-lg font-semibold text-foreground">Evoluções clínicas</div>
                    <div className="text-sm text-muted-foreground">
                      Registre notas de sessão, evolução emocional e principais insights terapêuticos.
                    </div>
                  </div>
                  <Badge
                    className={`text-xs font-medium ${
                      lastJournalEntry ? MOOD_BADGE_CLASSES[lastJournalEntry.mood] : "bg-muted text-foreground border border-border/60"
                    }`}
                  >
                    Último humor: {lastJournalEntry ? MOOD_LABELS[lastJournalEntry.mood] : "Não registrado"}
                  </Badge>
                </div>

                <form
                  onSubmit={handleAddJournalEntry}
                  className="space-y-4 rounded-2xl border border-border/60 bg-background/60 p-4"
                >
                  <div className="grid gap-4 md:grid-cols-[220px,1fr]">
                    <div className="flex flex-col gap-2">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">Estado geral</Label>
                      <Select
                        value={journalForm.mood}
                        onValueChange={(value) =>
                          setJournalForm((prev) => ({ ...prev, mood: value as JournalEntry["mood"] }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {MOOD_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex flex-col">
                                <span>{option.label}</span>
                                <span className="text-xs text-muted-foreground">{option.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">Tags</Label>
                      <Input
                        value={journalForm.tags}
                        onChange={(e) => setJournalForm((prev) => ({ ...prev, tags: e.target.value }))}
                        placeholder="separe por vírgula: ansiedade, autoestima"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Registro clínico</Label>
                    <Textarea
                      value={journalForm.note}
                      onChange={(e) => setJournalForm((prev) => ({ ...prev, note: e.target.value }))}
                      placeholder="Descreva principais acontecimentos, hipóteses clínicas e encaminhamentos."
                      rows={5}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" className="btn-futuristic" disabled={!patientId || !journalForm.note.trim()}>
                      Registrar evolução
                    </Button>
                  </div>
                </form>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Histórico de evoluções ({patientJournals.length})
                    </div>
                    {lastJournalEntry && (
                      <span className="text-xs text-muted-foreground">
                        Última atualização {formatDateTimeLong(lastJournalEntry.createdAt)}
                      </span>
                    )}
                  </div>
                  {patientJournals.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/70 bg-card/70 p-6 text-sm text-muted-foreground">
                      Ainda não existem registros clínicos para este paciente. Utilize o formulário acima para iniciar o prontuário.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {patientJournals.map((entry) => (
                        <div key={entry.id} className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <Badge className={`text-xs font-medium ${MOOD_BADGE_CLASSES[entry.mood]}`}>
                                  {MOOD_LABELS[entry.mood]}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDateTimeLong(entry.createdAt)}
                                </span>
                              </div>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={() => handleDeleteJournalEntry(entry.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="text-sm text-muted-foreground whitespace-pre-line">{entry.note}</div>
                          {entry.tags && entry.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {entry.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs font-normal">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="bg-card/90 border border-border/60">
                <CardContent className="p-6 space-y-4">
                  <div className="text-sm font-medium text-muted-foreground">Resumo do prontuário</div>
                  <ActivitySummaryRow
                    label="Total de evoluções"
                    value={patientJournals.length}
                    helper={
                      firstJournalEntry
                        ? `Primeiro registro em ${formatDateTimeLong(firstJournalEntry.createdAt)}`
                        : undefined
                    }
                  />
                  <ActivitySummaryRow
                    label="Registros neste mês"
                    value={journalEntriesThisMonth.length}
                    helper="Comparativo do ciclo atual"
                  />
                  <ActivitySummaryRow
                    label="Humor predominante"
                    value={
                      predominantMood ? (
                        <Badge className={`text-sm ${MOOD_BADGE_CLASSES[predominantMood]}`}>
                          {MOOD_LABELS[predominantMood]}
                        </Badge>
                      ) : (
                        "—"
                      )
                    }
                    helper={
                      lastJournalEntry ? `Último registro indica ${MOOD_LABELS[lastJournalEntry.mood]}` : undefined
                    }
                  />
                  <ActivitySummaryRow
                    label="Última evolução"
                    value={lastJournalEntry ? formatDateTimeLong(lastJournalEntry.createdAt) : "—"}
                    helper={
                      lastJournalEntry
                        ? `${lastJournalEntry.note.slice(0, 96)}${lastJournalEntry.note.length > 96 ? "..." : ""}`
                        : undefined
                    }
                  />
                </CardContent>
              </Card>

              {journalTags.length > 0 && (
                <Card className="bg-card/90 border border-border/60">
                  <CardContent className="p-6 space-y-3">
                    <div className="text-sm font-medium text-muted-foreground">Temas recorrentes</div>
                    <div className="flex flex-wrap gap-2">
                      {journalTags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs font-normal">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-card/90 border border-border/60">
                <CardContent className="p-6 space-y-3 text-sm text-muted-foreground">
                  <div className="font-medium text-foreground">Boas práticas</div>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Registre evidências, hipóteses e plano terapêutico a cada sessão relevante.</li>
                    <li>Use tags para facilitar buscas futuras sobre temas recorrentes.</li>
                    <li>Revise o resumo antes de reuniões de supervisão ou devolutivas.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="plano" className="mt-6">
          <TreatmentPlanTab
            patientId={patient.id}
            patientName={patient.name}
            patientAge={age}
            patientNotes={patient.notes}
            sessionsCompleted={doneHistory.length}
            journalNotes={patientJournals.slice(0, 3).map(j => j.note).join("\n")}
            onAddSession={() => setTab("sessoes")}
          />
        </TabsContent>
        <TabsContent value="sessoes" className="mt-6">
          <SessionsModule patientId={patient.id} patientName={patient.name} initialAppointmentId={appointmentToOpen || undefined} />
        </TabsContent>
        <TabsContent value="atividades" className="mt-6">
          <div className="grid xl:grid-cols-[2fr,1fr] gap-6 items-start">
            <Card className="card-glass">
              <CardContent className="p-6 space-y-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-lg font-semibold text-foreground">Atividades terapêuticas</div>
                    <div className="text-sm text-muted-foreground">Crie exercícios personalizados para o paciente realizar entre sessões e acompanhe a execução.</div>
                  </div>
                  <Button
                    className="rounded-full inline-flex items-center gap-2"
                    onClick={() => setActivityDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4" /> Nova atividade
                  </Button>
                </div>

                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Pendentes ({pendingActivities.length})</div>
                  {pendingActivities.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/70 bg-card/70 p-5 text-sm text-muted-foreground">
                      Nenhuma atividade pendente no momento.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingActivities.map((activity) => (
                        <div key={activity.id} className="rounded-xl border border-border/60 bg-card p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-foreground">{activity.title}</div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                  <CalendarDays className="w-3 h-3" />
                                  {activity.dueDate ? `Prazo: ${formatDueDate(activity.dueDate)}` : "Sem prazo"}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <ActivityIcon className="w-3 h-3" /> Criado em {formatDateTimeLong(activity.createdAt)}
                                </span>
                                {activity.assignedBy && (
                                  <span className="inline-flex items-center gap-1">
                                    <UserCheck className="w-3 h-3" /> Orientado por {activity.assignedBy}
                                  </span>
                                )}
                              </div>
                              {activity.description && (
                                <div className="mt-2 text-xs text-muted-foreground/90 whitespace-pre-line">
                                  {activity.description}
                                </div>
                              )}
                              {/* Indicators for custom content and responses */}
                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                {activity.fields && activity.fields.length > 0 && (
                                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                    <ClipboardList className="w-3 h-3 mr-1" />
                                    {activity.fields.length} campo(s)
                                  </Badge>
                                )}
                                {activity.attachmentUrl && (
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    <FileText className="w-3 h-3 mr-1" />
                                    Anexo
                                  </Badge>
                                )}
                                {(activity as any).patientResponses && Object.keys((activity as any).patientResponses).length > 0 ? (
                                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Respondido
                                  </Badge>
                                ) : activity.fields && activity.fields.length > 0 ? (
                                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Aguardando
                                  </Badge>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 md:flex-col">
                              {(activity.fields && activity.fields.length > 0) && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="rounded-full inline-flex items-center gap-2" 
                                  onClick={() => {
                                    setSelectedActivityForView(activity);
                                    setResponseViewerOpen(true);
                                  }}
                                >
                                  <MessageSquare className="w-3 h-3" /> Ver respostas
                                </Button>
                              )}
                              <Button size="sm" className="rounded-full inline-flex items-center gap-2" onClick={() => toggleActivityStatus(activity.id)}>
                                <CheckCircle2 className="w-3 h-3" /> Concluir
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-rose-600 hover:text-rose-700"
                                onClick={() => deleteActivity(activity.id)}
                              >
                                Remover
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Concluídas ({completedActivities.length})</div>
                  {completedActivities.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/70 bg-card/70 p-5 text-sm text-muted-foreground">
                      Ainda não há atividades concluídas para este paciente.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {completedActivities.map((activity) => (
                        <div key={activity.id} className="rounded-xl border border-border/60 bg-card p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                {activity.title}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                {activity.completedAt && (
                                  <span className="inline-flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" /> Concluída em {formatDateTimeLong(activity.completedAt)}
                                  </span>
                                )}
                                {activity.dueDate && (
                                  <span className="inline-flex items-center gap-1">
                                    <CalendarDays className="w-3 h-3" /> Prazo: {formatDueDate(activity.dueDate)}
                                  </span>
                                )}
                              </div>
                              {activity.description && (
                                <div className="mt-2 text-xs text-muted-foreground/90 whitespace-pre-line">
                                  {activity.description}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 md:flex-col">
                              <Button size="sm" variant="outline" className="rounded-full" onClick={() => toggleActivityStatus(activity.id)}>
                                Reabrir
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-rose-600 hover:text-rose-700"
                                onClick={() => deleteActivity(activity.id)}
                              >
                                Remover
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/90 border border-border/60">
              <CardContent className="p-6 space-y-4">
                <div className="text-sm font-medium text-muted-foreground">Resumo</div>
                <div className="space-y-3">
                  <ActivitySummaryRow label="Total atribuídas" value={myActivities.length} />
                  <ActivitySummaryRow label="Pendentes" value={pendingActivities.length} />
                  <ActivitySummaryRow label="Concluídas" value={completedActivities.length} />
                  <ActivitySummaryRow label="Próximo prazo" value={nextDueActivity ? formatDueDate(nextDueActivity.dueDate) : "Sem prazo definido"} helper={nextDueActivity ? nextDueActivity.title : undefined} />
                  <ActivitySummaryRow label="Última atualização" value={lastActivity ? formatDateTimeLong(lastActivity.createdAt) : "Ainda não registrado"} helper={lastActivity?.title} />
                </div>
                <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-xs text-muted-foreground">
                  Sugestão: compartilhe o link ou arquivos de apoio na descrição para facilitar o acesso do paciente.
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="recursos" className="mt-6">
          <ResourcesTab patientId={patient.id} />
        </TabsContent>
        <TabsContent value="mensagens" className="mt-6">
          <div className="grid xl:grid-cols-[2fr,1fr] gap-6 items-start">
            <Card className="card-glass">
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-lg font-semibold text-foreground">Mensagens do paciente</div>
                    <div className="text-sm text-muted-foreground">
                      Converse com o paciente e acompanhe solicitações sinalizadas como urgentes.
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-600" /> {urgentPatientMessages.length} urgência(s)
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-primary" /> {unreadPatientMessages.length} não lida(s)
                    </span>
                  </div>
                </div>

                {patientMessages.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/70 bg-card/70 p-6 text-sm text-muted-foreground">
                    Nenhuma mensagem registrada ainda.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {patientMessages.map((message) => {
                      const isPatient = message.author === "patient";
                      return (
                        <div
                          key={message.id}
                          className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${
                            isPatient ? "border-primary/40 bg-primary/5" : "border-emerald-200 bg-emerald-50"
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span className="flex items-center gap-2">
                              {isPatient ? (
                                <UserCheck className="w-3 h-3 text-primary" />
                              ) : (
                                <Shield className="w-3 h-3 text-emerald-600" />
                              )}
                              {isPatient ? "Paciente" : "Equipe"}
                              {message.urgent && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                                  <AlertTriangle className="w-3 h-3" /> Urgente
                                </span>
                              )}
                              {isPatient && !message.read && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                  Novo
                                </span>
                              )}
                            </span>
                            <span>{formatDateTimeLong(message.createdAt)}</span>
                          </div>
                          <div className="text-sm text-foreground whitespace-pre-line">{message.content}</div>
                          {isPatient && !message.read && (
                            <div className="mt-3">
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full"
                                onClick={() => markMessageRead(message.id)}
                              >
                                Marcar como lida
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/90 border border-border/60">
              <CardContent className="p-6 space-y-4">
                <div className="text-sm font-medium text-muted-foreground">Responder paciente</div>
                <div className="rounded-xl border border-border/60 bg-card p-4">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mensagem</label>
                  <Textarea
                    className="mt-2 min-h-[120px]"
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                    placeholder="Escreva uma orientação, retorno ou acolhimento."
                  />
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">O paciente verá sua resposta imediatamente.</span>
                    <Button
                      size="sm"
                      className="rounded-full inline-flex items-center gap-2"
                      onClick={handleSendReply}
                      disabled={!replyText.trim() || !patientId}
                    >
                      <Send className="w-4 h-4" /> Enviar resposta
                    </Button>
                  </div>
                </div>
                <div className="rounded-xl border border-border/60 bg-card p-4 text-xs text-muted-foreground space-y-1">
                  <div><strong>{patientMessages.filter((m) => m.author === "patient").length}</strong> mensagem(ns) enviadas pelo paciente.</div>
                  <div><strong>{patientMessages.filter((m) => m.author === "psychologist").length}</strong> resposta(s) da equipe.</div>
                  <div className="flex items-center gap-1 text-rose-600">
                    <AlertTriangle className="w-3 h-3" /> Trate mensagens urgentes em até 24h.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="progresso" className="mt-6">
          {!contentReady ? (
            <Card className="card-glass">
              <CardContent className="p-6 text-muted-foreground">
                Nenhuma sessão registrada ainda para este paciente. Assim que sessões forem adicionadas, os indicadores de progresso aparecem automaticamente aqui.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="grid xl:grid-cols-[2fr,1fr] gap-6 items-start">
                <Card className="card-glass">
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        Progresso no mês
                      </div>
                      <div className="mt-1 text-2xl font-semibold text-foreground">{progressPct}% concluído</div>
                      <div className="text-xs text-muted-foreground">
                        {monthScheduled} sessão(ões) planejadas · {monthDone} concluída(s)
                      </div>
                    </div>
                    <div className="w-full max-w-md">
                      <Progress value={progressPct} className="h-3 bg-primary/10" />
                      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                        <span>{monthDone} realizadas</span>
                        <span>{monthPending} pendentes</span>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      {focusAreas.map((area) => (
                        <div key={area.title} className="rounded-xl border border-border/60 bg-card/90 p-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <area.icon className="w-4 h-4 text-primary" />
                            {area.title}
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground/90">{area.description}</div>
                          <div className="mt-3 text-xs font-medium text-foreground/80 uppercase tracking-wide">{area.highlight}</div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-card/90 p-6">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Award className="w-4 h-4 text-primary" /> Marco atual
                      </div>
                      <div className="mt-2 text-lg font-semibold text-foreground">{milestone.title}</div>
                      <div className="text-sm text-muted-foreground">{milestone.description}</div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card/90 border border-border/60">
                  <CardContent className="p-6 space-y-4">
                    {quickStats.map((stat) => (
                      <div key={stat.label} className="flex gap-3 rounded-xl border border-border/60 bg-card p-4">
                        <div className="mt-0.5">
                          <stat.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</div>
                          <div className="text-lg font-semibold text-foreground">{stat.value}</div>
                          <div className="text-xs text-muted-foreground">{stat.helper}</div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="grid xl:grid-cols-[2fr,1fr] gap-6 items-start">
                <Card className="bg-card/90 border border-border/60">
                  <CardContent className="p-6 space-y-3">
                    <div className="text-sm font-medium text-muted-foreground">Linha do tempo recente</div>
                    {timelineItems.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border/70 bg-card/70 p-6 text-sm text-muted-foreground">
                        Sem registros anteriores para exibir.
                      </div>
                    ) : (
                      timelineItems.map((item) => {
                        const statusLabel =
                          item.status === "done"
                            ? "Concluída"
                            : item.status === "cancelled"
                            ? "Cancelada"
                            : "Agendada";
                        const statusColor =
                          item.status === "done"
                            ? "text-emerald-600"
                            : item.status === "cancelled"
                            ? "text-rose-600"
                            : "text-amber-600";
                        return (
                          <div key={item.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-card px-4 py-3">
                            <div>
                              <div className="text-sm font-medium text-foreground">{item.service || "Sessão de terapia"}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatDateTimeLong(item.date_time)} · {item.mode === "online" ? "Online" : "Presencial"}
                              </div>
                            </div>
                            <span className={`text-xs font-semibold ${statusColor}`}>{statusLabel}</span>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card/90 border border-border/60">
                  <CardContent className="p-6 space-y-4">
                    <div className="text-sm font-medium text-muted-foreground">Metas e combinados</div>
                    <div className="space-y-3 text-sm text-muted-foreground/90">
                      {objectives.map((goal) => (
                        <div key={goal} className="rounded-xl border border-border/60 bg-card px-4 py-3">
                          • {goal}
                        </div>
                      ))}
                    </div>
                    <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4 text-xs text-muted-foreground">
                      Atualize as observações do paciente para que metas personalizadas apareçam aqui.
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
        <TabsContent value="financeiro" className="mt-6">
          <Card className="card-glass"><CardContent className="p-6 text-muted-foreground">Em breve: dados financeiros por paciente.</CardContent></Card>
        </TabsContent>
        <TabsContent value="arquivos" className="mt-6">
          <Card className="card-glass"><CardContent className="p-6 text-muted-foreground">Em breve: arquivos do paciente.</CardContent></Card>
        </TabsContent>
        <TabsContent value="anamnese" className="mt-6">
          <Card className="card-glass"><CardContent className="p-6 text-muted-foreground">Em breve: anamnese.</CardContent></Card>
        </TabsContent>
        <TabsContent value="acesso" className="mt-6">
          <Card className="card-glass">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    Acesso ao Portal do Paciente
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gerencie o acesso do paciente ao portal online
                  </p>
                </div>
                {patientHasAccount !== null && (
                  <Badge className={patientHasAccount ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                    {patientHasAccount ? "Conta ativa" : "Sem conta"}
                  </Badge>
                )}
              </div>

              {userAccountLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Verificando conta...</span>
                </div>
              ) : patientHasAccount ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-emerald-800">Paciente já possui acesso ao portal</h4>
                      <p className="text-sm text-emerald-700 mt-1">
                        O paciente pode acessar o portal usando o email <strong>{patient.email}</strong>
                      </p>
                      <p className="text-xs text-emerald-600 mt-2">
                        Caso o paciente tenha esquecido a senha, ele pode usar a opção "Esqueci minha senha" na tela de login.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-amber-800">
                          Este paciente ainda não possui uma conta para acessar o portal. 
                          Crie uma conta abaixo para que ele possa agendar sessões, enviar mensagens e acompanhar atividades.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-background p-6 space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                      <UserPlus className="w-5 h-5" />
                      <h4 className="font-medium">Criar conta para o paciente</h4>
                    </div>

                    <div className="grid gap-4">
                      <div>
                        <Label htmlFor="patient-email">Email</Label>
                        <Input 
                          id="patient-email" 
                          type="email" 
                          value={patient.email || ''} 
                          disabled 
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          O email cadastrado será usado para login
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="new-password">Senha *</Label>
                          <Input 
                            id="new-password" 
                            type="password" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                          />
                        </div>
                        <div>
                          <Label htmlFor="confirm-password">Confirmar senha *</Label>
                          <Input 
                            id="confirm-password" 
                            type="password" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repita a senha"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button 
                        onClick={createPatientAccount}
                        disabled={userAccountCreating || !patient.email || !newPassword || !confirmPassword}
                        className="btn-futuristic"
                      >
                        {userAccountCreating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Criando conta...
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Criar conta do paciente
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <h4 className="font-medium text-sm mb-2">O que o paciente pode fazer no portal?</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Agendar e gerenciar sessões</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Enviar mensagens seguras</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Acompanhar atividades e exercícios</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Registrar diário emocional</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ActivityFormDialog
        open={activityDialogOpen}
        onOpenChange={setActivityDialogOpen}
        onSubmit={handleCreateActivity}
        patientId={patientId || ""}
      />

      {selectedActivityForView && (
        <ActivityResponseViewer
          open={responseViewerOpen}
          onOpenChange={setResponseViewerOpen}
          activity={{
            id: selectedActivityForView.id,
            title: selectedActivityForView.title,
            description: selectedActivityForView.description,
            fields: selectedActivityForView.fields,
            attachmentUrl: selectedActivityForView.attachmentUrl,
            attachmentName: selectedActivityForView.attachmentName,
            patientResponses: (selectedActivityForView as any).patientResponses,
            responseHistory: (selectedActivityForView as any).responseHistory,
            psychologistFeedback: (selectedActivityForView as any).psychologistFeedback,
            feedbackAt: (selectedActivityForView as any).feedbackAt,
            feedbackThread: (selectedActivityForView as any).feedbackThread,
          }}
          patientName={patient?.name}
          onSaveFeedback={async (activityId, feedback) => {
            const activityToUpdate = activities.find(a => a.id === activityId);
            if (activityToUpdate) {
              const updatedActivity = {
                ...activityToUpdate,
                psychologistFeedback: feedback,
                feedbackAt: new Date().toISOString(),
              } as any;
              
              // Save to Supabase
              await supabase
                .from("activities")
                .update({ 
                  psychologist_feedback: feedback, 
                  feedback_at: new Date().toISOString() 
                })
                .eq("id", activityId);
              
              const updatedActivities = activities.map(a => 
                a.id === activityId ? updatedActivity : a
              );
              setActivities(updatedActivities);
              setSelectedActivityForView(updatedActivity);
              toast.success("Feedback salvo com sucesso!");
            }
          }}
          onAddThreadComment={async (activityId, comment) => {
            const activityToUpdate = activities.find(a => a.id === activityId);
            if (activityToUpdate) {
              const currentThread = (activityToUpdate as any).feedbackThread || [];
              const newComment = {
                id: uid(),
                author: "psychologist" as const,
                content: comment,
                created_at: new Date().toISOString(),
              };
              const updatedThread = [...currentThread, newComment];
              const updatedActivity = {
                ...activityToUpdate,
                feedbackThread: updatedThread,
              } as any;
              
              // Save to Supabase
              await supabase
                .from("activities")
                .update({ feedback_thread: updatedThread })
                .eq("id", activityId);
              
              const updatedActivities = activities.map(a => 
                a.id === activityId ? updatedActivity : a
              );
              setActivities(updatedActivities);
              setSelectedActivityForView(updatedActivity);
              
              // Send notification to patient about new comment
              if (patientId && activityToUpdate.title) {
                try {
                  await notifyThreadCommentToPatient(
                    patientId,
                    activityToUpdate.title,
                    comment
                  );
                } catch (error) {
                  console.error("Error sending thread notification to patient:", error);
                }
              }
              
              toast.success("Comentário adicionado!");
            }
          }}
        />
      )}

      {/* Editar Paciente */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Informações do Paciente</DialogTitle>
          </DialogHeader>
          <p className="-mt-4 text-sm text-muted-foreground">Atualize as informações básicas do paciente</p>
          <EditBasicForm
            initial={patient}
            onSubmit={(data) => {
              updatePatient(data);
              setEditOpen(false);
              return true;
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Gerenciar Contatos de Emergência */}
      <Dialog open={emergencyOpen} onOpenChange={setEmergencyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contatos de Emergência</DialogTitle>
          </DialogHeader>
          <EmergencyForm
            initial={[]}
            onSubmit={() => { setEmergencyOpen(false); return true; }}
          />
        </DialogContent>
      </Dialog>

      {/* Gerenciar Medicações */}
      <Dialog open={medsOpen} onOpenChange={setMedsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Medicações</DialogTitle>
          </DialogHeader>
          <MedsForm
            initial={[]}
            onSubmit={() => { setMedsOpen(false); return true; }}
          />
        </DialogContent>
      </Dialog>

      {/* Editar Observações */}
      <Dialog open={notesOpen} onOpenChange={setNotesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Observações Gerais</DialogTitle>
          </DialogHeader>
          <NotesForm
            initial={patient.notes || ''}
            onSubmit={(notes) => { updatePatient({ notes }); setNotesOpen(false); return true; }}
          />
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

const MetricCard = ({ icon, title, value, subtitle }: { icon: React.ReactNode; title: string; value: React.ReactNode; subtitle?: string }) => (
  <Card className="card-glass">
    <CardContent className="p-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">{icon}{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
    </CardContent>
  </Card>
);

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
  <div className="py-3 border-b border-border/50">
    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">{icon}{label.toUpperCase()}</div>
    <div className="text-foreground">{value}</div>
  </div>
);

const ActivitySummaryRow = ({ label, value, helper }: { label: string; value: React.ReactNode; helper?: React.ReactNode }) => (
  <div className="rounded-xl border border-border/60 bg-card px-4 py-3">
    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
    <div className="text-lg font-semibold text-foreground">{value}</div>
    {helper && <div className="text-xs text-muted-foreground">{helper}</div>}
  </div>
);

export default PatientProfile;

// Formulário completo para editar paciente (mesma estrutura do criar)
const FullEditForm = ({ initial, onSubmit }: { initial: Partial<Patient>; onSubmit: (data: Partial<Patient>) => boolean }) => {
  const [tab, setTab] = useState("pessoal");
  const [loadingCep, setLoadingCep] = useState(false);
  const [form, setForm] = useState<Partial<Patient>>({ ...initial });

  const buscaCEP = async () => {
    if (!form.cep) return;
    try {
      setLoadingCep(true);
      const cep = (form.cep || '').replace(/\D/g, '');
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data?.erro) throw new Error('CEP não encontrado');
      const end = `${data.logradouro || ''}, ${data.bairro || ''}, ${data.localidade || ''}-${data.uf || ''}`.replace(/^[,\s]+|[,\s]+$/g,'');
      setForm((f) => ({ ...f, address: end }));
    } catch (e) {
      // silencioso
    } finally {
      setLoadingCep(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-4"
    >
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full bg-muted/60 rounded-2xl p-1">
          <TabsTrigger value="pessoal" className="flex-1 rounded-xl">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="endereco" className="flex-1 rounded-xl">Endereço</TabsTrigger>
          <TabsTrigger value="profissional" className="flex-1 rounded-xl">Profissional</TabsTrigger>
        </TabsList>

        <TabsContent value="pessoal" className="mt-4">
          <div className="grid gap-3">
            <div>
              <label className="text-sm">Nome Completo *</label>
              <Input value={form.name || ''} onChange={(e)=>setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm">Email</label>
                <Input type="email" value={form.email || ''} onChange={(e)=>setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="text-sm">Telefone</label>
                <Input value={form.phone || ''} onChange={(e)=>setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm">CPF</label>
                <Input value={form.cpf || ''} onChange={(e)=>setForm({ ...form, cpf: e.target.value })} />
              </div>
              <div>
                <label className="text-sm">Data de Nascimento</label>
                <Input type="date" value={form.birthDate || ''} onChange={(e)=>setForm({ ...form, birthDate: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm">Gênero</label>
              <Select value={form.gender} onValueChange={(v)=>setForm({ ...form, gender: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o gênero" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feminino">Feminino</SelectItem>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                  <SelectItem value="nao_informar">Não informar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="endereco" className="mt-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm">CEP</label>
              <Input value={form.cep || ''} onChange={(e)=>setForm({ ...form, cep: e.target.value })} placeholder="00000-000" />
            </div>
            <div className="hidden md:block" />
            <div className="md:col-span-2">
              <Button type="button" variant="outline" className="w-full" onClick={buscaCEP} disabled={loadingCep}>{loadingCep ? 'Buscando...' : 'Buscar CEP'}</Button>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm">Endereço</label>
              <Textarea rows={3} value={form.address || ''} onChange={(e)=>setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="profissional" className="mt-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="text-sm">Profissão</label>
              <Input value={form.profession || ''} onChange={(e)=>setForm({ ...form, profession: e.target.value })} />
            </div>
            <div>
              <label className="text-sm">Status</label>
              <Select value={form.status || 'active'} onValueChange={(v)=>setForm({ ...form, status: v as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm">Cor de Identificação</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.color || '#3B82F6'} onChange={(e)=>setForm({ ...form, color: e.target.value })} className="h-10 w-16 rounded-md border" />
                <Input value={form.color || '#3B82F6'} onChange={(e)=>setForm({ ...form, color: e.target.value })} />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm">Observações</label>
              <Textarea rows={3} value={form.notes || ''} onChange={(e)=>setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="submit" className="btn-futuristic">Salvar</Button>
      </div>
    </form>
  );
};

// Form enxuto (como no print) para edição básica
const EditBasicForm = ({ initial, onSubmit }: { initial: Partial<Patient>; onSubmit: (data: Partial<Patient>) => boolean }) => {
  const [form, setForm] = useState<Partial<Patient>>({ ...initial });
  const [loadingCep, setLoadingCep] = useState(false);

  const formatCPF = (v: string) => {
    const d = (v || '').replace(/\D/g, '').slice(0, 11);
    const part1 = d.slice(0, 3);
    const part2 = d.slice(3, 6);
    const part3 = d.slice(6, 9);
    const part4 = d.slice(9, 11);
    return [part1, part2 && `.${part2}`, part3 && `.${part3}`, part4 && `-${part4}`].filter(Boolean).join('');
  };

  const formatCEP = (v: string) => {
    const d = (v || '').replace(/\D/g, '').slice(0, 8);
    const part1 = d.slice(0, 5);
    const part2 = d.slice(5, 8);
    return part2 ? `${part1}-${part2}` : part1;
  };

  const formatPhone = (v: string) => {
    const d = (v || '').replace(/\D/g, '').slice(0, 11);
    const ddd = d.slice(0, 2);
    const mid = d.length > 10 ? d.slice(2, 7) : d.slice(2, 6);
    const end = d.length > 10 ? d.slice(7, 11) : d.slice(6, 10);
    if (!ddd) return '';
    if (!mid) return `(${ddd}`;
    if (!end) return `(${ddd}) ${mid}`;
    return `(${ddd}) ${mid}-${end}`;
  };

  const buscaCEP = async () => {
    if (!form.cep) return;
    try {
      setLoadingCep(true);
      const cep = (form.cep || '').replace(/\D/g, '');
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data?.erro) throw new Error('CEP não encontrado');
      const end = `${data.logradouro || ''}, ${data.bairro || ''}, ${data.localidade || ''}-${data.uf || ''}`.replace(/^[,\s]+|[,\s]+$/g,'');
      setForm((f) => ({ ...f, address: end }));
    } catch {}
    finally { setLoadingCep(false); }
  };

  return (
    <form
      onSubmit={(e)=>{ e.preventDefault(); if(!form.name) return; onSubmit(form); }}
      className="space-y-4"
    >
      <div>
        <label className="text-sm">Nome Completo *</label>
        <Input value={form.name || ''} onChange={(e)=>setForm({ ...form, name: e.target.value })} required />
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm">Email</label>
          <Input type="email" value={form.email || ''} onChange={(e)=>setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="text-sm">Telefone</label>
          <Input type="tel" value={form.phone || ''} onChange={(e)=>setForm({ ...form, phone: formatPhone(e.target.value) })} placeholder="(11) 99999-9999" />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm">Data de Nascimento</label>
          <Input type="date" value={form.birthDate || ''} onChange={(e)=>setForm({ ...form, birthDate: e.target.value })} />
        </div>
        <div>
          <label className="text-sm">CPF</label>
          <Input value={form.cpf || ''} onChange={(e)=>setForm({ ...form, cpf: formatCPF(e.target.value) })} placeholder="000.000.000-00" />
        </div>
      </div>

      <div>
        <label className="text-sm">Buscar Endereço</label>
        <div className="flex items-center gap-2">
          <Select defaultValue="cep">
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Por CEP" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cep">Por CEP</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" onClick={buscaCEP} className="flex items-center gap-2">
            <Search className="w-4 h-4" /> Buscar
          </Button>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm">CEP</label>
          <Input value={form.cep || ''} onChange={(e)=>setForm({ ...form, cep: formatCEP(e.target.value) })} placeholder="00000-000" />
        </div>
      </div>
      <div>
        <label className="text-sm">Endereço Completo</label>
        <Textarea rows={3} value={form.address || ''} onChange={(e)=>setForm({ ...form, address: e.target.value })} placeholder="Endereço completo (preenchido automaticamente ou manualmente)" />
      </div>
      <div>
        <label className="text-sm">Profissão</label>
        <Input value={form.profession || ''} onChange={(e)=>setForm({ ...form, profession: e.target.value })} placeholder="Profissão" />
      </div>

      <div className="flex items-center justify-end gap-2 pt-4">
        <DialogClose asChild>
          <Button type="button" variant="outline" className="btn-outline-futuristic">Cancelar</Button>
        </DialogClose>
        <Button type="submit" className="btn-futuristic flex items-center gap-2">
          <Save className="w-4 h-4" />
          Salvar Alterações
        </Button>
      </div>
    </form>
  );
};

// Forms auxiliares
const EmergencyForm = ({ initial, onSubmit }: { initial: { name: string; phone?: string; relation?: string }[]; onSubmit: (list: { name: string; phone?: string; relation?: string }[]) => boolean }) => {
  const [list, setList] = useState(initial);
  const [item, setItem] = useState<{ name: string; phone?: string; relation?: string }>({ name: "" });
  return (
    <form onSubmit={(e)=>{e.preventDefault(); onSubmit(list);}} className="space-y-4">
      <div className="grid md:grid-cols-3 gap-2">
        <Input placeholder="Nome" value={item.name} onChange={(e)=>setItem({ ...item, name: e.target.value })} />
        <Input placeholder="Telefone" value={item.phone || ''} onChange={(e)=>setItem({ ...item, phone: e.target.value })} />
        <div className="flex gap-2">
          <Input placeholder="Relação" value={item.relation || ''} onChange={(e)=>setItem({ ...item, relation: e.target.value })} />
          <Button type="button" onClick={()=>{ if(!item.name) return; setList([ ...list, item ]); setItem({ name: '' }); }} className="btn-futuristic">Adicionar</Button>
        </div>
      </div>
      <div className="space-y-2">
        {list.length === 0 ? (
          <div className="text-sm text-muted-foreground">Nenhum contato adicionado</div>
        ) : (
          list.map((c, i)=> (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted">
              <div className="text-sm">{c.name} {c.phone ? `• ${c.phone}` : ''} {c.relation ? `• ${c.relation}` : ''}</div>
              <Button type="button" variant="ghost" onClick={()=> setList(list.filter((_,idx)=>idx!==i))}>Remover</Button>
            </div>
          ))
        )}
      </div>
      <div className="flex justify-end gap-2">
        <DialogClose asChild>
          <Button type="button" variant="outline" className="btn-outline-futuristic">Cancelar</Button>
        </DialogClose>
        <Button type="submit" className="btn-futuristic">Salvar</Button>
      </div>
    </form>
  );
};

const MedsForm = ({ initial, onSubmit }: { initial: { name: string; dosage?: string }[]; onSubmit: (list: { name: string; dosage?: string }[]) => boolean }) => {
  const [list, setList] = useState(initial);
  const [item, setItem] = useState<{ name: string; dosage?: string }>({ name: "" });
  return (
    <form onSubmit={(e)=>{e.preventDefault(); onSubmit(list);}} className="space-y-4">
      <div className="grid md:grid-cols-3 gap-2">
        <Input placeholder="Medicação" value={item.name} onChange={(e)=>setItem({ ...item, name: e.target.value })} />
        <Input placeholder="Dosagem" value={item.dosage || ''} onChange={(e)=>setItem({ ...item, dosage: e.target.value })} />
        <Button type="button" onClick={()=>{ if(!item.name) return; setList([ ...list, item ]); setItem({ name: '' }); }} className="btn-futuristic">Adicionar</Button>
      </div>
      <div className="space-y-2">
        {list.length === 0 ? (
          <div className="text-sm text-muted-foreground">Nenhuma medicação adicionada</div>
        ) : (
          list.map((m, i)=> (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted">
              <div className="text-sm">{m.name} {m.dosage ? `• ${m.dosage}` : ''}</div>
              <Button type="button" variant="ghost" onClick={()=> setList(list.filter((_,idx)=>idx!==i))}>Remover</Button>
            </div>
          ))
        )}
      </div>
      <div className="flex justify-end gap-2">
        <DialogClose asChild>
          <Button type="button" variant="outline" className="btn-outline-futuristic">Cancelar</Button>
        </DialogClose>
        <Button type="submit" className="btn-futuristic">Salvar</Button>
      </div>
    </form>
  );
};

const NotesForm = ({ initial, onSubmit }: { initial: string; onSubmit: (notes: string) => boolean }) => {
  const [notes, setNotes] = useState(initial);
  return (
    <form onSubmit={(e)=>{e.preventDefault(); onSubmit(notes);}} className="space-y-3">
      <Textarea rows={6} value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="Observações gerais" />
      <div className="flex justify-end gap-2">
        <DialogClose asChild>
          <Button type="button" variant="outline" className="btn-outline-futuristic">Cancelar</Button>
        </DialogClose>
        <Button type="submit" className="btn-futuristic">Salvar</Button>
      </div>
    </form>
  );
};
