import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Segunda', shortLabel: 'Seg' },
  { value: 'tuesday', label: 'Terça', shortLabel: 'Ter' },
  { value: 'wednesday', label: 'Quarta', shortLabel: 'Qua' },
  { value: 'thursday', label: 'Quinta', shortLabel: 'Qui' },
  { value: 'friday', label: 'Sexta', shortLabel: 'Sex' },
  { value: 'saturday', label: 'Sábado', shortLabel: 'Sáb' },
  { value: 'sunday', label: 'Domingo', shortLabel: 'Dom' },
] as const;

export type DayOfWeek = typeof DAYS_OF_WEEK[number]['value'];

export interface ScheduleBreak {
  id: string;
  schedule_config_id: string;
  break_start_time: string;
  break_end_time: string;
  label: string;
  sort_order: number;
}

export interface ClinicScheduleConfig {
  id: string;
  clinic_id: string | null;
  day_of_week: DayOfWeek;
  work_start_time: string;
  work_end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  breaks?: ScheduleBreak[];
}

export interface DaySchedule {
  dayOfWeek: DayOfWeek;
  workStartTime: string;
  workEndTime: string;
  isActive: boolean;
  breaks: Array<{
    id?: string;
    startTime: string;
    endTime: string;
    label: string;
  }>;
}

const DEFAULT_SCHEDULE: Omit<DaySchedule, 'dayOfWeek'> = {
  workStartTime: '08:00',
  workEndTime: '18:00',
  isActive: true,
  breaks: [{ startTime: '12:00', endTime: '13:00', label: 'Almoço' }],
};

export const useClinicScheduleConfig = (clinicId?: string | null) => {
  const [configs, setConfigs] = useState<ClinicScheduleConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const fetchConfigs = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch schedule configs
      let query = supabase
        .from('clinic_schedule_config')
        .select('*')
        .order('day_of_week');
      
      if (clinicId === null) {
        query = query.is('clinic_id', null);
      } else if (clinicId) {
        query = query.or(`clinic_id.eq.${clinicId},clinic_id.is.null`);
      }

      const { data: configData, error: configError } = await query;
      if (configError) throw configError;

      // Fetch breaks for these configs
      if (configData && configData.length > 0) {
        const configIds = configData.map(c => c.id);
        const { data: breaksData, error: breaksError } = await supabase
          .from('schedule_breaks')
          .select('*')
          .in('schedule_config_id', configIds)
          .order('sort_order');
        
        if (breaksError) throw breaksError;

        // Merge breaks into configs
        const configsWithBreaks = configData.map(config => ({
          ...config,
          breaks: (breaksData || []).filter(b => b.schedule_config_id === config.id)
        })) as ClinicScheduleConfig[];

        setConfigs(configsWithBreaks);
      } else {
        setConfigs([]);
      }
    } catch (error) {
      console.error('Error fetching schedule configs:', error);
      toast({
        title: 'Erro ao carregar configurações',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [clinicId, toast]);

  const getScheduleForDay = useCallback((dayOfWeek: DayOfWeek, targetClinicId?: string | null): DaySchedule => {
    // First try to find clinic-specific config
    let config = configs.find(
      c => c.day_of_week === dayOfWeek && c.clinic_id === targetClinicId
    );
    
    // If not found and looking for clinic-specific, try global
    if (!config && targetClinicId) {
      config = configs.find(
        c => c.day_of_week === dayOfWeek && c.clinic_id === null
      );
    }

    if (config) {
      return {
        dayOfWeek,
        workStartTime: config.work_start_time,
        workEndTime: config.work_end_time,
        isActive: config.is_active,
        breaks: (config.breaks || []).map(b => ({
          id: b.id,
          startTime: b.break_start_time,
          endTime: b.break_end_time,
          label: b.label,
        })),
      };
    }

    // Return default schedule
    return {
      dayOfWeek,
      ...DEFAULT_SCHEDULE,
      isActive: !['saturday', 'sunday'].includes(dayOfWeek),
    };
  }, [configs]);

  const getAllSchedules = useCallback((targetClinicId?: string | null): DaySchedule[] => {
    return DAYS_OF_WEEK.map(day => getScheduleForDay(day.value, targetClinicId));
  }, [getScheduleForDay]);

  const saveDaySchedule = async (
    daySchedule: DaySchedule, 
    targetClinicId?: string | null
  ): Promise<boolean> => {
    try {
      setIsSaving(true);

      // Find existing config
      const existingConfig = configs.find(
        c => c.day_of_week === daySchedule.dayOfWeek && c.clinic_id === targetClinicId
      );

      let configId: string;

      if (existingConfig) {
        // Update existing config
        const { error } = await supabase
          .from('clinic_schedule_config')
          .update({
            work_start_time: daySchedule.workStartTime,
            work_end_time: daySchedule.workEndTime,
            is_active: daySchedule.isActive,
          })
          .eq('id', existingConfig.id);

        if (error) throw error;
        configId = existingConfig.id;

        // Delete existing breaks
        await supabase
          .from('schedule_breaks')
          .delete()
          .eq('schedule_config_id', configId);
      } else {
        // Create new config
        const { data, error } = await supabase
          .from('clinic_schedule_config')
          .insert({
            clinic_id: targetClinicId || null,
            day_of_week: daySchedule.dayOfWeek,
            work_start_time: daySchedule.workStartTime,
            work_end_time: daySchedule.workEndTime,
            is_active: daySchedule.isActive,
          })
          .select()
          .single();

        if (error) throw error;
        configId = data.id;
      }

      // Insert new breaks
      if (daySchedule.breaks.length > 0) {
        const breaksToInsert = daySchedule.breaks.map((b, index) => ({
          schedule_config_id: configId,
          break_start_time: b.startTime,
          break_end_time: b.endTime,
          label: b.label,
          sort_order: index,
        }));

        const { error: breaksError } = await supabase
          .from('schedule_breaks')
          .insert(breaksToInsert);

        if (breaksError) throw breaksError;
      }

      await fetchConfigs();
      return true;
    } catch (error) {
      console.error('Error saving day schedule:', error);
      toast({
        title: 'Erro ao salvar configuração',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const saveAllSchedules = async (
    schedules: DaySchedule[], 
    targetClinicId?: string | null
  ): Promise<boolean> => {
    try {
      setIsSaving(true);

      for (const schedule of schedules) {
        const success = await saveDaySchedule(schedule, targetClinicId);
        if (!success) return false;
      }

      toast({
        title: 'Configurações salvas',
        description: 'Os horários foram atualizados com sucesso.',
      });

      return true;
    } catch (error) {
      console.error('Error saving schedules:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const copyScheduleToOtherDays = async (
    sourceDay: DayOfWeek,
    targetDays: DayOfWeek[],
    targetClinicId?: string | null
  ): Promise<boolean> => {
    const sourceSchedule = getScheduleForDay(sourceDay, targetClinicId);
    
    const schedulesToSave = targetDays.map(day => ({
      ...sourceSchedule,
      dayOfWeek: day,
    }));

    for (const schedule of schedulesToSave) {
      const success = await saveDaySchedule(schedule, targetClinicId);
      if (!success) return false;
    }

    toast({
      title: 'Configuração copiada',
      description: `Horários de ${DAYS_OF_WEEK.find(d => d.value === sourceDay)?.label} copiados para ${targetDays.length} dia(s).`,
    });

    return true;
  };

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  return {
    configs,
    isLoading,
    isSaving,
    fetchConfigs,
    getScheduleForDay,
    getAllSchedules,
    saveDaySchedule,
    saveAllSchedules,
    copyScheduleToOtherDays,
  };
};
