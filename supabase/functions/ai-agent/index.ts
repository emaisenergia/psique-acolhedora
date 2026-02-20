import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface RequestBody {
  messages: Message[];
  type: "chat" | "session_summary" | "patient_analysis" | "report_generation";
  context?: {
    patientName?: string;
    sessionNotes?: string;
    patientHistory?: string;
    reportType?: string;
    attachedContent?: string;
  };
}

const BASE_SPECIALIZATION = `
Você é um assistente especializado em:

## 1. TERAPIA COGNITIVO-COMPORTAMENTAL (TCC)
- Identificação e reestruturação de pensamentos automáticos disfuncionais
- Técnicas de registro de pensamentos (RPD - Registro de Pensamentos Disfuncionais)
- Experimentos comportamentais e exposição gradual
- Psicoeducação sobre o modelo cognitivo
- Técnicas de resolução de problemas
- Treinamento de habilidades sociais
- Técnicas de relaxamento e manejo de ansiedade
- Ativação comportamental para depressão
- Prevenção de recaídas
- Mindfulness integrado à TCC (Terapia Cognitiva baseada em Mindfulness)
- Dessensibilização sistemática
- Questionamento socrático

## 2. TERAPIA SEXUAL
- Avaliação de disfunções sexuais (DSM-5/CID-11)
- Tratamento de transtornos do desejo, excitação e orgasmo
- Abordagem de disfunção erétil e ejaculação precoce
- Vaginismo e dispareunia
- Educação sexual terapêutica
- Técnicas de foco sensorial (Masters & Johnson)
- Terapia de casal com foco em sexualidade
- Questões de identidade de gênero e orientação sexual
- Trauma sexual e sua abordagem terapêutica
- Sexualidade no ciclo de vida (adolescência, menopausa, envelhecimento)
- Compulsão sexual e parafílias
- Impacto de medicamentos e condições médicas na sexualidade

## PRINCÍPIOS DE ATENDIMENTO
- Abordagem baseada em evidências científicas
- Postura ética e não-julgadora
- Linguagem técnica apropriada ao contexto profissional
- Respeito à diversidade e inclusão
- Confidencialidade e sigilo profissional
- Integração mente-corpo na compreensão da sexualidade
- Perspectiva biopsicossocial

Responda sempre em português do Brasil, com linguagem técnica e empática.
`;

