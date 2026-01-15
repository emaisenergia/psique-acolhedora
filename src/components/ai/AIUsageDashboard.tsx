import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  MessageSquare,
  Bot,
  TrendingUp,
  Calendar,
  Clock,
  Users,
  FileText,
  Brain,
  ClipboardList,
  Loader2,
  BarChart3,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePatients } from "@/hooks/usePatients";
import { format, subDays, startOfDay, eachDayOfInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ConversationStats {
  totalConversations: number;
  totalMessages: number;
  avgMessagesPerConversation: number;
  conversationsByType: Record<string, number>;
  messagesByRole: { user: number; assistant: number };
  dailyActivity: { date: string; conversations: number; messages: number }[];
  topPatients: { id: string; name: string; conversations: number }[];
  recentConversations: { id: string; title: string; type: string; created_at: string; messageCount: number }[];
}

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  chat: { label: "Chat Geral", color: "hsl(var(--primary))", icon: <MessageSquare className="h-4 w-4" /> },
  session_summary: { label: "Resumo de Sessão", color: "hsl(210, 70%, 50%)", icon: <ClipboardList className="h-4 w-4" /> },
  patient_analysis: { label: "Análise de Paciente", color: "hsl(280, 70%, 50%)", icon: <Brain className="h-4 w-4" /> },
  report_generation: { label: "Relatórios", color: "hsl(150, 70%, 40%)", icon: <FileText className="h-4 w-4" /> },
};

const COLORS = ["hsl(var(--primary))", "hsl(210, 70%, 50%)", "hsl(280, 70%, 50%)", "hsl(150, 70%, 40%)"];

export const AIUsageDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<ConversationStats | null>(null);
  const [dateRange, setDateRange] = useState("30");
  const { patients } = usePatients();

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) return;

        const daysAgo = parseInt(dateRange);
        const startDate = subDays(new Date(), daysAgo).toISOString();

        // Get conversations
        const { data: conversations, error: convError } = await supabase
          .from("ai_conversations")
          .select("*")
          .eq("user_id", sessionData.session.user.id)
          .gte("created_at", startDate)
          .order("created_at", { ascending: false });

        if (convError) throw convError;

        // Get all messages for these conversations
        const convoIds = conversations?.map(c => c.id) || [];
        const { data: messages, error: msgError } = await supabase
          .from("ai_messages")
          .select("*")
          .in("conversation_id", convoIds);

        if (msgError) throw msgError;

        // Calculate stats
        const totalConversations = conversations?.length || 0;
        const totalMessages = messages?.length || 0;
        const avgMessagesPerConversation = totalConversations > 0 
          ? Math.round(totalMessages / totalConversations * 10) / 10 
          : 0;

        // Conversations by type
        const conversationsByType: Record<string, number> = {};
        conversations?.forEach(c => {
          conversationsByType[c.type] = (conversationsByType[c.type] || 0) + 1;
        });

        // Messages by role
        const messagesByRole = { user: 0, assistant: 0 };
        messages?.forEach(m => {
          if (m.role === "user") messagesByRole.user++;
          else if (m.role === "assistant") messagesByRole.assistant++;
        });

        // Daily activity
        const days = eachDayOfInterval({
          start: subDays(new Date(), daysAgo),
          end: new Date(),
        });

        const dailyActivity = days.map(day => {
          const dayStr = format(day, "yyyy-MM-dd");
          const dayConvos = conversations?.filter(c => 
            format(parseISO(c.created_at), "yyyy-MM-dd") === dayStr
          ).length || 0;
          const dayMsgs = messages?.filter(m => 
            format(parseISO(m.created_at), "yyyy-MM-dd") === dayStr
          ).length || 0;
          
          return {
            date: format(day, "dd/MM", { locale: ptBR }),
            conversations: dayConvos,
            messages: dayMsgs,
          };
        });

        // Top patients by conversation count
        const patientConvos: Record<string, number> = {};
        conversations?.filter(c => c.patient_id).forEach(c => {
          patientConvos[c.patient_id!] = (patientConvos[c.patient_id!] || 0) + 1;
        });

        const topPatients = Object.entries(patientConvos)
          .map(([id, count]) => ({
            id,
            name: patients.find(p => p.id === id)?.name || "Paciente desconhecido",
            conversations: count,
          }))
          .sort((a, b) => b.conversations - a.conversations)
          .slice(0, 5);

        // Recent conversations with message count
        const recentConversations = (conversations?.slice(0, 10) || []).map(c => ({
          id: c.id,
          title: c.title || "Conversa sem título",
          type: c.type,
          created_at: c.created_at,
          messageCount: messages?.filter(m => m.conversation_id === c.id).length || 0,
        }));

        setStats({
          totalConversations,
          totalMessages,
          avgMessagesPerConversation,
          conversationsByType,
          messagesByRole,
          dailyActivity,
          topPatients,
          recentConversations,
        });
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [dateRange, patients]);

  // Prepare pie chart data
  const pieData = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.conversationsByType).map(([type, count]) => ({
      name: TYPE_CONFIG[type]?.label || type,
      value: count,
      color: TYPE_CONFIG[type]?.color || "hsl(var(--muted))",
    }));
  }, [stats]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Não foi possível carregar as estatísticas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with date filter */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Dashboard de Uso
          </h2>
          <p className="text-sm text-muted-foreground">
            Estatísticas de uso dos agentes IA
          </p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Conversas</p>
                <p className="text-3xl font-bold">{stats.totalConversations}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Mensagens</p>
                <p className="text-3xl font-bold">{stats.totalMessages}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Bot className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Média por Conversa</p>
                <p className="text-3xl font-bold">{stats.avgMessagesPerConversation}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pacientes Envolvidos</p>
                <p className="text-3xl font-bold">{stats.topPatients.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Over Time */}
        <Card className="card-glass">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Atividade ao Longo do Tempo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.dailyActivity.slice(-14)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }} 
                    className="text-muted-foreground"
                  />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }} 
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="conversations" 
                    name="Conversas"
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="messages" 
                    name="Mensagens"
                    stroke="hsl(210, 70%, 50%)" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Conversations by Type */}
        <Card className="card-glass">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Conversas por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] flex items-center">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full text-center text-muted-foreground">
                  Nenhuma conversa no período
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages by Role */}
        <Card className="card-glass">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Mensagens por Origem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: "Você", value: stats.messagesByRole.user, fill: "hsl(var(--primary))" },
                    { name: "IA", value: stats.messagesByRole.assistant, fill: "hsl(210, 70%, 50%)" },
                  ]}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={40} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }} 
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Patients */}
        <Card className="card-glass">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Pacientes com Mais Análises
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              {stats.topPatients.length > 0 ? (
                <div className="space-y-3">
                  {stats.topPatients.map((patient, index) => (
                    <div key={patient.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <span className="text-sm truncate max-w-[150px]">{patient.name}</span>
                      </div>
                      <Badge variant="secondary">{patient.conversations} conversas</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Nenhuma conversa com pacientes
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Conversations */}
        <Card className="card-glass">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Conversas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              {stats.recentConversations.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentConversations.map((convo) => (
                    <div key={convo.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="text-muted-foreground">
                          {TYPE_CONFIG[convo.type]?.icon || <Bot className="h-4 w-4" />}
                        </div>
                        <span className="text-sm truncate max-w-[120px]">{convo.title}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {convo.messageCount} msgs
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(convo.created_at), "dd/MM", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Nenhuma conversa recente
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
