import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';
import { FadeIn } from '@/components/animations';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Maria Silva',
    role: 'Terapia Individual',
    content: 'A terapia transformou minha vida. Depois de anos lidando com ansiedade, finalmente encontrei paz interior e ferramentas para enfrentar os desafios do dia a dia. Sou eternamente grata pelo acolhimento e profissionalismo.',
    rating: 5,
    avatar: 'MS'
  },
  {
    id: 2,
    name: 'João e Ana Santos',
    role: 'Terapia de Casal',
    content: 'Nossa comunicação melhorou muito após iniciarmos a terapia de casal. Aprendemos a nos ouvir e a resolver conflitos de forma saudável. Recomendamos a todos os casais que buscam fortalecer seu relacionamento.',
    rating: 5,
    avatar: 'JA'
  },
  {
    id: 3,
    name: 'Pedro Oliveira',
    role: 'Terapia Online',
    content: 'Mesmo à distância, a conexão e o acolhimento foram incríveis. A flexibilidade do atendimento online me permitiu cuidar da minha saúde mental sem atrapalhar minha rotina de trabalho.',
    rating: 5,
    avatar: 'PO'
  },
  {
    id: 4,
    name: 'Carla Mendes',
    role: 'Terapia Individual',
    content: 'Encontrei um espaço seguro para me expressar sem julgamentos. A abordagem humanizada e as técnicas utilizadas me ajudaram a superar um momento muito difícil da minha vida.',
    rating: 5,
    avatar: 'CM'
  },
  {
    id: 5,
    name: 'Lucas Ferreira',
    role: 'Terapia Individual',
    content: 'Depois de muita resistência, decidi começar a terapia. Foi a melhor decisão que tomei. Hoje me conheço melhor e consigo lidar com situações que antes me paralisavam.',
    rating: 5,
    avatar: 'LF'
  }
];

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          <Star
            className={`w-5 h-5 ${
              index < rating
                ? 'text-yellow-500 fill-yellow-500'
                : 'text-muted-foreground'
            }`}
          />
        </motion.div>
      ))}
    </div>
  );
};

const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: 'easeOut' as const,
      },
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: 0.5,
        ease: 'easeIn' as const,
      },
    }),
  };

  return (
    <section id="depoimentos" className="py-24 bg-accent/30">
      <div className="container mx-auto px-4">
        <FadeIn className="text-center mb-16">
          <span className="text-primary text-sm font-medium tracking-widest uppercase mb-4 block">
            Depoimentos
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-light text-foreground mb-6">
            O que nossos <span className="text-primary">pacientes</span> dizem
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Histórias reais de pessoas que transformaram suas vidas através da terapia
          </p>
        </FadeIn>

        <div className="relative max-w-4xl mx-auto">
          {/* Navigation Buttons */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 -ml-4 md:-ml-12">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="icon"
                onClick={goToPrevious}
                className="rounded-full bg-background/80 backdrop-blur-sm shadow-lg hover:shadow-xl"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </motion.div>
          </div>

          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 -mr-4 md:-mr-12">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNext}
                className="rounded-full bg-background/80 backdrop-blur-sm shadow-lg hover:shadow-xl"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </motion.div>
          </div>

          {/* Carousel */}
          <div className="overflow-hidden px-4">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <Card className="card-glass">
                  <CardContent className="p-8 md:p-12">
                    <div className="flex flex-col items-center text-center">
                      {/* Quote Icon */}
                      <motion.div
                        initial={{ rotate: -10, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mb-6"
                      >
                        <Quote className="w-12 h-12 text-primary/30" />
                      </motion.div>

                      {/* Content */}
                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-lg md:text-xl text-foreground leading-relaxed mb-8 italic"
                      >
                        "{testimonials[currentIndex].content}"
                      </motion.p>

                      {/* Rating */}
                      <div className="mb-6">
                        <StarRating rating={testimonials[currentIndex].rating} />
                      </div>

                      {/* Author */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex items-center gap-4"
                      >
                        <div className="w-14 h-14 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-lg">
                          {testimonials[currentIndex].avatar}
                        </div>
                        <div className="text-left">
                          <h4 className="font-semibold text-foreground">
                            {testimonials[currentIndex].name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {testimonials[currentIndex].role}
                          </p>
                        </div>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots Navigation */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-primary w-8'
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