const SYSTEM_PROMPTS = {
  chat: `${BASE_SPECIALIZATION}

## SEU PAPEL COMO ASSISTENTE
Ajude profissionais de psicologia com:
- Dúvidas teóricas sobre TCC e Terapia Sexual
- Sugestões de intervenções e técnicas específicas
- Discussão de casos clínicos (sem identificação)
- Formulação de casos em TCC
- Planejamento de tratamento
- Tarefas de casa para pacientes
- Recursos e materiais psicoeducativos
- Questões administrativas do consultório

Seja conciso, profissional e baseado em evidências.`,

  session_summary: `${BASE_SPECIALIZATION}

## RESUMO DE SESSÃO (TCC/TERAPIA SEXUAL)
Com base nas notas fornecidas, gere:

1. **RESUMO EXECUTIVO** (2-3 parágrafos)
   - Principais temas abordados
   - Estado emocional do paciente
   - Evolução desde a última sessão

2. **FORMULAÇÃO COGNITIVA**
   - Situações-gatilho identificadas
   - Pensamentos automáticos
   - Emoções e reações fisiológicas
   - Comportamentos resultantes
   - Crenças subjacentes ativadas

3. **ASPECTOS SEXUAIS** (se aplicável)
   - Questões de sexualidade abordadas
   - Progresso em exercícios de foco sensorial
   - Mudanças na intimidade/relacionamento

4. **INTERVENÇÕES UTILIZADAS**
   - Técnicas de TCC aplicadas
   - Experimentos comportamentais propostos
   - Tarefas de casa atribuídas

5. **PLANO PARA PRÓXIMA SESSÃO**
   - Temas a aprofundar
   - Técnicas sugeridas
   - Metas de curto prazo`,

  patient_analysis: `${BASE_SPECIALIZATION}

## ANÁLISE DE PRONTUÁRIO (TCC/TERAPIA SEXUAL)
Com base no histórico fornecido, identifique:

1. **FORMULAÇÃO DO CASO**
   - Diagrama de conceituação cognitiva
   - Crenças centrais identificadas
   - Padrões de pensamentos automáticos
   - Estratégias compensatórias

2. **EVOLUÇÃO DO TRATAMENTO**
   - Progresso em relação às metas iniciais
   - Mudanças cognitivas observadas
   - Mudanças comportamentais alcançadas
   - Ganhos terapêuticos consolidados

3. **TEMAS RECORRENTES**
   - Padrões de relacionamento
   - Esquemas emocionais predominantes
   - Gatilhos frequentes
   - Áreas de vulnerabilidade

4. **ASPECTOS DA SEXUALIDADE**
   - Evolução de disfunções sexuais (se aplicável)
   - Qualidade da intimidade
   - Crenças sobre sexualidade
   - Impacto no relacionamento

5. **RECOMENDAÇÕES TERAPÊUTICAS**
   - Técnicas prioritárias para próxima fase
   - Áreas que precisam de mais trabalho
   - Riscos de recaída
   - Estratégias de prevenção`,

  report_generation: `${BASE_SPECIALIZATION}

## GERAÇÃO DE RELATÓRIO CLÍNICO (TCC/TERAPIA SEXUAL)
Gere relatórios profissionais contendo:

1. **IDENTIFICAÇÃO**
   - Dados do paciente (preservando confidencialidade)
   - Período de acompanhamento
   - Frequência das sessões

2. **DEMANDA INICIAL**
   - Queixa principal
   - Sintomas apresentados
   - Impacto funcional
   - Histórico relevante

3. **AVALIAÇÃO DIAGNÓSTICA**
   - Hipótese diagnóstica (DSM-5/CID-11)
   - Instrumentos utilizados (se aplicável)
   - Formulação cognitiva do caso

4. **PLANO DE TRATAMENTO**
   - Objetivos terapêuticos
   - Técnicas utilizadas
   - Duração prevista

5. **EVOLUÇÃO**
   - Progresso por área
   - Resposta às intervenções
   - Obstáculos encontrados

6. **SITUAÇÃO ATUAL**
   - Estado clínico presente
   - Comparativo com início do tratamento
   - Funcionamento atual

7. **PROGNÓSTICO E RECOMENDAÇÕES**
   - Prognóstico fundamentado
   - Necessidade de continuidade
   - Encaminhamentos sugeridos

Use linguagem formal, técnica e adequada ao destinatário do relatório.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, type, context } = await req.json() as RequestBody;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get authorization token to fetch user's knowledge documents
    const authHeader = req.headers.get("authorization");
    let knowledgeContent = "";

    if (authHeader && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabase.auth.getUser(token);

        if (user) {
          // Fetch active knowledge documents
          const { data: docs } = await supabase
            .from("ai_knowledge_documents")
            .select("title, content, category")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(5);

          if (docs && docs.length > 0) {
            knowledgeContent = "\n\n## BASE DE CONHECIMENTO PERSONALIZADA\nOs seguintes documentos foram adicionados pelo profissional para enriquecer as respostas:\n\n";
            docs.forEach((doc, index) => {
              knowledgeContent += `### ${index + 1}. ${doc.title} [${doc.category || 'geral'}]\n${doc.content}\n\n`;
            });
          }
        }
      } catch (error) {
        console.error("Error fetching knowledge documents:", error);
      }
    }

    // Build system prompt based on type and context
    let systemPrompt = SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.chat;
    
    // Add knowledge documents to system prompt
    systemPrompt += knowledgeContent;
    
    if (context) {
      if (context.patientName) {
        systemPrompt += `\n\nPaciente em questão: ${context.patientName}`;
      }
      if (context.sessionNotes) {
        systemPrompt += `\n\nNotas da sessão:\n${context.sessionNotes}`;
      }
      if (context.patientHistory) {
        systemPrompt += `\n\nHistórico do paciente:\n${context.patientHistory}`;
      }
      if (context.reportType) {
        const reportTypes: Record<string, string> = {
          evolucao: "Relatório de Evolução Clínica",
          encaminhamento: "Relatório para Encaminhamento",
          alta: "Relatório de Alta Terapêutica",
          pericial: "Laudo Pericial Psicológico",
          escolar: "Relatório Escolar/Institucional",
        };
        systemPrompt += `\n\nTipo de relatório solicitado: ${reportTypes[context.reportType] || context.reportType}`;
      }
      if (context.attachedContent) {
        systemPrompt += `\n\n## CONTEÚDO ANEXADO PELO USUÁRIO\n${context.attachedContent}`;
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-10),
        ],
        stream: true,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos à sua conta." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao conectar com a IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI agent error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
