import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  Upload,
  BookOpen,
  Loader2,
  Brain,
  Heart,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  file_name: string | null;
  file_type: string | null;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { value: "tcc", label: "TCC", icon: Brain },
  { value: "terapia_sexual", label: "Terapia Sexual", icon: Heart },
  { value: "tecnicas", label: "Técnicas", icon: FileText },
  { value: "artigos", label: "Artigos Científicos", icon: BookOpen },
  { value: "geral", label: "Geral", icon: FileText },
];

export const KnowledgeManager = () => {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "geral",
    file_name: "",
  });

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;

      const { data, error } = await supabase
        .from("ai_knowledge_documents")
        .select("*")
        .eq("user_id", sessionData.session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments((data || []) as KnowledgeDocument[]);
    } catch (error) {
      console.error("Error loading documents:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os documentos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Only accept text files
    const allowedTypes = ["text/plain", "text/markdown", "application/json"];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith(".md") && !file.name.endsWith(".txt")) {
      toast({
        title: "Tipo de arquivo não suportado",
        description: "Por favor, envie apenas arquivos de texto (.txt, .md).",
        variant: "destructive",
      });
      return;
    }

    try {
      const content = await file.text();
      setFormData(prev => ({
        ...prev,
        content,
        file_name: file.name,
        title: prev.title || file.name.replace(/\.[^.]+$/, ""),
      }));
      toast({
        title: "Arquivo carregado",
        description: `Conteúdo de "${file.name}" importado com sucesso.`,
      });
    } catch (error) {
      console.error("Error reading file:", error);
      toast({
        title: "Erro ao ler arquivo",
        description: "Não foi possível ler o conteúdo do arquivo.",
        variant: "destructive",
      });
    }

    e.target.value = "";
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e o conteúdo.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("Não autenticado");

      if (isEditing && selectedDoc) {
        const { error } = await supabase
          .from("ai_knowledge_documents")
          .update({
            title: formData.title,
            content: formData.content,
            category: formData.category,
            file_name: formData.file_name || null,
          })
          .eq("id", selectedDoc.id);

        if (error) throw error;
        toast({ title: "Documento atualizado!" });
      } else {
        const { error } = await supabase
          .from("ai_knowledge_documents")
          .insert({
            user_id: sessionData.session.user.id,
            title: formData.title,
            content: formData.content,
            category: formData.category,
            file_name: formData.file_name || null,
            file_type: "text",
          });

        if (error) throw error;
        toast({ title: "Documento adicionado!" });
      }

      setIsDialogOpen(false);
      resetForm();
      loadDocuments();
    } catch (error) {
      console.error("Error saving document:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o documento.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (doc: KnowledgeDocument) => {
    if (!confirm(`Excluir "${doc.title}"?`)) return;

    try {
      const { error } = await supabase
        .from("ai_knowledge_documents")
        .delete()
        .eq("id", doc.id);

      if (error) throw error;
      toast({ title: "Documento excluído!" });
      loadDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o documento.",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (doc: KnowledgeDocument) => {
    try {
      const { error } = await supabase
        .from("ai_knowledge_documents")
        .update({ is_active: !doc.is_active })
        .eq("id", doc.id);

      if (error) throw error;
      loadDocuments();
    } catch (error) {
      console.error("Error toggling document:", error);
    }
  };

  const handleEdit = (doc: KnowledgeDocument) => {
    setSelectedDoc(doc);
    setFormData({
      title: doc.title,
      content: doc.content,
      category: doc.category,
      file_name: doc.file_name || "",
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      category: "geral",
      file_name: "",
    });
    setSelectedDoc(null);
    setIsEditing(false);
  };

  const handleNewDocument = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getCategoryConfig = (category: string) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[CATEGORIES.length - 1];
  };

  const activeCount = documents.filter(d => d.is_active).length;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Base de Conhecimento
            </h2>
            <p className="text-sm text-muted-foreground">
              Adicione documentos para enriquecer as respostas da IA
            </p>
          </div>
          <Button onClick={handleNewDocument}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Documento
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="card-glass">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Documentos</p>
                  <p className="text-2xl font-bold">{documents.length}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-glass">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ativos na IA</p>
                  <p className="text-2xl font-bold text-green-500">{activeCount}</p>
                </div>
                <Brain className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-glass">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Caracteres Totais</p>
                  <p className="text-2xl font-bold">
                    {documents.filter(d => d.is_active).reduce((acc, d) => acc + d.content.length, 0).toLocaleString()}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-primary">Como funciona a Base de Conhecimento?</p>
                <p className="text-muted-foreground mt-1">
                  Documentos ativos são automaticamente incluídos no contexto da IA, permitindo respostas mais personalizadas 
                  e baseadas no seu material de referência (artigos, protocolos, técnicas, etc.).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card className="card-glass">
          <CardHeader>
            <CardTitle className="text-base">Documentos</CardTitle>
            <CardDescription>
              Gerencie o conteúdo que alimenta a IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum documento adicionado ainda</p>
                <p className="text-sm mt-1">Adicione artigos, protocolos ou técnicas para enriquecer a IA</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {documents.map((doc) => {
                    const categoryConfig = getCategoryConfig(doc.category);
                    const CategoryIcon = categoryConfig.icon;
                    
                    return (
                      <div
                        key={doc.id}
                        className={`p-4 rounded-lg border ${
                          doc.is_active ? "bg-muted/50" : "bg-muted/20 opacity-60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                              <h4 className="font-medium truncate">{doc.title}</h4>
                              <Badge variant="secondary" className="text-xs">
                                {categoryConfig.label}
                              </Badge>
                              {doc.is_active ? (
                                <Badge className="bg-green-500/10 text-green-500 text-xs">Ativo</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">Inativo</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {doc.content.slice(0, 200)}...
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {doc.content.length.toLocaleString()} caracteres • 
                              Atualizado em {format(new Date(doc.updated_at), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={doc.is_active}
                              onCheckedChange={() => handleToggleActive(doc)}
                            />
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(doc)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(doc)}>
                              <Trash2 className="h-4 w-4" />
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
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Documento" : "Adicionar Documento"}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Atualize o conteúdo do documento" 
                : "Adicione um novo documento à base de conhecimento da IA"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Protocolo de TCC para Ansiedade"
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
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
              <div className="flex items-center justify-between">
                <Label>Conteúdo *</Label>
                <div>
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".txt,.md,.json"
                    onChange={handleFileUpload}
                  />
                  <Button variant="outline" size="sm" asChild>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Importar Arquivo
                    </label>
                  </Button>
                </div>
              </div>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Cole ou digite o conteúdo do documento aqui..."
                className="min-h-[300px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {formData.content.length.toLocaleString()} caracteres
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                isEditing ? "Atualizar" : "Adicionar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
