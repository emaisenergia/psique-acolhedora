import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard, Users, CalendarDays, Wallet, Sparkles, Folder, FileText,
  Settings, FileEdit, ClipboardList, Bell, Globe, Shield, Database, Cpu,
  Smartphone, Monitor, Moon, Sun, Zap, Lock, Cloud, MessageSquare
} from "lucide-react";

const sections = [
  {
    title: "Áreas do Sistema",
    icon: Monitor,
    items: [
      { name: "Landing Page Pública", desc: "Site institucional com Hero, Sobre, Serviços, Processo Terapêutico, Depoimentos, FAQ, Blog, Contato e agendamento.", badge: "Público" },
      { name: "Painel Administrativo", desc: "Gestão completa do consultório: pacientes, agenda, financeiro, prontuários, IA, arquivos, blog, configurações.", badge: "Admin/Psicólogo" },
      { name: "Portal do Paciente", desc: "Área do paciente com sessões, plano de tratamento, atividades, diário, mensagens, materiais e configurações.", badge: "Paciente" },
    ],
  },
  {
    title: "Tecnologias Utilizadas",
    icon: Cpu,
    items: [
      { name: "Frontend", desc: "React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Shadcn/UI, React Router v6, TanStack React Query." },
      { name: "Backend", desc: "Lovable Cloud com banco de dados PostgreSQL, autenticação, storage, edge functions e secrets." },
      { name: "IA", desc: "Lovable AI para resumos de sessão, insights clínicos, transcrição de áudio e geração de planos de tratamento." },
      { name: "Integrações", desc: "Google Calendar (sincronização), WhatsApp (links diretos), Exportação Excel/PDF." },
    ],
  },
  {
    title: "Funcionalidades Principais",
    icon: Zap,
    items: [
      { name: "Gestão de Pacientes", desc: "CRUD completo, favoritos, status ativo/inativo, vinculação a convênios, histórico completo por perfil." },
      { name: "Agendamentos", desc: "Calendário semanal, bloqueio de horários, lista de espera, múltiplas clínicas, modalidade presencial/online, pacotes." },
      { name: "Sessões e Prontuários", desc: "Notas clínicas, transcrição, humor do paciente, resumo por IA, insights, temas recorrentes, upload de arquivos." },
      { name: "Financeiro", desc: "Receitas e despesas, gráficos, metas mensais, transações recorrentes, inadimplência, exportação." },
      { name: "Agentes de IA", desc: "Chat com IA, histórico de conversas, prompts favoritos, base de conhecimento, transcrição em tempo real." },
      { name: "Tarefas de Casa", desc: "Templates com campos personalizados, templates CBT predefinidos, atribuição, acompanhamento e feedback." },
      { name: "Plano de Tratamento", desc: "Objetivos, metas curto/longo prazo, progresso, versionamento, compartilhamento com paciente, geração por IA." },
      { name: "Mensagens Seguras", desc: "Comunicação paciente-profissional, marcação de urgência, indicador de leitura." },
      { name: "Blog", desc: "CRUD de artigos, publicação, categorias, tags, imagem de capa, contagem de views." },
      { name: "Lembretes", desc: "Envio automático via edge function, histórico de entrega, tipos de lembrete." },
    ],
  },
  {
    title: "Segurança e Compliance",
    icon: Shield,
    items: [
      { name: "Autenticação", desc: "Login com email/senha, roles (admin, psychologist, patient), rotas protegidas, verificação de email." },
      { name: "RLS (Row Level Security)", desc: "Políticas de segurança em todas as 25+ tabelas garantindo isolamento de dados por papel do usuário." },
      { name: "LGPD", desc: "Consentimento do paciente com versionamento, política de privacidade, termos de uso." },
      { name: "Auditoria", desc: "Log de auditoria para sessões com campos alterados, responsável e timestamp." },
    ],
  },
  {
    title: "UX e Acessibilidade",
    icon: Smartphone,
    items: [
      { name: "Responsividade", desc: "Layout adaptativo mobile-first com sidebar colapsável e header mobile." },
      { name: "Tema Claro/Escuro", desc: "Toggle manual + detecção automática do sistema operacional." },
      { name: "Code Splitting", desc: "Lazy loading de todas as rotas para performance otimizada." },
      { name: "Atalhos de Teclado", desc: "Navegação rápida com atalhos globais (⌘K para busca, etc.)." },
      { name: "Animações", desc: "Framer Motion com FadeIn, SlideIn, ScaleIn e StaggerChildren." },
      { name: "Error Boundary", desc: "Tratamento global de erros com fallback amigável." },
    ],
  },
  {
    title: "Edge Functions (Backend)",
    icon: Cloud,
    items: [
      { name: "ai-agent", desc: "Assistente de IA para auxílio clínico." },
      { name: "appointment-actions", desc: "Confirmação, cancelamento e reagendamento via token público." },
      { name: "create-admin-user", desc: "Criação de usuário administrador." },
      { name: "generate-session-summary", desc: "Geração de resumos e insights de sessão via IA." },
      { name: "generate-treatment-plan", desc: "Geração de plano de tratamento via IA." },
      { name: "google-calendar-auth", desc: "Autenticação OAuth para Google Calendar." },
      { name: "google-calendar-sync", desc: "Sincronização bidirecional de eventos." },
      { name: "send-appointment-reminders", desc: "Envio automático de lembretes de consulta." },
      { name: "send-notification-email", desc: "Envio de emails de notificação." },
      { name: "transcribe-audio", desc: "Transcrição de áudio via IA." },
    ],
  },
  {
    title: "Banco de Dados",
    icon: Database,
    items: [
      { name: "25+ Tabelas", desc: "patients, appointments, sessions, session_files, activities, treatment_plans, financial_transactions, blog_posts, clinics, insurances, waitlist, secure_messages, journal_entries, therapeutic_resources, ai_conversations, ai_messages, homework_templates, session_packages, user_roles, admin_profiles, admin_preferences, clinic_schedule_config, schedule_breaks, reminder_logs, patient_consents, entre outras." },
      { name: "Relacionamentos", desc: "Chaves estrangeiras entre pacientes ↔ agendamentos ↔ sessões ↔ planos, com cascade e integridade referencial." },
    ],
  },
];

const DevOverview = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">🛠️ DEV — Visão Geral do Sistema</h1>
          <p className="text-muted-foreground mt-1">
            Documentação técnica completa de todas as funcionalidades, tecnologias e áreas do sistema Equanimité.
          </p>
        </div>

        <div className="grid gap-6">
          {sections.map((section) => (
            <Card key={section.title}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <section.icon className="w-5 h-5 text-primary" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {section.items.map((item, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
                      <div className="flex items-center gap-2 min-w-[200px]">
                        <span className="font-semibold text-sm">{item.name}</span>
                        {"badge" in item && item.badge && (
                          <Badge variant="secondary" className="text-[10px]">{item.badge}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default DevOverview;
