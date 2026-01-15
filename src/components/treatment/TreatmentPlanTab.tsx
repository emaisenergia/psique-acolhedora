import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Target, TrendingUp, Award, ClipboardList, Plus, Sparkles, Loader2, CheckCircle2, Save, Edit2, ArrowUp, Activity, Calendar, RefreshCw, Archive, History, CalendarPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  useEffect(() => {
    fetchPlan();
    fetchArchivedPlans();
  }, [patientId]);

  const parseJsonArray = <T,>(val: unknown, defaultVal: T[] = []): T[] => {
    if (Array.isArray(val)) return val as T[];
    return defaultVal;
  };

  const fetchPlan = async () => {
    try {
      const { data, error } = await supabase
        .from("treatment_plans")
        .select("*")
        .eq("patient_id", patientId)
        .eq("status", "active")
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setPlan({
          ...data,
          objectives: parseJsonArray<string>(data.objectives).map(String),
          discharge_objectives: parseJsonArray<string>(data.discharge_objectives).map(String),
          short_term_goals: parseJsonArray<string>(data.short_term_goals).map(String),
          long_term_goals: parseJsonArray<string>(data.long_term_goals).map(String),
          approaches: data.approaches || [],
          goal_results: parseJsonArray<GoalResult>(data.goal_results),
          improvements: parseJsonArray<Improvement>(data.improvements),
          current_status: data.current_status || "em_andamento",
          current_status_notes: data.current_status_notes,
          last_review_date: data.last_review_date,
          next_review_date: data.next_review_date,
        });
      }
    } catch (error) {
      console.error("Error fetching treatment plan:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArchivedPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("treatment_plans")
        .select("*")
        .eq("patient_id", patientId)
        .eq("status", "archived")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      if (data) {
        setArchivedPlans(data.map(d => ({
          ...d,
          objectives: parseJsonArray<string>(d.objectives).map(String),
          discharge_objectives: parseJsonArray<string>(d.discharge_objectives).map(String),
          short_term_goals: parseJsonArray<string>(d.short_term_goals).map(String),
          long_term_goals: parseJsonArray<string>(d.long_term_goals).map(String),
          approaches: d.approaches || [],
          goal_results: parseJsonArray<GoalResult>(d.goal_results),
          improvements: parseJsonArray<Improvement>(d.improvements),
          current_status: d.current_status || "em_andamento",
          current_status_notes: d.current_status_notes,
          last_review_date: d.last_review_date,
          next_review_date: d.next_review_date,
        })));
      }
    } catch (error) {
      console.error("Error fetching archived plans:", error);
    }
  };

  const archiveCurrentPlan = async () => {
    if (!plan) return;
    
    try {
      const { error } = await supabase
        .from("treatment_plans")
        .update({ status: "archived" })
        .eq("id", plan.id);
      if (error) throw error;
      
      setPlan(null);
      setArchiveConfirmOpen(false);
      await fetchArchivedPlans();
      toast.success("Plano arquivado! Você pode criar um novo plano.");
    } catch (error) {
      console.error("Error archiving plan:", error);
      toast.error("Erro ao arquivar plano");
    }
  };

  const createNewPlan = () => {
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
    setEditDialogOpen(true);
  };

  const generateWithAI = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-treatment-plan", {
        body: {
          patientName,
          age: patientAge,
          mainComplaint: patientNotes,
          sessionHistory: sessionsCompleted > 0 ? `${sessionsCompleted} sessões realizadas` : null,
          journalNotes,
        },
      });

      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        return;
      }

      const aiPlan = data.plan;
      
      const planData = {
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
      };

      if (plan) {
        const { error: updateError } = await supabase
          .from("treatment_plans")
          .update(planData)
          .eq("id", plan.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("treatment_plans")
          .insert(planData);
        if (insertError) throw insertError;
      }

      await fetchPlan();
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

  const savePlan = async () => {
    setSaving(true);
    try {
      const planData = {
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
      };

      if (plan) {
        const { error } = await supabase
          .from("treatment_plans")
          .update(planData)
          .eq("id", plan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("treatment_plans")
          .insert(planData);
        if (error) throw error;
      }

      await fetchPlan();
      setEditDialogOpen(false);
      toast.success("Plano de tratamento salvo!");
    } catch (error) {
      console.error("Error saving treatment plan:", error);
      toast.error("Erro ao salvar plano de tratamento");
    } finally {
      setSaving(false);
    }
  };

  const toggleGoalCompletion = async (goalType: "short_term" | "long_term", index: number) => {
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

    try {
      const { error } = await supabase
        .from("treatment_plans")
        .update({ goal_results: JSON.parse(JSON.stringify(newResults)) })
        .eq("id", plan.id);
      if (error) throw error;
      setPlan({ ...plan, goal_results: newResults });
    } catch (error) {
      console.error("Error updating goal:", error);
    }
  };

  const updateGoalResult = async (goal: string, result: string) => {
    if (!plan) return;
    
    const existingResult = plan.goal_results.find(r => r.goal === goal);
    let newResults: GoalResult[];
    if (existingResult) {
      newResults = plan.goal_results.map(r => r.goal === goal ? { ...r, result } : r);
    } else {
      newResults = [...plan.goal_results, { goal, completed: false, result }];
    }

    try {
      const { error } = await supabase
        .from("treatment_plans")
        .update({ goal_results: JSON.parse(JSON.stringify(newResults)) })
        .eq("id", plan.id);
      if (error) throw error;
      setPlan({ ...plan, goal_results: newResults });
      toast.success("Resultado atualizado!");
    } catch (error) {
      console.error("Error updating result:", error);
    }
  };

  const addGoal = async () => {
    if (!plan || !newGoal.text.trim()) return;
    
    const field = newGoal.type === "short_term" ? "short_term_goals" : "long_term_goals";
    const currentGoals = newGoal.type === "short_term" ? plan.short_term_goals : plan.long_term_goals;
    const updatedGoals = [...currentGoals, newGoal.text.trim()];

    try {
      const { error } = await supabase
        .from("treatment_plans")
        .update({ [field]: updatedGoals })
        .eq("id", plan.id);
      if (error) throw error;
      
      setPlan({ ...plan, [field]: updatedGoals });
      setNewGoal({ type: "short_term", text: "" });
      setAddGoalDialogOpen(false);
      toast.success("Meta adicionada!");
    } catch (error) {
      console.error("Error adding goal:", error);
      toast.error("Erro ao adicionar meta");
    }
  };

  const addImprovement = async () => {
    if (!plan || !newImprovement.description.trim()) return;
    
    const improvement: Improvement = {
      id: crypto.randomUUID(),
      description: newImprovement.description.trim(),
      date: new Date().toISOString(),
      category: newImprovement.category,
    };

    const updatedImprovements = [...plan.improvements, improvement];

    try {
      const { error } = await supabase
        .from("treatment_plans")
        .update({ improvements: JSON.parse(JSON.stringify(updatedImprovements)) })
        .eq("id", plan.id);
      if (error) throw error;
      
      setPlan({ ...plan, improvements: updatedImprovements });
      setNewImprovement({ description: "", category: "Sintomas" });
      setAddImprovementDialogOpen(false);
      toast.success("Melhora registrada!");
    } catch (error) {
      console.error("Error adding improvement:", error);
      toast.error("Erro ao registrar melhora");
    }
  };

  const updateStatus = async () => {
    if (!plan) return;
    
    try {
      const { error } = await supabase
        .from("treatment_plans")
        .update({
          current_status: statusForm.status,
          current_status_notes: statusForm.notes || null,
          last_review_date: new Date().toISOString().split("T")[0],
        })
        .eq("id", plan.id);
      if (error) throw error;
      
      setPlan({
        ...plan,
        current_status: statusForm.status,
        current_status_notes: statusForm.notes || null,
        last_review_date: new Date().toISOString().split("T")[0],
      });
      setStatusDialogOpen(false);
      toast.success("Status atualizado!");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const getGoalResult = (goal: string) => plan?.goal_results.find(r => r.goal === goal);
  const isGoalCompleted = (goal: string) => getGoalResult(goal)?.completed || false;
  
  const completedGoalsCount = plan ? 
    [...plan.short_term_goals, ...plan.long_term_goals].filter(g => isGoalCompleted(g)).length : 0;
  const totalGoalsCount = plan ? plan.short_term_goals.length + plan.long_term_goals.length : 0;
  const goalsProgress = totalGoalsCount > 0 ? Math.round((completedGoalsCount / totalGoalsCount) * 100) : 0;

  const currentStatusOption = STATUS_OPTIONS.find(s => s.value === plan?.current_status) || STATUS_OPTIONS[0];

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
                  {onAddSession && (
                    <Button variant="outline" size="sm" className="rounded-full" onClick={onAddSession}>
                      <CalendarPlus className="w-4 h-4 mr-2" />
                      Adicionar Sessão
                    </Button>
                  )}
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
                  <Button size="sm" className="rounded-full" onClick={openEditDialog}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    {plan ? "Editar Plano" : "Criar Plano"}
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
                    </>
                  )}
                </div>
              </div>

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
