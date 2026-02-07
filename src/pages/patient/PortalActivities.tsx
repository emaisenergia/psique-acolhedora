import { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { usePatientAuth } from "@/context/PatientAuth";
import { usePatientActivities, type PatientActivity, type ThreadComment } from "@/hooks/usePatientData";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { ActivityResponseDialog } from "@/components/activities/ActivityResponseDialog";
import { PatientActivityThreadDialog } from "@/components/activities/PatientActivityThreadDialog";
import { notifyActivityResponse, notifyThreadCommentToPsychologist } from "@/lib/notifications";
import { toast } from "sonner";
import {
  Shield,
  Calendar,
  BookOpen,
  FileText,
  MessageSquare,
  LogOut,
  CheckCircle2,
  Clock,
  Target,
  UserCircle,
  ClipboardList,
  Download,
  Paperclip,
  MessageCircle,
  Reply,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const formatDueDate = (iso?: string | null) => {
  if (!iso) return "Sem prazo definido";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long" }).format(new Date(iso));
};

const formatDateTimeLong = (iso?: string | null) => {
  if (!iso) return "—";
  const date = new Date(iso);
  const datePart = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
  const timePart = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${datePart}, ${timePart}`;
};

const PortalActivities = () => {
  const { logout, patient, isLoading } = usePatientAuth();
  const navigate = useNavigate();
  const { activities, loading, toggleActivityStatus, updateActivity, fetchActivities } = usePatientActivities();
  const [selectedActivity, setSelectedActivity] = useState<PatientActivity | null>(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [threadDialogOpen, setThreadDialogOpen] = useState(false);
  const [threadActivity, setThreadActivity] = useState<PatientActivity | null>(null);

  // Add realtime updates for activities
  const handleActivitiesChange = useCallback(() => {
    fetchActivities();
  }, [fetchActivities]);

  useRealtimeUpdates({
    table: "activities",
    filter: patient?.id ? `patient_id=eq.${patient.id}` : undefined,
    onChange: handleActivitiesChange,
    enabled: !!patient?.id,
  });

  const myActivities = useMemo(() => {
    return [...activities].sort((a, b) => {
      const aDue = a.due_date ? new Date(a.due_date).getTime() : Number.POSITIVE_INFINITY;
      const bDue = b.due_date ? new Date(b.due_date).getTime() : Number.POSITIVE_INFINITY;
      if (aDue !== bDue) return aDue - bDue;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [activities]);

  const pendingActivities = useMemo(
    () => myActivities.filter((activity) => activity.status === "pending"),
    [myActivities]
  );

  const completedActivities = useMemo(
    () => myActivities.filter((activity) => activity.status === "completed"),
    [myActivities]
  );

  const completionPct = myActivities.length
    ? Math.round((completedActivities.length / myActivities.length) * 100)
    : 0;

  const nextDueActivity = useMemo(() => {
    if (pendingActivities.length === 0) return null;
    return pendingActivities
      .slice()
      .sort((a, b) => {
        const aDue = a.due_date ? new Date(a.due_date).getTime() : Number.POSITIVE_INFINITY;
        const bDue = b.due_date ? new Date(b.due_date).getTime() : Number.POSITIVE_INFINITY;
        return aDue - bDue;
      })[0];
  }, [pendingActivities]);

  const lastCompletedActivity = useMemo(() => {
    if (completedActivities.length === 0) return null;
    return completedActivities
      .slice()
      .sort((a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime())[0];
  }, [completedActivities]);

  const TabButton = ({
    label,
    icon: Icon,
    active,
    onClick,
  }: {
    label: string;
    icon: any;
    active?: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm border inline-flex items-center gap-2 ${
        active
          ? "bg-primary/20 border-primary/50 text-foreground"
          : "bg-transparent text-muted-foreground border-border"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  const handleOpenResponse = (activity: PatientActivity) => {
    setSelectedActivity(activity);
    setResponseDialogOpen(true);
  };

  const handleSubmitResponses = async (activityId: string, responses: Record<string, string | boolean>) => {
    // Pass true for saveToHistory to track edits
    const result = await updateActivity(activityId, { patient_responses: responses } as any, true);
    
    // Send notification to psychologist
    if (!result.error && patient?.id && selectedActivity) {
      try {
        await notifyActivityResponse(patient.id, selectedActivity.title, patient.name || "Paciente");
      } catch (error) {
        console.error("Error sending notification to psychologist:", error);
      }
    }
  };

  const hasCustomContent = (activity: PatientActivity) => {
    return (activity.custom_fields && activity.custom_fields.length > 0) || activity.attachment_url;
  };

  const contentReady = myActivities.length > 0;

  if (isLoading || loading) {
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

      <div className="bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b border-border/60">
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
                <span>{patient?.name || "Paciente"}</span>
              </div>
              <Button
                variant="outline"
                className="btn-outline-futuristic inline-flex items-center gap-2"
                onClick={() => {
                  logout();
                  navigate("/portal");
                }}
              >
                <LogOut className="w-4 h-4" /> Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mt-4 border-b border-border/60">
          <div className="flex items-center gap-4 overflow-x-auto pb-3">
            <TabButton label="Visão Geral" icon={Shield} onClick={() => navigate("/portal/app")} />
            <TabButton label="Sessões" icon={Calendar} onClick={() => navigate("/portal/sessoes")} />
            <TabButton label="Plano de Tratamento" icon={Target} onClick={() => navigate("/portal/plano")} />
            <TabButton label="Atividades" icon={BookOpen} active onClick={() => {}} />
            <TabButton label="Anotações" icon={FileText} onClick={() => navigate("/portal/anotacoes")} />
            <TabButton label="Mensagens" icon={MessageSquare} onClick={() => navigate("/portal/mensagens")} />
          </div>
        </div>

        <div className="mt-8 grid lg:grid-cols-[2fr,1fr] gap-6 items-start">
          <Card className="card-glass">
            <CardContent className="p-6 space-y-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-lg font-semibold">Atividades em andamento</div>
                  <div className="text-sm text-muted-foreground">Conclua as tarefas combinadas com seu psicólogo para potencializar o tratamento.</div>
                </div>
                {contentReady && (
                  <div className="text-sm text-muted-foreground">
                    {completionPct}% concluídas
                  </div>
                )}
              </div>

              {!contentReady && (
                <div className="rounded-xl border border-dashed border-border/70 bg-card/70 p-6 text-sm text-muted-foreground">
                  Nenhuma atividade foi atribuída ainda. Assim que seu psicólogo cadastrar novas tarefas, elas aparecerão aqui.
                </div>
              )}

              {contentReady && (
                <div className="space-y-4">
                  {pendingActivities.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/70 bg-card/70 p-6 text-sm text-muted-foreground">
                      Você está em dia! Todas as atividades foram concluídas.
                    </div>
                  ) : (
                    pendingActivities.map((activity) => (
                      <div key={activity.id} className="rounded-xl border border-border/60 bg-card p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-foreground">{activity.title}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {activity.due_date ? `Prazo: ${formatDueDate(activity.due_date)}` : "Sem prazo"}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                Criado em {formatDateTimeLong(activity.created_at)}
                              </span>
                            </div>
                            {activity.description && (
                              <div className="mt-2 text-xs text-muted-foreground/90 whitespace-pre-line">
                                {activity.description}
                              </div>
                            )}
                            
                            {/* Indicators for custom content */}
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              {activity.attachment_url && (
                                <a
                                  href={activity.attachment_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                                >
                                  <Paperclip className="w-3 h-3" />
                                  {activity.attachment_name || "Arquivo anexo"}
                                  <Download className="w-3 h-3" />
                                </a>
                              )}
                              {activity.custom_fields && activity.custom_fields.length > 0 && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-purple-50 text-purple-700">
                                  <ClipboardList className="w-3 h-3" />
                                  {activity.custom_fields.length} campo(s) para preencher
                                </span>
                              )}
                              {activity.patient_responses && Object.keys(activity.patient_responses).length > 0 && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-emerald-50 text-emerald-700">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Respostas enviadas
                                </span>
                              )}
                              {activity.psychologist_feedback && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary">
                                  <MessageCircle className="w-3 h-3" />
                                  Feedback disponível
                                </span>
                              )}
                            </div>

                            {/* Psychologist Feedback Display */}
                            {activity.psychologist_feedback && (
                              <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <MessageCircle className="w-4 h-4 text-primary" />
                                    <span className="text-xs font-semibold text-primary">Feedback do seu psicólogo</span>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs gap-1"
                                    onClick={() => {
                                      setThreadActivity(activity);
                                      setThreadDialogOpen(true);
                                    }}
                                  >
                                    <Reply className="w-3 h-3" /> Responder
                                  </Button>
                                </div>
                                <div className="text-sm text-foreground whitespace-pre-line">
                                  {activity.psychologist_feedback}
                                </div>
                                {activity.feedback_at && (
                                  <div className="mt-2 text-xs text-muted-foreground">
                                    {format(new Date(activity.feedback_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                  </div>
                                )}
                                {activity.feedback_thread && activity.feedback_thread.length > 0 && (
                                  <div className="mt-2 text-xs text-primary">
                                    {activity.feedback_thread.length} comentário(s) na conversa
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 md:flex-col">
                            {hasCustomContent(activity) && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="rounded-full inline-flex items-center gap-2" 
                                onClick={() => handleOpenResponse(activity)}
                              >
                                <ClipboardList className="w-3 h-3" /> 
                                {activity.patient_responses ? "Ver / Editar" : "Responder"}
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              className="rounded-full inline-flex items-center gap-2" 
                              onClick={() => toggleActivityStatus(activity.id)}
                            >
                              <CheckCircle2 className="w-3 h-3" /> Marcar concluída
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/90 border border-border/60">
            <CardContent className="p-6 space-y-4">
              <div className="text-sm font-medium text-muted-foreground">Resumo</div>
              <div className="rounded-xl border border-border/60 bg-card p-4">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Progresso</div>
                <div className="mt-2">
                  <Progress value={completionPct} className="h-3 bg-primary/10" />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{completedActivities.length} concluída(s)</span>
                  <span>{pendingActivities.length} pendente(s)</span>
                </div>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-4">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Próximo passo</div>
                <div className="text-sm font-semibold text-foreground mt-1">
                  {nextDueActivity ? nextDueActivity.title : "Sem atividade pendente"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {nextDueActivity ? formatDueDate(nextDueActivity.due_date) : "Aguarde novas orientações do seu psicólogo"}
                </div>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-4">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Última conquista</div>
                <div className="text-sm font-semibold text-foreground mt-1">
                  {lastCompletedActivity ? lastCompletedActivity.title : "Ainda não concluída"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {lastCompletedActivity?.completed_at ? formatDateTimeLong(lastCompletedActivity.completed_at) : "Complete uma atividade para registrar seu avanço"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {contentReady && (
          <div className="mt-6">
            <Card className="bg-card/90 border border-border/60">
              <CardContent className="p-6 space-y-3">
                <div className="text-sm font-medium text-muted-foreground">Atividades concluídas</div>
                {completedActivities.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/70 bg-card/70 p-6 text-sm text-muted-foreground">
                    Assim que concluir uma atividade, ela aparecerá aqui para que você acompanhe sua evolução.
                  </div>
                ) : (
                  completedActivities.map((activity) => (
                    <div key={activity.id} className="rounded-xl border border-border/60 bg-card px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <div className="text-sm font-medium text-foreground flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          {activity.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {activity.completed_at ? `Concluída em ${formatDateTimeLong(activity.completed_at)}` : "Concluída"}
                        </div>
                        {activity.description && (
                          <div className="text-xs text-muted-foreground/90 whitespace-pre-line">
                            {activity.description}
                          </div>
                        )}
                      </div>
                      <div className="mt-3">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="rounded-full" 
                          onClick={() => toggleActivityStatus(activity.id)}
                        >
                          Reabrir atividade
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <div className="h-16" />
      </div>

      {/* Activity Response Dialog */}
      {selectedActivity && (
        <ActivityResponseDialog
          open={responseDialogOpen}
          onOpenChange={setResponseDialogOpen}
          activity={{
            id: selectedActivity.id,
            title: selectedActivity.title,
            description: selectedActivity.description,
            fields: selectedActivity.custom_fields || undefined,
            attachmentUrl: selectedActivity.attachment_url || undefined,
            attachmentName: selectedActivity.attachment_name || undefined,
          }}
          onSubmit={handleSubmitResponses}
        />
      )}

      {/* Thread Dialog */}
      {threadActivity && (
        <PatientActivityThreadDialog
          open={threadDialogOpen}
          onOpenChange={setThreadDialogOpen}
          activity={threadActivity}
          onAddComment={async (activityId, comment) => {
            const currentThread = threadActivity.feedback_thread || [];
            const newComment: ThreadComment = {
              id: crypto.randomUUID(),
              author: "patient",
              content: comment,
              created_at: new Date().toISOString(),
            };
            await updateActivity(activityId, { feedback_thread: [...currentThread, newComment] } as any);
            setThreadActivity({
              ...threadActivity,
              feedback_thread: [...currentThread, newComment],
            });
            
            // Send notification to psychologist
            if (patient?.id && threadActivity) {
              try {
                await notifyThreadCommentToPsychologist(
                  patient.id,
                  threadActivity.title,
                  patient.name || "Paciente",
                  comment
                );
              } catch (error) {
                console.error("Error sending thread notification:", error);
              }
            }
            
            toast.success("Comentário enviado!");
          }}
        />
      )}
    </div>
  );
};

export default PortalActivities;
