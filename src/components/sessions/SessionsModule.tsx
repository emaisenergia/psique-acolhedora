import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CalendarDays,
  Clock,
  Plus,
  Play,
  Pause,
  Square,
  Mic,
  Upload,
  FileText,
  Brain,
  Sparkles,
  Trash2,
  Download,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FileUp,
  Volume2,
  Loader2,
  Link as LinkIcon,
  TrendingUp,
  FileDown,
  ClipboardList,
  CreditCard,
  User,
  Heart,
  Activity,
} from "lucide-react";
import { sessionsService, SESSION_STATUS_CONFIG, type Session, type SessionFile, type SessionStatus } from "@/lib/sessions";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { storage, type Appointment } from "@/lib/storage";

interface AnamnesisData {
  queixaPrincipal: string;
  historiaAtual: string;
  historiaPregressa: string;
  historicoFamiliar: string;
  saudeGeral: string;
  medicamentos: string;
  habitos: string;
  expectativas: string;
  observacoes: string;
}

interface SessionsModuleProps {
  patientId: string;
  patientName: string;
}

const formatDateTime = (iso?: string) => {
  if (!iso) return "—";
  const date = new Date(iso);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatDuration = (minutes?: number) => {
  if (!minutes) return "—";
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}min` : `${hrs}h`;
};

export const SessionsModule = ({ patientId, patientName }: SessionsModuleProps) => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessionFiles, setSessionFiles] = useState<SessionFile[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAnamnesisOpen, setIsAnamnesisOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedAppointmentForPayment, setSelectedAppointmentForPayment] = useState<Appointment | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isEvolutionOpen, setIsEvolutionOpen] = useState(false);
  const [evolutionReport, setEvolutionReport] = useState<string | null>(null);
  const [isGeneratingEvolution, setIsGeneratingEvolution] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  // Agendamentos do localStorage para sincronização
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const audioRecorder = useAudioRecorder();

  // Anamnesis data
  const [anamnesis, setAnamnesis] = useState<AnamnesisData>({
    queixaPrincipal: "",
    historiaAtual: "",
    historiaPregressa: "",
    historicoFamiliar: "",
    saudeGeral: "",
    medicamentos: "",
    habitos: "",
    expectativas: "",
    observacoes: "",
  });

  // Payment form
  const [paymentData, setPaymentData] = useState({
    amount: "",
    paymentMethod: "pix",
    notes: "",
  });

  const [newSession, setNewSession] = useState({
    session_date: new Date().toISOString().slice(0, 16),
    duration_minutes: 50,
    status: "scheduled" as SessionStatus,
    detailed_notes: "",
    summary: "",
    clinical_observations: "",
    appointment_id: "",
  });

  // Carrega agendamentos do paciente
  const loadAppointments = useCallback(() => {
    const allAppts = storage.getAppointments();
    const patientAppts = allAppts.filter((a) => a.patientId === patientId);
    setAppointments(patientAppts);
  }, [patientId]);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await sessionsService.getPatientSessions(patientId);
      setSessions(data);
    } catch (error) {
      console.error("Error loading sessions:", error);
      toast({
        title: "Erro ao carregar sessões",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [patientId, toast]);

  useEffect(() => {
    loadSessions();
    loadAppointments();
  }, [loadSessions, loadAppointments]);

  // Agendamentos não vinculados a uma sessão
  const unlinkedAppointments = useMemo(() => {
    const linkedIds = new Set(sessions.map((s) => s.appointment_id).filter(Boolean));
    return appointments.filter((a) => !linkedIds.has(a.id));
  }, [appointments, sessions]);

  // Sincroniza status do agendamento ao atualizar sessão
  const syncAppointmentStatus = useCallback((appointmentId: string | undefined, sessionStatus: SessionStatus) => {
    if (!appointmentId) return;
    const statusMap: Record<SessionStatus, Appointment["status"]> = {
      scheduled: "scheduled",
      completed: "done",
      cancelled: "cancelled",
      rescheduled: "scheduled",
      no_show: "cancelled",
    };
    const allAppts = storage.getAppointments();
    const updated = allAppts.map((a) =>
      a.id === appointmentId ? { ...a, status: statusMap[sessionStatus] } : a
    );
    storage.saveAppointments(updated);
    loadAppointments();
  }, [loadAppointments]);

  const loadSessionFiles = useCallback(async (sessionId: string) => {
    try {
      const files = await sessionsService.getSessionFiles(sessionId);
      setSessionFiles(files);
    } catch (error) {
      console.error("Error loading files:", error);
    }
  }, []);

  const handleViewSession = useCallback(
    async (session: Session) => {
      setSelectedSession(session);
      setIsViewOpen(true);
      await loadSessionFiles(session.id);
    },
    [loadSessionFiles]
  );

  const handleCreateSession = async () => {
    try {
      const session = await sessionsService.createSession({
        patient_id: patientId,
        appointment_id: newSession.appointment_id || undefined,
        session_date: new Date(newSession.session_date).toISOString(),
        duration_minutes: newSession.duration_minutes,
        status: newSession.status,
        detailed_notes: newSession.detailed_notes || undefined,
        summary: newSession.summary || undefined,
        clinical_observations: newSession.clinical_observations || undefined,
      });
      
      // Sincroniza com agendamento se vinculado
      if (newSession.appointment_id) {
        syncAppointmentStatus(newSession.appointment_id, newSession.status);
      }
      
      toast({ title: "Sessão criada com sucesso!" });
      setIsCreateOpen(false);
      setNewSession({
        session_date: new Date().toISOString().slice(0, 16),
        duration_minutes: 50,
        status: "scheduled",
        detailed_notes: "",
        summary: "",
        clinical_observations: "",
        appointment_id: "",
      });
      loadSessions();
    } catch (error) {
      console.error("Error creating session:", error);
      toast({
        title: "Erro ao criar sessão",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSession = async (updates: Partial<Session>) => {
    if (!selectedSession) return;
    try {
      const updated = await sessionsService.updateSession(selectedSession.id, updates);
      setSelectedSession(updated);
      setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      
      // Sincroniza status com agendamento se houver alteração
      if (updates.status && selectedSession.appointment_id) {
        syncAppointmentStatus(selectedSession.appointment_id, updates.status);
      }
      
      toast({ title: "Sessão atualizada!" });
    } catch (error) {
      console.error("Error updating session:", error);
      toast({
        title: "Erro ao atualizar",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta sessão?")) return;
    try {
      await sessionsService.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setIsViewOpen(false);
      toast({ title: "Sessão excluída!" });
    } catch (error) {
      console.error("Error deleting session:", error);
      toast({
        title: "Erro ao excluir",
        variant: "destructive",
      });
    }
  };

  const handleGenerateSummary = async () => {
    if (!selectedSession) return;
    setIsGeneratingSummary(true);
    try {
      const { content } = await sessionsService.generateSummary("summary", {
        detailedNotes: selectedSession.detailed_notes,
        transcription: selectedSession.transcription,
        patientName,
      });
      if (content) {
        await handleUpdateSession({ ai_generated_summary: content });
      }
    } catch (error) {
      console.error("Error generating summary:", error);
      toast({
        title: "Erro ao gerar resumo",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleGenerateInsights = async () => {
    if (!selectedSession) return;
    setIsGeneratingSummary(true);
    try {
      const { insights } = await sessionsService.generateSummary("insights", {
        detailedNotes: selectedSession.detailed_notes,
        transcription: selectedSession.transcription,
        patientName,
      });
      if (insights) {
        await handleUpdateSession({ ai_insights: insights });
      }
    } catch (error) {
      console.error("Error generating insights:", error);
      toast({
        title: "Erro ao gerar insights",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Gerar relatório evolutivo consolidando múltiplas sessões
  const handleGenerateEvolutionReport = async () => {
    const completedSessions = sessions.filter((s) => s.status === "completed" && (s.detailed_notes || s.summary || s.transcription));
    if (completedSessions.length < 2) {
      toast({
        title: "Sessões insuficientes",
        description: "É necessário ao menos 2 sessões completas para gerar o relatório evolutivo.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingEvolution(true);
    try {
      const { content } = await sessionsService.generateSummary("evolution", {
        patientName,
        previousSessions: completedSessions.slice(0, 10).map((s) => ({
          date: s.session_date,
          summary: s.summary || s.ai_generated_summary,
          notes: s.detailed_notes,
          insights: s.ai_insights,
        })),
      });
      if (content) {
        setEvolutionReport(content);
        setIsEvolutionOpen(true);
      }
    } catch (error) {
      console.error("Error generating evolution report:", error);
      toast({
        title: "Erro ao gerar relatório",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingEvolution(false);
    }
  };

  const exportEvolutionReportPDF = () => {
    if (!evolutionReport) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório Evolutivo - ${patientName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.6; }
          h1 { color: #333; border-bottom: 2px solid #7c3aed; padding-bottom: 10px; }
          .date { color: #666; font-size: 14px; margin-bottom: 30px; }
          .content { white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <h1>Relatório Evolutivo</h1>
        <p class="date">Paciente: ${patientName} | Gerado em: ${new Date().toLocaleDateString("pt-BR")}</p>
        <div class="content">${evolutionReport}</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Importar sessão a partir de agendamento
  const handleImportFromAppointment = (appointment: Appointment) => {
    setNewSession({
      session_date: appointment.dateTime.slice(0, 16),
      duration_minutes: 50,
      status: appointment.status === "done" ? "completed" : appointment.status === "cancelled" ? "cancelled" : "scheduled",
      detailed_notes: "",
      summary: "",
      clinical_observations: "",
      appointment_id: appointment.id,
    });
    setIsCreateOpen(true);
  };

  // Save anamnesis as first session
  const handleSaveAnamnesis = async () => {
    try {
      const anamnesisText = `
## ANAMNESE - PRIMEIRA SESSÃO

### Queixa Principal
${anamnesis.queixaPrincipal || "Não informado"}

### História do Problema Atual
${anamnesis.historiaAtual || "Não informado"}

### História Pregressa
${anamnesis.historiaPregressa || "Não informado"}

### Histórico Familiar
${anamnesis.historicoFamiliar || "Não informado"}

### Saúde Geral
${anamnesis.saudeGeral || "Não informado"}

### Medicamentos em Uso
${anamnesis.medicamentos || "Nenhum"}

### Hábitos e Estilo de Vida
${anamnesis.habitos || "Não informado"}

### Expectativas em Relação ao Tratamento
${anamnesis.expectativas || "Não informado"}

### Observações Adicionais
${anamnesis.observacoes || "Nenhuma"}
      `.trim();

      await sessionsService.createSession({
        patient_id: patientId,
        session_date: new Date().toISOString(),
        duration_minutes: 50,
        status: "completed",
        detailed_notes: anamnesisText,
        summary: `Sessão de anamnese inicial. Queixa principal: ${anamnesis.queixaPrincipal || "Não informada"}`,
        clinical_observations: anamnesis.observacoes || undefined,
      });

      toast({ title: "Anamnese registrada com sucesso!" });
      setIsAnamnesisOpen(false);
      setAnamnesis({
        queixaPrincipal: "",
        historiaAtual: "",
        historiaPregressa: "",
        historicoFamiliar: "",
        saudeGeral: "",
        medicamentos: "",
        habitos: "",
        expectativas: "",
        observacoes: "",
      });
      loadSessions();
    } catch (error) {
      console.error("Error saving anamnesis:", error);
      toast({
        title: "Erro ao salvar anamnese",
        variant: "destructive",
      });
    }
  };

  // Register payment for appointment
  const handleRegisterPayment = (appointment: Appointment) => {
    setSelectedAppointmentForPayment(appointment);
    setPaymentData({
      amount: "",
      paymentMethod: "pix",
      notes: "",
    });
    setIsPaymentDialogOpen(true);
  };

  const handleSavePayment = () => {
    if (!selectedAppointmentForPayment || !paymentData.amount) {
      toast({
        title: "Informe o valor do pagamento",
        variant: "destructive",
      });
      return;
    }

    // Save payment to localStorage (financial transactions)
    const transactionsKey = "financial_transactions_local";
    const existingTransactions = JSON.parse(localStorage.getItem(transactionsKey) || "[]");
    const newTransaction = {
      id: crypto.randomUUID(),
      patient_id: patientId,
      patient_name: patientName,
      appointment_id: selectedAppointmentForPayment.id,
      amount: parseFloat(paymentData.amount),
      payment_method: paymentData.paymentMethod,
      notes: paymentData.notes,
      transaction_date: new Date().toISOString(),
      type: "receita",
      category: "Sessão",
      is_confirmed: true,
    };
    existingTransactions.push(newTransaction);
    localStorage.setItem(transactionsKey, JSON.stringify(existingTransactions));

    toast({ title: "Pagamento registrado com sucesso!" });
    setIsPaymentDialogOpen(false);
    setSelectedAppointmentForPayment(null);
  };

  const handleStartRecording = async () => {
    try {
      await audioRecorder.startRecording();
    } catch {
      toast({
        title: "Erro ao iniciar gravação",
        description: "Verifique as permissões do microfone.",
        variant: "destructive",
      });
    }
  };

  const handleStopAndTranscribe = async () => {
    audioRecorder.stopRecording();
    // Wait a moment for the blob to be ready
    setTimeout(async () => {
      if (audioRecorder.audioBlob && selectedSession) {
        setIsTranscribing(true);
        try {
          // Upload recording
          const file = new File(
            [audioRecorder.audioBlob],
            `recording_${Date.now()}.webm`,
            { type: audioRecorder.audioBlob.type }
          );
          await sessionsService.uploadSessionFile(selectedSession.id, file, true);
          await loadSessionFiles(selectedSession.id);

          // Transcribe
          const transcription = await sessionsService.transcribeAudio(audioRecorder.audioBlob);
          await handleUpdateSession({
            transcription: selectedSession.transcription
              ? `${selectedSession.transcription}\n\n--- Nova gravação ---\n${transcription}`
              : transcription,
          });
          audioRecorder.resetRecording();
        } catch (error) {
          console.error("Error transcribing:", error);
          toast({
            title: "Erro na transcrição",
            variant: "destructive",
          });
        } finally {
          setIsTranscribing(false);
        }
      }
    }, 500);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedSession || !e.target.files?.length) return;
    const file = e.target.files[0];
    try {
      await sessionsService.uploadSessionFile(selectedSession.id, file);
      await loadSessionFiles(selectedSession.id);
      toast({ title: "Arquivo enviado!" });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Erro ao enviar arquivo",
        variant: "destructive",
      });
    }
    e.target.value = "";
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedSession || !e.target.files?.length) return;
    const file = e.target.files[0];
    setIsTranscribing(true);
    try {
      // Upload file
      await sessionsService.uploadSessionFile(selectedSession.id, file, true);
      await loadSessionFiles(selectedSession.id);

      // Transcribe
      const transcription = await sessionsService.transcribeAudio(file);
      await handleUpdateSession({
        transcription: selectedSession.transcription
          ? `${selectedSession.transcription}\n\n--- Áudio importado ---\n${transcription}`
          : transcription,
      });
    } catch (error) {
      console.error("Error transcribing uploaded audio:", error);
      toast({
        title: "Erro na transcrição",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
    e.target.value = "";
  };

  const handleDeleteFile = async (file: SessionFile) => {
    if (!confirm("Excluir este arquivo?")) return;
    try {
      await sessionsService.deleteSessionFile(file.id, file.storage_path);
      setSessionFiles((prev) => prev.filter((f) => f.id !== file.id));
      toast({ title: "Arquivo excluído!" });
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({
        title: "Erro ao excluir arquivo",
        variant: "destructive",
      });
    }
  };

  const handleDownloadFile = async (file: SessionFile) => {
    try {
      const url = await sessionsService.getFileUrl(file.storage_path);
      window.open(url, "_blank");
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const lastSession = useMemo(() => sessions.find((s) => s.status === "completed"), [sessions]);
  const nextSession = useMemo(
    () =>
      sessions.find(
        (s) => s.status === "scheduled" && new Date(s.session_date) > new Date()
      ),
    [sessions]
  );
  const completedCount = useMemo(
    () => sessions.filter((s) => s.status === "completed").length,
    [sessions]
  );

  const StatusIcon = ({ status }: { status: SessionStatus }) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-rose-600" />;
      case "rescheduled":
        return <RefreshCw className="w-4 h-4 text-amber-600" />;
      case "no_show":
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <CalendarDays className="w-4 h-4 text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <Card className="card-glass">
        <CardContent className="p-6 text-center text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          Carregando sessões...
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid xl:grid-cols-[2fr,1fr] gap-6 items-start">
        <Card className="card-glass">
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-lg font-semibold text-foreground">Histórico de Sessões</div>
                <div className="text-sm text-muted-foreground">
                  Registre, acompanhe e analise cada encontro terapêutico.
                </div>
              </div>
              <div className="flex gap-2">
                {sessions.length === 0 && (
                  <Button onClick={() => setIsAnamnesisOpen(true)} variant="outline" className="rounded-full">
                    <ClipboardList className="w-4 h-4 mr-2" /> Anamnese Inicial
                  </Button>
                )}
                <Button onClick={() => setIsCreateOpen(true)} className="rounded-full">
                  <Plus className="w-4 h-4 mr-2" /> Nova Sessão
                </Button>
              </div>
            </div>

            {/* Appointments List with Session/Payment Actions */}
            {appointments.length > 0 && (
              <div className="rounded-xl border border-border/60 bg-gradient-to-br from-blue-50/50 to-primary/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDays className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Agendamentos do Paciente</h3>
                  <Badge variant="secondary" className="ml-auto">{appointments.length}</Badge>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {appointments
                    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
                    .map((appt) => {
                      const linkedSession = sessions.find(s => s.appointment_id === appt.id);
                      const isPast = new Date(appt.dateTime) < new Date();
                      const statusColors: Record<string, string> = {
                        scheduled: "bg-blue-100 text-blue-700",
                        confirmed: "bg-emerald-100 text-emerald-700",
                        done: "bg-green-100 text-green-700",
                        cancelled: "bg-red-100 text-red-700",
                      };
                      const statusLabels: Record<string, string> = {
                        scheduled: "Agendado",
                        confirmed: "Confirmado",
                        done: "Realizado",
                        cancelled: "Cancelado",
                      };

                      return (
                        <div
                          key={appt.id}
                          className="flex items-center justify-between gap-3 p-3 bg-white rounded-lg border border-border/50"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${appt.status === "done" ? "bg-green-500" : appt.status === "cancelled" ? "bg-red-500" : isPast ? "bg-amber-500" : "bg-blue-500"}`} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {new Date(appt.dateTime).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(appt.dateTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                <Badge className={`text-xs ${statusColors[appt.status] || "bg-gray-100 text-gray-700"}`}>
                                  {statusLabels[appt.status] || appt.status}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                <span>{appt.mode === "online" ? "Online" : "Presencial"}</span>
                                {linkedSession && (
                                  <span className="flex items-center gap-1 text-emerald-600">
                                    <CheckCircle2 className="w-3 h-3" /> Sessão registrada
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!linkedSession && appt.status !== "cancelled" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleImportFromAppointment(appt);
                                }}
                              >
                                <FileText className="w-3 h-3 mr-1" />
                                Registrar Sessão
                              </Button>
                            )}
                            {(appt.status === "done" || linkedSession?.status === "completed") && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs text-emerald-600 hover:text-emerald-700 hover:border-emerald-300"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRegisterPayment(appt);
                                }}
                              >
                                <CreditCard className="w-3 h-3 mr-1" />
                                Registrar Pagamento
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {sessions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-white/70 p-8 text-center">
                <ClipboardList className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                <div className="text-sm text-muted-foreground mb-1">
                  Nenhuma sessão registrada ainda.
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Comece registrando uma anamnese inicial para documentar o histórico do paciente.
                </p>
                <div className="flex justify-center gap-2">
                  <Button
                    onClick={() => setIsAnamnesisOpen(true)}
                    className="rounded-full"
                  >
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Registrar Anamnese Inicial
                  </Button>
                  <Button
                    onClick={() => setIsCreateOpen(true)}
                    variant="outline"
                    className="rounded-full"
                  >
                    Sessão Simples
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => {
                  const config = SESSION_STATUS_CONFIG[session.status];
                  return (
                    <div
                      key={session.id}
                      className="rounded-xl border border-border/60 bg-white p-4 hover:border-primary/30 transition-colors cursor-pointer"
                      onClick={() => handleViewSession(session)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <StatusIcon status={session.status} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {formatDateTime(session.session_date)}
                              </span>
                              <Badge className={`text-xs ${config.bgColor} ${config.color}`}>
                                {config.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              {session.duration_minutes && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDuration(session.duration_minutes)}
                                </span>
                              )}
                              {session.summary && (
                                <span className="flex items-center gap-1">
                                  <FileText className="w-3 h-3" /> Resumo
                                </span>
                              )}
                              {session.ai_generated_summary && (
                                <span className="flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" /> IA
                                </span>
                              )}
                              {session.transcription && (
                                <span className="flex items-center gap-1">
                                  <Mic className="w-3 h-3" /> Transcrição
                                </span>
                              )}
                            </div>
                            {session.summary && (
                              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                {session.summary}
                              </p>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="bg-white/90 border border-border/60">
            <CardContent className="p-6 space-y-4">
              <div className="text-sm font-medium text-muted-foreground">Resumo</div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Total de sessões</span>
                  <span className="font-medium">{sessions.length}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Realizadas</span>
                  <span className="font-medium text-emerald-600">{completedCount}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Última sessão</span>
                  <span className="font-medium">
                    {lastSession ? formatDateTime(lastSession.session_date).split(",")[0] : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Próxima sessão</span>
                  <span className="font-medium text-blue-600">
                    {nextSession ? formatDateTime(nextSession.session_date).split(",")[0] : "—"}
                  </span>
                </div>
              </div>
              
              {completedCount >= 2 && (
                <Button
                  onClick={handleGenerateEvolutionReport}
                  disabled={isGeneratingEvolution}
                  variant="outline"
                  className="w-full"
                >
                  {isGeneratingEvolution ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <TrendingUp className="w-4 h-4 mr-2" />
                  )}
                  Gerar Relatório Evolutivo
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Agendamentos não vinculados */}
          {unlinkedAppointments.length > 0 && (
            <Card className="bg-amber-50/80 border border-amber-200">
              <CardContent className="p-6 space-y-3">
                <div className="text-sm font-medium text-amber-700 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Agendamentos sem sessão ({unlinkedAppointments.length})
                </div>
                <div className="space-y-2">
                  {unlinkedAppointments.slice(0, 5).map((appt) => (
                    <div
                      key={appt.id}
                      className="flex items-center justify-between text-sm bg-white rounded-lg p-2 border border-amber-200"
                    >
                      <span className="text-muted-foreground">
                        {new Date(appt.dateTime).toLocaleDateString("pt-BR")}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-primary h-7"
                        onClick={() => handleImportFromAppointment(appt)}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Criar sessão
                      </Button>
                    </div>
                  ))}
                </div>
                {unlinkedAppointments.length > 5 && (
                  <p className="text-xs text-amber-600">
                    +{unlinkedAppointments.length - 5} agendamentos não exibidos
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="bg-white/90 border border-border/60">
            <CardContent className="p-6 space-y-3">
              <div className="text-sm font-medium text-muted-foreground">Recursos IA</div>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <Mic className="w-4 h-4 mt-0.5 text-primary" />
                  <span>Grave ou importe áudios para transcrição automática</span>
                </li>
                <li className="flex items-start gap-2">
                  <Brain className="w-4 h-4 mt-0.5 text-primary" />
                  <span>Gere resumos e insights com IA</span>
                </li>
                <li className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 mt-0.5 text-primary" />
                  <span>Relatório evolutivo com análise de múltiplas sessões</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Session Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Sessão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data e hora</Label>
                <Input
                  type="datetime-local"
                  value={newSession.session_date}
                  onChange={(e) => setNewSession({ ...newSession, session_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Duração (min)</Label>
                <Input
                  type="number"
                  value={newSession.duration_minutes}
                  onChange={(e) =>
                    setNewSession({ ...newSession, duration_minutes: parseInt(e.target.value) || 50 })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={newSession.status}
                onValueChange={(value: SessionStatus) =>
                  setNewSession({ ...newSession, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SESSION_STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Vinculação com agendamento */}
            {unlinkedAppointments.length > 0 && (
              <div>
                <Label className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" /> Vincular a agendamento
                </Label>
                <Select
                  value={newSession.appointment_id}
                  onValueChange={(value) =>
                    setNewSession({ ...newSession, appointment_id: value === "none" ? "" : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhum (sessão avulsa)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum (sessão avulsa)</SelectItem>
                    {unlinkedAppointments.map((appt) => (
                      <SelectItem key={appt.id} value={appt.id}>
                        {new Date(appt.dateTime).toLocaleDateString("pt-BR")} - {appt.mode === "online" ? "Online" : "Presencial"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Vincular sincroniza status entre sessão e agendamento
                </p>
              </div>
            )}
            
            {newSession.appointment_id && (
              <div className="rounded-lg bg-primary/10 border border-primary/30 p-3 text-sm text-primary flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Sessão será vinculada ao agendamento selecionado
              </div>
            )}
            <div>
              <Label>Notas detalhadas</Label>
              <Textarea
                value={newSession.detailed_notes}
                onChange={(e) => setNewSession({ ...newSession, detailed_notes: e.target.value })}
                placeholder="Registre observações, temas discutidos, intervenções..."
                rows={4}
              />
            </div>
            <div>
              <Label>Resumo</Label>
              <Textarea
                value={newSession.summary}
                onChange={(e) => setNewSession({ ...newSession, summary: e.target.value })}
                placeholder="Resumo breve da sessão..."
                rows={2}
              />
            </div>
            <div>
              <Label>Observações clínicas (privado)</Label>
              <Textarea
                value={newSession.clinical_observations}
                onChange={(e) =>
                  setNewSession({ ...newSession, clinical_observations: e.target.value })
                }
                placeholder="Anotações internas, hipóteses diagnósticas..."
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleCreateSession}>Criar Sessão</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View/Edit Session Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedSession && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-2">
                    <StatusIcon status={selectedSession.status} />
                    Sessão de {formatDateTime(selectedSession.session_date)}
                  </DialogTitle>
                  <Badge
                    className={`${SESSION_STATUS_CONFIG[selectedSession.status].bgColor} ${
                      SESSION_STATUS_CONFIG[selectedSession.status].color
                    }`}
                  >
                    {SESSION_STATUS_CONFIG[selectedSession.status].label}
                  </Badge>
                </div>
              </DialogHeader>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="details" className="flex-1">
                    <FileText className="w-4 h-4 mr-2" /> Detalhes
                  </TabsTrigger>
                  <TabsTrigger value="recording" className="flex-1">
                    <Mic className="w-4 h-4 mr-2" /> Gravação
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="flex-1">
                    <Brain className="w-4 h-4 mr-2" /> IA
                  </TabsTrigger>
                  <TabsTrigger value="files" className="flex-1">
                    <Upload className="w-4 h-4 mr-2" /> Arquivos
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Status</Label>
                      <Select
                        value={selectedSession.status}
                        onValueChange={(value: SessionStatus) =>
                          handleUpdateSession({ status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(SESSION_STATUS_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              {config.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Duração (min)</Label>
                      <Input
                        type="number"
                        value={selectedSession.duration_minutes || ""}
                        onChange={(e) =>
                          handleUpdateSession({ duration_minutes: parseInt(e.target.value) || undefined })
                        }
                      />
                    </div>
                  </div>

                  {selectedSession.status === "cancelled" && (
                    <div>
                      <Label>Motivo do cancelamento</Label>
                      <Textarea
                        value={selectedSession.cancellation_reason || ""}
                        onChange={(e) =>
                          handleUpdateSession({ cancellation_reason: e.target.value })
                        }
                        placeholder="Descreva o motivo..."
                      />
                    </div>
                  )}

                  <div>
                    <Label>Notas detalhadas</Label>
                    <Textarea
                      value={selectedSession.detailed_notes || ""}
                      onChange={(e) => handleUpdateSession({ detailed_notes: e.target.value })}
                      placeholder="Registre observações, temas discutidos, intervenções..."
                      rows={5}
                    />
                  </div>

                  <div>
                    <Label>Resumo</Label>
                    <Textarea
                      value={selectedSession.summary || ""}
                      onChange={(e) => handleUpdateSession({ summary: e.target.value })}
                      placeholder="Resumo breve da sessão..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Observações clínicas (privado)</Label>
                    <Textarea
                      value={selectedSession.clinical_observations || ""}
                      onChange={(e) =>
                        handleUpdateSession({ clinical_observations: e.target.value })
                      }
                      placeholder="Anotações internas, hipóteses diagnósticas..."
                      rows={3}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="recording" className="space-y-4 mt-4">
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-6">
                    <div className="text-center mb-6">
                      <div className="text-2xl font-mono mb-2">
                        {audioRecorder.formatDuration(audioRecorder.duration)}
                      </div>
                      {audioRecorder.isRecording && (
                        <div className="flex items-center justify-center gap-2 text-rose-600">
                          <span className="w-3 h-3 bg-rose-600 rounded-full animate-pulse" />
                          {audioRecorder.isPaused ? "Pausado" : "Gravando..."}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-center gap-4">
                      {!audioRecorder.isRecording && !audioRecorder.audioBlob && (
                        <Button onClick={handleStartRecording} className="rounded-full px-6">
                          <Mic className="w-4 h-4 mr-2" /> Iniciar Gravação
                        </Button>
                      )}

                      {audioRecorder.isRecording && (
                        <>
                          {audioRecorder.isPaused ? (
                            <Button onClick={audioRecorder.resumeRecording} variant="outline">
                              <Play className="w-4 h-4 mr-2" /> Continuar
                            </Button>
                          ) : (
                            <Button onClick={audioRecorder.pauseRecording} variant="outline">
                              <Pause className="w-4 h-4 mr-2" /> Pausar
                            </Button>
                          )}
                          <Button onClick={handleStopAndTranscribe} variant="destructive">
                            <Square className="w-4 h-4 mr-2" /> Parar e Transcrever
                          </Button>
                        </>
                      )}

                      {audioRecorder.audioBlob && !isTranscribing && (
                        <>
                          <audio src={audioRecorder.audioUrl || undefined} controls className="max-w-xs" />
                          <Button onClick={audioRecorder.resetRecording} variant="outline">
                            Nova gravação
                          </Button>
                        </>
                      )}

                      {isTranscribing && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Transcrevendo...
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-center">
                    <span className="text-sm text-muted-foreground">ou</span>
                  </div>

                  <div>
                    <Label>Importar áudio</Label>
                    <Input
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioUpload}
                      disabled={isTranscribing}
                    />
                  </div>

                  {selectedSession.transcription && (
                    <div>
                      <Label>Transcrição</Label>
                      <Textarea
                        value={selectedSession.transcription}
                        onChange={(e) => handleUpdateSession({ transcription: e.target.value })}
                        rows={10}
                        className="font-mono text-sm"
                      />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="ai" className="space-y-4 mt-4">
                  <div className="flex gap-4">
                    <Button
                      onClick={handleGenerateSummary}
                      disabled={
                        isGeneratingSummary ||
                        (!selectedSession.detailed_notes && !selectedSession.transcription)
                      }
                    >
                      {isGeneratingSummary ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      Gerar Resumo
                    </Button>
                    <Button
                      onClick={handleGenerateInsights}
                      variant="outline"
                      disabled={
                        isGeneratingSummary ||
                        (!selectedSession.detailed_notes && !selectedSession.transcription)
                      }
                    >
                      {isGeneratingSummary ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Brain className="w-4 h-4 mr-2" />
                      )}
                      Extrair Insights
                    </Button>
                  </div>

                  {!selectedSession.detailed_notes && !selectedSession.transcription && (
                    <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-700">
                      Adicione notas ou uma transcrição para utilizar os recursos de IA.
                    </div>
                  )}

                  {selectedSession.ai_generated_summary && (
                    <div>
                      <Label className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" /> Resumo gerado por IA
                      </Label>
                      <div className="rounded-xl border border-border/60 bg-primary/5 p-4 text-sm whitespace-pre-line mt-2">
                        {selectedSession.ai_generated_summary}
                      </div>
                    </div>
                  )}

                  {selectedSession.ai_insights && (
                    <div className="space-y-4">
                      <Label className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-primary" /> Insights extraídos
                      </Label>

                      {selectedSession.ai_insights.keyPoints?.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-2">
                            Pontos-chave
                          </div>
                          <ul className="list-disc pl-5 text-sm space-y-1">
                            {selectedSession.ai_insights.keyPoints.map((point, i) => (
                              <li key={i}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {selectedSession.ai_insights.emotionalThemes?.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-2">
                            Temas emocionais
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedSession.ai_insights.emotionalThemes.map((theme, i) => (
                              <Badge key={i} variant="secondary">
                                {theme}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedSession.ai_insights.suggestedActions?.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-2">
                            Ações sugeridas
                          </div>
                          <ul className="list-disc pl-5 text-sm space-y-1">
                            {selectedSession.ai_insights.suggestedActions.map((action, i) => (
                              <li key={i}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {selectedSession.ai_insights.riskFactors?.length > 0 && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                          <div className="text-xs font-medium text-rose-700 mb-2">
                            Fatores de risco identificados
                          </div>
                          <ul className="list-disc pl-5 text-sm text-rose-700 space-y-1">
                            {selectedSession.ai_insights.riskFactors.map((factor, i) => (
                              <li key={i}>{factor}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {selectedSession.ai_insights.progressIndicators?.length > 0 && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                          <div className="text-xs font-medium text-emerald-700 mb-2">
                            Indicadores de progresso
                          </div>
                          <ul className="list-disc pl-5 text-sm text-emerald-700 space-y-1">
                            {selectedSession.ai_insights.progressIndicators.map((indicator, i) => (
                              <li key={i}>{indicator}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="files" className="space-y-4 mt-4">
                  <div>
                    <Label>Enviar arquivo</Label>
                    <Input type="file" onChange={handleFileUpload} />
                  </div>

                  {sessionFiles.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/70 bg-white/70 p-6 text-center text-sm text-muted-foreground">
                      Nenhum arquivo anexado a esta sessão.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sessionFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between rounded-xl border border-border/60 bg-white p-3"
                        >
                          <div className="flex items-center gap-3">
                            {file.is_recording ? (
                              <Volume2 className="w-5 h-5 text-primary" />
                            ) : (
                              <FileText className="w-5 h-5 text-muted-foreground" />
                            )}
                            <div>
                              <div className="text-sm font-medium">{file.file_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {file.file_size
                                  ? `${(file.file_size / 1024).toFixed(1)} KB`
                                  : ""}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownloadFile(file)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-rose-600"
                              onClick={() => handleDeleteFile(file)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex justify-between pt-4 border-t">
                <Button
                  variant="ghost"
                  className="text-rose-600"
                  onClick={() => handleDeleteSession(selectedSession.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Excluir sessão
                </Button>
                <DialogClose asChild>
                  <Button>Fechar</Button>
                </DialogClose>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Evolution Report Dialog */}
      <Dialog open={isEvolutionOpen} onOpenChange={setIsEvolutionOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Relatório Evolutivo - {patientName}
            </DialogTitle>
          </DialogHeader>
          
          {evolutionReport && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border/60 bg-muted/30 p-6 text-sm whitespace-pre-wrap">
                {evolutionReport}
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={exportEvolutionReportPDF}>
                  <FileDown className="w-4 h-4 mr-2" /> Exportar PDF
                </Button>
                <DialogClose asChild>
                  <Button>Fechar</Button>
                </DialogClose>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Anamnesis Dialog */}
      <Dialog open={isAnamnesisOpen} onOpenChange={setIsAnamnesisOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Anamnese Inicial - {patientName}
            </DialogTitle>
            <DialogDescription>
              Preencha as informações da primeira sessão para documentar o histórico do paciente.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6">
              {/* Queixa Principal */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500" />
                  Queixa Principal *
                </Label>
                <Textarea
                  value={anamnesis.queixaPrincipal}
                  onChange={(e) => setAnamnesis({ ...anamnesis, queixaPrincipal: e.target.value })}
                  placeholder="Qual o motivo principal que trouxe o paciente à terapia?"
                  rows={3}
                />
              </div>

              {/* História do Problema Atual */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  História do Problema Atual
                </Label>
                <Textarea
                  value={anamnesis.historiaAtual}
                  onChange={(e) => setAnamnesis({ ...anamnesis, historiaAtual: e.target.value })}
                  placeholder="Quando começou? Como evoluiu? Fatores desencadeantes? Tentativas anteriores de tratamento?"
                  rows={4}
                />
              </div>

              {/* História Pregressa */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-500" />
                  História Pregressa
                </Label>
                <Textarea
                  value={anamnesis.historiaPregressa}
                  onChange={(e) => setAnamnesis({ ...anamnesis, historiaPregressa: e.target.value })}
                  placeholder="Histórico de saúde mental, tratamentos anteriores, internações, episódios relevantes..."
                  rows={3}
                />
              </div>

              {/* Histórico Familiar */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-500" />
                  Histórico Familiar
                </Label>
                <Textarea
                  value={anamnesis.historicoFamiliar}
                  onChange={(e) => setAnamnesis({ ...anamnesis, historicoFamiliar: e.target.value })}
                  placeholder="Composição familiar, relacionamentos, histórico de saúde mental na família..."
                  rows={3}
                />
              </div>

              {/* Saúde Geral */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Saúde Geral</Label>
                <Textarea
                  value={anamnesis.saudeGeral}
                  onChange={(e) => setAnamnesis({ ...anamnesis, saudeGeral: e.target.value })}
                  placeholder="Condições médicas atuais, doenças crônicas, cirurgias..."
                  rows={2}
                />
              </div>

              {/* Medicamentos */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Medicamentos em Uso</Label>
                <Textarea
                  value={anamnesis.medicamentos}
                  onChange={(e) => setAnamnesis({ ...anamnesis, medicamentos: e.target.value })}
                  placeholder="Liste os medicamentos atuais (psiquiátricos e outros)..."
                  rows={2}
                />
              </div>

              {/* Hábitos */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Hábitos e Estilo de Vida</Label>
                <Textarea
                  value={anamnesis.habitos}
                  onChange={(e) => setAnamnesis({ ...anamnesis, habitos: e.target.value })}
                  placeholder="Sono, alimentação, exercícios, uso de substâncias, rotina..."
                  rows={2}
                />
              </div>

              {/* Expectativas */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Expectativas em Relação ao Tratamento</Label>
                <Textarea
                  value={anamnesis.expectativas}
                  onChange={(e) => setAnamnesis({ ...anamnesis, expectativas: e.target.value })}
                  placeholder="O que o paciente espera alcançar com a terapia?"
                  rows={2}
                />
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Observações Adicionais</Label>
                <Textarea
                  value={anamnesis.observacoes}
                  onChange={(e) => setAnamnesis({ ...anamnesis, observacoes: e.target.value })}
                  placeholder="Outras informações relevantes, impressões iniciais..."
                  rows={3}
                />
              </div>
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSaveAnamnesis} disabled={!anamnesis.queixaPrincipal.trim()}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Salvar Anamnese
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Registrar Pagamento
            </DialogTitle>
            <DialogDescription>
              {selectedAppointmentForPayment && (
                <>
                  Sessão de {new Date(selectedAppointmentForPayment.dateTime).toLocaleDateString("pt-BR")}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Valor (R$) *</Label>
              <Input
                type="number"
                placeholder="0,00"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
              />
            </div>

            <div>
              <Label>Forma de Pagamento</Label>
              <Select
                value={paymentData.paymentMethod}
                onValueChange={(value) => setPaymentData({ ...paymentData, paymentMethod: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="convenio">Convênio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                placeholder="Observações sobre o pagamento..."
                value={paymentData.notes}
                onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSavePayment} disabled={!paymentData.amount}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Confirmar Pagamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
