import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type MessageRole = "user" | "assistant";

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

interface UseAIAgentOptions {
  type: "chat" | "session_summary" | "patient_analysis" | "report_generation";
  context?: {
    patientName?: string;
    sessionNotes?: string;
    patientHistory?: string;
    reportType?: string;
  };
  patientId?: string;
  conversationId?: string;
}

interface Conversation {
  id: string;
  title: string | null;
  type: string;
  patient_id: string | null;
  created_at: string;
}

const AI_AGENT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent`;

export const useAIAgent = ({ type, context, patientId, conversationId: initialConversationId }: UseAIAgentOptions) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId || null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { toast } = useToast();

  // Load conversations history
  const loadConversations = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;

      const { data, error } = await supabase
        .from("ai_conversations")
        .select("*")
        .eq("type", type)
        .order("updated_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  }, [type]);

  // Load messages for a conversation
  const loadConversation = useCallback(async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from("ai_messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setMessages(
        (data || []).map((m) => ({
          id: m.id,
          role: m.role as MessageRole,
          content: m.content,
          timestamp: new Date(m.created_at),
        }))
      );
      setConversationId(convId);
    } catch (error) {
      console.error("Error loading conversation:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar conversa",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Create a new conversation
  const createConversation = useCallback(async (firstMessage: string): Promise<string | null> => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("Não autenticado");

      const title = firstMessage.slice(0, 100) + (firstMessage.length > 100 ? "..." : "");

      const { data, error } = await supabase
        .from("ai_conversations")
        .insert({
          user_id: sessionData.session.user.id,
          type,
          title,
          patient_id: patientId || null,
        })
        .select()
        .single();

      if (error) throw error;
      setConversationId(data.id);
      return data.id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      return null;
    }
  }, [type, patientId]);

  // Save a message to the database
  const saveMessage = useCallback(async (convId: string, role: MessageRole, content: string) => {
    try {
      await supabase.from("ai_messages").insert({
        conversation_id: convId,
        role,
        content,
      });

      // Update conversation timestamp
      await supabase
        .from("ai_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", convId);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  }, []);

  const sendMessage = useCallback(async (input: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    let assistantContent = "";
    let currentConversationId = conversationId;

    try {
      // Create conversation if it doesn't exist
      if (!currentConversationId) {
        currentConversationId = await createConversation(input);
      }

      // Save user message
      if (currentConversationId) {
        await saveMessage(currentConversationId, "user", input);
      }

      // Send only last 10 messages for speed
      const recentMessages = [...messages, userMessage].slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const { data: sessionData } = await supabase.auth.getSession();
      const authToken = sessionData?.session?.access_token;

      const response = await fetch(AI_AGENT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: recentMessages,
          type,
          context,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao conectar com a IA");
      }

      if (!response.body) {
        throw new Error("Resposta vazia do servidor");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const assistantId = crypto.randomUUID();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && last.id === assistantId) {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: assistantContent } : m
                  );
                }
                return [
                  ...prev,
                  {
                    id: assistantId,
                    role: "assistant",
                    content: assistantContent,
                    timestamp: new Date(),
                  },
                ];
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Save assistant response
      if (currentConversationId && assistantContent) {
        await saveMessage(currentConversationId, "assistant", assistantContent);
        loadConversations(); // Refresh conversations list
      }
    } catch (error) {
      console.error("AI Agent error:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao processar sua mensagem",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, type, context, toast, conversationId, createConversation, saveMessage, loadConversations]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setConversationId(null);
  }, []);

  const startNewConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
  }, []);

  const deleteConversation = useCallback(async (convId: string) => {
    try {
      const { error } = await supabase
        .from("ai_conversations")
        .delete()
        .eq("id", convId);

      if (error) throw error;

      if (convId === conversationId) {
        setMessages([]);
        setConversationId(null);
      }

      loadConversations();
      toast({
        title: "Conversa excluída",
        description: "A conversa foi removida do histórico.",
      });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a conversa.",
        variant: "destructive",
      });
    }
  }, [conversationId, loadConversations, toast]);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    conversations,
    conversationId,
    loadConversation,
    startNewConversation,
    deleteConversation,
  };
};
