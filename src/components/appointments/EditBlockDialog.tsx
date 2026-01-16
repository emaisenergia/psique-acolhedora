import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Lock, Briefcase, Clock, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { AppointmentRow, AppointmentType } from "@/hooks/useAppointments";

type EditBlockDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: (id: string, data: {
    appointment_type: AppointmentType;
    block_reason: string;
    duration_minutes: number;
  }) => Promise<void>;
  onDelete: (id: string) => Promise<boolean | void>;
  appointment: AppointmentRow | null;
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

export const EditBlockDialog = ({
  open,
  onClose,
  onSave,
  onDelete,
  appointment,
}: EditBlockDialogProps) => {
  const [blockType, setBlockType] = useState<AppointmentType>("blocked");
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState(50);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form when appointment changes
  useEffect(() => {
    if (appointment) {
      setBlockType((appointment.appointment_type as AppointmentType) || "blocked");
      setReason(appointment.block_reason || "");
      setDuration(appointment.duration_minutes || 50);
    }
  }, [appointment]);

  const handleSave = async () => {
    if (!appointment) return;

    setIsSaving(true);
    setError(null);

    try {
      await onSave(appointment.id, {
        appointment_type: blockType,
        block_reason: reason,
        duration_minutes: duration,
      });
      onClose();
    } catch (err) {
      setError("Erro ao salvar. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!appointment) return;

    setIsDeleting(true);
    try {
      await onDelete(appointment.id);
      onClose();
    } catch (err) {
      setError("Erro ao excluir. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  if (!appointment) return null;

  const appointmentDate = appointment.date_time ? parseISO(appointment.date_time) : null;
  const dateLabel = appointmentDate ? format(appointmentDate, "dd/MM/yyyy 'às' HH:mm") : "";

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
            Editar {blockType === "blocked" ? "Bloqueio" : "Compromisso Pessoal"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Data/Hora (read-only) */}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{dateLabel}</span>
            </div>
          </div>

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

        <DialogFooter className="pt-2 flex-col sm:flex-row gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" className="sm:mr-auto" disabled={isDeleting}>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir {blockType === "blocked" ? "bloqueio" : "compromisso"}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. O horário ficará disponível novamente para agendamentos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className={cn(
                blockType === "blocked"
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-purple-500 hover:bg-purple-600"
              )}
            >
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
