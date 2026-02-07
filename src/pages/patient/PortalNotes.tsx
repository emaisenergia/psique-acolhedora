import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { usePatientAuth } from "@/context/PatientAuth";
import { usePatientJournal, usePatientActivities, type PatientJournalEntry } from "@/hooks/usePatientData";
import {
  Shield,
  Calendar,
  BookOpen,
  FileText,
  MessageSquare,
  LogOut,
  UserCircle,
  Smile,
  Heart,
  Meh,
  Frown,
  CloudRain,
  NotebookPen,
  Sparkles,
  LineChart,
  TrendingUp,
} from "lucide-react";
import { format, subDays, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const formatDateTimeLong = (iso?: string) => {
  if (!iso) return "—";
  const date = new Date(iso);
  return format(date, "d 'de' MMMM, HH:mm", { locale: ptBR });
};

const toDayKey = (date: Date) => format(date, "yyyy-MM-dd");

type Mood = "muito_bem" | "bem" | "neutro" | "desafiador" | "dificil";

const moodOptions: Array<{
  value: Mood;
  label: string;
  description: string;
  icon: any;
}> = [
  {
    value: "muito_bem",
    label: "Muito bem",
    description: "Dia leve e energizante",
    icon: Sparkles,
  },
  {
    value: "bem",
    label: "Bem",
    description: "Ritmo equilibrado e estável",
    icon: Heart,
  },
  {
    value: "neutro",
    label: "Neutro",
    description: "Sentimentos mistos ou sem grandes oscilações",
    icon: Meh,
  },
  {
    value: "desafiador",
    label: "Desafiador",
    description: "Alguns pontos de atenção ao longo do dia",
    icon: Frown,
  },
  {
    value: "dificil",
    label: "Difícil",
    description: "Momento mais pesado ou cansativo",
    icon: CloudRain,
  },
];

const PortalNotes = () => {
  const { logout, patient, isLoading } = usePatientAuth();
  const navigate = useNavigate();
  const { entries, loading, createEntry, updateEntry } = usePatientJournal();
  const { activities } = usePatientActivities();
  const [draftMood, setDraftMood] = useState<Mood>("bem");
  const [draftNote, setDraftNote] = useState("");
  const [saving, setSaving] = useState(false);

  const myEntries = useMemo(() => {
    return [...entries].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [entries]);

  const todayEntry = useMemo(() => {
    const dayKey = toDayKey(new Date());
    return myEntries.find((entry) => entry.created_at.startsWith(dayKey)) || null;
  }, [myEntries]);

  useEffect(() => {
    if (todayEntry) {
      setDraftMood(todayEntry.mood as Mood);
      setDraftNote(todayEntry.note);
    }
  }, [todayEntry]);

  const handleSubmit = async () => {
    const text = draftNote.trim();
    if (!text) return;
    
    setSaving(true);
    
    if (todayEntry) {
      await updateEntry(todayEntry.id, draftMood, text);
    } else {
      await createEntry(draftMood, text);
    }
    
    setSaving(false);
  };

  const moodCounts = useMemo(() => {
    return myEntries.reduce(
      (acc, entry) => {
        acc[entry.mood as Mood] = (acc[entry.mood as Mood] || 0) + 1;
        return acc;
      },
      {} as Record<Mood, number>
    );
  }, [myEntries]);

  const recentActivities = useMemo(
    () =>
      activities
        .filter((activity) => activity.status === "completed")
        .sort((a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime())
        .slice(0, 3),
    [activities]
  );

  // Mood evolution chart data (last 30 days)
  const moodChartData = useMemo(() => {
    const moodValues: Record<Mood, number> = {
      muito_bem: 5,
      bem: 4,
      neutro: 3,
      desafiador: 2,
      dificil: 1,
    };

    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      const dayKey = format(date, "yyyy-MM-dd");
      const entry = myEntries.find((e) => e.created_at.startsWith(dayKey));
      
      return {
        date: format(date, "dd/MM"),
        fullDate: format(date, "d 'de' MMM", { locale: ptBR }),
        value: entry ? moodValues[entry.mood as Mood] || null : null,
        mood: entry?.mood || null,
        moodLabel: entry ? moodOptions.find((m) => m.value === entry.mood)?.label : null,
      };
    });

    return last30Days;
  }, [myEntries]);

  const moodChartDataFiltered = useMemo(() => {
    return moodChartData.filter((d) => d.value !== null);
  }, [moodChartData]);

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
            <TabButton label="Atividades" icon={BookOpen} onClick={() => navigate("/portal/atividades")} />
            <TabButton label="Anotações" icon={FileText} active onClick={() => {}} />
            <TabButton label="Mensagens" icon={MessageSquare} onClick={() => navigate("/portal/mensagens")} />
          </div>
        </div>

        <div className="mt-8 grid xl:grid-cols-[2fr,1fr] gap-6 items-start">
          <Card className="card-glass">
            <CardContent className="p-6 space-y-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-lg font-semibold">Como foi seu dia?</div>
                  <div className="text-sm text-muted-foreground">Registre sentimentos, acontecimentos e acompanhe sua jornada emocional.</div>
                </div>
                {todayEntry && (
                  <div className="text-xs text-muted-foreground">
                    Última atualização hoje às {format(new Date(todayEntry.created_at), "HH:mm", { locale: ptBR })}
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-5 gap-3">
                {moodOptions.map((option) => {
                  const Icon = option.icon;
                  const isActive = draftMood === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDraftMood(option.value)}
                      className={`rounded-xl border p-3 text-left transition-all ${
                        isActive
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="mt-2 text-sm font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Escreva sobre seu dia</label>
                <Textarea
                  className="mt-2 min-h-[160px]"
                  value={draftNote}
                  onChange={(event) => setDraftNote(event.target.value)}
                  placeholder="Como você se sentiu? Houve algum desafio ou conquista que vale registrar?"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                {todayEntry && (
                  <span className="text-xs text-muted-foreground">
                    Esta anotação substitui a registrada hoje às {format(new Date(todayEntry.created_at), "HH:mm", { locale: ptBR })}
                  </span>
                )}
                <Button
                  className="rounded-full"
                  onClick={handleSubmit}
                  disabled={!draftNote.trim() || saving}
                >
                  {saving ? "Salvando..." : "Salvar anotação"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/90 border border-border/60">
            <CardContent className="p-6 space-y-4">
              <div className="text-sm font-medium text-muted-foreground">Seu painel emocional</div>
              <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Estado atual</div>
                <div className="text-sm text-foreground flex items-center gap-2">
                  <NotebookPen className="w-4 h-4 text-primary" />
                  {todayEntry ? `Hoje foi um dia "${moodOptions.find((m) => m.value === todayEntry.mood)?.label || "—"}"` : "Registre como está se sentindo hoje."}
                </div>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-4">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Visão rápida</div>
                <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                  {moodOptions.map((option) => (
                    <div key={option.value} className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <option.icon className="w-4 h-4 text-primary" />
                        {option.label}
                      </span>
                      <span className="text-xs text-muted-foreground/80">
                        {moodCounts[option.value] || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-4">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Últimas conquistas</div>
                <div className="mt-2 space-y-2 text-xs text-muted-foreground">
                  {recentActivities.length === 0 && <div>Nenhuma atividade concluída recentemente.</div>}
                  {recentActivities.map((activity) => (
                    <div key={activity.id}>
                      • {activity.title}
                      {activity.completed_at && ` — concluída em ${formatDateTimeLong(activity.completed_at)}`}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mood Evolution Chart */}
        {moodChartDataFiltered.length >= 3 && (
          <div className="mt-6">
            <Card className="bg-card/90 border border-border/60">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <div>
                      <div className="text-sm font-medium">Evolução do Humor</div>
                      <div className="text-xs text-muted-foreground">Últimos 30 dias</div>
                    </div>
                  </div>
                </div>

                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart
                      data={moodChartData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        domain={[1, 5]}
                        ticks={[1, 2, 3, 4, 5]}
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                        tickFormatter={(value) => {
                          const labels: Record<number, string> = {
                            1: "😔",
                            2: "😕",
                            3: "😐",
                            4: "😊",
                            5: "✨",
                          };
                          return labels[value] || "";
                        }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            if (!data.value) return null;
                            return (
                              <div className="bg-card shadow-lg rounded-lg p-3 border border-border">
                                <div className="text-sm font-medium">{data.fullDate}</div>
                                <div className="text-xs text-muted-foreground">{data.moodLabel}</div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }}
                        activeDot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 5 }}
                        connectNulls
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span>😔 Difícil</span>
                  <span>→</span>
                  <span>✨ Muito bem</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mt-6">
          <Card className="bg-card/90 border border-border/60">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Histórico de anotações</div>
                  <div className="text-xs text-muted-foreground">Revise como tem se sentido e compartilhe com seu psicólogo quando desejar.</div>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <LineChart className="w-4 h-4 text-primary" />
                  {myEntries.length} registro(s)
                </div>
              </div>

              {myEntries.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/70 bg-card/70 p-6 text-sm text-muted-foreground">
                  Seus registros aparecerão aqui assim que você salvar a primeira anotação.
                </div>
              ) : (
                <div className="space-y-3">
                  {myEntries.map((entry) => {
                    const option = moodOptions.find((mood) => mood.value === entry.mood);
                    const Icon = option?.icon || Smile;
                    return (
                      <div key={entry.id} className="rounded-xl border border-border/60 bg-card p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <Icon className="w-4 h-4 text-primary" />
                            {option?.label || "Humor"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDateTimeLong(entry.created_at)}
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground whitespace-pre-line">
                          {entry.note}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="h-16" />
      </div>
    </div>
  );
};

export default PortalNotes;
