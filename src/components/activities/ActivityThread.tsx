import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, User, Stethoscope, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface ThreadComment {
  id: string;
  author: "psychologist" | "patient";
  content: string;
  created_at: string;
}

interface ActivityThreadProps {
  thread: ThreadComment[];
  onAddComment: (content: string) => Promise<void>;
  userRole: "psychologist" | "patient";
  disabled?: boolean;
  maxHeight?: string;
}

export const ActivityThread = ({
  thread,
  onAddComment,
  userRole,
  disabled = false,
  maxHeight = "300px",
}: ActivityThreadProps) => {
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim() || sending) return;
    
    setSending(true);
    try {
      await onAddComment(newComment.trim());
      setNewComment("");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-primary">
        <MessageCircle className="w-4 h-4" />
        Comentários ({thread.length})
      </div>

      {thread.length > 0 ? (
        <ScrollArea className={`pr-4`} style={{ maxHeight }}>
          <div className="space-y-3">
            {thread.map((comment) => {
              const isPsychologist = comment.author === "psychologist";
              const isOwnMessage = comment.author === userRole;
              
              return (
                <div
                  key={comment.id}
                  className={cn(
                    "flex gap-2",
                    isOwnMessage ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
                      isPsychologist
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isPsychologist ? (
                      <Stethoscope className="w-3.5 h-3.5" />
                    ) : (
                      <User className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "flex-1 max-w-[80%] rounded-lg p-3",
                      isOwnMessage
                        ? "bg-primary/10 border border-primary/20"
                        : "bg-muted/50 border border-border"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold">
                        {isPsychologist ? "Psicólogo(a)" : "Você"}
                      </span>
                    </div>
                    <div className="text-sm whitespace-pre-line">
                      {comment.content}
                    </div>
                    <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {format(new Date(comment.created_at), "dd/MM 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      ) : (
        <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg bg-muted/20">
          Nenhum comentário ainda. Inicie a conversa!
        </div>
      )}

      {!disabled && (
        <div className="flex gap-2 pt-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              userRole === "psychologist"
                ? "Adicione um comentário para o paciente..."
                : "Responda ao feedback do psicólogo..."
            }
            rows={2}
            className="resize-none flex-1"
            disabled={sending}
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!newComment.trim() || sending}
            className="h-auto aspect-square"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
