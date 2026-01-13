import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { getPostBySlug } from "@/data/blog";

const BlogPost = () => {
  const { slug } = useParams();
  const post = slug ? getPostBySlug(slug) : undefined;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 pb-24 bg-background">
        <div className="container mx-auto px-4">
          {!post ? (
            <div className="text-center py-24">
              <h1 className="text-3xl font-display font-light mb-4">Artigo não encontrado</h1>
              <Button asChild className="btn-futuristic">
                <Link to="/blog">Voltar ao Blog</Link>
              </Button>
            </div>
          ) : (
            <article>
              <div className="max-w-3xl mx-auto mb-8">
                <Button asChild variant="ghost" className="mb-6 px-0 text-primary">
                  <Link to="/blog" className="inline-flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                  </Link>
                </Button>
                <div className="flex items-center space-x-3 text-sm text-muted-foreground mb-3">
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {post.category}
                  </span>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{post.date}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{post.readTime} de leitura</span>
                  </div>
                </div>

                <h1 className="text-3xl md:text-4xl font-display font-light mb-6">
                  {post.title}
                </h1>
              </div>

              <Card className="card-glass max-w-3xl mx-auto">
                <CardContent className="p-6 md:p-10">
                  {post.content}
                </CardContent>
              </Card>
            </article>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPost;

