import { useEffect, useRef, useState } from 'react';
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
  Send
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ContactSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    mensagem: ''
  });
  const [isLoading, setIsLoading] = useState(false);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simular envio do formulário
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Mensagem enviada com sucesso!",
        description: "Entraremos em contato em até 24 horas.",
      });
      
      setFormData({ nome: '', email: '', telefone: '', mensagem: '' });
    } catch (error) {
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
      action: 'Agendar'
    },
    {
      icon: MessageSquare,
      title: 'WhatsApp',
      description: 'Fale conosco diretamente pelo WhatsApp',
      action: 'Conversar'
    }
  ];

  return (
    <section 
      id="contato" 
      ref={sectionRef}
      className="py-24 section-gradient"
    >
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 fade-in-up">
          <h2 className="text-4xl md:text-5xl font-display font-light mb-6">
            Entre em
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              Contato
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Estamos aqui para ajudar. Entre em contato conosco e dê o primeiro 
            passo em direção ao seu bem-estar emocional.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 mb-16">
          {/* Contact Form */}
          <div className="fade-in-up">
            <Card className="card-glass">
              <CardContent className="p-8">
                <h3 className="text-2xl font-semibold mb-6 text-center">
                  Envie sua mensagem
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="nome" className="block text-sm font-medium mb-2">
                        Nome completo *
                      </label>
                      <Input
                        id="nome"
                        name="nome"
                        type="text"
                        required
                        value={formData.nome}
                        onChange={handleInputChange}
                        placeholder="Seu nome completo"
                        className="transition-all duration-300 focus:shadow-soft"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="telefone" className="block text-sm font-medium mb-2">
                        Telefone
                      </label>
                      <Input
                        id="telefone"
                        name="telefone"
                        type="tel"
                        value={formData.telefone}
                        onChange={handleInputChange}
                        placeholder="(11) 99999-9999"
                        className="transition-all duration-300 focus:shadow-soft"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      E-mail *
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="seu@email.com"
                      className="transition-all duration-300 focus:shadow-soft"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="mensagem" className="block text-sm font-medium mb-2">
                      Mensagem *
                    </label>
                    <Textarea
                      id="mensagem"
                      name="mensagem"
                      required
                      value={formData.mensagem}
                      onChange={handleInputChange}
                      placeholder="Conte-nos como podemos ajudar..."
                      className="min-h-32 transition-all duration-300 focus:shadow-soft"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="btn-futuristic w-full group"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        Enviar Mensagem
                        <Send className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Info */}
          <div className="space-y-8 fade-in-up">
            <div className="grid gap-6">
              {contactInfo.map((info, index) => (
                <Card 
                  key={info.title}
                  className="card-glass hover:shadow-hover transition-all duration-300"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center flex-shrink-0">
                        <info.icon className="w-6 h-6 text-primary-foreground" />
                      </div>
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
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4">
              {quickActions.map((action, index) => (
                <Card 
                  key={action.title}
                  className="card-glass hover:shadow-hover transition-all duration-300 cursor-pointer"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-secondary rounded-xl flex items-center justify-center">
                          <action.icon className="w-6 h-6 text-secondary-foreground" />
                        </div>
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
              ))}
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="fade-in-up">
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
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
