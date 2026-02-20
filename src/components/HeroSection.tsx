import { Button } from '@/components/ui/button';
import { ArrowRight, Heart, Shield } from 'lucide-react';
import heroImage from '@/assets/hero-image.jpg';
import { motion } from 'framer-motion';

const HeroSection = () => {
  const scrollToContact = () => {
    document.querySelector('#contato')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToServices = () => {
    document.querySelector('#servicos')?.scrollIntoView({ behavior: 'smooth' });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
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

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.9, x: 50 },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const,
      },
    },
  };

  const floatingCardVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        delay: 0.8,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <section 
      id="home"
      className="min-h-screen flex items-center section-gradient relative overflow-hidden"
    >
      {/* Background Decoration */}
      <motion.div 
        className="absolute inset-0 bg-gradient-hero opacity-30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 1.5 }}
      />
      <motion.div 
        className="absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.3 }}
      />
      <motion.div 
        className="absolute bottom-20 left-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.5 }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div 
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex space-x-1">
                  
                </div>
               
              </div>
              
              <h1 className="text-5xl md:text-7xl font-display font-light leading-tight text-foreground">
                Equilibrando
                <motion.span 
                  className="block bg-gradient-primary bg-clip-text text-transparent"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                >
                  Mente e Vida
                </motion.span>
              </h1>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-4">
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                A psicoterapia é um espaço de acolhimento e autodescoberta. Atendimentos presenciais e online, conduzidos por profissionais especializados, para promover equilíbrio, saúde emocional e qualidade de vida.
              </p>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <motion.div 
                  className="flex items-center space-x-2"
                  whileHover={{ scale: 1.05, x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Heart className="w-4 h-4 text-primary" />
                  <span>Atendimento humanizado</span>
                </motion.div>
                <motion.div 
                  className="flex items-center space-x-2"
                  whileHover={{ scale: 1.05, x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Shield className="w-4 h-4 text-primary" />
                  <span>Sigilo profissional</span>
                </motion.div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  onClick={scrollToContact}
                  className="btn-futuristic group"
                >
                  Agendar Primeira Consulta
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  onClick={scrollToServices}
                  variant="outline"
                  className="btn-outline-futuristic"
                >
                  Conhecer Serviços
                </Button>
              </motion.div>
            </motion.div>

            <motion.div variants={itemVariants} className="pt-8">
              <p className="text-sm text-muted-foreground mb-4">
                Psicoterapia baseada em evidências, focada no bem-estar do paciente.
              </p>
              <div className="flex items-center space-x-6">
                <motion.div 
                  className="text-center"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="text-2xl font-bold text-primary">1000+</div>
                  <div className="text-xs text-muted-foreground">Pacientes atendidos</div>
                </motion.div>
                <motion.div 
                  className="text-center"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="text-2xl font-bold text-primary">95%</div>
                  <div className="text-xs text-muted-foreground">Satisfação</div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>

          {/* Hero Image */}
          <motion.div 
            className="relative"
            variants={imageVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="relative">
              <motion.img 
                src={heroImage} 
                alt="Ambiente acolhedor da Clínica Equanimité - espaço moderno e tranquilo para psicoterapia"
                className="w-full h-auto rounded-3xl shadow-hover object-cover"
                loading="eager"
                fetchPriority="high"
                width={600}
                height={400}
                decoding="async"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.4 }}
              />
              <div className="absolute inset-0 bg-gradient-card rounded-3xl"></div>
            </div>
            
            {/* Floating Elements */}
            <motion.div 
              className="absolute -top-6 -right-6 card-glass p-4"
              variants={floatingCardVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ 
                scale: 1.05, 
                boxShadow: "0 20px 40px rgba(0,0,0,0.1)" 
              }}
            >
              <div className="text-center">
                <div className="text-lg font-bold text-primary">Atendimento online</div>
                <div className="text-xs text-muted-foreground">07:00 às 19:00</div>
              </div>
            </motion.div>
            
            <motion.div 
              className="absolute -bottom-6 -left-6 card-glass p-4"
              variants={floatingCardVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ 
                scale: 1.05, 
                boxShadow: "0 20px 40px rgba(0,0,0,0.1)" 
              }}
            >
              <div className="text-center">
                <div className="text-lg font-bold text-primary">Atendimento presencial</div>
                <div className="text-xs text-muted-foreground">Cascavel/PR</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
