import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FavoritePrompt {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  usage_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FavoritePromptInput {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
}

export const useFavoritePrompts = () => {
  const [prompts, setPrompts] = useState<FavoritePrompt[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrompts = useCallback(async () => {
    try {
      setLoading(true);
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user?.id) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("ai_favorite_prompts")
        .select("*")
        .eq("user_id", session.session.user.id)
        .order("usage_count", { ascending: false });

      if (error) throw error;
      setPrompts((data as FavoritePrompt[]) || []);
    } catch (error) {
      console.error("Error fetching favorite prompts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const createPrompt = useCallback(async (input: FavoritePromptInput): Promise<FavoritePrompt | null> => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user?.id) {
        toast.error("Usuário não autenticado");
        return null;
      }

      const { data, error } = await supabase
        .from("ai_favorite_prompts")
        .insert({
          user_id: session.session.user.id,
          title: input.title,
          content: input.content,
          category: input.category || "geral",
          tags: input.tags || [],
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Prompt salvo!");
      await fetchPrompts();
      return data as FavoritePrompt;
    } catch (error) {
      console.error("Error creating prompt:", error);
      toast.error("Erro ao salvar prompt");
      return null;
    }
  }, [fetchPrompts]);

  const updatePrompt = useCallback(async (id: string, input: Partial<FavoritePromptInput>): Promise<boolean> => {
    try {
      const updateData: Record<string, unknown> = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.content !== undefined) updateData.content = input.content;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.tags !== undefined) updateData.tags = input.tags;

      const { error } = await supabase
        .from("ai_favorite_prompts")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      toast.success("Prompt atualizado!");
      await fetchPrompts();
      return true;
    } catch (error) {
      console.error("Error updating prompt:", error);
      toast.error("Erro ao atualizar prompt");
      return false;
    }
  }, [fetchPrompts]);

  const deletePrompt = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("ai_favorite_prompts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Prompt excluído!");
      await fetchPrompts();
      return true;
    } catch (error) {
      console.error("Error deleting prompt:", error);
      toast.error("Erro ao excluir prompt");
      return false;
    }
  }, [fetchPrompts]);

  const trackUsage = useCallback(async (id: string): Promise<void> => {
    try {
      const prompt = prompts.find(p => p.id === id);
      if (prompt) {
        await supabase
          .from("ai_favorite_prompts")
          .update({
            usage_count: (prompt.usage_count || 0) + 1,
            last_used_at: new Date().toISOString(),
          })
          .eq("id", id);
      }
    } catch (error) {
      console.error("Error tracking prompt usage:", error);
    }
  }, [prompts]);

  return {
    prompts,
    loading,
    fetchPrompts,
    createPrompt,
    updatePrompt,
    deletePrompt,
    trackUsage,
  };
};
