import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { BookOpen, Plus } from 'lucide-react';
import { PRESET_TEMPLATES, HOMEWORK_CATEGORIES } from '@/data/homeworkPresets';

interface PresetTemplatesProps {
  onImport: (template: typeof PRESET_TEMPLATES[0]) => void;
}

export function PresetTemplates({ onImport }: PresetTemplatesProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Templates Pré-definidos
        </h3>
        <p className="text-xs text-muted-foreground">Clique para importar</p>
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 pb-2">
          {PRESET_TEMPLATES.map((template) => {
            const categoryLabel = HOMEWORK_CATEGORIES.find(c => c.value === template.category)?.label || template.category;
            
            return (
              <Card 
                key={template.id} 
                className="w-[280px] shrink-0 cursor-pointer hover:shadow-md transition-shadow group overflow-hidden"
                onClick={() => onImport(template)}
              >
                <CardHeader className="pb-2 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-medium line-clamp-2 break-words whitespace-normal min-w-0 flex-1">
                      {template.title}
                    </CardTitle>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <Badge variant="secondary" className="text-xs w-fit truncate max-w-full">
                    {categoryLabel}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground line-clamp-2 whitespace-normal break-words">
                    {template.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {template.fields.length} campos
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
