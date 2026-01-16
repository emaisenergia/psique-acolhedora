import { useMemo } from "react";
import { useAdminPreferences } from "./useAdminPreferences";

export interface ScheduleConfig {
  morning: { start: number; end: number };
  afternoon: { start: number; end: number };
  workDays: number[];
  sessionDuration: number;
  interval: number;
  workStartTime: string;
  workEndTime: string;
  breakStartTime: string;
  breakEndTime: string;
}

// Map day names to numbers (0 = Sunday, 1 = Monday, etc.)
const dayNameToNumber: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

// Default schedule config (used when preferences are loading)
export const DEFAULT_SCHEDULE_CONFIG: ScheduleConfig = {
  morning: { start: 7, end: 12 },
  afternoon: { start: 13, end: 19 },
  workDays: [1, 2, 3, 4, 5],
  sessionDuration: 50,
  interval: 10,
  workStartTime: "07:00",
  workEndTime: "19:00",
  breakStartTime: "12:00",
  breakEndTime: "13:00",
};

export const useScheduleConfig = () => {
  const { preferences, loading } = useAdminPreferences();

  const scheduleConfig = useMemo<ScheduleConfig>(() => {
    if (loading) {
      return DEFAULT_SCHEDULE_CONFIG;
    }

    const parseTime = (time: string): number => {
      const [hours] = time.split(":").map(Number);
      return hours;
    };

    const workStartHour = parseTime(preferences.work_start_time || "07:00");
    const workEndHour = parseTime(preferences.work_end_time || "19:00");
    const breakStartHour = parseTime(preferences.break_start_time || "12:00");
    const breakEndHour = parseTime(preferences.break_end_time || "13:00");

    return {
      morning: { start: workStartHour, end: breakStartHour },
      afternoon: { start: breakEndHour, end: workEndHour },
      workDays: (preferences.available_days || ["monday", "tuesday", "wednesday", "thursday", "friday"])
        .map((day) => dayNameToNumber[day.toLowerCase()] ?? 1)
        .sort((a, b) => a - b),
      sessionDuration: preferences.default_session_duration || 50,
      interval: preferences.session_interval || 10,
      workStartTime: preferences.work_start_time || "07:00",
      workEndTime: preferences.work_end_time || "19:00",
      breakStartTime: preferences.break_start_time || "12:00",
      breakEndTime: preferences.break_end_time || "13:00",
    };
  }, [preferences, loading]);

  // Generate time slots based on current config
  const generateTimeSlots = useMemo(() => {
    const slots: string[] = [];
    const config = scheduleConfig;

    // Morning slots
    for (let hour = config.morning.start; hour < config.morning.end; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
      if (hour < config.morning.end - 1 || (hour === config.morning.end - 1 && true)) {
        slots.push(`${hour.toString().padStart(2, "0")}:30`);
      }
    }

    // Afternoon slots (up to 30 min before end)
    for (let hour = config.afternoon.start; hour < config.afternoon.end; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
      if (hour < config.afternoon.end - 1) {
        slots.push(`${hour.toString().padStart(2, "0")}:30`);
      }
    }

    return slots;
  }, [scheduleConfig]);

  // Check if a time is within working hours
  const isWithinWorkingHours = (hours: number, minutes: number): boolean => {
    const config = scheduleConfig;
    const timeValue = hours * 60 + minutes;

    const morningStart = config.morning.start * 60;
    const morningEnd = (config.morning.end - 1) * 60 + 30; // Last slot at end-1:30
    const afternoonStart = config.afternoon.start * 60;
    const afternoonEnd = (config.afternoon.end - 1) * 60 + 30; // Last slot at end-1:30

    const isMorning = timeValue >= morningStart && timeValue <= morningEnd;
    const isAfternoon = timeValue >= afternoonStart && timeValue <= afternoonEnd;

    return isMorning || isAfternoon;
  };

  // Check if a day is a work day
  const isWorkDay = (dayOfWeek: number): boolean => {
    return scheduleConfig.workDays.includes(dayOfWeek);
  };

  // Check if time is during break
  const isBreakTime = (hours: number): boolean => {
    const config = scheduleConfig;
    const breakStartHour = parseInt(config.breakStartTime.split(":")[0], 10);
    return hours === breakStartHour;
  };

  return {
    scheduleConfig,
    loading,
    generateTimeSlots,
    isWithinWorkingHours,
    isWorkDay,
    isBreakTime,
  };
};
