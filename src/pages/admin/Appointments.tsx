import { useCallback, useMemo, useState, DragEvent } from "react";
import { addDays, addMonths, addWeeks, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, parseISO, startOfDay, startOfMonth, startOfWeek, setHours, setMinutes, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, Briefcase, Calendar as CalendarIcon, CheckCircle, ChevronLeft, ChevronRight, Clock, CreditCard, DollarSign, Edit, Filter, Grid3X3, GripVertical, Lock, Package, Plus, Repeat, Search, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppointments, type AppointmentStatus, type AppointmentRow, type AppointmentType } from "@/hooks/useAppointments";
import { usePatients } from "@/hooks/usePatients";
import { Skeleton } from "@/components/ui/skeleton";
import { useScheduleValidation, WORKING_HOURS } from "@/hooks/useScheduleValidation";
import { useToast } from "@/hooks/use-toast";
import { useSessionPackages } from "@/hooks/useSessionPackages";
import { DailyTimeGrid } from "@/components/appointments/DailyTimeGrid";
import { BlockTimeDialog, type BlockType } from "@/components/appointments/BlockTimeDialog";
import { EditBlockDialog } from "@/components/appointments/EditBlockDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WhatsAppActionMenu } from "@/components/appointments/WhatsAppActionMenu";

const weekOptions = { weekStartsOn: 0 as const };

