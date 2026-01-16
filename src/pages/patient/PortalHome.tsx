import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, FileText, MessageSquare, LogOut, CheckCircle2, Shield, ShieldCheck, TrendingUp, Target, UserCircle, PhoneCall, MessageCircle, BookOpen, BadgeCheck, ClipboardList, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { usePatientAuth } from "@/context/PatientAuth";
import { usePatientAppointments, usePatientActivities } from "@/hooks/usePatientData";
import { useNavigate } from "react-router-dom";
import { useTreatmentPlan } from "@/hooks/useTreatmentPlan";
import { Progress } from "@/components/ui/progress";

const PortalHome = () => {
  const { logout, patient, isLoading } = usePatientAuth();
  const navigate = useNavigate();
  const { appointments } = usePatientAppointments();
  const { activities } = usePatientActivities();
  const { plan, loading: planLoading } = useTreatmentPlan(patient?.id || "");

  const myAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => 
      new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
    );
  }, [appointments]);

  type QuickAction = {
    icon: LucideIcon;
    title: string;
    desc: string;
    onSelect: () => void;
  };

  const quickActions: QuickAction[] = [
    {
      icon: Calendar,
      title: "Agendar Sessão",
      desc: "Reserve sua próxima consulta",
      onSelect: () => navigate("/portal/sessoes"),
    },
    {
      icon: MessageSquare,
      title: "Mensagem Segura",
      desc: "Comunique-se com seu psicólogo",
      onSelect: () => navigate("/portal/mensagens"),
    },
    {
      icon: BookOpen,
      title: "Exercícios",
      desc: "Complete suas atividades",
      onSelect: () => navigate("/portal/atividades"),
    },
    {
      icon: FileText,
      title: "Recursos",
      desc: "Explore conteúdo educativo",
      onSelect: () => navigate("/blog"),
    },
  ];

  // KPIs
  const now = new Date();
  const nextAppointment = useMemo(() => myAppointments.find((a) => {
    const dt = new Date(a.date_time);
    return a.status !== 'cancelled' && dt.getTime() >= Date.now();
  }) || null, [myAppointments]);

  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthAppts = useMemo(() => myAppointments.filter((a) => a.date_time.startsWith(monthKey)), [myAppointments, monthKey]);
  const progressPct = useMemo(() => {
    const total = monthAppts.length || 1;
    const done = monthAppts.filter((a) => a.status === 'done').length;
    return Math.round((done / total) * 100);
  }, [monthAppts]);

  const pendingActivities = useMemo(() => 
    activities.filter(a => a.status === 'pending').length, 
  [activities]);
  const completedActivities = useMemo(() => 
    activities.filter(a => a.status === 'completed').length, 
  [activities]);

  const formatDateTime = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long' }).format(d) + `, ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen section-gradient relative overflow-hidden">
      <div className="absolute -left-24 top-56 w-56 h-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -right-10 top-80 w-24 h-24 rounded-full bg-primary/10 blur-2xl" />

      {/* Top bar */}
      <div className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-border/60">
        <div className="container mx-auto px-4 max-w-6xl py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Equanimité Psychology</div>
                <div className="text-lg font-semibold">Portal do Paciente</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <UserCircle className="w-5 h-5 text-primary" />
                </div>
                <span>{patient?.name || 'Paciente'}</span>
              </div>
              <Button variant="outline" className="btn-outline-futuristic inline-flex items-center gap-2" onClick={() => { logout(); navigate('/portal'); }}>
                <LogOut className="w-4 h-4" /> Sair
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Tabs */}
        <div className="mt-4 border-b border-border/60">
          <div className="flex items-center gap-4 overflow-x-auto pb-3">
            <button className="px-4 py-2 rounded-full text-sm border inline-flex items-center gap-2 bg-primary/20 border-primary/50 text-foreground">
              <Shield className="w-4 h-4" /> Visão Geral
            </button>
            <button onClick={() => navigate('/portal/sessoes')} className="px-4 py-2 rounded-full text-sm border inline-flex items-center gap-2 bg-transparent text-muted-foreground border-border">
              <Calendar className="w-4 h-4" /> Sessões
            </button>
            <button onClick={() => navigate('/portal/atividades')} className="px-4 py-2 rounded-full text-sm border inline-flex items-center gap-2 bg-transparent text-muted-foreground border-border">
              <BookOpen className="w-4 h-4" /> Atividades
            </button>
            <button onClick={() => navigate('/portal/anotacoes')} className="px-4 py-2 rounded-full text-sm border inline-flex items-center gap-2 bg-transparent text-muted-foreground border-border">
              <FileText className="w-4 h-4" /> Anotações
            </button>
            <button onClick={() => navigate('/portal/mensagens')} className="px-4 py-2 rounded-full text-sm border inline-flex items-center gap-2 bg-transparent text-muted-foreground border-border">
              <MessageSquare className="w-4 h-4" /> Mensagens
            </button>
            <button onClick={() => navigate('/portal/plano')} className="px-4 py-2 rounded-full text-sm border inline-flex items-center gap-2 bg-transparent text-muted-foreground border-border">
              <ClipboardList className="w-4 h-4" /> Plano
            </button>
          </div>
        </div>

        {/* Welcome Card */}
        <div className="mt-6">
          <Card className="bg-white/95 border border-border/60 shadow-card rounded-2xl">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <UserCircle className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="text-3xl md:text-4xl font-display font-light">Olá, {patient?.name?.split(' ')[0] || 'Paciente'}!</h2>
                    <p className="text-muted-foreground">Bem-vindo(a) ao seu espaço pessoal de bem-estar</p>
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary" /> Conta ativa
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" className="rounded-full border-amber-300 text-foreground bg-white shadow-sm">
                    <ShieldCheck className="w-4 h-4 mr-2" /> Dados Protegidos
                  </Button>
                  <Button variant="outline" className="rounded-full border-amber-300 text-foreground bg-white shadow-sm">
                    <BadgeCheck className="w-4 h-4 mr-2" /> LGPD
                  </Button>
                </div>
              </div>

              {/* Info row */}
              <div className="mt-6 grid md:grid-cols-3 gap-4">
                <div className="border rounded-xl p-4 bg-white">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 text-primary" /> Próxima Sessão
                  </div>
                  <div className="mt-1 font-medium">
                    {nextAppointment ? formatDateTime(nextAppointment.date_time) : 'Nenhuma agendada'}
                  </div>
                </div>
                <div className="border rounded-xl p-4 bg-white">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="w-4 h-4 text-primary" /> Progresso
                  </div>
                  <div className="mt-1 font-medium">{progressPct}% este mês</div>
                </div>
                <div className="border rounded-xl p-4 bg-white">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Target className="w-4 h-4 text-primary" /> Atividades
                  </div>
                  <div className="mt-1 font-medium">{completedActivities} concluídas, {pendingActivities} pendentes</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Plano de Tratamento - Visual Summary */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-display font-light flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Plano de Tratamento
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/portal/plano")}
              className="text-primary hover:text-primary/80"
            >
              Ver Detalhes <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {planLoading ? (
            <Card className="bg-white/95 border border-border/60 rounded-2xl">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-8 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ) : plan ? (
            <Card className="bg-white/95 border border-border/60 rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Progress Section */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progresso Geral</span>
                        <span className="font-semibold text-primary">{plan.current_progress}%</span>
                      </div>
                      <Progress value={plan.current_progress} className="h-3" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="border rounded-lg p-3 bg-muted/30">
                        <div className="text-xs text-muted-foreground">Sessões Previstas</div>
                        <div className="text-lg font-semibold">{plan.estimated_sessions}</div>
                      </div>
                      <div className="border rounded-lg p-3 bg-muted/30">
                        <div className="text-xs text-muted-foreground">Metas Concluídas</div>
                        <div className="text-lg font-semibold text-primary">
                          {plan.goal_results.filter(g => g.completed).length}/{plan.short_term_goals.length + plan.long_term_goals.length}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Goals Preview */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-muted-foreground">Próximas Metas</div>
                    <div className="space-y-2">
                      {[...plan.short_term_goals, ...plan.long_term_goals]
                        .filter(goal => !plan.goal_results.find(gr => gr.goal === goal && gr.completed))
                        .slice(0, 3)
                        .map((goal, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 rounded-full bg-primary/60"></div>
                            <span className="line-clamp-1">{goal}</span>
                          </div>
                        ))}
                      {plan.short_term_goals.length + plan.long_term_goals.length === 0 && (
                        <div className="text-sm text-muted-foreground italic">
                          Nenhuma meta definida ainda
                        </div>
                      )}
                    </div>
                    
                    {plan.improvements.length > 0 && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-2 text-xs text-primary">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{plan.improvements.length} melhora(s) registrada(s)</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white/95 border border-border/60 rounded-2xl">
              <CardContent className="p-6 text-center">
                <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Nenhum plano de tratamento disponível</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Seu psicólogo irá compartilhar o plano de tratamento quando estiver pronto.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Ações Rápidas */}
        <div className="mt-10">
          <h3 className="text-xl font-display font-light mb-4">Ações Rápidas</h3>
          <div className="grid md:grid-cols-4 gap-4">
            {quickActions.map((qa) => (
              <Card
                key={qa.title}
                role="button"
                tabIndex={0}
                onClick={qa.onSelect}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    qa.onSelect();
                  }
                }}
                className="bg-white/90 border border-border/60 rounded-2xl hover:shadow-soft transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-3 shadow-card border border-border/50">
                    <qa.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="font-medium">{qa.title}</div>
                  <div className="text-xs text-muted-foreground">{qa.desc}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Emergency banner */}
        <div className="mt-10 mb-8">
          <div className="rounded-2xl p-6 md:p-8 bg-gradient-primary text-primary-foreground flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-lg font-semibold">Emergência ou Crise?</div>
              <div className="text-sm opacity-90">Se você está passando por uma crise, não hesite em buscar ajuda imediata.</div>
            </div>
            <div className="flex items-center gap-3">
              <a href="tel:188" className="inline-flex">
                <Button variant="outline" className="rounded-full inline-flex items-center gap-2 border-white/60 text-white bg-white/10 hover:bg-white/20">
                  <PhoneCall className="w-4 h-4" /> CVV: 188
                </Button>
              </a>
              <a href="https://www.cvv.org.br/chat/" target="_blank" rel="noreferrer" className="inline-flex">
                <Button variant="outline" className="rounded-full inline-flex items-center gap-2 border-white/60 text-white bg-white/10 hover:bg-white/20">
                  <MessageCircle className="w-4 h-4" /> Chat de Emergência
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortalHome;
