import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ExternalLink, Eye, EyeOff, FileText, Link2, MoreVertical, Music, Pencil, Trash2, Video } from "lucide-react";
import type { TherapeuticResourceRow } from "@/hooks/useTherapeuticResources";

interface ResourceCardProps {
  resource: TherapeuticResourceRow;
  onEdit: (resource: TherapeuticResourceRow) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string, visible: boolean) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  psicoeducacao: "Psicoeducação",
  relaxamento: "Relaxamento",
  leitura: "Leitura",
  exercicio: "Exercícios",
  video: "Vídeos",
  geral: "Geral",
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  link: Link2,
  pdf: FileText,
  video: Video,
  audio: Music,
};

export function ResourceCard({ resource, onEdit, onDelete, onToggleVisibility }: ResourceCardProps) {
  const Icon = TYPE_ICONS[resource.resource_type] || Link2;

  return (
    <Card className="card-glass hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="rounded-lg bg-primary/10 p-2.5 shrink-0">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-medium text-foreground truncate">{resource.title}</h4>
                {!resource.is_visible && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <EyeOff className="w-3 h-3" />
                    Oculto
                  </Badge>
                )}
              </div>
              {resource.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {resource.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {CATEGORY_LABELS[resource.category] || resource.category}
                </Badge>
                {resource.patient_id === null && (
                  <Badge variant="secondary" className="text-xs">
                    Global
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {resource.resource_url && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => window.open(resource.resource_url!, "_blank")}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(resource)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleVisibility(resource.id, !resource.is_visible)}>
                  {resource.is_visible ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Ocultar do paciente
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Mostrar ao paciente
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(resource.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
