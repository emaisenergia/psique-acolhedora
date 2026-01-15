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
  BookOpen,
  Loader2,
  Brain,
  Heart,
  AlertCircle,
  FileUp,
  Sparkles,
  Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CBT_TEMPLATES, SEXUAL_THERAPY_TEMPLATES, type KnowledgeTemplate } from "@/data/cbtTemplates";
import * as pdfjsLib from "pdfjs-dist";

// Set the worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

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
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
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

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = "";
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n\n";
    }
    
    return fullText.trim();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const isText = ["text/plain", "text/markdown", "application/json"].includes(file.type) || 
                   file.name.endsWith(".md") || file.name.endsWith(".txt");

    if (!isPdf && !isText) {
      toast({
        title: "Tipo de arquivo não suportado",
        description: "Por favor, envie arquivos PDF ou de texto (.txt, .md).",
        variant: "destructive",
      });
      return;
    }

    try {
      let content: string;

      if (isPdf) {
        setIsExtractingPdf(true);
        toast({
          title: "Processando PDF...",
          description: "Extraindo texto do documento. Aguarde.",
        });
        content = await extractTextFromPdf(file);
        setIsExtractingPdf(false);
      } else {
        content = await file.text();
      }

      setFormData(prev => ({
        ...prev,
        content,
        file_name: file.name,
        title: prev.title || file.name.replace(/\.[^.]+$/, ""),
      }));
      
      toast({
        title: "Arquivo carregado",
        description: `Conteúdo de "${file.name}" importado com sucesso.${isPdf ? ` (${content.length.toLocaleString()} caracteres extraídos)` : ""}`,
      });
    } catch (error) {
      console.error("Error reading file:", error);
      setIsExtractingPdf(false);
      toast({
        title: "Erro ao ler arquivo",
        description: isPdf 
          ? "Não foi possível extrair o texto do PDF. O arquivo pode estar protegido ou corrompido."
          : "Não foi possível ler o conteúdo do arquivo.",
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

  const handleAddTemplate = async (template: KnowledgeTemplate) => {
    setIsSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("Não autenticado");

      const { error } = await supabase
        .from("ai_knowledge_documents")
        .insert({
          user_id: sessionData.session.user.id,
          title: template.title,
          content: template.content,
          category: template.category,
          file_type: "template",
          is_active: true,
        });

      if (error) throw error;
      
      toast({ 
        title: "Template adicionado!",
        description: `"${template.title}" foi adicionado à base de conhecimento.`,
      });
      loadDocuments();
    } catch (error) {
      console.error("Error adding template:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o template.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAllTemplates = async (templates: KnowledgeTemplate[]) => {
    setIsSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("Não autenticado");

      const documents = templates.map(template => ({
        user_id: sessionData.session!.user.id,
        title: template.title,
        content: template.content,
        category: template.category,
        file_type: "template",
        is_active: true,
      }));

      const { error } = await supabase
        .from("ai_knowledge_documents")
        .insert(documents);

      if (error) throw error;
      
      toast({ 
        title: "Templates adicionados!",
        description: `${templates.length} templates foram adicionados à base de conhecimento.`,
      });
      setIsTemplateDialogOpen(false);
      loadDocuments();
    } catch (error) {
      console.error("Error adding templates:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar os templates.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryConfig = (category: string) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[CATEGORIES.length - 1];
  };

  const activeCount = documents.filter(d => d.is_active).length;

  const existingTemplateTitles = documents.map(d => d.title);
  const isTemplateAdded = (title: string) => existingTemplateTitles.includes(title);

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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(true)}>
              <Sparkles className="h-4 w-4 mr-2" />
              Templates TCC
            </Button>
            <Button onClick={handleNewDocument}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Documento
            </Button>
          </div>
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
                  e baseadas no seu material de referência (artigos, protocolos, técnicas, etc.). Você pode importar PDFs e textos.
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
                <div className="flex gap-2">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".txt,.md,.json,.pdf"
                    onChange={handleFileUpload}
                    disabled={isExtractingPdf}
                  />
                  <Button variant="outline" size="sm" asChild disabled={isExtractingPdf}>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      {isExtractingPdf ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <FileUp className="h-4 w-4 mr-2" />
                      )}
                      {isExtractingPdf ? "Extraindo..." : "Importar PDF/TXT"}
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
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Salvar Alterações" : "Adicionar Documento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Templates Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Templates de Técnicas
            </DialogTitle>
            <DialogDescription>
              Adicione templates prontos de TCC e Terapia Sexual à base de conhecimento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* CBT Templates */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  Terapia Cognitivo-Comportamental
                </h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleAddAllTemplates(CBT_TEMPLATES)}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Adicionar Todos ({CBT_TEMPLATES.length})
                </Button>
              </div>
              <div className="grid gap-2">
                {CBT_TEMPLATES.map((template) => (
                  <div 
                    key={template.title}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                  >
                    <div>
                      <p className="font-medium text-sm">{template.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {template.content.length.toLocaleString()} caracteres
                      </p>
                    </div>
                    {isTemplateAdded(template.title) ? (
                      <Badge variant="secondary" className="text-green-600">
                        <Check className="h-3 w-3 mr-1" />
                        Adicionado
                      </Badge>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleAddTemplate(template)}
                        disabled={isSaving}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Sexual Therapy Templates */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Heart className="h-4 w-4 text-rose-500" />
                  Terapia Sexual
                </h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleAddAllTemplates(SEXUAL_THERAPY_TEMPLATES)}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Adicionar Todos ({SEXUAL_THERAPY_TEMPLATES.length})
                </Button>
              </div>
              <div className="grid gap-2">
                {SEXUAL_THERAPY_TEMPLATES.map((template) => (
                  <div 
                    key={template.title}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                  >
                    <div>
                      <p className="font-medium text-sm">{template.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {template.content.length.toLocaleString()} caracteres
                      </p>
                    </div>
                    {isTemplateAdded(template.title) ? (
                      <Badge variant="secondary" className="text-green-600">
                        <Check className="h-3 w-3 mr-1" />
                        Adicionado
                      </Badge>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleAddTemplate(template)}
                        disabled={isSaving}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
