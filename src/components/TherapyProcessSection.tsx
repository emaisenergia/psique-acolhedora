import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  ClipboardCheck, 
  Target, 
  Calendar, 
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const TherapyProcessSection = () => {
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    {
      id: 1,
      icon: MessageCircle,
      title: "Primeiro Contato",
      subtitle: "Acolhimento Inicial",
      description: "Entre em contato para agendar sua primeira sessão. Neste momento, você pode tirar dúvidas iniciais e conhecer um pouco sobre a abordagem terapêutica.",
      duration: "15-30 min",
      details: [
        "Agendamento flexível (online ou presencial)",
        "Esclarecimento de dúvidas",
        "Informações sobre valores e horários"
      ]
    },
    {
      id: 2,
      icon: ClipboardCheck,
      title: "Avaliação Inicial",
      subtitle: "Entrevista Acolhedora",
      description: "Na primeira sessão, realizamos uma avaliação completa para compreender sua história, demandas atuais e expectativas em relação ao tratamento.",
      duration: "50-60 min",
      details: [
        "Entrevista inicial detalhada",
        "Compreensão do histórico pessoal",
        "Identificação das principais demandas"
      ]
    },
    {
      id: 3,
      icon: Target,
      title: "Plano de Tratamento",
      subtitle: "Objetivos Claros",
      description: "Juntos, definimos os objetivos terapêuticos e traçamos um plano de tratamento personalizado, com metas claras e alcançáveis.",
      duration: "Sessão dedicada",
      details: [
        "Definição de objetivos terapêuticos",
        "Estabelecimento de metas de curto e longo prazo",
        "Escolha das técnicas mais adequadas"
      ]
    },
    {
      id: 4,
      icon: Calendar,
      title: "Sessões Regulares",
      subtitle: "Acompanhamento Contínuo",
      description: "Sessões semanais ou quinzenais onde trabalhamos ativamente nas suas demandas, utilizando técnicas baseadas em evidências científicas.",
      duration: "50 min/sessão",
      details: [
        "Frequência semanal ou quinzenal",
        "Técnicas da Terapia Cognitivo-Comportamental",
        "Tarefas terapêuticas entre sessões"
      ]
    },
    {
      id: 5,
      icon: TrendingUp,
      title: "Evolução Contínua",
      subtitle: "Reavaliação e Crescimento",
      description: "Periodicamente, reavaliamos seu progresso, ajustamos o plano de tratamento e celebramos suas conquistas no caminho do autoconhecimento.",
      duration: "Processo contínuo",
      details: [
        "Reavaliação periódica do progresso",
        "Ajustes no plano de tratamento",
        "Preparação para alta terapêutica"
      ]
    }
  ];

  const activeStepData = steps.find(s => s.id === activeStep)!;

  return (
    <section id="processo" className="py-24 section-gradient overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-display font-light mb-6">
            Processo
            <motion.span 
              className="block bg-gradient-secondary bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              Terapêutico
            </motion.span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Conheça as etapas do seu processo terapêutico, do primeiro contato 
            até a evolução contínua do tratamento.
          </p>
        </motion.div>

        {/* Timeline - Desktop */}
        <div className="hidden md:block relative mb-16">
          {/* Connection Line */}
          <div className="absolute top-10 left-0 right-0 h-1 bg-border rounded-full" />
          <motion.div 
            className="absolute top-10 left-0 h-1 bg-gradient-to-r from-primary to-secondary rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${((activeStep - 1) / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />

          {/* Steps */}
          <div className="relative flex justify-between">
            {steps.map((step, index) => {
              const isActive = step.id === activeStep;
              const isPast = step.id < activeStep;
              
              return (
                <motion.button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className="flex flex-col items-center group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <motion.div 
                    className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isActive 
                        ? 'bg-gradient-to-br from-primary to-primary-light text-primary-foreground shadow-glow scale-110' 
                        : isPast
                        ? 'bg-primary/20 text-primary border-2 border-primary'
                        : 'bg-card border-2 border-border text-muted-foreground group-hover:border-primary/50'
                    }`}
                    whileHover={{ scale: isActive ? 1.1 : 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isPast ? (
                      <CheckCircle2 className="w-8 h-8" />
                    ) : (
                      <step.icon className="w-8 h-8" />
                    )}
                  </motion.div>
                  
                  <motion.div 
                    className={`mt-4 text-center transition-colors duration-300 ${
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                    }`}
                  >
                    <span className="text-xs font-medium uppercase tracking-wider">
                      Etapa {step.id}
                    </span>
                    <p className={`text-sm font-medium mt-1 ${isActive ? 'text-foreground' : ''}`}>
                      {step.title}
                    </p>
                  </motion.div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Timeline - Mobile */}
        <div className="md:hidden mb-8">
          <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 scrollbar-hide">
            {steps.map((step) => {
              const isActive = step.id === activeStep;
              return (
                <motion.button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-300 ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-glow' 
                      : 'bg-card border border-border text-muted-foreground'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <step.icon className="w-5 h-5" />
                  <span className="text-sm font-medium whitespace-nowrap">{step.title}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Active Step Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="card-glass p-8 md:p-12"
          >
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Left side - Content */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center">
                    <activeStepData.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-primary uppercase tracking-wider">
                      Etapa {activeStepData.id}
                    </span>
                    <h3 className="text-2xl font-semibold text-foreground">
                      {activeStepData.title}
                    </h3>
                  </div>
                </div>

                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  {activeStepData.description}
                </p>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                  <Clock className="w-4 h-4" />
                  <span>Duração: {activeStepData.duration}</span>
                </div>

                <ul className="space-y-3">
                  {activeStepData.details.map((detail, index) => (
                    <motion.li 
                      key={index}
                      className="flex items-start gap-3"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2" />
                      <span className="text-muted-foreground">{detail}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Right side - Navigation */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-48 h-48">
                  {/* Progress Circle */}
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="hsl(var(--border))"
                      strokeWidth="4"
                    />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="4"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: activeStep / steps.length }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      style={{
                        strokeDasharray: "283",
                        strokeDashoffset: "0"
                      }}
                    />
                  </svg>
                  
                  {/* Center content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-primary">{activeStep}</span>
                    <span className="text-sm text-muted-foreground">de {steps.length}</span>
                  </div>
                </div>

                {/* Next Step Button */}
                {activeStep < steps.length && (
                  <Button
                    variant="ghost"
                    className="mt-6 group"
                    onClick={() => setActiveStep(activeStep + 1)}
                  >
                    Próxima etapa
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                )}

                {activeStep === steps.length && (
                  <a href="#contato">
                    <Button className="mt-6 btn-futuristic">
                      Agendar Consulta
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default TherapyProcessSection;
