import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, Loader2, Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

const ConfirmAppointment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);

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

        if (data.action_type !== 'confirm') {
          setError('Este link não é válido para confirmação');
          return;
        }

        setAppointment(data.appointment);
      } catch (err: any) {
        setError(err.message || 'Erro ao validar link');
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleConfirm = async () => {
    if (!token) return;

    setIsConfirming(true);
    try {
      const { data, error } = await supabase.functions.invoke('appointment-actions', {
        body: { action: 'confirm', token },
      });

      if (error || !data.success) {
        setError(data?.error || 'Falha ao confirmar sessão');
        return;
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao confirmar');
    } finally {
      setIsConfirming(false);
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
              <h2 className="text-2xl font-semibold mb-2">Presença Confirmada!</h2>
              <p className="text-muted-foreground mb-6">
                Sua sessão foi confirmada com sucesso. Aguardamos você!
              </p>
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

  const dateTime = parseISO(appointment.date_time);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Confirmar Presença</CardTitle>
            <p className="text-muted-foreground">
              Olá {appointment.patients.name}, confirme sua sessão abaixo:
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="font-medium">
                  {format(dateTime, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <span>{format(dateTime, 'HH:mm')} - Duração: {appointment.duration_minutes} minutos</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <span>{appointment.mode === 'online' ? 'Online' : 'Presencial'}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                asChild
              >
                <Link to="/">Voltar</Link>
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirm}
                disabled={isConfirming}
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Confirmando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirmar Presença
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

export default ConfirmAppointment;
