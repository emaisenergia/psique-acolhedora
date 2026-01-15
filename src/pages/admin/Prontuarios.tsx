import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Search,
  FileText,
  User,
  Calendar,
  Clock,
  ChevronRight,
  Brain,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileDown,
  Loader2,
  BookOpen,
  ClipboardList,
  Activity,
  RefreshCw,
} from "lucide-react";
import { sessionsService, SESSION_STATUS_CONFIG, type Session } from "@/lib/sessions";

interface Patient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  birth_date?: string;
  notes?: string;
}

interface PatientWithSessions extends Patient {
  sessions: Session[];
  totalSessions: number;
  completedSessions: number;
  lastSession?: Session;
  nextSession?: Session;
}

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
};

const formatDateTime = (iso?: string) => {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
};

const Prontuarios = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedPatient, setSelectedPatient] = useState<PatientWithSessions | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isPatientDialogOpen, setIsPatientDialogOpen] = useState(false);
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [isEvolutionDialogOpen, setIsEvolutionDialogOpen] = useState(false);
  const [evolutionReport, setEvolutionReport] = useState<string | null>(null);
  const [isGeneratingEvolution, setIsGeneratingEvolution] = useState(false);

  // Load patients
  const loadPatients = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .order("name");
      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error("Error loading patients:", error);
      toast.error("Erro ao carregar pacientes");
    }
  }, []);

  // Load all sessions
  const loadSessions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .order("session_date", { ascending: false });
      if (error) throw error;
      setAllSessions((data || []) as Session[]);
    } catch (error) {
      console.error("Error loading sessions:", error);
      toast.error("Erro ao carregar sessões");
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadPatients(), loadSessions()]);
      setLoading(false);
    };
    loadData();
  }, [loadPatients, loadSessions]);

  // Combine patients with their sessions
  const patientsWithSessions = useMemo((): PatientWithSessions[] => {
    return patients.map((patient) => {
      const patientSessions = allSessions.filter((s) => s.patient_id === patient.id);
      const completedSessions = patientSessions.filter((s) => s.status === "completed");
      const now = new Date();
      const scheduledSessions = patientSessions.filter(
        (s) => s.status === "scheduled" && new Date(s.session_date) > now
      );
      
      return {
        ...patient,
        sessions: patientSessions,
        totalSessions: patientSessions.length,
        completedSessions: completedSessions.length,
        lastSession: completedSessions[0],
        nextSession: scheduledSessions.sort(
          (a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime()
        )[0],
      };
    });
  }, [patients, allSessions]);

  // Filter patients
  const filteredPatients = useMemo(() => {
    return patientsWithSessions.filter((patient) => {
      const matchesSearch =
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && patient.status === "active") ||
        (statusFilter === "inactive" && patient.status === "inactive");
      return matchesSearch && matchesStatus;
    });
  }, [patientsWithSessions, searchTerm, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalPatients = patients.length;
    const activePatients = patients.filter((p) => p.status === "active").length;
    const totalSessions = allSessions.length;
    const completedSessions = allSessions.filter((s) => s.status === "completed").length;
    const patientsWithRecords = patientsWithSessions.filter((p) => p.totalSessions > 0).length;
    return { totalPatients, activePatients, totalSessions, completedSessions, patientsWithRecords };
  }, [patients, allSessions, patientsWithSessions]);

  const handleOpenPatientRecord = (patient: PatientWithSessions) => {
    setSelectedPatient(patient);
    setIsPatientDialogOpen(true);
  };

  const handleOpenSession = (session: Session) => {
    setSelectedSession(session);
    setIsSessionDialogOpen(true);
  };

  const handleGenerateEvolutionReport = async () => {
    if (!selectedPatient) return;
    
    const completedSessions = selectedPatient.sessions.filter(
      (s) => s.status === "completed" && (s.detailed_notes || s.summary || s.transcription)
    );
    
    if (completedSessions.length < 2) {
      toast.error("É necessário ao menos 2 sessões completas para gerar o relatório evolutivo.");
      return;
    }

    setIsGeneratingEvolution(true);
    try {
      const { content } = await sessionsService.generateSummary("evolution", {
        patientName: selectedPatient.name,
        previousSessions: completedSessions.slice(0, 10).map((s) => ({
          date: s.session_date,
          summary: s.summary || s.ai_generated_summary,
          notes: s.detailed_notes,
          insights: s.ai_insights,
        })),
      });
      if (content) {
        setEvolutionReport(content);
        setIsEvolutionDialogOpen(true);
      }
    } catch (error) {
      console.error("Error generating evolution report:", error);
      toast.error("Erro ao gerar relatório evolutivo");
    } finally {
      setIsGeneratingEvolution(false);
    }
  };

  const exportEvolutionReportPDF = () => {
    if (!evolutionReport || !selectedPatient) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório Evolutivo - ${selectedPatient.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.6; }
          h1 { color: #333; border-bottom: 2px solid #7c3aed; padding-bottom: 10px; }
          .date { color: #666; font-size: 14px; margin-bottom: 30px; }
          .content { white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <h1>Relatório Evolutivo</h1>
        <p class="date">Paciente: ${selectedPatient.name} | Gerado em: ${new Date().toLocaleDateString("pt-BR")}</p>
        <div class="content">${evolutionReport}</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-rose-600" />;
      case "no_show":
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
      default:
        return <Clock className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-light">Prontuários</h1>
        <p className="text-muted-foreground">
          Gestão centralizada dos prontuários psicológicos e histórico clínico dos pacientes.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="card-glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.totalPatients}</p>
                <p className="text-sm text-muted-foreground">Pacientes cadastrados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.activePatients}</p>
                <p className="text-sm text-muted-foreground">Pacientes ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.patientsWithRecords}</p>
                <p className="text-sm text-muted-foreground">Com prontuário</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.completedSessions}</p>
                <p className="text-sm text-muted-foreground">Sessões registradas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="card-glass mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar paciente por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="active">Ativos</TabsTrigger>
                <TabsTrigger value="inactive">Inativos</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="icon" onClick={() => { loadPatients(); loadSessions(); }}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Patients List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredPatients.length === 0 ? (
        <Card className="card-glass">
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? "Nenhum paciente encontrado com os filtros aplicados." : "Nenhum paciente cadastrado."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPatients.map((patient) => (
            <Card
              key={patient.id}
              className="card-glass cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleOpenPatientRecord(patient)}
            >
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{patient.name}</h3>
                      <Badge variant={patient.status === "active" ? "default" : "secondary"} className="shrink-0">
                        {patient.status === "active" ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{patient.email}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <FileText className="w-4 h-4" />
                        <span>{patient.totalSessions} sessões</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{patient.completedSessions} realizadas</span>
                      </div>
                      {patient.lastSession && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>Última: {formatDate(patient.lastSession.session_date)}</span>
                        </div>
                      )}
                      {patient.nextSession && (
                        <div className="flex items-center gap-1.5 text-blue-600">
                          <Clock className="w-4 h-4" />
                          <span>Próxima: {formatDate(patient.nextSession.session_date)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Patient Record Dialog */}
      <Dialog open={isPatientDialogOpen} onOpenChange={setIsPatientDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Prontuário de {selectedPatient?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedPatient && (
            <div className="flex-1 overflow-hidden">
              {/* Patient Info Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={selectedPatient.status === "active" ? "default" : "secondary"}>
                    {selectedPatient.status === "active" ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total de Sessões</p>
                  <p className="font-semibold">{selectedPatient.totalSessions}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sessões Realizadas</p>
                  <p className="font-semibold text-emerald-600">{selectedPatient.completedSessions}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Última Sessão</p>
                  <p className="font-semibold">{selectedPatient.lastSession ? formatDate(selectedPatient.lastSession.session_date) : "—"}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/admin/pacientes/${selectedPatient.id}`}>
                    <User className="w-4 h-4 mr-2" />
                    Ver Perfil Completo
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateEvolutionReport}
                  disabled={isGeneratingEvolution || selectedPatient.completedSessions < 2}
                >
                  {isGeneratingEvolution ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <TrendingUp className="w-4 h-4 mr-2" />
                  )}
                  Relatório Evolutivo
                </Button>
              </div>

              {/* Sessions List */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Histórico de Sessões
                </h4>
                
                {selectedPatient.sessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma sessão registrada para este paciente.</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[350px] pr-4">
                    <div className="space-y-2">
                      {selectedPatient.sessions.map((session) => {
                        const statusConfig = SESSION_STATUS_CONFIG[session.status];
                        return (
                          <div
                            key={session.id}
                            className="p-3 rounded-lg border border-border/60 bg-background hover:bg-muted/30 cursor-pointer transition-colors"
                            onClick={() => handleOpenSession(session)}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {getStatusIcon(session.status)}
                                  <span className="font-medium">{formatDateTime(session.session_date)}</span>
                                  <Badge variant="outline" className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}>
                                    {statusConfig.label}
                                  </Badge>
                                </div>
                                {session.summary && (
                                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                    {session.summary}
                                  </p>
                                )}
                                {session.ai_generated_summary && !session.summary && (
                                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1 flex items-start gap-1">
                                    <Sparkles className="w-3 h-3 mt-0.5 shrink-0 text-purple-500" />
                                    {session.ai_generated_summary}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                                  {session.duration_minutes && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {session.duration_minutes} min
                                    </span>
                                  )}
                                  {session.detailed_notes && (
                                    <span className="flex items-center gap-1">
                                      <FileText className="w-3 h-3" />
                                      Notas detalhadas
                                    </span>
                                  )}
                                  {session.transcription && (
                                    <span className="flex items-center gap-1">
                                      <Brain className="w-3 h-3" />
                                      Transcrição
                                    </span>
                                  )}
                                  {session.ai_insights && (
                                    <span className="flex items-center gap-1 text-purple-600">
                                      <Sparkles className="w-3 h-3" />
                                      Insights IA
                                    </span>
                                  )}
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Session Detail Dialog */}
      <Dialog open={isSessionDialogOpen} onOpenChange={setIsSessionDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Detalhes da Sessão
            </DialogTitle>
          </DialogHeader>

          {selectedSession && (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6">
                {/* Session Info */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Data/Hora</p>
                    <p className="font-medium">{formatDateTime(selectedSession.session_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Duração</p>
                    <p className="font-medium">{selectedSession.duration_minutes ? `${selectedSession.duration_minutes} min` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge variant="outline" className={`${SESSION_STATUS_CONFIG[selectedSession.status].bgColor} ${SESSION_STATUS_CONFIG[selectedSession.status].color} border-0`}>
                      {SESSION_STATUS_CONFIG[selectedSession.status].label}
                    </Badge>
                  </div>
                </div>

                {/* Summary */}
                {(selectedSession.summary || selectedSession.ai_generated_summary) && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      {selectedSession.ai_generated_summary && !selectedSession.summary && (
                        <Sparkles className="w-4 h-4 text-purple-500" />
                      )}
                      Resumo
                    </h4>
                    <div className="p-3 bg-muted/30 rounded-lg text-sm">
                      {selectedSession.summary || selectedSession.ai_generated_summary}
                    </div>
                  </div>
                )}

                {/* Detailed Notes */}
                {selectedSession.detailed_notes && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Notas Detalhadas</h4>
                    <div className="p-3 bg-muted/30 rounded-lg text-sm whitespace-pre-wrap">
                      {selectedSession.detailed_notes}
                    </div>
                  </div>
                )}

                {/* Clinical Observations */}
                {selectedSession.clinical_observations && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      Observações Clínicas
                    </h4>
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm whitespace-pre-wrap">
                      {selectedSession.clinical_observations}
                    </div>
                  </div>
                )}

                {/* Transcription */}
                {selectedSession.transcription && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      Transcrição
                    </h4>
                    <div className="p-3 bg-muted/30 rounded-lg text-sm max-h-60 overflow-y-auto whitespace-pre-wrap">
                      {selectedSession.transcription}
                    </div>
                  </div>
                )}

                {/* AI Insights */}
                {selectedSession.ai_insights && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      Insights da IA
                    </h4>
                    <div className="space-y-3">
                      {selectedSession.ai_insights.keyPoints && selectedSession.ai_insights.keyPoints.length > 0 && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Pontos-Chave</p>
                          <ul className="text-sm space-y-1">
                            {selectedSession.ai_insights.keyPoints.map((point, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-blue-500">•</span>
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedSession.ai_insights.emotionalThemes && selectedSession.ai_insights.emotionalThemes.length > 0 && (
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">Temas Emocionais</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedSession.ai_insights.emotionalThemes.map((theme, i) => (
                              <Badge key={i} variant="secondary" className="bg-purple-100 dark:bg-purple-800">
                                {theme}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedSession.ai_insights.riskFactors && selectedSession.ai_insights.riskFactors.length > 0 && (
                        <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                          <p className="text-xs font-medium text-rose-700 dark:text-rose-300 mb-1">Fatores de Risco</p>
                          <ul className="text-sm space-y-1">
                            {selectedSession.ai_insights.riskFactors.map((risk, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <AlertCircle className="w-3 h-3 text-rose-500 mt-0.5 shrink-0" />
                                {risk}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedSession.ai_insights.suggestedActions && selectedSession.ai_insights.suggestedActions.length > 0 && (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-1">Ações Sugeridas</p>
                          <ul className="text-sm space-y-1">
                            {selectedSession.ai_insights.suggestedActions.map((action, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Cancellation Reason */}
                {selectedSession.status === "cancelled" && selectedSession.cancellation_reason && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-rose-500" />
                      Motivo do Cancelamento
                    </h4>
                    <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg text-sm">
                      {selectedSession.cancellation_reason}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Evolution Report Dialog */}
      <Dialog open={isEvolutionDialogOpen} onOpenChange={setIsEvolutionDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Relatório Evolutivo - {selectedPatient?.name}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="p-4 bg-muted/30 rounded-lg whitespace-pre-wrap text-sm">
              {evolutionReport}
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsEvolutionDialogOpen(false)}>
              Fechar
            </Button>
            <Button onClick={exportEvolutionReportPDF}>
              <FileDown className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Prontuarios;
