import { useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePatientAuth } from "@/context/PatientAuth";
import { usePatientMessages, usePatientActivities } from "@/hooks/usePatientData";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import PortalLayout from "@/components/patient/PortalLayout";
import {
  UserCircle,
  AlertTriangle,
  Send,
  CheckCircle2,
} from "lucide-react";

const formatDateTimeLong = (iso?: string) => {
  if (!iso) return "—";
  const date = new Date(iso);
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const PortalMessages = () => {
  const { patient, isLoading } = usePatientAuth();
  const { messages, loading, sendMessage, fetchMessages } = usePatientMessages();
  const { activities } = usePatientActivities();
  const [draft, setDraft] = useState("");
  const [urgency, setUrgency] = useState<"normal" | "urgente">("normal");
  const [submitting, setSubmitting] = useState(false);

  const handleMessagesChange = useCallback(() => {
    fetchMessages();
  }, [fetchMessages]);

  useRealtimeUpdates({
    table: "secure_messages",
    filter: patient?.id ? `patient_id=eq.${patient.id}` : undefined,
    onChange: handleMessagesChange,
    enabled: !!patient?.id,
  });

  const myMessages = useMemo(() => {
    return [...messages].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [messages]);

  const lastPsychologistMessage = useMemo(
    () =>
      [...myMessages]
        .reverse()
        .find((message) => message.author === "psychologist") || null,
    [myMessages]
  );

  const pendingActivities = useMemo(
    () => activities.filter((activity) => activity.status === "pending"),
    [activities]
  );

  const handleSubmit = async () => {
    const content = draft.trim();
    if (!content) return;
    
    setSubmitting(true);
    const { error } = await sendMessage(content, urgency === "urgente");
    setSubmitting(false);
    
    if (!error) {
      setDraft("");
      setUrgency("normal");
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PortalLayout>
      <div className="mt-8 grid xl:grid-cols-[2fr,1fr] gap-6 items-start">
        <Card className="card-glass">
          <CardContent className="p-6 space-y-6">
            <div>
              <div className="text-lg font-semibold">Envie uma mensagem segura</div>
              <div className="text-sm text-muted-foreground">
                Utilize este canal para falar com seu psicólogo. Em situações de risco imediato, entre em contato com serviços de emergência.
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">Sua mensagem</label>
                <Textarea
                  className="mt-2 min-h-[140px]"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Compartilhe como está se sentindo, dúvidas ou necessidades específicas."
                />
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Prioridade</label>
                  <Select value={urgency} onValueChange={(value: "normal" | "urgente") => setUrgency(value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Mensagens urgentes aparecem em destaque para o psicólogo.
                  </p>
                </div>
                <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-xs text-muted-foreground">
                  Para risco imediato, acione o <strong>188 (CVV)</strong> ou a emergência local.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              {pendingActivities.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {pendingActivities.length} atividade(s) pendente(s). Compartilhe dúvidas sobre elas!
                </div>
              )}
              <Button
                className="rounded-full inline-flex items-center gap-2"
                onClick={handleSubmit}
                disabled={!draft.trim() || submitting}
              >
                <Send className="w-4 h-4" />
                {submitting ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/90 border border-border/60">
          <CardContent className="p-6 space-y-4">
            <div className="text-sm font-medium text-muted-foreground">Acompanhamento</div>
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Último retorno</div>
              <div className="mt-2 text-sm text-foreground">
                {lastPsychologistMessage
                  ? `Resposta enviada em ${formatDateTimeLong(lastPsychologistMessage.created_at)}`
                  : "Ainda não há respostas registradas."}
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mensagens enviadas</div>
              <div className="mt-2 text-sm text-muted-foreground">
                {myMessages.filter((message) => message.author === "patient").length} no total
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-4 text-xs text-muted-foreground">
              Envie updates sempre que sentir necessidade. Seu psicólogo verá alertas para mensagens urgentes.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card className="bg-card/90 border border-border/60">
          <CardContent className="p-6 space-y-4">
            <div className="text-sm font-medium text-muted-foreground">Histórico de conversas</div>
            {myMessages.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-card/70 p-6 text-sm text-muted-foreground">
                Você ainda não enviou mensagens. Use o formulário acima para iniciar uma conversa.
              </div>
            ) : (
              <div className="space-y-3">
                {myMessages.map((message) => {
                  const isPatient = message.author === "patient";
                  return (
                    <div
                      key={message.id}
                      className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${
                        isPatient
                          ? "border-primary/40 bg-primary/5"
                          : "border-muted bg-card"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span className="flex items-center gap-2">
                          {isPatient ? (
                            <UserCircle className="w-3 h-3 text-primary" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          )}
                          {isPatient ? "Você" : "Terapeuta"}
                        </span>
                        <span>{formatDateTimeLong(message.created_at)}</span>
                      </div>
                      {message.urgent && (
                        <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                          <AlertTriangle className="w-3 h-3" /> Urgente
                        </div>
                      )}
                      <div className="text-sm text-foreground whitespace-pre-line">{message.content}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="h-16" />
    </PortalLayout>
  );
};

export default PortalMessages;
