import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessRequest {
  documentId: string;
  filePath: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, filePath }: ProcessRequest = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Processing PDF: ${filePath}`);

    // Download PDF from storage to verify it exists and is readable
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("vehicle-documents")
      .download(filePath);

    if (downloadError || !fileData) {
      console.error("Download error:", downloadError);
      
      await supabase
        .from("vehicle_documents")
        .update({
          status: "insufficient_quality",
          quality_notes: ["Não foi possível acessar o arquivo PDF"],
        })
        .eq("id", documentId);

      throw new Error(`Failed to download PDF: ${downloadError?.message}`);
    }

    const fileSizeMB = fileData.size / (1024 * 1024);
    console.log(`PDF downloaded, size: ${fileSizeMB.toFixed(2)} MB`);

    // For now, we'll mark the document as ready and let the AI read it directly during queries
    // The AI models (Gemini) can process PDFs directly
    
    let status = "ready";
    const qualityNotes: string[] = [];

    // Basic validation - file must have some content
    if (fileData.size < 1000) {
      status = "insufficient_quality";
      qualityNotes.push("O arquivo PDF parece estar vazio ou corrompido");
      qualityNotes.push("Envie um PDF com conteúdo válido");
    } else if (fileSizeMB > 50) {
      status = "insufficient_quality";
      qualityNotes.push("O arquivo é muito grande para processamento");
      qualityNotes.push("Reduza o tamanho do PDF (máximo 50 MB)");
    }

    // Update document record
    const { error: updateError } = await supabase
      .from("vehicle_documents")
      .update({
        status,
        extracted_text_length: status === "ready" ? Math.floor(fileData.size / 10) : 0, // Estimate
        illegible_rate: 0,
        quality_notes: qualityNotes.length > 0 ? qualityNotes : null,
      })
      .eq("id", documentId);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error("Failed to update document status");
    }

    console.log(`Document ${documentId} marked as ${status}`);

    return new Response(
      JSON.stringify({
        success: true,
        status,
        extractedTextLength: status === "ready" ? Math.floor(fileData.size / 10) : 0,
        fileSizeMB: fileSizeMB.toFixed(2),
        qualityNotes,
        message: status === "ready" 
          ? "PDF validado e pronto para uso. A IA irá processar o conteúdo durante as consultas."
          : "PDF com problemas de qualidade.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in process-pdf:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Erro desconhecido" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
