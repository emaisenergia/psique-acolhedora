import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, Clock, Calendar } from 'lucide-react';

interface WaitlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  selectedService: string;
  onSubmit: (data: {
    desired_time?: string;
    time_range_start?: string;
    time_range_end?: string;
    notes?: string;
  }) => Promise<void>;
}

const timeOptions = [
  '08:00', '09:00', '10:00', '11:00',
  '14:00', '15:00', '16:00', '17:00'
];

const WaitlistDialog = ({
  open,
  onOpenChange,
  selectedDate,
  selectedService,
  onSubmit
}: WaitlistDialogProps) => {
  const [preferenceType, setPreferenceType] = useState<'specific' | 'range' | 'any'>('any');
  const [specificTime, setSpecificTime] = useState('');
  const [timeRangeStart, setTimeRangeStart] = useState('');
  const [timeRangeEnd, setTimeRangeEnd] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const data: {
        desired_time?: string;
        time_range_start?: string;
        time_range_end?: string;
        notes?: string;
      } = {};

      if (preferenceType === 'specific' && specificTime) {
        data.desired_time = specificTime;
      } else if (preferenceType === 'range' && timeRangeStart && timeRangeEnd) {
        data.time_range_start = timeRangeStart;
        data.time_range_end = timeRangeEnd;
      }

      if (notes.trim()) {
        data.notes = notes.trim();
      }

      await onSubmit(data);
      onOpenChange(false);
      
      // Reset form
      setPreferenceType('any');
      setSpecificTime('');
      setTimeRangeStart('');
      setTimeRangeEnd('');
      setNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Entrar na Lista de Espera
          </DialogTitle>
          <DialogDescription>
            Você será notificado quando um horário estiver disponível para a data selecionada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date and Service Summary */}
          <div className="bg-muted/50 p-3 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">
                {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </span>
            </div>
            {selectedService && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{selectedService}</span>
              </div>
            )}
          </div>

          {/* Time Preference */}
          <div className="space-y-2">
            <Label>Preferência de horário</Label>
            <Select value={preferenceType} onValueChange={(v) => setPreferenceType(v as typeof preferenceType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Qualquer horário disponível</SelectItem>
                <SelectItem value="specific">Horário específico</SelectItem>
                <SelectItem value="range">Faixa de horário</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {preferenceType === 'specific' && (
            <div className="space-y-2">
              <Label>Horário desejado</Label>
              <Select value={specificTime} onValueChange={setSpecificTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o horário" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map(time => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {preferenceType === 'range' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>De</Label>
                <Select value={timeRangeStart} onValueChange={setTimeRangeStart}>
                  <SelectTrigger>
                    <SelectValue placeholder="Início" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Até</Label>
                <Select value={timeRangeEnd} onValueChange={setTimeRangeEnd}>
                  <SelectTrigger>
                    <SelectValue placeholder="Fim" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Observações (opcional)</Label>
            <Textarea
              placeholder="Adicione informações adicionais..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Adicionando...' : 'Entrar na Lista'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WaitlistDialog;
