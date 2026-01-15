import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Target, TrendingUp, Award, ClipboardList, Plus, Sparkles, Loader2, CalendarDays, CheckCircle2, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
}

interface TreatmentPlanTabProps {
  patientId: string;
  patientName: string;
  patientAge?: number | null;
  patientNotes?: string | null;
  sessionsCompleted: number;
  journalNotes?: string;
}

export function TreatmentPlanTab({
  patientId,
  patientName,
  patientAge,
  patientNotes,
  sessionsCompleted,
  journalNotes,
}: TreatmentPlanTabProps) {
  const [plan, setPlan] = useState<TreatmentPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    start_date: "",
    estimated_sessions: 12,
    objectives: "",
    discharge_objectives: "",
    short_term_goals: "",
    long_term_goals: "",
    approaches: "",
    notes: "",
  });

  useEffect(() => {
    fetchPlan();
  }, [patientId]);

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
        const parseJsonArray = (val: unknown): string[] => {
          if (Array.isArray(val)) return val.map(String);
          return [];
        };
        setPlan({
          ...data,
          objectives: parseJsonArray(data.objectives),
          discharge_objectives: parseJsonArray(data.discharge_objectives),
          short_term_goals: parseJsonArray(data.short_term_goals),
          long_term_goals: parseJsonArray(data.long_term_goals),
          approaches: data.approaches || [],
        });
      }
    } catch (error) {
      console.error("Error fetching treatment plan:", error);
    } finally {
      setLoading(false);
    }
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
      
      // Create or update the plan
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

  const updateProgress = async (newProgress: number) => {
    if (!plan) return;
    try {
      const { error } = await supabase
        .from("treatment_plans")
        .update({ current_progress: newProgress })
        .eq("id", plan.id);
      if (error) throw error;
      setPlan({ ...plan, current_progress: newProgress });
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  const progressPercent = plan 
    ? Math.min(100, Math.round((sessionsCompleted / plan.estimated_sessions) * 100))
    : 0;

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
        <Card className="card-glass">
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-lg font-semibold text-foreground">Plano de Tratamento</div>
                <div className="text-sm text-muted-foreground">
                  Defina objetivos, metas e acompanhe o progresso do paciente.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={generateWithAI}
                  disabled={generating}
                >
                  {generating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  {generating ? "Gerando..." : "Gerar com IA"}
                </Button>
                <Button size="sm" className="rounded-full" onClick={openEditDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  {plan ? "Editar Plano" : "Criar Plano"}
                </Button>
              </div>
            </div>

            {/* Progress Section */}
            <div className="rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 to-primary/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-medium text-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Progresso do Tratamento
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {sessionsCompleted} de {plan?.estimated_sessions || 12} sessões estimadas
                  </div>
                </div>
                <div className="text-2xl font-bold text-primary">{progressPercent}%</div>
              </div>
              <Progress value={progressPercent} className="h-3" />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Início: {plan?.start_date ? new Date(plan.start_date).toLocaleDateString("pt-BR") : "Não definido"}</span>
                <span>Sessões estimadas: {plan?.estimated_sessions || 12}</span>
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
                Objetivos para Alta
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

            {/* Short Term Goals */}
            <div className="rounded-xl border border-border/60 bg-background/60 p-4">
              <div className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Metas de Curto Prazo
              </div>
              {plan?.short_term_goals && plan.short_term_goals.length > 0 ? (
                <div className="space-y-2">
                  {plan.short_term_goals.map((goal, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-blue-50">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                      <div className="text-sm text-muted-foreground">{goal}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground p-4 rounded-lg border border-dashed border-border/70 bg-white/50">
                  Metas para as próximas 4-8 sessões.
                </div>
              )}
            </div>

            {/* Long Term Goals */}
            <div className="rounded-xl border border-border/60 bg-background/60 p-4">
              <div className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" />
                Metas de Longo Prazo
              </div>
              {plan?.long_term_goals && plan.long_term_goals.length > 0 ? (
                <div className="space-y-2">
                  {plan.long_term_goals.map((goal, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50">
                      <Award className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-muted-foreground">{goal}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground p-4 rounded-lg border border-dashed border-border/70 bg-white/50">
                  Resultados esperados ao longo do processo terapêutico.
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

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="bg-white/90 border border-border/60">
            <CardContent className="p-6 space-y-4">
              <div className="text-sm font-medium text-muted-foreground">Resumo do Plano</div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <span className="text-sm text-muted-foreground">Data de início</span>
                  <span className="text-sm font-medium">
                    {plan?.start_date ? new Date(plan.start_date).toLocaleDateString("pt-BR") : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <span className="text-sm text-muted-foreground">Sessões estimadas</span>
                  <span className="text-sm font-medium">{plan?.estimated_sessions || 12}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <span className="text-sm text-muted-foreground">Sessões realizadas</span>
                  <span className="text-sm font-medium">{sessionsCompleted}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <span className="text-sm text-muted-foreground">Progresso</span>
                  <Badge className="bg-primary/10 text-primary">{progressPercent}%</Badge>
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
                <li>Alinhe metas com a demanda inicial do paciente.</li>
                <li>Use o prontuário para documentar progressos.</li>
                <li>Compartilhe conquistas com o paciente.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{plan ? "Editar Plano de Tratamento" : "Novo Plano de Tratamento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data de Início</Label>
                <Input
                  type="date"
                  value={editForm.start_date}
                  onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Sessões Estimadas</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={editForm.estimated_sessions}
                  onChange={(e) => setEditForm({ ...editForm, estimated_sessions: parseInt(e.target.value) || 12 })}
                />
              </div>
            </div>
            <div>
              <Label>Objetivos Terapêuticos (um por linha)</Label>
              <Textarea
                rows={4}
                value={editForm.objectives}
                onChange={(e) => setEditForm({ ...editForm, objectives: e.target.value })}
                placeholder="Reduzir sintomas de ansiedade&#10;Desenvolver estratégias de enfrentamento&#10;Melhorar qualidade do sono"
              />
            </div>
            <div>
              <Label>Objetivos para Alta (um por linha)</Label>
              <Textarea
                rows={3}
                value={editForm.discharge_objectives}
                onChange={(e) => setEditForm({ ...editForm, discharge_objectives: e.target.value })}
                placeholder="Autonomia no manejo da ansiedade&#10;Manutenção de rotina de autocuidado"
              />
            </div>
            <div>
              <Label>Metas de Curto Prazo (um por linha)</Label>
              <Textarea
                rows={3}
                value={editForm.short_term_goals}
                onChange={(e) => setEditForm({ ...editForm, short_term_goals: e.target.value })}
                placeholder="Iniciar técnicas de respiração diafragmática&#10;Registro diário de pensamentos"
              />
            </div>
            <div>
              <Label>Metas de Longo Prazo (um por linha)</Label>
              <Textarea
                rows={3}
                value={editForm.long_term_goals}
                onChange={(e) => setEditForm({ ...editForm, long_term_goals: e.target.value })}
                placeholder="Retomar atividades sociais evitadas&#10;Consolidar padrão de sono saudável"
              />
            </div>
            <div>
              <Label>Abordagens Terapêuticas (separadas por vírgula)</Label>
              <Input
                value={editForm.approaches}
                onChange={(e) => setEditForm({ ...editForm, approaches: e.target.value })}
                placeholder="TCC, Mindfulness, ACT"
              />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                rows={2}
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Notas adicionais sobre o plano..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={savePlan} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
