import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

type TableName = "secure_messages" | "activities";
type EventType = "INSERT" | "UPDATE" | "DELETE" | "*";

interface UseRealtimeUpdatesOptions {
  table: TableName;
  event?: EventType;
  filter?: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  onChange?: (payload: any) => void;
  enabled?: boolean;
}

export const useRealtimeUpdates = ({
  table,
  event = "*",
  filter,
  onInsert,
  onUpdate,
  onDelete,
  onChange,
  enabled = true,
}: UseRealtimeUpdatesOptions) => {
  const handleChange = useCallback(
    (payload: any) => {
      const eventType = payload.eventType;

      // Call the general onChange handler
      onChange?.(payload);

      // Call specific event handlers
      switch (eventType) {
        case "INSERT":
          onInsert?.(payload);
          break;
        case "UPDATE":
          onUpdate?.(payload);
          break;
        case "DELETE":
          onDelete?.(payload);
          break;
      }
    },
    [onChange, onInsert, onUpdate, onDelete]
  );

  useEffect(() => {
    if (!enabled) return;

    const channelName = `realtime-${table}-${filter || "all"}`;
    
    let channel: RealtimeChannel;

    const setupChannel = () => {
      const channelConfig: any = {
        event,
        schema: "public",
        table,
      };

      if (filter) {
        channelConfig.filter = filter;
      }

      channel = supabase
        .channel(channelName)
        .on("postgres_changes", channelConfig, handleChange)
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log(`Realtime subscribed to ${table}`);
          }
        });
    };

    setupChannel();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [table, event, filter, handleChange, enabled]);
};

// Convenience hook for patient-specific updates
export const usePatientRealtimeUpdates = (
  patientId: string | null,
  options: {
    onMessagesChange?: (payload: any) => void;
    onActivitiesChange?: (payload: any) => void;
  }
) => {
  useRealtimeUpdates({
    table: "secure_messages",
    filter: patientId ? `patient_id=eq.${patientId}` : undefined,
    onChange: options.onMessagesChange,
    enabled: !!patientId,
  });

  useRealtimeUpdates({
    table: "activities",
    filter: patientId ? `patient_id=eq.${patientId}` : undefined,
    onChange: options.onActivitiesChange,
    enabled: !!patientId,
  });
};
