import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SecureMessage = {
  id: string;
  patientId: string;
  author: "patient" | "psychologist";
  content: string;
  createdAt: string;
  urgent: boolean;
  read: boolean;
};

export const usePatientMessages = (patientId: string | null) => {
  const [messages, setMessages] = useState<SecureMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!patientId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data, error } = await supabase
      .from("secure_messages")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(
        data.map((item) => ({
          id: item.id,
          patientId: item.patient_id,
          author: item.author as "patient" | "psychologist",
          content: item.content,
          createdAt: item.created_at,
          urgent: item.urgent,
          read: item.read,
        }))
      );
    }
    setIsLoading(false);
  }, [patientId]);

  const patientMessages = useMemo(() => {
    if (!patientId) return [];
    return messages
      .filter((m) => m.patientId === patientId)
      .slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messages, patientId]);

  const unreadPatientMessages = useMemo(
    () => patientMessages.filter((m) => m.author === "patient" && !m.read),
    [patientMessages]
  );

  const urgentPatientMessages = useMemo(
    () => patientMessages.filter((m) => m.author === "patient" && m.urgent),
    [patientMessages]
  );

  const markMessageRead = async (messageId: string) => {
    const { error } = await supabase.from("secure_messages").update({ read: true }).eq("id", messageId);
    if (!error) {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, read: true } : m)));
    }
  };

  const sendReply = async (content: string) => {
    if (!patientId || !content.trim()) return;
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const { data: newMessage, error } = await supabase
      .from("secure_messages")
      .insert({
        patient_id: patientId,
        author: "psychologist",
        author_user_id: currentUser?.id || null,
        content: content.trim(),
        urgent: false,
        read: true,
      })
      .select()
      .single();

    if (!error && newMessage) {
      setMessages((prev) => [
        ...prev,
        {
          id: newMessage.id,
          patientId: newMessage.patient_id,
          author: newMessage.author as "patient" | "psychologist",
          content: newMessage.content,
          createdAt: newMessage.created_at,
          urgent: newMessage.urgent,
          read: newMessage.read,
        },
      ]);
    }
  };

  return {
    messages,
    isLoading,
    fetchMessages,
    patientMessages,
    unreadPatientMessages,
    urgentPatientMessages,
    markMessageRead,
    sendReply,
  };
};
