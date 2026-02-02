import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RequestBody {
  type: 'obd' | 'diagnosis' | 'maintenance' | 'customer-message';
  vehicleId?: string;
  documentId?: string;
  input?: Record<string, unknown>;
  response?: unknown;
  vehicleName?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const { type, vehicleId, documentId, input, response: prevResponse, vehicleName } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (type) {
      case "obd":
        systemPrompt = `Você é um especialista em diagnóstico automotivo. 
Analise códigos OBD-II e forneça explicações claras e acionáveis.
Sempre estruture sua resposta com as seções:
1. O que significa
2. O que pode causar (3 a 5 itens)
3. O que checar agora (3 itens)
4. Quando procurar uma oficina

IMPORTANTE: Sempre inclua referências ao PDF do manual quando disponível (ex: "página 12").
Se não encontrar informações específicas no PDF, indique isso claramente e forneça orientação geral.
Sempre termine com: "Isso é uma hipótese; não é certeza."`;
        
        userPrompt = `Código OBD-II: ${(input as { code: string })?.code}
Veículo: ID ${vehicleId}
Documento PDF: ${documentId ? 'Disponível' : 'Não disponível'}

Explique este código de forma clara e acionável.`;
        break;

      case "diagnosis":
        systemPrompt = `Você é um especialista em diagnóstico automotivo.
Analise sintomas descritos pelo motorista e forneça um diagnóstico estruturado.

ESTRUTURE sua resposta com:
1. Resumo do que você descreveu
2. Hipóteses mais prováveis (até 3)
3. Checklist do que verificar agora (5 itens numerados)
4. Próximos passos
5. Quando procurar uma oficina

ALERTA DE SEGURANÇA: Se os sintomas indicarem risco (freio falhando, cheiro de combustível, luz de óleo, fumaça), 
SEMPRE comece a resposta com um alerta de segurança recomendando NÃO continuar dirigindo.

IMPORTANTE: Sempre inclua referências ao PDF do manual quando disponível (ex: "página X").
Se não encontrar informações específicas no PDF, indique isso claramente.
Sempre termine com: "Isso é uma hipótese; não é certeza."`;
        
        userPrompt = `Sintomas descritos: ${(input as { symptoms: string })?.symptoms}
Veículo: ID ${vehicleId}
Documento PDF: ${documentId ? 'Disponível' : 'Não disponível'}

Analise os sintomas e forneça um diagnóstico estruturado.`;
        break;

      case "maintenance":
        systemPrompt = `Você é um especialista em manutenção automotiva.
Analise a quilometragem e data do último serviço para recomendar manutenções preventivas.

ESTRUTURE sua resposta com uma lista de PELO MENOS 5 itens de manutenção.
Cada item deve conter:
- Serviço (nome do serviço)
- Quando fazer (km e/ou meses)
- Referência no PDF (página X) - OBRIGATÓRIO quando disponível

IMPORTANTE: Sempre inclua referências ao PDF do manual.
Se não encontrar informações específicas, use valores padrão de mercado.
Inclua observações de segurança quando relevante.`;
        
        const maintenanceInput = input as { current_mileage: number; last_service_date: string };
        userPrompt = `Quilometragem atual: ${maintenanceInput?.current_mileage} km
Data do último serviço: ${maintenanceInput?.last_service_date}
Veículo: ID ${vehicleId}
Documento PDF: ${documentId ? 'Disponível' : 'Não disponível'}

Liste as manutenções recomendadas com base no manual do veículo.`;
        break;

      case "customer-message":
        systemPrompt = `Você é um consultor de pós-venda profissional.
Gere uma mensagem clara e profissional para o cliente sobre manutenções recomendadas.

A mensagem deve:
- Ter NO MÁXIMO 900 caracteres
- Conter os blocos: Resumo, Recomendações (lista), Observação de segurança
- Ser cordial e profissional
- Incluir orientação para procurar oficina em caso de sinais críticos`;
        
        userPrompt = `Veículo: ${vehicleName || 'Veículo do cliente'}
Recomendações geradas: ${JSON.stringify(prevResponse)}

Gere uma mensagem profissional para o cliente.`;
        break;

      default:
        throw new Error(`Tipo de consulta inválido: ${type}`);
    }

    console.log(`Processing ${type} request for vehicle ${vehicleId}`);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Por favor, adicione créditos ao workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("Erro ao processar com IA");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    console.log(`AI response received for ${type}`);

    // For customer-message, return the message directly
    if (type === "customer-message") {
      return new Response(
        JSON.stringify({ message: content }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the AI response into structured format
    const structuredResponse = parseAIResponse(content, type, documentId);

    return new Response(
      JSON.stringify(structuredResponse),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-assistant:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function parseAIResponse(content: string, type: string, documentId?: string) {
  const sections: Array<{ title: string; content: string | string[]; type: 'text' | 'list' | 'checklist' }> = [];
  let safetyAlert = null;

  // Check for safety alerts
  const safetyKeywords = ['alerta de segurança', 'não continue dirigindo', 'pare o veículo', 'risco', 'perigo'];
  const lowerContent = content.toLowerCase();
  
  if (safetyKeywords.some(keyword => lowerContent.includes(keyword))) {
    const alertMatch = content.match(/(?:alerta de segurança|⚠️|🚨)[:\s]*([^\n]+)/i);
    if (alertMatch) {
      safetyAlert = {
        message: alertMatch[1].trim() || "Recomendamos não continuar dirigindo e procurar um mecânico imediatamente.",
        severity: "critical" as const,
      };
    } else {
      safetyAlert = {
        message: "Recomendamos não continuar dirigindo e procurar um mecânico imediatamente.",
        severity: "critical" as const,
      };
    }
  }

  // Split content by common section headers
  const sectionRegex = /(?:^|\n)(?:#+\s*)?(?:\d+\.\s*)?([^:\n]+)(?::|)\s*\n([\s\S]*?)(?=(?:\n(?:#+\s*)?(?:\d+\.\s*)?[^:\n]+(?::|)\s*\n)|$)/gi;
  
  let match;
  const rawSections: Array<{ title: string; content: string }> = [];
  
  while ((match = sectionRegex.exec(content)) !== null) {
    const title = match[1].replace(/[#*]/g, '').trim();
    const sectionContent = match[2].trim();
    
    if (title && sectionContent && title.length < 100) {
      rawSections.push({ title, content: sectionContent });
    }
  }

  // If no sections found, create a single text section
  if (rawSections.length === 0) {
    sections.push({
      title: "Resposta",
      content: content.trim(),
      type: "text",
    });
  } else {
    for (const section of rawSections) {
      // Check if content is a list
      const listItems = section.content.match(/(?:^|\n)[-•*]\s*(.+)/g);
      const numberedItems = section.content.match(/(?:^|\n)\d+\.\s*(.+)/g);
      
      if (listItems && listItems.length >= 2) {
        sections.push({
          title: section.title,
          content: listItems.map(item => item.replace(/^[\n\s]*[-•*]\s*/, '').trim()),
          type: section.title.toLowerCase().includes('checklist') || section.title.toLowerCase().includes('verificar') ? 'checklist' : 'list',
        });
      } else if (numberedItems && numberedItems.length >= 2) {
        sections.push({
          title: section.title,
          content: numberedItems.map(item => item.replace(/^[\n\s]*\d+\.\s*/, '').trim()),
          type: 'checklist',
        });
      } else {
        sections.push({
          title: section.title,
          content: section.content,
          type: 'text',
        });
      }
    }
  }

  // Extract PDF references
  const pageReferences: Array<{ page: number }> = [];
  const pageMatches = content.matchAll(/página\s*(\d+)/gi);
  for (const pm of pageMatches) {
    const pageNum = parseInt(pm[1]);
    if (!pageReferences.some(r => r.page === pageNum)) {
      pageReferences.push({ page: pageNum });
    }
  }

  const hasNoRelevantExcerpt = lowerContent.includes('não encontrei') || 
    lowerContent.includes('sem trecho relevante') ||
    lowerContent.includes('orientação geral');

  return {
    sections,
    safety_alert: safetyAlert,
    base_used: {
      source: documentId ? 'pdf' : 'general',
      file_name: documentId ? 'manual_veiculo.pdf' : undefined,
      references: pageReferences.length > 0 ? pageReferences : undefined,
      no_relevant_excerpt: hasNoRelevantExcerpt,
    },
    disclaimer: "Isso é uma hipótese; não é certeza.",
  };
}
