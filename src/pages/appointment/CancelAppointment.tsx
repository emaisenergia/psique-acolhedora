import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, XCircle, Loader2, Home, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

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

const CancelAppointment = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [reason, setReason] = useState('');

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

        if (data.action_type !== 'cancel') {
          setError('Este link não é válido para cancelamento');
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

  const handleCancel = async () => {
    if (!token) return;

    setIsCancelling(true);
    try {
      const { data, error } = await supabase.functions.invoke('appointment-actions', {
        body: { action: 'cancel', token, reason },
      });

      if (error || !data.success) {
        setError(data?.error || 'Falha ao cancelar sessão');
        return;
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao cancelar');
    } finally {
      setIsCancelling(false);
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
                <XCircle className="w-20 h-20 text-amber-500 mx-auto mb-4" />
              </motion.div>
              <h2 className="text-2xl font-semibold mb-2">Sessão Cancelada</h2>
              <p className="text-muted-foreground mb-6">
                Sua sessão foi cancelada. Entre em contato para reagendar quando desejar.
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
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Cancelar Sessão</CardTitle>
            <p className="text-muted-foreground">
              {appointment.patients.name}, tem certeza que deseja cancelar?
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

            <div className="space-y-2">
              <Label htmlFor="reason">Motivo do cancelamento (opcional)</Label>
              <Textarea
                id="reason"
                placeholder="Conte-nos o motivo do cancelamento..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="resize-none"
                rows={3}
              />
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
                variant="destructive"
                className="flex-1"
                onClick={handleCancel}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cancelando...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Confirmar Cancelamento
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

export default CancelAppointment;
