import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  icon: string | null;
  category: string | null;
  tags: string[];
  author_id: string | null;
  author_name: string | null;
  is_published: boolean;
  published_at: string | null;
  views: number;
  created_at: string;
  updated_at: string;
}

export interface BlogPostInput {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  cover_image?: string;
  icon?: string;
  category?: string;
  tags?: string[];
  is_published?: boolean;
}

const toSlug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const useBlogPosts = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async (publishedOnly = false) => {
    try {
      setLoading(true);
      let query = supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (publishedOnly) {
        query = query.eq("is_published", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPosts((data as BlogPost[]) || []);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      toast.error("Erro ao carregar posts do blog");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const createPost = useCallback(async (input: BlogPostInput): Promise<BlogPost | null> => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id;

      // Get user profile for author name
      let authorName = "Autor";
      if (userId) {
        const { data: profile } = await supabase
          .from("admin_profiles")
          .select("name")
          .eq("user_id", userId)
          .single();
        if (profile?.name) authorName = profile.name;
      }

      const slug = input.slug?.trim() || toSlug(input.title);

      // Check if slug exists
      const { data: existing } = await supabase
        .from("blog_posts")
        .select("id")
        .eq("slug", slug)
        .single();

      if (existing) {
        toast.error("Slug já utilizado. Escolha outro.");
        return null;
      }

      const { data, error } = await supabase
        .from("blog_posts")
        .insert({
          title: input.title,
          slug,
          excerpt: input.excerpt || null,
          content: input.content,
          cover_image: input.cover_image || null,
          icon: input.icon || "BookOpen",
          category: input.category || "geral",
          tags: input.tags || [],
          author_id: userId,
          author_name: authorName,
          is_published: input.is_published ?? false,
          published_at: input.is_published ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Post criado com sucesso!");
      await fetchPosts();
      return data as BlogPost;
    } catch (error) {
      console.error("Error creating blog post:", error);
      toast.error("Erro ao criar post");
      return null;
    }
  }, [fetchPosts]);

  const updatePost = useCallback(async (id: string, input: Partial<BlogPostInput>): Promise<boolean> => {
    try {
      const updateData: Record<string, unknown> = {};

      if (input.title !== undefined) updateData.title = input.title;
      if (input.slug !== undefined) updateData.slug = input.slug;
      if (input.excerpt !== undefined) updateData.excerpt = input.excerpt;
      if (input.content !== undefined) updateData.content = input.content;
      if (input.cover_image !== undefined) updateData.cover_image = input.cover_image;
      if (input.icon !== undefined) updateData.icon = input.icon;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.tags !== undefined) updateData.tags = input.tags;
      if (input.is_published !== undefined) {
        updateData.is_published = input.is_published;
        if (input.is_published) {
          updateData.published_at = new Date().toISOString();
        }
      }

      const { error } = await supabase
        .from("blog_posts")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      toast.success("Post atualizado!");
      await fetchPosts();
      return true;
    } catch (error) {
      console.error("Error updating blog post:", error);
      toast.error("Erro ao atualizar post");
      return false;
    }
  }, [fetchPosts]);

  const deletePost = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("blog_posts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Post excluído!");
      await fetchPosts();
      return true;
    } catch (error) {
      console.error("Error deleting blog post:", error);
      toast.error("Erro ao excluir post");
      return false;
    }
  }, [fetchPosts]);

  const incrementViews = useCallback(async (id: string): Promise<void> => {
    try {
      const post = posts.find(p => p.id === id);
      if (post) {
        await supabase
          .from("blog_posts")
          .update({ views: (post.views || 0) + 1 })
          .eq("id", id);
      }
    } catch (error) {
      console.error("Error incrementing views:", error);
    }
  }, [posts]);

  return {
    posts,
    loading,
    fetchPosts,
    createPost,
    updatePost,
    deletePost,
    incrementViews,
  };
};

// Hook for public blog viewing
export const usePublicBlogPosts = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicPosts = async () => {
      try {
        const { data, error } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("is_published", true)
          .order("published_at", { ascending: false });

        if (error) throw error;
        setPosts((data as BlogPost[]) || []);
      } catch (error) {
        console.error("Error fetching public blog posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicPosts();
  }, []);

  return { posts, loading };
};
