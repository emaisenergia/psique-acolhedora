import AdminLayout from "./AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Users,
  CalendarDays,
  Wallet,
  CheckCircle2,
  Plus,
  UserPlus,
  Cake,
  TrendingUp,
  FileText,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { useAdminAuth } from "@/context/AdminAuth";
import PackageAlerts from "@/components/alerts/PackageAlerts";
import { usePatients } from "@/hooks/usePatients";
import { useAppointments } from "@/hooks/useAppointments";
import { AppointmentMetricsCard } from "@/components/dashboard/AppointmentMetricsCard";
import { OccupancyMetricsCard } from "@/components/dashboard/OccupancyMetricsCard";
import { addMonths, format, startOfMonth, addDays, parseISO, getMonth, getDate } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Stat = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) => (
  <Card className="card-glass">
    <CardContent className="p-6 flex items-center gap-4">
      <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
        <Icon className="w-6 h-6 text-primary-foreground" />
      </div>
      <div>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="text-2xl font-semibold">{value}</div>
      </div>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user } = useAdminAuth();
  const { patients } = usePatients();
  const { appointments } = useAppointments();
  const navigate = useNavigate();

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const todayKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const monthPrefix = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  const previousMonth = addMonths(startOfMonth(now), -1);
  const previousMonthPrefix = format(previousMonth, "yyyy-MM");

  const dayAppts = useMemo(
    () =>
      appointments
        .filter((a) => (a.date_time || "").startsWith(todayKey))
        .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime()),
    [appointments, todayKey]
  );

  const monthAppts = useMemo(() => appointments.filter((a) => (a.date_time || "").startsWith(monthPrefix)), [appointments, monthPrefix]);

  const patientMap = useMemo(() => Object.fromEntries(patients.map((p) => [p.id, p.name])), [patients]);

  // KPIs
  const sessoesHoje = dayAppts.filter((a) => a.status !== "cancelled").length;
  const pacientesAtivos = new Set(monthAppts.filter((a) => a.status !== "cancelled").map((a) => a.patient_id)).size;
  const receitaMensal = monthAppts
    .filter((a) => a.status !== "cancelled")
    .reduce((s, a) => s + (a.payment_value || 0), 0);
  const sessoesConcluidas = monthAppts.filter((a) => a.status === "done").length;

  const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const receitaDia = dayAppts
    .filter((a) => a.status !== "cancelled")
    .reduce((s, a) => s + (a.payment_value || 0), 0);
  const pendenteDia = dayAppts
    .filter((a) => a.status !== "cancelled" && a.status !== "done")
    .reduce((s, a) => s + (a.payment_value || 0), 0);
  const canceladoValorDia = dayAppts
    .filter((a) => a.status === "cancelled")
    .reduce((s, a) => s + (a.payment_value || 0), 0);

  // Financeiro mensal
  const faturadoMes = receitaMensal;
  const pendenteMes = monthAppts
    .filter((a) => a.status !== "cancelled" && a.status !== "done")
    .reduce((s, a) => s + (a.payment_value || 0), 0);
  const canceladoMes = monthAppts
    .filter((a) => a.status === "cancelled")
    .reduce((s, a) => s + (a.payment_value || 0), 0);
  const previsaoTotal = faturadoMes + pendenteMes; // sessões não canceladas
  const sessoesPagasMes = monthAppts.filter((a) => a.status === "done").length;
  const valorMedio = sessoesPagasMes ? faturadoMes / sessoesPagasMes : 0;

  // Próximos aniversariantes (próximos 14 dias)
  const upcomingBirthdays = useMemo(() => {
    const today = new Date();
    const in14Days = addDays(today, 14);
    
    return patients
      .filter(p => p.birth_date && p.status === 'active')
      .map(p => {
        const birthDate = parseISO(p.birth_date!);
        const thisYearBday = new Date(today.getFullYear(), getMonth(birthDate), getDate(birthDate));
        
        // Se o aniversário deste ano já passou, considera o próximo ano
        if (thisYearBday < today) {
          thisYearBday.setFullYear(today.getFullYear() + 1);
        }
        
        return { ...p, nextBirthday: thisYearBday };
      })
      .filter(p => p.nextBirthday >= today && p.nextBirthday <= in14Days)
      .sort((a, b) => a.nextBirthday.getTime() - b.nextBirthday.getTime())
      .slice(0, 5);
  }, [patients]);

  // Buscar sessões concluídas sem anotações
  const { data: sessoesPendentes = [] } = useQuery({
    queryKey: ['sessions-pending-notes'],
    queryFn: async () => {
      // Buscar agendamentos concluídos
      const agendamentosConcluidos = appointments.filter(a => a.status === 'done');
      if (agendamentosConcluidos.length === 0) return [];

      // Buscar sessões correspondentes
      const { data: sessions } = await supabase
        .from('sessions')
        .select('id, appointment_id, patient_id, detailed_notes, summary, clinical_observations')
        .in('appointment_id', agendamentosConcluidos.map(a => a.id));

      // Identificar sessões sem anotações ou agendamentos concluídos sem sessão
      const sessoesMap = new Map(sessions?.map(s => [s.appointment_id, s]) || []);
      
      const pendentes = agendamentosConcluidos.filter(appt => {
        const sessao = sessoesMap.get(appt.id);
        // Pendente se não existe sessão ou se existe mas sem anotações
        if (!sessao) return true;
        const temNotas = sessao.detailed_notes || sessao.summary || sessao.clinical_observations;
        return !temNotas;
      });

      return pendentes.map(a => {
        const sessao = sessoesMap.get(a.id);
        return {
          appointmentId: a.id,
          patientId: a.patient_id,
          patientName: patientMap[a.patient_id || ''] || 'Paciente',
          dateTime: a.date_time,
          sessionId: sessao?.id
        };
      });
    },
    enabled: appointments.length > 0
  });

  // Filtrar sessões urgentes (mais de 24h sem anotações)
  const sessoesUrgentes = useMemo(() => {
    return sessoesPendentes.filter(s => {
      const sessionTime = new Date(s.dateTime).getTime();
      const horasDecorridas = (Date.now() - sessionTime) / (1000 * 60 * 60);
      return horasDecorridas > 24;
    });
  }, [sessoesPendentes]);

  // Pop-up de notificação para sessões urgentes (>24h)
  useEffect(() => {
    if (sessoesUrgentes.length === 0) return;
    
    // Usar sessionStorage para não repetir a notificação na mesma sessão
    const notifiedKey = `prontuarios-notified-${new Date().toDateString()}`;
    if (sessionStorage.getItem(notifiedKey)) return;
    
    // Marcar como notificado
    sessionStorage.setItem(notifiedKey, 'true');
    
    // Exibir toast de alerta
    toast.warning(
      `Atenção! ${sessoesUrgentes.length} sessão(ões) estão há mais de 24h sem anotações.`,
      {
        description: `Pacientes: ${sessoesUrgentes.slice(0, 3).map(s => s.patientName).join(', ')}${sessoesUrgentes.length > 3 ? ` e mais ${sessoesUrgentes.length - 3}` : ''}`,
        action: {
          label: "Atualizar",
          onClick: () => navigate('/admin/prontuarios')
        },
        duration: 10000,
        icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
      }
    );
  }, [sessoesUrgentes, navigate]);

  return (
    <AdminLayout>
      {/* Banner de prontuários pendentes - só aparece quando há sessões concluídas sem anotações */}
      {sessoesPendentes.length > 0 && (
        <div className="mb-6">
          <Card className="card-glass border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary-foreground" />
                </div>
              <div className="flex-1">
                  <p className="text-sm font-medium">
                    {user?.name?.split(" ")[0] || "Profissional"}, você tem {sessoesPendentes.length} prontuário{sessoesPendentes.length > 1 ? 's' : ''} para atualizar
                    {sessoesUrgentes.length > 0 && (
                      <Badge variant="destructive" className="ml-2 text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {sessoesUrgentes.length} urgente{sessoesUrgentes.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </p>
                  <div className="mt-2 space-y-1">
                    {sessoesPendentes.slice(0, 5).map((s) => {
                      const isUrgent = sessoesUrgentes.some(u => u.appointmentId === s.appointmentId);
                      return (
                        <Link
                          key={s.appointmentId}
                          to={`/admin/paciente/${s.patientId}?tab=sessoes&appointment=${s.appointmentId}`}
                          className={cn(
                            "flex items-center gap-1 text-xs hover:underline transition-colors",
                            isUrgent ? "text-destructive font-medium" : "text-muted-foreground hover:text-primary"
                          )}
                        >
                          <ChevronRight className="w-3 h-3" />
                          {s.patientName} - {format(new Date(s.dateTime), "dd/MM 'às' HH:mm")}
                          {isUrgent && <AlertTriangle className="w-3 h-3 ml-1" />}
                        </Link>
                      );
                    })}
                    {sessoesPendentes.length > 5 && (
                      <p className="text-xs text-muted-foreground pl-4">
                        e mais {sessoesPendentes.length - 5} prontuário(s)...
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <Button asChild className="btn-futuristic shrink-0">
                <Link to="/admin/prontuarios?pendentes=true">
                  <FileText className="w-4 h-4 mr-2" />
                  Ver todos
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-3xl font-display font-light">Boa noite, {user?.name || "bem-vindo"}! <span className="align-middle">🧘‍♀️💚</span></h1>
        <p className="text-muted-foreground">Você está no controle da sua rotina. Vamos começar?</p>
      </div>

      {/* KPIs */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Stat icon={CalendarDays} label="Sessões Hoje" value={sessoesHoje} />
        <Stat icon={Users} label="Pacientes Ativos" value={pacientesAtivos} />
        <Stat icon={Wallet} label="Receita Mensal" value={brl.format(receitaMensal)} />
        <Stat icon={CheckCircle2} label="Sessões Concluídas" value={sessoesConcluidas} />
      </div>

      {/* Métricas de Agendamentos */}
      <div className="mb-8">
        <AppointmentMetricsCard
          appointments={appointments}
          monthPrefix={monthPrefix}
          previousMonthPrefix={previousMonthPrefix}
        />
      </div>

      {/* Métricas de Ocupação */}
      <div className="mb-8">
        <OccupancyMetricsCard appointments={appointments} />
      </div>

      {/* Alertas de Pacotes */}
      <div className="mb-8">
        <PackageAlerts maxAlerts={5} />
      </div>

      {/* Agenda de Hoje + Pacientes Recentes */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <Card className="card-glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Agenda de Hoje</h2>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <CalendarDays className="w-4 h-4" />
                {now.toLocaleDateString()}
              </div>
            </div>
            {dayAppts.length === 0 ? (
              <div className="text-center p-8 rounded-xl border border-dashed border-border">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <CalendarDays className="w-6 h-6 text-primary" />
                </div>
                <div className="font-medium mb-1">Nenhuma sessão programada para hoje</div>
                <p className="text-sm text-muted-foreground mb-4">Que tal planejar sua agenda e agendar novas sessões?</p>
                <Button asChild className="btn-futuristic">
                  <Link to="/admin/agendamentos">
                    <Plus className="w-4 h-4" /> Agendar Nova Sessão
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {dayAppts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                    <div className="flex flex-col">
                      <span className="font-medium">{patientMap[a.patient_id] || "Paciente"}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(a.date_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {a.service ? ` • ${a.service}` : ""}
                        {a.mode ? ` • ${a.mode}` : ""}
                        {a.status ? ` • ${a.status}` : ""}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {typeof a.payment_value === "number" ? brl.format(a.payment_value) : "—"}
                      {a.status === "done" ? " • Pago" : a.status === "scheduled" ? " • Pendente" : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Pacientes Recentes</h2>
            </div>
            {patients.length === 0 ? (
              <div className="text-center p-8 rounded-xl border border-dashed border-border">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <UserPlus className="w-6 h-6 text-primary" />
                </div>
                <div className="font-medium mb-1">Nenhum paciente ativo</div>
                <p className="text-sm text-muted-foreground mb-4">Cadastre seus primeiros pacientes para começar</p>
                <Button asChild className="btn-futuristic">
                  <Link to="/admin/pacientes">
                    <Plus className="w-4 h-4" /> Adicionar Primeiro Paciente
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {patients
                  .slice()
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 5)
                  .map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center text-primary-foreground font-semibold">
                          {p.name?.charAt(0) || "P"}
                        </div>
                        <div>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground">Cadastrado em {new Date(p.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      {p.phone && <div className="text-xs text-muted-foreground">{p.phone}</div>}
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Próximos Aniversariantes + Resumo Financeiro */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="card-glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Próximos Aniversariantes</h2>
              <Badge variant="outline" className="text-xs">
                {upcomingBirthdays.length} próximo(s)
              </Badge>
            </div>
            {upcomingBirthdays.length === 0 ? (
              <div className="text-center p-8 rounded-xl border border-dashed border-border">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Cake className="w-6 h-6 text-primary" />
                </div>
                <div className="font-medium mb-1">Nenhum aniversário próximo</div>
                <p className="text-sm text-muted-foreground mb-4">Cadastre as datas de nascimento para receber lembretes</p>
                <Button asChild variant="outline" className="btn-outline-futuristic">
                  <Link to="/admin/pacientes">Gerenciar Pacientes</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingBirthdays.map((p) => {
                  const isToday = format(p.nextBirthday, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
                  const daysUntil = Math.ceil((p.nextBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div key={p.id} className={cn(
                      "flex items-center justify-between p-3 rounded-lg",
                      isToday ? "bg-primary/20 border border-primary/30" : "bg-muted/40"
                    )}>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center text-primary-foreground font-semibold",
                          isToday ? "bg-primary" : "bg-gradient-primary"
                        )}>
                          {isToday ? <Cake className="w-5 h-5" /> : p.name?.charAt(0) || "P"}
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {p.name}
                            {isToday && <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">🎂 Hoje!</span>}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(p.nextBirthday, "dd 'de' MMMM", { locale: ptBR })}
                            {!isToday && ` • em ${daysUntil} dia${daysUntil > 1 ? 's' : ''}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Resumo Financeiro</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                <div className="text-sm text-primary">Projeção do mês</div>
                <div className="text-2xl font-semibold">{brl.format(previsaoTotal)}</div>
              </div>
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="text-sm text-primary">Valor médio/sessão</div>
                <div className="text-2xl font-semibold">{brl.format(valorMedio || 0)}</div>
              </div>
            </div>

            <div className="mb-3 text-sm font-medium">Resumo Detalhado do Faturamento</div>
            <div className="grid sm:grid-cols-3 gap-3 mb-4">
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                <div className="text-sm text-primary">Faturado</div>
                <div className="text-xl font-semibold">{brl.format(faturadoMes)}</div>
                <div className="text-xs text-muted-foreground">pagamentos recebidos</div>
              </div>
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="text-sm text-primary">Previsão Total</div>
                <div className="text-xl font-semibold">{brl.format(previsaoTotal)}</div>
                <div className="text-xs text-muted-foreground">inclui pendentes</div>
              </div>
              <div className="p-4 rounded-xl bg-accent/40 border border-accent">
                <div className="text-sm text-muted-foreground">A Receber</div>
                <div className="text-xl font-semibold">{brl.format(pendenteMes)}</div>
                <div className="text-xs text-muted-foreground">previsão</div>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-muted">
                <div className="text-sm text-muted-foreground">Pendentes</div>
                <div className="text-xl font-semibold">{brl.format(pendenteMes)}</div>
              </div>
              <div className="p-4 rounded-xl bg-muted">
                <div className="text-sm text-muted-foreground">Cancelados</div>
                <div className="text-xl font-semibold">{brl.format(canceladoMes)}</div>
              </div>
              <div className="p-4 rounded-xl bg-muted">
                <div className="text-sm text-muted-foreground">Receita (Hoje)</div>
                <div className="text-xl font-semibold">{brl.format(receitaDia)}</div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between text-sm">
              <div>
                Receita do Mês Atual <span className="font-semibold">{brl.format(faturadoMes)}</span>
              </div>
              <Button asChild size="sm" variant="ghost" className="px-0 text-primary">
                <Link to="/admin/agendamentos">
                  <TrendingUp className="w-4 h-4" />
                  <span className="ml-2">Ver dados</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
