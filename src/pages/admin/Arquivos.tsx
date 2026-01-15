import { useState, useEffect, useCallback, useRef, DragEvent } from "react";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FolderOpen,
  FileText,
  Upload,
  Trash2,
  Download,
  MoreVertical,
  Loader2,
  Search,
  File,
  FileImage,
  FileAudio,
  FileVideo,
  FilePlus,
  FolderPlus,
  HardDrive,
  Eye,
  Link,
  User,
  Calendar,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePatients } from "@/hooks/usePatients";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface StorageFile {
  id: string;
  name: string;
  bucket_id: string;
  created_at: string;
  updated_at: string;
  metadata: {
    size?: number;
    mimetype?: string;
  };
}

interface PreviewFile {
  url: string;
  name: string;
  type: "image" | "pdf" | "other";
}

const formatFileSize = (bytes: number | undefined): string => {
  if (!bytes) return "N/A";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (mimeType: string | undefined) => {
  if (!mimeType) return File;
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.startsWith("audio/")) return FileAudio;
  if (mimeType.startsWith("video/")) return FileVideo;
  if (mimeType.includes("pdf")) return FileText;
  return File;
};

const getFileTypeLabel = (mimeType: string | undefined): string => {
  if (!mimeType) return "Arquivo";
  if (mimeType.startsWith("image/")) return "Imagem";
  if (mimeType.startsWith("audio/")) return "Áudio";
  if (mimeType.startsWith("video/")) return "Vídeo";
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("word") || mimeType.includes("document")) return "Documento";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "Planilha";
  return "Arquivo";
};

const getPreviewType = (mimeType: string | undefined): "image" | "pdf" | "other" => {
  if (!mimeType) return "other";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.includes("pdf")) return "pdf";
  return "other";
};

