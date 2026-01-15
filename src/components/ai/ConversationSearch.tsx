import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  MessageSquare,
  User,
  Calendar,
  Bot,
  Trash2,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePatients } from "@/hooks/usePatients";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ConversationWithMessages {
  id: string;
  title: string | null;
  type: string;
  patient_id: string | null;
  created_at: string;
  updated_at: string;
  messages: {
    id: string;
    role: string;
    content: string;
    created_at: string;
  }[];
  patient_name?: string;
}

const typeLabels: Record<string, string> = {
  chat: "Chat Geral",
  session_summary: "Resumo de Sessão",
  patient_analysis: "Análise de Paciente",
  report_generation: "Geração de Relatório",
};

export const ConversationSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [patientFilter, setPatientFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [conversations, setConversations] = useState<ConversationWithMessages[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithMessages | null>(null);
  const { patients } = usePatients();
  const { toast } = useToast();

  // Load conversations with messages
  useEffect(() => {
    const loadConversations = async () => {
      setIsLoading(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) return;

        // Get all conversations
        const { data: convos, error: convosError } = await supabase
          .from("ai_conversations")
          .select("*")
          .eq("user_id", sessionData.session.user.id)
          .order("updated_at", { ascending: false });

        if (convosError) throw convosError;

        // Get all messages for these conversations
        const convoIds = convos?.map(c => c.id) || [];
        const { data: messages, error: messagesError } = await supabase
          .from("ai_messages")
          .select("*")
          .in("conversation_id", convoIds)
          .order("created_at", { ascending: true });

        if (messagesError) throw messagesError;

        // Combine conversations with their messages and patient names
        const conversationsWithMessages = convos?.map(convo => {
          const convoMessages = messages?.filter(m => m.conversation_id === convo.id) || [];
          const patient = patients.find(p => p.id === convo.patient_id);
          return {
            ...convo,
            messages: convoMessages,
            patient_name: patient?.name,
          };
        }) || [];

        setConversations(conversationsWithMessages);
      } catch (error) {
        console.error("Error loading conversations:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar o histórico de conversas.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();
  }, [patients, toast]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter(convo => {
      // Patient filter
      if (patientFilter !== "all" && convo.patient_id !== patientFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== "all" && convo.type !== typeFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = convo.title?.toLowerCase().includes(query);
        const messageMatch = convo.messages.some(m => 
          m.content.toLowerCase().includes(query)
        );
        const patientMatch = convo.patient_name?.toLowerCase().includes(query);
        
        return titleMatch || messageMatch || patientMatch;
      }

      return true;
    });
  }, [conversations, searchQuery, patientFilter, typeFilter]);

  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta conversa?")) return;

    try {
      // Delete messages first (due to FK constraint)
      await supabase
        .from("ai_messages")
        .delete()
        .eq("conversation_id", conversationId);

      // Delete conversation
      const { error } = await supabase
        .from("ai_conversations")
        .delete()
        .eq("id", conversationId);

      if (error) throw error;

      setConversations(prev => prev.filter(c => c.id !== conversationId));
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
      }
      
      toast({ title: "Conversa excluída!" });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a conversa.",
        variant: "destructive",
      });
    }
  };

  // Highlight search matches in text
  const highlightMatches = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
      {/* Search and List Panel */}
      <Card className="card-glass flex flex-col">
        <CardHeader className="pb-3 flex-shrink-0">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Buscar Conversas
          </CardTitle>
          <CardDescription>
            Pesquise no histórico de conversas com IA
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por palavras-chave..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <Select value={patientFilter} onValueChange={setPatientFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Paciente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os pacientes</SelectItem>
                {patients.filter(p => p.status === "active").map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="chat">Chat Geral</SelectItem>
                <SelectItem value="session_summary">Resumo de Sessão</SelectItem>
                <SelectItem value="patient_analysis">Análise de Paciente</SelectItem>
                <SelectItem value="report_generation">Relatórios</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results List */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma conversa encontrada</p>
                {searchQuery && <p className="text-sm mt-1">Tente outros termos de busca</p>}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredConversations.map((convo) => (
                  <div
                    key={convo.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedConversation?.id === convo.id ? "bg-muted border-primary" : ""
                    }`}
                    onClick={() => setSelectedConversation(convo)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">
                            {typeLabels[convo.type] || convo.type}
                          </Badge>
                          {convo.patient_name && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {highlightMatches(convo.patient_name, searchQuery)}
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-sm truncate">
                          {convo.title ? highlightMatches(convo.title, searchQuery) : "Conversa sem título"}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(convo.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          <span className="mx-1">•</span>
                          {convo.messages.length} mensagens
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConversation(convo.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Results count */}
          {!isLoading && (
            <div className="text-xs text-muted-foreground text-right">
              {filteredConversations.length} conversa{filteredConversations.length !== 1 ? "s" : ""} encontrada{filteredConversations.length !== 1 ? "s" : ""}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversation Detail Panel */}
      <Card className="card-glass flex flex-col">
        <CardHeader className="pb-3 flex-shrink-0">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            {selectedConversation ? (selectedConversation.title || "Conversa") : "Detalhes"}
          </CardTitle>
          {selectedConversation && (
            <CardDescription>
              {typeLabels[selectedConversation.type]} 
              {selectedConversation.patient_name && ` • ${selectedConversation.patient_name}`}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          {selectedConversation ? (
            <ScrollArea className="h-full">
              <div className="space-y-4">
                {selectedConversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2 max-w-[85%] ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm">
                        {highlightMatches(message.content, searchQuery)}
                      </p>
                      <p className="text-xs opacity-60 mt-1">
                        {format(new Date(message.created_at), "HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    {message.role === "user" && (
                      <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selecione uma conversa para ver os detalhes</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
