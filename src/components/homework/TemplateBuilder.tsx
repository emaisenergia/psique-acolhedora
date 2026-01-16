import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FieldBuilder } from './FieldBuilder';
import { HOMEWORK_CATEGORIES, type TemplateField } from '@/data/homeworkPresets';
import { Loader2 } from 'lucide-react';

interface TemplateBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (template: {
    title: string;
    description?: string;
    category: string;
    fields: TemplateField[];
    ai_context?: string;
  }) => Promise<void>;
  initialData?: {
    id?: string;
    title: string;
    description?: string;
    category: string;
    fields: TemplateField[];
    ai_context?: string;
  };
}

export function TemplateBuilder({ open, onOpenChange, onSave, initialData }: TemplateBuilderProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('geral');
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [aiContext, setAiContext] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      setCategory(initialData.category);
      setFields(initialData.fields);
      setAiContext(initialData.ai_context || '');
    } else if (open) {
      // Reset form for new template
      setTitle('');
      setDescription('');
      setCategory('geral');
      setFields([]);
      setAiContext('');
    }
  }, [open, initialData]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        fields,
        ai_context: aiContext.trim() || undefined,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const isEditing = !!initialData?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Template' : 'Novo Template de Tarefa'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Registro de Pensamentos Disfuncionais"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descrição do objetivo da tarefa..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOMEWORK_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-2">
              <FieldBuilder fields={fields} onChange={setFields} />
            </div>

            <div className="pt-2">
              <Label htmlFor="aiContext">Contexto para IA (opcional)</Label>
              <Textarea
                id="aiContext"
                value={aiContext}
                onChange={(e) => setAiContext(e.target.value)}
                placeholder="Instruções adicionais para quando a IA auxiliar na criação de tarefas baseadas neste template..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Este contexto será usado para personalizar sugestões da IA ao criar atividades.
              </p>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() || saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditing ? 'Salvar Alterações' : 'Criar Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
