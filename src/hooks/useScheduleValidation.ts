import { useMemo, useCallback } from "react";
import { parseISO, format, getDay, getHours, getMinutes, isSameDay, addMinutes } from "date-fns";
import type { AppointmentRow } from "@/hooks/useAppointments";
import { useScheduleConfig, DEFAULT_SCHEDULE_CONFIG, type ScheduleConfig } from "./useScheduleConfig";

// Export for backward compatibility - but components should use useScheduleConfig
export const WORKING_HOURS = {
  morning: DEFAULT_SCHEDULE_CONFIG.morning,
  afternoon: DEFAULT_SCHEDULE_CONFIG.afternoon,
  lastSessionStart: { hour: 18, minute: 30 },
  workDays: DEFAULT_SCHEDULE_CONFIG.workDays,
  sessionDuration: DEFAULT_SCHEDULE_CONFIG.sessionDuration,
};

// Generate time slots based on a schedule config
export const generateTimeSlotsFromConfig = (config: ScheduleConfig): string[] => {
  const slots: string[] = [];
  
  // Morning slots
  for (let hour = config.morning.start; hour < config.morning.end; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`);
    if (hour < config.morning.end - 1) {
      slots.push(`${hour.toString().padStart(2, "0")}:30`);
    }
  }
  
  // Afternoon slots (up to 30 min before end for 50min sessions)
  for (let hour = config.afternoon.start; hour < config.afternoon.end; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`);
    if (hour < config.afternoon.end - 1) {
      slots.push(`${hour.toString().padStart(2, "0")}:30`);
    }
  }
  
  return slots;
};

// Default time slots for backward compatibility
export const generateTimeSlots = (): string[] => {
  return generateTimeSlotsFromConfig(DEFAULT_SCHEDULE_CONFIG);
};

export const ALL_TIME_SLOTS = generateTimeSlots();

export type ValidationResult = {
  isValid: boolean;
  error?: string;
};

export type TimeSlotStatus = {
  time: string;
  isAvailable: boolean;
  isWorkingHour: boolean;
  conflictingAppointment?: AppointmentRow;
};

export const useScheduleValidation = (appointments: AppointmentRow[]) => {
  // Parse appointments with dates
  const parsedAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.date_time && a.status !== "cancelled")
      .map((a) => ({
        ...a,
        date: parseISO(a.date_time!),
      }));
  }, [appointments]);

  // Check if a time is within working hours
  const isWithinWorkingHours = useCallback((date: Date): boolean => {
    const dayOfWeek = getDay(date);
    const hours = getHours(date);
    const minutes = getMinutes(date);
    const timeValue = hours * 60 + minutes; // Convert to minutes for easier comparison

    // Check if it's a work day (Monday-Friday)
    if (!WORKING_HOURS.workDays.includes(dayOfWeek)) {
      return false;
    }

    // Morning: 07:00 (420 min) to 11:30 (690 min) - last session at 11:30
    const morningStart = WORKING_HOURS.morning.start * 60; // 420
    const morningLastSession = (WORKING_HOURS.morning.end - 1) * 60 + 30; // 11:30 = 690
    
    // Afternoon: 13:00 (780 min) to 18:30 (1110 min) - last session at 18:30
    const afternoonStart = WORKING_HOURS.afternoon.start * 60; // 780
    const afternoonLastSession = WORKING_HOURS.lastSessionStart.hour * 60 + WORKING_HOURS.lastSessionStart.minute; // 18:30 = 1110

    const isMorning = timeValue >= morningStart && timeValue <= morningLastSession;
    const isAfternoon = timeValue >= afternoonStart && timeValue <= afternoonLastSession;

    return isMorning || isAfternoon;
  }, []);

  // Check if there's a conflict with existing appointments
  const hasTimeConflict = useCallback((date: Date, excludeAppointmentId?: string): AppointmentRow | undefined => {
    const sessionDuration = WORKING_HOURS.sessionDuration;
    const newStart = date.getTime();
    const newEnd = addMinutes(date, sessionDuration).getTime();

    for (const appt of parsedAppointments) {
      // Skip the appointment we're editing
      if (excludeAppointmentId && appt.id === excludeAppointmentId) continue;
      
      const existingStart = appt.date.getTime();
      const existingEnd = addMinutes(appt.date, appt.duration_minutes || sessionDuration).getTime();

      // Check for overlap
      if (newStart < existingEnd && newEnd > existingStart) {
        return appt;
      }
    }

    return undefined;
  }, [parsedAppointments]);

  // Get validation result for a specific date/time
  const validateDateTime = useCallback((date: Date, excludeAppointmentId?: string): ValidationResult => {
    // Check working hours
    if (!isWithinWorkingHours(date)) {
      const dayOfWeek = getDay(date);
      if (!WORKING_HOURS.workDays.includes(dayOfWeek)) {
        return {
          isValid: false,
          error: "Atendimentos apenas de segunda a sexta-feira",
        };
      }
      return {
        isValid: false,
        error: "Horário fora do expediente. Manhã: 07:00-12:00, Tarde: 13:00-18:30",
      };
    }

    // Check conflicts
    const conflict = hasTimeConflict(date, excludeAppointmentId);
    if (conflict) {
      return {
        isValid: false,
        error: "Já existe uma sessão agendada neste horário",
      };
    }

    return { isValid: true };
  }, [isWithinWorkingHours, hasTimeConflict]);

  // Get time slots with availability status for a specific date
  const getTimeSlotsForDate = useCallback((date: Date, excludeAppointmentId?: string): TimeSlotStatus[] => {
    const dayOfWeek = getDay(date);
    const isWorkDay = WORKING_HOURS.workDays.includes(dayOfWeek);

    return ALL_TIME_SLOTS.map((time) => {
      const [hours, minutes] = time.split(":").map(Number);
      const slotDate = new Date(date);
      slotDate.setHours(hours, minutes, 0, 0);

      const isWorkingHour = isWorkDay && isWithinWorkingHours(slotDate);
      const conflictingAppointment = isWorkingHour ? hasTimeConflict(slotDate, excludeAppointmentId) : undefined;
      
      return {
        time,
        isAvailable: isWorkingHour && !conflictingAppointment,
        isWorkingHour,
        conflictingAppointment,
      };
    });
  }, [isWithinWorkingHours, hasTimeConflict]);

  // Get occupied slots for a specific date (for calendar display)
  const getOccupiedSlotsForDate = useCallback((date: Date): { time: string; patientId: string }[] => {
    return parsedAppointments
      .filter((appt) => isSameDay(appt.date, date))
      .map((appt) => ({
        time: format(appt.date, "HH:mm"),
        patientId: appt.patient_id,
      }));
  }, [parsedAppointments]);

  // Check if a day has any available slots
  const hasAvailableSlots = useCallback((date: Date): boolean => {
    const dayOfWeek = getDay(date);
    if (!WORKING_HOURS.workDays.includes(dayOfWeek)) {
      return false;
    }

    const slots = getTimeSlotsForDate(date);
    return slots.some((slot) => slot.isAvailable);
  }, [getTimeSlotsForDate]);

  // Get the count of appointments for a day
  const getAppointmentCountForDate = useCallback((date: Date): number => {
    return parsedAppointments.filter((appt) => isSameDay(appt.date, date)).length;
  }, [parsedAppointments]);

  return {
    validateDateTime,
    isWithinWorkingHours,
    hasTimeConflict,
    getTimeSlotsForDate,
    getOccupiedSlotsForDate,
    hasAvailableSlots,
    getAppointmentCountForDate,
    ALL_TIME_SLOTS,
    WORKING_HOURS,
  };
};
