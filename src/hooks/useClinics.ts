import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Clinic {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  is_default: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ClinicInsert {
  name: string;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  is_default?: boolean;
  status?: string;
}

export interface ClinicUpdate {
  name?: string;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  is_default?: boolean;
  status?: string;
}

export const useClinics = () => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchClinics = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setClinics((data || []) as Clinic[]);
    } catch (error) {
      console.error('Error fetching clinics:', error);
      toast({
        title: 'Erro ao carregar clínicas',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createClinic = async (clinic: ClinicInsert): Promise<Clinic | null> => {
    try {
      // If setting as default, unset other defaults first
      if (clinic.is_default) {
        await supabase
          .from('clinics')
          .update({ is_default: false })
          .eq('is_default', true);
      }

      const { data, error } = await supabase
        .from('clinics')
        .insert(clinic)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Clínica cadastrada',
        description: 'A clínica foi adicionada com sucesso.'
      });

      await fetchClinics();
      return data as Clinic;
    } catch (error) {
      console.error('Error creating clinic:', error);
      toast({
        title: 'Erro ao cadastrar clínica',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive'
      });
      return null;
    }
  };

  const updateClinic = async (id: string, updates: ClinicUpdate): Promise<boolean> => {
    try {
      // If setting as default, unset other defaults first
      if (updates.is_default) {
        await supabase
          .from('clinics')
          .update({ is_default: false })
          .eq('is_default', true);
      }

      const { error } = await supabase
        .from('clinics')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Clínica atualizada',
        description: 'Os dados foram salvos com sucesso.'
      });

      await fetchClinics();
      return true;
    } catch (error) {
      console.error('Error updating clinic:', error);
      toast({
        title: 'Erro ao atualizar clínica',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive'
      });
      return false;
    }
  };

  const deleteClinic = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('clinics')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Clínica removida',
        description: 'A clínica foi removida com sucesso.'
      });

      await fetchClinics();
      return true;
    } catch (error) {
      console.error('Error deleting clinic:', error);
      toast({
        title: 'Erro ao remover clínica',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive'
      });
      return false;
    }
  };

  const setDefaultClinic = async (id: string): Promise<boolean> => {
    return updateClinic(id, { is_default: true });
  };

  const getDefaultClinic = (): Clinic | undefined => {
    return clinics.find(c => c.is_default);
  };

  const getActiveClinics = (): Clinic[] => {
    return clinics.filter(c => c.status === 'active');
  };

  useEffect(() => {
    fetchClinics();
  }, [fetchClinics]);

  return {
    clinics,
    isLoading,
    fetchClinics,
    createClinic,
    updateClinic,
    deleteClinic,
    setDefaultClinic,
    getDefaultClinic,
    getActiveClinics,
  };
};
