import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
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
  Eye,
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
} from "lucide-react";
import { sessionsService, SESSION_STATUS_CONFIG, type Session, type SessionFile, type SessionStatus } from "@/lib/sessions";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";

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
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const audioRecorder = useAudioRecorder();

  const [newSession, setNewSession] = useState({
    session_date: new Date().toISOString().slice(0, 16),
    duration_minutes: 50,
    status: "scheduled" as SessionStatus,
    detailed_notes: "",
    summary: "",
    clinical_observations: "",
  });

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
  }, [loadSessions]);

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
      await sessionsService.createSession({
        patient_id: patientId,
        session_date: new Date(newSession.session_date).toISOString(),
        duration_minutes: newSession.duration_minutes,
        status: newSession.status,
        detailed_notes: newSession.detailed_notes || undefined,
        summary: newSession.summary || undefined,
        clinical_observations: newSession.clinical_observations || undefined,
      });
      toast({ title: "Sessão criada com sucesso!" });
      setIsCreateOpen(false);
      setNewSession({
        session_date: new Date().toISOString().slice(0, 16),
        duration_minutes: 50,
        status: "scheduled",
        detailed_notes: "",
        summary: "",
        clinical_observations: "",
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
              <Button onClick={() => setIsCreateOpen(true)} className="rounded-full">
                <Plus className="w-4 h-4 mr-2" /> Nova Sessão
              </Button>
            </div>

            {sessions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-white/70 p-8 text-center">
                <CalendarDays className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                <div className="text-sm text-muted-foreground">
                  Nenhuma sessão registrada ainda.
                </div>
                <Button
                  onClick={() => setIsCreateOpen(true)}
                  variant="outline"
                  className="mt-4"
                >
                  Registrar primeira sessão
                </Button>
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
            </CardContent>
          </Card>

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
                  <FileUp className="w-4 h-4 mt-0.5 text-primary" />
                  <span>Anexe documentos e arquivos à sessão</span>
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
    </>
  );
};