type CalendarAppointment = AppointmentRow & { date: Date };

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
  status: "scheduled",
  mode: "presencial",
  service: "individual",
  isRecurring: false,
  repeatFrequency: "none",
  repeatCount: 1,
  paymentType: "single",
  sessionValue: "0,00",
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
  const { toast } = useToast();
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
  const { packages, getActivePackagesForPatient } = useSessionPackages();
  const { 
    validateDateTime, 
    getTimeSlotsForDate,
  } = useScheduleValidation(appointments);
  
  const [form, setForm] = useState<AppointmentFormState>({ ...defaultFormState });
  const [formError, setFormError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<AppointmentFormState>({ ...defaultFormState });
  const [editFormError, setEditFormError] = useState<string | null>(null);
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
  const [viewMode, setViewMode] = useState<"calendar" | "grid">("calendar");
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockDialogInitialDate, setBlockDialogInitialDate] = useState<Date | undefined>();
  const [blockDialogInitialTime, setBlockDialogInitialTime] = useState<string | undefined>();
  const [editBlockDialogOpen, setEditBlockDialogOpen] = useState(false);
  const [editingBlockAppointment, setEditingBlockAppointment] = useState<AppointmentRow | null>(null);

  const isLoading = appointmentsLoading || patientsLoading;

  // Get available packages for selected patient
  const availablePackages = useMemo(() => {
    if (!form.patientId) return [];
    return getActivePackagesForPatient(form.patientId);
  }, [form.patientId, getActivePackagesForPatient]);

  // Get time slots for the create form date
  const createFormTimeSlots = useMemo(() => {
    if (!form.date) return [];
    const date = parseISO(form.date);
    if (isNaN(date.getTime())) return [];
    return getTimeSlotsForDate(date);
  }, [form.date, getTimeSlotsForDate]);

  // Get time slots for the edit form date
  const editFormTimeSlots = useMemo(() => {
    if (!editForm.date) return [];
    const date = parseISO(editForm.date);
    if (isNaN(date.getTime())) return [];
    return getTimeSlotsForDate(date, editingId ?? undefined);
  }, [editForm.date, editingId, getTimeSlotsForDate]);

  const resetCreateForm = () => {
    setForm({ ...defaultFormState });
    setFormError(null);
    setShowCreateForm(false);
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setEditingId(null);
    setEditForm({ ...defaultFormState });
    setEditFormError(null);
  };

  const handleUpdateAppointmentStatus = async (id: string, newStatus: AppointmentStatus) => {
    await updateStatus(id, newStatus);
    setStatusPopoverOpen(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId || !form.date || !form.time) return;
    
    setFormError(null);
    setIsSaving(true);
    
    // Combine date and time into datetime
    const dateTimeString = `${form.date}T${form.time}`;
    const baseDate = parseISO(dateTimeString);
    
    if (Number.isNaN(baseDate.getTime())) {
      setIsSaving(false);
      return;
    }

    // Validate the first occurrence
    const validation = validateDateTime(baseDate);
    if (!validation.isValid) {
      setFormError(validation.error || "Horário inválido");
      setIsSaving(false);
      toast({
        title: "Horário indisponível",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    const frequency = form.isRecurring ? (form.repeatFrequency ?? "weekly") : "none";
    const rawRepeatCount = form.repeatCount ?? 1;
    const repeatCount = frequency === "none" ? 1 : Math.max(1, rawRepeatCount);

    // Validate all recurring occurrences
    const occurrences: Date[] = [];
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
      
      // Skip validation for first occurrence (already validated)
      if (i > 0) {
        const occValidation = validateDateTime(occurrenceDate);
        if (!occValidation.isValid) {
          setFormError(`Conflito na ${i + 1}ª ocorrência: ${occValidation.error}`);
          setIsSaving(false);
          toast({
            title: "Conflito de horário",
            description: `A ${i + 1}ª sessão recorrente tem conflito: ${occValidation.error}`,
            variant: "destructive",
          });
          return;
        }
      }
      occurrences.push(occurrenceDate);
    }

    // Create all appointments
    for (const occurrenceDate of occurrences) {
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

  const createBlockOrPersonal = async (data: {
    appointment_type: BlockType;
    date_time: string;
    block_reason: string;
    duration_minutes: number;
  }) => {
    await createAppointment({
      patient_id: null as unknown as string, // null for blocks/personal
      date_time: data.date_time,
      appointment_type: data.appointment_type,
      block_reason: data.block_reason,
      duration_minutes: data.duration_minutes,
      mode: "presencial",
      status: "confirmed",
    }, false); // Don't send notification for blocks
  };

  const openBlockDialog = (date?: Date, time?: string) => {
    setBlockDialogInitialDate(date);
    setBlockDialogInitialTime(time);
    setBlockDialogOpen(true);
  };

  const openEditBlockDialog = (appointment: AppointmentRow) => {
    setEditingBlockAppointment(appointment);
    setEditBlockDialogOpen(true);
  };

  const updateBlockOrPersonal = async (id: string, data: {
    appointment_type: AppointmentType;
    block_reason: string;
    duration_minutes: number;
  }) => {
    await updateAppointment(id, {
      appointment_type: data.appointment_type,
      block_reason: data.block_reason,
      duration_minutes: data.duration_minutes,
    }, false); // Don't send notification
  };

  const handleAppointmentClick = (appt: AppointmentRow) => {
    const apptType = appt.appointment_type as AppointmentType;
    if (apptType === "blocked" || apptType === "personal") {
      openEditBlockDialog(appt);
    } else {
      startEditing(appt.id);
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
    const parsedDate = appt.date_time ? parseISO(appt.date_time) : null;
    setEditForm({
      patientId: appt.patient_id,
      date: parsedDate ? format(parsedDate, "yyyy-MM-dd") : "",
      time: parsedDate ? format(parsedDate, "HH:mm") : "",
      mode: appt.mode ?? "presencial",
      status: appt.status ?? "scheduled",
      service: appt.service ?? "individual",
      notes: appt.notes ?? "",
      isRecurring: false,
      repeatFrequency: "none",
      repeatCount: 1,
      paymentType: "single",
      sessionValue: "0,00",
    });
    if (parsedDate) {
      updateSelectedDate(parsedDate);
    }
    setEditDialogOpen(true);
  };

  const saveEdit = async () => {
    if (!editingId || !editForm.patientId || !editForm.date || !editForm.time) return;

    setEditFormError(null);
    setIsSaving(true);
    const dateTimeString = `${editForm.date}T${editForm.time}`;
    const parsedDate = parseISO(dateTimeString);

    // Validate the new date/time
    const validation = validateDateTime(parsedDate, editingId);
    if (!validation.isValid) {
      setEditFormError(validation.error || "Horário inválido");
      setIsSaving(false);
      toast({
        title: "Horário indisponível",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    await updateAppointment(editingId, {
      patient_id: editForm.patientId,
      date_time: parsedDate.toISOString(),
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

    // Check if the target day is a work day
    const dayOfWeek = getDay(targetDay);
    if (!WORKING_HOURS.workDays.includes(dayOfWeek)) {
      toast({
        title: "Dia não disponível",
        description: "Atendimentos apenas de segunda a sexta-feira",
        variant: "destructive",
      });
      setDraggedAppointment(null);
      setDragOverDay(null);
      return;
    }

    // Get the original time from the appointment
    const originalDate = parseISO(appointment.date_time);
    const hours = originalDate.getHours();
    const minutes = originalDate.getMinutes();

    // Set the new date with the original time
    let newDateTime = startOfDay(targetDay);
    newDateTime = setHours(newDateTime, hours);
    newDateTime = setMinutes(newDateTime, minutes);

    // Validate the new date/time
    const validation = validateDateTime(newDateTime, appointmentId);
    if (!validation.isValid) {
      toast({
        title: "Horário indisponível",
        description: validation.error,
        variant: "destructive",
      });
      setDraggedAppointment(null);
      setDragOverDay(null);
      return;
    }

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
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => openBlockDialog(selectedDate)}>
            <Lock className="h-4 w-4 mr-2" />
            Bloquear
          </Button>
          <Button variant="outline" onClick={() => {
            setBlockDialogInitialDate(selectedDate);
            setBlockDialogOpen(true);
          }}>
            <Briefcase className="h-4 w-4 mr-2" />
            Pessoal
          </Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Sessão
          </Button>
        </div>
      </div>

      {/* Search, Filters and View Toggle */}
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
            <div className="flex items-center gap-2">
              <Button 
                variant={viewMode === "calendar" ? "default" : "outline"} 
                size="sm"
                onClick={() => setViewMode("calendar")}
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Calendário
              </Button>
              <Button 
                variant={viewMode === "grid" ? "default" : "outline"} 
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                Grade Horária
              </Button>
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {viewMode === "grid" ? (
        /* Daily Time Grid View */
        <div className="space-y-6 mb-6">
          <DailyTimeGrid
            date={selectedDate}
            appointments={appointments}
            patientMap={patientMap}
            onSlotClick={(time) => {
              setForm({
                ...defaultFormState,
                date: format(selectedDate, "yyyy-MM-dd"),
                time,
              });
              setShowCreateForm(true);
            }}
            onAppointmentClick={handleAppointmentClick}
          />
          
          {/* Date navigation for grid view */}
          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" onClick={() => updateSelectedDate(addDays(selectedDate, -1))}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Dia Anterior
            </Button>
            <Button variant="outline" onClick={() => updateSelectedDate(today)}>
              Hoje
            </Button>
            <Button variant="outline" onClick={() => updateSelectedDate(addDays(selectedDate, 1))}>
              Próximo Dia
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      ) : (
        <>
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
                const dayOfWeek = getDay(day);
                const isWeekend = !WORKING_HOURS.workDays.includes(dayOfWeek);

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => updateSelectedDate(day)}
                    className={cn(
                      "relative flex items-center justify-center h-10 w-full rounded-lg text-sm transition-colors",
                      !inMonth && "text-muted-foreground/40",
                      isWeekend && inMonth && "text-muted-foreground/50 bg-muted/30",
                      inMonth && !isSelected && !isToday && !isWeekend && "hover:bg-muted",
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
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-muted-foreground">
                  <Clock className="inline h-3 w-3 mr-1" />
                  Horário de atendimento: Seg-Sex, 07:00-12:00 e 13:00-18:30
                </p>
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
                          {/* WhatsApp Action Menu */}
                          {appt.patient_id && (
                            <WhatsAppActionMenu
                              appointmentId={appt.id}
                              patientName={patientName}
                              patientPhone={patients.find(p => p.id === appt.patient_id)?.phone}
                              appointmentDateTime={appt.date_time}
                              appointmentMode={appt.mode}
                              appointmentService={appt.service}
                            />
                          )}
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
              const dayOfWeek = getDay(day);
              const isWeekend = !WORKING_HOURS.workDays.includes(dayOfWeek);
              const isDragOver = dragOverDay === key;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => updateSelectedDate(day)}
                  onDragOver={(e) => !isWeekend && handleDragOver(e, key)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => !isWeekend && handleDrop(e, day)}
                  className={cn(
                    "flex flex-col rounded-xl border-2 p-3 min-h-[140px] transition-colors",
                    isWeekend && "bg-muted/30 border-muted cursor-not-allowed",
                    !isWeekend && "hover:border-primary/60 hover:bg-primary/5",
                    isSelected && !isWeekend && "border-green-200 bg-green-50",
                    !isSelected && !isWeekend && "border-border",
                    isToday && !isSelected && !isWeekend && "border-primary/40",
                    isDragOver && !isWeekend && "border-primary border-dashed bg-primary/10"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn(
                      "text-xs",
                      isWeekend ? "text-muted-foreground/50" : "text-muted-foreground"
                    )}>{dayLabel}</span>
                    <span className={cn(
                      "text-lg font-semibold",
                      isWeekend && "text-muted-foreground/50",
                      isToday && !isWeekend && "text-primary"
                    )}>
                      {format(day, "d")}
                    </span>
                  </div>
                  
                  {isWeekend ? (
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-xs text-muted-foreground/50">Sem atendimento</span>
                    </div>
                  ) : (
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
        </>
      )}

      {/* Create Form Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
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
                <Button type="button" variant="ghost" size="sm" className="text-xs h-7" onClick={() => openNewPatientDialog("create")}>
                  + Novo paciente
                </Button>
              </div>
              <Select value={form.patientId} onValueChange={(v) => setForm({ ...form, patientId: v })}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione um paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.length === 0 && <SelectItem value="__none" disabled>Nenhum paciente cadastrado</SelectItem>}
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data e Horário */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Data <span className="text-destructive">*</span></label>
                <Input 
                  type="date" 
                  className="h-11"
                  value={form.date || ""} 
                  onChange={(e) => {
                    setForm({ ...form, date: e.target.value, time: "" });
                    setFormError(null);
                  }} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Horário <span className="text-destructive">*</span></label>
                <Select 
                  value={form.time || ""} 
                  onValueChange={(v) => {
                    setForm({ ...form, time: v });
                    setFormError(null);
                  }}
                  disabled={!form.date}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={form.date ? "Selecione o horário" : "Selecione a data primeiro"} />
                  </SelectTrigger>
                  <SelectContent>
                    {createFormTimeSlots.length === 0 ? (
                      <SelectItem value="__none" disabled>
                        {form.date ? "Sem horários neste dia" : "Selecione a data"}
                      </SelectItem>
                    ) : (
                      createFormTimeSlots.map((slot) => (
                        <SelectItem 
                          key={slot.time} 
                          value={slot.time}
                          disabled={!slot.isAvailable}
                          className={cn(
                            !slot.isAvailable && "text-muted-foreground line-through"
                          )}
                        >
                          {slot.time} {!slot.isAvailable && "(ocupado)"}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Error message */}
            {formError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}

            {/* Modalidade e Tipo de Atendimento */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Modalidade</label>
                <Select value={form.mode ?? "presencial"} onValueChange={(value) => setForm({ ...form, mode: value })}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Atendimento</label>
                <Select value={form.service ?? "individual"} onValueChange={(value) => setForm({ ...form, service: value })}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="casal">Casal</SelectItem>
                    <SelectItem value="familia">Família</SelectItem>
                    <SelectItem value="grupo">Grupo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Agendamento Recorrente */}
            <div className="flex items-center space-x-3">
              <Checkbox 
                id="recurring"
                checked={form.isRecurring ?? false}
                onCheckedChange={(checked) => setForm({ 
                  ...form, 
                  isRecurring: checked === true,
                  repeatFrequency: checked ? "weekly" : "none"
                })}
              />
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-muted-foreground" />
                <label htmlFor="recurring" className="text-sm font-medium cursor-pointer">
                  Agendamento Recorrente
                </label>
              </div>
            </div>

            {form.isRecurring && (
              <div className="grid gap-4 sm:grid-cols-2 pl-7">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Frequência</label>
                  <Select
                    value={form.repeatFrequency ?? "weekly"}
                    onValueChange={(value) => setForm({ ...form, repeatFrequency: value as RepeatFrequency })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="biweekly">Quinzenal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Repetições</label>
                  <Input
                    type="number"
                    min="1"
                    max="26"
                    className="h-11"
                    value={form.repeatCount ?? 4}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setForm({ ...form, repeatCount: Number.isNaN(value) ? 1 : value });
                    }}
                  />
                </div>
              </div>
            )}

            {/* Forma de Pagamento */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-semibold">Forma de Pagamento</span>
              </div>
              
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Valor Avulso */}
                <button
                  type="button"
                  onClick={() => setForm({ ...form, paymentType: "single" })}
                  className={cn(
                    "relative rounded-lg border-2 p-4 text-left transition-all",
                    form.paymentType === "single" 
                      ? "border-emerald-500 bg-emerald-50" 
                      : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "h-5 w-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                      form.paymentType === "single" 
                        ? "border-emerald-500" 
                        : "border-muted-foreground/40"
                    )}>
                      {form.paymentType === "single" && (
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                        <span className="font-medium text-sm">Valor Avulso</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">Definir valor individual</p>
                    </div>
                  </div>
                  
                  {form.paymentType === "single" && (
                    <div className="mt-3 pt-3 border-t border-emerald-200">
                      <Input
                        type="text"
                        placeholder="R$ 0,00"
                        className="h-10 border-emerald-300 focus:border-emerald-500"
                        value={form.sessionValue ? `R$ ${form.sessionValue}` : ""}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d,]/g, "");
                          setForm({ ...form, sessionValue: value });
                        }}
                      />
                    </div>
                  )}
                </button>

                {/* Pacote */}
                <button
                  type="button"
                  onClick={() => setForm({ ...form, paymentType: "package" })}
                  disabled={availablePackages.length === 0}
                  className={cn(
                    "relative rounded-lg border-2 p-4 text-left transition-all",
                    form.paymentType === "package" 
                      ? "border-emerald-500 bg-emerald-50" 
                      : "border-border hover:border-muted-foreground/30",
                    availablePackages.length === 0 && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "h-5 w-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                      form.paymentType === "package" 
                        ? "border-emerald-500" 
                        : "border-muted-foreground/40"
                    )}>
                      {form.paymentType === "package" && (
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">Pacote</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {availablePackages.length === 0 
                          ? "Nenhum pacote disponível" 
                          : `${availablePackages.length} pacote(s) disponível(is)`}
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Package selector */}
              {form.paymentType === "package" && availablePackages.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Selecionar Pacote</label>
                  <Select 
                    value={form.packageId || ""} 
                    onValueChange={(v) => setForm({ ...form, packageId: v })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecione um pacote" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePackages.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          <div className="flex items-center gap-2">
                            <span>{pkg.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {pkg.total_sessions - pkg.used_sessions}/{pkg.total_sessions} restantes
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={resetCreateForm}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSaving}>
                {isSaving ? "Salvando..." : "Agendar"}
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
                <label className="text-sm font-medium">Data</label>
                <Input
                  type="date"
                  className="h-11"
                  value={editForm.date || ""}
                  onChange={(e) => {
                    setEditForm({ ...editForm, date: e.target.value, time: "" });
                    setEditFormError(null);
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Horário</label>
                <Select 
                  value={editForm.time || ""} 
                  onValueChange={(v) => {
                    setEditForm({ ...editForm, time: v });
                    setEditFormError(null);
                  }}
                  disabled={!editForm.date}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={editForm.date ? "Selecione o horário" : "Selecione a data primeiro"} />
                  </SelectTrigger>
                  <SelectContent>
                    {editFormTimeSlots.length === 0 ? (
                      <SelectItem value="__none" disabled>
                        {editForm.date ? "Sem horários neste dia" : "Selecione a data"}
                      </SelectItem>
                    ) : (
                      editFormTimeSlots.map((slot) => (
                        <SelectItem 
                          key={slot.time} 
                          value={slot.time}
                          disabled={!slot.isAvailable}
                          className={cn(
                            !slot.isAvailable && "text-muted-foreground line-through"
                          )}
                        >
                          {slot.time} {!slot.isAvailable && "(ocupado)"}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Error message */}
            {editFormError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {editFormError}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Modalidade</label>
                <Select
                  value={editForm.mode ?? "presencial"}
                  onValueChange={(value) => setEditForm({ ...editForm, mode: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Atendimento</label>
                <Select
                  value={editForm.service ?? "individual"}
                  onValueChange={(value) => setEditForm({ ...editForm, service: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="casal">Casal</SelectItem>
                    <SelectItem value="familia">Família</SelectItem>
                    <SelectItem value="grupo">Grupo</SelectItem>
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

      {/* Block Time Dialog */}
      <BlockTimeDialog
        open={blockDialogOpen}
        onClose={() => {
          setBlockDialogOpen(false);
          setBlockDialogInitialDate(undefined);
          setBlockDialogInitialTime(undefined);
        }}
        onSave={createBlockOrPersonal}
        initialDate={blockDialogInitialDate}
        initialTime={blockDialogInitialTime}
        appointments={appointments}
      />

      {/* Edit Block Dialog */}
      <EditBlockDialog
        open={editBlockDialogOpen}
        onClose={() => {
          setEditBlockDialogOpen(false);
          setEditingBlockAppointment(null);
        }}
        onSave={updateBlockOrPersonal}
        onDelete={deleteAppointment}
        appointment={editingBlockAppointment}
      />
    </AdminLayout>
  );
};

export default Appointments;
