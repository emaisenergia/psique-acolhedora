import { useCallback, useMemo, useState, DragEvent } from "react";
import { addDays, addMonths, addWeeks, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, parseISO, startOfDay, startOfMonth, startOfWeek, setHours, setMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Edit, Filter, GripVertical, Plus, Search } from "lucide-react";

import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppointments, type AppointmentStatus, type AppointmentRow } from "@/hooks/useAppointments";
import { usePatients } from "@/hooks/usePatients";
import { Skeleton } from "@/components/ui/skeleton";

const weekOptions = { weekStartsOn: 0 as const };

type CalendarAppointment = AppointmentRow & { date: Date };

type RepeatFrequency = "none" | "weekly" | "biweekly" | "monthly";

type AppointmentFormState = {
  patientId?: string;
  dateTime?: string;
  mode?: string;
  status?: string;
  service?: string;
  notes?: string;
  repeatFrequency?: RepeatFrequency;
  repeatCount?: number;
};

const defaultFormState: AppointmentFormState = {
  status: "scheduled",
  mode: "presencial",
  repeatFrequency: "none",
  repeatCount: 1,
};

const statusMeta: Record<AppointmentStatus, { label: string; color: string; bgColor: string }> = {
  scheduled: { label: "Pendente", color: "bg-amber-500", bgColor: "bg-amber-50 text-amber-700" },
  confirmed: { label: "Confirmado", color: "bg-blue-500", bgColor: "bg-blue-50 text-blue-700" },
  done: { label: "Realizado", color: "bg-emerald-500", bgColor: "bg-emerald-50 text-emerald-700" },
  cancelled: { label: "Cancelado", color: "bg-red-500", bgColor: "bg-red-50 text-red-700" },
};

const statusOptions: AppointmentStatus[] = ["scheduled", "confirmed", "done", "cancelled"];

const getStatusMeta = (status?: string) => statusMeta[(status as AppointmentStatus) ?? "scheduled"] ?? statusMeta.scheduled;

