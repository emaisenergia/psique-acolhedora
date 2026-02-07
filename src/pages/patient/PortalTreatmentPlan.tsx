import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { usePatientAuth } from "@/context/PatientAuth";
import { useTreatmentPlan } from "@/hooks/useTreatmentPlan";
import PortalLayout from "@/components/patient/PortalLayout";
import {
  Target,
  TrendingUp,
  CheckCircle2,
  Clock,
  ClipboardList,
  Award,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const STATUS_OPTIONS = [
  { value: "em_andamento", label: "Em Andamento", color: "bg-blue-100 text-blue-700" },
  { value: "progredindo", label: "Progredindo Bem", color: "bg-emerald-100 text-emerald-700" },
  { value: "estagnado", label: "Estagnado", color: "bg-amber-100 text-amber-700" },
  { value: "dificuldades", label: "Com Dificuldades", color: "bg-rose-100 text-rose-700" },
  { value: "proximo_alta", label: "Próximo da Alta", color: "bg-purple-100 text-purple-700" },
  { value: "concluido", label: "Concluído", color: "bg-slate-100 text-slate-700" },
];

const PortalTreatmentPlan = () => {
  const { patient, isLoading } = usePatientAuth();

  const { plan, loading, archivedPlans } = useTreatmentPlan(patient?.id || "");

  const completedGoalsCount = useMemo(() => {
    if (!plan) return 0;
    return [...plan.short_term_goals, ...plan.long_term_goals].filter(
      (g) => plan.goal_results.find((r) => r.goal === g)?.completed
    ).length;
  }, [plan]);

  const totalGoalsCount = useMemo(() => {
    if (!plan) return 0;
    return plan.short_term_goals.length + plan.long_term_goals.length;
  }, [plan]);

  const goalsProgress = totalGoalsCount > 0 ? Math.round((completedGoalsCount / totalGoalsCount) * 100) : 0;

  const currentStatusOption = STATUS_OPTIONS.find((s) => s.value === plan?.current_status) || STATUS_OPTIONS[0];

  const evolutionData = useMemo(() => {
    if (!plan) return [];
    const data: { date: string; melhoras: number; metasConcluidas: number; label: string }[] = [];
    const improvementsByMonth: Record<string, number> = {};
    plan.improvements.forEach((imp) => {
      const month = new Date(imp.date).toISOString().slice(0, 7);
      improvementsByMonth[month] = (improvementsByMonth[month] || 0) + 1;
    });
    const goalsByMonth: Record<string, number> = {};
    plan.goal_results
      .filter((r) => r.completed && r.completedAt)
      .forEach((r) => {
        const month = new Date(r.completedAt!).toISOString().slice(0, 7);
        goalsByMonth[month] = (goalsByMonth[month] || 0) + 1;
      });
    const allMonths = new Set([...Object.keys(improvementsByMonth), ...Object.keys(goalsByMonth)]);
    if (plan.start_date) allMonths.add(plan.start_date.slice(0, 7));
    const sortedMonths = Array.from(allMonths).sort();
    let cumulativeImprovements = 0;
    let cumulativeGoals = 0;
    sortedMonths.forEach((month) => {
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

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PortalLayout>
      <div className="mt-8">
        {!plan ? (
          <Card className="card-glass">
            <CardContent className="p-8 text-center">
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <div className="text-lg font-semibold">Plano de tratamento em desenvolvimento</div>
              <div className="text-sm text-muted-foreground mt-2">
                Seu psicólogo ainda está preparando o plano de tratamento ou decidiu não compartilhá-lo neste momento. 
                Assim que estiver disponível, você poderá acompanhar seus objetivos e evolução aqui.
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-[2fr,1fr] gap-6 items-start">
            <div className="space-y-6">
              <Card className="card-glass">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-semibold">Seu Plano de Tratamento</div>
                      <div className="text-sm text-muted-foreground">
                        Acompanhe seus objetivos e progresso no tratamento
                      </div>
                    </div>
                    <Badge className={currentStatusOption.color}>{currentStatusOption.label}</Badge>
                  </div>

                  {/* Progress Overview */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-primary mb-2">
                        <TrendingUp className="w-4 h-4" /> Progresso das Metas
                      </div>
                      <Progress value={goalsProgress} className="h-3 bg-primary/10" />
                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span>
                          {completedGoalsCount} de {totalGoalsCount} concluídas
                        </span>
                        <span className="font-semibold text-primary">{goalsProgress}%</span>
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-card p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                        <Clock className="w-4 h-4" /> Sessões Estimadas
                      </div>
                      <div className="text-2xl font-bold text-foreground">{plan.estimated_sessions}</div>
                      {plan.start_date && (
                        <div className="text-xs text-muted-foreground">
                          Início: {new Date(plan.start_date).toLocaleDateString("pt-BR")}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Objectives */}
                  {plan.objectives.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <ClipboardList className="w-4 h-4" /> Objetivos do Tratamento
                      </div>
                      <div className="space-y-2">
                        {plan.objectives.map((obj, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-border/60 bg-card">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-xs font-semibold text-primary">{idx + 1}</span>
                            </div>
                            <div className="text-sm text-foreground">{obj}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Short-term Goals */}
                  {plan.short_term_goals.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4" /> Metas de Curto Prazo
                      </div>
                      <div className="space-y-2">
                        {plan.short_term_goals.map((goal, idx) => {
                          const result = plan.goal_results.find((r) => r.goal === goal);
                          return (
                            <div
                              key={idx}
                              className={`flex items-start gap-3 p-3 rounded-lg border ${
                                result?.completed
                                  ? "border-emerald-200 bg-emerald-50"
                                  : "border-border/60 bg-card"
                              }`}
                            >
                              {result?.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1">
                                <div
                                  className={`text-sm ${
                                    result?.completed ? "text-emerald-700" : "text-foreground"
                                  }`}
                                >
                                  {goal}
                                </div>
                                {result?.result && (
                                  <div className="text-xs text-muted-foreground mt-1">Obs: {result.result}</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Long-term Goals */}
                  {plan.long_term_goals.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <Award className="w-4 h-4" /> Metas de Longo Prazo
                      </div>
                      <div className="space-y-2">
                        {plan.long_term_goals.map((goal, idx) => {
                          const result = plan.goal_results.find((r) => r.goal === goal);
                          return (
                            <div
                              key={idx}
                              className={`flex items-start gap-3 p-3 rounded-lg border ${
                                result?.completed
                                  ? "border-emerald-200 bg-emerald-50"
                                  : "border-border/60 bg-card"
                              }`}
                            >
                              {result?.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1">
                                <div
                                  className={`text-sm ${
                                    result?.completed ? "text-emerald-700" : "text-foreground"
                                  }`}
                                >
                                  {goal}
                                </div>
                                {result?.result && (
                                  <div className="text-xs text-muted-foreground mt-1">Obs: {result.result}</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Current Status Notes */}
                  {plan.current_status_notes && (
                    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                      <div className="text-sm font-medium text-primary mb-2">Observações do seu psicólogo</div>
                      <div className="text-sm text-foreground whitespace-pre-line">{plan.current_status_notes}</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Evolution Chart */}
              {evolutionData.length > 1 && (
                <Card className="card-glass">
                  <CardContent className="p-6">
                    <div className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" /> Sua Evolução ao Longo do Tempo
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={evolutionData}>
                          <defs>
                            <linearGradient id="colorMelhoras" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorMetas" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="label" fontSize={12} tick={{ fill: "#6b7280" }} />
                          <YAxis fontSize={12} tick={{ fill: "#6b7280" }} allowDecimals={false} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#fff",
                              border: "1px solid #e5e7eb",
                              borderRadius: "8px",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="melhoras"
                            stroke="#10b981"
                            fillOpacity={1}
                            fill="url(#colorMelhoras)"
                            name="Melhoras registradas"
                          />
                          <Area
                            type="monotone"
                            dataKey="metasConcluidas"
                            stroke="#7c3aed"
                            fillOpacity={1}
                            fill="url(#colorMetas)"
                            name="Metas concluídas"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <Card className="bg-card/90 border border-border/60">
              <CardContent className="p-6 space-y-4">
                <div className="text-sm font-medium text-muted-foreground">Resumo</div>

                <div className="rounded-xl border border-border/60 bg-card p-4">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Abordagens</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {plan.approaches.length > 0 ? (
                      plan.approaches.map((app, idx) => (
                        <Badge key={idx} variant="outline" className="bg-primary/5 text-primary">
                          {app}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">Não definidas</span>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-card p-4">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Melhoras Registradas</div>
                  <div className="mt-2 text-2xl font-bold text-emerald-600">{plan.improvements.length}</div>
                  <div className="text-xs text-muted-foreground">ao longo do tratamento</div>
                </div>

                {plan.improvements.length > 0 && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-2">Últimas Melhoras</div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {plan.improvements.slice(-3).reverse().map((imp) => (
                        <div key={imp.id} className="text-sm text-emerald-800">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3" />
                            <span className="font-medium">{imp.category}</span>
                          </div>
                          <div className="ml-5 text-xs text-emerald-600">{imp.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {plan.discharge_objectives.length > 0 && (
                  <div className="rounded-xl border border-border/60 bg-card p-4">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Critérios para Alta
                    </div>
                    <div className="space-y-1">
                      {plan.discharge_objectives.map((obj, idx) => (
                        <div key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {obj}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {plan.notes && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="text-xs font-medium text-amber-700 uppercase tracking-wide">Notas</div>
                    <div className="mt-2 text-sm text-amber-800 whitespace-pre-line">{plan.notes}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <div className="h-16" />
    </PortalLayout>
  );
};

export default PortalTreatmentPlan;
