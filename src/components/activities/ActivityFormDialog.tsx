import { useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, Upload, FileText, X } from "lucide-react";
import { type ActivityField } from "@/lib/storage";
import { uid } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ActivityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    dueDate?: string;
    assignedBy?: string;
    fields?: ActivityField[];
    attachmentUrl?: string;
    attachmentName?: string;
  }) => void;
  patientId: string;
}

export const ActivityFormDialog = ({
  open,
  onOpenChange,
  onSubmit,
  patientId,
}: ActivityFormDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignedBy, setAssignedBy] = useState("");
  const [fields, setFields] = useState<ActivityField[]>([]);
  const [uploading, setUploading] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState<string | undefined>();
  const [attachmentName, setAttachmentName] = useState<string | undefined>();

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDueDate("");
    setAssignedBy("");
    setFields([]);
    setAttachmentUrl(undefined);
    setAttachmentName(undefined);
  };

  const addField = (type: "text" | "checkbox") => {
    setFields([
      ...fields,
      {
        id: uid(),
        type,
        label: "",
        required: false,
      },
    ]);
  };

  const updateField = (id: string, updates: Partial<ActivityField>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${patientId}/${uid()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("patient-files")
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("patient-files")
        .getPublicUrl(data.path);

      setAttachmentUrl(urlData.publicUrl);
      setAttachmentName(file.name);
      toast.success("Arquivo anexado com sucesso!");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Erro ao fazer upload do arquivo");
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = () => {
    setAttachmentUrl(undefined);
    setAttachmentName(undefined);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Filter out empty fields
    const validFields = fields.filter((f) => f.label.trim());

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate || undefined,
      assignedBy: assignedBy.trim() || undefined,
      fields: validFields.length > 0 ? validFields : undefined,
      attachmentUrl,
      attachmentName,
    });

    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetForm();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova atividade terapêutica</DialogTitle>
        </DialogHeader>
        <p className="-mt-4 text-sm text-muted-foreground">
          Crie tarefas personalizadas com campos que o paciente deverá preencher.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Título da atividade *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Registro de pensamentos automáticos"
                required
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Instruções / Descrição</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Descreva como o paciente deve realizar a atividade..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Prazo</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Responsável</Label>
                <Input
                  value={assignedBy}
                  onChange={(e) => setAssignedBy(e.target.value)}
                  placeholder="Nome do psicólogo"
                />
              </div>
            </div>
          </div>

          {/* Attachment */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Arquivo anexo (opcional)</Label>
            <p className="text-xs text-muted-foreground">
              Anexe PDFs, planilhas ou materiais de apoio que aparecerão para o paciente.
            </p>
            
            {attachmentUrl ? (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                <FileText className="w-5 h-5 text-primary" />
                <span className="flex-1 text-sm truncate">{attachmentName}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeAttachment}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                <Button type="button" variant="outline" className="w-full gap-2" disabled={uploading}>
                  <Upload className="w-4 h-4" />
                  {uploading ? "Enviando..." : "Selecionar arquivo"}
                </Button>
              </div>
            )}
          </div>

          {/* Custom Fields */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Campos personalizados</Label>
                <p className="text-xs text-muted-foreground">
                  Adicione campos que o paciente deverá preencher
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addField("text")}
                  className="gap-1"
                >
                  <Plus className="w-3 h-3" /> Texto
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addField("checkbox")}
                  className="gap-1"
                >
                  <Plus className="w-3 h-3" /> Checkbox
                </Button>
              </div>
            </div>

            {fields.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-4 text-center text-sm text-muted-foreground">
                  Nenhum campo adicionado. Use os botões acima para criar campos personalizados.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background"
                  >
                    <div className="mt-2 text-muted-foreground cursor-grab">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase px-2 py-0.5 rounded bg-muted">
                          {field.type === "text" ? "Texto" : "Checkbox"}
                        </span>
                        <span className="text-xs text-muted-foreground">Campo {index + 1}</span>
                      </div>
                      <Input
                        value={field.label}
                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                        placeholder={
                          field.type === "text"
                            ? "Ex.: Descreva o que você sentiu"
                            : "Ex.: Consegui realizar a tarefa"
                        }
                      />
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.required || false}
                            onChange={(e) => updateField(field.id, { required: e.target.checked })}
                            className="rounded"
                          />
                          Obrigatório
                        </label>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeField(field.id)}
                      className="text-destructive hover:text-destructive mt-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" className="btn-futuristic">
              Criar atividade
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
