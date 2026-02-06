import { useState, useMemo } from "react";
import { addWeeks, addMonths, parseISO } from "date-fns";
import { AlertCircle, CreditCard, DollarSign, Package, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { PatientRow } from "@/hooks/usePatients";

type RepeatFrequency = "none" | "weekly" | "biweekly" | "monthly";
type PaymentType = "single" | "package";

type AppointmentFormState = {
  patientId?: string;
  date?: string;
  time?: string;
  mode?: string;
  status?: string;
  service?: string;
  notes?: string;
  isRecurring?: boolean;
  repeatFrequency?: RepeatFrequency;
  repeatCount?: number;
  paymentType?: PaymentType;
  sessionValue?: string;
  packageId?: string;
};

const defaultFormState: AppointmentFormState = {
  status: "scheduled", mode: "presencial", service: "individual",
  isRecurring: false, repeatFrequency: "none", repeatCount: 1,
  paymentType: "single", sessionValue: "0,00",
};

interface AppointmentCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patients: PatientRow[];
  getTimeSlotsForDate: (date: Date, excludeId?: string) => { time: string; isAvailable: boolean }[];
  validateDateTime: (date: Date, excludeId?: string) => { isValid: boolean; error?: string };
  createAppointment: (data: any, sendNotification?: boolean) => Promise<any>;
  getActivePackagesForPatient: (patientId: string) => any[];
  onOpenNewPatient: () => void;
  toast: (opts: any) => void;
}

