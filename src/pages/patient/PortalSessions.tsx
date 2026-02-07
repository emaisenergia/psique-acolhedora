import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Clock,
  CheckCircle2,
  Video,
  MapPin,
  Plus,
  FileDown,
} from "lucide-react";
import { usePatientAuth } from "@/context/PatientAuth";
import { usePatientAppointments } from "@/hooks/usePatientData";
import PortalLayout from "@/components/patient/PortalLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const formatLongDate = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const day = d.getDate();
  const month = d.toLocaleDateString("pt-BR", { month: "long" });
  const year = d.getFullYear();
  return `${day} de ${month}, ${year}`;
};

const formatTime = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
};

const PortalSessions = () => {
  const { patient, isLoading } = usePatientAuth();
  const { toast } = useToast();
  const { appointments, createAppointment, updateAppointment } = usePatientAppointments();
  const [selected, setSelected] = useState<string | null>(null);
  const [historyRange, setHistoryRange] = useState<"30" | "90" | "all">("90");
  const [newSessionOpen, setNewSessionOpen] = useState(false);
  const [newSession, setNewSession] = useState({
    date: "",
    time: "",
    mode: "presencial" as "online" | "presencial",
    service: "Terapia Individual",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const myAppointments = useMemo(() => {
    return [...appointments].sort(
      (a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
    );
  }, [appointments]);

  const upcoming = myAppointments.filter(
    (a) => new Date(a.date_time).getTime() >= Date.now() && a.status !== "cancelled"
  );
  const history = myAppointments.filter(
    (a) => new Date(a.date_time).getTime() < Date.now() || a.status === "cancelled"
  );
  const doneHistory = history
    .filter((a) => a.status === "done")
    .sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime());

  const filteredHistory = useMemo(() => {
    if (historyRange === "all") return doneHistory;
    const days = historyRange === "30" ? 30 : 90;
    const since = new Date();
    since.setDate(since.getDate() - days);
    return doneHistory.filter((a) => new Date(a.date_time) >= since);
  }, [doneHistory, historyRange]);

  const handleCreateSession = async () => {
    if (!patient?.id || !newSession.date || !newSession.time) {
      toast({ title: "Preencha data e horário", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const dateTime = `${newSession.date}T${newSession.time}:00`;
    
    const { error } = await createAppointment({
      patient_id: patient.id,
      psychologist_id: null,
      date_time: dateTime,
      duration_minutes: 50,
      service: newSession.service,
      mode: newSession.mode,
      status: "scheduled",
      notes: newSession.notes || null,
      meeting_url: null,
    });

    setSubmitting(false);
    
    if (error) {
      toast({ title: "Erro ao agendar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sessão agendada!", description: "Aguarde a confirmação do psicólogo." });
      setNewSessionOpen(false);
      setNewSession({ date: "", time: "", mode: "presencial", service: "Terapia Individual", notes: "" });
    }
  };

  const handleCancelAppointment = async (id: string) => {
    const { error } = await updateAppointment(id, { status: "cancelled" });
    if (error) {
      toast({ title: "Erro ao cancelar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sessão cancelada" });
    }
  };

  const exportHistoryPdf = () => {
    const html = `<!doctype html><html><head><meta charset='utf-8'><title>Histórico de Sessões</title>
      <style>
        body{font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; padding:24px; color:#111827}
        h1{font-weight:600; margin:0 0 16px;}
        .row{padding:8px 0; border-bottom:1px solid #e5e7eb; font-size:14px}
      </style></head><body>
      <h1>Histórico de Sessões</h1>
      ${filteredHistory
        .map(
          (a) => `<div class='row'>${formatLongDate(a.date_time)} • ${formatTime(a.date_time)} • ${a.service || "Sessão"} • ${a.mode === "online" ? "Online" : "Presencial"}</div>`
        )
        .join("")}
      <script>setTimeout(()=>window.print(), 100);</script>
      </body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PortalLayout>
      {/* Header row */}
      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-xl font-display font-light">Próximas Sessões</h2>
        <Dialog open={newSessionOpen} onOpenChange={setNewSessionOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="rounded-full inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Nova Sessão
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Solicitar Nova Sessão</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Data</label>
                  <Input
                    type="date"
                    value={newSession.date}
                    onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Horário</label>
                  <Input
                    type="time"
                    value={newSession.time}
                    onChange={(e) => setNewSession({ ...newSession, time: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Modalidade</label>
                <Select
                  value={newSession.mode}
                  onValueChange={(v) => setNewSession({ ...newSession, mode: v as "online" | "presencial" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Serviço</label>
                <Select
                  value={newSession.service}
                  onValueChange={(v) => setNewSession({ ...newSession, service: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Terapia Individual">Terapia Individual</SelectItem>
                    <SelectItem value="Terapia de Casal">Terapia de Casal</SelectItem>
                    <SelectItem value="Orientação Familiar">Orientação Familiar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Observações (opcional)</label>
                <Textarea
                  placeholder="Alguma preferência ou observação?"
                  value={newSession.notes}
                  onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleCreateSession}
                disabled={submitting || !newSession.date || !newSession.time}
              >
                {submitting ? "Agendando..." : "Solicitar Agendamento"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-4 grid lg:grid-cols-2 gap-6 items-start">
        {/* Left list */}
        <div className="space-y-6">
          {upcoming.length === 0 && (
            <Card className="card-glass">
              <CardContent className="p-6 text-muted-foreground">Nenhuma sessão futura agendada.</CardContent>
            </Card>
          )}
          {upcoming.map((a) => {
            const dateStr = formatLongDate(a.date_time);
            const timeStr = formatTime(a.date_time);
            const isOnline = a.mode === "online";
            const isCancelled = a.status === "cancelled";
            return (
              <Card
                key={a.id}
                className={`bg-card/90 border ${selected === a.id ? 'border-primary/60' : 'border-border/60'} shadow-card rounded-2xl cursor-pointer`}
                onClick={() => setSelected(a.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">{dateStr}</div>
                      <div className="mt-1 text-sm text-muted-foreground inline-flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" /> {timeStr} • {a.duration_minutes} min • {isOnline ? "Online" : "Presencial"}
                      </div>

                      <div className="mt-4">
                        <div className="font-semibold">{a.service || "Terapia Individual"}</div>
                        {a.notes && <div className="text-sm text-muted-foreground">Observações: {a.notes}</div>}
                      </div>
                    </div>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        isCancelled ? 'bg-rose-100 text-rose-700' : 
                        a.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {isCancelled ? 'Cancelada' : a.status === 'confirmed' ? 'Confirmada' : 'Aguardando'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isOnline && a.meeting_url ? (
                        <a href={a.meeting_url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="btn-futuristic rounded-full inline-flex items-center gap-2">
                            <Video className="w-4 h-4" /> Entrar
                          </Button>
                        </a>
                      ) : isOnline ? (
                        <Button size="sm" disabled className="rounded-full inline-flex items-center gap-2">
                          <Video className="w-4 h-4" /> Link em breve
                        </Button>
                      ) : null}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-muted-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelAppointment(a.id);
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                    <div className="text-muted-foreground">
                      <span className="inline-flex items-center gap-1 text-xs">
                        {isOnline ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />} 
                        {isOnline ? "Videochamada" : "Consultório"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Right column: History */}
        <div>
          <Card className="bg-card/90 border border-border/60 rounded-2xl shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-lg font-medium">Histórico de Sessões</div>
                <div className="flex items-center gap-2">
                  <div className="bg-muted rounded-full p-1">
                    <div className="flex items-center">
                      {([
                        { k: "30", label: "30d" },
                        { k: "90", label: "90d" },
                        { k: "all", label: "Tudo" },
                      ] as const).map((opt) => (
                        <button
                          key={opt.k}
                          onClick={() => setHistoryRange(opt.k)}
                          className={`px-3 py-1 text-xs rounded-full ${
                            historyRange === opt.k ? "bg-card shadow-sm" : "text-muted-foreground"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-full inline-flex items-center gap-2" onClick={exportHistoryPdf}>
                    <FileDown className="w-4 h-4" /> Exportar PDF
                  </Button>
                </div>
              </div>
              {filteredHistory.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">Nenhuma sessão realizada ainda.</div>
              ) : (
                <div className="space-y-3 max-h-[560px] overflow-auto pr-2">
                  {filteredHistory.map((a) => (
                    <div key={a.id} className="flex items-start justify-between p-3 border border-border/60 rounded-xl bg-card/80">
                      <div className="text-sm">
                        <div className="font-medium">{formatLongDate(a.date_time)}</div>
                        <div className="text-muted-foreground">{formatTime(a.date_time)} • {a.service || 'Sessão'} • {a.mode === 'online' ? 'Online' : 'Presencial'}</div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
                        <CheckCircle2 className="w-4 h-4" /> Concluída
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="h-16" />
    </PortalLayout>
  );
};

export default PortalSessions;
