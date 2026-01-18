import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { notifyWaitlistAvailable } from '@/lib/notifications';

export interface WaitlistEntry {
  id: string;
  patient_id: string;
  desired_date: string;
  desired_time: string | null;
  time_range_start: string | null;
  time_range_end: string | null;
  service: string | null;
  notes: string | null;
  status: 'waiting' | 'notified' | 'scheduled' | 'expired' | 'cancelled';
  notified_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  patient?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
}

export interface WaitlistInsert {
  patient_id: string;
  desired_date: string;
  desired_time?: string | null;
  time_range_start?: string | null;
  time_range_end?: string | null;
  service?: string | null;
  notes?: string | null;
}

export const useWaitlist = () => {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchWaitlist = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('waitlist')
        .select(`
          *,
          patient:patients(id, name, email, phone)
        `)
        .order('desired_date', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setWaitlist((data || []) as unknown as WaitlistEntry[]);
    } catch (error) {
      console.error('Error fetching waitlist:', error);
      toast({
        title: 'Erro ao carregar lista de espera',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const addToWaitlist = async (entry: WaitlistInsert): Promise<WaitlistEntry | null> => {
    try {
      const { data, error } = await supabase
        .from('waitlist')
        .insert(entry)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Adicionado à lista de espera',
        description: 'Você será notificado quando um horário estiver disponível.'
      });

      await fetchWaitlist();
      return data as WaitlistEntry;
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      toast({
        title: 'Erro ao adicionar à lista de espera',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive'
      });
      return null;
    }
  };

  const updateWaitlistEntry = async (
    id: string,
    updates: Partial<Pick<WaitlistEntry, 'status' | 'notified_at' | 'expires_at'>>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('waitlist')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchWaitlist();
      return true;
    } catch (error) {
      console.error('Error updating waitlist entry:', error);
      toast({
        title: 'Erro ao atualizar entrada',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive'
      });
      return false;
    }
  };

  const removeFromWaitlist = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('waitlist')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Removido da lista de espera',
        description: 'A entrada foi removida com sucesso.'
      });

      await fetchWaitlist();
      return true;
    } catch (error) {
      console.error('Error removing from waitlist:', error);
      toast({
        title: 'Erro ao remover entrada',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive'
      });
      return false;
    }
  };

  const getWaitlistForDate = (date: string): WaitlistEntry[] => {
    return waitlist.filter(
      entry => entry.desired_date === date && entry.status === 'waiting'
    );
  };

  const notifyPatient = async (entryId: string): Promise<boolean> => {
    const entry = waitlist.find(w => w.id === entryId);
    if (!entry || !entry.patient) {
      toast({
        title: 'Erro ao notificar',
        description: 'Entrada não encontrada.',
        variant: 'destructive'
      });
      return false;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Send email notification
    try {
      await notifyWaitlistAvailable(
        entry.patient_id,
        entry.patient.name,
        entry.desired_date,
        entry.desired_time || entry.time_range_start || '08:00'
      );
    } catch (error) {
      console.error('Error sending waitlist notification email:', error);
    }

    const success = await updateWaitlistEntry(entryId, {
      status: 'notified',
      notified_at: now.toISOString(),
      expires_at: expiresAt.toISOString()
    });

    if (success) {
      toast({
        title: 'Paciente notificado',
        description: `${entry.patient.name} foi notificado por email sobre a disponibilidade.`
      });
    }

    return success;
  };

  const cancelWaitlistEntry = async (id: string): Promise<boolean> => {
    return updateWaitlistEntry(id, { status: 'cancelled' });
  };

  useEffect(() => {
    fetchWaitlist();
  }, [fetchWaitlist]);

  return {
    waitlist,
    isLoading,
    fetchWaitlist,
    addToWaitlist,
    updateWaitlistEntry,
    removeFromWaitlist,
    getWaitlistForDate,
    notifyPatient,
    cancelWaitlistEntry
  };
};
