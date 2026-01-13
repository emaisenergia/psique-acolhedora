import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  FileText,
  BookOpen,
  MessageSquare,
  LogOut,
  Clock,
  CheckCircle2,
  XCircle,
  Shield,
  UserCircle,
  Video,
  MapPin,
  Plus,
  FileDown,
} from "lucide-react";
import { usePatientAuth } from "@/context/PatientAuth";
import { storage, type Appointment, type Patient } from "@/lib/storage";
import { useNavigate } from "react-router-dom";

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
  const { email, logout } = usePatientAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [historyRange, setHistoryRange] = useState<"30" | "90" | "all">("90");

  useEffect(() => {
    setPatients(storage.getPatients());
    setAppointments(storage.getAppointments());
  }, []);

  const me = useMemo(
    () =>
      patients.find(
        (p) => (p.email || "").toLowerCase() === (email || "").toLowerCase()
      ) || null,
    [patients, email]
  );

  const myAppointments = useMemo(() => {
    if (!me) return [] as Appointment[];
    return appointments
      .filter((a) => a.patientId === me.id)
      .slice()
      .sort(
        (a, b) =>
          new Date(a.dateTime || 0).getTime() -
          new Date(b.dateTime || 0).getTime()
      );
  }, [appointments, me]);

  const upcoming = myAppointments.filter(
    (a) => new Date(a.dateTime || 0).getTime() >= Date.now() && a.status !== "cancelled"
  );
  const history = myAppointments.filter(
    (a) => new Date(a.dateTime || 0).getTime() < Date.now() || a.status === "cancelled"
  );
  const doneHistory = history
    .filter((a) => a.status === "done")
    .slice()
    .sort((a, b) => new Date(b.dateTime || 0).getTime() - new Date(a.dateTime || 0).getTime());

  const filteredHistory = useMemo(() => {
    if (historyRange === "all") return doneHistory;
    const days = historyRange === "30" ? 30 : 90;
    const since = new Date();
    since.setDate(since.getDate() - days);
    return doneHistory.filter((a) => new Date(a.dateTime || 0) >= since);
  }, [doneHistory, historyRange]);

  const exportHistoryPdf = () => {
    const rows = filteredHistory
      .map((a) => `${formatLongDate(a.dateTime)} • ${formatTime(a.dateTime)} • ${a.service || "Sessão"} • ${a.mode === "online" ? "Online" : "Presencial"}`)
      .join("\n");
    const html = `<!doctype html><html><head><meta charset='utf-8'><title>Histórico de Sessões</title>
      <style>
        body{font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; padding:24px; color:#111827}
        h1{font-weight:600; margin:0 0 16px;}
        .row{padding:8px 0; border-bottom:1px solid #e5e7eb; font-size:14px}
      </style></head><body>
      <h1>Histórico de Sessões</h1>
      ${filteredHistory
        .map(
          (a) => `<div class='row'>${formatLongDate(a.dateTime)} • ${formatTime(a.dateTime)} • ${a.service || "Sessão"} • ${a.mode === "online" ? "Online" : "Presencial"}</div>`
        )
        .join("")}
      <script>setTimeout(()=>window.print(), 100);</script>
      </body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
  };

  const selectedAppt = myAppointments.find((a) => a.id === selected) || null;

  const TabButton = ({
    label,
    icon: Icon,
    active,
    onClick,
  }: { label: string; icon: any; active?: boolean; onClick: () => void }) => (
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
                <span>{me?.name || (email?.split("@")[0] || "Paciente")}</span>
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
        {/* Tabs */}
        <div className="mt-4 border-b border-border/60">
          <div className="flex items-center gap-4 overflow-x-auto pb-3">
            <TabButton label="Visão Geral" icon={Shield} onClick={() => navigate("/portal/app")} />
            <TabButton label="Sessões" icon={Calendar} active onClick={() => {}} />
            <TabButton label="Atividades" icon={BookOpen} onClick={() => navigate("/portal/atividades")} />
            <TabButton label="Anotações" icon={FileText} onClick={() => navigate("/portal/anotacoes")} />
            <TabButton label="Mensagens" icon={MessageSquare} onClick={() => navigate("/portal/mensagens")} />
          </div>
        </div>

        {/* Header row */}
        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-xl font-display font-light">Próximas Sessões</h2>
          <Button variant="outline" className="rounded-full inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nova Sessão
          </Button>
        </div>

        <div className="mt-4 grid lg:grid-cols-2 gap-6 items-start">
          {/* Left list */}
          <div className="space-y-6">
            {upcoming.length === 0 && (
              <Card className="card-glass">
                <CardContent className="p-6 text-muted-foreground">Nenhuma sessão futura.</CardContent>
              </Card>
            )}
            {upcoming.map((a) => {
              const dateStr = formatLongDate(a.dateTime);
              const timeStr = formatTime(a.dateTime);
              const isOnline = a.mode === "online";
              const isCancelled = a.status === "cancelled";
              return (
                <Card
                  key={a.id}
                  className={`bg-white/90 border ${selected === a.id ? 'border-primary/60' : 'border-border/60'} shadow-card rounded-2xl cursor-pointer`}
                  onClick={() => setSelected(a.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">{dateStr}</div>
                        <div className="mt-1 text-sm text-muted-foreground inline-flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" /> {timeStr} • 50 min • {isOnline ? "Online" : "Presencial"}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">{new Date(a.dateTime || 0).getTime() < Date.now() ? "Passado" : "Agendado"} • Lembrete enviado</div>

                        <div className="mt-4">
                          <div className="font-semibold">{a.service || "Terapia Individual"}</div>
                          <div className="text-sm text-muted-foreground">Foco: {a.notes || "Técnicas de relaxamento e gestão de ansiedade"}</div>
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <UserCircle className="w-5 h-5 text-primary" />
                          </div>
                          <div className="text-sm">
                            <div className="font-medium">Dra. Ana Silva</div>
                            <div className="text-muted-foreground">Psicóloga Clínica - CRP 06/12345</div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className={`px-3 py-1 rounded-full text-xs ${isCancelled ? 'bg-rose-100 text-rose-700' : 'bg-green-100 text-green-700'}`}>
                          {isCancelled ? 'Cancelada' : 'Confirmada'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isOnline ? (
                          <Button size="sm" className="btn-futuristic rounded-full inline-flex items-center gap-2">
                            <Video className="w-4 h-4" /> Entrar
                          </Button>
                        ) : null}
                        <Button variant="ghost" size="sm" className="text-muted-foreground">Reagendar</Button>
                      </div>
                      <div className="text-muted-foreground">
                        <span className="inline-flex items-center gap-1 text-xs">
                          {isOnline ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />} Detalhes
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* History moved to right column */}
          </div>

          {/* Right column: History of completed sessions */}
          <div>
            <Card className="bg-white/90 border border-border/60 rounded-2xl shadow-card">
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
                              historyRange === opt.k ? "bg-white shadow-sm" : "text-muted-foreground"
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
                      <div key={a.id} className="flex items-start justify-between p-3 border border-border/60 rounded-xl bg-white/80">
                        <div className="text-sm">
                          <div className="font-medium">{formatLongDate(a.dateTime)}</div>
                          <div className="text-muted-foreground">{formatTime(a.dateTime)} • {a.service || 'Sessão'} • {a.mode === 'online' ? 'Online' : 'Presencial'}</div>
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
      </div>
    </div>
  );
};

export default PortalSessions;
