import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ClipboardList, Edit, MoreVertical, Send, Sparkles, Trash2 } from 'lucide-react';
import { HOMEWORK_CATEGORIES, type TemplateField } from '@/data/homeworkPresets';

interface TemplateCardProps {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  fields: TemplateField[];
  isAiEnriched?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSendToPatient?: () => void;
}

export function TemplateCard({
  title,
  description,
  category,
  fields,
  isAiEnriched,
  onEdit,
  onDelete,
  onSendToPatient,
}: TemplateCardProps) {
  const categoryLabel = HOMEWORK_CATEGORIES.find(c => c.value === category)?.label || category;

  return (
     <Card className="group hover:shadow-md transition-shadow overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base font-semibold line-clamp-2 break-words whitespace-normal">{title}</CardTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="secondary" className="text-xs truncate max-w-[200px]">
                  {categoryLabel}
                </Badge>
                {isAiEnriched && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Sparkles className="w-3 h-3" />
                    IA
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              {onSendToPatient && (
                <DropdownMenuItem onClick={onSendToPatient}>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar para paciente
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

       <CardContent className="min-w-0">
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3 break-words">{description}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {fields.length} campo{fields.length !== 1 ? 's' : ''}
        </p>
      </CardContent>
    </Card>
  );
}
