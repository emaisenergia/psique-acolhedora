import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Plus, Search } from "lucide-react";
import { useTherapeuticResources, type TherapeuticResourceRow } from "@/hooks/useTherapeuticResources";
import { ResourceCard } from "./ResourceCard";
import { ResourceFormDialog } from "./ResourceFormDialog";

interface ResourcesTabProps {
  patientId: string;
}

const CATEGORIES = [
  { value: "all", label: "Todas as categorias" },
  { value: "psicoeducacao", label: "Psicoeducação" },
  { value: "relaxamento", label: "Relaxamento" },
  { value: "leitura", label: "Leitura" },
  { value: "exercicio", label: "Exercícios" },
  { value: "video", label: "Vídeos" },
  { value: "geral", label: "Geral" },
];

export function ResourcesTab({ patientId }: ResourcesTabProps) {
  const { resources, isLoading, createResource, updateResource, deleteResource } = useTherapeuticResources(patientId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<TherapeuticResourceRow | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredResources = resources.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCategory = categoryFilter === "all" || r.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const patientResources = filteredResources.filter((r) => r.patient_id === patientId);
  const globalResources = filteredResources.filter((r) => r.patient_id === null);

  const handleEdit = (resource: TherapeuticResourceRow) => {
    setEditingResource(resource);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este recurso?")) {
      await deleteResource(id);
    }
  };

  const handleToggleVisibility = async (id: string, visible: boolean) => {
    await updateResource({ id, is_visible: visible });
  };

  const handleSubmit = async (data: Parameters<typeof createResource>[0]) => {
    if (editingResource) {
      await updateResource({ id: editingResource.id, ...data });
    } else {
      await createResource(data);
    }
    setEditingResource(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex-1 flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar recursos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
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
        <Button onClick={() => { setEditingResource(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Recurso
        </Button>
      </div>

      {/* Patient-specific resources */}
      {patientResources.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Recursos deste paciente ({patientResources.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {patientResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleVisibility={handleToggleVisibility}
              />
            ))}
          </div>
        </div>
      )}

      {/* Global resources */}
      {globalResources.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Recursos globais ({globalResources.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {globalResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleVisibility={handleToggleVisibility}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {filteredResources.length === 0 && (
        <Card className="card-glass">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-1">
              {searchQuery || categoryFilter !== "all"
                ? "Nenhum recurso encontrado"
                : "Nenhum recurso cadastrado"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
              {searchQuery || categoryFilter !== "all"
                ? "Tente ajustar os filtros de busca"
                : "Compartilhe materiais de apoio como PDFs, vídeos e links com seu paciente."}
            </p>
            {!searchQuery && categoryFilter === "all" && (
              <Button onClick={() => { setEditingResource(null); setDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Recurso
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Form Dialog */}
      <ResourceFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingResource(null);
        }}
        onSubmit={handleSubmit}
        patientId={patientId}
        initialData={editingResource ?? undefined}
      />
    </div>
  );
}
