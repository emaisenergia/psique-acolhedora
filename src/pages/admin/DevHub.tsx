import { useState, useEffect, useMemo } from "react";
import AdminLayout from "./AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Monitor, Cpu, Zap, Shield, Smartphone, Cloud, Database,
  CheckCircle2, RotateCcw, ListChecks
} from "lucide-react";

// ─── Overview data (from DevOverview) ───
const overviewSections = [
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

// ─── URS data (from DevURS) ───
const ursData = [
  {
    id: "landing",
    tab: "Landing Page",
    title: "Landing Page Pública",
    route: "/",
    description: "Site institucional voltado para o público geral.",
    pages: [
      {
        name: "Página Inicial", route: "/",
        requirements: [
          { id: "LP-001", title: "Header com navegação", desc: "Cabeçalho fixo com logo, links de navegação, botão de tema e CTA de agendamento.", priority: "Alta" },
          { id: "LP-002", title: "Seção Hero", desc: "Título, subtítulo, imagem, indicador de horário e CTA.", priority: "Alta" },
          { id: "LP-003", title: "Seção Sobre", desc: "Informações sobre o profissional e abordagem.", priority: "Média" },
          { id: "LP-004", title: "Seção Serviços", desc: "Lista de serviços com descrição e ícones.", priority: "Alta" },
          { id: "LP-005", title: "Seção Processo Terapêutico", desc: "Passo a passo do processo terapêutico.", priority: "Média" },
          { id: "LP-006", title: "Seção Depoimentos", desc: "Avaliações em carrossel ou cards.", priority: "Média" },
          { id: "LP-007", title: "Seção Agendamento", desc: "CTA para agendamento com integração WhatsApp.", priority: "Alta" },
          { id: "LP-008", title: "Seção FAQ", desc: "Perguntas frequentes em accordion.", priority: "Baixa" },
          { id: "LP-009", title: "Seção Blog", desc: "Artigos recentes com link para listagem.", priority: "Baixa" },
          { id: "LP-010", title: "Seção Contato", desc: "Informações de contato e/ou formulário.", priority: "Média" },
          { id: "LP-011", title: "Footer", desc: "Rodapé com links legais e redes sociais.", priority: "Média" },
          { id: "LP-012", title: "Widget WhatsApp", desc: "Botão flutuante de WhatsApp.", priority: "Alta" },
          { id: "LP-013", title: "Botão Scroll to Top", desc: "Botão para retornar ao topo.", priority: "Baixa" },
        ],
      },
      {
        name: "Blog — Listagem", route: "/blog",
        requirements: [
          { id: "BL-001", title: "Listagem de artigos", desc: "Cards com título, excerto, imagem, categoria, data e autor.", priority: "Média" },
          { id: "BL-002", title: "Filtros e busca", desc: "Filtragem por categoria e busca textual.", priority: "Baixa" },
        ],
      },
      {
        name: "Blog — Artigo", route: "/blog/:slug",
        requirements: [
          { id: "BA-001", title: "Visualização de artigo", desc: "Conteúdo completo em Markdown com GFM.", priority: "Média" },
          { id: "BA-002", title: "Metadados", desc: "Autor, data, categoria, tags e views.", priority: "Baixa" },
        ],
      },
      {
        name: "Política de Privacidade", route: "/politica-de-privacidade",
        requirements: [{ id: "PP-001", title: "Conteúdo completo", desc: "Política de privacidade conforme LGPD.", priority: "Alta" }],
      },
      {
        name: "Termos de Uso", route: "/termos-de-uso",
        requirements: [{ id: "TU-001", title: "Conteúdo completo", desc: "Termos de uso completos.", priority: "Alta" }],
      },
      {
        name: "Ações de Agendamento", route: "/agendamento/*",
        requirements: [
          { id: "AA-001", title: "Confirmar consulta", desc: "Confirmação via token com validação.", priority: "Alta" },
          { id: "AA-002", title: "Cancelar consulta", desc: "Cancelamento via token com motivo.", priority: "Alta" },
          { id: "AA-003", title: "Reagendar consulta", desc: "Reagendamento via token.", priority: "Alta" },
        ],
      },
    ],
  },
  {
    id: "admin",
    tab: "Painel Admin",
    title: "Painel Administrativo",
    route: "/admin/*",
    description: "Sistema de gestão completo para psicólogos e administradores.",
    pages: [
      {
        name: "Login", route: "/admin/login",
        requirements: [
          { id: "AL-001", title: "Autenticação", desc: "Login com email e senha, redirecionamento após login.", priority: "Alta" },
          { id: "AL-002", title: "Controle de acesso", desc: "Apenas admin ou psychologist.", priority: "Alta" },
        ],
      },
      {
        name: "Dashboard", route: "/admin",
        requirements: [
          { id: "AD-001", title: "KPIs", desc: "Cards com métricas: pacientes, sessões, receita, ocupação.", priority: "Alta" },
          { id: "AD-002", title: "Alertas de no-show", desc: "Pacientes que faltaram recentemente.", priority: "Média" },
          { id: "AD-003", title: "Alertas de pacotes", desc: "Pacotes próximos do vencimento.", priority: "Média" },
          { id: "AD-004", title: "Pacientes favoritos", desc: "Acesso rápido aos favoritos.", priority: "Baixa" },
          { id: "AD-005", title: "Métricas de agendamento", desc: "Estatísticas de consultas.", priority: "Média" },
          { id: "AD-006", title: "Métricas de ocupação", desc: "Percentual de ocupação.", priority: "Média" },
          { id: "AD-007", title: "Aniversários", desc: "Pacientes com aniversário próximo.", priority: "Baixa" },
        ],
      },
      {
        name: "Pacientes", route: "/admin/pacientes",
        requirements: [
          { id: "AP-001", title: "Listagem", desc: "Tabela paginada com busca e filtros.", priority: "Alta" },
          { id: "AP-002", title: "Cadastro", desc: "Formulário completo de cadastro.", priority: "Alta" },
          { id: "AP-003", title: "Edição", desc: "Edição de todos os campos.", priority: "Alta" },
          { id: "AP-004", title: "Favoritar", desc: "Toggle de favorito.", priority: "Baixa" },
          { id: "AP-005", title: "Exclusão", desc: "Exclusão com confirmação (admin).", priority: "Média" },
        ],
      },
      {
        name: "Perfil do Paciente", route: "/admin/pacientes/:id",
        requirements: [
          { id: "PP-001", title: "Dados pessoais", desc: "Visualização e edição dos dados.", priority: "Alta" },
          { id: "PP-002", title: "Sessões", desc: "CRUD de sessões com todos os campos.", priority: "Alta" },
          { id: "PP-003", title: "IA nas Sessões", desc: "Resumo, insights e relatório por IA.", priority: "Alta" },
          { id: "PP-004", title: "Arquivos de sessão", desc: "Upload e download de arquivos.", priority: "Média" },
          { id: "PP-005", title: "Plano de tratamento", desc: "CRUD com versionamento e progresso.", priority: "Alta" },
          { id: "PP-006", title: "Geração de plano por IA", desc: "Geração automática baseada no histórico.", priority: "Média" },
          { id: "PP-007", title: "Atividades/Tarefas", desc: "Atribuição com templates e feedback.", priority: "Alta" },
          { id: "PP-008", title: "Mensagens seguras", desc: "Mensagens com leitura e urgência.", priority: "Média" },
          { id: "PP-009", title: "Diário", desc: "Entradas de diário do paciente.", priority: "Baixa" },
          { id: "PP-010", title: "Pacotes de sessões", desc: "CRUD de pacotes.", priority: "Média" },
          { id: "PP-011", title: "Recursos terapêuticos", desc: "Compartilhamento com controle de visibilidade.", priority: "Média" },
          { id: "PP-012", title: "Estatísticas", desc: "Frequência, humor, atividades.", priority: "Baixa" },
        ],
      },
      {
        name: "Agendamentos", route: "/admin/agendamentos",
        requirements: [
          { id: "AG-001", title: "Calendário semanal", desc: "Grade com horas e dias.", priority: "Alta" },
          { id: "AG-002", title: "Criar agendamento", desc: "Dialog com todos os campos.", priority: "Alta" },
          { id: "AG-003", title: "Editar agendamento", desc: "Alteração de todos os campos.", priority: "Alta" },
          { id: "AG-004", title: "Bloquear horário", desc: "Bloqueios com motivo.", priority: "Média" },
          { id: "AG-005", title: "Lista de espera", desc: "Gerenciamento de espera.", priority: "Média" },
          { id: "AG-006", title: "Ações via WhatsApp", desc: "Menu de mensagens WhatsApp.", priority: "Média" },
          { id: "AG-007", title: "Configuração de agenda", desc: "Horários por dia e clínica.", priority: "Alta" },
          { id: "AG-008", title: "Google Calendar", desc: "Sincronização bidirecional.", priority: "Média" },
          { id: "AG-009", title: "Convênios", desc: "Gerenciamento de convênios.", priority: "Média" },
          { id: "AG-010", title: "Navegação temporal", desc: "Navegação entre semanas.", priority: "Alta" },
        ],
      },
      {
        name: "Tarefas de Casa", route: "/admin/tarefas-casa",
        requirements: [
          { id: "TC-001", title: "Templates", desc: "CRUD de templates de atividades.", priority: "Alta" },
          { id: "TC-002", title: "Campos personalizados", desc: "Builder de formulários.", priority: "Alta" },
          { id: "TC-003", title: "Templates predefinidos", desc: "Biblioteca CBT.", priority: "Média" },
          { id: "TC-004", title: "Atribuição", desc: "Seleção de paciente e template.", priority: "Alta" },
        ],
      },
      {
        name: "Financeiro", route: "/admin/financeiro",
        requirements: [
          { id: "FI-001", title: "Transações", desc: "CRUD de receitas e despesas.", priority: "Alta" },
          { id: "FI-002", title: "Filtros", desc: "Filtro por período e tipo.", priority: "Alta" },
          { id: "FI-003", title: "Gráficos", desc: "Receita vs despesa ao longo do tempo.", priority: "Média" },
          { id: "FI-004", title: "Metas financeiras", desc: "Meta mensal com progresso.", priority: "Média" },
          { id: "FI-005", title: "Transações recorrentes", desc: "Despesas fixas mensais.", priority: "Média" },
          { id: "FI-006", title: "Inadimplência", desc: "Relatório de atrasos.", priority: "Média" },
          { id: "FI-007", title: "Analytics avançado", desc: "Análises por clínica e convênio.", priority: "Baixa" },
          { id: "FI-008", title: "Exportação", desc: "Exportação Excel.", priority: "Média" },
        ],
      },
      {
        name: "Agentes de IA", route: "/admin/agentes-ia",
        requirements: [
          { id: "IA-001", title: "Chat com IA", desc: "Interface de chat para auxílio clínico.", priority: "Alta" },
          { id: "IA-002", title: "Histórico", desc: "Salvamento e recuperação de conversas.", priority: "Média" },
          { id: "IA-003", title: "Busca", desc: "Pesquisa no histórico.", priority: "Baixa" },
          { id: "IA-004", title: "Prompts favoritos", desc: "Biblioteca de prompts reutilizáveis.", priority: "Média" },
          { id: "IA-005", title: "Base de conhecimento", desc: "Upload de documentos para contexto.", priority: "Média" },
          { id: "IA-006", title: "Dashboard de uso", desc: "Métricas de utilização.", priority: "Baixa" },
          { id: "IA-007", title: "Transcrição de áudio", desc: "Upload e transcrição via IA.", priority: "Média" },
          { id: "IA-008", title: "Transcrição em tempo real", desc: "Captura e transcrição ao vivo.", priority: "Média" },
        ],
      },
      {
        name: "Prontuários", route: "/admin/prontuarios",
        requirements: [
          { id: "PR-001", title: "Lista de pendentes", desc: "Consultas concluídas sem notas.", priority: "Alta" },
          { id: "PR-002", title: "Preenchimento rápido", desc: "Acesso direto ao formulário.", priority: "Alta" },
        ],
      },
      {
        name: "Arquivos", route: "/admin/arquivos",
        requirements: [
          { id: "AQ-001", title: "Gerenciador", desc: "Upload, download e exclusão.", priority: "Média" },
          { id: "AQ-002", title: "Tags", desc: "Etiquetas coloridas.", priority: "Baixa" },
        ],
      },
      {
        name: "Blog", route: "/admin/blog",
        requirements: [
          { id: "BG-001", title: "CRUD de artigos", desc: "Criação e edição completa.", priority: "Média" },
          { id: "BG-002", title: "Publicação", desc: "Toggle rascunho/publicado.", priority: "Média" },
          { id: "BG-003", title: "Acesso restrito", desc: "Apenas admin.", priority: "Alta" },
        ],
      },
      {
        name: "Profissionais", route: "/admin/profissionais",
        requirements: [
          { id: "PF-001", title: "Gestão de usuários", desc: "Listagem e gerenciamento de roles.", priority: "Alta" },
          { id: "PF-002", title: "Acesso restrito", desc: "Apenas admin.", priority: "Alta" },
        ],
      },
      {
        name: "Lembretes", route: "/admin/lembretes",
        requirements: [
          { id: "LB-001", title: "Histórico", desc: "Lembretes enviados com status.", priority: "Média" },
        ],
      },
      {
        name: "Configurações", route: "/admin/configuracoes",
        requirements: [
          { id: "CF-001", title: "Perfil profissional", desc: "Nome, CRP, bio, telefone, timezone.", priority: "Alta" },
          { id: "CF-002", title: "Preferências", desc: "Tema, idioma, notificações.", priority: "Média" },
          { id: "CF-003", title: "Agenda", desc: "Horários e intervalos.", priority: "Alta" },
          { id: "CF-004", title: "Clínicas", desc: "CRUD de clínicas.", priority: "Média" },
          { id: "CF-005", title: "Convênios", desc: "Gestão de convênios.", priority: "Média" },
          { id: "CF-006", title: "Preços", desc: "Tabela de preços por serviço.", priority: "Média" },
        ],
      },
    ],
  },
  {
    id: "portal",
    tab: "Portal Paciente",
    title: "Portal do Paciente",
    route: "/portal/*",
    description: "Área exclusiva para pacientes.",
    pages: [
      {
        name: "Login / Cadastro", route: "/portal",
        requirements: [
          { id: "PL-001", title: "Login", desc: "Formulário com email e senha.", priority: "Alta" },
          { id: "PL-002", title: "Cadastro", desc: "Registro com vinculação automática.", priority: "Alta" },
          { id: "PL-003", title: "Recuperação de senha", desc: "Redefinição via email.", priority: "Alta" },
        ],
      },
      {
        name: "Home", route: "/portal/app",
        requirements: [
          { id: "PH-001", title: "Resumo", desc: "Próximas consultas e atividades pendentes.", priority: "Alta" },
          { id: "PH-002", title: "Ações rápidas", desc: "Cards de navegação.", priority: "Média" },
          { id: "PH-003", title: "Progresso", desc: "Barra de progresso do plano.", priority: "Média" },
          { id: "PH-004", title: "Consentimento LGPD", desc: "Dialog de aceite com registro.", priority: "Alta" },
        ],
      },
      {
        name: "Sessões", route: "/portal/sessoes",
        requirements: [
          { id: "PS-001", title: "Histórico", desc: "Listagem com data, status e duração.", priority: "Alta" },
          { id: "PS-002", title: "Detalhes", desc: "Visualização dos detalhes.", priority: "Média" },
        ],
      },
      {
        name: "Plano de Tratamento", route: "/portal/plano",
        requirements: [
          { id: "PT-001", title: "Visualização", desc: "Plano compartilhado pelo profissional.", priority: "Média" },
          { id: "PT-002", title: "Progresso", desc: "Barra visual de progresso.", priority: "Média" },
        ],
      },
      {
        name: "Atividades", route: "/portal/atividades",
        requirements: [
          { id: "PA-001", title: "Lista de tarefas", desc: "Atividades com status e prazo.", priority: "Alta" },
          { id: "PA-002", title: "Preenchimento", desc: "Formulário dinâmico.", priority: "Alta" },
          { id: "PA-003", title: "Histórico de respostas", desc: "Respostas anteriores e feedback.", priority: "Média" },
          { id: "PA-004", title: "Thread de feedback", desc: "Comunicação bidirecional.", priority: "Média" },
        ],
      },
      {
        name: "Anotações / Diário", route: "/portal/anotacoes",
        requirements: [
          { id: "PD-001", title: "Criar entrada", desc: "Humor e texto livre.", priority: "Média" },
          { id: "PD-002", title: "Histórico", desc: "Listagem cronológica.", priority: "Média" },
          { id: "PD-003", title: "Edição e exclusão", desc: "Editar/excluir próprias entradas.", priority: "Baixa" },
        ],
      },
      {
        name: "Mensagens", route: "/portal/mensagens",
        requirements: [
          { id: "PM-001", title: "Enviar mensagem", desc: "Texto e flag de urgência.", priority: "Alta" },
          { id: "PM-002", title: "Histórico", desc: "Mensagens em ordem cronológica.", priority: "Alta" },
        ],
      },
      {
        name: "Materiais", route: "/portal/materiais",
        requirements: [
          { id: "PMT-001", title: "Visualização", desc: "Recursos compartilhados.", priority: "Média" },
          { id: "PMT-002", title: "Registro de visualização", desc: "Registrar quando visualizou.", priority: "Baixa" },
        ],
      },
      {
        name: "Configurações", route: "/portal/configuracoes",
        requirements: [
          { id: "PC-001", title: "Perfil", desc: "Edição dos dados pessoais.", priority: "Média" },
        ],
      },
    ],
  },
  {
    id: "transversal",
    tab: "Transversal",
    title: "Requisitos Transversais",
    route: "N/A",
    description: "Requisitos não-funcionais que se aplicam a todo o sistema.",
    pages: [
      {
        name: "Autenticação e Autorização", route: "Global",
        requirements: [
          { id: "TR-001", title: "Roles", desc: "Sistema de papéis: admin, psychologist, patient.", priority: "Alta" },
          { id: "TR-002", title: "RLS", desc: "Row Level Security em todas as tabelas.", priority: "Alta" },
          { id: "TR-003", title: "Rotas protegidas", desc: "ProtectedRoute e PatientProtectedRoute.", priority: "Alta" },
        ],
      },
      {
        name: "Performance", route: "Global",
        requirements: [
          { id: "TR-004", title: "Code splitting", desc: "Lazy loading de todas as rotas.", priority: "Média" },
          { id: "TR-005", title: "Cache de dados", desc: "React Query com staleTime.", priority: "Média" },
          { id: "TR-006", title: "Imagens", desc: "Lazy loading de imagens.", priority: "Baixa" },
        ],
      },
      {
        name: "UX", route: "Global",
        requirements: [
          { id: "TR-007", title: "Tema", desc: "Claro e escuro com toggle.", priority: "Média" },
          { id: "TR-008", title: "Responsividade", desc: "Layout adaptativo.", priority: "Alta" },
          { id: "TR-009", title: "Feedback visual", desc: "Toasts e sonner.", priority: "Média" },
          { id: "TR-010", title: "Atalhos", desc: "Atalhos de teclado globais.", priority: "Baixa" },
          { id: "TR-011", title: "Animações", desc: "Framer Motion.", priority: "Baixa" },
          { id: "TR-012", title: "Error Boundary", desc: "Tratamento global de erros.", priority: "Alta" },
        ],
      },
      {
        name: "SEO", route: "Páginas públicas",
        requirements: [
          { id: "TR-013", title: "Meta tags", desc: "Title, description, og:image.", priority: "Média" },
          { id: "TR-014", title: "Robots.txt", desc: "Arquivo configurado.", priority: "Baixa" },
          { id: "TR-015", title: "HTML semântico", desc: "Tags semânticas na landing page.", priority: "Média" },
        ],
      },
    ],
  },
];

const STORAGE_KEY = "equanimite-dev-checklist";

const priorityColor = (p: string) => {
  if (p === "Alta") return "bg-destructive/10 text-destructive border-destructive/20";
  if (p === "Média") return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
  return "bg-muted text-muted-foreground border-border";
};

// ─── Overview Tab ───
const OverviewTab = () => (
  <div className="grid gap-6">
    {overviewSections.map((section) => (
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
);

// ─── URS Tab ───
const URSTab = () => {
  const totalReqs = ursData.reduce((acc, s) => acc + s.pages.reduce((a, p) => a + p.requirements.length, 0), 0);
  const totalPages = ursData.reduce((acc, s) => acc + s.pages.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex gap-3 flex-wrap">
        <Badge variant="outline" className="text-sm">{totalPages} páginas documentadas</Badge>
        <Badge variant="outline" className="text-sm">{totalReqs} requisitos mapeados</Badge>
      </div>

      <Tabs defaultValue="landing">
        <TabsList className="flex flex-wrap h-auto gap-1">
          {ursData.map((s) => (
            <TabsTrigger key={s.id} value={s.id} className="text-sm">{s.tab}</TabsTrigger>
          ))}
        </TabsList>
        {ursData.map((section) => (
          <TabsContent key={section.id} value={section.id} className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">{section.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{section.description}</p>
                <p className="text-xs text-muted-foreground">Rota base: <code className="bg-muted px-1 py-0.5 rounded text-xs">{section.route}</code></p>
              </CardHeader>
            </Card>
            <Accordion type="multiple" className="space-y-2">
              {section.pages.map((page, pi) => (
                <AccordionItem key={pi} value={`page-${pi}`} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <span className="font-semibold">{page.name}</span>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded hidden sm:inline">{page.route}</code>
                      <Badge variant="secondary" className="text-[10px]">{page.requirements.length} req.</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pt-2">
                      {page.requirements.map((req) => (
                        <div key={req.id} className="flex flex-col sm:flex-row gap-2 p-3 rounded-lg bg-muted/20 border border-border/30">
                          <div className="flex items-center gap-2 min-w-[180px] shrink-0">
                            <code className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">{req.id}</code>
                            <Badge variant="outline" className={`text-[10px] ${priorityColor(req.priority)}`}>{req.priority}</Badge>
                          </div>
                          <div>
                            <span className="font-medium text-sm">{req.title}</span>
                            <p className="text-sm text-muted-foreground mt-0.5">{req.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

// ─── Checklist Tab ───
const ChecklistTab = () => {
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
  }, [checked]);

  const toggle = (id: string) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  const allIds = useMemo(() =>
    ursData.flatMap((s) => s.pages.flatMap((p) => p.requirements.map((r) => r.id))),
    []
  );

  const totalChecked = allIds.filter((id) => checked[id]).length;
  const totalItems = allIds.length;
  const progressPercent = totalItems > 0 ? Math.round((totalChecked / totalItems) * 100) : 0;

  const resetAll = () => setChecked({});

  const getSectionStats = (section: typeof ursData[0]) => {
    const ids = section.pages.flatMap((p) => p.requirements.map((r) => r.id));
    const done = ids.filter((id) => checked[id]).length;
    return { done, total: ids.length };
  };

  const getPageStats = (page: typeof ursData[0]["pages"][0]) => {
    const ids = page.requirements.map((r) => r.id);
    const done = ids.filter((id) => checked[id]).length;
    return { done, total: ids.length };
  };

  return (
    <div className="space-y-6">
      {/* Global progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <ListChecks className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-semibold">Progresso Geral da Verificação</h3>
                <p className="text-sm text-muted-foreground">
                  {totalChecked} de {totalItems} itens verificados ({progressPercent}%)
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={resetAll} className="gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" />
              Resetar
            </Button>
          </div>
          <Progress value={progressPercent} className="h-3" />
        </CardContent>
      </Card>

      {/* Section checklists */}
      <Tabs defaultValue="landing">
        <TabsList className="flex flex-wrap h-auto gap-1">
          {ursData.map((s) => {
            const stats = getSectionStats(s);
            return (
              <TabsTrigger key={s.id} value={s.id} className="text-sm gap-1.5">
                {s.tab}
                <Badge
                  variant={stats.done === stats.total ? "default" : "secondary"}
                  className={`text-[10px] ml-1 ${stats.done === stats.total ? "bg-emerald-600 text-white" : ""}`}
                >
                  {stats.done}/{stats.total}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {ursData.map((section) => {
          const sectionStats = getSectionStats(section);
          const sectionPercent = sectionStats.total > 0 ? Math.round((sectionStats.done / sectionStats.total) * 100) : 0;

          return (
            <TabsContent key={section.id} value={section.id} className="mt-4 space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{section.title}</h3>
                      <p className="text-sm text-muted-foreground">{sectionStats.done}/{sectionStats.total} verificados</p>
                    </div>
                    {sectionStats.done === sectionStats.total && sectionStats.total > 0 && (
                      <Badge className="bg-emerald-600 text-white gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Completo
                      </Badge>
                    )}
                  </div>
                  <Progress value={sectionPercent} className="h-2" />
                </CardContent>
              </Card>

              <Accordion type="multiple" defaultValue={section.pages.map((_, i) => `page-${i}`)} className="space-y-2">
                {section.pages.map((page, pi) => {
                  const pageStats = getPageStats(page);
                  const pageComplete = pageStats.done === pageStats.total && pageStats.total > 0;

                  return (
                    <AccordionItem key={pi} value={`page-${pi}`} className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 text-left flex-1">
                          <span className={`font-semibold ${pageComplete ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                            {page.name}
                          </span>
                          <Badge
                            variant={pageComplete ? "default" : "secondary"}
                            className={`text-[10px] ${pageComplete ? "bg-emerald-600 text-white" : ""}`}
                          >
                            {pageStats.done}/{pageStats.total}
                          </Badge>
                          {pageComplete && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-1.5 pt-2">
                          {page.requirements.map((req) => (
                            <label
                              key={req.id}
                              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                checked[req.id]
                                  ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
                                  : "bg-muted/20 border-border/30 hover:bg-muted/40"
                              }`}
                            >
                              <Checkbox
                                checked={!!checked[req.id]}
                                onCheckedChange={() => toggle(req.id)}
                                className="mt-0.5"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <code className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">{req.id}</code>
                                  <span className={`font-medium text-sm ${checked[req.id] ? "line-through text-muted-foreground" : ""}`}>
                                    {req.title}
                                  </span>
                                  <Badge variant="outline" className={`text-[10px] ${priorityColor(req.priority)}`}>{req.priority}</Badge>
                                </div>
                                <p className={`text-sm mt-0.5 ${checked[req.id] ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
                                  {req.desc}
                                </p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

// ─── Main Hub ───
const DevHub = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">🛠️ DEV — Central de Desenvolvimento</h1>
          <p className="text-muted-foreground mt-1">
            Documentação técnica, requisitos e verificação de funcionamento do sistema Equanimité.
          </p>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="h-auto flex flex-wrap gap-1">
            <TabsTrigger value="overview" className="text-sm gap-1.5">
              <Monitor className="w-4 h-4" /> Visão Geral
            </TabsTrigger>
            <TabsTrigger value="urs" className="text-sm gap-1.5">
              <ListChecks className="w-4 h-4" /> URS
            </TabsTrigger>
            <TabsTrigger value="checklist" className="text-sm gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Verificação
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="urs" className="mt-6">
            <URSTab />
          </TabsContent>

          <TabsContent value="checklist" className="mt-6">
            <ChecklistTab />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default DevHub;
