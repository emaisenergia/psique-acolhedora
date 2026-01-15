import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, CheckCircle2, XCircle, MessageSquare } from "lucide-react";

export interface ActivityField {
  id: string;
  type: "text" | "checkbox";
  label: string;
  required?: boolean;
}

interface ActivityResponseViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: {
    title: string;
    description?: string;
    fields?: ActivityField[];
    attachmentUrl?: string;
    attachmentName?: string;
    patientResponses?: Record<string, string | boolean>;
  };
}

export const ActivityResponseViewer = ({
  open,
  onOpenChange,
  activity,
}: ActivityResponseViewerProps) => {
  const hasResponses = activity.patientResponses && Object.keys(activity.patientResponses).length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            {activity.title}
          </DialogTitle>
        </DialogHeader>

        {activity.description && (
          <div className="text-sm text-muted-foreground whitespace-pre-line border-l-2 border-primary/30 pl-3 py-1 bg-muted/30 rounded-r">
            {activity.description}
          </div>
        )}

        {activity.attachmentUrl && (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
            <FileText className="w-5 h-5 text-primary" />
            <span className="flex-1 text-sm truncate">{activity.attachmentName || "Arquivo anexo"}</span>
            <Button type="button" variant="outline" size="sm" asChild>
              <a href={activity.attachmentUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
                <Download className="w-4 h-4" /> Baixar
              </a>
            </Button>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">
              Respostas do paciente
            </div>
            {hasResponses ? (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Respondido
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <XCircle className="w-3 h-3 mr-1" /> Aguardando respostas
              </Badge>
            )}
          </div>

          {!hasResponses && (!activity.fields || activity.fields.length === 0) && (
            <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
              Esta atividade não possui campos para preencher.
            </div>
          )}

          {!hasResponses && activity.fields && activity.fields.length > 0 && (
            <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
              O paciente ainda não enviou respostas para esta atividade.
            </div>
          )}

          {hasResponses && activity.fields && (
            <div className="space-y-3">
              {activity.fields.map((field) => {
                const response = activity.patientResponses?.[field.id];
                
                return (
                  <div key={field.id} className="p-3 rounded-lg border border-border bg-background">
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase px-2 py-0.5 rounded bg-muted">
                        {field.type === "text" ? "Texto" : "Checkbox"}
                      </span>
                      {field.required && (
                        <span className="text-xs text-destructive">Obrigatório</span>
                      )}
                    </div>
                    <div className="text-sm font-medium text-foreground mb-2">
                      {field.label}
                    </div>
                    {field.type === "checkbox" ? (
                      <div className="flex items-center gap-2">
                        {response === true ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Sim
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-100 text-slate-700">
                            <XCircle className="w-3 h-3 mr-1" /> Não
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-foreground bg-muted/50 p-3 rounded-md whitespace-pre-line">
                        {response as string || <span className="text-muted-foreground italic">Sem resposta</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end pt-4 border-t">
          <DialogClose asChild>
            <Button variant="outline">Fechar</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};
