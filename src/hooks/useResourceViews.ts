import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useResourceViews() {
  const queryClient = useQueryClient();

  const recordViewMutation = useMutation({
    mutationFn: async ({ resourceId, patientId }: { resourceId: string; patientId?: string }) => {
      const { error } = await supabase
        .from('resource_views')
        .insert({
          resource_id: resourceId,
          patient_id: patientId || null,
        });

      if (error) {
        console.error('Error recording view:', error);
        // Don't throw - we don't want to break the UX if view tracking fails
      }
    },
    onSuccess: () => {
      // Invalidate therapeutic resources to refresh view counts
      queryClient.invalidateQueries({ queryKey: ['therapeutic-resources'] });
    },
  });

  const recordView = async (resourceId: string, patientId?: string) => {
    await recordViewMutation.mutateAsync({ resourceId, patientId });
  };

  return { recordView };
}
