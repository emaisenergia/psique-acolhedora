import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
  };
}

const SYSTEM_PROMPTS = {
  chat: `Você é um assistente inteligente para profissionais de psicologia. 
Ajude com tarefas administrativas, dúvidas sobre práticas clínicas, sugestões de intervenções e organização do consultório.
Seja conciso, profissional e empático. Responda sempre em português do Brasil.`,

  session_summary: `Você é um assistente especializado em resumir sessões de psicoterapia.
Com base nas notas fornecidas, gere:
1. Um resumo executivo (2-3 parágrafos)
2. Principais temas abordados
3. Insights clínicos relevantes
4. Sugestões para próximas sessões
5. Pontos de atenção

Mantenha confidencialidade e use linguagem técnica apropriada. Responda em português do Brasil.`,

  patient_analysis: `Você é um assistente para análise de prontuários de pacientes.
Com base no histórico fornecido, identifique:
1. Padrões de comportamento recorrentes
2. Evolução ao longo do tratamento
3. Temas centrais
4. Possíveis resistências ou defesas
5. Recomendações terapêuticas

Use linguagem técnica e profissional. Responda em português do Brasil.`,

  report_generation: `Você é um assistente para geração de relatórios clínicos.
Gere relatórios profissionais e bem estruturados contendo:
1. Identificação do paciente (sem dados pessoais sensíveis)
2. Período de acompanhamento
3. Demanda inicial e queixas
4. Evolução do tratamento
5. Situação atual
6. Prognóstico e recomendações

Use linguagem formal e técnica. Responda em português do Brasil.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, type, context } = await req.json() as RequestBody;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build system prompt based on type and context
    let systemPrompt = SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.chat;
    
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
        systemPrompt += `\n\nTipo de relatório solicitado: ${context.reportType}`;
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
          ...messages,
        ],
        stream: true,
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
