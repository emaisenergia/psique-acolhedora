import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionInterface extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((this: SpeechRecognitionInterface, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognitionInterface, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognitionInterface, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognitionInterface, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInterface;
    webkitSpeechRecognition: new () => SpeechRecognitionInterface;
  }
}

interface UseRealtimeTranscriptionOptions {
  onTranscript?: (text: string, isFinal: boolean) => void;
  language?: string;
  continuous?: boolean;
}

export const useRealtimeTranscription = ({
  onTranscript,
  language = "pt-BR",
  continuous = true,
}: UseRealtimeTranscriptionOptions = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const { toast } = useToast();
  
  const recognitionRef = useRef<SpeechRecognitionInterface | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isListeningRef = useRef(false);

  useEffect(() => {
    // Check browser support
    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionConstructor) {
      setIsSupported(false);
      setError("Seu navegador não suporta reconhecimento de voz. Use Chrome, Edge ou Safari.");
    }
    
    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Keep ref in sync with state
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  const startListening = useCallback(async () => {
    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionConstructor) {
      setError("Reconhecimento de voz não suportado neste navegador");
      toast({
        title: "Não suportado",
        description: "Seu navegador não suporta reconhecimento de voz. Use Chrome, Edge ou Safari.",
        variant: "destructive",
      });
      return;
    }

    try {
      setError(null);
      
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const recognition = new SpeechRecognitionConstructor();
      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.lang = language;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript + " ";
            onTranscript?.(transcript, true);
          } else {
            interim += transcript;
          }
        }

        if (final) {
          setFinalTranscript((prev) => prev + final);
        }
        setInterimTranscript(interim);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        
        if (event.error === "not-allowed") {
          setError("Permissão de microfone negada");
          toast({
            title: "Permissão negada",
            description: "Por favor, permita o acesso ao microfone nas configurações do navegador.",
            variant: "destructive",
          });
          setIsListening(false);
        } else if (event.error === "no-speech") {
          // Ignore no-speech errors, just restart if still listening
          if (continuous && isListeningRef.current) {
            restartTimeoutRef.current = setTimeout(() => {
              if (recognitionRef.current && isListeningRef.current) {
                try {
                  recognitionRef.current.start();
                } catch (e) {
                  // Already started, ignore
                }
              }
            }, 100);
          }
        } else if (event.error !== "aborted") {
          setError(`Erro no reconhecimento: ${event.error}`);
        }
      };

      recognition.onend = () => {
        // Restart if continuous mode and still listening
        if (continuous && isListeningRef.current && recognitionRef.current) {
          restartTimeoutRef.current = setTimeout(() => {
            if (isListeningRef.current) {
              try {
                recognitionRef.current?.start();
              } catch (e) {
                // Already started or stopped, ignore
                setIsListening(false);
              }
            }
          }, 100);
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      
    } catch (err) {
      console.error("Error starting recognition:", err);
      setError("Não foi possível acessar o microfone");
      toast({
        title: "Erro",
        description: "Não foi possível acessar o microfone. Verifique as permissões.",
        variant: "destructive",
      });
    }
  }, [continuous, language, onTranscript, toast]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    setIsListening(false);
    
    // Move interim to final when stopping
    setInterimTranscript((current) => {
      if (current) {
        setFinalTranscript((prev) => prev + current + " ");
      }
      return "";
    });
  }, []);

  const clearTranscript = useCallback(() => {
    setFinalTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  const getFullTranscript = useCallback(() => {
    return (finalTranscript + interimTranscript).trim();
  }, [finalTranscript, interimTranscript]);

  return {
    isListening,
    isSupported,
    interimTranscript,
    finalTranscript,
    fullTranscript: getFullTranscript(),
    error,
    startListening,
    stopListening,
    clearTranscript,
  };
};
