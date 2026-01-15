import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AIChat } from "@/components/ai/AIChat";
import { usePatients } from "@/hooks/usePatients";
import { 
  Bot, 
  MessageSquare, 
  FileText, 
  Brain, 
  ClipboardList,
  Sparkles,
  Loader2
} from "lucide-react";
import { useAIAgent } from "@/hooks/useAIAgent";

const AgentesIA = () => {
  const { patients } = usePatients();
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [reportType, setReportType] = useState("evolucao");

  // Get patient name for context
  const selectedPatientName = patients.find(p => p.id === selectedPatient)?.name || "";

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
              Assistentes inteligentes para otimizar seu trabalho clínico
            </p>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="card-glass">
            <CardHeader className="pb-2">
              <MessageSquare className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-base">Chat Assistente</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Tire dúvidas e receba ajuda com tarefas administrativas
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
                Gere resumos e insights a partir das notas da sessão
              </p>
            </CardContent>
          </Card>

          <Card className="card-glass">
            <CardHeader className="pb-2">
              <Brain className="h-8 w-8 text-purple-500 mb-2" />
              <CardTitle className="text-base">Análise de Prontuário</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Identifique padrões e evolução no histórico do paciente
              </p>
            </CardContent>
          </Card>

          <Card className="card-glass">
            <CardHeader className="pb-2">
              <FileText className="h-8 w-8 text-green-500 mb-2" />
              <CardTitle className="text-base">Gerador de Relatórios</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Crie relatórios clínicos profissionais automaticamente
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different agents */}
        <Tabs defaultValue="chat" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="session" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Sessão
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Análise
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Relatórios
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AIChat 
                  type="chat"
                  title="Chat Assistente"
                  placeholder="Pergunte sobre práticas clínicas, gestão do consultório..."
                />
              </div>
              <div className="space-y-4">
                <Card className="card-glass">
                  <CardHeader>
                    <CardTitle className="text-base">Sugestões de Uso</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start text-left h-auto py-2">
                      "Como organizar melhor minha agenda?"
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start text-left h-auto py-2">
                      "Técnicas para pacientes com ansiedade"
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start text-left h-auto py-2">
                      "Como lidar com faltas recorrentes?"
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start text-left h-auto py-2">
                      "Sugestões de intervenções para adolescentes"
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
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
