import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Calendar,
  MessageSquare,
  Send,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { z } from 'zod';

// Validation schema
const contactSchema = z.object({
  nome: z.string()
    .trim()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: z.string()
    .trim()
    .email('E-mail inválido')
    .max(255, 'E-mail deve ter no máximo 255 caracteres'),
  telefone: z.string()
    .trim()
    .regex(/^[\d\s()+-]*$/, 'Telefone inválido')
    .max(20, 'Telefone deve ter no máximo 20 caracteres')
    .optional()
    .or(z.literal('')),
  mensagem: z.string()
    .trim()
    .min(10, 'Mensagem deve ter pelo menos 10 caracteres')
    .max(1000, 'Mensagem deve ter no máximo 1000 caracteres')
});

type FormErrors = Partial<Record<keyof z.infer<typeof contactSchema>, string>>;

const ContactSection = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    mensagem: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    try {
      contactSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as keyof FormErrors] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Erro de validação",
        description: "Por favor, corrija os campos destacados.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call - replace with actual edge function when Cloud is enabled
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Mensagem enviada com sucesso! ✨",
        description: "Entraremos em contato em até 24 horas.",
      });
      
      setFormData({ nome: '', email: '', telefone: '', mensagem: '' });
      setErrors({});
    } catch {
      toast({
        title: "Erro ao enviar mensagem",
        description: "Por favor, tente novamente ou entre em contato por telefone.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Endereço',
      content: 'Rua Cassiano Jorge Fernandes - Cascavel, Paraná - CEP 86.819-710',
      action: 'Ver no mapa'
    },
    {
      icon: Phone,
      title: 'Telefone',
      content: '(45) 99124-4303',
      action: 'Ligar agora'
    },
    {
      icon: Mail,
      title: 'E-mail',
      content: 'contato@clinicaequanimite.com',
      action: 'Enviar e-mail'
    },
    {
      icon: Clock,
      title: 'Horário de Funcionamento',
      content: 'Segunda a Sexta: 7h às 21h',
      action: 'Agendar consulta'
    }
  ];

  const quickActions = [
    {
      icon: Calendar,
      title: 'Agendamento Online',
      description: 'Agende sua consulta de forma prática e rápida',
      action: 'Agendar',
      href: '#agendamento'
    },
    {
      icon: MessageSquare,
      title: 'WhatsApp',
      description: 'Fale conosco diretamente pelo WhatsApp',
      action: 'Conversar',
      href: 'https://wa.me/5545991244303'
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

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
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
      id="contato" 
      className="py-24 section-gradient"
    >
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <h2 className="text-4xl md:text-5xl font-display font-light mb-6">
            Entre em
            <motion.span 
              className="block bg-gradient-primary bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              Contato
            </motion.span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Estamos aqui para ajudar. Entre em contato conosco e dê o primeiro 
            passo em direção ao seu bem-estar emocional.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 mb-16">
          {/* Contact Form */}
          <motion.div
            variants={slideInLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            <motion.div
              whileHover={{ 
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)",
                y: -5
              }}
              transition={{ duration: 0.3 }}
            >
              <Card className="card-glass">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-semibold mb-6 text-center">
                    Envie sua mensagem
                  </h3>
                  
                  <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                    <div className="grid md:grid-cols-2 gap-4">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        viewport={{ once: true }}
                      >
                        <label htmlFor="nome" className="block text-sm font-medium mb-2">
                          Nome completo *
                        </label>
                        <Input
                          id="nome"
                          name="nome"
                          type="text"
                          value={formData.nome}
                          onChange={handleInputChange}
                          placeholder="Seu nome completo"
                          className={`transition-all duration-300 focus:shadow-soft ${
                            errors.nome ? 'border-destructive focus-visible:ring-destructive' : ''
                          }`}
                          maxLength={100}
                        />
                        {errors.nome && (
                          <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.nome}
                          </p>
                        )}
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        viewport={{ once: true }}
                      >
                        <label htmlFor="telefone" className="block text-sm font-medium mb-2">
                          Telefone
                        </label>
                        <Input
                          id="telefone"
                          name="telefone"
                          type="tel"
                          value={formData.telefone}
                          onChange={handleInputChange}
                          placeholder="(45) 99999-9999"
                          className={`transition-all duration-300 focus:shadow-soft ${
                            errors.telefone ? 'border-destructive focus-visible:ring-destructive' : ''
                          }`}
                          maxLength={20}
                        />
                        {errors.telefone && (
                          <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.telefone}
                          </p>
                        )}
                      </motion.div>
                    </div>
                    
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      viewport={{ once: true }}
                    >
                      <label htmlFor="email" className="block text-sm font-medium mb-2">
                        E-mail *
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="seu@email.com"
                        className={`transition-all duration-300 focus:shadow-soft ${
                          errors.email ? 'border-destructive focus-visible:ring-destructive' : ''
                        }`}
                        maxLength={255}
                      />
                      {errors.email && (
                        <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.email}
                        </p>
                      )}
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      viewport={{ once: true }}
                    >
                      <label htmlFor="mensagem" className="block text-sm font-medium mb-2">
                        Mensagem *
                      </label>
                      <Textarea
                        id="mensagem"
                        name="mensagem"
                        value={formData.mensagem}
                        onChange={handleInputChange}
                        placeholder="Conte-nos como podemos ajudar..."
                        className={`min-h-32 transition-all duration-300 focus:shadow-soft ${
                          errors.mensagem ? 'border-destructive focus-visible:ring-destructive' : ''
                        }`}
                        maxLength={1000}
                      />
                      <div className="flex justify-between items-center mt-1">
                        {errors.mensagem ? (
                          <p className="text-destructive text-xs flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.mensagem}
                          </p>
                        ) : (
                          <span />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formData.mensagem.length}/1000
                        </span>
                      </div>
                    </motion.div>
                    
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        type="submit" 
                        disabled={isLoading}
                        className="btn-futuristic w-full group"
                      >
                        {isLoading ? (
                          <>
                            <motion.div 
                              className="rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                            Enviando...
                          </>
                        ) : (
                          <>
                            Enviar Mensagem
                            <Send className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Contact Info */}
          <motion.div 
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            <div className="grid gap-6">
              {contactInfo.map((info) => (
                <motion.div
                  key={info.title}
                  variants={itemVariants}
                  whileHover={{ x: 10, transition: { duration: 0.2 } }}
                >
                  <Card className="card-glass hover:shadow-hover transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <motion.div 
                          className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center flex-shrink-0"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <info.icon className="w-6 h-6 text-primary-foreground" />
                        </motion.div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground mb-2">
                            {info.title}
                          </h4>
                          <p className="text-muted-foreground whitespace-pre-line text-sm leading-relaxed">
                            {info.content}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Quick Actions */}
            <motion.div 
              className="grid gap-4"
              variants={slideInRight}
            >
              {quickActions.map((action) => (
                <motion.a
                  key={action.title}
                  href={action.href}
                  target={action.href.startsWith('http') ? '_blank' : undefined}
                  rel={action.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  whileHover={{ scale: 1.02, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="card-glass hover:shadow-hover transition-all duration-300 cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <motion.div 
                            className="w-12 h-12 bg-gradient-secondary rounded-xl flex items-center justify-center"
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.6 }}
                          >
                            <action.icon className="w-6 h-6 text-secondary-foreground" />
                          </motion.div>
                          <div>
                            <h4 className="font-semibold text-foreground">
                              {action.title}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {action.description}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" className="btn-outline-futuristic">
                          {action.action}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.a>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Map Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true, margin: "-50px" }}
        >
          <Card className="card-glass overflow-hidden">
            <div className="relative w-full aspect-video bg-muted/30">
              <iframe
                title="Mapa da Clínica Integrada Anima"
                src="https://www.google.com/maps?q=-24.969493,-53.4531265&hl=pt-BR&z=17&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
            <div className="p-4 md:p-6 border-t border-border flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Clínica Integrada Anima</span>
              </div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <a
                  href="https://www.google.com.br/maps/place/Cl%C3%ADnica+Integrada+Anima/@-24.9694881,-53.4557014,935m/data=!3m2!1e3!4b1!4m6!3m5!1s0x94f3d5484cd14b07:0xb951d33de57d8602!8m2!3d-24.969493!4d-53.4531265!16s%2Fg%2F11h07lyc2x?hl=pt-BR&entry=ttu&g_ep=EgoyMDI1MDgyNS4wIKXMDSoASAFQAw%3D%3D"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex"
                >
                  <Button variant="outline" className="btn-outline-futuristic">
                    Ver no Google Maps
                  </Button>
                </a>
              </motion.div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactSection;
