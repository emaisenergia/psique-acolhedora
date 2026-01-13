import { Award, Heart, Users, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

const AboutSection = () => {
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
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

  const slideInLeft = {
    hidden: { opacity: 0, x: -60 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.7,
        ease: "easeOut" as const,
      },
    },
  };

  const slideInRight = {
    hidden: { opacity: 0, x: 60 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.7,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <section 
      id="sobre" 
      className="py-24 bg-background"
    >
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          {/* Content */}
          <motion.div 
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div variants={slideInLeft}>
              <h2 className="text-4xl md:text-5xl font-display font-light mb-6">
                Sobre a 
                <motion.span 
                  className="block bg-gradient-primary bg-clip-text text-transparent"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  Clínica Equanimité
                </motion.span>
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
            </motion.div>

            {/* Stats */}
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-6"
              variants={itemVariants}
            >
              {stats.map((stat, index) => (
                <motion.div 
                  key={stat.label} 
                  className="text-center"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <motion.div 
                    className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2"
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.15, duration: 0.5 }}
                    viewport={{ once: true }}
                  >
                    {stat.number}
                  </motion.div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Image/Visual Element */}
          <motion.div
            variants={slideInRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <div className="relative">
              <motion.div 
                className="card-glass p-8 rounded-3xl"
                whileHover={{ 
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
                  y: -5
                }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-2xl font-semibold mb-4 text-center">Nossa Missão</h3>
                <blockquote className="text-lg text-muted-foreground italic leading-relaxed text-center">
                  "Promover o bem-estar psicológico através de atendimento 
                  especializado, ético e humanizado, contribuindo para o 
                  desenvolvimento integral de nossos pacientes e a construção 
                  de relacionamentos mais saudáveis."
                </blockquote>
                
                <motion.div 
                  className="mt-8 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  viewport={{ once: true }}
                >
                  <div className="inline-flex items-center space-x-2">
                    <motion.div 
                      className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.8 }}
                    >
                      <Heart className="w-6 h-6 text-primary-foreground" />
                    </motion.div>
                    <div className="text-left">
                      <div className="font-semibold text-foreground">CRP 08/38431</div>
                      <div className="text-sm text-muted-foreground">Psi. Amanda</div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
              
              {/* Decorative elements */}
              <motion.div 
                className="absolute -top-6 -left-6 w-20 h-20 bg-primary/20 rounded-full blur-2xl"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div 
                className="absolute -bottom-6 -right-6 w-32 h-32 bg-secondary/20 rounded-full blur-3xl"
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 0.7, 0.4]
                }}
                transition={{ 
                  duration: 5, 
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              />
            </div>
          </motion.div>
        </div>

        {/* Values */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.h3 
            className="text-3xl font-display font-light text-center mb-12"
            variants={itemVariants}
          >
            Nossos Valores
          </motion.h3>
          
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={containerVariants}
          >
            {values.map((value) => (
              <motion.div
                key={value.title}
                variants={cardVariants}
                whileHover={{ y: -8 }}
              >
                <Card className="card-glass text-center hover:shadow-hover transition-all duration-300 h-full">
                  <CardContent className="p-6">
                    <motion.div 
                      className="w-16 h-16 bg-gradient-secondary rounded-2xl flex items-center justify-center mx-auto mb-4"
                      whileHover={{ 
                        scale: 1.15, 
                        rotate: 10,
                        transition: { type: "spring", stiffness: 300 }
                      }}
                    >
                      <value.icon className="w-8 h-8 text-secondary-foreground" />
                    </motion.div>
                    <h4 className="text-xl font-semibold text-foreground mb-3">
                      {value.title}
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Mission Statement */}
        <motion.div 
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.div 
            className="max-w-4xl mx-auto card-glass p-12 rounded-3xl"
            whileHover={{ 
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)",
              scale: 1.01
            }}
            transition={{ duration: 0.3 }}
          >
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
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
