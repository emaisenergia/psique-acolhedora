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
    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    console.log("Authenticated user:", userId);

    const { type, detailedNotes, transcription, patientName, previousSessions } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "summary") {
      systemPrompt = `Você é um assistente especializado em psicologia clínica. 
Sua tarefa é gerar um resumo terapêutico conciso e profissional de uma sessão.
O resumo deve:
- Ser objetivo e clínico
- Destacar pontos principais abordados
- Identificar temas emocionais relevantes
- Sugerir próximos passos quando apropriado
- Manter confidencialidade e linguagem técnica
- Ter no máximo 3-4 parágrafos`;

      userPrompt = `Gere um resumo terapêutico para a sessão de ${patientName || "paciente"}.

${detailedNotes ? `Notas da sessão:\n${detailedNotes}\n` : ""}
${transcription ? `Transcrição:\n${transcription}\n` : ""}`;
    } else if (type === "insights") {
      systemPrompt = `Você é um assistente especializado em psicologia clínica.
Sua tarefa é identificar insights e pontos-chave de uma sessão terapêutica.
Retorne um JSON válido com a seguinte estrutura:
{
  "keyPoints": ["ponto 1", "ponto 2", ...],
  "emotionalThemes": ["tema 1", "tema 2", ...],
  "suggestedActions": ["ação 1", "ação 2", ...],
  "riskFactors": ["fator 1", "fator 2", ...] ou [],
  "progressIndicators": ["indicador 1", "indicador 2", ...]
}`;

      userPrompt = `Analise a sessão de ${patientName || "paciente"} e extraia insights:

${detailedNotes ? `Notas:\n${detailedNotes}\n` : ""}
${transcription ? `Transcrição:\n${transcription}\n` : ""}`;
    } else if (type === "evolution") {
      systemPrompt = `Você é um assistente especializado em psicologia clínica.
Sua tarefa é gerar um relatório evolutivo consolidando múltiplas sessões.
O relatório deve:
- Identificar evolução ao longo do tempo
- Destacar temas recorrentes
- Avaliar progresso em relação aos objetivos
- Sugerir ajustes no plano terapêutico
- Ter formato estruturado e profissional`;

      userPrompt = `Gere um relatório evolutivo para ${patientName || "paciente"}.

Sessões anteriores:
${JSON.stringify(previousSessions, null, 2)}`;
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
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos à sua conta." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro ao processar com IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (type === "insights") {
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        return new Response(JSON.stringify({ insights: parsed }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ insights: null, rawContent: content }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});