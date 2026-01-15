import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UseAudioTranscriptionOptions {
  onTranscription?: (text: string) => void;
}

export const useAudioTranscription = ({ onTranscription }: UseAudioTranscriptionOptions = {}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4"
      });
      
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting recording:", err);
      setError("Não foi possível acessar o microfone");
      toast({
        title: "Erro",
        description: "Não foi possível acessar o microfone. Verifique as permissões.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = async () => {
        setIsRecording(false);
        setIsTranscribing(true);

        try {
          const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
          const audioBlob = new Blob(chunksRef.current, { type: mimeType });
          
          // Stop all tracks
          mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
          
          // Convert blob to base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          
          reader.onloadend = async () => {
            const base64 = (reader.result as string).split(",")[1];
            
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData.session) {
              throw new Error("Usuário não autenticado");
            }

            const { data, error: fnError } = await supabase.functions.invoke("transcribe-audio", {
              body: { audioBase64: base64, mimeType },
            });

            if (fnError) {
              throw fnError;
            }

            const text = data?.transcription || "";
            setTranscription(text);
            onTranscription?.(text);
            resolve(text);
          };
        } catch (err) {
          console.error("Transcription error:", err);
          const errorMessage = err instanceof Error ? err.message : "Erro na transcrição";
          setError(errorMessage);
          toast({
            title: "Erro na Transcrição",
            description: errorMessage,
            variant: "destructive",
          });
          resolve(null);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current.stop();
    });
  }, [onTranscription, toast]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current = null;
      chunksRef.current = [];
      setIsRecording(false);
    }
  }, []);

  const clearTranscription = useCallback(() => {
    setTranscription("");
    setError(null);
  }, []);

  return {
    isRecording,
    isTranscribing,
    transcription,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    clearTranscription,
  };
};
