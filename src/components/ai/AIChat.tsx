import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, User, Loader2, Plus, History, Download, Copy, Check, Star } from "lucide-react";
import { useAIAgent } from "@/hooks/useAIAgent";
import { cn } from "@/lib/utils";
import { ConversationHistory } from "./ConversationHistory";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AIChatProps {
  type?: "chat" | "session_summary" | "patient_analysis" | "report_generation";
  context?: {
    patientName?: string;
    sessionNotes?: string;
    patientHistory?: string;
    reportType?: string;
  };
  patientId?: string;
  placeholder?: string;
  title?: string;
  showHistory?: boolean;
  suggestions?: string[];
}

export const AIChat = ({ 
  type = "chat", 
  context,
  patientId,
  placeholder = "Digite sua mensagem...",
  title = "Chat Assistente",
  showHistory = true,
  suggestions = []
}: AIChatProps) => {
  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    clearMessages,
    conversations,
    conversationId,
    loadConversation,
    startNewConversation,
    deleteConversation,
  } = useAIAgent({ type, context, patientId });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const message = input;
    setInput("");
    await sendMessage(message);
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (isLoading) return;
    setInput("");
    sendMessage(suggestion);
  };

  const handleCopyMessage = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast({ title: "Copiado!", description: "Mensagem copiada para a área de transferência." });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportConversation = (format: "txt" | "md") => {
    if (messages.length === 0) {
      toast({ title: "Nenhuma mensagem", description: "Não há mensagens para exportar.", variant: "destructive" });
      return;
    }

    let content = "";
    const timestamp = new Date().toLocaleString("pt-BR");
    
    if (format === "md") {
      content = `# Conversa com IA\n\n**Data:** ${timestamp}\n**Tipo:** ${title}\n\n---\n\n`;
      messages.forEach((msg) => {
        const role = msg.role === "user" ? "👤 **Você**" : "🤖 **Assistente**";
        content += `${role}\n\n${msg.content}\n\n---\n\n`;
      });
    } else {
      content = `Conversa com IA\nData: ${timestamp}\nTipo: ${title}\n\n${"=".repeat(50)}\n\n`;
      messages.forEach((msg) => {
        const role = msg.role === "user" ? "VOCÊ" : "ASSISTENTE";
        content += `[${role}]\n${msg.content}\n\n${"-".repeat(30)}\n\n`;
      });
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversa-ia-${new Date().toISOString().split("T")[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({ title: "Exportado!", description: `Conversa exportada como .${format}` });
  };

  return (
    <Card className="card-glass h-[600px] flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-lg font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            {title}
          </span>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Exportar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExportConversation("txt")}>
                    Exportar como .txt
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportConversation("md")}>
                    Exportar como .md (Markdown)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {showHistory && conversations.length > 0 && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <History className="h-4 w-4 mr-1" />
                    Histórico
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <ConversationHistory
                    conversations={conversations}
                    currentConversationId={conversationId}
                    onSelectConversation={loadConversation}
                    onNewConversation={startNewConversation}
                    onDeleteConversation={deleteConversation}
                  />
                </SheetContent>
              </Sheet>
            )}
            <Button variant="ghost" size="sm" onClick={startNewConversation}>
              <Plus className="h-4 w-4 mr-1" />
              Nova
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden pb-4">
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-center p-8">
              <div>
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Olá! Como posso ajudar?</p>
                <p className="text-sm mt-2">
                  {type === "chat" && "Tire dúvidas sobre práticas clínicas, organização ou tarefas administrativas."}
                  {type === "session_summary" && "Cole as notas da sessão e eu farei um resumo completo."}
                  {type === "patient_analysis" && "Compartilhe o histórico do paciente para análise."}
                  {type === "report_generation" && "Descreva o que precisa e eu gero o relatório."}
                </p>
                
                {/* Clickable suggestions */}
                {suggestions.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <p className="text-xs text-muted-foreground mb-2">Sugestões:</p>
                    {suggestions.map((suggestion, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-left h-auto py-2 text-xs"
                        onClick={() => handleSuggestionClick(suggestion)}
                        disabled={isLoading}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 group",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2 max-w-[80%] relative",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    )}
                    
                    {/* Copy button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "absolute -right-10 top-0 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity",
                        message.role === "user" && "-left-10 -right-auto"
                      )}
                      onClick={() => handleCopyMessage(message.content, message.id)}
                    >
                      {copiedId === message.id ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  {message.role === "user" && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-2xl px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        
        <form onSubmit={handleSubmit} className="flex gap-2 mt-4 flex-shrink-0">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={!input.trim() || isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
