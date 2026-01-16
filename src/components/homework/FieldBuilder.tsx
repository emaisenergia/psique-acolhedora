import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { GripVertical, Plus, Trash2, X } from 'lucide-react';
import type { TemplateField, FieldType } from '@/data/homeworkPresets';

interface FieldBuilderProps {
  fields: TemplateField[];
  onChange: (fields: TemplateField[]) => void;
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Texto livre' },
  { value: 'question', label: 'Pergunta (com dica)' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'scale', label: 'Escala numérica' },
  { value: 'multi_checkbox', label: 'Múltipla escolha' },
  { value: 'date', label: 'Data' },
];

export function FieldBuilder({ fields, onChange }: FieldBuilderProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const addField = () => {
    const newField: TemplateField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: '',
      required: false,
    };
    onChange([...fields, newField]);
    setEditingIndex(fields.length);
  };

  const updateField = (index: number, updates: Partial<TemplateField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    onChange(newFields);
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  const moveField = (from: number, to: number) => {
    if (to < 0 || to >= fields.length) return;
    const newFields = [...fields];
    const [moved] = newFields.splice(from, 1);
    newFields.splice(to, 0, moved);
    onChange(newFields);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Campos do formulário</Label>
        <Button type="button" size="sm" variant="outline" onClick={addField}>
          <Plus className="w-4 h-4 mr-1" />
          Adicionar campo
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-lg">
          Nenhum campo adicionado. Clique em "Adicionar campo" para começar.
        </p>
      ) : (
        <div className="space-y-2">
          {fields.map((field, index) => (
            <Card key={field.id} className="relative">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    className="mt-2 cursor-move text-muted-foreground hover:text-foreground"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <GripVertical className="w-4 h-4" />
                  </button>

                  <div className="flex-1 space-y-2">
                    {editingIndex === index ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Tipo</Label>
                            <Select
                              value={field.type}
                              onValueChange={(value: FieldType) => updateField(index, { type: value })}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {FIELD_TYPES.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-end gap-2">
                            <div className="flex items-center gap-2">
                              <Switch
                                id={`required-${field.id}`}
                                checked={field.required || false}
                                onCheckedChange={(checked) => updateField(index, { required: checked })}
                              />
                              <Label htmlFor={`required-${field.id}`} className="text-xs">Obrigatório</Label>
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs">Rótulo</Label>
                          <Input
                            value={field.label}
                            onChange={(e) => updateField(index, { label: e.target.value })}
                            placeholder="Ex: Descreva a situação..."
                            className="h-8 text-sm"
                          />
                        </div>

                        {(field.type === 'text' || field.type === 'question') && (
                          <div>
                            <Label className="text-xs">Placeholder</Label>
                            <Input
                              value={field.placeholder || ''}
                              onChange={(e) => updateField(index, { placeholder: e.target.value })}
                              placeholder="Texto de ajuda..."
                              className="h-8 text-sm"
                            />
                          </div>
                        )}

                        {field.type === 'question' && (
                          <div>
                            <Label className="text-xs">Dica (hint)</Label>
                            <Input
                              value={field.hint || ''}
                              onChange={(e) => updateField(index, { hint: e.target.value })}
                              placeholder="Orientação adicional..."
                              className="h-8 text-sm"
                            />
                          </div>
                        )}

                        {field.type === 'scale' && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Mínimo</Label>
                              <Input
                                type="number"
                                value={field.min ?? 0}
                                onChange={(e) => updateField(index, { min: parseInt(e.target.value) || 0 })}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Máximo</Label>
                              <Input
                                type="number"
                                value={field.max ?? 10}
                                onChange={(e) => updateField(index, { max: parseInt(e.target.value) || 10 })}
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                        )}

                        {field.type === 'multi_checkbox' && (
                          <div>
                            <Label className="text-xs">Opções (separadas por vírgula)</Label>
                            <Input
                              value={(field.options || []).join(', ')}
                              onChange={(e) => updateField(index, { 
                                options: e.target.value.split(',').map(o => o.trim()).filter(Boolean) 
                              })}
                              placeholder="Opção 1, Opção 2, Opção 3..."
                              className="h-8 text-sm"
                            />
                          </div>
                        )}

                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingIndex(null)}
                          className="w-full"
                        >
                          Concluir edição
                        </Button>
                      </div>
                    ) : (
                      <div 
                        className="cursor-pointer"
                        onClick={() => setEditingIndex(index)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground uppercase">
                            {FIELD_TYPES.find(t => t.value === field.type)?.label}
                          </span>
                          {field.required && (
                            <span className="text-xs text-red-500">*</span>
                          )}
                        </div>
                        <p className="text-sm font-medium">
                          {field.label || <span className="text-muted-foreground italic">Sem rótulo</span>}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => moveField(index, index - 1)}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => moveField(index, index + 1)}
                      disabled={index === fields.length - 1}
                    >
                      ↓
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => removeField(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
