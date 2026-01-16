import { useState, useMemo } from "react";
import { format, parseISO, setHours, setMinutes, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Lock, Briefcase, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useScheduleValidation } from "@/hooks/useScheduleValidation";
import type { AppointmentRow } from "@/hooks/useAppointments";

export type BlockType = "blocked" | "personal";

type BlockTimeDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    appointment_type: BlockType;
    date_time: string;
    block_reason: string;
    duration_minutes: number;
  }) => Promise<void>;
  initialDate?: Date;
  initialTime?: string;
  appointments: AppointmentRow[];
};

const durationOptions = [
  { value: 30, label: "30 minutos" },
  { value: 50, label: "50 minutos (1 sessão)" },
  { value: 60, label: "1 hora" },
  { value: 120, label: "2 horas" },
  { value: 180, label: "3 horas" },
  { value: 240, label: "4 horas" },
  { value: 480, label: "Dia inteiro (8h)" },
];

export const BlockTimeDialog = ({
  open,
  onClose,
  onSave,
  initialDate,
  initialTime,
  appointments,
}: BlockTimeDialogProps) => {
  const [blockType, setBlockType] = useState<BlockType>("blocked");
  const [date, setDate] = useState(initialDate ? format(initialDate, "yyyy-MM-dd") : "");
  const [time, setTime] = useState(initialTime || "");
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState(50);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getTimeSlotsForDate } = useScheduleValidation(appointments);

  const timeSlots = useMemo(() => {
    if (!date) return [];
    const parsedDate = parseISO(date);
    if (isNaN(parsedDate.getTime())) return [];
    return getTimeSlotsForDate(parsedDate);
  }, [date, getTimeSlotsForDate]);

  const handleSave = async () => {
    if (!date || !time) {
      setError("Selecione data e horário");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const parsedDate = parseISO(date);
      const [hours, minutes] = time.split(":").map(Number);
      let dateTime = startOfDay(parsedDate);
      dateTime = setHours(dateTime, hours);
      dateTime = setMinutes(dateTime, minutes);

      await onSave({
        appointment_type: blockType,
        date_time: dateTime.toISOString(),
        block_reason: reason,
        duration_minutes: duration,
      });

      // Reset form
      setBlockType("blocked");
      setDate("");
      setTime("");
      setReason("");
      setDuration(50);
      onClose();
    } catch (err) {
      setError("Erro ao salvar. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setBlockType("blocked");
    setDate(initialDate ? format(initialDate, "yyyy-MM-dd") : "");
    setTime(initialTime || "");
    setReason("");
    setDuration(50);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {blockType === "blocked" ? (
              <Lock className="h-5 w-5 text-red-500" />
            ) : (
              <Briefcase className="h-5 w-5 text-purple-500" />
            )}
            {blockType === "blocked" ? "Bloquear Horário" : "Compromisso Pessoal"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tipo de Bloqueio */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBlockType("blocked")}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg border-2 transition-all",
                  blockType === "blocked"
                    ? "border-red-400 bg-red-50"
                    : "border-border hover:border-muted-foreground/30"
                )}
              >
                <Lock className={cn("h-4 w-4", blockType === "blocked" ? "text-red-600" : "text-muted-foreground")} />
                <span className={cn("text-sm font-medium", blockType === "blocked" ? "text-red-700" : "")}>
                  Bloqueio
                </span>
              </button>
              <button
                type="button"
                onClick={() => setBlockType("personal")}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg border-2 transition-all",
                  blockType === "personal"
                    ? "border-purple-400 bg-purple-50"
                    : "border-border hover:border-muted-foreground/30"
                )}
              >
                <Briefcase className={cn("h-4 w-4", blockType === "personal" ? "text-purple-600" : "text-muted-foreground")} />
                <span className={cn("text-sm font-medium", blockType === "personal" ? "text-purple-700" : "")}>
                  Pessoal
                </span>
              </button>
            </div>
          </div>

          {/* Data e Hora */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data</label>
              <Input
                type="date"
                className="h-11"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setTime("");
                  setError(null);
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Horário</label>
              <Select
                value={time}
                onValueChange={(v) => {
                  setTime(v);
                  setError(null);
                }}
                disabled={!date}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={date ? "Selecione" : "Selecione data"} />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      Sem horários
                    </SelectItem>
                  ) : (
                    timeSlots.map((slot) => (
                      <SelectItem
                        key={slot.time}
                        value={slot.time}
                        disabled={!slot.isAvailable}
                        className={cn(!slot.isAvailable && "text-muted-foreground line-through")}
                      >
                        {slot.time} {!slot.isAvailable && "(ocupado)"}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Duração */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Duração
            </label>
            <Select value={duration.toString()} onValueChange={(v) => setDuration(Number(v))}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {durationOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value.toString()}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Motivo <span className="text-muted-foreground text-xs">(visível apenas para você)</span>
            </label>
            <Textarea
              placeholder={blockType === "blocked" ? "Ex: Consulta médica, reunião..." : "Ex: Almoço com família, dentista..."}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !date || !time}
            className={cn(
              blockType === "blocked"
                ? "bg-red-500 hover:bg-red-600"
                : "bg-purple-500 hover:bg-purple-600"
            )}
          >
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
