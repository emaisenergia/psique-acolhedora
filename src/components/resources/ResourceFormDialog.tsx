import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Link2, FileText, Video, Music, Loader2, Upload, X, File } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [form, setForm] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    resource_type: initialData?.resource_type || "link",
    resource_url: initialData?.resource_url || "",
    resource_file_name: initialData?.resource_file_name || "",
    category: initialData?.category || "geral",
    is_visible: initialData?.is_visible ?? true,
  });

  const isFileType = form.resource_type === "pdf" || form.resource_type === "audio";

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("Arquivo muito grande. Máximo 10MB.");
        return;
      }
      setSelectedFile(file);
      // Auto-fill title if empty
      if (!form.title) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        setForm(prev => ({ ...prev, title: nameWithoutExt }));
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadFile = async (file: File): Promise<{ url: string; fileName: string }> => {
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${timestamp}_${sanitizedName}`;
    
    const { error } = await supabase.storage
      .from("therapeutic-resources")
      .upload(filePath, file);
      
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from("therapeutic-resources")
      .getPublicUrl(filePath);
      
    return { url: publicUrl, fileName: file.name };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    setLoading(true);
    try {
      let resourceUrl = form.resource_url;
      let resourceFileName = form.resource_file_name;

      // Upload file if selected
      if (selectedFile && isFileType) {
        setUploading(true);
        const { url, fileName } = await uploadFile(selectedFile);
        resourceUrl = url;
        resourceFileName = fileName;
        setUploading(false);
      }

      await onSubmit({
        patient_id: patientId || null,
        title: form.title,
        description: form.description || undefined,
        resource_type: form.resource_type,
        resource_url: resourceUrl || undefined,
        resource_file_name: resourceFileName || undefined,
        category: form.category,
        is_visible: form.is_visible,
      });
      
      onOpenChange(false);
      setForm({
        title: "",
        description: "",
        resource_type: "link",
        resource_url: "",
        resource_file_name: "",
        category: "geral",
        is_visible: true,
      });
      setSelectedFile(null);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleTypeChange = (value: string) => {
    setForm({ ...form, resource_type: value, resource_url: "", resource_file_name: "" });
    setSelectedFile(null);
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
                onValueChange={handleTypeChange}
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

          {/* File Upload for PDF/Audio */}
          {isFileType && (
            <div className="space-y-2">
              <Label>Arquivo</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept={form.resource_type === "pdf" ? ".pdf,.doc,.docx" : ".mp3,.wav,.m4a,.ogg"}
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {selectedFile ? (
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                  <File className="w-8 h-8 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                >
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Clique para selecionar um arquivo
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {form.resource_type === "pdf" ? "PDF, DOC, DOCX" : "MP3, WAV, M4A"} (máx. 10MB)
                  </p>
                </div>
              )}

              {/* Optional: Also allow URL for files already hosted */}
              {!selectedFile && (
                <div className="mt-3">
                  <Label htmlFor="url" className="text-xs text-muted-foreground">
                    Ou insira uma URL externa
                  </Label>
                  <Input
                    id="url"
                    type="url"
                    value={form.resource_url}
                    onChange={(e) => setForm({ ...form, resource_url: e.target.value })}
                    placeholder="https://..."
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          )}

          {/* URL input for Link/Video types */}
          {!isFileType && (
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
          )}

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
              {(loading || uploading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {uploading ? "Enviando..." : initialData ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}