const Arquivos = () => {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBucket, setSelectedBucket] = useState<"documents" | "session-files">("documents");
  const [currentFolder, setCurrentFolder] = useState("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);
  const [imageZoom, setImageZoom] = useState(100);
  const [imageRotation, setImageRotation] = useState(0);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { patients } = usePatients();

  const loadFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const path = currentFolder || "";
      const { data, error } = await supabase.storage
        .from(selectedBucket)
        .list(path, {
          limit: 100,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (error) throw error;
      
      // Filter out .emptyFolderPlaceholder files
      const filteredData = (data || []).filter(f => f.name !== ".emptyFolderPlaceholder");
      setFiles(filteredData as StorageFile[]);
    } catch (error) {
      console.error("Error loading files:", error);
      toast({
        title: "Erro ao carregar arquivos",
        description: "Não foi possível carregar os arquivos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedBucket, currentFolder, toast]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleUpload = async () => {
    if (!uploadFiles || uploadFiles.length === 0) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Selecione arquivos para fazer upload.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < uploadFiles.length; i++) {
      const file = uploadFiles[i];
      let filePath = currentFolder ? `${currentFolder}/${file.name}` : file.name;
      
      // If a patient is selected, prefix with patient ID
      if (selectedPatient && selectedBucket === "documents") {
        filePath = `pacientes/${selectedPatient}/${file.name}`;
      }

      try {
        const { error } = await supabase.storage
          .from(selectedBucket)
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) {
          if (error.message.includes("already exists")) {
            // Try with timestamp
            const timestamp = Date.now();
            const ext = file.name.split(".").pop();
            const name = file.name.replace(`.${ext}`, "");
            const newPath = currentFolder 
              ? `${currentFolder}/${name}_${timestamp}.${ext}`
              : `${name}_${timestamp}.${ext}`;
            
            await supabase.storage.from(selectedBucket).upload(newPath, file);
          } else {
            throw error;
          }
        }
        successCount++;
      } catch (error) {
        console.error("Error uploading file:", file.name, error);
        errorCount++;
      }
    }

    setIsUploading(false);
    setIsUploadDialogOpen(false);
    setUploadFiles(null);
    setSelectedPatient("");

    if (successCount > 0) {
      toast({
        title: "Upload concluído",
        description: `${successCount} arquivo(s) enviado(s) com sucesso.${errorCount > 0 ? ` ${errorCount} erro(s).` : ""}`,
      });
      loadFiles();
    } else {
      toast({
        title: "Erro no upload",
        description: "Nenhum arquivo foi enviado.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (file: StorageFile) => {
    if (!confirm(`Excluir "${file.name}"? Esta ação não pode ser desfeita.`)) return;

    try {
      const filePath = currentFolder ? `${currentFolder}/${file.name}` : file.name;
      const { error } = await supabase.storage
        .from(selectedBucket)
        .remove([filePath]);

      if (error) throw error;
      
      toast({ title: "Arquivo excluído!" });
      loadFiles();
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o arquivo.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (file: StorageFile) => {
    try {
      const filePath = currentFolder ? `${currentFolder}/${file.name}` : file.name;
      const { data, error } = await supabase.storage
        .from(selectedBucket)
        .download(filePath);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast({
        title: "Erro ao baixar",
        description: "Não foi possível baixar o arquivo.",
        variant: "destructive",
      });
    }
  };

  const handleCopyLink = async (file: StorageFile) => {
    try {
      const filePath = currentFolder ? `${currentFolder}/${file.name}` : file.name;
      const { data } = await supabase.storage
        .from(selectedBucket)
        .getPublicUrl(filePath);

      await navigator.clipboard.writeText(data.publicUrl);
      toast({ title: "Link copiado!", description: "URL do arquivo copiada para a área de transferência." });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      });
    }
  };

  const handlePreview = async (file: StorageFile) => {
    try {
      const filePath = currentFolder ? `${currentFolder}/${file.name}` : file.name;
      const { data } = await supabase.storage
        .from(selectedBucket)
        .getPublicUrl(filePath);

      const previewType = getPreviewType(file.metadata?.mimetype);
      
      if (previewType === "other") {
        window.open(data.publicUrl, "_blank");
      } else {
        setPreviewFile({
          url: data.publicUrl,
          name: file.name,
          type: previewType,
        });
        setImageZoom(100);
        setImageRotation(0);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível visualizar o arquivo.",
        variant: "destructive",
      });
    }
  };

  // Drag and Drop handlers
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set drag over to false if leaving the drop zone entirely
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      setIsUploading(true);
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < droppedFiles.length; i++) {
        const file = droppedFiles[i];
        let filePath = currentFolder ? `${currentFolder}/${file.name}` : file.name;

        try {
          const { error } = await supabase.storage
            .from(selectedBucket)
            .upload(filePath, file, {
              cacheControl: "3600",
              upsert: false,
            });

          if (error) {
            if (error.message.includes("already exists")) {
              const timestamp = Date.now();
              const ext = file.name.split(".").pop();
              const name = file.name.replace(`.${ext}`, "");
              const newPath = currentFolder 
                ? `${currentFolder}/${name}_${timestamp}.${ext}`
                : `${name}_${timestamp}.${ext}`;
              
              await supabase.storage.from(selectedBucket).upload(newPath, file);
            } else {
              throw error;
            }
          }
          successCount++;
        } catch (error) {
          console.error("Error uploading file:", file.name, error);
          errorCount++;
        }
      }

      setIsUploading(false);

      if (successCount > 0) {
        toast({
          title: "Upload concluído",
          description: `${successCount} arquivo(s) enviado(s) com sucesso.${errorCount > 0 ? ` ${errorCount} erro(s).` : ""}`,
        });
        loadFiles();
      } else {
        toast({
          title: "Erro no upload",
          description: "Nenhum arquivo foi enviado.",
          variant: "destructive",
        });
      }
    }
  }, [currentFolder, selectedBucket, toast, loadFiles]);

  const handleCreateFolder = async () => {
    const folderName = prompt("Nome da pasta:");
    if (!folderName) return;

    try {
      const folderPath = currentFolder 
        ? `${currentFolder}/${folderName}/.emptyFolderPlaceholder`
        : `${folderName}/.emptyFolderPlaceholder`;
      
      const { error } = await supabase.storage
        .from(selectedBucket)
        .upload(folderPath, new Blob([""]), { contentType: "text/plain" });

      if (error) throw error;
      
      toast({ title: "Pasta criada!" });
      loadFiles();
    } catch (error) {
      console.error("Error creating folder:", error);
      toast({
        title: "Erro ao criar pasta",
        description: "Não foi possível criar a pasta.",
        variant: "destructive",
      });
    }
  };

  const navigateToFolder = (folderName: string) => {
    setCurrentFolder(currentFolder ? `${currentFolder}/${folderName}` : folderName);
  };

  const navigateUp = () => {
    const parts = currentFolder.split("/");
    parts.pop();
    setCurrentFolder(parts.join("/"));
  };

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSize = files.reduce((acc, f) => acc + (f.metadata?.size || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-light flex items-center gap-2">
              <FolderOpen className="h-6 w-6 text-primary" />
              Arquivos
            </h1>
            <p className="text-muted-foreground">
              Organize e gerencie seus documentos e arquivos de sessão
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCreateFolder}>
              <FolderPlus className="h-4 w-4 mr-2" />
              Nova Pasta
            </Button>
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="card-glass">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Arquivos</p>
                  <p className="text-2xl font-bold">{files.length}</p>
                </div>
                <File className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-glass">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Espaço Usado</p>
                  <p className="text-2xl font-bold">{formatFileSize(totalSize)}</p>
                </div>
                <HardDrive className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-glass">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bucket Atual</p>
                  <p className="text-2xl font-bold capitalize">{selectedBucket.replace("-", " ")}</p>
                </div>
                <FolderOpen className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card 
          ref={dropZoneRef}
          className={`card-glass relative transition-all duration-200 ${
            isDragOver 
              ? "ring-2 ring-primary ring-offset-2 bg-primary/5" 
              : ""
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Drag overlay */}
          {isDragOver && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg border-2 border-dashed border-primary">
              <div className="text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-primary animate-bounce" />
                <p className="text-lg font-medium text-primary">Solte os arquivos aqui</p>
                <p className="text-sm text-muted-foreground">para fazer upload</p>
              </div>
            </div>
          )}

          {/* Upload progress overlay */}
          {isUploading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
              <div className="text-center">
                <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
                <p className="text-lg font-medium">Enviando arquivos...</p>
              </div>
            </div>
          )}

          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Gerenciador de Arquivos</CardTitle>
                <CardDescription>
                  {currentFolder ? `/${currentFolder}` : "Raiz do bucket"} • Arraste arquivos para fazer upload
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar arquivos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <Select value={selectedBucket} onValueChange={(v: "documents" | "session-files") => {
                  setSelectedBucket(v);
                  setCurrentFolder("");
                }}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="documents">Documentos</SelectItem>
                    <SelectItem value="session-files">Sessões</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Breadcrumb */}
            {currentFolder && (
              <div className="flex items-center gap-2 mb-4 text-sm">
                <Button variant="ghost" size="sm" onClick={() => setCurrentFolder("")}>
                  Raiz
                </Button>
                {currentFolder.split("/").map((part, idx, arr) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-muted-foreground">/</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentFolder(arr.slice(0, idx + 1).join("/"))}
                    >
                      {part}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Navigation */}
            {currentFolder && (
              <Button variant="outline" size="sm" className="mb-4" onClick={navigateUp}>
                ← Voltar
              </Button>
            )}

            {/* Files List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum arquivo encontrado</p>
                <p className="text-sm mt-1">Faça upload de arquivos para começar</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredFiles.map((file) => {
                    const isFolder = file.id === null || file.metadata === null;
                    const FileIcon = isFolder ? FolderOpen : getFileIcon(file.metadata?.mimetype);
                    
                    return (
                      <div
                        key={file.name}
                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div 
                          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                          onClick={() => isFolder ? navigateToFolder(file.name) : handlePreview(file)}
                        >
                          <FileIcon className={`h-8 w-8 flex-shrink-0 ${isFolder ? "text-primary" : "text-muted-foreground"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{file.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {!isFolder && (
                                <>
                                  <Badge variant="secondary" className="text-xs">
                                    {getFileTypeLabel(file.metadata?.mimetype)}
                                  </Badge>
                                  <span>{formatFileSize(file.metadata?.size)}</span>
                                  <span>•</span>
                                </>
                              )}
                              <span>
                                {format(new Date(file.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {!isFolder && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handlePreview(file)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownload(file)}>
                                <Download className="h-4 w-4 mr-2" />
                                Baixar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCopyLink(file)}>
                                <Link className="h-4 w-4 mr-2" />
                                Copiar Link
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(file)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload de Arquivos
            </DialogTitle>
            <DialogDescription>
              Faça upload de arquivos para o bucket "{selectedBucket}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedBucket === "documents" && (
              <div className="space-y-2">
                <Label>Vincular a Paciente (opcional)</Label>
                <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um paciente..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum (pasta raiz)</SelectItem>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Arquivos serão salvos em /pacientes/{selectedPatient || "[id]"}/
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Arquivos</Label>
              <Input
                type="file"
                multiple
                onChange={(e) => setUploadFiles(e.target.files)}
                className="cursor-pointer"
              />
              {uploadFiles && uploadFiles.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {uploadFiles.length} arquivo(s) selecionado(s)
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={isUploading || !uploadFiles}>
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Fazer Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 truncate pr-4">
                {previewFile?.type === "image" ? (
                  <FileImage className="h-5 w-5 text-primary" />
                ) : (
                  <FileText className="h-5 w-5 text-primary" />
                )}
                <span className="truncate">{previewFile?.name}</span>
              </DialogTitle>
              {previewFile?.type === "image" && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setImageZoom(Math.max(25, imageZoom - 25))}
                    disabled={imageZoom <= 25}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground w-12 text-center">
                    {imageZoom}%
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setImageZoom(Math.min(200, imageZoom + 25))}
                    disabled={imageZoom >= 200}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setImageRotation((imageRotation + 90) % 360)}
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto p-4 bg-muted/30 min-h-[60vh]">
            {previewFile?.type === "image" && (
              <div className="flex items-center justify-center min-h-full">
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="max-w-full transition-transform duration-200"
                  style={{
                    transform: `scale(${imageZoom / 100}) rotate(${imageRotation}deg)`,
                    transformOrigin: "center center",
                  }}
                />
              </div>
            )}
            {previewFile?.type === "pdf" && (
              <iframe
                src={previewFile.url}
                title={previewFile.name}
                className="w-full h-[70vh] border-0 rounded-lg"
              />
            )}
          </div>

          <div className="p-4 pt-2 border-t flex justify-between items-center">
            <a
              href={previewFile?.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              Abrir em nova aba
            </a>
            <Button variant="outline" onClick={() => setPreviewFile(null)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Arquivos;
