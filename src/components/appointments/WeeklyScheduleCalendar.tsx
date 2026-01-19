import { useMemo } from "react";
import { format, addDays, startOfWeek, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Building2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useClinicScheduleConfig, DAYS_OF_WEEK, type DayOfWeek } from "@/hooks/useClinicScheduleConfig";
import { useClinics, type Clinic } from "@/hooks/useClinics";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 07:00 to 20:00

const DAY_INDEX_TO_VALUE: Record<number, DayOfWeek> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

interface WeeklyScheduleCalendarProps {
  selectedDate?: Date;
}

export function WeeklyScheduleCalendar({ selectedDate = new Date() }: WeeklyScheduleCalendarProps) {
  const { clinics } = useClinics();
  const { getAllSchedules } = useClinicScheduleConfig();

  const activeClinics = useMemo(() => 
    clinics.filter(c => c.status === 'active') as (Clinic & { color?: string })[],
    [clinics]
  );

  const weekStart = useMemo(() => 
    startOfWeek(selectedDate, { weekStartsOn: 0 }),
    [selectedDate]
  );

  const weekDays = useMemo(() => 
    Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  // Get schedules for all clinics
  const clinicSchedules = useMemo(() => {
    const result: Record<string, ReturnType<typeof getAllSchedules>> = {};
    
    // Global schedule
    result['global'] = getAllSchedules(null);
    
    // Per-clinic schedules
    activeClinics.forEach(clinic => {
      result[clinic.id] = getAllSchedules(clinic.id);
    });
    
    return result;
  }, [getAllSchedules, activeClinics]);

  const parseTimeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const isWithinWorkHours = (
    hour: number, 
    dayIndex: number, 
    clinicId: string | null
  ): { isWorking: boolean; isBreak: boolean; breakLabel?: string } => {
    const dayOfWeek = DAY_INDEX_TO_VALUE[dayIndex];
    const scheduleKey = clinicId || 'global';
    const schedules = clinicSchedules[scheduleKey];
    
    if (!schedules) return { isWorking: false, isBreak: false };
    
    const daySchedule = schedules.find(s => s.dayOfWeek === dayOfWeek);
    if (!daySchedule || !daySchedule.isActive) return { isWorking: false, isBreak: false };

    const currentMinutes = hour * 60;
    const workStart = parseTimeToMinutes(daySchedule.workStartTime);
    const workEnd = parseTimeToMinutes(daySchedule.workEndTime);

    if (currentMinutes < workStart || currentMinutes >= workEnd) {
      return { isWorking: false, isBreak: false };
    }

    // Check breaks
    for (const breakItem of daySchedule.breaks) {
      const breakStart = parseTimeToMinutes(breakItem.startTime);
      const breakEnd = parseTimeToMinutes(breakItem.endTime);
      if (currentMinutes >= breakStart && currentMinutes < breakEnd) {
        return { isWorking: true, isBreak: true, breakLabel: breakItem.label };
      }
    }

    return { isWorking: true, isBreak: false };
  };

  const getClinicColor = (clinic: Clinic & { color?: string }, index: number): string => {
    return clinic.color || ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Calendário Semanal de Horários
        </CardTitle>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Global
          </Badge>
          {activeClinics.map((clinic, index) => (
            <Badge key={clinic.id} variant="outline" className="flex items-center gap-1">
              <span 
                className="h-2 w-2 rounded-full" 
                style={{ backgroundColor: getClinicColor(clinic, index) }}
              />
              {clinic.name}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="grid grid-cols-8 border-b">
              <div className="p-2 text-center text-sm font-medium text-muted-foreground">
                Horário
              </div>
              {weekDays.map((day, index) => (
                <div 
                  key={index}
                  className="p-2 text-center border-l"
                >
                  <div className="text-sm font-medium">
                    {DAYS_OF_WEEK[DAY_INDEX_TO_VALUE[getDay(day)] === 'sunday' ? 6 : 
                      Object.values(DAY_INDEX_TO_VALUE).indexOf(DAY_INDEX_TO_VALUE[getDay(day)]) - 1]?.shortLabel || 
                      format(day, 'EEE', { locale: ptBR })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(day, 'dd/MM')}
                  </div>
                </div>
              ))}
            </div>

            {/* Time Grid */}
            {HOURS.map((hour) => (
              <div key={hour} className="grid grid-cols-8 border-b last:border-b-0">
                <div className="p-2 text-center text-sm text-muted-foreground border-r">
                  {String(hour).padStart(2, '0')}:00
                </div>
                {weekDays.map((day, dayIndex) => {
                  const dayOfWeekIndex = getDay(day);
                  
                  // Check global schedule
                  const globalStatus = isWithinWorkHours(hour, dayOfWeekIndex, null);
                  
                  // Check each clinic's schedule
                  const clinicStatuses = activeClinics.map((clinic, idx) => ({
                    clinic,
                    color: getClinicColor(clinic, idx),
                    ...isWithinWorkHours(hour, dayOfWeekIndex, clinic.id),
                  }));

                  const hasAnyWork = globalStatus.isWorking || clinicStatuses.some(c => c.isWorking);

                  return (
                    <div 
                      key={dayIndex}
                      className={cn(
                        "p-1 min-h-[40px] border-l relative",
                        !hasAnyWork && "bg-muted/30"
                      )}
                    >
                      <div className="flex flex-wrap gap-0.5">
                        {/* Global indicator */}
                        {globalStatus.isWorking && (
                          <div 
                            className={cn(
                              "h-6 w-full rounded-sm flex items-center justify-center",
                              globalStatus.isBreak 
                                ? "bg-primary/20 border border-dashed border-primary/40" 
                                : "bg-primary/10"
                            )}
                            title={globalStatus.isBreak ? `Global: ${globalStatus.breakLabel}` : "Global: Expediente"}
                          >
                            {globalStatus.isBreak && (
                              <span className="text-[10px] text-primary/60 truncate px-1">
                                {globalStatus.breakLabel}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Clinic indicators */}
                        {clinicStatuses.filter(c => c.isWorking).map((clinicStatus, idx) => (
                          <div 
                            key={clinicStatus.clinic.id}
                            className={cn(
                              "h-6 flex-1 min-w-[20px] rounded-sm flex items-center justify-center",
                              clinicStatus.isBreak 
                                ? "border border-dashed" 
                                : ""
                            )}
                            style={{ 
                              backgroundColor: clinicStatus.isBreak 
                                ? `${clinicStatus.color}20`
                                : `${clinicStatus.color}30`,
                              borderColor: clinicStatus.isBreak ? `${clinicStatus.color}60` : undefined,
                            }}
                            title={
                              clinicStatus.isBreak 
                                ? `${clinicStatus.clinic.name}: ${clinicStatus.breakLabel}` 
                                : `${clinicStatus.clinic.name}: Expediente`
                            }
                          >
                            {clinicStatus.isBreak && (
                              <span 
                                className="text-[10px] truncate px-1"
                                style={{ color: `${clinicStatus.color}90` }}
                              >
                                {clinicStatus.breakLabel}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-4 w-8 rounded bg-primary/10" />
            <span>Expediente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-8 rounded border border-dashed border-primary/40 bg-primary/5" />
            <span>Intervalo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-8 rounded bg-muted/30" />
            <span>Fechado</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
