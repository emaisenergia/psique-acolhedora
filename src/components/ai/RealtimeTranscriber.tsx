import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Mic,
  MicOff,
  Copy,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Link as LinkIcon,
} from "lucide-react";
import { useRealtimeTranscription } from "@/hooks/useRealtimeTranscription";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { usePatients } from "@/hooks/usePatients";
import { sessionsService, Session } from "@/lib/sessions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface RealtimeTranscriberProps {
  onTranscriptionComplete?: (text: string) => void;
}

export const RealtimeTranscriber = ({ onTranscriptionComplete }: RealtimeTranscriberProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { patients } = usePatients();
  
  // Session linking state
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [patientSessions, setPatientSessions] = useState<Session[]>([]);
  const [isLinking, setIsLinking] = useState(false);

  const {
    isListening,
    isSupported,
    interimTranscript,
    finalTranscript,
    fullTranscript,
    error,
    startListening,
    stopListening,
    clearTranscript,
  } = useRealtimeTranscription({
    language: "pt-BR",
    continuous: true,
  });

  // Load patient sessions when patient is selected
  useEffect(() => {
    const loadSessions = async () => {
      if (selectedPatientId) {
        try {
          const sessions = await sessionsService.getPatientSessions(selectedPatientId);
          setPatientSessions(sessions);
        } catch (error) {
          console.error("Error loading sessions:", error);
        }
      } else {
        setPatientSessions([]);
      }
    };
    loadSessions();
  }, [selectedPatientId]);

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleCopy = async () => {
    if (!fullTranscript) return;
    await navigator.clipboard.writeText(fullTranscript);
    setCopied(true);
    toast({
      title: "Copiado!",
      description: "Transcrição copiada para a área de transferência.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!fullTranscript) return;
    const blob = new Blob([fullTranscript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcricao-realtime-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    clearTranscript();
    onTranscriptionComplete?.("");
  };

  const handleLinkToSession = async () => {
    if (!selectedSessionId || !fullTranscript) return;
    
    setIsLinking(true);
    try {
      const session = patientSessions.find(s => s.id === selectedSessionId);
      const updatedTranscription = session?.transcription 
        ? `${session.transcription}\n\n--- Transcrição em tempo real (${new Date().toLocaleString("pt-BR")}) ---\n${fullTranscript}`
        : fullTranscript;
      
      await sessionsService.updateSession(selectedSessionId, {
        transcription: updatedTranscription,
      });
      
      toast({
        title: "Vinculado com sucesso!",
        description: "A transcrição foi anexada à sessão selecionada.",
      });
      
      setIsLinkDialogOpen(false);
      setSelectedPatientId("");
      setSelectedSessionId("");
      clearTranscript();
    } catch (error) {
      console.error("Error linking transcription:", error);
      toast({
        title: "Erro",
        description: "Não foi possível vincular a transcrição à sessão.",
        variant: "destructive",
      });
    } finally {
      setIsLinking(false);
    }
  };

  if (!isSupported) {
    return (
      <Card className="card-glass h-[600px] flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Transcrição em Tempo Real
          </CardTitle>
          <CardDescription className="text-destructive">
            Seu navegador não suporta reconhecimento de voz. Por favor, use Chrome, Edge ou Safari.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card className="card-glass h-[600px] flex flex-col">
        <CardHeader className="pb-3 flex-shrink-0">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Radio className={cn("h-5 w-5", isListening ? "text-red-500 animate-pulse" : "text-primary")} />
            Transcrição em Tempo Real
          </CardTitle>
          <CardDescription>
            Transcrição instantânea usando reconhecimento de voz do navegador
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-hidden pb-4 gap-4">
          {/* Recording Controls */}
          <div className="flex flex-col items-center gap-4 py-4">
            <Button
              size="lg"
              variant={isListening ? "destructive" : "default"}
              className={cn(
                "h-20 w-20 rounded-full transition-all",
                isListening && "animate-pulse ring-4 ring-red-500/30"
              )}
              onClick={handleToggleListening}
            >
              {isListening ? (
                <MicOff className="h-8 w-8" />
              ) : (
                <Mic className="h-8 w-8" />
              )}
            </Button>
            
            <p className="text-sm text-muted-foreground text-center">
              {isListening 
                ? "Ouvindo... Fale naturalmente" 
                : "Clique para iniciar a transcrição em tempo real"}
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Transcription Result */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Transcrição</span>
              {fullTranscript && (
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsLinkDialogOpen(true)}
                    title="Vincular a uma sessão"
                  >
                    <LinkIcon className="h-4 w-4" />
                  </Button>
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
                  <Button variant="ghost" size="sm" onClick={handleClear}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            <ScrollArea className="flex-1 border rounded-lg p-3 bg-muted/50">
              {fullTranscript || interimTranscript ? (
                <div className="space-y-1">
                  <p className="whitespace-pre-wrap text-sm">
                    {finalTranscript}
                    {interimTranscript && (
                      <span className="text-muted-foreground italic">{interimTranscript}</span>
                    )}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-8">
                  A transcrição aparecerá aqui em tempo real enquanto você fala
                </p>
              )}
            </ScrollArea>
          </div>

          {/* Word count */}
          {fullTranscript && (
            <div className="text-xs text-muted-foreground text-right">
              {fullTranscript.split(/\s+/).filter(Boolean).length} palavras
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link to Session Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular Transcrição à Sessão</DialogTitle>
            <DialogDescription>
              Selecione o paciente e a sessão para anexar esta transcrição.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Paciente</Label>
              <Select value={selectedPatientId} onValueChange={(value) => {
                setSelectedPatientId(value);
                setSelectedSessionId("");
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.filter(p => p.status === "active").map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPatientId && (
              <div className="space-y-2">
                <Label>Sessão</Label>
                <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma sessão" />
                  </SelectTrigger>
                  <SelectContent>
                    {patientSessions.length === 0 ? (
                      <SelectItem value="none" disabled>
                        Nenhuma sessão encontrada
                      </SelectItem>
                    ) : (
                      patientSessions.map((session) => (
                        <SelectItem key={session.id} value={session.id}>
                          {new Date(session.session_date).toLocaleDateString("pt-BR")} - {session.status}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleLinkToSession} 
              disabled={!selectedSessionId || isLinking}
            >
              {isLinking ? "Vinculando..." : "Vincular"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
