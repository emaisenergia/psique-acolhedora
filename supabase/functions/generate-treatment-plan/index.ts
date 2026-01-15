import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { patientId, patientName, age, mainComplaint } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all patient sessions with notes and summaries
    let sessionsContext = "";
    let journalContext = "";
    
    if (patientId) {
      // Fetch sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from("sessions")
        .select("session_date, detailed_notes, summary, ai_generated_summary, clinical_observations, ai_insights, status")
        .eq("patient_id", patientId)
        .eq("status", "completed")
        .order("session_date", { ascending: false })
        .limit(20);

      if (!sessionsError && sessions && sessions.length > 0) {
        sessionsContext = sessions.map((s, i) => {
          const parts = [`Sessão ${i + 1} (${new Date(s.session_date).toLocaleDateString("pt-BR")})`];
          if (s.detailed_notes) parts.push(`Notas: ${s.detailed_notes}`);
          if (s.summary) parts.push(`Resumo: ${s.summary}`);
          if (s.ai_generated_summary) parts.push(`Sumário IA: ${s.ai_generated_summary}`);
          if (s.clinical_observations) parts.push(`Observações clínicas: ${s.clinical_observations}`);
          if (s.ai_insights) {
            const insights = s.ai_insights as any;
            if (insights.keyPoints?.length) parts.push(`Pontos-chave: ${insights.keyPoints.join("; ")}`);
            if (insights.emotionalThemes?.length) parts.push(`Temas emocionais: ${insights.emotionalThemes.join("; ")}`);
            if (insights.riskFactors?.length) parts.push(`Fatores de risco: ${insights.riskFactors.join("; ")}`);
          }
          return parts.join("\n");
        }).join("\n\n");
      }

      // Fetch journal entries
      const { data: journals, error: journalError } = await supabase
        .from("journal_entries")
        .select("created_at, mood, note")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(15);

      if (!journalError && journals && journals.length > 0) {
        journalContext = journals.map((j) => 
          `[${new Date(j.created_at).toLocaleDateString("pt-BR")}] Humor: ${j.mood} - ${j.note}`
        ).join("\n");
      }
    }

    const systemPrompt = `Você é um psicólogo clínico experiente especializado em TERAPIA COGNITIVO-COMPORTAMENTAL (TCC).

Sua tarefa é criar um plano de tratamento estruturado baseado EXCLUSIVAMENTE na abordagem TCC, utilizando todas as informações disponíveis do paciente.

PRINCÍPIOS DA TCC A APLICAR:
1. Identificação de pensamentos automáticos disfuncionais
2. Reestruturação cognitiva
3. Técnicas comportamentais (exposição gradual, ativação comportamental)
4. Registro de pensamentos e crenças
5. Experimentos comportamentais
6. Psicoeducação sobre o modelo cognitivo
7. Prevenção de recaída

O plano deve incluir:
1. Objetivos terapêuticos específicos e mensuráveis baseados em TCC (3-5 objetivos)
2. Objetivos para alta terapêutica (critérios claros baseados em mudança cognitiva e comportamental)
3. Metas de curto prazo (próximas 4-8 sessões) - técnicas TCC específicas
4. Metas de longo prazo (processo completo) - mudanças cognitivas e comportamentais duradouras
5. Número estimado de sessões baseado na complexidade do caso (TCC geralmente 12-20 sessões)
6. Técnicas e abordagens TCC específicas recomendadas

IMPORTANTE: Analise CUIDADOSAMENTE todas as notas de sessão, evoluções e diário do paciente para identificar:
- Padrões de pensamento disfuncional
- Crenças centrais
- Comportamentos de evitação ou segurança
- Gatilhos emocionais
- Progressos já alcançados

Responda APENAS em português brasileiro, de forma profissional e técnica.`;

    const userPrompt = `Crie um plano de tratamento TCC para:

DADOS DO PACIENTE:
- Nome: ${patientName || "Não informado"}
- Idade: ${age ? `${age} anos` : "Não informada"}
- Queixa principal/Observações: ${mainComplaint || "Não informada"}

${sessionsContext ? `
HISTÓRICO DE SESSÕES (análise detalhada das últimas sessões):
${sessionsContext}
` : "Sem histórico de sessões registrado."}

${journalContext ? `
DIÁRIO DO PACIENTE (registros recentes):
${journalContext}
` : ""}

Com base em TODAS as informações acima, elabore um plano de tratamento TCC completo e personalizado.`;

    console.log("Generating treatment plan with full context for patient:", patientId);

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
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_treatment_plan",
              description: "Cria um plano de tratamento TCC estruturado",
              parameters: {
                type: "object",
                properties: {
                  objectives: {
                    type: "array",
                    items: { type: "string" },
                    description: "Objetivos terapêuticos principais baseados em TCC (3-5)"
                  },
                  discharge_objectives: {
                    type: "array",
                    items: { type: "string" },
                    description: "Critérios/objetivos para alta terapêutica baseados em mudança cognitiva e comportamental (2-4)"
                  },
                  short_term_goals: {
                    type: "array",
                    items: { type: "string" },
                    description: "Metas de curto prazo com técnicas TCC específicas (3-5)"
                  },
                  long_term_goals: {
                    type: "array",
                    items: { type: "string" },
                    description: "Metas de longo prazo focadas em mudanças cognitivas duradouras (2-4)"
                  },
                  estimated_sessions: {
                    type: "number",
                    description: "Número estimado de sessões (TCC geralmente 12-20)"
                  },
                  approaches: {
                    type: "array",
                    items: { type: "string" },
                    description: "Técnicas TCC específicas recomendadas (ex: Reestruturação Cognitiva, Exposição Gradual, Ativação Comportamental)"
                  },
                  notes: {
                    type: "string",
                    description: "Observações clínicas sobre o plano, incluindo padrões identificados e recomendações"
                  }
                },
                required: ["objectives", "discharge_objectives", "short_term_goals", "long_term_goals", "estimated_sessions", "approaches"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_treatment_plan" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao seu workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro ao gerar plano de tratamento" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "Resposta inválida da IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const plan = JSON.parse(toolCall.function.arguments);
    
    return new Response(JSON.stringify({ plan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating treatment plan:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
