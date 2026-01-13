import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Heart, Shield, Star } from 'lucide-react';
import heroImage from '@/assets/hero-image.jpg';

const HeroSection = () => {
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

  const scrollToContact = () => {
    document.querySelector('#contato')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToServices = () => {
    document.querySelector('#servicos')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section 
      id="home"
      ref={sectionRef}
      className="min-h-screen flex items-center section-gradient relative overflow-hidden"
    >
      {/* Background Decoration */}
      <div className="absolute inset-0 bg-gradient-hero opacity-30"></div>
      <div className="absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="fade-in-up">
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex space-x-1">
                  
                </div>
               
              </div>
              
              <h1 className="text-5xl md:text-7xl font-display font-light leading-tight text-foreground">
                Equilibrando
                <span className="block bg-gradient-primary bg-clip-text text-transparent">
                  Mente e Vida
                </span>
              </h1>
            </div>

            <div className="fade-in-up space-y-4">
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                A psicoterapia é um espaço de acolhimento e autodescoberta. Atendimentos presenciais e online, conduzidos por profissionais especializados, para promover equilíbrio, saúde emocional e qualidade de vida.
              </p>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4 text-primary" />
                  <span>Atendimento humanizado</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span>Sigilo profissional</span>
                </div>
              </div>
            </div>

            <div className="fade-in-up flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={scrollToContact}
                className="btn-futuristic group"
              >
                Agendar Primeira Consulta
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
              
              <Button 
                onClick={scrollToServices}
                variant="outline"
                className="btn-outline-futuristic"
              >
                Conhecer Serviços
              </Button>
            </div>

            <div className="fade-in-up pt-8">
              <p className="text-sm text-muted-foreground mb-4">
                Psicoterapia baseada em evidências, focada no bem-estar do paciente.
              </p>
              <div className="flex items-center space-x-6">
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">1000+</div>
                  <div className="text-xs text-muted-foreground">Pacientes atendidos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">95%</div>
                  <div className="text-xs text-muted-foreground">Satisfação</div>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="fade-in-up relative">
            <div className="relative">
              <img 
                src={heroImage} 
                alt="Ambiente acolhedor da Clínica Equanimité - espaço moderno e tranquilo para psicoterapia"
                className="w-full h-auto rounded-3xl shadow-hover object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-card rounded-3xl"></div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-6 -right-6 card-glass p-4 animate-glow-pulse">
              <div className="text-center">
                <div className="text-lg font-bold text-primary">Atendimento online</div>
                <div className="text-xs text-muted-foreground">07:00 as 22:00</div>
              </div>
            </div>
            
            <div className="absolute -bottom-6 -left-6 card-glass p-4">
              <div className="text-center">
                <div className="text-lg font-bold text-primary">Atendimento presencial</div>
                <div className="text-xs text-muted-foreground">Cascavel/PR</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;