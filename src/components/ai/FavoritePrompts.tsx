import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Star,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Loader2,
  Sparkles,
  Brain,
  FileText,
  ClipboardList,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFavoritePrompts, type FavoritePrompt } from "@/hooks/useFavoritePrompts";

const CATEGORIES = [
  { value: "tcc", label: "TCC", icon: Brain },
  { value: "sessao", label: "Sessão", icon: ClipboardList },
  { value: "relatorio", label: "Relatório", icon: FileText },
  { value: "geral", label: "Geral", icon: Sparkles },
];

interface FavoritePromptsProps {
  onSelectPrompt?: (prompt: string) => void;
}

export const FavoritePrompts = ({ onSelectPrompt }: FavoritePromptsProps) => {
  const { prompts, loading, createPrompt, updatePrompt, deletePrompt, trackUsage } = useFavoritePrompts();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<FavoritePrompt | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "geral",
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e o prompt.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    if (editingPrompt) {
      await updatePrompt(editingPrompt.id, {
        title: formData.title,
        content: formData.content,
        category: formData.category,
      });
    } else {
      await createPrompt({
        title: formData.title,
        content: formData.content,
        category: formData.category,
      });
    }
    setSaving(false);
    resetForm();
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este prompt?")) return;
    await deletePrompt(id);
  };

  const handleEdit = (prompt: FavoritePrompt) => {
    setEditingPrompt(prompt);
    setFormData({
      title: prompt.title,
      content: prompt.content,
      category: prompt.category,
    });
    setIsDialogOpen(true);
  };

  const handleCopy = async (content: string) => {
    await navigator.clipboard.writeText(content);
    toast({ title: "Copiado!", description: "Prompt copiado para a área de transferência." });
  };

  const handleUsePrompt = async (prompt: FavoritePrompt) => {
    await trackUsage(prompt.id);
    if (onSelectPrompt) {
      onSelectPrompt(prompt.content);
      toast({ title: "Prompt aplicado!", description: "O prompt foi enviado ao chat." });
    } else {
      handleCopy(prompt.content);
    }
  };

  const resetForm = () => {
    setFormData({ title: "", content: "", category: "geral" });
    setEditingPrompt(null);
  };

  const handleNewPrompt = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getCategoryConfig = (category: string) => {
    return CATEGORIES.find((c) => c.value === category) || CATEGORIES[CATEGORIES.length - 1];
  };

  return (
    <>
      <Card className="card-glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Prompts Favoritos
            </span>
            <Button size="sm" onClick={handleNewPrompt}>
              <Plus className="h-4 w-4 mr-1" />
              Novo
            </Button>
          </CardTitle>
          <CardDescription>
            Salve e reutilize seus prompts mais usados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : prompts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Star className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum prompt salvo</p>
              <p className="text-xs mt-1">Clique em "Novo" para adicionar</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {prompts.map((prompt) => {
                  const categoryConfig = getCategoryConfig(prompt.category);
                  const CategoryIcon = categoryConfig.icon;
                  
                  return (
                    <div
                      key={prompt.id}
                      className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CategoryIcon className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium text-sm truncate">{prompt.title}</span>
                            <Badge variant="secondary" className="text-xs">
                              {categoryConfig.label}
                            </Badge>
                            {prompt.usage_count > 0 && (
                              <span className="text-xs text-muted-foreground">
                                ({prompt.usage_count}x)
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {prompt.content}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleUsePrompt(prompt)}
                            title="Usar prompt"
                          >
                            <Sparkles className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleCopy(prompt.content)}
                            title="Copiar"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEdit(prompt)}
                            title="Editar"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleDelete(prompt.id)}
                            title="Excluir"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPrompt ? "Editar Prompt" : "Novo Prompt Favorito"}
            </DialogTitle>
            <DialogDescription>
              Salve prompts que você usa frequentemente para reutilizá-los facilmente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Resumo de sessão TCC"
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
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

            <div className="space-y-2">
              <Label>Prompt *</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Digite o prompt que será enviado à IA..."
                className="min-h-[120px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingPrompt ? "Salvar Alterações" : "Salvar Prompt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
