import { useCallback, useMemo, useState, DragEvent } from "react";
import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, parseISO, startOfDay, startOfMonth, startOfWeek, setHours, setMinutes, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { AppointmentRow } from "@/hooks/useAppointments";
import { WORKING_HOURS } from "@/hooks/useScheduleValidation";

export type CalendarAppointment = AppointmentRow & { date: Date };

const weekOptions = { weekStartsOn: 0 as const };

export const useAppointmentCalendar = (
  appointments: AppointmentRow[],
  validateDateTime: (date: Date, excludeId?: string) => { isValid: boolean; error?: string },
  updateAppointmentDate: (id: string, newDateTime: string) => Promise<any>,
  toast: (opts: any) => void
) => {
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [draggedAppointment, setDraggedAppointment] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);

  const today = useMemo(() => startOfDay(new Date()), []);

  const updateSelectedDate = useCallback((date: Date) => {
    setSelectedDate(startOfDay(date));
  }, []);

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth(addMonths(currentMonth, direction === "prev" ? -1 : 1));
  };

  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    return eachDayOfInterval({ start: startOfWeek(monthStart, weekOptions), end: endOfWeek(monthEnd, weekOptions) });
  }, [currentMonth]);

  // Weekly view
  const weekStart = useMemo(() => startOfWeek(selectedDate, weekOptions), [selectedDate]);
  const weekDays = useMemo(() => eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) }), [weekStart]);

  const navigateWeek = (direction: "prev" | "next" | "today") => {
    if (direction === "today") { updateSelectedDate(today); return; }
    updateSelectedDate(addDays(selectedDate, direction === "prev" ? -7 : 7));
  };

  const weekLabel = useMemo(() => `${format(weekStart, "dd/MM")} - ${format(addDays(weekStart, 6), "dd/MM")}`, [weekStart]);

  // Parsed appointments
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
    for (const [, list] of map) list.sort((a, b) => a.date.getTime() - b.date.getTime());
    return map;
  }, [parsedAppointments]);

  const selectedDayKey = format(selectedDate, "yyyy-MM-dd");
  const selectedDayAppointments = appointmentsByDay.get(selectedDayKey) ?? [];

  const selectedDateFormatted = useMemo(() => {
    const f = format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
    return f.charAt(0).toUpperCase() + f.slice(1);
  }, [selectedDate]);

  // Week stats
  const weekStats = useMemo(() => {
    let total = 0, confirmed = 0, pending = 0, done = 0;
    for (const day of weekDays) {
      const dayAppts = appointmentsByDay.get(format(day, "yyyy-MM-dd")) ?? [];
      total += dayAppts.length;
      for (const appt of dayAppts) {
        if (appt.status === "scheduled") pending++;
        else if (appt.status === "confirmed") confirmed++;
        else if (appt.status === "done") done++;
      }
    }
    return { total, confirmed, pending, done };
  }, [weekDays, appointmentsByDay]);

  // Month appointments count
  const monthAppointmentsCount = useMemo(() => {
    let count = 0;
    for (const day of monthDays) {
      if (isSameMonth(day, currentMonth)) count += (appointmentsByDay.get(format(day, "yyyy-MM-dd")) ?? []).length;
    }
    return count;
  }, [monthDays, currentMonth, appointmentsByDay]);

  // Drag and drop
  const handleDragStart = (e: DragEvent<HTMLDivElement>, appointmentId: string) => {
    setDraggedAppointment(appointmentId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", appointmentId);
  };

  const handleDragEnd = () => { setDraggedAppointment(null); setDragOverDay(null); };

  const handleDragOver = (e: DragEvent<HTMLButtonElement>, dayKey: string) => {
    e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverDay(dayKey);
  };

  const handleDragLeave = () => setDragOverDay(null);

  const handleDrop = async (e: DragEvent<HTMLButtonElement>, targetDay: Date) => {
    e.preventDefault();
    const appointmentId = e.dataTransfer.getData("text/plain");
    if (!appointmentId) return;
    const appointment = appointments.find((a) => a.id === appointmentId);
    if (!appointment || !appointment.date_time) return;

    const dayOfWeek = getDay(targetDay);
    if (!WORKING_HOURS.workDays.includes(dayOfWeek)) {
      toast({ title: "Dia não disponível", description: "Atendimentos apenas de segunda a sexta-feira", variant: "destructive" });
      setDraggedAppointment(null); setDragOverDay(null); return;
    }

    const originalDate = parseISO(appointment.date_time);
    let newDateTime = startOfDay(targetDay);
    newDateTime = setHours(newDateTime, originalDate.getHours());
    newDateTime = setMinutes(newDateTime, originalDate.getMinutes());

    const validation = validateDateTime(newDateTime, appointmentId);
    if (!validation.isValid) {
      toast({ title: "Horário indisponível", description: validation.error, variant: "destructive" });
      setDraggedAppointment(null); setDragOverDay(null); return;
    }

    await updateAppointmentDate(appointmentId, newDateTime.toISOString());
    setDraggedAppointment(null); setDragOverDay(null);
  };

  return {
    selectedDate, currentMonth, today,
    updateSelectedDate, navigateMonth, monthDays,
    weekStart, weekDays, navigateWeek, weekLabel,
    parsedAppointments, appointmentsByDay,
    selectedDayKey, selectedDayAppointments, selectedDateFormatted,
    weekStats, monthAppointmentsCount,
    draggedAppointment, dragOverDay,
    handleDragStart, handleDragEnd, handleDragOver, handleDragLeave, handleDrop,
    isSameDay, isSameMonth, format, getDay,
  };
};
