import { useState, useEffect, useMemo } from "react";
import { Settings, RotateCcw, Copy, Plus, Trash2, Clock, Calendar, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useClinicScheduleConfig, DAYS_OF_WEEK, type DaySchedule, type DayOfWeek } from "@/hooks/useClinicScheduleConfig";
import { useClinics, type Clinic } from "@/hooks/useClinics";
import { useAdminPreferences } from "@/hooks/useAdminPreferences";
import { toast } from "sonner";

interface AdvancedScheduleConfigEditorProps {
  trigger?: React.ReactNode;
}

type BreakItem = {
  id?: string;
  startTime: string;
  endTime: string;
  label: string;
};

export function AdvancedScheduleConfigEditor({ trigger }: AdvancedScheduleConfigEditorProps) {
  const { clinics, isLoading: clinicsLoading } = useClinics();
  const { preferences, savePreferences } = useAdminPreferences();
  
  const [open, setOpen] = useState(false);
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>("monday");
  const [localSchedules, setLocalSchedules] = useState<Record<DayOfWeek, DaySchedule>>({} as Record<DayOfWeek, DaySchedule>);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copyTargetDays, setCopyTargetDays] = useState<DayOfWeek[]>([]);
  const [sessionDuration, setSessionDuration] = useState(50);
  const [sessionInterval, setSessionInterval] = useState(10);

  const { 
    isLoading: configLoading, 
    isSaving,
    getAllSchedules,
    saveAllSchedules,
  } = useClinicScheduleConfig(selectedClinicId);

  const activeClinics = useMemo(() => 
    clinics.filter(c => c.status === 'active'),
    [clinics]
  );

  // Initialize local schedules when dialog opens or clinic changes
  useEffect(() => {
    if (open && !configLoading) {
      const schedules = getAllSchedules(selectedClinicId);
      const schedulesMap: Record<DayOfWeek, DaySchedule> = {} as Record<DayOfWeek, DaySchedule>;
      schedules.forEach(s => {
        schedulesMap[s.dayOfWeek] = s;
      });
      setLocalSchedules(schedulesMap);
      setSessionDuration(preferences.default_session_duration || 50);
      setSessionInterval(preferences.session_interval || 10);
    }
  }, [open, configLoading, selectedClinicId, getAllSchedules, preferences]);

  const currentDaySchedule = localSchedules[selectedDay];

  const updateDaySchedule = (updates: Partial<DaySchedule>) => {
    setLocalSchedules(prev => ({
      ...prev,
      [selectedDay]: {
        ...prev[selectedDay],
        ...updates,
      },
    }));
  };

  const addBreak = () => {
    const newBreak: BreakItem = {
      startTime: "16:00",
      endTime: "16:30",
      label: "Pausa",
    };
    updateDaySchedule({
      breaks: [...(currentDaySchedule?.breaks || []), newBreak],
    });
  };

  const removeBreak = (index: number) => {
    const newBreaks = [...(currentDaySchedule?.breaks || [])];
    newBreaks.splice(index, 1);
    updateDaySchedule({ breaks: newBreaks });
  };

  const updateBreak = (index: number, updates: Partial<BreakItem>) => {
    const newBreaks = [...(currentDaySchedule?.breaks || [])];
    newBreaks[index] = { ...newBreaks[index], ...updates };
    updateDaySchedule({ breaks: newBreaks });
  };

  const handleCopyToOtherDays = () => {
    if (copyTargetDays.length === 0) {
      toast.error("Selecione pelo menos um dia");
      return;
    }

    const sourceSchedule = localSchedules[selectedDay];
    const updatedSchedules = { ...localSchedules };
    
    copyTargetDays.forEach(day => {
      updatedSchedules[day] = {
        ...sourceSchedule,
        dayOfWeek: day,
      };
    });

    setLocalSchedules(updatedSchedules);
    setCopyDialogOpen(false);
    setCopyTargetDays([]);
    toast.success(`Configuração copiada para ${copyTargetDays.length} dia(s)`);
  };

  const handleResetDay = () => {
    updateDaySchedule({
      workStartTime: "08:00",
      workEndTime: "18:00",
      isActive: true,
      breaks: [{ startTime: "12:00", endTime: "13:00", label: "Almoço" }],
    });
  };

  const validateSchedules = (): boolean => {
    for (const day of DAYS_OF_WEEK) {
      const schedule = localSchedules[day.value];
      if (!schedule) continue;

      if (schedule.isActive) {
        if (schedule.workStartTime >= schedule.workEndTime) {
          toast.error(`${day.label}: Horário de início deve ser anterior ao término`);
          return false;
        }

        for (const breakItem of schedule.breaks) {
          if (breakItem.startTime >= breakItem.endTime) {
            toast.error(`${day.label}: Intervalo "${breakItem.label}" tem horário inválido`);
            return false;
          }
          if (breakItem.startTime < schedule.workStartTime || breakItem.endTime > schedule.workEndTime) {
            toast.error(`${day.label}: Intervalo "${breakItem.label}" deve estar dentro do expediente`);
            return false;
          }
        }
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateSchedules()) return;

    const schedules = Object.values(localSchedules);
    const success = await saveAllSchedules(schedules, selectedClinicId);

    if (success) {
      // Also save session settings to admin preferences
      await savePreferences({
        default_session_duration: sessionDuration,
        session_interval: sessionInterval,
      });
      setOpen(false);
    }
  };

  const getClinicLabel = (clinicId: string | null) => {
    if (!clinicId) return "Configuração Global";
    const clinic = clinics.find(c => c.id === clinicId);
    return clinic?.name || "Clínica";
  };

  const getActiveDaysCount = () => {
    return Object.values(localSchedules).filter(s => s?.isActive).length;
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Settings className="h-4 w-4 mr-2" />
      Configurar Horários
    </Button>
  );

  if (configLoading || clinicsLoading) {
    return trigger || defaultTrigger;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurar Horários de Trabalho
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Clinic Selector */}
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <Select
                value={selectedClinicId || "global"}
                onValueChange={(v) => setSelectedClinicId(v === "global" ? null : v)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione a clínica" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      Configuração Global
                    </span>
                  </SelectItem>
                  {activeClinics.map((clinic) => (
                    <SelectItem key={clinic.id} value={clinic.id}>
                      <span className="flex items-center gap-2">
                        <span 
                          className="h-2 w-2 rounded-full" 
                          style={{ backgroundColor: (clinic as Clinic & { color?: string }).color || '#3b82f6' }}
                        />
                        {clinic.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge variant="outline" className="whitespace-nowrap">
                {getActiveDaysCount()} dias ativos
              </Badge>
            </div>

            <Separator />

            {/* Day Tabs */}
            <Tabs value={selectedDay} onValueChange={(v) => setSelectedDay(v as DayOfWeek)}>
              <TabsList className="grid grid-cols-7 w-full h-auto">
                {DAYS_OF_WEEK.map((day) => {
                  const schedule = localSchedules[day.value];
                  const isActive = schedule?.isActive ?? true;
                  return (
                    <TabsTrigger
                      key={day.value}
                      value={day.value}
                      className={`text-xs px-1 py-2 ${!isActive ? 'opacity-50' : ''}`}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span>{day.shortLabel}</span>
                        {isActive && (
                          <span className="h-1 w-1 rounded-full bg-emerald-500" />
                        )}
                      </div>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <ScrollArea className="h-[350px] mt-4">
                {DAYS_OF_WEEK.map((day) => (
                  <TabsContent key={day.value} value={day.value} className="space-y-4 mt-0">
                    {currentDaySchedule && (
                      <>
                        {/* Day Active Toggle */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <Label className="text-sm font-medium">{day.label}</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`active-${day.value}`} className="text-sm text-muted-foreground">
                              Dia ativo
                            </Label>
                            <Switch
                              id={`active-${day.value}`}
                              checked={currentDaySchedule.isActive}
                              onCheckedChange={(checked) => updateDaySchedule({ isActive: checked })}
                            />
                          </div>
                        </div>

                        {currentDaySchedule.isActive && (
                          <>
                            {/* Work Hours */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Expediente
                              </Label>
                              <div className="flex items-center gap-3">
                                <Input
                                  type="time"
                                  value={currentDaySchedule.workStartTime}
                                  onChange={(e) => updateDaySchedule({ workStartTime: e.target.value })}
                                  className="flex-1"
                                />
                                <span className="text-muted-foreground">até</span>
                                <Input
                                  type="time"
                                  value={currentDaySchedule.workEndTime}
                                  onChange={(e) => updateDaySchedule({ workEndTime: e.target.value })}
                                  className="flex-1"
                                />
                              </div>
                            </div>

                            {/* Breaks */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">Intervalos</Label>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={addBreak}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Adicionar
                                </Button>
                              </div>
                              
                              <div className="space-y-2">
                                {currentDaySchedule.breaks.length === 0 ? (
                                  <p className="text-sm text-muted-foreground text-center py-3 border border-dashed rounded-md">
                                    Nenhum intervalo configurado
                                  </p>
                                ) : (
                                  currentDaySchedule.breaks.map((breakItem, index) => (
                                    <div 
                                      key={index} 
                                      className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"
                                    >
                                      <Input
                                        placeholder="Nome"
                                        value={breakItem.label}
                                        onChange={(e) => updateBreak(index, { label: e.target.value })}
                                        className="w-24 h-8 text-sm"
                                      />
                                      <Input
                                        type="time"
                                        value={breakItem.startTime}
                                        onChange={(e) => updateBreak(index, { startTime: e.target.value })}
                                        className="flex-1 h-8"
                                      />
                                      <span className="text-muted-foreground text-sm">-</span>
                                      <Input
                                        type="time"
                                        value={breakItem.endTime}
                                        onChange={(e) => updateBreak(index, { endTime: e.target.value })}
                                        className="flex-1 h-8"
                                      />
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                        onClick={() => removeBreak(index)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>

                            {/* Copy to other days */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => setCopyDialogOpen(true)}
                            >
                              <Copy className="h-3 w-3 mr-2" />
                              Copiar para outros dias
                            </Button>
                          </>
                        )}
                      </>
                    )}
                  </TabsContent>
                ))}
              </ScrollArea>
            </Tabs>

            <Separator />

            {/* Session Settings (Global) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Configurações de Sessão (Global)</Label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Duração (min)</Label>
                  <Input
                    type="number"
                    min={15}
                    step={5}
                    value={sessionDuration}
                    onChange={(e) => setSessionDuration(parseInt(e.target.value) || 50)}
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Intervalo entre sessões (min)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={5}
                    value={sessionInterval}
                    onChange={(e) => setSessionInterval(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="ghost"
              onClick={handleResetDay}
              className="w-full sm:w-auto"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar Dia
            </Button>
            <div className="flex-1" />
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              {isSaving ? "Salvando..." : "Salvar Tudo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Copy Schedule Dialog */}
      <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Copiar Configuração</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Copiar a configuração de {DAYS_OF_WEEK.find(d => d.value === selectedDay)?.label} para:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DAYS_OF_WEEK.filter(d => d.value !== selectedDay).map((day) => (
                <label
                  key={day.value}
                  className="flex items-center gap-2 p-2 border rounded-md cursor-pointer hover:bg-muted/50"
                >
                  <Checkbox
                    checked={copyTargetDays.includes(day.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setCopyTargetDays([...copyTargetDays, day.value]);
                      } else {
                        setCopyTargetDays(copyTargetDays.filter(d => d !== day.value));
                      }
                    }}
                  />
                  <span className="text-sm">{day.label}</span>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCopyDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCopyToOtherDays}>
              Copiar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
