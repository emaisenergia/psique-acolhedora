import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const ursData = [
  {
    id: "landing",
    tab: "Landing Page",
    title: "Landing Page Pública",
    route: "/",
    description: "Site institucional voltado para o público geral, com o objetivo de apresentar o profissional, seus serviços e facilitar o contato/agendamento.",
    pages: [
      {
        name: "Página Inicial",
        route: "/",
        requirements: [
          { id: "LP-001", title: "Header com navegação", desc: "O sistema deve exibir um cabeçalho fixo com logo, links de navegação para seções da página (Sobre, Serviços, Blog, Contato), botão de tema claro/escuro e CTA de agendamento.", priority: "Alta" },
          { id: "LP-002", title: "Seção Hero", desc: "Deve conter título principal, subtítulo descritivo, imagem do profissional, indicador de horário de atendimento (07:00 às 19:00 — Atendimento online), e botão de ação (CTA) para agendamento.", priority: "Alta" },
          { id: "LP-003", title: "Seção Sobre", desc: "Deve apresentar informações sobre o profissional, formação, abordagem terapêutica e filosofia de trabalho.", priority: "Média" },
          { id: "LP-004", title: "Seção Serviços", desc: "Lista de serviços oferecidos com descrição, ícones e categorização (individual, casal, etc.).", priority: "Alta" },
          { id: "LP-005", title: "Seção Processo Terapêutico", desc: "Explicação passo a passo de como funciona o processo terapêutico, desde o primeiro contato até o acompanhamento.", priority: "Média" },
          { id: "LP-006", title: "Seção Depoimentos", desc: "Exibição de avaliações e depoimentos de pacientes em formato de carrossel ou cards.", priority: "Média" },
          { id: "LP-007", title: "Seção Agendamento", desc: "Formulário ou CTA para agendamento de consultas, com integração para contato via WhatsApp.", priority: "Alta" },
          { id: "LP-008", title: "Seção FAQ", desc: "Perguntas frequentes em formato de accordion, com respostas pré-definidas sobre o atendimento.", priority: "Baixa" },
          { id: "LP-009", title: "Seção Blog", desc: "Exibição dos artigos mais recentes publicados, com link para a listagem completa.", priority: "Baixa" },
          { id: "LP-010", title: "Seção Contato", desc: "Informações de contato (telefone, email, endereço) e/ou formulário de contato.", priority: "Média" },
          { id: "LP-011", title: "Footer", desc: "Rodapé com links para Termos de Uso, Política de Privacidade, redes sociais e copyright.", priority: "Média" },
          { id: "LP-012", title: "Widget WhatsApp", desc: "Botão flutuante de WhatsApp para contato rápido, posicionado no canto inferior direito.", priority: "Alta" },
          { id: "LP-013", title: "Botão Scroll to Top", desc: "Botão para retornar ao topo da página, visível após rolagem.", priority: "Baixa" },
        ],
      },
      {
        name: "Blog — Listagem",
        route: "/blog",
        requirements: [
          { id: "BL-001", title: "Listagem de artigos", desc: "Exibir todos os artigos publicados em cards com título, excerto, imagem de capa, categoria, data e autor.", priority: "Média" },
          { id: "BL-002", title: "Filtros e busca", desc: "Permitir filtragem por categoria e busca textual.", priority: "Baixa" },
        ],
      },
      {
        name: "Blog — Artigo",
        route: "/blog/:slug",
        requirements: [
          { id: "BA-001", title: "Visualização de artigo", desc: "Renderizar o conteúdo completo do artigo em Markdown com suporte a GFM (tabelas, listas, etc.).", priority: "Média" },
          { id: "BA-002", title: "Metadados", desc: "Exibir autor, data de publicação, categoria, tags e contagem de visualizações.", priority: "Baixa" },
        ],
      },
      {
        name: "Política de Privacidade",
        route: "/politica-de-privacidade",
        requirements: [
          { id: "PP-001", title: "Conteúdo completo", desc: "Exibir a política de privacidade completa em conformidade com a LGPD.", priority: "Alta" },
        ],
      },
      {
        name: "Termos de Uso",
        route: "/termos-de-uso",
        requirements: [
          { id: "TU-001", title: "Conteúdo completo", desc: "Exibir os termos de uso completos do sistema.", priority: "Alta" },
        ],
      },
      {
        name: "Ações de Agendamento (Público)",
        route: "/agendamento/*",
        requirements: [
          { id: "AA-001", title: "Confirmar consulta", desc: "Rota /agendamento/confirmar — Paciente pode confirmar consulta via link com token recebido por email/WhatsApp. Validação de token (expiração e uso único).", priority: "Alta" },
          { id: "AA-002", title: "Cancelar consulta", desc: "Rota /agendamento/cancelar — Paciente pode cancelar consulta via token. Deve solicitar motivo de cancelamento.", priority: "Alta" },
          { id: "AA-003", title: "Reagendar consulta", desc: "Rota /agendamento/reagendar — Paciente pode solicitar reagendamento via token.", priority: "Alta" },
        ],
      },
    ],
  },
  {
    id: "admin",
    tab: "Painel Admin",
    title: "Painel Administrativo",
    route: "/admin/*",
    description: "Sistema de gestão completo para psicólogos e administradores, com controle de pacientes, agendamentos, financeiro, prontuários, IA e configurações.",
    pages: [
      {
        name: "Login",
        route: "/admin/login",
        requirements: [
          { id: "AL-001", title: "Autenticação", desc: "Formulário de login com email e senha. Validação de credenciais via autenticação do sistema. Redirecionamento para dashboard após login.", priority: "Alta" },
          { id: "AL-002", title: "Controle de acesso", desc: "Apenas usuários com role 'admin' ou 'psychologist' podem acessar o painel.", priority: "Alta" },
        ],
      },
      {
        name: "Dashboard",
        route: "/admin",
        requirements: [
          { id: "AD-001", title: "KPIs", desc: "Exibir cards com métricas: pacientes ativos, sessões do dia, receita mensal, taxa de ocupação. Cada card deve ser clicável para ver detalhes.", priority: "Alta" },
          { id: "AD-002", title: "Alertas de no-show", desc: "Exibir pacientes que faltaram recentemente com destaque visual.", priority: "Média" },
          { id: "AD-003", title: "Alertas de pacotes", desc: "Notificar pacotes de sessão próximos do vencimento ou com poucas sessões restantes.", priority: "Média" },
          { id: "AD-004", title: "Pacientes favoritos", desc: "Card com acesso rápido aos pacientes marcados como favoritos.", priority: "Baixa" },
          { id: "AD-005", title: "Métricas de agendamento", desc: "Estatísticas de consultas (confirmadas, canceladas, no-show).", priority: "Média" },
          { id: "AD-006", title: "Métricas de ocupação", desc: "Percentual de ocupação do consultório no período.", priority: "Média" },
          { id: "AD-007", title: "Aniversários", desc: "Exibir pacientes com aniversário próximo.", priority: "Baixa" },
        ],
      },
      {
        name: "Pacientes",
        route: "/admin/pacientes",
        requirements: [
          { id: "AP-001", title: "Listagem", desc: "Tabela paginada com busca por nome/email, filtro por status (ativo/inativo), ordenação por nome.", priority: "Alta" },
          { id: "AP-002", title: "Cadastro", desc: "Formulário: nome (obrigatório), email (obrigatório), telefone, data de nascimento, convênio, notas.", priority: "Alta" },
          { id: "AP-003", title: "Edição", desc: "Edição de todos os campos do paciente.", priority: "Alta" },
          { id: "AP-004", title: "Favoritar", desc: "Toggle para marcar/desmarcar paciente como favorito.", priority: "Baixa" },
          { id: "AP-005", title: "Exclusão", desc: "Apenas administradores podem excluir pacientes (com confirmação).", priority: "Média" },
        ],
      },
      {
        name: "Perfil do Paciente",
        route: "/admin/pacientes/:id",
        requirements: [
          { id: "PP-001", title: "Dados pessoais", desc: "Visualização e edição de todos os dados do paciente, incluindo convênio vinculado.", priority: "Alta" },
          { id: "PP-002", title: "Sessões", desc: "CRUD de sessões: data, duração, status (agendada/realizada/cancelada/remarcada/faltou), humor do paciente, notas detalhadas, observações clínicas, resumo, transcrição.", priority: "Alta" },
          { id: "PP-003", title: "IA nas Sessões", desc: "Geração automática de: resumo da sessão, insights clínicos (pontos-chave, temas emocionais, ações sugeridas, fatores de risco, indicadores de progresso), relatório de evolução.", priority: "Alta" },
          { id: "PP-004", title: "Arquivos de sessão", desc: "Upload e download de arquivos (documentos, gravações) vinculados a cada sessão.", priority: "Média" },
          { id: "PP-005", title: "Plano de tratamento", desc: "Criação e edição: objetivos, metas de curto/longo prazo, abordagens, progresso (%), status, compartilhamento com paciente. Versionamento com histórico de alterações.", priority: "Alta" },
          { id: "PP-006", title: "Geração de plano por IA", desc: "Geração automática de plano de tratamento baseado no histórico de sessões do paciente.", priority: "Média" },
          { id: "PP-007", title: "Atividades/Tarefas", desc: "Atribuição de atividades a partir de templates, com campos personalizados, prazo, status, respostas do paciente e thread de feedback.", priority: "Alta" },
          { id: "PP-008", title: "Mensagens seguras", desc: "Envio e visualização de mensagens com o paciente, com indicador de leitura e flag de urgência.", priority: "Média" },
          { id: "PP-009", title: "Diário", desc: "Visualização das entradas de diário do paciente (humor + anotação).", priority: "Baixa" },
          { id: "PP-010", title: "Pacotes de sessões", desc: "CRUD de pacotes: nome, total de sessões, sessões usadas, preço, data de início/expiração, status.", priority: "Média" },
          { id: "PP-011", title: "Recursos terapêuticos", desc: "Compartilhamento de links e arquivos com o paciente, com controle de visibilidade e contagem de visualizações.", priority: "Média" },
          { id: "PP-012", title: "Estatísticas", desc: "Dados de frequência, taxa de presença, evolução do humor, atividades completadas.", priority: "Baixa" },
        ],
      },
      {
        name: "Agendamentos",
        route: "/admin/agendamentos",
        requirements: [
          { id: "AG-001", title: "Calendário semanal", desc: "Visualização em grade com eixo de horas (configurável) e dias da semana. Exibição de consultas com cor por clínica e status.", priority: "Alta" },
          { id: "AG-002", title: "Criar agendamento", desc: "Dialog: paciente, data/hora, duração, tipo (sessão/avaliação/outro), modalidade (presencial/online), serviço, clínica, notas, link de reunião, tipo de pagamento (avulso/pacote), valor.", priority: "Alta" },
          { id: "AG-003", title: "Editar agendamento", desc: "Alteração de todos os campos, incluindo mudança de status (agendado → concluído → cancelado, etc.).", priority: "Alta" },
          { id: "AG-004", title: "Bloquear horário", desc: "Criação de bloqueios de horário com motivo (almoço, compromisso pessoal, etc.).", priority: "Média" },
          { id: "AG-005", title: "Lista de espera", desc: "Gerenciamento de pacientes em espera: data desejada, faixa de horário, serviço, status (aguardando/notificado/agendado/expirado).", priority: "Média" },
          { id: "AG-006", title: "Ações via WhatsApp", desc: "Menu contextual com opções de envio de mensagem via WhatsApp: lembrete, confirmação, reagendamento.", priority: "Média" },
          { id: "AG-007", title: "Configuração de agenda", desc: "Definição de horários de trabalho por dia da semana, múltiplos intervalos de pausa, configuração por clínica.", priority: "Alta" },
          { id: "AG-008", title: "Google Calendar", desc: "Integração bidirecional: sincronização de eventos criados no sistema para o Google Calendar e vice-versa.", priority: "Média" },
          { id: "AG-009", title: "Convênios", desc: "Gerenciamento de convênios aceitos: nome, cobertura (%), contato, status.", priority: "Média" },
          { id: "AG-010", title: "Navegação temporal", desc: "Navegação entre semanas (anterior/próxima) com botão para voltar à semana atual.", priority: "Alta" },
        ],
      },
      {
        name: "Tarefas de Casa",
        route: "/admin/tarefas-casa",
        requirements: [
          { id: "TC-001", title: "Templates", desc: "CRUD de templates de atividades com título, descrição, categoria, campos personalizados e anexo.", priority: "Alta" },
          { id: "TC-002", title: "Campos personalizados", desc: "Builder de formulários com tipos: texto curto, texto longo, número, seleção única, múltipla escolha, escala, data.", priority: "Alta" },
          { id: "TC-003", title: "Templates predefinidos", desc: "Biblioteca de atividades CBT pré-configuradas prontas para uso.", priority: "Média" },
          { id: "TC-004", title: "Atribuição", desc: "Seleção de paciente e template, com possibilidade de customizar antes de enviar.", priority: "Alta" },
        ],
      },
      {
        name: "Financeiro",
        route: "/admin/financeiro",
        requirements: [
          { id: "FI-001", title: "Transações", desc: "CRUD de receitas e despesas: valor, tipo (receita/despesa), categoria, método de pagamento, paciente vinculado, descrição, data, status de confirmação.", priority: "Alta" },
          { id: "FI-002", title: "Filtros", desc: "Filtro por período (seletor de datas), tipo (receita/despesa), categoria, status.", priority: "Alta" },
          { id: "FI-003", title: "Gráficos", desc: "Gráfico de receita vs despesa ao longo do tempo (linhas ou barras).", priority: "Média" },
          { id: "FI-004", title: "Metas financeiras", desc: "Definição de meta mensal de receita e número de sessões, com acompanhamento visual do progresso.", priority: "Média" },
          { id: "FI-005", title: "Transações recorrentes", desc: "Cadastro de despesas fixas mensais com geração automática mensal.", priority: "Média" },
          { id: "FI-006", title: "Inadimplência", desc: "Relatório de pacientes com pagamentos em atraso.", priority: "Média" },
          { id: "FI-007", title: "Analytics avançado", desc: "Análises detalhadas: receita por clínica, por convênio, por período, ticket médio.", priority: "Baixa" },
          { id: "FI-008", title: "Exportação", desc: "Exportação dos dados financeiros em formato Excel.", priority: "Média" },
        ],
      },
      {
        name: "Agentes de IA",
        route: "/admin/agentes-ia",
        requirements: [
          { id: "IA-001", title: "Chat com IA", desc: "Interface de chat com assistente inteligente para auxílio clínico: análise de casos, sugestões terapêuticas, revisão de notas.", priority: "Alta" },
          { id: "IA-002", title: "Histórico", desc: "Salvamento automático de conversas com título, tipo e data. Recuperação de conversas anteriores.", priority: "Média" },
          { id: "IA-003", title: "Busca", desc: "Pesquisa textual no histórico de conversas.", priority: "Baixa" },
          { id: "IA-004", title: "Prompts favoritos", desc: "Biblioteca de prompts reutilizáveis com título, conteúdo, categoria, tags e contagem de uso.", priority: "Média" },
          { id: "IA-005", title: "Base de conhecimento", desc: "Upload de documentos para enriquecer o contexto do assistente de IA.", priority: "Média" },
          { id: "IA-006", title: "Dashboard de uso", desc: "Métricas de utilização da IA: conversas, mensagens, prompts mais usados.", priority: "Baixa" },
          { id: "IA-007", title: "Transcrição de áudio", desc: "Upload de arquivo de áudio com conversão para texto via IA.", priority: "Média" },
          { id: "IA-008", title: "Transcrição em tempo real", desc: "Captura de áudio do microfone com transcrição ao vivo.", priority: "Média" },
        ],
      },
      {
        name: "Prontuários",
        route: "/admin/prontuarios",
        requirements: [
          { id: "PR-001", title: "Lista de prontuários pendentes", desc: "Exibição de consultas concluídas sem notas clínicas preenchidas, com indicador de quantidade na sidebar.", priority: "Alta" },
          { id: "PR-002", title: "Preenchimento rápido", desc: "Acesso direto ao formulário de notas da sessão a partir da lista de pendências.", priority: "Alta" },
        ],
      },
      {
        name: "Arquivos",
        route: "/admin/arquivos",
        requirements: [
          { id: "AQ-001", title: "Gerenciador de arquivos", desc: "Upload, download e exclusão de arquivos no storage do sistema.", priority: "Média" },
          { id: "AQ-002", title: "Tags", desc: "Sistema de etiquetas coloridas para categorização de arquivos.", priority: "Baixa" },
        ],
      },
      {
        name: "Blog",
        route: "/admin/blog",
        requirements: [
          { id: "BG-001", title: "CRUD de artigos", desc: "Criação, edição e exclusão de artigos com título, slug, excerto, conteúdo (Markdown), imagem de capa, ícone, categoria, tags e autor.", priority: "Média" },
          { id: "BG-002", title: "Publicação", desc: "Toggle de publicação (rascunho → publicado) com data de publicação automática.", priority: "Média" },
          { id: "BG-003", title: "Acesso restrito", desc: "Apenas administradores podem criar, editar e excluir artigos.", priority: "Alta" },
        ],
      },
      {
        name: "Profissionais",
        route: "/admin/profissionais",
        requirements: [
          { id: "PF-001", title: "Gestão de usuários", desc: "Listagem e gerenciamento de usuários do sistema com suas respectivas roles.", priority: "Alta" },
          { id: "PF-002", title: "Acesso restrito", desc: "Apenas administradores podem acessar esta página.", priority: "Alta" },
        ],
      },
      {
        name: "Lembretes",
        route: "/admin/lembretes",
        requirements: [
          { id: "LB-001", title: "Histórico", desc: "Listagem de lembretes enviados com tipo, status (enviado/erro), data de envio e mensagem de erro (se houver).", priority: "Média" },
        ],
      },
      {
        name: "Configurações",
        route: "/admin/configuracoes",
        requirements: [
          { id: "CF-001", title: "Perfil profissional", desc: "Edição: nome, credencial (CRP), bio, telefone, timezone.", priority: "Alta" },
          { id: "CF-002", title: "Preferências", desc: "Tema (claro/escuro/sistema), idioma, notificações por email, lembretes de sessão.", priority: "Média" },
          { id: "CF-003", title: "Agenda", desc: "Horários de trabalho (início/fim), intervalos, duração padrão de sessão, intervalo entre sessões.", priority: "Alta" },
          { id: "CF-004", title: "Clínicas", desc: "CRUD de clínicas: nome, endereço, cidade, telefone, email, cor, status, clínica padrão.", priority: "Média" },
          { id: "CF-005", title: "Convênios", desc: "Gestão de convênios aceitos com percentual de cobertura.", priority: "Média" },
          { id: "CF-006", title: "Preços", desc: "Tabela de preços por tipo de serviço, convênio e clínica, com suporte a preço social.", priority: "Média" },
        ],
      },
    ],
  },
  {
    id: "portal",
    tab: "Portal Paciente",
    title: "Portal do Paciente",
    route: "/portal/*",
    description: "Área exclusiva para pacientes acompanharem seu tratamento, visualizarem sessões, realizarem atividades, manterem um diário pessoal e se comunicarem com o profissional.",
    pages: [
      {
        name: "Login / Cadastro",
        route: "/portal",
        requirements: [
          { id: "PL-001", title: "Login", desc: "Formulário de login com email e senha. Verificação de que o usuário possui perfil de paciente vinculado.", priority: "Alta" },
          { id: "PL-002", title: "Cadastro", desc: "Formulário de registro com email, senha e nome. Vinculação automática ao registro de paciente existente (por email).", priority: "Alta" },
          { id: "PL-003", title: "Recuperação de senha", desc: "Envio de email para redefinição de senha com link de redirect para o portal.", priority: "Alta" },
        ],
      },
      {
        name: "Home",
        route: "/portal/app",
        requirements: [
          { id: "PH-001", title: "Resumo", desc: "Exibir próximas consultas agendadas e atividades pendentes.", priority: "Alta" },
          { id: "PH-002", title: "Ações rápidas", desc: "Cards de navegação para: Sessões, Plano de Tratamento, Atividades, Anotações, Mensagens, Materiais, Configurações.", priority: "Média" },
          { id: "PH-003", title: "Progresso", desc: "Barra de progresso do plano de tratamento (quando compartilhado pelo profissional).", priority: "Média" },
          { id: "PH-004", title: "Consentimento LGPD", desc: "Dialog modal de aceite de termos de uso e política de privacidade na primeira entrada, com registro de consentimento (versão, IP, user agent, timestamp).", priority: "Alta" },
        ],
      },
      {
        name: "Sessões",
        route: "/portal/sessoes",
        requirements: [
          { id: "PS-001", title: "Histórico", desc: "Listagem de todas as sessões com data, status e duração.", priority: "Alta" },
          { id: "PS-002", title: "Detalhes", desc: "Visualização dos detalhes da sessão (notas compartilhadas, se houver).", priority: "Média" },
        ],
      },
      {
        name: "Plano de Tratamento",
        route: "/portal/plano",
        requirements: [
          { id: "PT-001", title: "Visualização", desc: "Exibição do plano de tratamento quando compartilhado pelo profissional: objetivos, metas, progresso, abordagens.", priority: "Média" },
          { id: "PT-002", title: "Progresso", desc: "Barra visual de progresso geral e por meta individual.", priority: "Média" },
        ],
      },
      {
        name: "Atividades",
        route: "/portal/atividades",
        requirements: [
          { id: "PA-001", title: "Lista de tarefas", desc: "Exibição de atividades atribuídas com título, descrição, prazo, status (pendente/completa).", priority: "Alta" },
          { id: "PA-002", title: "Preenchimento", desc: "Formulário dinâmico baseado nos campos personalizados definidos pelo profissional. Suporte a: texto, número, seleção, escala, data.", priority: "Alta" },
          { id: "PA-003", title: "Histórico de respostas", desc: "Visualização de respostas anteriores e feedback do profissional.", priority: "Média" },
          { id: "PA-004", title: "Thread de feedback", desc: "Comunicação bidirecional sobre a atividade entre paciente e profissional.", priority: "Média" },
        ],
      },
      {
        name: "Anotações / Diário",
        route: "/portal/anotacoes",
        requirements: [
          { id: "PD-001", title: "Criar entrada", desc: "Formulário com seleção de humor (muito bem, bem, neutro, desafiador, difícil) e campo de texto livre.", priority: "Média" },
          { id: "PD-002", title: "Histórico", desc: "Listagem cronológica de todas as entradas com humor e texto.", priority: "Média" },
          { id: "PD-003", title: "Edição e exclusão", desc: "Paciente pode editar e excluir suas próprias entradas.", priority: "Baixa" },
        ],
      },
      {
        name: "Mensagens",
        route: "/portal/mensagens",
        requirements: [
          { id: "PM-001", title: "Enviar mensagem", desc: "Formulário para envio de mensagem ao profissional com conteúdo de texto e flag de urgência.", priority: "Alta" },
          { id: "PM-002", title: "Histórico", desc: "Exibição de todas as mensagens trocadas em ordem cronológica, com diferenciação visual entre autor (paciente/profissional).", priority: "Alta" },
        ],
      },
      {
        name: "Materiais",
        route: "/portal/materiais",
        requirements: [
          { id: "PMT-001", title: "Visualização", desc: "Acesso a recursos terapêuticos compartilhados pelo profissional: links, arquivos, vídeos.", priority: "Média" },
          { id: "PMT-002", title: "Registro de visualização", desc: "O sistema deve registrar quando o paciente visualizou um recurso.", priority: "Baixa" },
        ],
      },
      {
        name: "Configurações",
        route: "/portal/configuracoes",
        requirements: [
          { id: "PC-001", title: "Perfil", desc: "Visualização e edição dos dados pessoais do paciente (nome, telefone).", priority: "Média" },
        ],
      },
    ],
  },
  {
    id: "transversal",
    tab: "Transversal",
    title: "Requisitos Transversais",
    route: "N/A",
    description: "Requisitos não-funcionais e funcionalidades que se aplicam a todo o sistema.",
    pages: [
      {
        name: "Autenticação e Autorização",
        route: "Global",
        requirements: [
          { id: "TR-001", title: "Roles", desc: "Sistema de papéis: admin, psychologist, patient. Cada papel define quais rotas e operações o usuário pode acessar.", priority: "Alta" },
          { id: "TR-002", title: "RLS", desc: "Todas as tabelas possuem Row Level Security (RLS) garantindo que usuários só acessam dados autorizados para seu papel.", priority: "Alta" },
          { id: "TR-003", title: "Rotas protegidas", desc: "Componentes ProtectedRoute (admin) e PatientProtectedRoute (portal) verificam autenticação e autorização antes de renderizar.", priority: "Alta" },
        ],
      },
      {
        name: "Performance",
        route: "Global",
        requirements: [
          { id: "TR-004", title: "Code splitting", desc: "Todas as rotas são carregadas via lazy loading (React.lazy + Suspense) para reduzir o bundle inicial.", priority: "Média" },
          { id: "TR-005", title: "Cache de dados", desc: "React Query com staleTime configurado para minimizar requisições redundantes.", priority: "Média" },
          { id: "TR-006", title: "Imagens", desc: "Lazy loading de imagens abaixo do fold.", priority: "Baixa" },
        ],
      },
      {
        name: "UX",
        route: "Global",
        requirements: [
          { id: "TR-007", title: "Tema", desc: "Suporte a tema claro e escuro com toggle manual e detecção automática do sistema.", priority: "Média" },
          { id: "TR-008", title: "Responsividade", desc: "Layout adaptativo para desktop e mobile em todas as páginas.", priority: "Alta" },
          { id: "TR-009", title: "Feedback visual", desc: "Toasts e notificações sonner para todas as ações do usuário (sucesso, erro, informação).", priority: "Média" },
          { id: "TR-010", title: "Atalhos", desc: "Atalhos de teclado globais: ⌘K (busca), entre outros.", priority: "Baixa" },
          { id: "TR-011", title: "Animações", desc: "Transições suaves com Framer Motion em componentes de página.", priority: "Baixa" },
          { id: "TR-012", title: "Error Boundary", desc: "Tratamento global de erros com fallback amigável.", priority: "Alta" },
        ],
      },
      {
        name: "SEO",
        route: "Páginas públicas",
        requirements: [
          { id: "TR-013", title: "Meta tags", desc: "Title, description, og:image em todas as páginas públicas.", priority: "Média" },
          { id: "TR-014", title: "Robots.txt", desc: "Arquivo robots.txt configurado para indexação correta.", priority: "Baixa" },
          { id: "TR-015", title: "HTML semântico", desc: "Uso de tags semânticas (header, main, section, footer) em toda a landing page.", priority: "Média" },
        ],
      },
    ],
  },
];