const Appointments = () => {
  const { 
    appointments, 
    isLoading: appointmentsLoading, 
    createAppointment, 
    updateAppointment, 
    updateAppointmentDate,
    updateAppointmentStatus: updateStatus,
    deleteAppointment 
  } = useAppointments();
  const { patients, isLoading: patientsLoading, createPatient } = usePatients();
  
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
  const [statusPopoverOpen, setStatusPopoverOpen] = useState<string | null>(null);
  const [draggedAppointment, setDraggedAppointment] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isLoading = appointmentsLoading || patientsLoading;

  const resetCreateForm = () => {
    setForm({ ...defaultFormState });
    setShowCreateForm(false);
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setEditingId(null);
    setEditForm({ ...defaultFormState });
  };

  const handleUpdateAppointmentStatus = async (id: string, newStatus: AppointmentStatus) => {
    await updateStatus(id, newStatus);
    setStatusPopoverOpen(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId || !form.dateTime) return;
    
    setIsSaving(true);
    const frequency = form.repeatFrequency ?? "none";
    const rawRepeatCount = form.repeatCount ?? 1;
    const repeatCount = frequency === "none" ? 1 : Math.max(1, rawRepeatCount);

    const baseDate = parseISO(form.dateTime);
    if (Number.isNaN(baseDate.getTime())) {
      setIsSaving(false);
      return;
    }

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

      await createAppointment({
        patient_id: form.patientId,
        date_time: occurrenceDate.toISOString(),
        mode: form.mode ?? "presencial",
        status: "scheduled",
        service: form.service,
        notes: form.notes,
      });
    }

    setIsSaving(false);
    resetCreateForm();
  };

  const remove = async (id: string) => {
    await deleteAppointment(id);
    if (editingId === id) {
      closeEditDialog();
    }
  };

  const patientMap = useMemo(() => Object.fromEntries(patients.map((p) => [p.id, p.name])), [patients]);

  const parsedAppointments = useMemo(() => {
    const items: CalendarAppointment[] = [];
    for (const appt of appointments) {
      if (!appt.date_time) continue;
      const date = parseISO(appt.date_time);
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
        else if (appt.status === "confirmed") confirmed++;
        else if (appt.status === "done") done++;
      }
    }
    
    return { total, confirmed, pending, done };
  }, [weekDays, appointmentsByDay]);

  const startEditing = (id: string) => {
    const appt = appointments.find((item) => item.id === id);
    if (!appt) return;
    setEditingId(id);
    setEditForm({
      patientId: appt.patient_id,
      dateTime: appt.date_time ? format(parseISO(appt.date_time), "yyyy-MM-dd'T'HH:mm") : "",
      mode: appt.mode ?? "presencial",
      status: appt.status ?? "scheduled",
      service: appt.service ?? "",
      notes: appt.notes ?? "",
      repeatFrequency: "none",
      repeatCount: 1,
    });
    if (appt.date_time) {
      updateSelectedDate(parseISO(appt.date_time));
    }
    setEditDialogOpen(true);
  };

  const saveEdit = async () => {
    if (!editingId || !editForm.patientId || !editForm.dateTime) return;

    setIsSaving(true);
    await updateAppointment(editingId, {
      patient_id: editForm.patientId,
      date_time: parseISO(editForm.dateTime).toISOString(),
      mode: editForm.mode ?? "presencial",
      status: editForm.status ?? "scheduled",
      service: editForm.service,
      notes: editForm.notes,
    });
    setIsSaving(false);
    closeEditDialog();
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveEdit();
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

  const submitNewPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newPatientForm.name.trim();
    if (!name) return;

    const newPatient = await createPatient({
      name,
      email: newPatientForm.email.trim() || "",
      phone: newPatientForm.phone.trim() || null,
    });

    if (newPatient) {
      if (newPatientContext === "create") {
        setForm((prev) => ({ ...prev, patientId: newPatient.id }));
        if (!showCreateForm) {
          setShowCreateForm(true);
        }
      } else {
        setEditForm((prev) => ({ ...prev, patientId: newPatient.id }));
      }
    }

    closeNewPatientDialog();
  };

  // Drag and Drop handlers
  const handleDragStart = (e: DragEvent<HTMLDivElement>, appointmentId: string) => {
    setDraggedAppointment(appointmentId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", appointmentId);
  };

  const handleDragEnd = () => {
    setDraggedAppointment(null);
    setDragOverDay(null);
  };

  const handleDragOver = (e: DragEvent<HTMLButtonElement>, dayKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDay(dayKey);
  };

  const handleDragLeave = () => {
    setDragOverDay(null);
  };

  const handleDrop = async (e: DragEvent<HTMLButtonElement>, targetDay: Date) => {
    e.preventDefault();
    const appointmentId = e.dataTransfer.getData("text/plain");
    
    if (!appointmentId) return;

    const appointment = appointments.find((a) => a.id === appointmentId);
    if (!appointment || !appointment.date_time) return;

    // Get the original time from the appointment
    const originalDate = parseISO(appointment.date_time);
    const hours = originalDate.getHours();
    const minutes = originalDate.getMinutes();

    // Set the new date with the original time
    let newDateTime = startOfDay(targetDay);
    newDateTime = setHours(newDateTime, hours);
    newDateTime = setMinutes(newDateTime, minutes);

    await updateAppointmentDate(appointmentId, newDateTime.toISOString());
    
    setDraggedAppointment(null);
    setDragOverDay(null);
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

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </AdminLayout>
    );
  }

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
                  const patientName = patientMap[appt.patient_id] || "Paciente";
                  
                  return (
                    <div
                      key={appt.id}
                      className={cn(
                        "rounded-lg border p-4 transition hover:border-primary/60 hover:bg-primary/5",
                        editingId === appt.id && "border-primary bg-primary/10"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <p className="font-medium">{patientName}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(appt.date, "HH:mm")} • {appt.mode === "online" ? "Online" : "Presencial"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Popover 
                            open={statusPopoverOpen === appt.id} 
                            onOpenChange={(open) => setStatusPopoverOpen(open ? appt.id : null)}
                          >
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className={cn(
                                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                                  statusInfo.bgColor,
                                  "hover:opacity-80"
                                )}
                              >
                                <span className={cn("h-2 w-2 rounded-full", statusInfo.color)} />
                                {statusInfo.label}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-2" align="end">
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground px-2 pb-1">
                                  Alterar status
                                </p>
                                {statusOptions.map((status) => {
                                  const meta = statusMeta[status];
                                  const isSelected = appt.status === status;
                                  return (
                                    <button
                                      key={status}
                                      type="button"
                                      onClick={() => handleUpdateAppointmentStatus(appt.id, status)}
                                      className={cn(
                                        "flex items-center gap-3 w-full px-2 py-2 rounded-md text-sm transition-colors",
                                        isSelected 
                                          ? "bg-primary/10 text-primary" 
                                          : "hover:bg-muted"
                                      )}
                                    >
                                      <span className={cn("h-3 w-3 rounded-full", meta.color)} />
                                      <span>{meta.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </PopoverContent>
                          </Popover>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => startEditing(appt.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly View with Drag and Drop */}
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
              const isDragOver = dragOverDay === key;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => updateSelectedDate(day)}
                  onDragOver={(e) => handleDragOver(e, key)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, day)}
                  className={cn(
                    "flex flex-col rounded-xl border-2 p-3 min-h-[140px] transition-colors",
                    "hover:border-primary/60 hover:bg-primary/5",
                    isSelected && "border-green-200 bg-green-50",
                    !isSelected && "border-border",
                    isToday && !isSelected && "border-primary/40",
                    isDragOver && "border-primary border-dashed bg-primary/10"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">{dayLabel}</span>
                    <span className={cn(
                      "text-lg font-semibold",
                      isToday && "text-primary"
                    )}>
                      {format(day, "d")}
                    </span>
                  </div>
                  
                  <div className="flex-1 space-y-1 overflow-hidden">
                    {dayAppointments.slice(0, 3).map((appt) => {
                      const statusInfo = getStatusMeta(appt.status);
                      const patientName = patientMap[appt.patient_id] || "Paciente";
                      const isDragging = draggedAppointment === appt.id;
                      
                      return (
                        <div
                          key={appt.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, appt.id)}
                          onDragEnd={handleDragEnd}
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(appt.id);
                          }}
                          className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded text-xs bg-muted/50 cursor-grab active:cursor-grabbing",
                            isDragging && "opacity-50"
                          )}
                        >
                          <GripVertical className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className={cn("h-2 w-2 rounded-full shrink-0", statusInfo.color)} />
                          <span className="truncate">{patientName.split(" ")[0]}</span>
                        </div>
                      );
                    })}
                    {dayAppointments.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{dayAppointments.length - 3} mais
                      </p>
                    )}
                  </div>
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
                <Select value={form.mode ?? "presencial"} onValueChange={(value) => setForm({ ...form, mode: value })}>
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
              <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSaving}>
                {isSaving ? "Salvando..." : "Agendar Sessão"}
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
                  onValueChange={(value) => setEditForm({ ...editForm, mode: value })}
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
                onValueChange={(value) => setEditForm({ ...editForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => {
                    const meta = statusMeta[status];
                    return (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center gap-2">
                          <span className={cn("h-2 w-2 rounded-full", meta.color)} />
                          <span>{meta.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
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
              <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSaving}>
                {isSaving ? "Salvando..." : "Salvar alterações"}
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
                  required
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
