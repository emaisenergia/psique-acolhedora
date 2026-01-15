import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  History, 
  Plus, 
  Trash2, 
  MessageSquare,
  Brain,
  FileText,
  ClipboardList
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string | null;
  type: string;
  patient_id: string | null;
  created_at: string;
}

interface ConversationHistoryProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

const typeIcons: Record<string, typeof MessageSquare> = {
  chat: MessageSquare,
  session_summary: ClipboardList,
  patient_analysis: Brain,
  report_generation: FileText,
};

const typeLabels: Record<string, string> = {
  chat: "Chat",
  session_summary: "Sessão",
  patient_analysis: "Análise",
  report_generation: "Relatório",
};

export const ConversationHistory = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: ConversationHistoryProps) => {
  return (
    <Card className="card-glass h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico
          </span>
          <Button variant="outline" size="sm" onClick={onNewConversation}>
            <Plus className="h-4 w-4 mr-1" />
            Nova
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2">
        <ScrollArea className="h-[400px]">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhuma conversa ainda
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conv) => {
                const Icon = typeIcons[conv.type] || MessageSquare;
                const isActive = conv.id === currentConversationId;
                
                return (
                  <div
                    key={conv.id}
                    className={cn(
                      "group flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                      isActive 
                        ? "bg-primary/10 border border-primary/20" 
                        : "hover:bg-muted"
                    )}
                    onClick={() => onSelectConversation(conv.id)}
                  >
                    <Icon className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {conv.title || "Nova conversa"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{typeLabels[conv.type] || conv.type}</span>
                        <span>•</span>
                        <span>
                          {formatDistanceToNow(new Date(conv.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
