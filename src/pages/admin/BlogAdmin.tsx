import AdminLayout from "./AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBlogPosts, type BlogPostInput } from "@/hooks/useBlogPosts";
import { useState } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, EyeOff, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const iconOptions = ["BookOpen", "Heart", "Brain", "Users"] as const;

const BlogAdmin = () => {
  const { posts, loading, createPost, updatePost, deletePost } = useBlogPosts();
  const [form, setForm] = useState<Partial<BlogPostInput & { slug?: string }>>({ 
    icon: "BookOpen", 
    is_published: false 
  });
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.excerpt || !form.category || !form.content) {
      return;
    }

    setSaving(true);
    await createPost({
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt,
      content: form.content,
      icon: form.icon,
      category: form.category,
      is_published: form.is_published,
    });
    setForm({ icon: "BookOpen", is_published: false });
    setSaving(false);
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    await updatePost(id, { is_published: !currentStatus });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este post permanentemente?")) return;
    await deletePost(id);
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-light">Blog</h1>
        <p className="text-muted-foreground">Crie, edite e remova artigos do blog.</p>
      </div>

      <Card className="card-glass mb-6">
        <CardContent className="p-6">
          <form onSubmit={save} className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm">Título</label>
              <Input 
                value={form.title || ""} 
                onChange={(e) => setForm({ ...form, title: e.target.value })} 
              />
            </div>
            <div>
              <label className="text-sm">Slug (opcional)</label>
              <Input 
                value={form.slug || ""} 
                onChange={(e) => setForm({ ...form, slug: e.target.value })} 
                placeholder="ex: meu-artigo" 
              />
            </div>
            <div>
              <label className="text-sm">Categoria</label>
              <Input 
                value={form.category || ""} 
                onChange={(e) => setForm({ ...form, category: e.target.value })} 
              />
            </div>
            <div>
              <label className="text-sm">Ícone</label>
              <Select 
                value={form.icon || "BookOpen"} 
                onValueChange={(v) => setForm({ ...form, icon: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="is_published"
                checked={form.is_published || false}
                onCheckedChange={(checked) => setForm({ ...form, is_published: checked })}
              />
              <Label htmlFor="is_published">Publicar imediatamente</Label>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm">Resumo</label>
              <Textarea 
                rows={2} 
                value={form.excerpt || ""} 
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })} 
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm">Conteúdo (Markdown)</label>
              <Tabs defaultValue="editor">
                <TabsList className="mb-3">
                  <TabsTrigger value="editor">Editor</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="editor">
                  <Textarea 
                    rows={10} 
                    value={form.content || ""} 
                    onChange={(e) => setForm({ ...form, content: e.target.value })} 
                    placeholder={"Use Markdown: **negrito**, _itálico_, listas, títulos, etc."} 
                  />
                </TabsContent>
                <TabsContent value="preview">
                  <div className="prose prose-invert max-w-none border border-border rounded-xl p-4">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {form.content || "Nada para exibir ainda..."}
                    </ReactMarkdown>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="btn-futuristic" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar Artigo
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <p className="text-muted-foreground">Nenhum artigo criado.</p>
        ) : (
          posts.map((p) => (
            <Card key={p.id} className="card-glass">
              <CardContent className="p-5 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{p.title}</span>
                    <Badge variant={p.is_published ? "default" : "secondary"}>
                      {p.is_published ? "Publicado" : "Rascunho"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {p.category} • {p.views} visualizações
                  </div>
                  <p className="text-sm mt-2">{p.excerpt}</p>
                  {p.is_published && (
                    <Link to={`/blog/${p.slug}`} className="text-primary text-sm mt-2 inline-block">
                      Ver no site
                    </Link>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleTogglePublish(p.id, p.is_published)}
                    title={p.is_published ? "Despublicar" : "Publicar"}
                  >
                    {p.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => handleDelete(p.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AdminLayout>
  );
};

export default BlogAdmin;