const priorityColor = (p: string) => {
  if (p === "Alta") return "bg-destructive/10 text-destructive border-destructive/20";
  if (p === "Média") return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
  return "bg-muted text-muted-foreground border-border";
};

const DevURS = () => {
  const totalReqs = ursData.reduce((acc, s) => acc + s.pages.reduce((a, p) => a + p.requirements.length, 0), 0);
  const totalPages = ursData.reduce((acc, s) => acc + s.pages.length, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">📄 URS — User Requirements Specification</h1>
          <p className="text-muted-foreground mt-1">
            Especificação detalhada de requisitos do usuário para auditoria de entrega do sistema Equanimité.
          </p>
          <div className="flex gap-3 mt-3">
            <Badge variant="outline" className="text-sm">{totalPages} páginas documentadas</Badge>
            <Badge variant="outline" className="text-sm">{totalReqs} requisitos mapeados</Badge>
            <Badge variant="outline" className="text-sm">Versão 1.0 — {new Date().toLocaleDateString("pt-BR")}</Badge>
          </div>
        </div>

        <Tabs defaultValue="landing">
          <TabsList className="flex flex-wrap h-auto gap-1">
            {ursData.map((section) => (
              <TabsTrigger key={section.id} value={section.id} className="text-sm">
                {section.tab}
              </TabsTrigger>
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
    </AdminLayout>
  );
};

export default DevURS;
