import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { TemplateField } from '@/data/homeworkPresets';

export interface HomeworkTemplateRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  fields: TemplateField[];
  attachment_url: string | null;
  attachment_name: string | null;
  is_ai_enriched: boolean;
  ai_context: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateInput {
  title: string;
  description?: string;
  category?: string;
  fields?: TemplateField[];
  attachment_url?: string;
  attachment_name?: string;
  is_ai_enriched?: boolean;
  ai_context?: string;
}

export interface UpdateTemplateInput extends Partial<CreateTemplateInput> {
  id: string;
}

export function useHomeworkTemplates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading, error } = useQuery({
    queryKey: ['homework-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('homework_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Parse fields JSON
      return (data || []).map(item => ({
        ...item,
        fields: (item.fields as unknown as TemplateField[]) || [],
      })) as HomeworkTemplateRow[];
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (input: CreateTemplateInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const insertData = {
        user_id: user.id,
        title: input.title,
        description: input.description || null,
        category: input.category || 'geral',
        fields: JSON.parse(JSON.stringify(input.fields || [])),
        attachment_url: input.attachment_url || null,
        attachment_name: input.attachment_name || null,
        is_ai_enriched: input.is_ai_enriched || false,
        ai_context: input.ai_context || null,
      };

      const { data, error } = await supabase
        .from('homework_templates')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homework-templates'] });
      toast({
        title: 'Template criado',
        description: 'O template de tarefa foi salvo com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async (input: UpdateTemplateInput) => {
      const { id, ...updates } = input;
      
      const updateData: Record<string, unknown> = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.fields !== undefined) updateData.fields = JSON.parse(JSON.stringify(updates.fields));
      if (updates.attachment_url !== undefined) updateData.attachment_url = updates.attachment_url;
      if (updates.attachment_name !== undefined) updateData.attachment_name = updates.attachment_name;
      if (updates.is_ai_enriched !== undefined) updateData.is_ai_enriched = updates.is_ai_enriched;
      if (updates.ai_context !== undefined) updateData.ai_context = updates.ai_context;

      const { data, error } = await supabase
        .from('homework_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homework-templates'] });
      toast({
        title: 'Template atualizado',
        description: 'As alterações foram salvas.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('homework_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homework-templates'] });
      toast({
        title: 'Template excluído',
        description: 'O template foi removido.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    templates,
    isLoading,
    error,
    createTemplate: createTemplate.mutateAsync,
    updateTemplate: updateTemplate.mutateAsync,
    deleteTemplate: deleteTemplate.mutateAsync,
  };
}
