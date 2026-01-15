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
  LayoutGrid,
  LayoutList,
  CheckSquare,
  Square,
  CheckCheck,
  Tag,
  FolderInput,
  Plus,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePatients } from "@/hooks/usePatients";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FileTag {
  id: string;
  bucket_id: string;
  file_path: string;
  tag: string;
  color: string;
}

const TAG_COLORS = [
  { name: "Azul", value: "blue", class: "bg-blue-500" },
  { name: "Verde", value: "green", class: "bg-green-500" },
  { name: "Amarelo", value: "yellow", class: "bg-yellow-500" },
  { name: "Vermelho", value: "red", class: "bg-red-500" },
  { name: "Roxo", value: "purple", class: "bg-purple-500" },
  { name: "Rosa", value: "pink", class: "bg-pink-500" },
  { name: "Laranja", value: "orange", class: "bg-orange-500" },
  { name: "Cinza", value: "gray", class: "bg-gray-500" },
];

const getTagColorClass = (color: string) => {
  const found = TAG_COLORS.find(c => c.value === color);
  return found?.class || "bg-blue-500";
};

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
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [fileTags, setFileTags] = useState<FileTag[]>([]);
  const [tagFilter, setTagFilter] = useState<string>("");
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("blue");
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [moveTargetFolder, setMoveTargetFolder] = useState("");
  const [isMoving, setIsMoving] = useState(false);
  const [availableFolders, setAvailableFolders] = useState<string[]>([]);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { patients } = usePatients();

  // Thumbnail URLs cache
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({});

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

  // Load thumbnail URLs for images
  useEffect(() => {
    const loadThumbnails = async () => {
      const imageFiles = files.filter(f => 
        f.metadata?.mimetype?.startsWith("image/") && f.id !== null
      );
      
      const urls: Record<string, string> = {};
      for (const file of imageFiles) {
        const filePath = currentFolder ? `${currentFolder}/${file.name}` : file.name;
        const { data } = await supabase.storage
          .from(selectedBucket)
          .getPublicUrl(filePath);
        urls[file.name] = data.publicUrl;
      }
      setThumbnailUrls(urls);
    };

    if (files.length > 0) {
      loadThumbnails();
    }
  }, [files, currentFolder, selectedBucket]);

  // Load file tags
  const loadFileTags = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("file_tags")
        .select("*")
        .eq("bucket_id", selectedBucket);
      
      if (error) throw error;
      setFileTags(data || []);
    } catch (error) {
      console.error("Error loading tags:", error);
    }
  }, [selectedBucket]);

  // Load available folders
  const loadFolders = useCallback(async () => {
    try {
      const { data, error } = await supabase.storage
        .from(selectedBucket)
        .list("", { limit: 100 });
      
      if (error) throw error;
      
      const folders = (data || [])
        .filter(f => f.id === null || f.metadata === null)
        .map(f => f.name);
      
      setAvailableFolders(folders);
    } catch (error) {
      console.error("Error loading folders:", error);
    }
  }, [selectedBucket]);

  useEffect(() => {
    loadFiles();
    loadFileTags();
    loadFolders();
    setSelectedFiles(new Set()); // Clear selection when changing folder/bucket
  }, [loadFiles, loadFileTags, loadFolders]);

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
      setSelectedFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.name);
        return newSet;
      });
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

  // Batch delete selected files
  const handleBatchDelete = async () => {
    if (selectedFiles.size === 0) return;
    
    const confirmMsg = `Excluir ${selectedFiles.size} arquivo(s) selecionado(s)? Esta ação não pode ser desfeita.`;
    if (!confirm(confirmMsg)) return;

    setIsDeleting(true);
    let successCount = 0;
    let errorCount = 0;

    const filePaths = Array.from(selectedFiles).map(name => 
      currentFolder ? `${currentFolder}/${name}` : name
    );

    try {
      const { error } = await supabase.storage
        .from(selectedBucket)
        .remove(filePaths);

      if (error) throw error;
      successCount = filePaths.length;
    } catch (error) {
      console.error("Error batch deleting:", error);
      errorCount = filePaths.length;
    }

    setIsDeleting(false);
    setSelectedFiles(new Set());

    if (successCount > 0) {
      toast({
        title: "Arquivos excluídos",
        description: `${successCount} arquivo(s) excluído(s) com sucesso.`,
      });
      loadFiles();
    } else {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir os arquivos.",
        variant: "destructive",
      });
    }
  };

  // Batch download selected files
  const handleBatchDownload = async () => {
    if (selectedFiles.size === 0) return;

    toast({
      title: "Iniciando downloads",
      description: `Baixando ${selectedFiles.size} arquivo(s)...`,
    });

    for (const fileName of Array.from(selectedFiles)) {
      const file = files.find(f => f.name === fileName);
      if (file && file.id !== null) {
        await handleDownload(file);
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
  };

  // Toggle file selection
  const toggleFileSelection = (fileName: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileName)) {
        newSet.delete(fileName);
      } else {
        newSet.add(fileName);
      }
      return newSet;
    });
  };

  // Select all files
  const selectAllFiles = () => {
    const nonFolderFiles = filteredFiles.filter(f => f.id !== null && f.metadata !== null);
    if (selectedFiles.size === nonFolderFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(nonFolderFiles.map(f => f.name)));
    }
  };

  // Add tag to file
  const addTagToFile = async (fileName: string, tag: string, color: string) => {
    const filePath = currentFolder ? `${currentFolder}/${fileName}` : fileName;
    
    try {
      const { error } = await supabase.from("file_tags").insert({
        bucket_id: selectedBucket,
        file_path: filePath,
        tag,
        color,
      });
      
      if (error) {
        if (error.code === "23505") {
          toast({ title: "Tag já existe", description: "Este arquivo já possui esta tag." });
          return;
        }
        throw error;
      }
      
      toast({ title: "Tag adicionada!" });
      loadFileTags();
    } catch (error) {
      console.error("Error adding tag:", error);
      toast({
        title: "Erro ao adicionar tag",
        description: "Não foi possível adicionar a tag.",
        variant: "destructive",
      });
    }
  };

  // Remove tag from file
  const removeTagFromFile = async (tagId: string) => {
    try {
      const { error } = await supabase.from("file_tags").delete().eq("id", tagId);
      if (error) throw error;
      
      toast({ title: "Tag removida!" });
      loadFileTags();
    } catch (error) {
      console.error("Error removing tag:", error);
      toast({
        title: "Erro ao remover tag",
        description: "Não foi possível remover a tag.",
        variant: "destructive",
      });
    }
  };

  // Get tags for a specific file
  const getFileTagsList = (fileName: string) => {
    const filePath = currentFolder ? `${currentFolder}/${fileName}` : fileName;
    return fileTags.filter(t => t.file_path === filePath);
  };

  // Get all unique tags
  const allUniqueTags = Array.from(new Set(fileTags.map(t => t.tag)));

  // Move files to folder
  const handleMoveFiles = async () => {
    if (selectedFiles.size === 0) return;
    
    setIsMoving(true);
    let successCount = 0;
    let errorCount = 0;

    for (const fileName of Array.from(selectedFiles)) {
      const sourcePath = currentFolder ? `${currentFolder}/${fileName}` : fileName;
      const targetPath = moveTargetFolder ? `${moveTargetFolder}/${fileName}` : fileName;
      
      if (sourcePath === targetPath) continue;

      try {
        // Download the file
        const { data: fileData, error: downloadError } = await supabase.storage
          .from(selectedBucket)
          .download(sourcePath);
        
        if (downloadError) throw downloadError;

        // Upload to new location
        const { error: uploadError } = await supabase.storage
          .from(selectedBucket)
          .upload(targetPath, fileData, { upsert: false });
        
        if (uploadError) throw uploadError;

        // Delete from old location
        const { error: deleteError } = await supabase.storage
          .from(selectedBucket)
          .remove([sourcePath]);
        
        if (deleteError) throw deleteError;

        // Update tags for the moved file
        await supabase
          .from("file_tags")
          .update({ file_path: targetPath })
          .eq("bucket_id", selectedBucket)
          .eq("file_path", sourcePath);

        successCount++;
      } catch (error) {
        console.error("Error moving file:", fileName, error);
        errorCount++;
      }
    }

    setIsMoving(false);
    setIsMoveDialogOpen(false);
    setSelectedFiles(new Set());

    if (successCount > 0) {
      toast({
        title: "Arquivos movidos",
        description: `${successCount} arquivo(s) movido(s) com sucesso.${errorCount > 0 ? ` ${errorCount} erro(s).` : ""}`,
      });
      loadFiles();
      loadFileTags();
    } else {
      toast({
        title: "Erro ao mover",
        description: "Nenhum arquivo foi movido.",
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

  // Filter files by search and tag
  const filteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!tagFilter || tagFilter === "all") return matchesSearch;
    
    const filePath = currentFolder ? `${currentFolder}/${f.name}` : f.name;
    const hasTag = fileTags.some(t => t.file_path === filePath && t.tag === tagFilter);
    return matchesSearch && hasTag;
  });

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
              <div className="flex items-center gap-2 md:gap-4 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar arquivos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-48 md:w-64"
                  />
                </div>
                <Select value={selectedBucket} onValueChange={(v: "documents" | "session-files") => {
                  setSelectedBucket(v);
                  setCurrentFolder("");
                }}>
                  <SelectTrigger className="w-32 md:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="documents">Documentos</SelectItem>
                    <SelectItem value="session-files">Sessões</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* View mode toggle */}
                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="icon"
                    className="h-9 w-9 rounded-r-none"
                    onClick={() => setViewMode("list")}
                  >
                    <LayoutList className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="icon"
                    className="h-9 w-9 rounded-l-none"
                    onClick={() => setViewMode("grid")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>

                {/* Tag filter */}
                {allUniqueTags.length > 0 && (
                  <Select value={tagFilter} onValueChange={setTagFilter}>
                    <SelectTrigger className="w-32">
                      <Tag className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Tags" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {allUniqueTags.map(tag => (
                        <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
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

            {/* Selection actions bar */}
            {selectedFiles.size > 0 && (
              <div className="flex items-center justify-between p-3 mb-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2">
                  <CheckCheck className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    {selectedFiles.size} arquivo(s) selecionado(s)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMoveTargetFolder("");
                      setIsMoveDialogOpen(true);
                    }}
                  >
                    <FolderInput className="h-4 w-4 mr-2" />
                    Mover
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBatchDownload}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBatchDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Excluir
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFiles(new Set())}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {currentFolder && (
                  <Button variant="outline" size="sm" onClick={navigateUp}>
                    ← Voltar
                  </Button>
                )}
              </div>
              {filteredFiles.some(f => f.id !== null && f.metadata !== null) && (
                <Button variant="ghost" size="sm" onClick={selectAllFiles}>
                  {selectedFiles.size === filteredFiles.filter(f => f.id !== null && f.metadata !== null).length ? (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Desmarcar todos
                    </>
                  ) : (
                    <>
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Selecionar todos
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Files List/Grid */}
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
            ) : viewMode === "list" ? (
              /* List View */
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredFiles.map((file) => {
                    const isFolder = file.id === null || file.metadata === null;
                    const FileIcon = isFolder ? FolderOpen : getFileIcon(file.metadata?.mimetype);
                    const isSelected = selectedFiles.has(file.name);
                    const fileTagsList = getFileTagsList(file.name);
                    
                    return (
                      <div
                        key={file.name}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          isSelected 
                            ? "bg-primary/10 border-primary/30" 
                            : "bg-muted/30 hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {!isFolder && (
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleFileSelection(file.name)}
                              className="flex-shrink-0"
                            />
                          )}
                          <div 
                            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                            onClick={() => isFolder ? navigateToFolder(file.name) : handlePreview(file)}
                          >
                            {/* Thumbnail for images in list view */}
                            {!isFolder && file.metadata?.mimetype?.startsWith("image/") && thumbnailUrls[file.name] ? (
                              <div className="h-10 w-10 rounded overflow-hidden flex-shrink-0 bg-muted">
                                <img 
                                  src={thumbnailUrls[file.name]} 
                                  alt={file.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ) : (
                              <FileIcon className={`h-8 w-8 flex-shrink-0 ${isFolder ? "text-primary" : "text-muted-foreground"}`} />
                            )}
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
                              {/* File Tags */}
                              {fileTagsList.length > 0 && (
                                <div className="flex items-center gap-1 mt-1 flex-wrap">
                                  {fileTagsList.map(tag => (
                                    <span
                                      key={tag.id}
                                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs text-white ${getTagColorClass(tag.color)}`}
                                    >
                                      {tag.tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {!isFolder && (
                          <>
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
                            
                            {/* Tag popover */}
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Tag className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-64" align="end">
                                <div className="space-y-3">
                                  <div className="font-medium text-sm">Tags</div>
                                  
                                  {/* Existing tags */}
                                  {fileTagsList.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {fileTagsList.map(tag => (
                                        <span
                                          key={tag.id}
                                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-white ${getTagColorClass(tag.color)}`}
                                        >
                                          {tag.tag}
                                          <button
                                            onClick={() => removeTagFromFile(tag.id)}
                                            className="hover:bg-white/20 rounded-full p-0.5"
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* Add new tag */}
                                  <div className="space-y-2">
                                    <div className="flex gap-2">
                                      <Input
                                        placeholder="Nova tag..."
                                        value={newTagName}
                                        onChange={(e) => setNewTagName(e.target.value)}
                                        className="h-8 text-sm"
                                      />
                                      <Select value={newTagColor} onValueChange={setNewTagColor}>
                                        <SelectTrigger className="w-20 h-8">
                                          <div className={`w-4 h-4 rounded ${getTagColorClass(newTagColor)}`} />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {TAG_COLORS.map(c => (
                                            <SelectItem key={c.value} value={c.value}>
                                              <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded ${c.class}`} />
                                                {c.name}
                                              </div>
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <Button
                                      size="sm"
                                      className="w-full h-8"
                                      disabled={!newTagName.trim()}
                                      onClick={() => {
                                        if (newTagName.trim()) {
                                          addTagToFile(file.name, newTagName.trim(), newTagColor);
                                          setNewTagName("");
                                        }
                                      }}
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Adicionar
                                    </Button>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              /* Grid View */
              <ScrollArea className="h-[400px]">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {filteredFiles.map((file) => {
                    const isFolder = file.id === null || file.metadata === null;
                    const FileIcon = isFolder ? FolderOpen : getFileIcon(file.metadata?.mimetype);
                    const isImage = file.metadata?.mimetype?.startsWith("image/");
                    const isSelected = selectedFiles.has(file.name);
                    
                    return (
                      <div
                        key={file.name}
                        className={`relative group rounded-lg border overflow-hidden transition-all ${
                          isSelected 
                            ? "ring-2 ring-primary border-primary/30" 
                            : "hover:border-primary/50"
                        }`}
                      >
                        {/* Selection checkbox */}
                        {!isFolder && (
                          <div className={`absolute top-2 left-2 z-10 transition-opacity ${
                            isSelected || "opacity-0 group-hover:opacity-100"
                          }`}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleFileSelection(file.name)}
                              className="bg-background/80 backdrop-blur-sm"
                            />
                          </div>
                        )}

                        {/* Thumbnail / Icon */}
                        <div 
                          className="aspect-square bg-muted/50 flex items-center justify-center cursor-pointer overflow-hidden"
                          onClick={() => isFolder ? navigateToFolder(file.name) : handlePreview(file)}
                        >
                          {isImage && thumbnailUrls[file.name] ? (
                            <img 
                              src={thumbnailUrls[file.name]} 
                              alt={file.name}
                              className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <FileIcon className={`h-12 w-12 ${isFolder ? "text-primary" : "text-muted-foreground"}`} />
                          )}
                        </div>

                        {/* File info */}
                        <div className="p-2 bg-background">
                          <p className="text-xs font-medium truncate" title={file.name}>
                            {file.name}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-muted-foreground">
                              {isFolder ? "Pasta" : formatFileSize(file.metadata?.size)}
                            </span>
                            {!isFolder && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <MoreVertical className="h-3 w-3" />
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
                <Select value={selectedPatient || "none"} onValueChange={(v) => setSelectedPatient(v === "none" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um paciente..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum (pasta raiz)</SelectItem>
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

      {/* Move Files Dialog */}
      <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderInput className="h-5 w-5" />
              Mover Arquivos
            </DialogTitle>
            <DialogDescription>
              Mover {selectedFiles.size} arquivo(s) selecionado(s) para outra pasta
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Pasta de destino</Label>
              <Select value={moveTargetFolder || "root"} onValueChange={(v) => setMoveTargetFolder(v === "root" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a pasta..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">/ (Raiz)</SelectItem>
                  {availableFolders.filter(f => f !== currentFolder).map((folder) => (
                    <SelectItem key={folder} value={folder}>/{folder}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <p className="text-muted-foreground mb-2">Arquivos a mover:</p>
              <div className="flex flex-wrap gap-1">
                {Array.from(selectedFiles).slice(0, 5).map(name => (
                  <Badge key={name} variant="secondary">{name}</Badge>
                ))}
                {selectedFiles.size > 5 && (
                  <Badge variant="outline">+{selectedFiles.size - 5} mais</Badge>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMoveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleMoveFiles} disabled={isMoving}>
              {isMoving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Movendo...
                </>
              ) : (
                <>
                  <FolderInput className="h-4 w-4 mr-2" />
                  Mover
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Arquivos;
