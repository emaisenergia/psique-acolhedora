import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Target, TrendingUp, Award, ClipboardList, Plus, Sparkles, Loader2, CheckCircle2, Save, Edit2, ArrowUp, Activity, Calendar, RefreshCw, Archive, History, FileText, Download, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from "recharts";

interface GoalResult {
  goal: string;
  completed: boolean;
  result?: string;
  completedAt?: string;
}

interface Improvement {
  id: string;
  description: string;
  date: string;
  category: string;
}

interface TreatmentPlan {
  id: string;
  patient_id: string;
  start_date: string | null;
  estimated_sessions: number;
  current_progress: number;
  objectives: string[];
  discharge_objectives: string[];
  approaches: string[];
  short_term_goals: string[];
  long_term_goals: string[];
  notes: string | null;
  status: string;
  goal_results: GoalResult[];
  improvements: Improvement[];
  current_status: string;
  current_status_notes: string | null;
  last_review_date: string | null;
  next_review_date: string | null;
  created_at?: string;
  updated_at?: string;
}

interface TreatmentPlanTabProps {
  patientId: string;
  patientName: string;
  patientAge?: number | null;
  patientNotes?: string | null;
  sessionsCompleted: number;
  journalNotes?: string;
  onAddSession?: () => void;
}

const STATUS_OPTIONS = [
  { value: "em_andamento", label: "Em Andamento", color: "bg-blue-100 text-blue-700" },
  { value: "progredindo", label: "Progredindo Bem", color: "bg-emerald-100 text-emerald-700" },
  { value: "estagnado", label: "Estagnado", color: "bg-amber-100 text-amber-700" },
  { value: "dificuldades", label: "Com Dificuldades", color: "bg-rose-100 text-rose-700" },
  { value: "proximo_alta", label: "Próximo da Alta", color: "bg-purple-100 text-purple-700" },
  { value: "concluido", label: "Concluído", color: "bg-slate-100 text-slate-700" },
];

const IMPROVEMENT_CATEGORIES = [
  "Sintomas",
  "Comportamento",
  "Relacionamentos",
  "Autocuidado",
  "Trabalho/Estudos",
  "Sono",
  "Alimentação",
  "Humor",
  "Ansiedade",
  "Autoestima",
  "Outro",
];

// Local storage helper functions
const STORAGE_KEY = "treatment_plans";

