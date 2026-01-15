import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Mic, 
  MicOff, 
  Loader2, 
  Copy, 
  Download, 
  Trash2,
  CheckCircle2
} from "lucide-react";
import { useAudioTranscription } from "@/hooks/useAudioTranscription";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface AudioTranscriberProps {
  onTranscriptionComplete?: (text: string) => void;
}

export const AudioTranscriber = ({ onTranscriptionComplete }: AudioTranscriberProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const {
    isRecording,
    isTranscribing,
    transcription,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    clearTranscription,
  } = useAudioTranscription({
    onTranscription: onTranscriptionComplete,
  });

  const handleToggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const handleCopy = async () => {
    if (!transcription) return;
    await navigator.clipboard.writeText(transcription);
    setCopied(true);
    toast({
      title: "Copiado!",
      description: "Transcrição copiada para a área de transferência.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!transcription) return;
    const blob = new Blob([transcription], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcricao-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="card-glass h-[600px] flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Mic className="h-5 w-5 text-primary" />
          Transcrição de Áudio
        </CardTitle>
        <CardDescription>
          Grave o áudio da sessão e obtenha a transcrição automática
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden pb-4 gap-4">
        {/* Recording Controls */}
        <div className="flex flex-col items-center gap-4 py-6">
          <Button
            size="lg"
            variant={isRecording ? "destructive" : "default"}
            className={cn(
              "h-24 w-24 rounded-full transition-all",
              isRecording && "animate-pulse"
            )}
            onClick={handleToggleRecording}
            disabled={isTranscribing}
          >
            {isTranscribing ? (
              <Loader2 className="h-10 w-10 animate-spin" />
            ) : isRecording ? (
              <MicOff className="h-10 w-10" />
            ) : (
              <Mic className="h-10 w-10" />
            )}
          </Button>
          
          <p className="text-sm text-muted-foreground text-center">
            {isTranscribing 
              ? "Transcrevendo áudio..." 
              : isRecording 
                ? "Gravando... Clique para parar" 
                : "Clique para iniciar a gravação"}
          </p>

          {isRecording && (
            <Button variant="outline" size="sm" onClick={cancelRecording}>
              Cancelar Gravação
            </Button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Transcription Result */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Transcrição</span>
            {transcription && (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={clearTranscription}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          <ScrollArea className="flex-1 border rounded-lg p-3 bg-muted/50">
            {transcription ? (
              <p className="whitespace-pre-wrap text-sm">{transcription}</p>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">
                A transcrição aparecerá aqui após a gravação
              </p>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};