export const AppointmentCreateDialog = ({
  open, onOpenChange, patients, getTimeSlotsForDate,
  validateDateTime, createAppointment, getActivePackagesForPatient,
  onOpenNewPatient, toast,
}: AppointmentCreateDialogProps) => {
  const [form, setForm] = useState<AppointmentFormState>({ ...defaultFormState });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const availablePackages = useMemo(() => {
    if (!form.patientId) return [];
    return getActivePackagesForPatient(form.patientId);
  }, [form.patientId, getActivePackagesForPatient]);

  const timeSlots = useMemo(() => {
    if (!form.date) return [];
    const date = parseISO(form.date);
    if (isNaN(date.getTime())) return [];
    return getTimeSlotsForDate(date);
  }, [form.date, getTimeSlotsForDate]);

  const resetForm = () => {
    setForm({ ...defaultFormState });
    setFormError(null);
    onOpenChange(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId || !form.date || !form.time) return;
    setFormError(null);
    setIsSaving(true);

    const dateTimeString = `${form.date}T${form.time}`;
    const baseDate = parseISO(dateTimeString);
    if (Number.isNaN(baseDate.getTime())) { setIsSaving(false); return; }

    const validation = validateDateTime(baseDate);
    if (!validation.isValid) {
      setFormError(validation.error || "Horário inválido");
      setIsSaving(false);
      toast({ title: "Horário indisponível", description: validation.error, variant: "destructive" });
      return;
    }

    const frequency = form.isRecurring ? (form.repeatFrequency ?? "weekly") : "none";
    const repeatCount = frequency === "none" ? 1 : Math.max(1, form.repeatCount ?? 1);

    const occurrences: Date[] = [];
    for (let i = 0; i < repeatCount; i++) {
      const d = i === 0 ? baseDate : frequency === "weekly" ? addWeeks(baseDate, i) : frequency === "biweekly" ? addWeeks(baseDate, i * 2) : frequency === "monthly" ? addMonths(baseDate, i) : baseDate;
      if (i > 0) {
        const v = validateDateTime(d);
        if (!v.isValid) {
          setFormError(`Conflito na ${i + 1}ª ocorrência: ${v.error}`);
          setIsSaving(false);
          toast({ title: "Conflito de horário", description: `A ${i + 1}ª sessão recorrente tem conflito: ${v.error}`, variant: "destructive" });
          return;
        }
      }
      occurrences.push(d);
    }

    for (const d of occurrences) {
      await createAppointment({ patient_id: form.patientId, date_time: d.toISOString(), mode: form.mode ?? "presencial", status: "scheduled", service: form.service, notes: form.notes });
    }
    setIsSaving(false);
    resetForm();
  };

  // Expose setForm for external updates (e.g. new patient created)
  const setPatientId = (id: string) => setForm(prev => ({ ...prev, patientId: id }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Agendar Nova Sessão</DialogTitle>
          <p className="text-sm text-muted-foreground">Preencha os dados para agendar uma nova sessão</p>
        </DialogHeader>
        <form onSubmit={save} className="space-y-5">
          {/* Paciente */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Paciente <span className="text-destructive">*</span></label>
              <Button type="button" variant="ghost" size="sm" className="text-xs h-7" onClick={onOpenNewPatient}>+ Novo paciente</Button>
            </div>
            <Select value={form.patientId} onValueChange={(v) => setForm({ ...form, patientId: v })}>
              <SelectTrigger className="h-11"><SelectValue placeholder="Selecione um paciente" /></SelectTrigger>
              <SelectContent>
                {patients.length === 0 && <SelectItem value="__none" disabled>Nenhum paciente cadastrado</SelectItem>}
                {patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.name.toUpperCase()}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Data e Horário */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data <span className="text-destructive">*</span></label>
              <Input type="date" className="h-11" value={form.date || ""} onChange={(e) => { setForm({ ...form, date: e.target.value, time: "" }); setFormError(null); }} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Horário <span className="text-destructive">*</span></label>
              <Select value={form.time || ""} onValueChange={(v) => { setForm({ ...form, time: v }); setFormError(null); }} disabled={!form.date}>
                <SelectTrigger className="h-11"><SelectValue placeholder={form.date ? "Selecione o horário" : "Selecione a data primeiro"} /></SelectTrigger>
                <SelectContent>
                  {timeSlots.length === 0 ? <SelectItem value="__none" disabled>{form.date ? "Sem horários neste dia" : "Selecione a data"}</SelectItem>
                    : timeSlots.map((slot) => <SelectItem key={slot.time} value={slot.time} disabled={!slot.isAvailable} className={cn(!slot.isAvailable && "text-muted-foreground line-through")}>{slot.time} {!slot.isAvailable && "(ocupado)"}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {formError && <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm"><AlertCircle className="h-4 w-4 shrink-0" />{formError}</div>}

          {/* Modalidade e Tipo */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Modalidade</label>
              <Select value={form.mode ?? "presencial"} onValueChange={(v) => setForm({ ...form, mode: v })}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="presencial">Presencial</SelectItem><SelectItem value="online">Online</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Atendimento</label>
              <Select value={form.service ?? "individual"} onValueChange={(v) => setForm({ ...form, service: v })}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem><SelectItem value="casal">Casal</SelectItem>
                  <SelectItem value="familia">Família</SelectItem><SelectItem value="grupo">Grupo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Recorrência */}
          <div className="flex items-center space-x-3">
            <Checkbox id="recurring" checked={form.isRecurring ?? false} onCheckedChange={(checked) => setForm({ ...form, isRecurring: checked === true, repeatFrequency: checked ? "weekly" : "none" })} />
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-muted-foreground" />
              <label htmlFor="recurring" className="text-sm font-medium cursor-pointer">Agendamento Recorrente</label>
            </div>
          </div>
          {form.isRecurring && (
            <div className="grid gap-4 sm:grid-cols-2 pl-7">
              <div className="space-y-2">
                <label className="text-sm font-medium">Frequência</label>
                <Select value={form.repeatFrequency ?? "weekly"} onValueChange={(v) => setForm({ ...form, repeatFrequency: v as RepeatFrequency })}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="weekly">Semanal</SelectItem><SelectItem value="biweekly">Quinzenal</SelectItem><SelectItem value="monthly">Mensal</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Repetições</label>
                <Input type="number" min="1" max="26" className="h-11" value={form.repeatCount ?? 4} onChange={(e) => setForm({ ...form, repeatCount: Number.isNaN(Number(e.target.value)) ? 1 : Number(e.target.value) })} />
              </div>
            </div>
          )}

          {/* Pagamento */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center"><CreditCard className="h-4 w-4 text-white" /></div>
              <span className="text-sm font-semibold">Forma de Pagamento</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => setForm({ ...form, paymentType: "single" })} className={cn("relative rounded-lg border-2 p-4 text-left transition-all", form.paymentType === "single" ? "border-emerald-500 bg-emerald-50" : "border-border hover:border-muted-foreground/30")}>
                <div className="flex items-start gap-3">
                  <div className={cn("h-5 w-5 rounded-full border-2 flex items-center justify-center mt-0.5", form.paymentType === "single" ? "border-emerald-500" : "border-muted-foreground/40")}>{form.paymentType === "single" && <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />}</div>
                  <div className="flex-1"><div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-emerald-600" /><span className="font-medium text-sm">Valor Avulso</span></div><p className="text-xs text-muted-foreground mt-0.5">Definir valor individual</p></div>
                </div>
                {form.paymentType === "single" && <div className="mt-3 pt-3 border-t border-emerald-200"><Input type="text" placeholder="R$ 0,00" className="h-10 border-emerald-300 focus:border-emerald-500" value={form.sessionValue ? `R$ ${form.sessionValue}` : ""} onClick={(e) => e.stopPropagation()} onChange={(e) => setForm({ ...form, sessionValue: e.target.value.replace(/[^\d,]/g, "") })} /></div>}
              </button>
              <button type="button" onClick={() => setForm({ ...form, paymentType: "package" })} disabled={availablePackages.length === 0} className={cn("relative rounded-lg border-2 p-4 text-left transition-all", form.paymentType === "package" ? "border-emerald-500 bg-emerald-50" : "border-border hover:border-muted-foreground/30", availablePackages.length === 0 && "opacity-50 cursor-not-allowed")}>
                <div className="flex items-start gap-3">
                  <div className={cn("h-5 w-5 rounded-full border-2 flex items-center justify-center mt-0.5", form.paymentType === "package" ? "border-emerald-500" : "border-muted-foreground/40")}>{form.paymentType === "package" && <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />}</div>
                  <div className="flex-1"><div className="flex items-center gap-2"><Package className="h-4 w-4 text-muted-foreground" /><span className="font-medium text-sm">Pacote</span></div><p className="text-xs text-muted-foreground mt-0.5">{availablePackages.length === 0 ? "Nenhum pacote disponível" : `${availablePackages.length} pacote(s) disponível(is)`}</p></div>
                </div>
              </button>
            </div>
            {form.paymentType === "package" && availablePackages.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Selecionar Pacote</label>
                <Select value={form.packageId || ""} onValueChange={(v) => setForm({ ...form, packageId: v })}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Selecione um pacote" /></SelectTrigger>
                  <SelectContent>
                    {availablePackages.map((pkg: any) => <SelectItem key={pkg.id} value={pkg.id}><div className="flex items-center gap-2"><span>{pkg.name}</span><Badge variant="outline" className="text-xs">{pkg.total_sessions - pkg.used_sessions}/{pkg.total_sessions} restantes</Badge></div></SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={resetForm}>Cancelar</Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSaving}>{isSaving ? "Salvando..." : "Agendar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Re-export for use in parent
export { defaultFormState };
export type { AppointmentFormState };
