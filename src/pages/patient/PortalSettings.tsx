import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, FileText, MessageSquare, LogOut, Shield, UserCircle, Download, Loader2, Database, FileDown, ClipboardList, FolderOpen, BookOpen, Settings } from "lucide-react";
import { usePatientAuth } from "@/context/PatientAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PortalSettings = () => {
  const { logout, patient, isLoading } = usePatientAuth();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);

  const handleExportData = async () => {
    if (!patient?.id) {
      toast.error("Erro: ID do paciente não encontrado");
      return;
    }

    setExporting(true);
    try {
      // Buscar todos os dados do paciente
      const [
        { data: patientData },
        { data: appointments },
        { data: activities },
        { data: journalEntries },
        { data: messages },
        { data: treatmentPlan },
        { data: consents },
      ] = await Promise.all([
        supabase.from("patients").select("*").eq("id", patient.id).single(),
        supabase.from("appointments").select("*").eq("patient_id", patient.id),
        supabase.from("activities").select("*").eq("patient_id", patient.id),
        supabase.from("journal_entries").select("*").eq("patient_id", patient.id),
        supabase.from("secure_messages").select("*").eq("patient_id", patient.id),
        supabase.from("treatment_plans").select("*").eq("patient_id", patient.id).eq("is_shared_with_patient", true),
        supabase.from("patient_consents").select("*").eq("patient_id", patient.id),
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        exportVersion: "1.0",
        patient: {
          id: patientData?.id,
          name: patientData?.name,
          email: patientData?.email,
          phone: patientData?.phone,
          birthDate: patientData?.birth_date,
          createdAt: patientData?.created_at,
        },
        appointments: appointments?.map(a => ({
          date: a.date_time,
          duration: a.duration_minutes,
          mode: a.mode,
          status: a.status,
          notes: a.notes,
        })) || [],
        activities: activities?.map(a => ({
          title: a.title,
          description: a.description,
          status: a.status,
          dueDate: a.due_date,
          completedAt: a.completed_at,
          responses: a.patient_responses,
        })) || [],
        journal: journalEntries?.map(j => ({
          date: j.created_at,
          mood: j.mood,
          note: j.note,
        })) || [],
        messages: messages?.map(m => ({
          date: m.created_at,
          author: m.author,
          content: m.content,
          read: m.read,
        })) || [],
        treatmentPlans: treatmentPlan?.map(tp => ({
          status: tp.status,
          startDate: tp.start_date,
          progress: tp.current_progress,
          shortTermGoals: tp.short_term_goals,
          longTermGoals: tp.long_term_goals,
          approaches: tp.approaches,
        })) || [],
        consents: consents?.map(c => ({
          version: c.consent_version,
          type: c.consent_type,
          acceptedAt: c.accepted_at,
        })) || [],
      };

      // Criar e baixar o arquivo JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `meus-dados-${format(new Date(), "yyyy-MM-dd", { locale: ptBR })}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Dados exportados com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
      toast.error("Erro ao exportar dados. Tente novamente.");
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen section-gradient relative overflow-hidden">
      <div className="absolute -left-24 top-56 w-56 h-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -right-10 top-80 w-24 h-24 rounded-full bg-primary/10 blur-2xl" />

      {/* Top bar */}
      <div className="bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b border-border/60">
        <div className="container mx-auto px-4 max-w-6xl py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Equanimité Psychology</div>
                <div className="text-lg font-semibold">Portal do Paciente</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <UserCircle className="w-5 h-5 text-primary" />
                </div>
                <span>{patient?.name || 'Paciente'}</span>
              </div>
              <Button variant="outline" className="btn-outline-futuristic inline-flex items-center gap-2" onClick={() => { logout(); navigate('/portal'); }}>
                <LogOut className="w-4 h-4" /> Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl">
        {/* Tabs */}
        <div className="mt-4 border-b border-border/60">
          <div className="flex items-center gap-4 overflow-x-auto pb-3">
            <button onClick={() => navigate('/portal/app')} className="px-4 py-2 rounded-full text-sm border inline-flex items-center gap-2 bg-transparent text-muted-foreground border-border">
              <Shield className="w-4 h-4" /> Visão Geral
            </button>
            <button onClick={() => navigate('/portal/sessoes')} className="px-4 py-2 rounded-full text-sm border inline-flex items-center gap-2 bg-transparent text-muted-foreground border-border">
              <Calendar className="w-4 h-4" /> Sessões
            </button>
            <button onClick={() => navigate('/portal/atividades')} className="px-4 py-2 rounded-full text-sm border inline-flex items-center gap-2 bg-transparent text-muted-foreground border-border">
              <BookOpen className="w-4 h-4" /> Atividades
            </button>
            <button onClick={() => navigate('/portal/anotacoes')} className="px-4 py-2 rounded-full text-sm border inline-flex items-center gap-2 bg-transparent text-muted-foreground border-border">
              <FileText className="w-4 h-4" /> Anotações
            </button>
            <button onClick={() => navigate('/portal/mensagens')} className="px-4 py-2 rounded-full text-sm border inline-flex items-center gap-2 bg-transparent text-muted-foreground border-border">
              <MessageSquare className="w-4 h-4" /> Mensagens
            </button>
            <button onClick={() => navigate('/portal/plano')} className="px-4 py-2 rounded-full text-sm border inline-flex items-center gap-2 bg-transparent text-muted-foreground border-border">
              <ClipboardList className="w-4 h-4" /> Plano
            </button>
            <button onClick={() => navigate('/portal/materiais')} className="px-4 py-2 rounded-full text-sm border inline-flex items-center gap-2 bg-transparent text-muted-foreground border-border">
              <FolderOpen className="w-4 h-4" /> Materiais
            </button>
            <button className="px-4 py-2 rounded-full text-sm border inline-flex items-center gap-2 bg-primary/20 border-primary/50 text-foreground">
              <Settings className="w-4 h-4" /> Configurações
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="mt-8 space-y-6 pb-10">
          <h1 className="text-2xl font-display font-light">Configurações</h1>

          {/* Exportação de Dados */}
          <Card className="bg-card/95 border border-border/60 shadow-card rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Seus Dados (LGPD)
              </CardTitle>
              <CardDescription>
                Em conformidade com a Lei Geral de Proteção de Dados, você tem direito de acessar 
                todos os seus dados pessoais armazenados em nossa plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-sm">O que está incluído no export:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <UserCircle className="w-4 h-4" /> Dados do seu perfil
                  </li>
                  <li className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Histórico de agendamentos
                  </li>
                  <li className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> Atividades e respostas
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Entradas do diário
                  </li>
                  <li className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Mensagens trocadas
                  </li>
                  <li className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4" /> Plano de tratamento (se compartilhado)
                  </li>
                </ul>
              </div>

              <Button 
                onClick={handleExportData} 
                disabled={exporting}
                className="w-full sm:w-auto"
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4 mr-2" />
                    Baixar Meus Dados (JSON)
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground">
                O arquivo será baixado no formato JSON. Para solicitar a exclusão de seus dados, 
                entre em contato através das mensagens do portal.
              </p>
            </CardContent>
          </Card>

          {/* Informações de Privacidade */}
          <Card className="bg-card/95 border border-border/60 shadow-card rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Privacidade e Segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-sm mb-2">Seus Direitos</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Acesso aos dados pessoais</li>
                    <li>• Correção de dados incompletos</li>
                    <li>• Portabilidade dos dados</li>
                    <li>• Eliminação dos dados</li>
                    <li>• Revogação do consentimento</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-sm mb-2">Medidas de Segurança</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Criptografia de ponta a ponta</li>
                    <li>• Controle de acesso por funções</li>
                    <li>• Monitoramento contínuo</li>
                    <li>• Backups regulares</li>
                    <li>• Conformidade com LGPD</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PortalSettings;