const getStoredPlans = (): TreatmentPlan[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveStoredPlans = (plans: TreatmentPlan[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
};

const generateId = () => crypto.randomUUID();

export function TreatmentPlanTab({
  patientId,
  patientName,
  patientAge,
  patientNotes,
  sessionsCompleted,
  journalNotes,
  onAddSession,
}: TreatmentPlanTabProps) {
  const [plan, setPlan] = useState<TreatmentPlan | null>(null);
  const [archivedPlans, setArchivedPlans] = useState<TreatmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addGoalDialogOpen, setAddGoalDialogOpen] = useState(false);
  const [addImprovementDialogOpen, setAddImprovementDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [showArchivedPlans, setShowArchivedPlans] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [createConfirmOpen, setCreateConfirmOpen] = useState(false);
  const [addSessionDialogOpen, setAddSessionDialogOpen] = useState(false);
  const [newSessionSummary, setNewSessionSummary] = useState("");
  const [savingSession, setSavingSession] = useState(false);
  
  const [editForm, setEditForm] = useState({
    start_date: "",
    estimated_sessions: 12,
    objectives: "",
    discharge_objectives: "",
    short_term_goals: "",
    long_term_goals: "",
    approaches: "",
    notes: "",
    next_review_date: "",
  });

  const [newGoal, setNewGoal] = useState({ type: "short_term", text: "" });
  const [newImprovement, setNewImprovement] = useState({ description: "", category: "Sintomas" });
  const [statusForm, setStatusForm] = useState({ status: "em_andamento", notes: "" });

  // Load plans from localStorage
  const loadPlans = useCallback(() => {
    const allPlans = getStoredPlans();
    const activePlan = allPlans.find(p => p.patient_id === patientId && p.status === "active");
    const archived = allPlans.filter(p => p.patient_id === patientId && p.status === "archived");
    
    setPlan(activePlan || null);
    setArchivedPlans(archived);
    setLoading(false);
  }, [patientId]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  // Save plan to localStorage
  const savePlanToStorage = (updatedPlan: TreatmentPlan) => {
    const allPlans = getStoredPlans();
    const index = allPlans.findIndex(p => p.id === updatedPlan.id);
    
    if (index >= 0) {
      allPlans[index] = { ...updatedPlan, updated_at: new Date().toISOString() };
    } else {
      allPlans.push({ ...updatedPlan, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }
    
    saveStoredPlans(allPlans);
    loadPlans();
  };

  const archiveCurrentPlan = () => {
    if (!plan) return;
    
    const updatedPlan = { ...plan, status: "archived" };
    savePlanToStorage(updatedPlan);
    setPlan(null);
    setArchiveConfirmOpen(false);
    loadPlans();
    toast.success("Plano arquivado! Você pode criar um novo plano.");
  };

  const handleCreateNewPlan = () => {
    if (plan) {
      setCreateConfirmOpen(true);
    } else {
      openNewPlanDialog();
    }
  };

  const openNewPlanDialog = () => {
    setEditForm({
      start_date: new Date().toISOString().split("T")[0],
      estimated_sessions: 12,
      objectives: "",
      discharge_objectives: "",
      short_term_goals: "",
      long_term_goals: "",
      approaches: "",
      notes: "",
      next_review_date: "",
    });
    setCreateConfirmOpen(false);
    setEditDialogOpen(true);
  };

  const generateWithAI = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-treatment-plan", {
        body: {
          patientId,
          patientName,
          age: patientAge,
          mainComplaint: patientNotes,
        },
      });

      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        return;
      }

      const aiPlan = data.plan;
      
      const newPlan: TreatmentPlan = {
        id: plan?.id || generateId(),
        patient_id: patientId,
        start_date: new Date().toISOString().split("T")[0],
        estimated_sessions: aiPlan.estimated_sessions || 12,
        objectives: aiPlan.objectives || [],
        discharge_objectives: aiPlan.discharge_objectives || [],
        short_term_goals: aiPlan.short_term_goals || [],
        long_term_goals: aiPlan.long_term_goals || [],
        approaches: aiPlan.approaches || [],
        notes: aiPlan.notes || null,
        current_progress: 0,
        status: "active",
        current_status: "em_andamento",
        current_status_notes: null,
        goal_results: plan?.goal_results || [],
        improvements: plan?.improvements || [],
        last_review_date: null,
        next_review_date: null,
      };

      savePlanToStorage(newPlan);
      toast.success("Plano de tratamento gerado com sucesso!");
    } catch (error) {
      console.error("Error generating treatment plan:", error);
      toast.error("Erro ao gerar plano de tratamento");
    } finally {
      setGenerating(false);
    }
  };

  const openEditDialog = () => {
    if (plan) {
      setEditForm({
        start_date: plan.start_date || "",
        estimated_sessions: plan.estimated_sessions || 12,
        objectives: plan.objectives.join("\n"),
        discharge_objectives: plan.discharge_objectives.join("\n"),
        short_term_goals: plan.short_term_goals.join("\n"),
        long_term_goals: plan.long_term_goals.join("\n"),
        approaches: plan.approaches.join(", "),
        notes: plan.notes || "",
        next_review_date: plan.next_review_date || "",
      });
    } else {
      setEditForm({
        start_date: new Date().toISOString().split("T")[0],
        estimated_sessions: 12,
        objectives: "",
        discharge_objectives: "",
        short_term_goals: "",
        long_term_goals: "",
        approaches: "",
        notes: "",
        next_review_date: "",
      });
    }
    setEditDialogOpen(true);
  };

  const savePlan = () => {
    setSaving(true);
    try {
      const newPlan: TreatmentPlan = {
        id: plan?.id || generateId(),
        patient_id: patientId,
        start_date: editForm.start_date || null,
        estimated_sessions: editForm.estimated_sessions,
        objectives: editForm.objectives.split("\n").filter(Boolean),
        discharge_objectives: editForm.discharge_objectives.split("\n").filter(Boolean),
        short_term_goals: editForm.short_term_goals.split("\n").filter(Boolean),
        long_term_goals: editForm.long_term_goals.split("\n").filter(Boolean),
        approaches: editForm.approaches.split(",").map(s => s.trim()).filter(Boolean),
        notes: editForm.notes || null,
        next_review_date: editForm.next_review_date || null,
        status: "active",
        current_progress: plan?.current_progress || 0,
        current_status: plan?.current_status || "em_andamento",
        current_status_notes: plan?.current_status_notes || null,
        goal_results: plan?.goal_results || [],
        improvements: plan?.improvements || [],
        last_review_date: plan?.last_review_date || null,
      };

      savePlanToStorage(newPlan);
      setEditDialogOpen(false);
      toast.success("Plano de tratamento salvo!");
    } catch (error) {
      console.error("Error saving treatment plan:", error);
      toast.error("Erro ao salvar plano de tratamento");
    } finally {
      setSaving(false);
    }
  };

  const toggleGoalCompletion = (goalType: "short_term" | "long_term", index: number) => {
    if (!plan) return;
    
    const goals = goalType === "short_term" ? plan.short_term_goals : plan.long_term_goals;
    const goal = goals[index];
    const existingResult = plan.goal_results.find(r => r.goal === goal);
    
    let newResults: GoalResult[];
    if (existingResult) {
      newResults = plan.goal_results.map(r => 
        r.goal === goal ? { ...r, completed: !r.completed, completedAt: !r.completed ? new Date().toISOString() : undefined } : r
      );
    } else {
      newResults = [...plan.goal_results, { goal, completed: true, completedAt: new Date().toISOString() }];
    }

    const updatedPlan = { ...plan, goal_results: newResults };
    savePlanToStorage(updatedPlan);
    setPlan(updatedPlan);
  };

  const updateGoalResult = (goal: string, result: string) => {
    if (!plan) return;
    
    const existingResult = plan.goal_results.find(r => r.goal === goal);
    let newResults: GoalResult[];
    if (existingResult) {
      newResults = plan.goal_results.map(r => r.goal === goal ? { ...r, result } : r);
    } else {
      newResults = [...plan.goal_results, { goal, completed: false, result }];
    }

    const updatedPlan = { ...plan, goal_results: newResults };
    savePlanToStorage(updatedPlan);
    setPlan(updatedPlan);
    toast.success("Resultado atualizado!");
  };

  const addGoal = () => {
    if (!plan || !newGoal.text.trim()) return;
    
    const field = newGoal.type === "short_term" ? "short_term_goals" : "long_term_goals";
    const currentGoals = newGoal.type === "short_term" ? plan.short_term_goals : plan.long_term_goals;
    const updatedGoals = [...currentGoals, newGoal.text.trim()];

    const updatedPlan = { ...plan, [field]: updatedGoals };
    savePlanToStorage(updatedPlan);
    setPlan(updatedPlan);
    setNewGoal({ type: "short_term", text: "" });
    setAddGoalDialogOpen(false);
    toast.success("Meta adicionada!");
  };

  const addImprovement = () => {
    if (!plan || !newImprovement.description.trim()) return;
    
    const improvement: Improvement = {
      id: crypto.randomUUID(),
      description: newImprovement.description.trim(),
      date: new Date().toISOString(),
      category: newImprovement.category,
    };

    const updatedImprovements = [...plan.improvements, improvement];
    const updatedPlan = { ...plan, improvements: updatedImprovements };
    savePlanToStorage(updatedPlan);
    setPlan(updatedPlan);
    setNewImprovement({ description: "", category: "Sintomas" });
    setAddImprovementDialogOpen(false);
    toast.success("Melhora registrada!");
  };

  const updateStatus = () => {
    if (!plan) return;
    
    const updatedPlan = {
      ...plan,
      current_status: statusForm.status,
      current_status_notes: statusForm.notes || null,
      last_review_date: new Date().toISOString().split("T")[0],
    };
    
    savePlanToStorage(updatedPlan);
    setPlan(updatedPlan);
    setStatusDialogOpen(false);
    toast.success("Status atualizado!");
  };

  const saveSessionRecord = () => {
    if (!newSessionSummary.trim()) {
      toast.error("Por favor, insira o resumo da sessão");
      return;
    }
    
    // Save session record to localStorage
    const sessionsKey = `sessions_${patientId}`;
    const existingSessions = JSON.parse(localStorage.getItem(sessionsKey) || "[]");
    const newSession = {
      id: generateId(),
      patient_id: patientId,
      session_date: new Date().toISOString(),
      status: "completed",
      summary: newSessionSummary.trim(),
      created_at: new Date().toISOString(),
    };
    existingSessions.push(newSession);
    localStorage.setItem(sessionsKey, JSON.stringify(existingSessions));
    
    setNewSessionSummary("");
    setAddSessionDialogOpen(false);
    toast.success("Registro de sessão adicionado!");
  };

  const getGoalResult = (goal: string) => plan?.goal_results.find(r => r.goal === goal);
  const isGoalCompleted = (goal: string) => getGoalResult(goal)?.completed || false;
  
  const completedGoalsCount = plan ? 
    [...plan.short_term_goals, ...plan.long_term_goals].filter(g => isGoalCompleted(g)).length : 0;
  const totalGoalsCount = plan ? plan.short_term_goals.length + plan.long_term_goals.length : 0;
  const goalsProgress = totalGoalsCount > 0 ? Math.round((completedGoalsCount / totalGoalsCount) * 100) : 0;

  const currentStatusOption = STATUS_OPTIONS.find(s => s.value === plan?.current_status) || STATUS_OPTIONS[0];

  // Generate evolution chart data
  const evolutionData = useMemo(() => {
    if (!plan) return [];
    
    const data: { date: string; melhoras: number; metasConcluidas: number; label: string }[] = [];
    
    // Group improvements by month
    const improvementsByMonth: Record<string, number> = {};
    plan.improvements.forEach(imp => {
      const month = new Date(imp.date).toISOString().slice(0, 7);
      improvementsByMonth[month] = (improvementsByMonth[month] || 0) + 1;
    });

    // Group completed goals by month
    const goalsByMonth: Record<string, number> = {};
    plan.goal_results.filter(r => r.completed && r.completedAt).forEach(r => {
      const month = new Date(r.completedAt!).toISOString().slice(0, 7);
      goalsByMonth[month] = (goalsByMonth[month] || 0) + 1;
    });

    // Get all unique months
    const allMonths = new Set([...Object.keys(improvementsByMonth), ...Object.keys(goalsByMonth)]);
    
    // Add start date month if exists
    if (plan.start_date) {
      allMonths.add(plan.start_date.slice(0, 7));
    }

    // Sort and create cumulative data
    const sortedMonths = Array.from(allMonths).sort();
    let cumulativeImprovements = 0;
    let cumulativeGoals = 0;

    sortedMonths.forEach(month => {
      cumulativeImprovements += improvementsByMonth[month] || 0;
      cumulativeGoals += goalsByMonth[month] || 0;
      
      const date = new Date(month + "-01");
      data.push({
        date: month,
        label: date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        melhoras: cumulativeImprovements,
        metasConcluidas: cumulativeGoals,
      });
    });

    return data;
  }, [plan]);

  // Export to PDF function
  const exportToPDF = () => {
    if (!plan) return;
    
    const statusLabel = STATUS_OPTIONS.find(s => s.value === plan.current_status)?.label || "Em Andamento";
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Plano de Tratamento - ${patientName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #3b82f6; }
          .header h1 { color: #1e40af; font-size: 24px; margin-bottom: 5px; }
          .header p { color: #64748b; font-size: 14px; }
          .patient-info { background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 25px; }
          .patient-info h2 { color: #1e40af; font-size: 18px; margin-bottom: 10px; }
          .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
          .info-item { }
          .info-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
          .info-value { font-size: 14px; font-weight: 600; color: #1a1a1a; }
          .section { margin-bottom: 25px; }
          .section-title { color: #1e40af; font-size: 16px; font-weight: 600; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; gap: 8px; }
          .section-title::before { content: ''; width: 4px; height: 16px; background: #3b82f6; border-radius: 2px; }
          .list { list-style: none; }
          .list li { padding: 8px 12px; margin-bottom: 6px; background: #f8fafc; border-radius: 6px; font-size: 13px; display: flex; align-items: flex-start; gap: 10px; }
          .list li::before { content: '•'; color: #3b82f6; font-weight: bold; font-size: 16px; }
          .goal-item { padding: 10px 12px; margin-bottom: 8px; border-radius: 6px; font-size: 13px; }
          .goal-pending { background: #fef3c7; border-left: 3px solid #f59e0b; }
          .goal-completed { background: #d1fae5; border-left: 3px solid #10b981; }
          .goal-status { font-size: 11px; color: #64748b; margin-top: 4px; }
          .badges { display: flex; flex-wrap: wrap; gap: 8px; }
          .badge { background: #e0e7ff; color: #4338ca; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
          .progress-section { background: linear-gradient(135deg, #eff6ff, #dbeafe); padding: 20px; border-radius: 10px; margin-bottom: 25px; }
          .progress-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
          .progress-item { }
          .progress-label { font-size: 12px; color: #1e40af; margin-bottom: 5px; }
          .progress-bar { height: 8px; background: #bfdbfe; border-radius: 4px; overflow: hidden; }
          .progress-fill { height: 100%; background: #3b82f6; border-radius: 4px; }
          .progress-fill.green { background: #10b981; }
          .progress-value { font-size: 20px; font-weight: 700; color: #1e40af; }
          .improvement-item { padding: 10px 12px; margin-bottom: 8px; background: #ecfdf5; border-left: 3px solid #10b981; border-radius: 6px; }
          .improvement-category { font-size: 11px; color: #059669; font-weight: 600; text-transform: uppercase; }
          .improvement-desc { font-size: 13px; color: #1a1a1a; margin-top: 4px; }
          .improvement-date { font-size: 11px; color: #64748b; margin-top: 4px; }
          .notes { background: #fffbeb; padding: 15px; border-radius: 8px; border-left: 3px solid #f59e0b; }
          .notes p { font-size: 13px; color: #78350f; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 11px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Plano de Tratamento</h1>
          <p>Documento gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
        </div>

        <div class="patient-info">
          <h2>${patientName}</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Status Atual</div>
              <div class="info-value">${statusLabel}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Início do Tratamento</div>
              <div class="info-value">${plan.start_date ? new Date(plan.start_date).toLocaleDateString("pt-BR") : "Não definido"}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Sessões Estimadas</div>
              <div class="info-value">${plan.estimated_sessions} sessões</div>
            </div>
          </div>
        </div>

        <div class="progress-section">
          <div class="progress-grid">
            <div class="progress-item">
              <div class="progress-label">Progresso das Sessões (${sessionsCompleted}/${plan.estimated_sessions})</div>
              <div class="progress-bar"><div class="progress-fill" style="width: ${Math.min(100, Math.round((sessionsCompleted / plan.estimated_sessions) * 100))}%"></div></div>
              <div class="progress-value">${Math.min(100, Math.round((sessionsCompleted / plan.estimated_sessions) * 100))}%</div>
            </div>
            <div class="progress-item">
              <div class="progress-label">Metas Concluídas (${completedGoalsCount}/${totalGoalsCount})</div>
              <div class="progress-bar"><div class="progress-fill green" style="width: ${goalsProgress}%"></div></div>
              <div class="progress-value">${goalsProgress}%</div>
            </div>
          </div>
        </div>

        ${plan.objectives.length > 0 ? `
        <div class="section">
          <div class="section-title">Objetivos Terapêuticos</div>
          <ul class="list">
            ${plan.objectives.map(obj => `<li>${obj}</li>`).join("")}
          </ul>
        </div>
        ` : ""}

        ${plan.discharge_objectives.length > 0 ? `
        <div class="section">
          <div class="section-title">Critérios para Alta</div>
          <ul class="list">
            ${plan.discharge_objectives.map(obj => `<li>${obj}</li>`).join("")}
          </ul>
        </div>
        ` : ""}

        ${plan.short_term_goals.length > 0 ? `
        <div class="section">
          <div class="section-title">Metas de Curto Prazo</div>
          ${plan.short_term_goals.map(goal => {
            const result = plan.goal_results.find(r => r.goal === goal);
            return `<div class="goal-item ${result?.completed ? "goal-completed" : "goal-pending"}">
              ${goal}
              ${result?.completed ? `<div class="goal-status">✓ Concluída${result.completedAt ? ` em ${new Date(result.completedAt).toLocaleDateString("pt-BR")}` : ""}</div>` : '<div class="goal-status">⏳ Em andamento</div>'}
              ${result?.result ? `<div class="goal-status">Obs: ${result.result}</div>` : ""}
            </div>`;
          }).join("")}
        </div>
        ` : ""}

        ${plan.long_term_goals.length > 0 ? `
        <div class="section">
          <div class="section-title">Metas de Longo Prazo</div>
          ${plan.long_term_goals.map(goal => {
            const result = plan.goal_results.find(r => r.goal === goal);
            return `<div class="goal-item ${result?.completed ? "goal-completed" : "goal-pending"}">
              ${goal}
              ${result?.completed ? `<div class="goal-status">✓ Concluída${result.completedAt ? ` em ${new Date(result.completedAt).toLocaleDateString("pt-BR")}` : ""}</div>` : '<div class="goal-status">⏳ Em andamento</div>'}
              ${result?.result ? `<div class="goal-status">Obs: ${result.result}</div>` : ""}
            </div>`;
          }).join("")}
        </div>
        ` : ""}

        ${plan.approaches.length > 0 ? `
        <div class="section">
          <div class="section-title">Abordagens Terapêuticas</div>
          <div class="badges">
            ${plan.approaches.map(app => `<span class="badge">${app}</span>`).join("")}
          </div>
        </div>
        ` : ""}

        ${plan.improvements.length > 0 ? `
        <div class="section">
          <div class="section-title">Registro de Melhoras</div>
          ${plan.improvements.map(imp => `
            <div class="improvement-item">
              <div class="improvement-category">${imp.category}</div>
              <div class="improvement-desc">${imp.description}</div>
              <div class="improvement-date">${new Date(imp.date).toLocaleDateString("pt-BR")}</div>
            </div>
          `).join("")}
        </div>
        ` : ""}

        ${plan.notes ? `
        <div class="section">
          <div class="section-title">Observações</div>
          <div class="notes">
            <p>${plan.notes}</p>
          </div>
        </div>
        ` : ""}

        <div class="footer">
          <p>Este documento é confidencial e destinado exclusivamente ao uso profissional.</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
    
    toast.success("Preparando PDF para impressão...");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="grid xl:grid-cols-[2fr,1fr] gap-6 items-start">
        <div className="space-y-6">
          <Card className="card-glass">
            <CardContent className="p-6 space-y-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-lg font-semibold text-foreground">Plano de Tratamento</div>
                  <div className="text-sm text-muted-foreground">
                    Gerencie objetivos, metas e acompanhe o progresso.
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button variant="outline" size="sm" className="rounded-full" onClick={() => setAddSessionDialogOpen(true)}>
                    <FileText className="w-4 h-4 mr-2" />
                    Adicionar Registro de Sessão
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={generateWithAI}
                    disabled={generating}
                  >
                    {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    {generating ? "Gerando..." : "Gerar com IA"}
                  </Button>
                  <Button size="sm" className="rounded-full" onClick={openEditDialog} disabled={!plan}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Editar Plano
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full" onClick={handleCreateNewPlan}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Plano
                  </Button>
                  {plan && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={() => {
                          setStatusForm({
                            status: plan.current_status || "em_andamento",
                            notes: plan.current_status_notes || "",
                          });
                          setStatusDialogOpen(true);
                        }}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Atualizar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full text-amber-600 hover:text-amber-700"
                        onClick={() => setArchiveConfirmOpen(true)}
                      >
                        <Archive className="w-4 h-4 mr-2" />
                        Arquivar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full text-primary hover:text-primary/80"
                        onClick={exportToPDF}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Exportar PDF
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Resumo do Plano Atual */}
              {plan && (
                <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/10 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <ClipboardList className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">Resumo do Plano</h3>
                      <p className="text-xs text-muted-foreground">Visão geral do tratamento atual</p>
                    </div>
                    <Badge className={`ml-auto ${currentStatusOption.color}`}>
                      {currentStatusOption.label}
                    </Badge>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    {/* Principais Objetivos */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" />
                        Objetivos Principais
                      </div>
                      {plan.objectives && plan.objectives.length > 0 ? (
                        <ul className="space-y-1">
                          {plan.objectives.slice(0, 3).map((obj, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span className="line-clamp-1">{obj}</span>
                            </li>
                          ))}
                          {plan.objectives.length > 3 && (
                            <li className="text-xs text-muted-foreground ml-7">
                              +{plan.objectives.length - 3} mais...
                            </li>
                          )}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Nenhum objetivo definido</p>
                      )}
                    </div>

                    {/* Metas em Andamento */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-foreground flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        Metas em Andamento
                      </div>
                      {(() => {
                        const pendingGoals = [...plan.short_term_goals, ...plan.long_term_goals]
                          .filter(g => !isGoalCompleted(g));
                        return pendingGoals.length > 0 ? (
                          <ul className="space-y-1">
                            {pendingGoals.slice(0, 3).map((goal, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                                <span className="line-clamp-1">{goal}</span>
                              </li>
                            ))}
                            {pendingGoals.length > 3 && (
                              <li className="text-xs text-muted-foreground ml-4">
                                +{pendingGoals.length - 3} mais...
                              </li>
                            )}
                          </ul>
                        ) : (
                          <p className="text-sm text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Todas as metas concluídas!
                          </p>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Barras de Progresso */}
                  <div className="grid md:grid-cols-2 gap-4 pt-3 border-t border-border/50">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Sessões</span>
                        <span className="font-medium text-primary">
                          {sessionsCompleted}/{plan.estimated_sessions}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(100, Math.round((sessionsCompleted / plan.estimated_sessions) * 100))} 
                        className="h-2" 
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Metas Concluídas</span>
                        <span className="font-medium text-emerald-600">
                          {completedGoalsCount}/{totalGoalsCount}
                        </span>
                      </div>
                      <Progress value={goalsProgress} className="h-2 bg-emerald-200" />
                    </div>
                  </div>
                </div>
              )}

              {/* Status Atual */}
              <div className="rounded-xl border border-border/60 bg-gradient-to-br from-slate-50 to-slate-100 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" />
                      Status Atual do Paciente
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={currentStatusOption.color}>
                        {currentStatusOption.label}
                      </Badge>
                      {plan?.last_review_date && (
                        <span className="text-xs text-muted-foreground">
                          Última revisão: {new Date(plan.last_review_date).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                    {plan?.current_status_notes && (
                      <p className="text-sm text-muted-foreground mt-2">{plan.current_status_notes}</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStatusForm({
                        status: plan?.current_status || "em_andamento",
                        notes: plan?.current_status_notes || "",
                      });
                      setStatusDialogOpen(true);
                    }}
                    disabled={!plan}
                  >
                    Atualizar Status
                  </Button>
                </div>
              </div>

              {/* Progress Section */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
                  <div className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Progresso das Sessões
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">
                      {sessionsCompleted} de {plan?.estimated_sessions || 12} sessões
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {plan ? Math.min(100, Math.round((sessionsCompleted / plan.estimated_sessions) * 100)) : 0}%
                    </span>
                  </div>
                  <Progress value={plan ? Math.min(100, Math.round((sessionsCompleted / plan.estimated_sessions) * 100)) : 0} className="h-2" />
                </div>

                <div className="rounded-xl border border-border/60 bg-gradient-to-br from-emerald-50 to-emerald-100 p-4">
                  <div className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Progresso das Metas
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">
                      {completedGoalsCount} de {totalGoalsCount} metas
                    </span>
                    <span className="text-lg font-bold text-emerald-600">{goalsProgress}%</span>
                  </div>
                  <Progress value={goalsProgress} className="h-2 bg-emerald-200" />
                </div>
              </div>

              {/* Info Fields */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                  <div className="text-xs text-muted-foreground mb-1">Data de Início</div>
                  <div className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {plan?.start_date ? new Date(plan.start_date).toLocaleDateString("pt-BR") : "Não definida"}
                  </div>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                  <div className="text-xs text-muted-foreground mb-1">Sessões Estimadas</div>
                  <div className="text-sm font-medium">{plan?.estimated_sessions || 12} sessões</div>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                  <div className="text-xs text-muted-foreground mb-1">Próxima Revisão</div>
                  <div className="text-sm font-medium">
                    {plan?.next_review_date ? new Date(plan.next_review_date).toLocaleDateString("pt-BR") : "Não agendada"}
                  </div>
                </div>
              </div>

              {/* Objectives */}
              <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                <div className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Objetivos Terapêuticos
                </div>
                {plan?.objectives && plan.objectives.length > 0 ? (
                  <div className="space-y-2">
                    {plan.objectives.map((objective, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="text-sm text-muted-foreground">{objective}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground p-4 rounded-lg border border-dashed border-border/70 bg-white/50">
                    Nenhum objetivo definido. Use a IA ou adicione manualmente.
                  </div>
                )}
              </div>

              {/* Discharge Objectives */}
              <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                <div className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Critérios para Alta
                </div>
                {plan?.discharge_objectives && plan.discharge_objectives.length > 0 ? (
                  <div className="space-y-2">
                    {plan.discharge_objectives.map((objective, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-muted-foreground">{objective}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground p-4 rounded-lg border border-dashed border-border/70 bg-white/50">
                    Defina critérios claros para o encerramento do tratamento.
                  </div>
                )}
              </div>

              {/* Goals with Checkbox and Results */}
              <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    Metas de Curto Prazo
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => { setNewGoal({ type: "short_term", text: "" }); setAddGoalDialogOpen(true); }} disabled={!plan}>
                    <Plus className="w-4 h-4 mr-1" /> Adicionar
                  </Button>
                </div>
                {plan?.short_term_goals && plan.short_term_goals.length > 0 ? (
                  <div className="space-y-3">
                    {plan.short_term_goals.map((goal, index) => {
                      const result = getGoalResult(goal);
                      return (
                        <div key={index} className={`p-3 rounded-lg border ${result?.completed ? "bg-emerald-50 border-emerald-200" : "bg-blue-50 border-blue-100"}`}>
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={result?.completed || false}
                              onCheckedChange={() => toggleGoalCompletion("short_term", index)}
                              className="mt-0.5"
                            />
                            <div className="flex-1">
                              <div className={`text-sm ${result?.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                {goal}
                              </div>
                              {result?.completed && result.completedAt && (
                                <div className="text-xs text-emerald-600 mt-1">
                                  Concluída em {new Date(result.completedAt).toLocaleDateString("pt-BR")}
                                </div>
                              )}
                              <div className="mt-2">
                                <Input
                                  placeholder="Resultado/observações..."
                                  value={result?.result || ""}
                                  onChange={(e) => updateGoalResult(goal, e.target.value)}
                                  className="text-xs h-8"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground p-4 rounded-lg border border-dashed border-border/70 bg-white/50">
                    Adicione metas de curto prazo para acompanhar.
                  </div>
                )}
              </div>

              {/* Long Term Goals */}
              <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-600" />
                    Metas de Longo Prazo
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => { setNewGoal({ type: "long_term", text: "" }); setAddGoalDialogOpen(true); }} disabled={!plan}>
                    <Plus className="w-4 h-4 mr-1" /> Adicionar
                  </Button>
                </div>
                {plan?.long_term_goals && plan.long_term_goals.length > 0 ? (
                  <div className="space-y-3">
                    {plan.long_term_goals.map((goal, index) => {
                      const result = getGoalResult(goal);
                      return (
                        <div key={index} className={`p-3 rounded-lg border ${result?.completed ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-100"}`}>
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={result?.completed || false}
                              onCheckedChange={() => toggleGoalCompletion("long_term", index)}
                              className="mt-0.5"
                            />
                            <div className="flex-1">
                              <div className={`text-sm ${result?.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                {goal}
                              </div>
                              {result?.completed && result.completedAt && (
                                <div className="text-xs text-emerald-600 mt-1">
                                  Concluída em {new Date(result.completedAt).toLocaleDateString("pt-BR")}
                                </div>
                              )}
                              <div className="mt-2">
                                <Input
                                  placeholder="Resultado/observações..."
                                  value={result?.result || ""}
                                  onChange={(e) => updateGoalResult(goal, e.target.value)}
                                  className="text-xs h-8"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground p-4 rounded-lg border border-dashed border-border/70 bg-white/50">
                    Adicione metas de longo prazo para acompanhar.
                  </div>
                )}
              </div>

              {/* Approaches */}
              {plan?.approaches && plan.approaches.length > 0 && (
                <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                  <div className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-purple-600" />
                    Abordagens Terapêuticas
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {plan.approaches.map((approach, index) => (
                      <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-700">
                        {approach}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Improvements Section */}
          <Card className="card-glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <ArrowUp className="w-5 h-5 text-emerald-600" />
                    Registro de Melhoras
                  </div>
                  <div className="text-sm text-muted-foreground">Documente progressos e avanços do paciente.</div>
                </div>
                <Button size="sm" className="rounded-full" onClick={() => setAddImprovementDialogOpen(true)} disabled={!plan}>
                  <Plus className="w-4 h-4 mr-2" /> Registrar Melhora
                </Button>
              </div>

              {plan?.improvements && plan.improvements.length > 0 ? (
                <div className="space-y-3">
                  {plan.improvements.slice().reverse().map((imp) => (
                    <div key={imp.id} className="p-4 rounded-xl border border-emerald-200 bg-emerald-50">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs bg-white">
                              {imp.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(imp.date).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                          <p className="text-sm text-foreground">{imp.description}</p>
                        </div>
                        <ArrowUp className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground p-6 rounded-lg border border-dashed border-border/70 bg-white/50 text-center">
                  Nenhuma melhora registrada ainda. Use o botão acima para documentar progressos.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Evolution Chart */}
          {plan && evolutionData.length > 1 && (
            <Card className="card-glass">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Gráfico de Evolução</h3>
                    <p className="text-sm text-muted-foreground">Progresso ao longo do tratamento</p>
                  </div>
                </div>

                <div className="h-[280px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={evolutionData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorMelhoras" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorMetas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="label" 
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        labelStyle={{ fontWeight: 600, color: '#1a1a1a' }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '10px' }}
                        formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="melhoras" 
                        name="Melhoras Registradas"
                        stroke="#10b981" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorMelhoras)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="metasConcluidas" 
                        name="Metas Concluídas"
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorMetas)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/50">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600">{plan.improvements.length}</div>
                    <div className="text-xs text-muted-foreground">Total de Melhoras</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{completedGoalsCount}</div>
                    <div className="text-xs text-muted-foreground">Metas Concluídas</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="bg-white/90 border border-border/60">
            <CardContent className="p-6 space-y-4">
              <div className="text-sm font-medium text-muted-foreground">Resumo do Plano</div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge className={currentStatusOption.color}>{currentStatusOption.label}</Badge>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <span className="text-sm text-muted-foreground">Metas concluídas</span>
                  <span className="text-sm font-medium">{completedGoalsCount}/{totalGoalsCount}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <span className="text-sm text-muted-foreground">Melhoras registradas</span>
                  <span className="text-sm font-medium">{plan?.improvements?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <span className="text-sm text-muted-foreground">Sessões realizadas</span>
                  <span className="text-sm font-medium">{sessionsCompleted}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">Objetivos definidos</span>
                  <span className="text-sm font-medium">{plan?.objectives?.length || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {plan?.notes && (
            <Card className="bg-white/90 border border-border/60">
              <CardContent className="p-6 space-y-3">
                <div className="font-medium text-foreground text-sm">Observações</div>
                <div className="text-sm text-muted-foreground">{plan.notes}</div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-white/90 border border-border/60">
            <CardContent className="p-6 space-y-3 text-sm text-muted-foreground">
              <div className="font-medium text-foreground">Dicas para o plano</div>
              <ul className="list-disc pl-4 space-y-1">
                <li>Revise os objetivos a cada 8-12 sessões.</li>
                <li>Marque metas concluídas para acompanhar progresso.</li>
                <li>Registre melhoras observadas a cada sessão.</li>
                <li>Atualize o status do paciente regularmente.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Plan Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{plan ? "Editar Plano de Tratamento" : "Novo Plano de Tratamento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Data de Início</Label>
                <Input type="date" value={editForm.start_date} onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })} />
              </div>
              <div>
                <Label>Sessões Estimadas</Label>
                <Input type="number" min={1} max={100} value={editForm.estimated_sessions} onChange={(e) => setEditForm({ ...editForm, estimated_sessions: parseInt(e.target.value) || 12 })} />
              </div>
              <div>
                <Label>Próxima Revisão</Label>
                <Input type="date" value={editForm.next_review_date} onChange={(e) => setEditForm({ ...editForm, next_review_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Objetivos Terapêuticos (um por linha)</Label>
              <Textarea rows={4} value={editForm.objectives} onChange={(e) => setEditForm({ ...editForm, objectives: e.target.value })} placeholder="Reduzir sintomas de ansiedade&#10;Desenvolver estratégias de enfrentamento" />
            </div>
            <div>
              <Label>Critérios para Alta (um por linha)</Label>
              <Textarea rows={3} value={editForm.discharge_objectives} onChange={(e) => setEditForm({ ...editForm, discharge_objectives: e.target.value })} placeholder="Autonomia no manejo da ansiedade" />
            </div>
            <div>
              <Label>Metas de Curto Prazo (um por linha)</Label>
              <Textarea rows={3} value={editForm.short_term_goals} onChange={(e) => setEditForm({ ...editForm, short_term_goals: e.target.value })} placeholder="Iniciar técnicas de respiração" />
            </div>
            <div>
              <Label>Metas de Longo Prazo (um por linha)</Label>
              <Textarea rows={3} value={editForm.long_term_goals} onChange={(e) => setEditForm({ ...editForm, long_term_goals: e.target.value })} placeholder="Retomar atividades sociais" />
            </div>
            <div>
              <Label>Abordagens Terapêuticas (separadas por vírgula)</Label>
              <Input value={editForm.approaches} onChange={(e) => setEditForm({ ...editForm, approaches: e.target.value })} placeholder="TCC, Mindfulness, ACT" />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea rows={2} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Notas adicionais..." />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={savePlan} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Goal Dialog */}
      <Dialog open={addGoalDialogOpen} onOpenChange={setAddGoalDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Meta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Tipo de Meta</Label>
              <Select value={newGoal.type} onValueChange={(v) => setNewGoal({ ...newGoal, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="short_term">Curto Prazo</SelectItem>
                  <SelectItem value="long_term">Longo Prazo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição da Meta</Label>
              <Textarea rows={3} value={newGoal.text} onChange={(e) => setNewGoal({ ...newGoal, text: e.target.value })} placeholder="Descreva a meta..." />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={addGoal} disabled={!newGoal.text.trim()}>
              <Plus className="w-4 h-4 mr-2" /> Adicionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Improvement Dialog */}
      <Dialog open={addImprovementDialogOpen} onOpenChange={setAddImprovementDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Melhora</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Categoria</Label>
              <Select value={newImprovement.category} onValueChange={(v) => setNewImprovement({ ...newImprovement, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {IMPROVEMENT_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição da Melhora</Label>
              <Textarea rows={3} value={newImprovement.description} onChange={(e) => setNewImprovement({ ...newImprovement, description: e.target.value })} placeholder="Descreva a melhora observada..." />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={addImprovement} disabled={!newImprovement.description.trim()}>
              <ArrowUp className="w-4 h-4 mr-2" /> Registrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Atualizar Status do Paciente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Status Atual</Label>
              <Select value={statusForm.status} onValueChange={(v) => setStatusForm({ ...statusForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea rows={3} value={statusForm.notes} onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })} placeholder="Observações sobre o status atual..." />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={updateStatus}>
              <Save className="w-4 h-4 mr-2" /> Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Archive Confirm Dialog */}
      <Dialog open={archiveConfirmOpen} onOpenChange={setArchiveConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Arquivar Plano de Tratamento</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja arquivar este plano? O plano será salvo no histórico e você poderá criar um novo plano para o paciente.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button variant="destructive" onClick={archiveCurrentPlan}>
              <Archive className="w-4 h-4 mr-2" /> Arquivar Plano
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create New Plan Confirm Dialog */}
      <Dialog open={createConfirmOpen} onOpenChange={setCreateConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Novo Plano de Tratamento</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Já existe um plano de tratamento ativo para este paciente. Deseja arquivar o plano atual e criar um novo?
            </p>
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700">
                <strong>Atenção:</strong> O plano atual será arquivado e ficará disponível no histórico.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button 
              variant="default" 
              onClick={() => {
                archiveCurrentPlan();
                openNewPlanDialog();
              }}
            >
              <Plus className="w-4 h-4 mr-2" /> Arquivar e Criar Novo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Session Record Dialog */}
      <Dialog open={addSessionDialogOpen} onOpenChange={setAddSessionDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Adicionar Registro de Sessão
            </DialogTitle>
            <DialogDescription>
              Registre o resumo e observações da sessão realizada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Resumo da Sessão</Label>
              <Textarea
                placeholder="Descreva os principais pontos abordados, técnicas utilizadas, insights do paciente..."
                value={newSessionSummary}
                onChange={(e) => setNewSessionSummary(e.target.value)}
                rows={8}
                className="resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={saveSessionRecord} disabled={savingSession || !newSessionSummary.trim()}>
              {savingSession ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Registro
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Archived Plans Section */}
      {archivedPlans.length > 0 && (
        <Card className="mt-6 card-glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-muted-foreground" />
                <div className="text-lg font-semibold text-foreground">Planos Anteriores</div>
                <Badge variant="secondary">{archivedPlans.length}</Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowArchivedPlans(!showArchivedPlans)}
              >
                {showArchivedPlans ? "Ocultar" : "Mostrar"}
              </Button>
            </div>
            
            {showArchivedPlans && (
              <div className="space-y-4">
                {archivedPlans.map((archivedPlan) => {
                  const archivedStatusOption = STATUS_OPTIONS.find(s => s.value === archivedPlan.current_status) || STATUS_OPTIONS[0];
                  const archivedCompletedGoals = [...archivedPlan.short_term_goals, ...archivedPlan.long_term_goals]
                    .filter(g => archivedPlan.goal_results.find(r => r.goal === g)?.completed).length;
                  const archivedTotalGoals = archivedPlan.short_term_goals.length + archivedPlan.long_term_goals.length;
                  
                  return (
                    <div key={archivedPlan.id} className="rounded-xl border border-border/60 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={archivedStatusOption.color}>
                              {archivedStatusOption.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {archivedPlan.start_date ? new Date(archivedPlan.start_date).toLocaleDateString("pt-BR") : "—"}
                              {archivedPlan.created_at && ` - Arquivado em ${new Date(archivedPlan.updated_at || archivedPlan.created_at).toLocaleDateString("pt-BR")}`}
                            </span>
                          </div>
                          
                          <div className="grid md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Sessões estimadas:</span>
                              <span className="ml-1 font-medium">{archivedPlan.estimated_sessions}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Metas concluídas:</span>
                              <span className="ml-1 font-medium">{archivedCompletedGoals}/{archivedTotalGoals}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Melhoras registradas:</span>
                              <span className="ml-1 font-medium">{archivedPlan.improvements?.length || 0}</span>
                            </div>
                          </div>
                          
                          {archivedPlan.objectives && archivedPlan.objectives.length > 0 && (
                            <div className="mt-3">
                              <div className="text-xs text-muted-foreground mb-1">Objetivos:</div>
                              <div className="flex flex-wrap gap-1">
                                {archivedPlan.objectives.slice(0, 3).map((obj, i) => (
                                  <Badge key={i} variant="outline" className="text-xs font-normal">
                                    {obj.length > 40 ? obj.slice(0, 40) + "..." : obj}
                                  </Badge>
                                ))}
                                {archivedPlan.objectives.length > 3 && (
                                  <Badge variant="outline" className="text-xs font-normal">
                                    +{archivedPlan.objectives.length - 3} mais
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {archivedPlan.notes && (
                            <div className="mt-2 text-xs text-muted-foreground italic">
                              {archivedPlan.notes.length > 100 ? archivedPlan.notes.slice(0, 100) + "..." : archivedPlan.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
