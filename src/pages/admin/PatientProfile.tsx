import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { type ActivityField } from "@/lib/storage";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Mail, Phone, MapPin, Briefcase, CreditCard, CheckCircle2, FileText, DollarSign, Folder, ClipboardList, Save, Search, TrendingUp, Activity as ActivityIcon, Target, Award, Clock, UserCheck, XCircle, BookOpen, Plus, MessageSquare, AlertTriangle, Send, Trash2, Shield, UserPlus, Key, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMemo, useState, useEffect, useCallback } from "react";
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
import { usePatientActivities, type Activity } from "@/hooks/usePatientActivities";
import { usePatientMessages } from "@/hooks/usePatientMessages";
import { usePatientJournals, MOOD_OPTIONS, MOOD_LABELS, MOOD_BADGE_CLASSES, type JournalEntry } from "@/hooks/usePatientJournals";
import { usePatientAccount } from "@/hooks/usePatientAccount";
import { EditBasicForm, EmergencyForm, MedsForm, NotesForm } from "@/components/patient-profile/PatientEditForms";
import { MetricCard, InfoRow, ActivitySummaryRow, formatDayMonth, formatDateTimeLong, formatDueDate, clampPercent } from "@/components/patient-profile/PatientProfileHelpers";

type Patient = PatientRow & {
  birthDate?: string;
  gender?: string;
  address?: string;
  profession?: string;
  cpf?: string;
  cep?: string;
  color?: string;
};

const PatientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'perfil';
  const appointmentToOpen = searchParams.get('appointment');

  const { patients: supabasePatients, isLoading: patientsLoading, fetchPatients } = usePatients();
  const { appointments: supabaseAppointments, isLoading: appointmentsLoading } = useAppointments();

  const patient = useMemo(() => supabasePatients.find((p) => p.id === id) as Patient | undefined, [supabasePatients, id]);
  const appts = useMemo(() => (id ? supabaseAppointments.filter((a) => a.patient_id === id) : []), [supabaseAppointments, id]);

  const [tab, setTab] = useState(initialTab);
  const [editOpen, setEditOpen] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [medsOpen, setMedsOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const patientId = patient?.id || null;

  // Extracted hooks
  const {
    myActivities, pendingActivities, completedActivities, lastActivity, nextDueActivity,
    fetchActivities, createActivity, toggleActivityStatus, deleteActivity, saveFeedback, addThreadComment, activities,
  } = usePatientActivities(patientId);

  const {
    patientMessages, unreadPatientMessages, urgentPatientMessages,
    fetchMessages, markMessageRead, sendReply,
  } = usePatientMessages(patientId);

  const {
    patientJournals, lastJournalEntry, firstJournalEntry, journalMoodDistribution,
    journalEntriesThisMonth, predominantMood, journalTags,
    fetchJournals, addJournalEntry, deleteJournalEntry,
  } = usePatientJournals(patientId);

  const { isLoading: userAccountLoading, isCreating: userAccountCreating, hasAccount: patientHasAccount, checkAccount, createAccount } = usePatientAccount();

  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [responseViewerOpen, setResponseViewerOpen] = useState(false);
  const [selectedActivityForView, setSelectedActivityForView] = useState<Activity | null>(null);
  const [replyText, setReplyText] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [journalForm, setJournalForm] = useState<{ mood: JournalEntry["mood"]; note: string; tags: string }>({ mood: "bem", note: "", tags: "" });

  useEffect(() => { fetchActivities(); fetchMessages(); fetchJournals(); }, [fetchActivities, fetchMessages, fetchJournals]);

  useEffect(() => {
    if (tab === 'acesso' && patientHasAccount === null) checkAccount(patient?.email);
  }, [tab]);

  const age = useMemo(() => {
    if (!patient?.birthDate) return null;
    const dob = new Date(patient.birthDate);
    return Math.abs(new Date(Date.now() - dob.getTime()).getUTCFullYear() - 1970);
  }, [patient?.birthDate]);

  const initials = (patient?.name || "?").split(" ").map((s) => s[0]).join("").slice(0, 4).toUpperCase();
  const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const totalSessoes = appts.filter((a) => a.status !== "cancelled").length;
  const totalRecebido = appts.filter((a) => a.status === "done").reduce((s, a) => s + (a.payment_value || 0), 0);
  const pendentes = appts.filter((a) => a.status === "scheduled" || a.status === "confirmed").length;

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
  const attendanceRate = apptsSortedAsc.length ? clampPercent((doneHistory.length / apptsSortedAsc.length) * 100) : 0;

  const streak = useMemo(() => { let c = 0; for (const a of pastSessionsDesc) { if (a.status === "done") c++; else break; } return c; }, [pastSessionsDesc]);

  const averageIntervalDays = useMemo(() => {
    if (doneHistory.length < 2) return null;
    const ordered = doneHistory.slice().sort((a, b) => new Date(a.date_time || 0).getTime() - new Date(b.date_time || 0).getTime());
    let total = 0;
    for (let i = 1; i < ordered.length; i++) total += new Date(ordered[i].date_time || 0).getTime() - new Date(ordered[i - 1].date_time || 0).getTime();
    return Math.round(total / ((ordered.length - 1) * 86400000));
  }, [doneHistory]);

  const nextAppointment = useMemo(() => apptsSortedAsc.find((a) => !!a.date_time && new Date(a.date_time).getTime() > Date.now() && a.status !== "cancelled") || null, [apptsSortedAsc]);
  const cancellations = appts.filter((a) => a.status === "cancelled").length;
  const timelineItems = apptsSortedDesc.slice(0, 6);

  const objectives = useMemo(() => {
    if (!patient?.notes) return ["Registrar notas estruturadas após cada sessão", "Identificar fatores de risco e proteção a serem acompanhados", "Garantir adesão aos combinados terapêuticos da semana", "Encerrar cada encontro com plano de ação claro"];
    return patient.notes.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0).slice(0, 4);
  }, [patient?.notes]);

  const milestone = useMemo(() => {
    const total = doneHistory.length;
    if (total >= 12) return { title: "Rotina consolidada", description: "Mais de 12 sessões concluídas indicam forte aderência ao plano terapêutico." };
    if (total >= 6) return { title: "Evolução consistente", description: "Seis sessões registradas permitem análises de progresso comparativas." };
    if (total >= 3) return { title: "Jornada em andamento", description: "Três sessões concluídas demonstram engajamento inicial satisfatório." };
    if (total >= 1) return { title: "Primeiro passo", description: "Ao menos uma sessão concluída já oferece dados para acompanhamento." };
    return { title: "Aguardando registros", description: "Adicione sessões na agenda para acompanhar indicadores automaticamente." };
  }, [doneHistory.length]);

  const contentReady = apptsSortedAsc.length > 0;

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

  const updatePatient = async (patch: Partial<Patient>) => {
    if (!patient) return;
    const supabasePatch: Record<string, unknown> = {};
    if (patch.name !== undefined) supabasePatch.name = patch.name;
    if (patch.email !== undefined) supabasePatch.email = patch.email;
    if (patch.phone !== undefined) supabasePatch.phone = patch.phone;
    if (patch.notes !== undefined) supabasePatch.notes = patch.notes;
    if (patch.status !== undefined) supabasePatch.status = patch.status;
    if (patch.birth_date !== undefined) supabasePatch.birth_date = patch.birth_date;
    if (patch.birthDate !== undefined) supabasePatch.birth_date = patch.birthDate;
    const { error } = await supabase.from("patients").update(supabasePatch).eq("id", patient.id);
    if (!error) { fetchPatients(); toast.success("Paciente atualizado"); }
    else toast.error("Erro ao atualizar paciente");
  };

  const removePatient = async () => {
    if (!patient) return;
    const { error } = await supabase.from("patients").delete().eq("id", patient.id);
    if (!error) { toast.success("Paciente removido"); navigate("/admin/pacientes"); }
    else toast.error("Erro ao remover paciente");
  };

  const handleSendReply = async () => {
    await sendReply(replyText);
    setReplyText("");
  };

  const handleAddJournalEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await addJournalEntry(journalForm.mood, journalForm.note);
    if (success) setJournalForm((prev) => ({ ...prev, note: "", tags: "" }));
  };

  const handleCreateActivity = async (data: { title: string; description?: string; dueDate?: string; assignedBy?: string; fields?: ActivityField[]; attachmentUrl?: string; attachmentName?: string }) => {
    await createActivity(data);
    setActivityDialogOpen(false);
  };

  if (!patient) {
    return <AdminLayout><div className="text-muted-foreground">Paciente não encontrado.</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      {/* Hero */}
      <div className="rounded-3xl bg-gradient-primary text-primary-foreground p-8 mb-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-background/30 flex items-center justify-center font-semibold text-xl">{initials}</div>
            <div>
              <Link to="/admin/pacientes" className="text-sm underline-offset-4 hover:underline opacity-80">Voltar para Pacientes</Link>
              <h1 className="text-4xl font-display font-semibold leading-tight mt-1">{patient.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                <span className="flex items-center gap-1"><CalendarDays className="w-4 h-4" /> {age ? `${age} anos` : "Idade não informada"}</span>
                {patient.email && <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {patient.email}</span>}
                <span className={`px-2 py-1 rounded-full text-xs ${patient.status === 'active' ? 'bg-background/30' : 'bg-background/20 opacity-70'}`}>✓ Paciente {patient.status === 'inactive' ? 'Inativo' : 'Ativo'}</span>
                {age && <span className="px-2 py-1 rounded-full text-xs bg-background/20">{age >= 18 ? 'adulto' : 'menor'}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="border-2 border-white/80 text-white hover:border-white hover:bg-white/10 px-6 py-2 text-sm" onClick={() => setEditOpen(true)}>Editar</Button>
            <Button variant="ghost" className="border-2 border-white/80 text-white hover:border-white hover:bg-white/10 px-6 py-2 text-sm" onClick={() => updatePatient({ status: patient.status === 'active' ? 'inactive' : 'active' })}>{patient.status === 'active' ? 'Desativar' : 'Ativar'}</Button>
            <Button variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={removePatient}>Deletar</Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<DollarSign className="w-4 h-4" />} title="Total recebido" value={brl.format(totalRecebido)} subtitle={`${totalSessoes} sessões`} />
        <MetricCard icon={<CalendarDays className="w-4 h-4" />} title="Pendentes" value={pendentes} subtitle="Sessões agendadas" />
        <MetricCard icon={<TrendingUp className="w-4 h-4" />} title="Atividades" value={`${pendingActivities.length} pendentes`} subtitle={`${completedActivities.length} concluídas`} />
        <MetricCard icon={<BookOpen className="w-4 h-4" />} title="Evoluções" value={patientJournals.length} subtitle={lastJournalEntry ? `Última: ${formatDayMonth(lastJournalEntry.createdAt)}` : "Nenhuma"} />
      </div>

      {/* Main Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full overflow-x-auto flex bg-muted/60 rounded-2xl p-1 flex-nowrap gap-1">
          {[
            { value: "perfil", label: "Perfil" }, { value: "prontuario", label: "Prontuário" },
            { value: "plano", label: "Plano" }, { value: "sessoes", label: "Sessões" },
            { value: "atividades", label: "Atividades" }, { value: "recursos", label: "Recursos" },
            { value: "mensagens", label: "Mensagens" }, { value: "progresso", label: "Progresso" },
            { value: "financeiro", label: "Financeiro" }, { value: "arquivos", label: "Arquivos" },
            { value: "anamnese", label: "Anamnese" }, { value: "acesso", label: "Acesso" },
          ].map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="rounded-xl whitespace-nowrap">{t.label}</TabsTrigger>
          ))}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="perfil" className="mt-6">
          <div className="grid xl:grid-cols-[2fr,1fr] gap-6 items-start">
            <Card className="card-glass">
              <CardContent className="p-6 space-y-1">
                <InfoRow icon={<Phone className="w-4 h-4" />} label="Telefone" value={patient.phone || "—"} />
                <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={patient.email || "—"} />
                <InfoRow icon={<CalendarDays className="w-4 h-4" />} label="Data de nascimento" value={patient.birthDate || patient.birth_date || "—"} />
                <InfoRow icon={<CreditCard className="w-4 h-4" />} label="CPF" value={patient.cpf || "—"} />
                <InfoRow icon={<MapPin className="w-4 h-4" />} label="Endereço" value={patient.address || "—"} />
                <InfoRow icon={<Briefcase className="w-4 h-4" />} label="Profissão" value={patient.profession || "—"} />
              </CardContent>
            </Card>
            <div className="space-y-4">
              <Card className="bg-card/90 border border-border/60">
                <CardContent className="p-6">
                  <div className="text-sm font-medium text-muted-foreground mb-3">Ações rápidas</div>
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" className="justify-start" onClick={() => setEmergencyOpen(true)}>Contatos de emergência</Button>
                    <Button variant="outline" className="justify-start" onClick={() => setMedsOpen(true)}>Medicações em uso</Button>
                    <Button variant="outline" className="justify-start" onClick={() => setNotesOpen(true)}>Observações gerais</Button>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/90 border border-border/60">
                <CardContent className="p-6 space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Observações</div>
                  <div className="text-sm text-muted-foreground/90 whitespace-pre-line">{patient.notes || "Nenhuma observação registrada."}</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Journal/Prontuario Tab */}
        <TabsContent value="prontuario" className="mt-6">
          <div className="grid xl:grid-cols-[2fr,1fr] gap-6 items-start">
            <Card className="card-glass">
              <CardContent className="p-6 space-y-6">
                <div><div className="text-lg font-semibold text-foreground">Registro de Evolução</div><div className="text-sm text-muted-foreground">Registre o progresso emocional e clínico do paciente.</div></div>
                <form onSubmit={handleAddJournalEntry} className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Humor percebido</label>
                    <Select value={journalForm.mood} onValueChange={(v) => setJournalForm((prev) => ({ ...prev, mood: v as JournalEntry["mood"] }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{MOOD_OPTIONS.map((m) => (<SelectItem key={m.value} value={m.value}>{m.label} — {m.description}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Evolução</label>
                    <Textarea className="mt-1 min-h-[120px]" value={journalForm.note} onChange={(e) => setJournalForm((prev) => ({ ...prev, note: e.target.value }))} placeholder="Observações clínicas, avanços e impressões da sessão." required />
                  </div>
                  <div className="flex justify-end"><Button type="submit" className="btn-futuristic inline-flex items-center gap-2" disabled={!journalForm.note.trim() || !patientId}><Save className="w-4 h-4" /> Registrar evolução</Button></div>
                </form>

                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Últimos registros</div>
                {patientJournals.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/70 bg-card/70 p-6 text-sm text-muted-foreground">Nenhum registro de evolução encontrado.</div>
                ) : (
                  <div className="space-y-3">
                    {patientJournals.map((entry) => (
                      <div key={entry.id} className="rounded-xl border border-border/60 bg-card p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1"><Badge className={`text-xs ${MOOD_BADGE_CLASSES[entry.mood]}`}>{MOOD_LABELS[entry.mood]}</Badge><span className="text-xs text-muted-foreground">{formatDateTimeLong(entry.createdAt)}</span></div>
                            <div className="text-sm text-foreground/90 whitespace-pre-line">{entry.note}</div>
                            {entry.tags && entry.tags.length > 0 && (<div className="mt-2 flex flex-wrap gap-1">{entry.tags.map((tag) => (<Badge key={tag} variant="secondary" className="text-[10px]">#{tag}</Badge>))}</div>)}
                          </div>
                          <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700" onClick={() => deleteJournalEntry(entry.id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="bg-card/90 border border-border/60">
                <CardContent className="p-6 space-y-4">
                  <div className="text-sm font-medium text-muted-foreground">Resumo do prontuário</div>
                  <ActivitySummaryRow label="Total de evoluções" value={patientJournals.length} helper={firstJournalEntry ? `Primeiro registro em ${formatDateTimeLong(firstJournalEntry.createdAt)}` : undefined} />
                  <ActivitySummaryRow label="Registros neste mês" value={journalEntriesThisMonth.length} helper="Comparativo do ciclo atual" />
                  <ActivitySummaryRow label="Humor predominante" value={predominantMood ? <Badge className={`text-sm ${MOOD_BADGE_CLASSES[predominantMood]}`}>{MOOD_LABELS[predominantMood]}</Badge> : "—"} helper={lastJournalEntry ? `Último registro indica ${MOOD_LABELS[lastJournalEntry.mood]}` : undefined} />
                  <ActivitySummaryRow label="Última evolução" value={lastJournalEntry ? formatDateTimeLong(lastJournalEntry.createdAt) : "—"} helper={lastJournalEntry ? `${lastJournalEntry.note.slice(0, 96)}${lastJournalEntry.note.length > 96 ? "..." : ""}` : undefined} />
                </CardContent>
              </Card>
              {journalTags.length > 0 && (
                <Card className="bg-card/90 border border-border/60"><CardContent className="p-6 space-y-3"><div className="text-sm font-medium text-muted-foreground">Temas recorrentes</div><div className="flex flex-wrap gap-2">{journalTags.map((tag) => (<Badge key={tag} variant="secondary" className="text-xs font-normal">#{tag}</Badge>))}</div></CardContent></Card>
              )}
              <Card className="bg-card/90 border border-border/60"><CardContent className="p-6 space-y-3 text-sm text-muted-foreground"><div className="font-medium text-foreground">Boas práticas</div><ul className="list-disc pl-4 space-y-1"><li>Registre evidências, hipóteses e plano terapêutico a cada sessão relevante.</li><li>Use tags para facilitar buscas futuras sobre temas recorrentes.</li><li>Revise o resumo antes de reuniões de supervisão ou devolutivas.</li></ul></CardContent></Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="plano" className="mt-6">
          <TreatmentPlanTab patientId={patient.id} patientName={patient.name} patientAge={age} patientNotes={patient.notes} sessionsCompleted={doneHistory.length} journalNotes={patientJournals.slice(0, 3).map((j) => j.note).join("\n")} onAddSession={() => setTab("sessoes")} />
        </TabsContent>

        <TabsContent value="sessoes" className="mt-6">
          <SessionsModule patientId={patient.id} patientName={patient.name} initialAppointmentId={appointmentToOpen || undefined} />
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="atividades" className="mt-6">
          <div className="grid xl:grid-cols-[2fr,1fr] gap-6 items-start">
            <Card className="card-glass">
              <CardContent className="p-6 space-y-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div><div className="text-lg font-semibold text-foreground">Atividades terapêuticas</div><div className="text-sm text-muted-foreground">Crie exercícios personalizados para o paciente realizar entre sessões e acompanhe a execução.</div></div>
                  <Button className="rounded-full inline-flex items-center gap-2" onClick={() => setActivityDialogOpen(true)}><Plus className="w-4 h-4" /> Nova atividade</Button>
                </div>

                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Pendentes ({pendingActivities.length})</div>
                  {pendingActivities.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/70 bg-card/70 p-5 text-sm text-muted-foreground">Nenhuma atividade pendente no momento.</div>
                  ) : (
                    <div className="space-y-3">
                      {pendingActivities.map((activity) => (
                        <div key={activity.id} className="rounded-xl border border-border/60 bg-card p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-foreground">{activity.title}</div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1"><CalendarDays className="w-3 h-3" />{activity.dueDate ? `Prazo: ${formatDueDate(activity.dueDate)}` : "Sem prazo"}</span>
                                <span className="inline-flex items-center gap-1"><ActivityIcon className="w-3 h-3" /> Criado em {formatDateTimeLong(activity.createdAt)}</span>
                                {activity.assignedBy && <span className="inline-flex items-center gap-1"><UserCheck className="w-3 h-3" /> Orientado por {activity.assignedBy}</span>}
                              </div>
                              {activity.description && <div className="mt-2 text-xs text-muted-foreground/90 whitespace-pre-line">{activity.description}</div>}
                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                {activity.fields && activity.fields.length > 0 && <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200"><ClipboardList className="w-3 h-3 mr-1" />{activity.fields.length} campo(s)</Badge>}
                                {activity.attachmentUrl && <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><FileText className="w-3 h-3 mr-1" />Anexo</Badge>}
                                {activity.patientResponses && Object.keys(activity.patientResponses).length > 0 ? <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1" />Respondido</Badge> : activity.fields && activity.fields.length > 0 ? <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200"><Clock className="w-3 h-3 mr-1" />Aguardando</Badge> : null}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 md:flex-col">
                              {activity.fields && activity.fields.length > 0 && <Button size="sm" variant="outline" className="rounded-full inline-flex items-center gap-2" onClick={() => { setSelectedActivityForView(activity); setResponseViewerOpen(true); }}><MessageSquare className="w-3 h-3" /> Ver respostas</Button>}
                              <Button size="sm" className="rounded-full inline-flex items-center gap-2" onClick={() => toggleActivityStatus(activity.id)}><CheckCircle2 className="w-3 h-3" /> Concluir</Button>
                              <Button size="sm" variant="ghost" className="text-rose-600 hover:text-rose-700" onClick={() => deleteActivity(activity.id)}>Remover</Button>
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
                    <div className="rounded-xl border border-dashed border-border/70 bg-card/70 p-5 text-sm text-muted-foreground">Ainda não há atividades concluídas para este paciente.</div>
                  ) : (
                    <div className="space-y-3">
                      {completedActivities.map((activity) => (
                        <div key={activity.id} className="rounded-xl border border-border/60 bg-card p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="text-sm font-semibold text-foreground flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" />{activity.title}</div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                {activity.completedAt && <span className="inline-flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Concluída em {formatDateTimeLong(activity.completedAt)}</span>}
                                {activity.dueDate && <span className="inline-flex items-center gap-1"><CalendarDays className="w-3 h-3" /> Prazo: {formatDueDate(activity.dueDate)}</span>}
                              </div>
                              {activity.description && <div className="mt-2 text-xs text-muted-foreground/90 whitespace-pre-line">{activity.description}</div>}
                            </div>
                            <div className="flex items-center gap-2 md:flex-col">
                              <Button size="sm" variant="outline" className="rounded-full" onClick={() => toggleActivityStatus(activity.id)}>Reabrir</Button>
                              <Button size="sm" variant="ghost" className="text-rose-600 hover:text-rose-700" onClick={() => deleteActivity(activity.id)}>Remover</Button>
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
                <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-xs text-muted-foreground">Sugestão: compartilhe o link ou arquivos de apoio na descrição para facilitar o acesso do paciente.</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recursos" className="mt-6"><ResourcesTab patientId={patient.id} /></TabsContent>

        {/* Messages Tab */}
        <TabsContent value="mensagens" className="mt-6">
          <div className="grid xl:grid-cols-[2fr,1fr] gap-6 items-start">
            <Card className="card-glass">
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div><div className="text-lg font-semibold text-foreground">Mensagens do paciente</div><div className="text-sm text-muted-foreground">Converse com o paciente e acompanhe solicitações sinalizadas como urgentes.</div></div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-rose-600" /> {urgentPatientMessages.length} urgência(s)</span>
                    <span className="inline-flex items-center gap-1"><MessageSquare className="w-3 h-3 text-primary" /> {unreadPatientMessages.length} não lida(s)</span>
                  </div>
                </div>
                {patientMessages.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/70 bg-card/70 p-6 text-sm text-muted-foreground">Nenhuma mensagem registrada ainda.</div>
                ) : (
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {patientMessages.map((message) => {
                      const isPatient = message.author === "patient";
                      return (
                        <div key={message.id} className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${isPatient ? "border-primary/40 bg-primary/5" : "border-emerald-200 bg-emerald-50"}`}>
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span className="flex items-center gap-2">
                              {isPatient ? <UserCheck className="w-3 h-3 text-primary" /> : <Shield className="w-3 h-3 text-emerald-600" />}
                              {isPatient ? "Paciente" : "Equipe"}
                              {message.urgent && <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700"><AlertTriangle className="w-3 h-3" /> Urgente</span>}
                              {isPatient && !message.read && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Novo</span>}
                            </span>
                            <span>{formatDateTimeLong(message.createdAt)}</span>
                          </div>
                          <div className="text-sm text-foreground whitespace-pre-line">{message.content}</div>
                          {isPatient && !message.read && <div className="mt-3"><Button size="sm" variant="outline" className="rounded-full" onClick={() => markMessageRead(message.id)}>Marcar como lida</Button></div>}
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
                  <Textarea className="mt-2 min-h-[120px]" value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Escreva uma orientação, retorno ou acolhimento." />
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">O paciente verá sua resposta imediatamente.</span>
                    <Button size="sm" className="rounded-full inline-flex items-center gap-2" onClick={handleSendReply} disabled={!replyText.trim() || !patientId}><Send className="w-4 h-4" /> Enviar resposta</Button>
                  </div>
                </div>
                <div className="rounded-xl border border-border/60 bg-card p-4 text-xs text-muted-foreground space-y-1">
                  <div><strong>{patientMessages.filter((m) => m.author === "patient").length}</strong> mensagem(ns) enviadas pelo paciente.</div>
                  <div><strong>{patientMessages.filter((m) => m.author === "psychologist").length}</strong> resposta(s) da equipe.</div>
                  <div className="flex items-center gap-1 text-rose-600"><AlertTriangle className="w-3 h-3" /> Trate mensagens urgentes em até 24h.</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progresso" className="mt-6">
          {!contentReady ? (
            <Card className="card-glass"><CardContent className="p-6 text-muted-foreground">Nenhuma sessão registrada ainda para este paciente. Assim que sessões forem adicionadas, os indicadores de progresso aparecem automaticamente aqui.</CardContent></Card>
          ) : (
            <div className="space-y-6">
              <div className="grid xl:grid-cols-[2fr,1fr] gap-6 items-start">
                <Card className="card-glass">
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="w-4 h-4 text-primary" />Progresso no mês</div>
                      <div className="mt-1 text-2xl font-semibold text-foreground">{progressPct}% concluído</div>
                      <div className="text-xs text-muted-foreground">{monthScheduled} sessão(ões) planejadas · {monthDone} concluída(s)</div>
                    </div>
                    <div className="w-full max-w-md">
                      <Progress value={progressPct} className="h-3 bg-primary/10" />
                      <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{monthDone} realizadas</span><span>{monthPending} pendentes</span></div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      {focusAreas.map((area) => (
                        <div key={area.title} className="rounded-xl border border-border/60 bg-card/90 p-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground"><area.icon className="w-4 h-4 text-primary" />{area.title}</div>
                          <div className="mt-2 text-sm text-muted-foreground/90">{area.description}</div>
                          <div className="mt-3 text-xs font-medium text-foreground/80 uppercase tracking-wide">{area.highlight}</div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-card/90 p-6">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Award className="w-4 h-4 text-primary" /> Marco atual</div>
                      <div className="mt-2 text-lg font-semibold text-foreground">{milestone.title}</div>
                      <div className="text-sm text-muted-foreground">{milestone.description}</div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card/90 border border-border/60">
                  <CardContent className="p-6 space-y-4">
                    {quickStats.map((stat) => (
                      <div key={stat.label} className="flex gap-3 rounded-xl border border-border/60 bg-card p-4">
                        <div className="mt-0.5"><stat.icon className="w-5 h-5 text-primary" /></div>
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
                      <div className="rounded-xl border border-dashed border-border/70 bg-card/70 p-6 text-sm text-muted-foreground">Sem registros anteriores para exibir.</div>
                    ) : (
                      timelineItems.map((item) => {
                        const statusLabel = item.status === "done" ? "Concluída" : item.status === "cancelled" ? "Cancelada" : "Agendada";
                        const statusColor = item.status === "done" ? "text-emerald-600" : item.status === "cancelled" ? "text-rose-600" : "text-amber-600";
                        return (
                          <div key={item.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-card px-4 py-3">
                            <div>
                              <div className="text-sm font-medium text-foreground">{item.service || "Sessão de terapia"}</div>
                              <div className="text-xs text-muted-foreground">{formatDateTimeLong(item.date_time)} · {item.mode === "online" ? "Online" : "Presencial"}</div>
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
                    <div className="space-y-3 text-sm text-muted-foreground/90">{objectives.map((goal) => (<div key={goal} className="rounded-xl border border-border/60 bg-card px-4 py-3">• {goal}</div>))}</div>
                    <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4 text-xs text-muted-foreground">Atualize as observações do paciente para que metas personalizadas apareçam aqui.</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="financeiro" className="mt-6"><Card className="card-glass"><CardContent className="p-6 text-muted-foreground">Em breve: dados financeiros por paciente.</CardContent></Card></TabsContent>
        <TabsContent value="arquivos" className="mt-6"><Card className="card-glass"><CardContent className="p-6 text-muted-foreground">Em breve: arquivos do paciente.</CardContent></Card></TabsContent>
        <TabsContent value="anamnese" className="mt-6"><Card className="card-glass"><CardContent className="p-6 text-muted-foreground">Em breve: anamnese.</CardContent></Card></TabsContent>

        {/* Access Tab */}
        <TabsContent value="acesso" className="mt-6">
          <Card className="card-glass">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2"><Key className="w-5 h-5" />Acesso ao Portal do Paciente</h3>
                  <p className="text-sm text-muted-foreground mt-1">Gerencie o acesso do paciente ao portal online</p>
                </div>
                {patientHasAccount !== null && <Badge className={patientHasAccount ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>{patientHasAccount ? "Conta ativa" : "Sem conta"}</Badge>}
              </div>
              {userAccountLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /><span className="ml-2 text-muted-foreground">Verificando conta...</span></div>
              ) : patientHasAccount ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-emerald-800">Paciente já possui acesso ao portal</h4>
                      <p className="text-sm text-emerald-700 mt-1">O paciente pode acessar o portal usando o email <strong>{patient.email}</strong></p>
                      <p className="text-xs text-emerald-600 mt-2">Caso o paciente tenha esquecido a senha, ele pode usar a opção "Esqueci minha senha" na tela de login.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800">Este paciente ainda não possui uma conta para acessar o portal. Crie uma conta abaixo para que ele possa agendar sessões, enviar mensagens e acompanhar atividades.</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-6 space-y-4">
                    <div className="flex items-center gap-2 text-primary"><UserPlus className="w-5 h-5" /><h4 className="font-medium">Criar conta para o paciente</h4></div>
                    <div className="grid gap-4">
                      <div><Label htmlFor="patient-email">Email</Label><Input id="patient-email" type="email" value={patient.email || ''} disabled className="bg-muted" /><p className="text-xs text-muted-foreground mt-1">O email cadastrado será usado para login</p></div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div><Label htmlFor="new-password">Senha *</Label><Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" /></div>
                        <div><Label htmlFor="confirm-password">Confirmar senha *</Label><Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a senha" /></div>
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button onClick={async () => { const ok = await createAccount(patient.email, patient.name, newPassword, confirmPassword); if (ok) { setNewPassword(""); setConfirmPassword(""); } }} disabled={userAccountCreating || !patient.email || !newPassword || !confirmPassword} className="btn-futuristic">
                        {userAccountCreating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando conta...</> : <><UserPlus className="w-4 h-4 mr-2" />Criar conta do paciente</>}
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

      {/* Dialogs */}
      <ActivityFormDialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen} onSubmit={handleCreateActivity} patientId={patientId || ""} />

      {selectedActivityForView && (
        <ActivityResponseViewer
          open={responseViewerOpen}
          onOpenChange={setResponseViewerOpen}
          activity={{
            id: selectedActivityForView.id, title: selectedActivityForView.title,
            description: selectedActivityForView.description, fields: selectedActivityForView.fields,
            attachmentUrl: selectedActivityForView.attachmentUrl, attachmentName: selectedActivityForView.attachmentName,
            patientResponses: selectedActivityForView.patientResponses, responseHistory: selectedActivityForView.responseHistory,
            psychologistFeedback: selectedActivityForView.psychologistFeedback, feedbackAt: selectedActivityForView.feedbackAt,
            feedbackThread: selectedActivityForView.feedbackThread,
          }}
          patientName={patient?.name}
          onSaveFeedback={async (activityId, feedback) => {
            const updated = await saveFeedback(activityId, feedback);
            if (updated) setSelectedActivityForView(updated);
          }}
          onAddThreadComment={async (activityId, comment) => {
            const updated = await addThreadComment(activityId, comment);
            if (updated) setSelectedActivityForView(updated);
          }}
        />
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Editar Informações do Paciente</DialogTitle></DialogHeader>
          <p className="-mt-4 text-sm text-muted-foreground">Atualize as informações básicas do paciente</p>
          <EditBasicForm initial={patient} onSubmit={(data) => { updatePatient(data); setEditOpen(false); return true; }} />
        </DialogContent>
      </Dialog>

      <Dialog open={emergencyOpen} onOpenChange={setEmergencyOpen}>
        <DialogContent><DialogHeader><DialogTitle>Contatos de Emergência</DialogTitle></DialogHeader><EmergencyForm initial={[]} onSubmit={() => { setEmergencyOpen(false); return true; }} /></DialogContent>
      </Dialog>

      <Dialog open={medsOpen} onOpenChange={setMedsOpen}>
        <DialogContent><DialogHeader><DialogTitle>Medicações</DialogTitle></DialogHeader><MedsForm initial={[]} onSubmit={() => { setMedsOpen(false); return true; }} /></DialogContent>
      </Dialog>

      <Dialog open={notesOpen} onOpenChange={setNotesOpen}>
        <DialogContent><DialogHeader><DialogTitle>Observações Gerais</DialogTitle></DialogHeader><NotesForm initial={patient.notes || ''} onSubmit={(notes) => { updatePatient({ notes }); setNotesOpen(false); return true; }} /></DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default PatientProfile;
