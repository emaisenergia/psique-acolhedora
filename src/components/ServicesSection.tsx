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
import { motion } from 'framer-motion';

const ServicesSection = () => {
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const,
      },
    },
  };

  const headerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <section 
      id="servicos" 
      className="py-24 section-gradient"
    >
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div 
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={headerVariants}
        >
          <h2 className="text-4xl md:text-5xl font-display font-light mb-6">
            Nossos
            <motion.span 
              className="block bg-gradient-secondary bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              Serviços
            </motion.span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Oferecemos uma gama completa de serviços psicológicos, 
            adaptados às suas necessidades individuais e objetivos terapêuticos.
          </p>
        </motion.div>

        {/* Services Grid */}
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {services.map((service) => (
            <motion.div
              key={service.title}
              variants={cardVariants}
              whileHover={{ 
                y: -8, 
                transition: { duration: 0.3 } 
              }}
            >
              <Card className="card-glass hover:shadow-hover transition-all duration-300 h-full">
                <CardContent className="p-8">
                  <div className="mb-6">
                    <motion.div 
                      className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4"
                      whileHover={{ 
                        scale: 1.1, 
                        rotate: 5,
                        transition: { type: "spring", stiffness: 300 }
                      }}
                    >
                      <service.icon className="w-8 h-8 text-primary-foreground" />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">
                      {service.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      {service.description}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <motion.div 
                        key={idx} 
                        className="flex items-center space-x-2 text-sm"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        viewport={{ once: true }}
                      >
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        <span className="text-muted-foreground">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Differentials */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.h3 
            className="text-3xl font-display font-light text-center mb-12"
            variants={headerVariants}
          >
            Nossos Diferenciais
          </motion.h3>
          
          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            variants={containerVariants}
          >
            {differentials.map((differential) => (
              <motion.div 
                key={differential.title}
                className="text-center"
                variants={cardVariants}
                whileHover={{ scale: 1.05 }}
              >
                <motion.div 
                  className="w-20 h-20 bg-gradient-secondary rounded-full flex items-center justify-center mx-auto mb-4"
                  whileHover={{ 
                    rotate: 360,
                    transition: { duration: 0.8 }
                  }}
                >
                  <differential.icon className="w-10 h-10 text-secondary-foreground" />
                </motion.div>
                <h4 className="text-xl font-semibold text-foreground mb-3">
                  {differential.title}
                </h4>
                <p className="text-muted-foreground leading-relaxed">
                  {differential.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default ServicesSection;
