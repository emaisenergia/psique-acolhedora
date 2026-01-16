import { useMemo } from "react";
import { format, parseISO, isSameDay, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, User, Coffee, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useScheduleConfig } from "@/hooks/useScheduleConfig";
import type { AppointmentRow } from "@/hooks/useAppointments";

type TimeSlot = {
  time: string;
  status: "free" | "occupied" | "lunch" | "outside";
  appointment?: AppointmentRow;
  patientName?: string;
};

type DailyTimeGridProps = {
  date: Date;
  appointments: AppointmentRow[];
  patientMap: Record<string, string>;
  onSlotClick?: (time: string) => void;
  onAppointmentClick?: (appointment: AppointmentRow) => void;
  isPatientView?: boolean;
  currentPatientId?: string;
};

export const DailyTimeGrid = ({
  date,
  appointments,
  patientMap,
  onSlotClick,
  onAppointmentClick,
  isPatientView = false,
  currentPatientId,
}: DailyTimeGridProps) => {
  const { scheduleConfig, isBreakTime, isWithinWorkingHours, isWorkDay: checkIsWorkDay } = useScheduleConfig();
  
  const dayOfWeek = getDay(date);
  const isWorkDay = checkIsWorkDay(dayOfWeek);

  // Generate all slots dynamically based on config
  const allDaySlots = useMemo(() => {
    const slots: string[] = [];
    const startHour = scheduleConfig.morning.start;
    const endHour = scheduleConfig.afternoon.end;
    
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
      if (hour < endHour - 1) {
        slots.push(`${hour.toString().padStart(2, "0")}:30`);
      }
    }
    return slots;
  }, [scheduleConfig]);

  const timeSlots: TimeSlot[] = useMemo(() => {
    const dayAppointments = appointments.filter((appt) => {
      if (!appt.date_time) return false;
      const apptDate = parseISO(appt.date_time);
      return isSameDay(apptDate, date) && appt.status !== "cancelled";
    });

    return allDaySlots.map((time) => {
      const [hours, minutes] = time.split(":").map(Number);
      
      // Check if there's an appointment at this time
      const appointment = dayAppointments.find((appt) => {
        const apptTime = format(parseISO(appt.date_time!), "HH:mm");
        return apptTime === time;
      });

      if (!isWorkDay) {
        return { time, status: "outside" as const };
      }

      if (isBreakTime(hours)) {
        return { time, status: "lunch" as const };
      }

      if (!isWithinWorkingHours(hours, minutes)) {
        return { time, status: "outside" as const };
      }

      if (appointment) {
        return {
          time,
          status: "occupied" as const,
          appointment,
          patientName: patientMap[appointment.patient_id] || "Paciente",
        };
      }

      return { time, status: "free" as const };
    });
  }, [date, appointments, patientMap, isWorkDay, allDaySlots, isBreakTime, isWithinWorkingHours]);

  const stats = useMemo(() => {
    const free = timeSlots.filter((s) => s.status === "free").length;
    const occupied = timeSlots.filter((s) => s.status === "occupied").length;
    return { free, occupied };
  }, [timeSlots]);

  const formattedDate = format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {capitalizedDate}
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              {stats.free} livres
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {stats.occupied} ocupados
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {!isWorkDay ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Coffee className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-1">
              Sem expediente
            </h3>
            <p className="text-sm text-muted-foreground">
              Este dia não tem atendimento agendado.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {timeSlots.map((slot) => {
              const isOwn = slot.appointment?.patient_id === currentPatientId;
              const showDetails = !isPatientView || isOwn;

              return (
                <button
                  key={slot.time}
                  type="button"
                  onClick={() => {
                    if (slot.status === "free" && onSlotClick) {
                      onSlotClick(slot.time);
                    } else if (slot.appointment && showDetails && onAppointmentClick) {
                      onAppointmentClick(slot.appointment);
                    }
                  }}
                  disabled={slot.status === "lunch" || slot.status === "outside"}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all min-h-[80px]",
                    slot.status === "free" && "border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 cursor-pointer",
                    slot.status === "occupied" && showDetails && "border-blue-200 bg-blue-50 hover:bg-blue-100 cursor-pointer",
                    slot.status === "occupied" && !showDetails && "border-gray-200 bg-gray-100 cursor-not-allowed",
                    slot.status === "lunch" && "border-amber-200 bg-amber-50 cursor-not-allowed",
                    slot.status === "outside" && "border-gray-100 bg-gray-50 cursor-not-allowed opacity-50"
                  )}
                >
                  <span className={cn(
                    "text-sm font-semibold",
                    slot.status === "free" && "text-emerald-700",
                    slot.status === "occupied" && showDetails && "text-blue-700",
                    slot.status === "occupied" && !showDetails && "text-gray-500",
                    slot.status === "lunch" && "text-amber-700",
                    slot.status === "outside" && "text-gray-400"
                  )}>
                    {slot.time}
                  </span>

                  {slot.status === "free" && (
                    <span className="text-xs text-emerald-600 mt-1">Livre</span>
                  )}

                  {slot.status === "occupied" && showDetails && (
                    <div className="flex items-center gap-1 mt-1">
                      <User className="h-3 w-3 text-blue-600" />
                      <span className="text-xs text-blue-600 truncate max-w-[80px]">
                        {slot.patientName?.split(" ")[0]}
                      </span>
                    </div>
                  )}

                  {slot.status === "occupied" && !showDetails && (
                    <div className="flex items-center gap-1 mt-1">
                      <Lock className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">Ocupado</span>
                    </div>
                  )}

                  {slot.status === "lunch" && (
                    <div className="flex items-center gap-1 mt-1">
                      <Coffee className="h-3 w-3 text-amber-600" />
                      <span className="text-xs text-amber-600">Almoço</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-emerald-100 border border-emerald-300" />
            <span>Livre</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-blue-100 border border-blue-300" />
            <span>Ocupado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-amber-100 border border-amber-300" />
            <span>Almoço</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-gray-100 border border-gray-200" />
            <span>Fora do expediente</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
