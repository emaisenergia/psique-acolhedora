import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { FadeIn, StaggerChildren, StaggerItem } from '@/components/animations';

const faqItems = [
  {
    question: 'Como funciona a primeira sessão de terapia?',
    answer: 'A primeira sessão é um momento de acolhimento e escuta. Vamos conversar sobre o que te trouxe até aqui, suas expectativas e como posso te ajudar. É um espaço seguro para você se expressar livremente, sem julgamentos. Ao final, discutimos juntos os próximos passos do processo terapêutico.'
  },
  {
    question: 'Quanto tempo dura cada sessão?',
    answer: 'Cada sessão tem duração de 50 minutos. Esse tempo é suficiente para um trabalho profundo e significativo, respeitando os limites emocionais e mantendo a qualidade do atendimento.'
  },
  {
    question: 'A terapia online é tão eficaz quanto a presencial?',
    answer: 'Sim! Estudos científicos demonstram que a terapia online é tão eficaz quanto a presencial para a maioria dos casos. Ela oferece flexibilidade, conforto e acessibilidade, permitindo que você receba atendimento de qualidade no ambiente onde se sente mais à vontade.'
  },
  {
    question: 'Com que frequência devo fazer terapia?',
    answer: 'A frequência ideal varia de acordo com cada pessoa e suas necessidades. Geralmente, iniciamos com sessões semanais, que podem ser ajustadas ao longo do processo. Juntos, definimos o ritmo que melhor se adapta à sua vida e objetivos.'
  },
  {
    question: 'O que é sigilo profissional e como funciona?',
    answer: 'O sigilo profissional é um princípio ético fundamental da psicologia. Tudo o que você compartilha em sessão é estritamente confidencial. Só poderei quebrar o sigilo em situações previstas por lei, como risco iminente de vida. Seu espaço de fala é protegido e seguro.'
  },
  {
    question: 'Como sei se preciso de terapia?',
    answer: 'Se você está passando por dificuldades emocionais, sentindo ansiedade, tristeza persistente, problemas de relacionamento, ou simplesmente deseja se conhecer melhor e crescer como pessoa, a terapia pode te ajudar. Não é preciso estar em crise para buscar apoio psicológico.'
  },
  {
    question: 'Qual é o valor da consulta e formas de pagamento?',
    answer: 'Os valores são discutidos na primeira conversa, considerando o tipo de atendimento (individual, casal, online). Aceito PIX, transferência bancária e cartões. Também trabalho com valor social para quem precisa. Entre em contato para mais informações.'
  },
  {
    question: 'Posso remarcar ou cancelar uma sessão?',
    answer: 'Sim, você pode remarcar ou cancelar sessões com pelo menos 24 horas de antecedência. Cancelamentos de última hora ou faltas sem aviso podem ser cobrados. Isso permite uma organização justa da agenda para todos os pacientes.'
  }
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-24 bg-accent/30">
      <div className="container mx-auto px-4">
        <FadeIn className="text-center mb-16">
          <span className="text-primary text-sm font-medium tracking-widest uppercase mb-4 block">
            Perguntas Frequentes
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-light text-foreground mb-6">
            Tire suas <span className="text-primary">Dúvidas</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Encontre respostas para as perguntas mais comuns sobre o processo terapêutico
          </p>
        </FadeIn>

        <div className="max-w-3xl mx-auto">
          <StaggerChildren staggerDelay={0.08}>
            <Accordion type="single" collapsible className="space-y-4">
              {faqItems.map((item, index) => (
                <StaggerItem key={index}>
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AccordionItem 
                      value={`item-${index}`}
                      className="card-glass px-6 border-none"
                    >
                      <AccordionTrigger className="text-left text-foreground hover:text-primary hover:no-underline py-6 text-base md:text-lg font-medium">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-6">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                </StaggerItem>
              ))}
            </Accordion>
          </StaggerChildren>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
