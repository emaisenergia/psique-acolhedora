import AdminLayout from "./AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { storage, type AdminBlogPost, uid } from "@/lib/storage";
import { getAllPosts } from "@/data/blog";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const iconOptions = ["BookOpen", "Heart", "Brain", "Users"] as const;

const toSlug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const BlogAdmin = () => {
  const [posts, setPosts] = useState<AdminBlogPost[]>(storage.getPosts());
  const [form, setForm] = useState<Partial<AdminBlogPost>>({ iconName: "BookOpen", featured: false });

  const usedSlugs = useMemo(() => new Set(getAllPosts().map((p) => p.slug)), [posts]);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.excerpt || !form.category || !form.readTime || !form.date || !form.content) return;
    const slug = form.slug && form.slug.trim().length > 0 ? form.slug : toSlug(form.title);
    if (usedSlugs.has(slug)) {
      alert("Slug já utilizado. Escolha outro.");
      return;
    }
    const post: AdminBlogPost = {
      id: uid(),
      slug,
      title: form.title,
      excerpt: form.excerpt,
      category: form.category,
      readTime: form.readTime,
      date: form.date,
      iconName: form.iconName,
      featured: !!form.featured,
      content: form.content,
      createdAt: new Date().toISOString(),
    };
    const next = [post, ...posts];
    setPosts(next);
    storage.savePosts(next);
    setForm({ iconName: "BookOpen", featured: false });
  };

  const remove = (id: string) => {
    const next = posts.filter((p) => p.id !== id);
    setPosts(next);
    storage.savePosts(next);
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-light">Blog</h1>
        <p className="text-muted-foreground">Crie, edite e remova artigos do blog (armazenamento local).</p>
      </div>

      <Card className="card-glass mb-6">
        <CardContent className="p-6">
          <form onSubmit={save} className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm">Título</label>
              <Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="text-sm">Slug (opcional)</label>
              <Input value={form.slug || ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="ex: meu-artigo" />
            </div>
            <div>
              <label className="text-sm">Categoria</label>
              <Input value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div>
              <label className="text-sm">Tempo de leitura</label>
              <Input value={form.readTime || ""} onChange={(e) => setForm({ ...form, readTime: e.target.value })} placeholder="ex: 6 min" />
            </div>
            <div>
              <label className="text-sm">Data</label>
              <Input value={form.date || ""} onChange={(e) => setForm({ ...form, date: e.target.value })} placeholder="ex: 15 Mar 2024" />
            </div>
            <div>
              <label className="text-sm">Ícone</label>
              <Select value={form.iconName as any} onValueChange={(v) => setForm({ ...form, iconName: v })}>
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
            <div>
              <label className="text-sm">Destaque</label>
              <Select value={String(!!form.featured)} onValueChange={(v) => setForm({ ...form, featured: v === "true" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Não</SelectItem>
                  <SelectItem value="true">Sim</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm">Resumo</label>
              <Textarea rows={2} value={form.excerpt || ""} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm">Conteúdo (Markdown)</label>
              <Tabs defaultValue="editor">
                <TabsList className="mb-3">
                  <TabsTrigger value="editor">Editor</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="editor">
                  <Textarea rows={10} value={form.content || ""} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder={"Use Markdown: **negrito**, _itálico_, listas, títulos, etc."} />
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
              <Button type="submit" className="btn-futuristic">Publicar Artigo</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {posts.length === 0 && <p className="text-muted-foreground">Nenhum artigo criado no painel.</p>}
        {posts.map((p) => (
          <Card key={p.id} className="card-glass">
            <CardContent className="p-5 flex items-start justify-between gap-4">
              <div>
                <div className="font-semibold">{p.title}</div>
                <div className="text-sm text-muted-foreground">{p.category} • {p.date} • {p.readTime}</div>
                <p className="text-sm mt-2">{p.excerpt}</p>
                <Link to={`/blog/${p.slug}`} className="text-primary text-sm mt-2 inline-block">Ver no site</Link>
              </div>
              <Button variant="outline" onClick={() => remove(p.id)}>Remover</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
};

export default BlogAdmin;
