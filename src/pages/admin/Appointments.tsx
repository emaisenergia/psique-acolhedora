import { useCallback, useMemo, useState } from "react";
import { addDays, addMonths, addWeeks, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, parseISO, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Filter, Plus, Search } from "lucide-react";

import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { storage, type Appointment, type Patient, uid } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const weekOptions = { weekStartsOn: 0 as const };

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

const statusMeta: Record<NonNullable<Appointment["status"]>, { label: string; color: string; bgColor: string }> = {
  scheduled: { label: "Pendente", color: "bg-amber-500", bgColor: "bg-amber-50 text-amber-700" },
  done: { label: "Realizado", color: "bg-emerald-500", bgColor: "bg-emerald-50 text-emerald-700" },
  cancelled: { label: "Cancelado", color: "bg-red-500", bgColor: "bg-red-50 text-red-700" },
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
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const today = useMemo(() => startOfDay(new Date()), []);
  const [newPatientDialogOpen, setNewPatientDialogOpen] = useState(false);
  const [newPatientContext, setNewPatientContext] = useState<"create" | "edit">("create");
  const [newPatientForm, setNewPatientForm] = useState({ name: "", email: "", phone: "" });
  const [searchQuery, setSearchQuery] = useState("");

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

  const navigateMonth = (direction: "prev" | "next") => {
    const delta = direction === "prev" ? -1 : 1;
    setCurrentMonth(addMonths(currentMonth, delta));
  };

  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart, weekOptions);
    const calendarEnd = endOfWeek(monthEnd, weekOptions);
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Weekly view calculation
  const weekStart = useMemo(() => startOfWeek(selectedDate, weekOptions), [selectedDate]);
  const weekDays = useMemo(() => {
    return eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
  }, [weekStart]);

  const navigateWeek = (direction: "prev" | "next" | "today") => {
    if (direction === "today") {
      updateSelectedDate(today);
      return;
    }
    const delta = direction === "prev" ? -7 : 7;
    updateSelectedDate(addDays(selectedDate, delta));
  };

  const weekLabel = useMemo(() => {
    const start = weekStart;
    const end = addDays(start, 6);
    return `${format(start, "dd/MM")} - ${format(end, "dd/MM")}`;
  }, [weekStart]);

  const selectedDayKey = format(selectedDate, "yyyy-MM-dd");
  const selectedDayAppointments = appointmentsByDay.get(selectedDayKey) ?? [];

  // Count appointments for the week
  const weekStats = useMemo(() => {
    let total = 0;
    let confirmed = 0;
    let pending = 0;
    let done = 0;
    
    for (const day of weekDays) {
      const key = format(day, "yyyy-MM-dd");
      const dayAppts = appointmentsByDay.get(key) ?? [];
      total += dayAppts.length;
      for (const appt of dayAppts) {
        if (appt.status === "scheduled") pending++;
        else if (appt.status === "done") done++;
      }
    }
    confirmed = total - pending - (total - pending - done);
    
    return { total, confirmed: done, pending, done };
  }, [weekDays, appointmentsByDay]);

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

  // Count appointments for current month display
  const monthAppointmentsCount = useMemo(() => {
    let count = 0;
    for (const day of monthDays) {
      if (isSameMonth(day, currentMonth)) {
        const key = format(day, "yyyy-MM-dd");
        count += (appointmentsByDay.get(key) ?? []).length;
      }
    }
    return count;
  }, [monthDays, currentMonth, appointmentsByDay]);

  const selectedDateFormatted = format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  const capitalizedDate = selectedDateFormatted.charAt(0).toUpperCase() + selectedDateFormatted.slice(1);

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-display font-semibold">Agenda</h1>
        <Button className="bg-primary hover:bg-primary/90" onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Sessão
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF ou email do paciente..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content - Calendar and Day Details */}
      <div className="grid gap-6 lg:grid-cols-[400px_1fr] mb-6">
        {/* Calendar Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <CalendarIcon className="h-5 w-5" />
              Calendário
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={() => navigateMonth("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <span className="text-sm font-medium">
                  {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
                </span>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <button 
                    onClick={() => {
                      setCurrentMonth(startOfMonth(today));
                      updateSelectedDate(today);
                    }}
                    className="hover:text-primary"
                  >
                    Hoje
                  </button>
                  <span>{monthAppointmentsCount} consultas</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => navigateMonth("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((label) => (
                <div key={label} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {label}
                </div>
              ))}
              {monthDays.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const dayAppointments = appointmentsByDay.get(key) ?? [];
                const isSelected = isSameDay(day, selectedDate);
                const inMonth = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, today);

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => updateSelectedDate(day)}
                    className={cn(
                      "relative flex items-center justify-center h-10 w-full rounded-lg text-sm transition-colors",
                      !inMonth && "text-muted-foreground/40",
                      inMonth && !isSelected && !isToday && "hover:bg-muted",
                      isToday && !isSelected && "bg-primary text-primary-foreground",
                      isSelected && "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                    )}
                  >
                    {format(day, "d")}
                    {dayAppointments.length > 0 && !isSelected && !isToday && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">Legenda:</p>
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>Pendente</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <span>Confirmado</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Realizado</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  <span>Cancelado</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Day Details Card */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Clock className="h-5 w-5" />
              {capitalizedDate}
            </CardTitle>
            <Badge variant="outline">{selectedDayAppointments.length} consultas</Badge>
          </CardHeader>
          <CardContent className="pt-0">
            {selectedDayAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CalendarIcon className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-1">
                  Nenhuma consulta agendada
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Este dia está livre. Clique em "Nova Sessão" para agendar.
                </p>
                <Button 
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => setShowCreateForm(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agendar Sessão
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayAppointments.map((appt) => {
                  const statusInfo = getStatusMeta(appt.status);
                  const patientName = patientMap[appt.patientId] || "Paciente";
                  
                  return (
                    <button
                      key={appt.id}
                      type="button"
                      onClick={() => startEditing(appt.id)}
                      className={cn(
                        "w-full rounded-lg border p-4 text-left transition hover:border-primary/60 hover:bg-primary/5",
                        editingId === appt.id && "border-primary bg-primary/10"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="font-medium">{patientName}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(appt.date, "HH:mm")} • {appt.mode === "online" ? "Online" : "Presencial"}
                          </p>
                        </div>
                        <Badge className={cn("shrink-0", statusInfo.bgColor)}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly View */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <CalendarIcon className="h-5 w-5" />
            Agenda Semanal
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigateWeek("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigateWeek("today")}>
              Hoje
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigateWeek("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Badge variant="outline" className="ml-2">{weekLabel}</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Week Days Grid */}
          <div className="grid grid-cols-7 gap-3 mb-6">
            {weekDays.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayAppointments = appointmentsByDay.get(key) ?? [];
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, today);
              const dayLabel = format(day, "EEE", { locale: ptBR }).slice(0, 3) + ".";

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => updateSelectedDate(day)}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-xl border-2 p-4 min-h-[120px] transition-colors",
                    "hover:border-primary/60 hover:bg-primary/5",
                    isSelected && "border-green-200 bg-green-50",
                    !isSelected && "border-border",
                    isToday && !isSelected && "border-primary/40"
                  )}
                >
                  <span className="text-xs text-muted-foreground mb-1">{dayLabel}</span>
                  <span className={cn(
                    "text-xl font-semibold",
                    isToday && "text-primary"
                  )}>
                    {format(day, "d")}
                  </span>
                  {dayAppointments.length > 0 && (
                    <span className="text-xs text-muted-foreground mt-2">
                      {dayAppointments.length} consulta{dayAppointments.length > 1 ? 's' : ''}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Week Stats */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t">
            <div className="flex flex-wrap gap-6 text-sm">
              <span>
                <strong>Total da semana:</strong> {weekStats.total} consultas
              </span>
              <span>
                <strong>Confirmadas:</strong> {weekStats.confirmed}
              </span>
              <span>
                <strong>Pendentes:</strong> {weekStats.pending}
              </span>
              <span>
                <strong>Realizadas:</strong> {weekStats.done}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              💡 Arraste as consultas para mover entre dias
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Create Form Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Sessão</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Paciente</label>
                <Button type="button" variant="outline" size="sm" onClick={() => openNewPatientDialog("create")}>
                  Novo paciente
                </Button>
              </div>
              <Select value={form.patientId} onValueChange={(v) => setForm({ ...form, patientId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um paciente" />
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Data e Hora</label>
                <Input 
                  type="datetime-local" 
                  value={form.dateTime || ""} 
                  onChange={(e) => setForm({ ...form, dateTime: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Modalidade</label>
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
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Repetir</label>
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
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantidade</label>
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
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetCreateForm}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                Agendar Sessão
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => (open ? setEditDialogOpen(true) : closeEditDialog())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar agendamento</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitEdit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Paciente</label>
                <Button type="button" variant="outline" size="sm" onClick={() => openNewPatientDialog("edit")}>
                  Novo paciente
                </Button>
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Data e Hora</label>
                <Input
                  type="datetime-local"
                  value={editForm.dateTime || ""}
                  onChange={(e) => setEditForm({ ...editForm, dateTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Modalidade</label>
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
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={editForm.status ?? "scheduled"}
                onValueChange={(value) => setEditForm({ ...editForm, status: value as Appointment["status"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Pendente</SelectItem>
                  <SelectItem value="done">Realizado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
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
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                Salvar alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Patient Dialog */}
      <Dialog open={newPatientDialogOpen} onOpenChange={(open) => (open ? setNewPatientDialogOpen(true) : closeNewPatientDialog())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo paciente</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitNewPatient} className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome completo</label>
                <Input
                  value={newPatientForm.name}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">E-mail</label>
                <Input
                  type="email"
                  value={newPatientForm.email}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefone</label>
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
              <Button type="submit" className="bg-primary hover:bg-primary/90">
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
