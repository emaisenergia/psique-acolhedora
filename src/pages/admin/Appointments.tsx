import { useCallback, useMemo, useState } from "react";
import { addDays, addMonths, addWeeks, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isSameYear, parseISO, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { storage, type Appointment, type Patient, uid } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const weekOptions = { weekStartsOn: 1 as const };

type CalendarView = "day" | "week" | "month";

type CalendarAppointment = Appointment & { date: Date };

type RepeatFrequency = "none" | "weekly" | "biweekly" | "monthly";

type AppointmentFormState = Partial<Appointment> & {
  repeatFrequency?: RepeatFrequency;
  repeatCount?: number;
};

const defaultFormState: AppointmentFormState = {
  status: "scheduled",
  mode: "presencial",
  paymentStatus: "pending",
  repeatFrequency: "none",
  repeatCount: 1,
};

const statusMeta: Record<NonNullable<Appointment["status"]>, { label: string; dotClass: string }> = {
  scheduled: { label: "Agendado", dotClass: "bg-muted-foreground/60" },
  done: { label: "Confirmado", dotClass: "bg-emerald-500" },
  cancelled: { label: "Cancelado", dotClass: "bg-destructive" },
};

const getStatusMeta = (status?: Appointment["status"]) => statusMeta[status ?? "scheduled"];

const Appointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>(storage.getAppointments());
  const [patients, setPatients] = useState<Patient[]>(storage.getPatients());
  const [form, setForm] = useState<AppointmentFormState>({ ...defaultFormState });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<AppointmentFormState>({ ...defaultFormState });
  const [view, setView] = useState<CalendarView>("month");
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const today = useMemo(() => startOfDay(new Date()), []);
  const [newPatientDialogOpen, setNewPatientDialogOpen] = useState(false);
  const [newPatientContext, setNewPatientContext] = useState<"create" | "edit">("create");
  const [newPatientForm, setNewPatientForm] = useState({ name: "", email: "", phone: "" });

  const resetCreateForm = () => {
    setForm({ ...defaultFormState });
    setShowCreateForm(false);
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setEditingId(null);
    setEditForm({ ...defaultFormState });
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId || !form.dateTime) return;
    const frequency = form.repeatFrequency ?? "none";
    const rawRepeatCount = form.repeatCount ?? 1;
    const repeatCount = frequency === "none" ? 1 : Math.max(1, rawRepeatCount);

    const baseDate = parseISO(form.dateTime);
    if (Number.isNaN(baseDate.getTime())) return;

    const createdAt = new Date().toISOString();
    const created: Appointment[] = [];

    for (let i = 0; i < repeatCount; i++) {
      const occurrenceDate =
        i === 0
          ? baseDate
          : frequency === "weekly"
          ? addWeeks(baseDate, i)
          : frequency === "biweekly"
          ? addWeeks(baseDate, i * 2)
          : frequency === "monthly"
          ? addMonths(baseDate, i)
          : baseDate;

      const dateTime = format(occurrenceDate, "yyyy-MM-dd'T'HH:mm");

      created.push({
        id: uid(),
        patientId: form.patientId,
        dateTime,
        mode: form.mode ?? "presencial",
        status: "scheduled",
        paymentStatus: "pending",
        createdAt,
      });
    }

    const next = [...created, ...appointments];
    setAppointments(next);
    storage.saveAppointments(next);
    resetCreateForm();
  };

  const remove = (id: string) => {
    const next = appointments.filter((a) => a.id !== id);
    setAppointments(next);
    storage.saveAppointments(next);
    if (editingId === id) {
      closeEditDialog();
    }
  };

  const patientMap = useMemo(() => Object.fromEntries(patients.map((p) => [p.id, p.name])), [patients]);

  const parsedAppointments = useMemo(() => {
    const items: CalendarAppointment[] = [];
    for (const appt of appointments) {
      if (!appt.dateTime) continue;
      const date = parseISO(appt.dateTime);
      if (Number.isNaN(date.getTime())) continue;
      items.push({ ...appt, date });
    }
    return items.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [appointments]);

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, CalendarAppointment[]>();
    for (const appt of parsedAppointments) {
      const key = format(appt.date, "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(appt);
    }
    for (const [, list] of map) {
      list.sort((a, b) => a.date.getTime() - b.date.getTime());
    }
    return map;
  }, [parsedAppointments]);

  const updateSelectedDate = useCallback((date: Date) => {
    setSelectedDate(startOfDay(date));
  }, []);

  const navigate = (direction: "prev" | "next" | "today") => {
    if (direction === "today") {
      updateSelectedDate(new Date());
      return;
    }

    const delta = direction === "prev" ? -1 : 1;

    if (view === "month") {
      updateSelectedDate(addMonths(selectedDate, delta));
    } else if (view === "week") {
      updateSelectedDate(addWeeks(selectedDate, delta));
    } else {
      updateSelectedDate(addDays(selectedDate, delta));
    }
  };

  const periodLabel = useMemo(() => {
    if (view === "month") {
      const monthDate = startOfMonth(selectedDate);
      const month = format(monthDate, "MMMM yyyy", { locale: ptBR });
      return month.charAt(0).toUpperCase() + month.slice(1);
    }

    if (view === "week") {
      const weekStart = startOfWeek(selectedDate, weekOptions);
      const weekDisplayEnd = addDays(weekStart, 4);
      const sameYear = isSameYear(weekStart, weekDisplayEnd);
      const startLabel = format(weekStart, "d 'de' MMMM" + (sameYear ? "" : " yyyy"), { locale: ptBR });
      const endLabel = format(weekDisplayEnd, "d 'de' MMMM yyyy", { locale: ptBR });
      const composed = `${startLabel} — ${endLabel}`;
      return composed.charAt(0).toUpperCase() + composed.slice(1);
    }

    const full = format(selectedDate, "EEEE, d 'de' MMMM yyyy", { locale: ptBR });
    return full.charAt(0).toUpperCase() + full.slice(1);
  }, [selectedDate, view]);

  const monthDays = useMemo(() => {
    if (view !== "month") return [];
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart, weekOptions);
    const calendarEnd = endOfWeek(monthEnd, weekOptions);
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [selectedDate, view]);

  const weekDays = useMemo(() => {
    if (view !== "week") return [];
    const weekStart = startOfWeek(selectedDate, weekOptions);
    const businessWeekEnd = addDays(weekStart, 4);
    return eachDayOfInterval({ start: weekStart, end: businessWeekEnd });
  }, [selectedDate, view]);

  const selectedDayKey = format(selectedDate, "yyyy-MM-dd");
  const selectedDayAppointments = appointmentsByDay.get(selectedDayKey) ?? [];

  const startEditing = (id: string) => {
    const appt = appointments.find((item) => item.id === id);
    if (!appt) return;
    setEditingId(id);
    setEditForm({
      patientId: appt.patientId,
      dateTime: appt.dateTime,
      mode: appt.mode ?? "presencial",
      status: appt.status ?? "scheduled",
      repeatFrequency: "none",
      repeatCount: 1,
    });
    updateSelectedDate(parseISO(appt.dateTime));
    setEditDialogOpen(true);
  };

  const saveEdit = () => {
    if (!editingId || !editForm.patientId || !editForm.dateTime) return;

    const existing = appointments.find((appt) => appt.id === editingId);
    if (!existing) return;

    const updated: Appointment = {
      ...existing,
      patientId: editForm.patientId,
      dateTime: editForm.dateTime,
      mode: editForm.mode ?? existing.mode ?? "presencial",
      status: editForm.status ?? existing.status ?? "scheduled",
    };

    const next = appointments.map((appt) => (appt.id === editingId ? updated : appt));
    setAppointments(next);
    storage.saveAppointments(next);
    closeEditDialog();
  };

  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    saveEdit();
  };

  const openNewPatientDialog = (context: "create" | "edit") => {
    setNewPatientContext(context);
    setNewPatientForm({ name: "", email: "", phone: "" });
    setNewPatientDialogOpen(true);
  };

  const closeNewPatientDialog = () => {
    setNewPatientDialogOpen(false);
    setNewPatientForm({ name: "", email: "", phone: "" });
  };

  const submitNewPatient = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newPatientForm.name.trim();
    if (!name) return;

    const newPatient: Patient = {
      id: uid(),
      name,
      email: newPatientForm.email.trim() || undefined,
      phone: newPatientForm.phone.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const nextPatients = [newPatient, ...patients];
    setPatients(nextPatients);
    storage.savePatients(nextPatients);

    if (newPatientContext === "create") {
      setForm((prev) => ({ ...prev, patientId: newPatient.id }));
      if (!showCreateForm) {
        setShowCreateForm(true);
      }
    } else {
      setEditForm((prev) => ({ ...prev, patientId: newPatient.id }));
    }

    closeNewPatientDialog();
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-light">Agendamentos</h1>
        <p className="text-muted-foreground">Crie e acompanhe horários agendados.</p>
      </div>

      <Card className="card-glass mb-6">
        <CardContent className="space-y-5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Novo agendamento</h2>
              <p className="text-sm text-muted-foreground">
                Clique no botão para cadastrar um horário.
              </p>
            </div>
            {!showCreateForm && (
              <Button className="btn-futuristic" onClick={() => setShowCreateForm(true)}>
                Novo agendamento
              </Button>
            )}
          </div>

          {showCreateForm && (
            <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm">Paciente</label>
                  <Button type="button" variant="outline" size="sm" onClick={() => openNewPatientDialog("create")}>Novo paciente</Button>
                </div>
                <Select value={form.patientId} onValueChange={(v) => setForm({ ...form, patientId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.length === 0 && <SelectItem value="__none" disabled>Nenhum paciente cadastrado</SelectItem>}
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm">Data e Hora</label>
                <Input type="datetime-local" value={form.dateTime || ""} onChange={(e) => setForm({ ...form, dateTime: e.target.value })} />
              </div>
              <div>
                <label className="text-sm">Modalidade</label>
                <Select value={form.mode ?? "presencial"} onValueChange={(value) => setForm({ ...form, mode: value as Appointment["mode"] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm">Repetir</label>
                  <Select
                    value={form.repeatFrequency ?? "none"}
                    onValueChange={(value) => setForm({ ...form, repeatFrequency: value as RepeatFrequency })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não repetir</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="biweekly">Quinzenal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm">Quantidade</label>
                  <Input
                    type="number"
                    min="1"
                    max="26"
                    value={form.repeatCount ?? 1}
                    disabled={(form.repeatFrequency ?? "none") === "none"}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setForm({ ...form, repeatCount: Number.isNaN(value) ? 1 : value });
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Inclui o primeiro agendamento.</p>
                </div>
              </div>
              <div className="md:col-span-2 flex flex-wrap items-center gap-2">
                <Button type="submit" className="btn-futuristic">
                  Adicionar Agendamento
                </Button>
                <Button type="button" variant="outline" onClick={resetCreateForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="card-glass">
        <CardContent className="space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Agenda</h2>
                <p className="text-sm text-muted-foreground">Visualize compromissos por dia, semana ou mês.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1">
                  <Button type="button" variant="outline" size="icon" onClick={() => navigate("prev")}>
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Anterior</span>
                  </Button>
                  <Button type="button" variant="outline" size="icon" onClick={() => navigate("next")}>
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Próximo</span>
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate("today")}>
                    Hoje
                  </Button>
                </div>
                <ToggleGroup
                  type="single"
                  value={view}
                  onValueChange={(value) => value && setView(value as CalendarView)}
                  className="rounded-md border bg-background/80 p-1"
                >
                  <ToggleGroupItem value="day" className="px-3 py-1 text-sm">
                    Dia
                  </ToggleGroupItem>
                  <ToggleGroupItem value="week" className="px-3 py-1 text-sm">
                    Semana
                  </ToggleGroupItem>
                  <ToggleGroupItem value="month" className="px-3 py-1 text-sm">
                    Mês
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            <p className="text-sm font-medium">{periodLabel}</p>

            {view === "month" && (
              <div className="space-y-2">
                <div className="grid grid-cols-7 text-center text-xs uppercase text-muted-foreground">
                  {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((label) => (
                    <div key={label} className="py-1 font-medium tracking-wide">
                      {label}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {monthDays.map((day) => {
                    const key = format(day, "yyyy-MM-dd");
                    const dayAppointments = appointmentsByDay.get(key) ?? [];
                    const isSelected = isSameDay(day, selectedDate);
                    const inMonth = isSameMonth(day, selectedDate);
                    const isToday = isSameDay(day, today);

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => updateSelectedDate(day)}
                        className={cn(
                          "flex min-h-[90px] flex-col gap-1 rounded-lg border p-2 text-left transition",
                          inMonth ? "bg-background/60" : "bg-muted/30 text-muted-foreground/80",
                          "hover:border-primary/60 hover:bg-primary/5",
                          isSelected && "border-primary bg-primary/10",
                          !isSelected && isToday && "border-primary/60"
                        )}
                      >
                        <div className="flex items-center justify-between text-sm font-semibold">
                          <span>{format(day, "d")}</span>
                          {isToday && <span className="inline-flex h-2 w-2 rounded-full bg-primary" />}
                        </div>
                        <div className="space-y-1">
                          {dayAppointments.slice(0, 2).map((appt) => {
                            const statusInfo = getStatusMeta(appt.status);
                            return (
                              <button
                                type="button"
                                key={appt.id}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  startEditing(appt.id);
                                }}
                                className={cn(
                                  "rounded bg-primary/10 px-2 py-1 text-left text-xs font-medium text-primary transition hover:bg-primary/20",
                                  editingId === appt.id && "border border-primary/70 bg-primary/20"
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={cn("h-2 w-2 rounded-full", statusInfo.dotClass)} aria-hidden />
                                  <span className="truncate">
                                    {format(appt.date, "HH:mm")} • {patientMap[appt.patientId] || "Paciente"}
                                  </span>
                                </div>
                                <span className="mt-1 block text-[10px] font-normal text-muted-foreground">{statusInfo.label}</span>
                              </button>
                            );
                          })}
                          {dayAppointments.length > 2 && (
                            <span className="text-xs text-muted-foreground">+ {dayAppointments.length - 2} agendamento(s)</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {view === "week" && (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-5">
                {weekDays.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  const isSelected = isSameDay(day, selectedDate);
                  const dayAppointments = appointmentsByDay.get(key) ?? [];
                  const isToday = isSameDay(day, today);

                  return (
                    <div
                      key={key}
                      className={cn(
                        "rounded-lg border bg-background/50 p-3",
                        isSelected && "border-primary shadow-sm",
                        !isSelected && isToday && "border-primary/60"
                      )}
                    >
                      <button type="button" onClick={() => updateSelectedDate(day)} className="w-full text-left">
                        <div className="flex items-baseline justify-between">
                          <span className={cn("text-sm font-semibold", isToday && "text-primary")}>{format(day, "EEE", { locale: ptBR })}</span>
                          <span className={cn("text-lg font-semibold", isToday && "text-primary")}>{format(day, "d")}</span>
                        </div>
                      </button>
                      <div className="mt-2 space-y-2">
                        {dayAppointments.length === 0 && <p className="text-xs text-muted-foreground">Sem agendamentos</p>}
                        {dayAppointments.map((appt) => {
                          const statusInfo = getStatusMeta(appt.status);
                          return (
                            <div
                              key={appt.id}
                              onClick={() => startEditing(appt.id)}
                              className={cn(
                                "cursor-pointer rounded border border-border/60 bg-background/80 p-2 transition hover:border-primary/60 hover:bg-primary/10",
                                editingId === appt.id && "border-primary bg-primary/15"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1">
                                  <p className="text-sm font-medium leading-tight">{patientMap[appt.patientId] || "Paciente"}</p>
                                  <p className="text-xs text-muted-foreground">{format(appt.date, "HH:mm")} • {appt.service || "Agenda"}</p>
                                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                    <span className={cn("h-2 w-2 rounded-full", statusInfo.dotClass)} aria-hidden />
                                    <span>{statusInfo.label}</span>
                                  </div>
                                </div>
                                <span className="sr-only">Editar agendamento</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {view === "day" && (
              <div className="space-y-3">
                {selectedDayAppointments.length === 0 && <p className="text-sm text-muted-foreground">Nenhum agendamento para este dia.</p>}
                {selectedDayAppointments.map((appt) => {
                  const statusInfo = getStatusMeta(appt.status);
                  return (
                    <div
                      key={appt.id}
                      onClick={() => startEditing(appt.id)}
                      className={cn(
                        "cursor-pointer rounded-lg border border-border/70 bg-background/80 p-3 shadow-sm transition hover:border-primary/60 hover:bg-primary/10",
                        editingId === appt.id && "border-primary bg-primary/15"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-base font-semibold leading-tight">{patientMap[appt.patientId] || "Paciente"}</p>
                          <p className="text-sm text-muted-foreground">{format(appt.date, "HH:mm")} • {appt.service || "Agenda"}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>{appt.mode === "online" ? "Online" : "Presencial"}</span>
                            <span className="flex items-center gap-1">
                              <span className={cn("h-2 w-2 rounded-full", statusInfo.dotClass)} aria-hidden />
                              <span>{statusInfo.label}</span>
                            </span>
                          </div>
                          {appt.notes && <p className="mt-2 text-sm text-muted-foreground">{appt.notes}</p>}
                        </div>
                        <span className="sr-only">Editar agendamento</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

      <Dialog open={editDialogOpen} onOpenChange={(open) => (open ? setEditDialogOpen(true) : closeEditDialog())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar agendamento</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitEdit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm">Paciente</label>
                  <Button type="button" variant="outline" size="sm" onClick={() => openNewPatientDialog("edit")}>Novo paciente</Button>
                </div>
                <Select
                  value={editForm.patientId}
                  onValueChange={(value) => setEditForm({ ...editForm, patientId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.length === 0 && <SelectItem value="__none" disabled>Nenhum paciente cadastrado</SelectItem>}
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm">Data e Hora</label>
                <Input
                  type="datetime-local"
                  value={editForm.dateTime || ""}
                  onChange={(e) => setEditForm({ ...editForm, dateTime: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm">Modalidade</label>
                <Select
                  value={editForm.mode ?? "presencial"}
                  onValueChange={(value) => setEditForm({ ...editForm, mode: value as Appointment["mode"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm">Status</label>
                <Select
                  value={editForm.status ?? "scheduled"}
                  onValueChange={(value) => setEditForm({ ...editForm, status: value as Appointment["status"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Agendado</SelectItem>
                    <SelectItem value="done">Confirmado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeEditDialog}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => editingId && remove(editingId)}
              >
                Excluir
              </Button>
              <Button type="submit" className="btn-futuristic">
                Salvar alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={newPatientDialogOpen} onOpenChange={(open) => (open ? setNewPatientDialogOpen(true) : closeNewPatientDialog())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo paciente</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitNewPatient} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm">Nome completo</label>
                <Input
                  value={newPatientForm.name}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm">E-mail</label>
                <Input
                  type="email"
                  value={newPatientForm.email}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm">Telefone</label>
                <Input
                  value={newPatientForm.phone}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, phone: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeNewPatientDialog}>
                Cancelar
              </Button>
              <Button type="submit" className="btn-futuristic">
                Salvar paciente
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </AdminLayout>
  );
};

export default Appointments;
