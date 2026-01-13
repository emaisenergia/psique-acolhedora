import { useEffect, useRef } from 'react';
import { Award, Heart, Users, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const AboutSection = () => {
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

  const values = [
    {
      icon: Heart,
      title: 'Acolhimento',
      description: 'Criamos um ambiente seguro e empático onde você pode se expressar livremente, sem julgamentos.'
    },
    {
      icon: Award,
      title: 'Excelência',
      description: 'Comprometimento com a qualidade técnica e atualização constante em práticas baseadas em evidências.'
    },
    {
      icon: Users,
      title: 'Humanização',
      description: 'Tratamos cada pessoa como única, respeitando suas particularidades e ritmo de desenvolvimento.'
    },
    {
      icon: Target,
      title: 'Resultados',
      description: 'Focamos em objetivos claros e mensuráveis para garantir o progresso terapêutico efetivo.'
    }
  ];

  const stats = [
    { number: '10+', label: 'Anos de Experiência' },
    { number: '1000+', label: 'Pacientes Atendidos' },

  ];

  return (
    <section 
      id="sobre" 
      ref={sectionRef}
      className="py-24 bg-background"
    >
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          {/* Content */}
          <div className="space-y-8">
            <div className="fade-in-up">
              <h2 className="text-4xl md:text-5xl font-display font-light mb-6">
                Sobre a 
                <span className="block bg-gradient-primary bg-clip-text text-transparent">
                  Clínica Equanimité
                </span>
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed mb-6">
               Fundada com o propósito de promover o equilíbrio entre mente e vida, 
               a Clínica Equanimité é especializada em atendimento psicológico humanizado, 
               fundamentada em Terapia Cognitivo-Comportamental (TCC) e evidências científicas.
              </p>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                Nossa missão é oferecer um espaço seguro e acolhedor onde cada 
                pessoa pode encontrar o apoio necessário para superar desafios, 
                desenvolver seu potencial e construir uma vida mais plena e equilibrada.
              </p>
            </div>

            {/* Stats */}
            <div className="fade-in-up grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
                    {stat.number}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Image/Visual Element */}
          <div className="fade-in-up">
            <div className="relative">
              <div className="card-glass p-8 rounded-3xl">
                <h3 className="text-2xl font-semibold mb-4 text-center">Nossa Missão</h3>
                <blockquote className="text-lg text-muted-foreground italic leading-relaxed text-center">
                  "Promover o bem-estar psicológico através de atendimento 
                  especializado, ético e humanizado, contribuindo para o 
                  desenvolvimento integral de nossos pacientes e a construção 
                  de relacionamentos mais saudáveis."
                </blockquote>
                
                <div className="mt-8 text-center">
                  <div className="inline-flex items-center space-x-2">
                    <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                      <Heart className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-foreground">CRP 08/38431</div>
                      <div className="text-sm text-muted-foreground">Psi. Amanda</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-6 -left-6 w-20 h-20 bg-primary/20 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-secondary/20 rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="fade-in-up">
          <h3 className="text-3xl font-display font-light text-center mb-12">
            Nossos Valores
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card 
                key={value.title}
                className={`card-glass text-center hover:shadow-hover transition-all duration-300 fade-in-up`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-gradient-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-8 h-8 text-secondary-foreground" />
                  </div>
                  <h4 className="text-xl font-semibold text-foreground mb-3">
                    {value.title}
                  </h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Mission Statement */}
        <div className="fade-in-up mt-20 text-center">
          <div className="max-w-4xl mx-auto card-glass p-12 rounded-3xl">
            <h3 className="text-3xl font-display font-light mb-8">
              Compromisso com o Cuidado Humano
            </h3>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Combinamos a tradição da psicologia clínica com as mais modernas 
              abordagens terapêuticas, utilizando tecnologia de ponta para 
              oferecer atendimento online de qualidade e acompanhamento 
              personalizado.
            </p>
            <p className="text-muted-foreground">
              Estamos constantemente atualizando nossos conhecimentos e práticas 
              para oferecer sempre o melhor cuidado em saúde mental.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;