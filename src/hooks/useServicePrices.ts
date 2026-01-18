import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ServicePrice {
  id: string;
  clinic_id: string | null;
  insurance_id: string | null;
  service_type: string;
  price: number;
  is_social: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServicePriceInsert {
  clinic_id?: string | null;
  insurance_id?: string | null;
  service_type: string;
  price: number;
  is_social?: boolean;
  notes?: string | null;
}

export interface ServicePriceUpdate {
  clinic_id?: string | null;
  insurance_id?: string | null;
  service_type?: string;
  price?: number;
  is_social?: boolean;
  notes?: string | null;
}

export const useServicePrices = () => {
  const [servicePrices, setServicePrices] = useState<ServicePrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchServicePrices = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('service_prices')
        .select('*')
        .order('service_type', { ascending: true });

      if (error) throw error;
      setServicePrices((data || []) as ServicePrice[]);
    } catch (error) {
      console.error('Error fetching service prices:', error);
      toast({
        title: 'Erro ao carregar preços',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createServicePrice = async (price: ServicePriceInsert): Promise<ServicePrice | null> => {
    try {
      const { data, error } = await supabase
        .from('service_prices')
        .insert(price)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Preço cadastrado',
        description: 'O preço foi adicionado com sucesso.'
      });

      await fetchServicePrices();
      return data as ServicePrice;
    } catch (error) {
      console.error('Error creating service price:', error);
      toast({
        title: 'Erro ao cadastrar preço',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive'
      });
      return null;
    }
  };

  const updateServicePrice = async (id: string, updates: ServicePriceUpdate): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('service_prices')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Preço atualizado',
        description: 'Os dados foram salvos com sucesso.'
      });

      await fetchServicePrices();
      return true;
    } catch (error) {
      console.error('Error updating service price:', error);
      toast({
        title: 'Erro ao atualizar preço',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive'
      });
      return false;
    }
  };

  const deleteServicePrice = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('service_prices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Preço removido',
        description: 'O preço foi removido com sucesso.'
      });

      await fetchServicePrices();
      return true;
    } catch (error) {
      console.error('Error deleting service price:', error);
      toast({
        title: 'Erro ao remover preço',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive'
      });
      return false;
    }
  };

  const getPricesForClinic = (clinicId: string): ServicePrice[] => {
    return servicePrices.filter(p => p.clinic_id === clinicId);
  };

  const getPriceByServiceAndInsurance = (
    clinicId: string | null, 
    serviceType: string, 
    insuranceId: string | null
  ): ServicePrice | undefined => {
    // Try to find exact match first
    let price = servicePrices.find(
      p => p.clinic_id === clinicId && 
           p.service_type === serviceType && 
           p.insurance_id === insuranceId
    );
    
    // If no match with insurance, try without insurance
    if (!price && insuranceId) {
      price = servicePrices.find(
        p => p.clinic_id === clinicId && 
             p.service_type === serviceType && 
             p.insurance_id === null
      );
    }
    
    // If still no match, try without clinic
    if (!price) {
      price = servicePrices.find(
        p => p.clinic_id === null && 
             p.service_type === serviceType && 
             p.insurance_id === insuranceId
      );
    }
    
    // Last resort: default price for service type
    if (!price) {
      price = servicePrices.find(
        p => p.clinic_id === null && 
             p.service_type === serviceType && 
             p.insurance_id === null
      );
    }
    
    return price;
  };

  const calculateSessionPrice = (
    clinicId: string | null,
    serviceType: string,
    insuranceId: string | null,
    isSocial: boolean = false
  ): number => {
    // For social pricing, find social rate
    if (isSocial) {
      const socialPrice = servicePrices.find(
        p => p.clinic_id === clinicId && 
             p.service_type === serviceType && 
             p.is_social === true
      );
      if (socialPrice) return socialPrice.price;
    }
    
    const price = getPriceByServiceAndInsurance(clinicId, serviceType, insuranceId);
    return price?.price || 0;
  };

  useEffect(() => {
    fetchServicePrices();
  }, [fetchServicePrices]);

  return {
    servicePrices,
    isLoading,
    fetchServicePrices,
    createServicePrice,
    updateServicePrice,
    deleteServicePrice,
    getPricesForClinic,
    getPriceByServiceAndInsurance,
    calculateSessionPrice,
  };
};
