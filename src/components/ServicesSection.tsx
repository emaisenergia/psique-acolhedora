import { useEffect, useRef } from 'react';
import { 
  Users, 
  Video, 
  Brain, 
  Heart, 
  Shield, 
  Headphones,
  UserCheck,
  Clock
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const ServicesSection = () => {
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

  const services = [
    {
      icon: UserCheck,
      title: 'Terapia Individual',
      description: 'Atendimento personalizado focado em suas necessidades específicas, em um ambiente seguro e acolhedor.',
      features: ['Sessões online ou presencial', 'Terapia Cognitivo-Comportamental', 'Psicologia baseada em evidências']
    },
    {
      icon: Video,
      title: 'Terapia Online',
      description: 'Psicoterapia no conforto da sua casa, com a mesma qualidade e eficácia do atendimento presencial.',
      features: ['Flexibilidade de horários', 'Plataforma segura', 'Mesma eficácia do presencial']
    },
    {
      icon: Users,
      title: 'Terapia de Casal',
      description: 'Fortalecimento de vínculos e resolução de conflitos para relacionamentos mais saudáveis.',
      features: ['Comunicação assertiva', 'Resolução de conflitos', 'Fortalecimento do vínculo']
    },
    {
      icon: Brain,
      title: 'Terapia Cognitivo-Comportamental',
      description: 'Abordagem científica focada na modificação de pensamentos e comportamentos disfuncionais.',
      features: ['Base científica comprovada', 'Resultados objetivos', 'Técnicas práticas']
    },
    {
      icon: Heart,
      title: 'Terapia Cognitivo Sexual',
      description: 'Abordagem especializada que integra a Terapia Cognitivo-Comportamental ao cuidado com a saúde sexual, promovendo autoconhecimento, bem-estar e qualidade nas relações.',
      features: ['Tratamento de disfunções sexuais', 'Promoção de autoconhecimento e autoestima', 'Melhora da autoestima e vida sexual']
    },
    {
      icon: Shield,
      title: 'Apoio Psicológico',
      description: 'Suporte emocional em momentos de crise, luto, mudanças significativas e transições de vida.',
      features: ['Acolhimento imediato', 'Suporte em crises', 'Fortalecimento emocional']
    }
  ];

  const differentials = [
    {
      icon: Headphones,
      title: 'Escuta Ativa',
      description: 'Atendimento focado em compreender verdadeiramente suas necessidades'
    },
    {
      icon: Clock,
      title: 'Flexibilidade',
      description: 'Horários adaptáveis à sua rotina, incluindo fins de semana'
    },
    {
      icon: Shield,
      title: 'Sigilo Total',
      description: 'Privacidade e confidencialidade garantidas em todos os atendimentos'
    }
  ];

  return (
    <section 
      id="servicos" 
      ref={sectionRef}
      className="py-24 section-gradient"
    >
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 fade-in-up">
          <h2 className="text-4xl md:text-5xl font-display font-light mb-6">
            Nossos
            <span className="block bg-gradient-secondary bg-clip-text text-transparent">
              Serviços
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Oferecemos uma gama completa de serviços psicológicos, 
            adaptados às suas necessidades individuais e objetivos terapêuticos.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {services.map((service, index) => (
            <Card 
              key={service.title}
              className={`card-glass hover:shadow-hover transition-all duration-300 fade-in-up`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-8">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4 group-hover:animate-glow-pulse">
                    <service.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {service.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {service.description}
                  </p>
                </div>
                
                <div className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Differentials */}
        <div className="fade-in-up">
          <h3 className="text-3xl font-display font-light text-center mb-12">
            Nossos Diferenciais
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            {differentials.map((differential, index) => (
              <div 
                key={differential.title}
                className="text-center fade-in-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="w-20 h-20 bg-gradient-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <differential.icon className="w-10 h-10 text-secondary-foreground" />
                </div>
                <h4 className="text-xl font-semibold text-foreground mb-3">
                  {differential.title}
                </h4>
                <p className="text-muted-foreground leading-relaxed">
                  {differential.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;