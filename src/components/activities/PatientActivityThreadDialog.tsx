import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, MessageCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ActivityThread, type ThreadComment } from "./ActivityThread";

interface PatientActivityThreadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: {
    id: string;
    title: string;
    description?: string | null;
    attachment_url?: string | null;
    attachment_name?: string | null;
    psychologist_feedback?: string | null;
    feedback_at?: string | null;
    feedback_thread?: ThreadComment[] | null;
  };
  onAddComment: (activityId: string, comment: string) => Promise<void>;
}

export const PatientActivityThreadDialog = ({
  open,
  onOpenChange,
  activity,
  onAddComment,
}: PatientActivityThreadDialogProps) => {
  const hasFeedback = !!activity.psychologist_feedback;
  const hasThread = activity.feedback_thread && activity.feedback_thread.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            {activity.title}
          </DialogTitle>
        </DialogHeader>

        {activity.description && (
          <div className="text-sm text-muted-foreground whitespace-pre-line border-l-2 border-primary/30 pl-3 py-1 bg-muted/30 rounded-r">
            {activity.description}
          </div>
        )}

        {activity.attachment_url && (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
            <FileText className="w-5 h-5 text-primary" />
            <span className="flex-1 text-sm truncate">{activity.attachment_name || "Arquivo anexo"}</span>
            <Button type="button" variant="outline" size="sm" asChild>
              <a href={activity.attachment_url} target="_blank" rel="noopener noreferrer" className="gap-2">
                <Download className="w-4 h-4" /> Baixar
              </a>
            </Button>
          </div>
        )}

        {/* Psychologist Feedback */}
        {hasFeedback && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Feedback do Psicólogo
              </Badge>
            </div>
            <div className="text-sm text-foreground whitespace-pre-line">
              {activity.psychologist_feedback}
            </div>
            {activity.feedback_at && (
              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {format(new Date(activity.feedback_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </div>
            )}
          </div>
        )}

        {/* Comment Thread */}
        <div className="pt-2">
          <ActivityThread
            thread={activity.feedback_thread || []}
            onAddComment={async (content) => {
              await onAddComment(activity.id, content);
            }}
            userRole="patient"
          />
        </div>

        <div className="flex justify-end pt-4 border-t">
          <DialogClose asChild>
            <Button variant="outline">Fechar</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};
