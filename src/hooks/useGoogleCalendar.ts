import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CalendarStatus {
  connected: boolean;
  sync_enabled: boolean;
  last_sync: string | null;
}

export const useGoogleCalendar = () => {
  const { toast } = useToast();
  const [status, setStatus] = useState<CalendarStatus>({
    connected: false,
    sync_enabled: false,
    last_sync: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: { action: 'status' },
      });

      if (error) {
        console.error('Failed to check Google Calendar status:', error);
        return;
      }

      setStatus({
        connected: data.connected || false,
        sync_enabled: data.sync_enabled || false,
        last_sync: data.last_sync || null,
      });
    } catch (err) {
      console.error('Error checking Google Calendar status:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Handle OAuth callback
  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');

      if (code && state) {
        setIsConnecting(true);
        try {
          const redirect_uri = `${window.location.origin}/admin/configuracoes`;
          
          const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
            body: { 
              action: 'exchange_code', 
              code,
              redirect_uri,
            },
          });

          if (error || !data.success) {
            toast({
              title: 'Erro ao conectar',
              description: error?.message || data?.error || 'Falha na conexão com o Google Calendar',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Conectado!',
              description: 'Google Calendar sincronizado com sucesso.',
            });
            await checkStatus();
          }
        } catch (err: any) {
          toast({
            title: 'Erro',
            description: err.message || 'Erro desconhecido',
            variant: 'destructive',
          });
        } finally {
          setIsConnecting(false);
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    };

    handleCallback();
  }, [checkStatus, toast]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const redirect_uri = `${window.location.origin}/admin/configuracoes`;
      
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: { 
          action: 'get_auth_url',
          redirect_uri,
        },
      });

      if (error || !data.auth_url) {
        toast({
          title: 'Erro',
          description: 'Não foi possível iniciar a conexão com o Google Calendar',
          variant: 'destructive',
        });
        setIsConnecting(false);
        return;
      }

      // Redirect to Google OAuth
      window.location.href = data.auth_url;
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Erro desconhecido',
        variant: 'destructive',
      });
      setIsConnecting(false);
    }
  }, [toast]);

  const disconnect = useCallback(async () => {
    try {
      const { error } = await supabase.functions.invoke('google-calendar-auth', {
        body: { action: 'disconnect' },
      });

      if (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível desconectar o Google Calendar',
          variant: 'destructive',
        });
        return;
      }

      setStatus({
        connected: false,
        sync_enabled: false,
        last_sync: null,
      });

      toast({
        title: 'Desconectado',
        description: 'Google Calendar desconectado com sucesso.',
      });
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const toggleSync = useCallback(async (enabled: boolean) => {
    try {
      const { error } = await supabase.functions.invoke('google-calendar-sync', {
        body: { action: 'toggle_sync', sync_enabled: enabled },
      });

      if (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível alterar a configuração de sincronização',
          variant: 'destructive',
        });
        return;
      }

      setStatus(prev => ({ ...prev, sync_enabled: enabled }));

      toast({
        title: enabled ? 'Sincronização ativada' : 'Sincronização desativada',
        description: enabled 
          ? 'Novos agendamentos serão adicionados ao seu Google Calendar'
          : 'Agendamentos não serão mais sincronizados',
      });
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const syncAppointment = useCallback(async (appointmentId: string, action: 'create' | 'update' | 'delete') => {
    if (!status.connected || !status.sync_enabled) {
      return;
    }

    try {
      await supabase.functions.invoke('google-calendar-sync', {
        body: { action, appointment_id: appointmentId },
      });
    } catch (err) {
      console.error('Failed to sync appointment:', err);
    }
  }, [status.connected, status.sync_enabled]);

  return {
    isConnected: status.connected,
    syncEnabled: status.sync_enabled,
    lastSync: status.last_sync,
    isLoading,
    isConnecting,
    connect,
    disconnect,
    toggleSync,
    syncAppointment,
    refreshStatus: checkStatus,
  };
};
