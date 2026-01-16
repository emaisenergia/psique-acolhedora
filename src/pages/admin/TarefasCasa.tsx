import { useState, useMemo } from 'react';
import AdminLayout from './AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { useHomeworkTemplates } from '@/hooks/useHomeworkTemplates';
import { TemplateCard } from '@/components/homework/TemplateCard';
import { TemplateBuilder } from '@/components/homework/TemplateBuilder';
import { PresetTemplates } from '@/components/homework/PresetTemplates';
import { HOMEWORK_CATEGORIES, PRESET_TEMPLATES, type TemplateField } from '@/data/homeworkPresets';
import { Plus, Search, ClipboardList } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const TarefasCasa = () => {
  const { toast } = useToast();
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate } = useHomeworkTemplates();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<typeof templates[0] | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch = 
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [templates, searchQuery, categoryFilter]);

  const handleImportPreset = (preset: typeof PRESET_TEMPLATES[0]) => {
    setEditingTemplate({
      id: '',
      user_id: '',
      title: preset.title,
      description: preset.description,
      category: preset.category,
      fields: preset.fields,
      attachment_url: null,
      attachment_name: null,
      is_ai_enriched: false,
      ai_context: null,
      created_at: '',
      updated_at: '',
    });
    setBuilderOpen(true);
  };

  const handleSaveTemplate = async (data: {
    title: string;
    description?: string;
    category: string;
    fields: TemplateField[];
    ai_context?: string;
  }) => {
    if (editingTemplate?.id) {
      await updateTemplate({
        id: editingTemplate.id,
        ...data,
      });
    } else {
      await createTemplate(data);
    }
    setEditingTemplate(null);
  };

  const handleEditTemplate = (template: typeof templates[0]) => {
    setEditingTemplate(template);
    setBuilderOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingId) {
      await deleteTemplate(deletingId);
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const openNewTemplate = () => {
    setEditingTemplate(null);
    setBuilderOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardList className="w-6 h-6" />
              Tarefas de Casa
            </h1>
            <p className="text-muted-foreground">
              Gerencie templates de tarefas para enviar aos pacientes
            </p>
          </div>
          <Button onClick={openNewTemplate}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Template
          </Button>
        </div>

        {/* Preset Templates */}
        <PresetTemplates onImport={handleImportPreset} />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {HOMEWORK_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-4" />
                  <Skeleton className="h-3 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-1">Nenhum template encontrado</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery || categoryFilter !== 'all'
                  ? 'Tente ajustar os filtros ou criar um novo template.'
                  : 'Crie seu primeiro template ou importe um dos pré-definidos.'}
              </p>
              <Button onClick={openNewTemplate}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                id={template.id}
                title={template.title}
                description={template.description}
                category={template.category}
                fields={template.fields}
                isAiEnriched={template.is_ai_enriched}
                onEdit={() => handleEditTemplate(template)}
                onDelete={() => handleDeleteClick(template.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Template Builder Dialog */}
      <TemplateBuilder
        open={builderOpen}
        onOpenChange={(open) => {
          setBuilderOpen(open);
          if (!open) setEditingTemplate(null);
        }}
        onSave={handleSaveTemplate}
        initialData={editingTemplate || undefined}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir template?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O template será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default TarefasCasa;
