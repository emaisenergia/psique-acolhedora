import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarDays, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  CheckCircle2,
  Video,
  MapPin
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FadeIn, StaggerChildren, StaggerItem } from '@/components/animations';
import { cn } from '@/lib/utils';

interface TimeSlot {
  time: string;
  available: boolean;
}

const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const unavailableTimes = ['08:00', '10:00', '14:00']; // Simulated unavailable slots
  
  for (let hour = 7; hour <= 20; hour++) {
    const time = `${hour.toString().padStart(2, '0')}:00`;
    slots.push({
      time,
      available: !unavailableTimes.includes(time)
    });
  }
  return slots;
};

const serviceTypes = [
  { id: 'individual', name: 'Terapia Individual', icon: User, duration: '50 min' },
  { id: 'casal', name: 'Terapia de Casal', icon: User, duration: '80 min' },
  { id: 'online', name: 'Atendimento Online', icon: Video, duration: '50 min' },
];

const BookingSection = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: ''
  });

  const timeSlots = generateTimeSlots();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Agendamento realizado com sucesso! ✨",
        description: `Sua consulta foi agendada para ${format(selectedDate!, 'dd/MM/yyyy', { locale: ptBR })} às ${selectedTime}.`,
      });
      
      // Reset form
      setStep(1);
      setSelectedDate(undefined);
      setSelectedTime('');
      setSelectedService('');
      setFormData({ nome: '', email: '', telefone: '' });
    } catch {
      toast({
        title: "Erro ao agendar",
        description: "Por favor, tente novamente ou entre em contato por telefone.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canProceedToStep2 = selectedService !== '';
  const canProceedToStep3 = selectedDate !== undefined && selectedTime !== '';
  const canSubmit = formData.nome && formData.email && formData.telefone;

  const disabledDays = [
    { dayOfWeek: [0] }, // Disable Sundays
    { before: new Date() } // Disable past dates
  ];

  return (
    <section id="agendamento" className="py-24 section-gradient">
      <div className="container mx-auto px-4">
        <FadeIn className="text-center mb-16">
          <span className="text-primary text-sm font-medium tracking-widest uppercase mb-4 block">
            Agendamento Online
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-light text-foreground mb-6">
            Agende sua <span className="text-primary">Consulta</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Escolha o melhor dia e horário para sua sessão de forma prática e rápida
          </p>
        </FadeIn>

        {/* Progress Steps */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="flex items-center justify-center gap-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <motion.div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all duration-300",
                    step >= s 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}
                  animate={step === s ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                </motion.div>
                {s < 3 && (
                  <div className={cn(
                    "w-16 md:w-24 h-1 mx-2 rounded-full transition-all duration-300",
                    step > s ? "bg-primary" : "bg-muted"
                  )} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 px-4">
            <span className="text-xs text-muted-foreground">Serviço</span>
            <span className="text-xs text-muted-foreground">Data/Hora</span>
            <span className="text-xs text-muted-foreground">Dados</span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Step 1: Select Service */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h3 className="text-xl font-semibold text-center mb-8">
                Escolha o tipo de atendimento
              </h3>
              <StaggerChildren className="grid md:grid-cols-3 gap-6">
                {serviceTypes.map((service) => (
                  <StaggerItem key={service.id}>
                    <motion.div
                      whileHover={{ scale: 1.02, y: -5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className={cn(
                          "cursor-pointer transition-all duration-300",
                          selectedService === service.id
                            ? "border-primary shadow-glow"
                            : "card-glass hover:shadow-hover"
                        )}
                        onClick={() => setSelectedService(service.id)}
                      >
                        <CardContent className="p-6 text-center">
                          <div className={cn(
                            "w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 transition-colors",
                            selectedService === service.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-primary/10 text-primary"
                          )}>
                            {service.id === 'online' ? (
                              <Video className="w-8 h-8" />
                            ) : service.id === 'casal' ? (
                              <div className="flex -space-x-2">
                                <User className="w-6 h-6" />
                                <User className="w-6 h-6" />
                              </div>
                            ) : (
                              <User className="w-8 h-8" />
                            )}
                          </div>
                          <h4 className="font-semibold mb-2">{service.name}</h4>
                          <Badge variant="secondary">{service.duration}</Badge>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </StaggerItem>
                ))}
              </StaggerChildren>

              <div className="flex justify-center mt-8">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceedToStep2}
                  className="btn-futuristic"
                >
                  Continuar
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Select Date and Time */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="grid md:grid-cols-2 gap-8">
                {/* Calendar */}
                <Card className="card-glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-primary" />
                      Selecione a Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={disabledDays}
                      locale={ptBR}
                      className={cn("rounded-md border pointer-events-auto")}
                    />
                  </CardContent>
                </Card>

                {/* Time Slots */}
                <Card className="card-glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      Horários Disponíveis
                      {selectedDate && (
                        <Badge variant="outline" className="ml-2">
                          {format(selectedDate, 'dd/MM', { locale: ptBR })}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedDate ? (
                      <div className="grid grid-cols-3 gap-2">
                        {timeSlots.map((slot) => (
                          <motion.button
                            key={slot.time}
                            whileHover={slot.available ? { scale: 1.05 } : {}}
                            whileTap={slot.available ? { scale: 0.95 } : {}}
                            onClick={() => slot.available && setSelectedTime(slot.time)}
                            disabled={!slot.available}
                            className={cn(
                              "p-3 rounded-lg text-sm font-medium transition-all duration-200",
                              !slot.available && "bg-muted text-muted-foreground cursor-not-allowed opacity-50",
                              slot.available && selectedTime !== slot.time && "bg-primary/10 text-primary hover:bg-primary/20",
                              selectedTime === slot.time && "bg-primary text-primary-foreground"
                            )}
                          >
                            {slot.time}
                          </motion.button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Selecione uma data para ver os horários disponíveis</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Voltar
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!canProceedToStep3}
                  className="btn-futuristic"
                >
                  Continuar
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Personal Data */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="grid md:grid-cols-2 gap-8">
                {/* Summary */}
                <Card className="card-glass">
                  <CardHeader>
                    <CardTitle>Resumo do Agendamento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                      <User className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Serviço</p>
                        <p className="font-medium">
                          {serviceTypes.find(s => s.id === selectedService)?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                      <CalendarDays className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Data</p>
                        <p className="font-medium">
                          {selectedDate && format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                      <Clock className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Horário</p>
                        <p className="font-medium">{selectedTime}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                      <MapPin className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Local</p>
                        <p className="font-medium">
                          {selectedService === 'online' ? 'Atendimento Online' : 'Clínica Equanimité'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Form */}
                <Card className="card-glass">
                  <CardHeader>
                    <CardTitle>Seus Dados</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="nome" className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4" />
                        Nome completo *
                      </Label>
                      <Input
                        id="nome"
                        name="nome"
                        value={formData.nome}
                        onChange={handleInputChange}
                        placeholder="Seu nome completo"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                        <Mail className="w-4 h-4" />
                        E-mail *
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="seu@email.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="telefone" className="flex items-center gap-2 mb-2">
                        <Phone className="w-4 h-4" />
                        Telefone *
                      </Label>
                      <Input
                        id="telefone"
                        name="telefone"
                        type="tel"
                        value={formData.telefone}
                        onChange={handleInputChange}
                        placeholder="(45) 99999-9999"
                        required
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Voltar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || isLoading}
                  className="btn-futuristic"
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        className="rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Agendando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Confirmar Agendamento
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};

export default BookingSection;
