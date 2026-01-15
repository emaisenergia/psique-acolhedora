import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { patientName, age, mainComplaint, sessionHistory, journalNotes } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um psicólogo clínico experiente especializado em criar planos de tratamento terapêuticos. 
Sua tarefa é gerar um plano de tratamento estruturado baseado nas informações do paciente.

O plano deve incluir:
1. Objetivos terapêuticos específicos e mensuráveis (3-5 objetivos)
2. Objetivos para alta terapêutica (critérios claros para encerramento)
3. Metas de curto prazo (próximas 4-8 sessões)
4. Metas de longo prazo (processo completo)
5. Número estimado de sessões baseado na complexidade do caso
6. Abordagens terapêuticas recomendadas

Responda APENAS em português brasileiro, de forma profissional e técnica.`;

    const userPrompt = `Crie um plano de tratamento para:
Paciente: ${patientName || "Não informado"}
Idade: ${age ? `${age} anos` : "Não informada"}
Queixa principal/Notas: ${mainComplaint || "Não informada"}
${sessionHistory ? `Histórico de sessões: ${sessionHistory}` : ""}
${journalNotes ? `Evoluções recentes: ${journalNotes}` : ""}`;

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
              description: "Cria um plano de tratamento estruturado",
              parameters: {
                type: "object",
                properties: {
                  objectives: {
                    type: "array",
                    items: { type: "string" },
                    description: "Objetivos terapêuticos principais (3-5)"
                  },
                  discharge_objectives: {
                    type: "array",
                    items: { type: "string" },
                    description: "Critérios/objetivos para alta terapêutica (2-4)"
                  },
                  short_term_goals: {
                    type: "array",
                    items: { type: "string" },
                    description: "Metas de curto prazo (3-5)"
                  },
                  long_term_goals: {
                    type: "array",
                    items: { type: "string" },
                    description: "Metas de longo prazo (2-4)"
                  },
                  estimated_sessions: {
                    type: "number",
                    description: "Número estimado de sessões (8-52)"
                  },
                  approaches: {
                    type: "array",
                    items: { type: "string" },
                    description: "Abordagens terapêuticas recomendadas"
                  },
                  notes: {
                    type: "string",
                    description: "Observações gerais sobre o plano"
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
