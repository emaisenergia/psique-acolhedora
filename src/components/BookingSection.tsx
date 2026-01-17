import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, isSameDay, parseISO, startOfDay, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CalendarDays, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  CheckCircle2,
  Video,
  MapPin,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FadeIn, StaggerChildren, StaggerItem } from '@/components/animations';
import { cn } from '@/lib/utils';
import { useScheduleConfig } from '@/hooks/useScheduleConfig';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

// Validation schema
const bookingSchema = z.object({
  nome: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  email: z.string().trim().email('Email inválido').max(255, 'Email muito longo'),
  telefone: z.string().trim().min(10, 'Telefone inválido').max(20, 'Telefone muito longo')
    .regex(/^[\d\s()+-]+$/, 'Telefone deve conter apenas números')
});

interface TimeSlot {
  time: string;
  available: boolean;
}

const serviceTypes = [
  { id: 'individual', name: 'Terapia Individual', icon: User, duration: '50 min' },
  { id: 'casal', name: 'Terapia de Casal', icon: User, duration: '80 min' },
  { id: 'online', name: 'Atendimento Online', icon: Video, duration: '50 min' },
];

const BookingSection = () => {
  const { toast } = useToast();
  const { scheduleConfig, generateTimeSlots, isWorkDay, loading: configLoading } = useScheduleConfig();
  
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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch appointments for the selected date to check availability
  const { data: existingAppointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ['public-appointments', selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null],
    queryFn: async () => {
      if (!selectedDate) return [];
      
      const startOfSelectedDay = startOfDay(selectedDate);
      const endOfSelectedDay = addDays(startOfSelectedDay, 1);
      
      const { data, error } = await supabase
        .from('appointments')
        .select('date_time, duration_minutes, status, appointment_type')
        .gte('date_time', startOfSelectedDay.toISOString())
        .lt('date_time', endOfSelectedDay.toISOString())
        .neq('status', 'cancelled');
      
      if (error) {
        console.error('Error fetching appointments:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!selectedDate,
  });

  // Generate time slots with real availability
  const timeSlots: TimeSlot[] = useMemo(() => {
    if (!selectedDate) return [];
    
    const slots: TimeSlot[] = [];
    const baseSlots = generateTimeSlots;
    
    baseSlots.forEach((time) => {
      // Check if this slot is taken by an existing appointment
      const [hours, minutes] = time.split(':').map(Number);
      const slotDateTime = new Date(selectedDate);
      slotDateTime.setHours(hours, minutes, 0, 0);
      
      // Check if any appointment overlaps with this slot
      const isOccupied = existingAppointments.some((apt) => {
        const aptDateTime = parseISO(apt.date_time);
        const aptEndTime = new Date(aptDateTime.getTime() + (apt.duration_minutes || 50) * 60000);
        const slotEndTime = new Date(slotDateTime.getTime() + 50 * 60000);
        
        // Check for overlap
        return slotDateTime < aptEndTime && slotEndTime > aptDateTime;
      });
      
      // Check if the slot is in the past
      const isPast = slotDateTime < new Date();
      
      slots.push({
        time,
        available: !isOccupied && !isPast
      });
    });
    
    return slots;
  }, [selectedDate, generateTimeSlots, existingAppointments]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    try {
      bookingSchema.parse(formData);
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as string] = err.message;
          }
        });
        setFormErrors(errors);
      }
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "Dados inválidos",
        description: "Por favor, verifique os campos do formulário.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedDate || !selectedTime || !selectedService) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, selecione data, horário e tipo de serviço.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Create the appointment datetime
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const appointmentDateTime = new Date(selectedDate);
      appointmentDateTime.setHours(hours, minutes, 0, 0);

      // Check one more time if the slot is still available
      const { data: conflictCheck } = await supabase
        .from('appointments')
        .select('id')
        .eq('date_time', appointmentDateTime.toISOString())
        .neq('status', 'cancelled')
        .limit(1);

      if (conflictCheck && conflictCheck.length > 0) {
        toast({
          title: "Horário indisponível",
          description: "Este horário foi reservado por outra pessoa. Por favor, escolha outro horário.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Create appointment
      const { error } = await supabase
        .from('appointments')
        .insert({
          date_time: appointmentDateTime.toISOString(),
          duration_minutes: selectedService === 'casal' ? 80 : 50,
          mode: selectedService === 'online' ? 'online' : 'in_person',
          service: serviceTypes.find(s => s.id === selectedService)?.name,
          status: 'scheduled',
          appointment_type: 'session',
          notes: `Agendamento online - Nome: ${formData.nome}, Email: ${formData.email}, Telefone: ${formData.telefone}`
        });

      if (error) throw error;
      
      toast({
        title: "Agendamento realizado com sucesso! ✨",
        description: `Sua consulta foi agendada para ${format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })} às ${selectedTime}. Entraremos em contato para confirmar.`,
      });
      
      // Reset form
      setStep(1);
      setSelectedDate(undefined);
      setSelectedTime('');
      setSelectedService('');
      setFormData({ nome: '', email: '', telefone: '' });
    } catch (error) {
      console.error('Booking error:', error);
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

  // Disable non-working days and past dates
  const disabledDays = useMemo(() => {
    const disabledDayNumbers = [0, 1, 2, 3, 4, 5, 6].filter(day => !isWorkDay(day));
    return [
      { dayOfWeek: disabledDayNumbers },
      { before: new Date() }
    ];
  }, [isWorkDay]);

  const availableCount = timeSlots.filter(s => s.available).length;

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
            Escolha o melhor dia e horário para sua sessão de forma prática e rápida.
            Os horários são atualizados em tempo real.
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
                    {configLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-64 w-full" />
                      </div>
                    ) : (
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          setSelectedTime(''); // Reset time when date changes
                        }}
                        disabled={disabledDays}
                        locale={ptBR}
                        className={cn("rounded-md border pointer-events-auto")}
                      />
                    )}
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
                    {selectedDate && !appointmentsLoading && (
                      <p className="text-sm text-muted-foreground">
                        {availableCount} horários disponíveis
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    {!selectedDate ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Selecione uma data para ver os horários disponíveis</p>
                      </div>
                    ) : appointmentsLoading ? (
                      <div className="grid grid-cols-3 gap-2">
                        {[...Array(12)].map((_, i) => (
                          <Skeleton key={i} className="h-10 w-full" />
                        ))}
                      </div>
                    ) : availableCount === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50 text-destructive" />
                        <p>Não há horários disponíveis nesta data.</p>
                        <p className="text-sm mt-2">Por favor, selecione outra data.</p>
                      </div>
                    ) : (
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
                              !slot.available && "bg-muted text-muted-foreground cursor-not-allowed opacity-50 line-through",
                              slot.available && selectedTime !== slot.time && "bg-primary/10 text-primary hover:bg-primary/20",
                              selectedTime === slot.time && "bg-primary text-primary-foreground"
                            )}
                          >
                            {slot.time}
                          </motion.button>
                        ))}
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
                        className={cn(formErrors.nome && "border-destructive")}
                        required
                      />
                      {formErrors.nome && (
                        <p className="text-sm text-destructive mt-1">{formErrors.nome}</p>
                      )}
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
                        className={cn(formErrors.email && "border-destructive")}
                        required
                      />
                      {formErrors.email && (
                        <p className="text-sm text-destructive mt-1">{formErrors.email}</p>
                      )}
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
                        className={cn(formErrors.telefone && "border-destructive")}
                        required
                      />
                      {formErrors.telefone && (
                        <p className="text-sm text-destructive mt-1">{formErrors.telefone}</p>
                      )}
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
