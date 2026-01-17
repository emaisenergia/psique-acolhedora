import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { format, parseISO, addDays, startOfDay, isSameDay, setHours, setMinutes, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, RefreshCw, XCircle, Loader2, Home, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AppointmentData {
  id: string;
  date_time: string;
  duration_minutes: number;
  mode: string;
  status: string;
  patients: {
    id: string;
    name: string;
    email: string;
  };
}

const WORKING_HOURS = {
  start: 8,
  end: 18,
  breakStart: 12,
  breakEnd: 13,
};

const RescheduleAppointment = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState(() => startOfDay(new Date()));
  const [existingAppointments, setExistingAppointments] = useState<{ date_time: string }[]>([]);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Token inválido ou ausente');
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('appointment-actions', {
          body: { action: 'validate', token },
        });

        if (error || !data.valid) {
          setError(data?.error || 'Link inválido ou expirado');
          return;
        }

        if (data.action_type !== 'reschedule') {
          setError('Este link não é válido para reagendamento');
          return;
        }

        setAppointment(data.appointment);
        
        // Fetch existing appointments to check availability
        const { data: appointments } = await supabase
          .from('appointments')
          .select('date_time')
          .neq('status', 'cancelled')
          .gte('date_time', new Date().toISOString());
        
        if (appointments) {
          setExistingAppointments(appointments);
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao validar link');
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i));
    }
    return days;
  }, [weekStart]);

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = WORKING_HOURS.start; hour < WORKING_HOURS.end; hour++) {
      if (hour >= WORKING_HOURS.breakStart && hour < WORKING_HOURS.breakEnd) continue;
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  }, []);

  const isSlotAvailable = (date: Date, time: string): boolean => {
    const [hours, minutes] = time.split(':').map(Number);
    const slotDateTime = setMinutes(setHours(date, hours), minutes);
    
    if (!isAfter(slotDateTime, new Date())) return false;
    
    return !existingAppointments.some(appt => {
      const apptDate = parseISO(appt.date_time);
      return isSameDay(apptDate, date) && format(apptDate, 'HH:mm') === time;
    });
  };

  const handleReschedule = async () => {
    if (!token || !selectedDate || !selectedTime) return;

    setIsRescheduling(true);
    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const newDateTime = setMinutes(setHours(selectedDate, hours), minutes);

      const { data, error } = await supabase.functions.invoke('appointment-actions', {
        body: { 
          action: 'reschedule', 
          token,
          new_date_time: newDateTime.toISOString(),
        },
      });

      if (error || !data.success) {
        setError(data?.error || 'Falha ao reagendar sessão');
        return;
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao reagendar');
    } finally {
      setIsRescheduling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Validando link...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Link Inválido</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button asChild>
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  Ir para a página inicial
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (success) {
    const newDateTime = selectedDate && selectedTime 
      ? setMinutes(setHours(selectedDate, parseInt(selectedTime.split(':')[0])), parseInt(selectedTime.split(':')[1]))
      : null;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 10 }}
              >
                <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
              </motion.div>
              <h2 className="text-2xl font-semibold mb-2">Sessão Reagendada!</h2>
              {newDateTime && (
                <p className="text-muted-foreground mb-6">
                  Nova data: {format(newDateTime, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </p>
              )}
              <Button asChild>
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  Ir para a página inicial
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (!appointment) return null;

  const currentDateTime = parseISO(appointment.date_time);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-8 h-8 text-amber-600" />
            </div>
            <CardTitle className="text-2xl">Reagendar Sessão</CardTitle>
            <p className="text-muted-foreground">
              Olá {appointment.patients.name}, escolha um novo horário:
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current appointment */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Horário atual:</p>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="line-through text-muted-foreground">
                  {format(currentDateTime, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
            </div>

            {/* Week navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWeekStart(addDays(weekStart, -7))}
                disabled={isSameDay(weekStart, startOfDay(new Date()))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium">
                {format(weekStart, "dd 'de' MMM", { locale: ptBR })} - {format(addDays(weekStart, 6), "dd 'de' MMM", { locale: ptBR })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWeekStart(addDays(weekStart, 7))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Day selection */}
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day) => {
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isPast = !isAfter(day, startOfDay(new Date())) && !isSameDay(day, new Date());
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => {
                      setSelectedDate(day);
                      setSelectedTime(null);
                    }}
                    disabled={isPast || isWeekend}
                    className={cn(
                      "p-2 rounded-lg text-center transition-colors",
                      isSelected 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-muted",
                      (isPast || isWeekend) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="text-xs">{format(day, 'EEE', { locale: ptBR })}</div>
                    <div className="text-lg font-semibold">{format(day, 'd')}</div>
                  </button>
                );
              })}
            </div>

            {/* Time selection */}
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <p className="text-sm font-medium">Horários disponíveis:</p>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((time) => {
                    const available = isSlotAvailable(selectedDate, time);
                    const isSelected = selectedTime === time;
                    
                    return (
                      <button
                        key={time}
                        onClick={() => available && setSelectedTime(time)}
                        disabled={!available}
                        className={cn(
                          "p-2 rounded-lg text-center transition-colors text-sm",
                          isSelected 
                            ? "bg-primary text-primary-foreground" 
                            : available 
                            ? "bg-muted hover:bg-muted/80" 
                            : "bg-muted/30 text-muted-foreground cursor-not-allowed"
                        )}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Selected new time */}
            {selectedDate && selectedTime && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-green-100 dark:bg-green-900/30 rounded-lg p-4"
              >
                <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Novo horário:</p>
                <p className="font-semibold text-green-800 dark:text-green-200">
                  {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })} às {selectedTime}
                </p>
              </motion.div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                asChild
              >
                <Link to="/">Cancelar</Link>
              </Button>
              <Button
                className="flex-1"
                onClick={handleReschedule}
                disabled={!selectedDate || !selectedTime || isRescheduling}
              >
                {isRescheduling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Reagendando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Confirmar Reagendamento
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default RescheduleAppointment;
