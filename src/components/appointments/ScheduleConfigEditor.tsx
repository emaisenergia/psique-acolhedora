import { useState, useEffect } from "react";
import { Settings, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAdminPreferences, type AdminPreferences } from "@/hooks/useAdminPreferences";
import { toast } from "sonner";

const DAYS_OF_WEEK = [
  { value: "monday", label: "Segunda" },
  { value: "tuesday", label: "Terça" },
  { value: "wednesday", label: "Quarta" },
  { value: "thursday", label: "Quinta" },
  { value: "friday", label: "Sexta" },
  { value: "saturday", label: "Sábado" },
  { value: "sunday", label: "Domingo" },
];

const DEFAULT_VALUES = {
  work_start_time: "07:00",
  work_end_time: "19:00",
  break_start_time: "12:00",
  break_end_time: "13:00",
  default_session_duration: 50,
  session_interval: 10,
  available_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
};

interface ScheduleConfigEditorProps {
  trigger?: React.ReactNode;
}

export function ScheduleConfigEditor({ trigger }: ScheduleConfigEditorProps) {
  const { preferences, loading, saving, savePreferences } = useAdminPreferences();
  const [open, setOpen] = useState(false);
  const [localForm, setLocalForm] = useState<Partial<AdminPreferences>>({});

  // Sync local form with preferences when dialog opens
  useEffect(() => {
    if (open && !loading) {
      setLocalForm({
        work_start_time: preferences.work_start_time,
        work_end_time: preferences.work_end_time,
        break_start_time: preferences.break_start_time,
        break_end_time: preferences.break_end_time,
        default_session_duration: preferences.default_session_duration,
        session_interval: preferences.session_interval,
        available_days: [...preferences.available_days],
      });
    }
  }, [open, loading, preferences]);

  const handleDayToggle = (day: string) => {
    const currentDays = localForm.available_days || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];
    setLocalForm((prev) => ({ ...prev, available_days: newDays }));
  };

  const handleResetDefaults = () => {
    setLocalForm({
      work_start_time: DEFAULT_VALUES.work_start_time,
      work_end_time: DEFAULT_VALUES.work_end_time,
      break_start_time: DEFAULT_VALUES.break_start_time,
      break_end_time: DEFAULT_VALUES.break_end_time,
      default_session_duration: DEFAULT_VALUES.default_session_duration,
      session_interval: DEFAULT_VALUES.session_interval,
      available_days: [...DEFAULT_VALUES.available_days],
    });
  };

  const handleSave = async () => {
    // Validations
    if (!localForm.available_days || localForm.available_days.length === 0) {
      toast.error("Selecione pelo menos um dia de atendimento");
      return;
    }

    if (localForm.work_start_time && localForm.work_end_time) {
      if (localForm.work_start_time >= localForm.work_end_time) {
        toast.error("Horário de início deve ser anterior ao horário de término");
        return;
      }
    }

    if (localForm.break_start_time && localForm.break_end_time) {
      if (localForm.break_start_time >= localForm.break_end_time) {
        toast.error("Horário de início do intervalo deve ser anterior ao término");
        return;
      }
    }

    const success = await savePreferences(localForm);
    if (success) {
      setOpen(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Settings className="h-4 w-4 mr-2" />
      Configurar Horários
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurar Horários de Trabalho
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Work Hours */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Expediente</Label>
            <div className="flex items-center gap-3">
              <Input
                type="time"
                value={localForm.work_start_time || ""}
                onChange={(e) =>
                  setLocalForm((prev) => ({ ...prev, work_start_time: e.target.value }))
                }
                className="flex-1"
              />
              <span className="text-muted-foreground">até</span>
              <Input
                type="time"
                value={localForm.work_end_time || ""}
                onChange={(e) =>
                  setLocalForm((prev) => ({ ...prev, work_end_time: e.target.value }))
                }
                className="flex-1"
              />
            </div>
          </div>

          {/* Break Hours */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Intervalo / Almoço</Label>
            <div className="flex items-center gap-3">
              <Input
                type="time"
                value={localForm.break_start_time || ""}
                onChange={(e) =>
                  setLocalForm((prev) => ({ ...prev, break_start_time: e.target.value }))
                }
                className="flex-1"
              />
              <span className="text-muted-foreground">até</span>
              <Input
                type="time"
                value={localForm.break_end_time || ""}
                onChange={(e) =>
                  setLocalForm((prev) => ({ ...prev, break_end_time: e.target.value }))
                }
                className="flex-1"
              />
            </div>
          </div>

          {/* Session Settings */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Sessões</Label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Duração (min)</Label>
                <Input
                  type="number"
                  min={15}
                  step={5}
                  value={localForm.default_session_duration || 50}
                  onChange={(e) =>
                    setLocalForm((prev) => ({
                      ...prev,
                      default_session_duration: parseInt(e.target.value) || 50,
                    }))
                  }
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Intervalo (min)</Label>
                <Input
                  type="number"
                  min={0}
                  step={5}
                  value={localForm.session_interval || 0}
                  onChange={(e) =>
                    setLocalForm((prev) => ({
                      ...prev,
                      session_interval: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Days of Week */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Dias de Atendimento</Label>
            <div className="grid grid-cols-2 gap-3">
              {DAYS_OF_WEEK.map((day) => (
                <label
                  key={day.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={localForm.available_days?.includes(day.value) || false}
                    onCheckedChange={() => handleDayToggle(day.value)}
                  />
                  <span className="text-sm">{day.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            onClick={handleResetDefaults}
            className="w-full sm:w-auto"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar Padrões
          </Button>
          <div className="flex-1" />
          <Button
            onClick={handleSave}
            disabled={saving || loading}
            className="w-full sm:w-auto"
          >
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
