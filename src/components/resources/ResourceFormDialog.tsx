import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Link2, FileText, Video, Music, Loader2 } from "lucide-react";
import type { CreateResourceInput } from "@/hooks/useTherapeuticResources";

interface ResourceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateResourceInput) => Promise<void>;
  patientId?: string;
  initialData?: Partial<CreateResourceInput>;
}

const RESOURCE_TYPES = [
  { value: "link", label: "Link Externo", icon: Link2 },
  { value: "pdf", label: "PDF/Documento", icon: FileText },
  { value: "video", label: "Vídeo", icon: Video },
  { value: "audio", label: "Áudio", icon: Music },
];

const CATEGORIES = [
  { value: "psicoeducacao", label: "Psicoeducação" },
  { value: "relaxamento", label: "Relaxamento e Mindfulness" },
  { value: "leitura", label: "Leitura Recomendada" },
  { value: "exercicio", label: "Exercícios Práticos" },
  { value: "video", label: "Vídeos Educativos" },
  { value: "geral", label: "Geral" },
];

export function ResourceFormDialog({
  open,
  onOpenChange,
  onSubmit,
  patientId,
  initialData,
}: ResourceFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    resource_type: initialData?.resource_type || "link",
    resource_url: initialData?.resource_url || "",
    category: initialData?.category || "geral",
    is_visible: initialData?.is_visible ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    setLoading(true);
    try {
      await onSubmit({
        patient_id: patientId || null,
        title: form.title,
        description: form.description || undefined,
        resource_type: form.resource_type,
        resource_url: form.resource_url || undefined,
        category: form.category,
        is_visible: form.is_visible,
      });
      onOpenChange(false);
      setForm({
        title: "",
        description: "",
        resource_type: "link",
        resource_url: "",
        category: "geral",
        is_visible: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Recurso" : "Adicionar Recurso Terapêutico"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Técnicas de Respiração Diafragmática"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Breve descrição do material..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Recurso</Label>
              <Select
                value={form.resource_type}
                onValueChange={(v) => setForm({ ...form, resource_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL do Recurso</Label>
            <Input
              id="url"
              type="url"
              value={form.resource_url}
              onChange={(e) => setForm({ ...form, resource_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="visible" className="font-medium">
                Visível para o paciente
              </Label>
              <p className="text-sm text-muted-foreground">
                O paciente poderá ver este recurso em seu portal
              </p>
            </div>
            <Switch
              id="visible"
              checked={form.is_visible}
              onCheckedChange={(checked) => setForm({ ...form, is_visible: checked })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !form.title.trim()}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {initialData ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
