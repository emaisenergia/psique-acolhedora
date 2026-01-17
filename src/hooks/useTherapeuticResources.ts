import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TherapeuticResourceRow {
  id: string;
  user_id: string;
  patient_id: string | null;
  title: string;
  description: string | null;
  resource_type: string;
  resource_url: string | null;
  resource_file_name: string | null;
  category: string;
  is_visible: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateResourceInput {
  patient_id?: string | null;
  title: string;
  description?: string;
  resource_type: string;
  resource_url?: string;
  resource_file_name?: string;
  category?: string;
  is_visible?: boolean;
}

export interface UpdateResourceInput extends Partial<CreateResourceInput> {
  id: string;
}

export function useTherapeuticResources(patientId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: resources = [], isLoading, error } = useQuery({
    queryKey: ['therapeutic-resources', patientId],
    queryFn: async () => {
      let query = supabase
        .from('therapeutic_resources')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (patientId) {
        // Get resources for specific patient OR global resources (patient_id = null)
        query = query.or(`patient_id.eq.${patientId},patient_id.is.null`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return (data || []) as TherapeuticResourceRow[];
    },
  });

  const createResource = useMutation({
    mutationFn: async (input: CreateResourceInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('therapeutic_resources')
        .insert({
          user_id: user.id,
          patient_id: input.patient_id || null,
          title: input.title,
          description: input.description || null,
          resource_type: input.resource_type,
          resource_url: input.resource_url || null,
          resource_file_name: input.resource_file_name || null,
          category: input.category || 'geral',
          is_visible: input.is_visible ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapeutic-resources'] });
      toast({
        title: 'Recurso adicionado',
        description: 'O recurso terapêutico foi salvo com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao adicionar recurso',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateResource = useMutation({
    mutationFn: async (input: UpdateResourceInput) => {
      const { id, ...updates } = input;
      
      const { data, error } = await supabase
        .from('therapeutic_resources')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapeutic-resources'] });
      toast({
        title: 'Recurso atualizado',
        description: 'As alterações foram salvas.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar recurso',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteResource = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('therapeutic_resources')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapeutic-resources'] });
      toast({
        title: 'Recurso excluído',
        description: 'O recurso foi removido.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir recurso',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    resources,
    isLoading,
    error,
    createResource: createResource.mutateAsync,
    updateResource: updateResource.mutateAsync,
    deleteResource: deleteResource.mutateAsync,
  };
}
