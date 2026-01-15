import { useState, useRef } from "react";
import AdminLayout from "./AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AIChat } from "@/components/ai/AIChat";
import { AudioTranscriber } from "@/components/ai/AudioTranscriber";
import { RealtimeTranscriber } from "@/components/ai/RealtimeTranscriber";
import { ConversationSearch } from "@/components/ai/ConversationSearch";
import { AIUsageDashboard } from "@/components/ai/AIUsageDashboard";
import { KnowledgeManager } from "@/components/ai/KnowledgeManager";
import { FavoritePrompts } from "@/components/ai/FavoritePrompts";
import { usePatients } from "@/hooks/usePatients";
import { 
  Bot, 
  MessageSquare, 
  FileText, 
  Brain, 
  ClipboardList,
  Sparkles,
  Loader2,
  Mic,
  Radio,
  Search,
  BarChart3,
  BookOpen,
  Heart,
  Star,
} from "lucide-react";

const CHAT_SUGGESTIONS = [
  "Como estruturar um RPD para ansiedade?",
  "Técnicas de foco sensorial para disfunção erétil",
  "Reestruturação de crenças sobre sexualidade",
  "Experimento comportamental para fobia social",
];

const AgentesIA = () => {
  const { patients } = usePatients();
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [reportType, setReportType] = useState("evolucao");
  const chatRef = useRef<{ sendMessage: (msg: string) => void } | null>(null);

  // Get patient name for context
  const selectedPatientName = patients.find(p => p.id === selectedPatient)?.name || "";

  const handlePromptSelect = (prompt: string) => {
    // This will be used to send prompt to chat
    if (chatRef.current) {
      chatRef.current.sendMessage(prompt);
    }
  };
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-light flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Agentes IA
            </h1>
            <p className="text-muted-foreground">
              Especialista em TCC e Terapia Sexual
            </p>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="card-glass border-primary/20">
            <CardHeader className="pb-2">
              <Brain className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-base">TCC Especializada</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Formulação cognitiva, reestruturação e intervenções baseadas em evidências
              </p>
            </CardContent>
          </Card>

          <Card className="card-glass border-pink-500/20">
            <CardHeader className="pb-2">
              <Heart className="h-8 w-8 text-pink-500 mb-2" />
              <CardTitle className="text-base">Terapia Sexual</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Disfunções sexuais, foco sensorial e questões de sexualidade
              </p>
            </CardContent>
          </Card>

          <Card className="card-glass">
            <CardHeader className="pb-2">
              <ClipboardList className="h-8 w-8 text-blue-500 mb-2" />
              <CardTitle className="text-base">Resumo de Sessão</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Gere resumos com formulação cognitiva automatizada
              </p>
            </CardContent>
          </Card>

          <Card className="card-glass">
            <CardHeader className="pb-2">
              <FileText className="h-8 w-8 text-green-500 mb-2" />
              <CardTitle className="text-base">Relatórios Clínicos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Relatórios profissionais com linguagem técnica
              </p>
            </CardContent>
          </Card>

          <Card className="card-glass border-purple-500/20">
            <CardHeader className="pb-2">
              <BookOpen className="h-8 w-8 text-purple-500 mb-2" />
              <CardTitle className="text-base">Base de Conhecimento</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Alimente a IA com seus próprios materiais
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different agents */}
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Conhecimento</span>
            </TabsTrigger>
            <TabsTrigger value="transcription" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              <span className="hidden sm:inline">Transcrição</span>
            </TabsTrigger>
            <TabsTrigger value="realtime" className="flex items-center gap-2">
              <Radio className="h-4 w-4" />
              <span className="hidden sm:inline">Tempo Real</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Buscar</span>
            </TabsTrigger>
            <TabsTrigger value="session" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Sessão</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Análise</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Relatórios</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <AIUsageDashboard />
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AIChat 
                  type="chat"
                  title="Chat Especialista TCC / Terapia Sexual"
                  placeholder="Pergunte sobre TCC, terapia sexual, técnicas, intervenções..."
                  suggestions={CHAT_SUGGESTIONS}
                />
              </div>
              <div className="space-y-4">
                <FavoritePrompts onSelectPrompt={handlePromptSelect} />
                <Card className="card-glass">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Brain className="h-4 w-4 text-primary" />
                      Especialidades
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Terapia Cognitivo-Comportamental</p>
                      <p className="text-xs text-muted-foreground">
                        Reestruturação cognitiva, experimentos comportamentais, RPD, ativação comportamental
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Terapia Sexual</p>
                      <p className="text-xs text-muted-foreground">
                        Disfunções sexuais, foco sensorial, educação sexual, questões de gênero
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Knowledge Tab */}
          <TabsContent value="knowledge">
            <KnowledgeManager />
          </TabsContent>

          {/* Transcription Tab */}
          <TabsContent value="transcription">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AudioTranscriber 
                onTranscriptionComplete={(text) => {
                  setSessionNotes(prev => prev ? `${prev}\n\n${text}` : text);
                }}
              />
              <Card className="card-glass">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mic className="h-5 w-5" />
                    Sobre a Transcrição
                  </CardTitle>
                  <CardDescription>
                    Grave áudios de sessões e obtenha transcrições automáticas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Como funciona:</h4>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                      <li>Clique no botão de microfone para iniciar</li>
                      <li>Grave o áudio da sessão</li>
                      <li>Clique novamente para parar e transcrever</li>
                      <li>A transcrição é processada por IA</li>
                    </ul>
                  </div>
                  <div className="space-y-2 pt-4 border-t">
                    <h4 className="font-medium text-sm">Recursos:</h4>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                      <li>Identificação de pausas [pausa]</li>
                      <li>Marcação de emoções [choro], [riso]</li>
                      <li>Pontuação automática</li>
                      <li>Exportar como texto</li>
                    </ul>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      💡 A transcrição pode ser automaticamente adicionada às notas da sessão.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Realtime Transcription Tab */}
          <TabsContent value="realtime">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RealtimeTranscriber 
                onTranscriptionComplete={(text) => {
                  setSessionNotes(prev => prev ? `${prev}\n\n${text}` : text);
                }}
              />
              <Card className="card-glass h-[600px]">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Radio className="h-5 w-5 text-primary" />
                    Transcrição em Tempo Real
                  </CardTitle>
                  <CardDescription>
                    Use o reconhecimento de voz do navegador para transcrição instantânea
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Vantagens:</h4>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                      <li>Transcrição instantânea enquanto fala</li>
                      <li>Sem necessidade de esperar o áudio processar</li>
                      <li>Funciona offline após carregar</li>
                      <li>Ideal para anotações durante a sessão</li>
                    </ul>
                  </div>
                  <div className="space-y-2 pt-4 border-t">
                    <h4 className="font-medium text-sm">Vincular à Sessão:</h4>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                      <li>Clique no ícone de link na transcrição</li>
                      <li>Selecione o paciente e a sessão</li>
                      <li>A transcrição será anexada automaticamente</li>
                    </ul>
                  </div>
                  <div className="space-y-2 pt-4 border-t">
                    <h4 className="font-medium text-sm">Navegadores Suportados:</h4>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                      <li>Google Chrome (recomendado)</li>
                      <li>Microsoft Edge</li>
                      <li>Safari (macOS/iOS)</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Search Tab */}
          <TabsContent value="search">
            <ConversationSearch />
          </TabsContent>

          {/* Session Summary Tab */}
          <TabsContent value="session">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="card-glass">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Notas da Sessão
                  </CardTitle>
                  <CardDescription>
                    Cole ou digite as notas da sessão para gerar um resumo completo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Paciente (opcional)</Label>
                    <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o paciente" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Notas da Sessão</Label>
                    <Textarea
                      value={sessionNotes}
                      onChange={(e) => setSessionNotes(e.target.value)}
                      placeholder="Cole aqui as notas da sessão..."
                      className="min-h-[300px]"
                    />
                  </div>
                </CardContent>
              </Card>
              
              <AIChat 
                type="session_summary"
                context={{
                  patientName: selectedPatientName,
                  sessionNotes: sessionNotes,
                }}
                title="Resumo da Sessão"
                placeholder="Peça para resumir, identificar temas ou sugerir próximos passos..."
              />
            </div>
          </TabsContent>

          {/* Patient Analysis Tab */}
          <TabsContent value="analysis">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="card-glass">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Selecionar Paciente
                  </CardTitle>
                  <CardDescription>
                    Escolha um paciente para análise do prontuário
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Paciente</Label>
                    <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o paciente" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      A análise considerará:
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                      <li>Histórico de sessões</li>
                      <li>Notas e observações</li>
                      <li>Evolução do tratamento</li>
                      <li>Padrões recorrentes</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
              
              <div className="lg:col-span-2">
                <AIChat 
                  type="patient_analysis"
                  context={{
                    patientName: selectedPatientName,
                  }}
                  title="Análise de Prontuário"
                  placeholder="Peça para analisar padrões, evolução ou fazer recomendações..."
                />
              </div>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="card-glass">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Configurar Relatório
                  </CardTitle>
                  <CardDescription>
                    Escolha o tipo e os detalhes do relatório
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Paciente</Label>
                    <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o paciente" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Relatório</Label>
                    <Select value={reportType} onValueChange={setReportType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="evolucao">Relatório de Evolução</SelectItem>
                        <SelectItem value="encaminhamento">Relatório para Encaminhamento</SelectItem>
                        <SelectItem value="alta">Relatório de Alta</SelectItem>
                        <SelectItem value="pericial">Laudo Pericial</SelectItem>
                        <SelectItem value="escolar">Relatório Escolar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 pt-4 border-t">
                    <p className="text-sm font-medium">Dica:</p>
                    <p className="text-sm text-muted-foreground">
                      Forneça detalhes específicos no chat para personalizar o relatório.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <div className="lg:col-span-2">
                <AIChat 
                  type="report_generation"
                  context={{
                    patientName: selectedPatientName,
                    reportType: reportType,
                  }}
                  title="Gerador de Relatórios"
                  placeholder="Descreva o que precisa incluir no relatório..."
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AgentesIA;
