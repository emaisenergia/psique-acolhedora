import { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  ArrowRight,
  BookOpen,
  
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAllPosts } from '@/data/blog';

const BlogSection = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = sectionRef.current?.querySelectorAll('.fade-in-up');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const categories = [
    'Todos',
    ...Array.from(new Set(getAllPosts().map((p) => p.category)))
  ];

  return (
    <section 
      id="blog" 
      ref={sectionRef}
      className="py-24 bg-background"
    >
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 fade-in-up">
          <h2 className="text-4xl md:text-5xl font-display font-light mb-6">
            Blog &
            <span className="block bg-gradient-secondary bg-clip-text text-transparent">
              Artigos
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Conteúdos educativos sobre psicologia, bem-estar e saúde mental 
            para apoiar sua jornada de autoconhecimento e crescimento pessoal.
          </p>
        </div>

        {/* Categories Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12 fade-in-up">
          {categories.map((category) => (
            <Button
              key={category}
              variant="outline"
              className={`btn-outline-futuristic ${
                category === 'Todos' ? 'bg-primary/10 border-primary' : ''
              }`}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Featured Article */}
        <div className="mb-16 fade-in-up">
          {getAllPosts()
            .filter(post => post.featured)
            .map((post) => (
              <Card key={post.id} className="card-glass overflow-hidden hover:shadow-hover transition-all duration-300">
                <div className="grid lg:grid-cols-2 gap-0">
                  <div className="aspect-video lg:aspect-square bg-gradient-hero flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto">
                        <post.icon className="w-10 h-10 text-primary-foreground" />
                      </div>
                      <div className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full inline-block">
                        Artigo em Destaque
                      </div>
                    </div>
                  </div>
                  
                  <CardContent className="p-8 lg:p-12 flex flex-col justify-center">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                      <span className="bg-secondary/20 text-secondary px-3 py-1 rounded-full">
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
                    
                    <h3 className="text-2xl md:text-3xl font-display font-light mb-4">
                      {post.title}
                    </h3>
                    
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      {post.excerpt}
                    </p>
                    
                    <Button asChild className="btn-futuristic group w-fit">
                      <Link to={`/blog/${post.slug}`}>
                        Ler Artigo Completo
                        <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </Button>
                  </CardContent>
                </div>
              </Card>
            ))}
        </div>

        {/* Articles Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {getAllPosts()
            .filter(post => !post.featured)
            .map((post, index) => (
              <Link key={post.id} to={`/blog/${post.slug}`} className="block">
                <Card 
                  className={`card-glass hover:shadow-hover transition-all duration-300 fade-in-up cursor-pointer group`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-0">
                    <div className="aspect-video bg-gradient-hero flex items-center justify-center rounded-t-2xl">
                      <div className="w-16 h-16 bg-gradient-secondary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <post.icon className="w-8 h-8 text-secondary-foreground" />
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-center space-x-3 text-xs text-muted-foreground mb-3">
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded-full">
                          {post.category}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{post.date}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{post.readTime}</span>
                        </div>
                      </div>
                      
                      <h3 className="font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                      
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                        {post.excerpt}
                      </p>
                      
                      <div className="flex items-center text-primary text-sm font-medium group-hover:translate-x-1 transition-transform">
                        <span>Ler mais</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
        </div>

        {/* Link to all articles */}
        <div className="text-center mb-12 fade-in-up">
          <Button asChild variant="outline" className="btn-outline-futuristic">
            <Link to="/blog">Ver todos os artigos</Link>
          </Button>
        </div>

        {/* Newsletter CTA */}
        <div className="fade-in-up">
          <Card className="card-glass">
            <CardContent className="p-8 md:p-12 text-center">
              <div className="max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-10 h-10 text-primary-foreground" />
                </div>
                
                <h3 className="text-3xl font-display font-light mb-4">
                  Receba Conteúdos Exclusivos
                </h3>
                
                <p className="text-muted-foreground leading-relaxed mb-8">
                  Inscreva-se em nossa newsletter e receba artigos, dicas de bem-estar 
                  e conteúdos especiais sobre saúde mental diretamente em seu e-mail.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="Seu e-mail"
                    className="flex-1 px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                  <Button className="btn-futuristic">
                    Inscrever-se
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground mt-4">
                  Respeitamos sua privacidade. Cancele a qualquer momento.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
