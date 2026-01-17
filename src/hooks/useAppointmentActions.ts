import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ActionTokens {
  confirm: string;
  cancel: string;
  reschedule: string;
}

interface ActionUrls {
  confirmUrl: string;
  cancelUrl: string;
  rescheduleUrl: string;
}

export const useAppointmentActions = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateActionTokens = async (appointmentId: string): Promise<ActionUrls | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("appointment-actions", {
        body: {
          action: "generate_tokens",
          appointment_id: appointmentId,
        },
      });

      if (fnError) {
        throw fnError;
      }

      if (!data?.tokens) {
        throw new Error("Falha ao gerar tokens");
      }

      const tokens = data.tokens as ActionTokens;
      const baseUrl = window.location.origin;

      return {
        confirmUrl: `${baseUrl}/agendamento/confirmar?token=${tokens.confirm}`,
        cancelUrl: `${baseUrl}/agendamento/cancelar?token=${tokens.cancel}`,
        rescheduleUrl: `${baseUrl}/agendamento/reagendar?token=${tokens.reschedule}`,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao gerar tokens";
      setError(message);
      console.error("Error generating action tokens:", err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateActionTokens,
    isGenerating,
    error,
  };
};
