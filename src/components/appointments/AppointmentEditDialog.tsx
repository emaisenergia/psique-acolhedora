import { useState, useMemo } from "react";
import { parseISO, format } from "date-fns";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { AppointmentRow, AppointmentStatus } from "@/hooks/useAppointments";
import type { PatientRow } from "@/hooks/usePatients";

const statusMeta: Record<AppointmentStatus, { label: string; color: string }> = {
  scheduled: { label: "Pendente", color: "bg-amber-500" },
  confirmed: { label: "Confirmado", color: "bg-blue-500" },
  done: { label: "Realizado", color: "bg-emerald-500" },
  cancelled: { label: "Cancelado", color: "bg-red-500" },
};
const statusOptions: AppointmentStatus[] = ["scheduled", "confirmed", "done", "cancelled"];

interface AppointmentEditDialogProps {
  open: boolean;
  onClose: () => void;
  editingId: string | null;
  appointments: AppointmentRow[];
  patients: PatientRow[];
  getTimeSlotsForDate: (date: Date, excludeId?: string) => { time: string; isAvailable: boolean }[];
  validateDateTime: (date: Date, excludeId?: string) => { isValid: boolean; error?: string };
  updateAppointment: (id: string, updates: any) => Promise<any>;
  deleteAppointment: (id: string) => Promise<any>;
  onOpenNewPatient: () => void;
  toast: (opts: any) => void;
}

export const AppointmentEditDialog = ({
  open, onClose, editingId, appointments, patients,
  getTimeSlotsForDate, validateDateTime, updateAppointment,
  deleteAppointment, onOpenNewPatient, toast,
}: AppointmentEditDialogProps) => {
  const appt = appointments.find((a) => a.id === editingId);
  const parsedDate = appt?.date_time ? parseISO(appt.date_time) : null;

  const [editForm, setEditForm] = useState(() => ({
    patientId: appt?.patient_id || "",
    date: parsedDate ? format(parsedDate, "yyyy-MM-dd") : "",
    time: parsedDate ? format(parsedDate, "HH:mm") : "",
    mode: appt?.mode ?? "presencial",
    status: appt?.status ?? "scheduled",
    service: appt?.service ?? "individual",
    notes: appt?.notes ?? "",
  }));
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when dialog opens with new appointment
  useMemo(() => {
    if (appt) {
      const d = appt.date_time ? parseISO(appt.date_time) : null;
      setEditForm({
        patientId: appt.patient_id || "",
        date: d ? format(d, "yyyy-MM-dd") : "",
        time: d ? format(d, "HH:mm") : "",
        mode: appt.mode ?? "presencial",
        status: appt.status ?? "scheduled",
        service: appt.service ?? "individual",
        notes: appt.notes ?? "",
      });
      setEditFormError(null);
    }
  }, [editingId]);

  const timeSlots = useMemo(() => {
    if (!editForm.date) return [];
    const date = parseISO(editForm.date);
    if (isNaN(date.getTime())) return [];
    return getTimeSlotsForDate(date, editingId ?? undefined);
  }, [editForm.date, editingId, getTimeSlotsForDate]);

  const saveEdit = async () => {
    if (!editingId || !editForm.patientId || !editForm.date || !editForm.time) return;
    setEditFormError(null);
    setIsSaving(true);

    const parsedDate = parseISO(`${editForm.date}T${editForm.time}`);
    const validation = validateDateTime(parsedDate, editingId);
    if (!validation.isValid) {
      setEditFormError(validation.error || "Horário inválido");
      setIsSaving(false);
      toast({ title: "Horário indisponível", description: validation.error, variant: "destructive" });
      return;
    }

    await updateAppointment(editingId, {
      patient_id: editForm.patientId, date_time: parsedDate.toISOString(),
      mode: editForm.mode ?? "presencial", status: editForm.status ?? "scheduled",
      service: editForm.service, notes: editForm.notes,
    });
    setIsSaving(false);
    onClose();
  };

  const remove = async () => {
    if (!editingId) return;
    await deleteAppointment(editingId);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? undefined : onClose())}>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar agendamento</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); saveEdit(); }} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Paciente</label>
              <Button type="button" variant="outline" size="sm" onClick={onOpenNewPatient}>Novo paciente</Button>
            </div>
            <Select value={editForm.patientId} onValueChange={(v) => setEditForm({ ...editForm, patientId: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {patients.length === 0 && <SelectItem value="__none" disabled>Nenhum paciente cadastrado</SelectItem>}
                {patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data</label>
              <Input type="date" className="h-11" value={editForm.date || ""} onChange={(e) => { setEditForm({ ...editForm, date: e.target.value, time: "" }); setEditFormError(null); }} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Horário</label>
              <Select value={editForm.time || ""} onValueChange={(v) => { setEditForm({ ...editForm, time: v }); setEditFormError(null); }} disabled={!editForm.date}>
                <SelectTrigger className="h-11"><SelectValue placeholder={editForm.date ? "Selecione o horário" : "Selecione a data primeiro"} /></SelectTrigger>
                <SelectContent>
                  {timeSlots.length === 0 ? <SelectItem value="__none" disabled>{editForm.date ? "Sem horários neste dia" : "Selecione a data"}</SelectItem>
                    : timeSlots.map((slot) => <SelectItem key={slot.time} value={slot.time} disabled={!slot.isAvailable} className={cn(!slot.isAvailable && "text-muted-foreground line-through")}>{slot.time} {!slot.isAvailable && "(ocupado)"}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {editFormError && <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm"><AlertCircle className="h-4 w-4 shrink-0" />{editFormError}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Modalidade</label>
              <Select value={editForm.mode ?? "presencial"} onValueChange={(v) => setEditForm({ ...editForm, mode: v })}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="presencial">Presencial</SelectItem><SelectItem value="online">Online</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Atendimento</label>
              <Select value={editForm.service ?? "individual"} onValueChange={(v) => setEditForm({ ...editForm, service: v })}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem><SelectItem value="casal">Casal</SelectItem>
                  <SelectItem value="familia">Família</SelectItem><SelectItem value="grupo">Grupo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={editForm.status ?? "scheduled"} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => {
                  const meta = statusMeta[status];
                  return <SelectItem key={status} value={status}><div className="flex items-center gap-2"><span className={cn("h-2 w-2 rounded-full", meta.color)} /><span>{meta.label}</span></div></SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="button" variant="destructive" onClick={remove}>Excluir</Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar alterações"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
