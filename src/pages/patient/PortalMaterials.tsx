import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText,
  Link2,
  Video,
  Music,
  ExternalLink,
  FolderOpen,
  Play,
  Maximize2,
} from "lucide-react";
import { usePatientAuth } from "@/context/PatientAuth";
import PortalLayout from "@/components/patient/PortalLayout";
import { useTherapeuticResources, TherapeuticResourceRow } from "@/hooks/useTherapeuticResources";
import { useResourceViews } from "@/hooks/useResourceViews";

const CATEGORY_LABELS: Record<string, string> = {
  psicoeducacao: "Psicoeducação",
  relaxamento: "Relaxamento",
  leitura: "Leitura",
  exercicio: "Exercícios",
  video: "Vídeos",
  geral: "Geral",
};

const TYPE_ICONS: Record<string, typeof Link2> = {
  link: Link2,
  pdf: FileText,
  video: Video,
  audio: Music,
};

interface ResourceCardProps {
  resource: TherapeuticResourceRow;
  patientId?: string;
}

function PatientResourceCard({ resource, patientId }: ResourceCardProps) {
  const Icon = TYPE_ICONS[resource.resource_type] || FileText;
  const { recordView } = useResourceViews();
  const [pdfExpanded, setPdfExpanded] = useState(false);
  const [hasRecordedView, setHasRecordedView] = useState(false);

  const handleOpen = async () => {
    if (resource.resource_url) {
      if (!hasRecordedView) {
        await recordView(resource.id, patientId);
        setHasRecordedView(true);
      }
      window.open(resource.resource_url, "_blank", "noopener,noreferrer");
    }
  };

  const handleAudioPlay = async () => {
    if (!hasRecordedView) {
      await recordView(resource.id, patientId);
      setHasRecordedView(true);
    }
  };

  const handlePdfLoad = async () => {
    if (!hasRecordedView) {
      await recordView(resource.id, patientId);
      setHasRecordedView(true);
    }
  };

  const isPdf = resource.resource_type === 'pdf';
  const isAudio = resource.resource_type === 'audio';
  const isVideo = resource.resource_type === 'video';
  const isYouTubeEmbed = resource.resource_url?.includes('youtube.com') || resource.resource_url?.includes('youtu.be');

  return (
    <Card className="bg-card/95 border border-border/60 rounded-2xl hover:shadow-soft transition-all">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground line-clamp-1">{resource.title}</h3>
            {resource.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {resource.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-3">
              <Badge variant="secondary" className="text-xs">
                {CATEGORY_LABELS[resource.category || "geral"] || resource.category}
              </Badge>
              {resource.resource_file_name && (
                <span className="text-xs text-muted-foreground">
                  {resource.resource_file_name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Audio Player Inline */}
        {isAudio && resource.resource_url && (
          <div className="mt-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                <Play className="w-4 h-4" />
                <span>Reproduzir áudio</span>
              </div>
              <audio 
                controls 
                className="w-full h-10"
                onPlay={handleAudioPlay}
                preload="metadata"
              >
                <source src={resource.resource_url} type="audio/mpeg" />
                <source src={resource.resource_url} type="audio/wav" />
                <source src={resource.resource_url} type="audio/ogg" />
                Seu navegador não suporta o elemento de áudio.
              </audio>
            </div>
          </div>
        )}

        {/* PDF Preview Inline */}
        {isPdf && resource.resource_url && (
          <div className="mt-4 space-y-3">
            <div 
              className={`rounded-lg overflow-hidden border bg-muted/30 transition-all ${
                pdfExpanded ? 'h-[500px]' : 'h-64'
              }`}
            >
              <iframe
                src={`${resource.resource_url}#toolbar=1&navpanes=0&scrollbar=1`}
                className="w-full h-full border-0"
                title={resource.title}
                onLoad={handlePdfLoad}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPdfExpanded(!pdfExpanded)}
                className="flex-1"
              >
                <Maximize2 className="w-4 h-4 mr-2" />
                {pdfExpanded ? 'Reduzir' : 'Expandir'}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleOpen}
                className="flex-1"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir em nova aba
              </Button>
            </div>
          </div>
        )}

        {/* YouTube Video Embed */}
        {isVideo && isYouTubeEmbed && resource.resource_url && (
          <div className="mt-4">
            <div className="rounded-lg overflow-hidden border bg-muted/30 aspect-video">
              <iframe
                src={getYouTubeEmbedUrl(resource.resource_url)}
                className="w-full h-full border-0"
                title={resource.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={handlePdfLoad}
              />
            </div>
          </div>
        )}

        {/* Default button for links and non-embeddable videos */}
        {resource.resource_url && !isAudio && !isPdf && !(isVideo && isYouTubeEmbed) && (
          <Button
            onClick={handleOpen}
            className="w-full mt-4"
            variant="outline"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Acessar Material
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function getYouTubeEmbedUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    let videoId = '';
    
    if (urlObj.hostname.includes('youtube.com')) {
      videoId = urlObj.searchParams.get('v') || '';
    } else if (urlObj.hostname.includes('youtu.be')) {
      videoId = urlObj.pathname.slice(1);
    }
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  } catch {
    // If URL parsing fails, return original
  }
  return url;
}

const PortalMaterials = () => {
  const { patient, isLoading } = usePatientAuth();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { resources, isLoading: resourcesLoading } = useTherapeuticResources(patient?.id);

  const visibleResources = useMemo(() => {
    return resources.filter((r) => r.is_visible);
  }, [resources]);

  const filteredResources = useMemo(() => {
    if (categoryFilter === "all") return visibleResources;
    return visibleResources.filter((r) => r.category === categoryFilter);
  }, [visibleResources, categoryFilter]);

  const categories = useMemo(() => {
    const cats = new Set(visibleResources.map((r) => r.category || "geral"));
    return Array.from(cats);
  }, [visibleResources]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PortalLayout>
      {/* Header */}
      <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-light flex items-center gap-3">
            <FolderOpen className="w-7 h-7 text-primary" />
            Materiais Terapêuticos
          </h1>
          <p className="text-muted-foreground mt-1">
            Recursos compartilhados pelo seu psicólogo para apoio ao tratamento
          </p>
        </div>

        {categories.length > 1 && (
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {CATEGORY_LABELS[cat] || cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Resources Grid */}
      <div className="mt-6 mb-8">
        {resourcesLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-card/95 rounded-2xl">
                <CardContent className="p-5">
                  <div className="animate-pulse space-y-3">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-muted rounded-xl"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="h-10 bg-muted rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredResources.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.map((resource) => (
              <PatientResourceCard 
                key={resource.id} 
                resource={resource} 
                patientId={patient?.id}
              />
            ))}
          </div>
        ) : (
          <Card className="bg-card/95 border border-border/60 rounded-2xl">
            <CardContent className="p-12 text-center">
              <FolderOpen className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">
                Nenhum material disponível
              </h3>
              <p className="text-sm text-muted-foreground/70 mt-2 max-w-md mx-auto">
                Seu psicólogo ainda não compartilhou nenhum material. 
                Quando houver recursos disponíveis, eles aparecerão aqui.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PortalLayout>
  );
};

export default PortalMaterials;
