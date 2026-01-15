import { useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Download, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export interface ActivityField {
  id: string;
  type: "text" | "checkbox";
  label: string;
  required?: boolean;
  value?: string | boolean;
}

interface ActivityResponseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: {
    id: string;
    title: string;
    description?: string | null;
    fields?: ActivityField[];
    attachmentUrl?: string;
    attachmentName?: string;
  };
  onSubmit: (activityId: string, responses: Record<string, string | boolean>) => void;
}

export const ActivityResponseDialog = ({
  open,
  onOpenChange,
  activity,
  onSubmit,
}: ActivityResponseDialogProps) => {
  const [responses, setResponses] = useState<Record<string, string | boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const updateResponse = (fieldId: string, value: string | boolean) => {
    setResponses((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const missingRequired = activity.fields?.filter(
      (f) => f.required && !responses[f.id] && responses[f.id] !== false
    );
    
    if (missingRequired && missingRequired.length > 0) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(activity.id, responses);
      toast.success("Respostas enviadas com sucesso!");
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao enviar respostas");
    } finally {
      setSubmitting(false);
    }
  };

  const hasFields = activity.fields && activity.fields.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              asChild
            >
              <a href={activity.attachmentUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
                <Download className="w-4 h-4" /> Baixar
              </a>
            </Button>
          </div>
        )}

        {hasFields ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-sm font-medium text-muted-foreground">
              Preencha os campos abaixo:
            </div>
            
            {activity.fields!.map((field) => (
              <div key={field.id} className="space-y-2">
                {field.type === "text" ? (
                  <>
                    <Label className="text-sm font-medium flex items-center gap-1">
                      {field.label}
                      {field.required && <span className="text-destructive">*</span>}
                    </Label>
                    <Textarea
                      value={(responses[field.id] as string) || ""}
                      onChange={(e) => updateResponse(field.id, e.target.value)}
                      rows={3}
                      placeholder="Digite sua resposta..."
                      required={field.required}
                    />
                  </>
                ) : (
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background">
                    <Checkbox
                      id={field.id}
                      checked={(responses[field.id] as boolean) || false}
                      onCheckedChange={(checked) => updateResponse(field.id, checked === true)}
                    />
                    <label
                      htmlFor={field.id}
                      className="text-sm font-medium leading-none cursor-pointer flex items-center gap-1"
                    >
                      {field.label}
                      {field.required && <span className="text-destructive">*</span>}
                    </label>
                  </div>
                )}
              </div>
            ))}

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={submitting} className="gap-2">
                <Send className="w-4 h-4" />
                {submitting ? "Enviando..." : "Enviar respostas"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-4">
              Esta atividade não possui campos para preencher. Você pode baixar o material anexo (se houver) e marcar como concluída.
            </p>
            <DialogClose asChild>
              <Button variant="outline">Fechar</Button>
            </DialogClose>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
