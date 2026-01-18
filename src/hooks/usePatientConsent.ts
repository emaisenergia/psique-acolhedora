import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const CURRENT_CONSENT_VERSION = "1.0";

export const usePatientConsent = (patientId: string | undefined) => {
  const { data: hasConsent, isLoading, refetch } = useQuery({
    queryKey: ["patient-consent", patientId],
    queryFn: async () => {
      if (!patientId) return false;

      const { data, error } = await supabase
        .from("patient_consents")
        .select("id")
        .eq("patient_id", patientId)
        .eq("consent_version", CURRENT_CONSENT_VERSION)
        .eq("consent_type", "terms_and_privacy")
        .maybeSingle();

      if (error) {
        console.error("Erro ao verificar consentimento:", error);
        return false;
      }

      return !!data;
    },
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  return {
    hasConsent: hasConsent ?? false,
    isLoading,
    refetch,
  };
};
