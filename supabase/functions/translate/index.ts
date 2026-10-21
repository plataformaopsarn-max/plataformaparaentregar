// supabase/functions/translate/index.ts
// Supabase Edge Function: Traducción Regulatoria Segura OPS/OMS con Google Gemini
// Impide la exposición de claves de API en el cliente frontend.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  // Manejo de preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Verificación de Autenticación mediante JWT de Supabase
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Acceso no autorizado: Token de sesión ausente" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ 
          error: "Configuración incompleta: El secreto GEMINI_API_KEY no está configurado en Supabase Edge Functions." 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Validar usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Sesión inválida o expirada" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar rol del usuario en admin_profiles (Solo 'administrador' o 'editor' activos)
    const { data: profile } = await supabase
      .from("admin_profiles")
      .select("rol, activo")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || !profile.activo || !["administrador", "editor"].includes(profile.rol)) {
      return new Response(
        JSON.stringify({ error: "Acceso denegado: Se requiere rol de Administrador o Editor activo para traducir con IA" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Procesar solicitud del cliente
    const body = await req.json();
    const { text, sourceLang = "es", targetLang = "en", existingTargetText = "", context = "" } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return new Response(
        JSON.stringify({ error: "El campo 'text' es requerido para la traducción" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Instrucciones regulatorias institucionales OPS/OMS
    const systemPrompt = `You are a professional regulatory translator specialized in Latin American and Caribbean clinical trial frameworks for the Pan American Health Organization (PAHO/WHO).
Your task is to translate regulatory text between Spanish and English with maximum legal and technical fidelity.

CRITICAL REGULATORY RULES:
1. Official law/decree/regulation names and numbers MUST REMAIN in original Spanish (e.g., "Decreto 1490/1992", "Disposición ANMAT 7516/2025", "Resolución 1480/2011", "Ley General de Salud"). Never translate the proper names of acts.
2. Standard regulatory acronyms:
   - Autoridad Regulatoria Nacional (ARN) -> National Regulatory Authority (NRA)
   - Comité de Ética de la Investigación (CEI) -> Research Ethics Committee (REC)
   - Buenas Prácticas Clínicas (BPC) -> Good Clinical Practices (GCP)
   - Buenas Prácticas de Manufactura (BPM) -> Good Manufacturing Practices (GMP)
   - Evento Adverso Serio (EAS) -> Serious Adverse Event (SAE)
   - Reacción Adversa Seria e Inesperada (RASI / SUSAR) -> Suspected Unexpected Serious Adverse Reaction (SUSAR)
   - Organización de Investigación por Contrato (OIC / CRO) -> Contract Research Organization (CRO)
   - Producto en Investigación (PI) -> Investigational Product (IP)
3. Maintain an institutional, precise, neutral tone.
4. Output STRICT JSON format only with these keys:
   {
     "translatedText": "the complete translated text",
     "detectedNovelty": "brief summary (in ${sourceLang === 'es' ? 'Spanish' : 'English'}) of what was changed or added compared to the existing target version, or 'Nueva traducción completa' if none existed"
   }`;

    const userPrompt = `SOURCE LANGUAGE: ${sourceLang.toUpperCase()}
TARGET LANGUAGE: ${targetLang.toUpperCase()}
REGULATORY CONTEXT: ${context || 'Ficha regulatoria de ensayos clínicos OPS'}
EXISTING TARGET TEXT (to detect differences): "${existingTargetText || ''}"

TEXT TO TRANSLATE:
"""
${text}
"""

Return JSON only.`;

    // 4. Cascada de modelos candidatos en caso de alta demanda o cuota temporal
    const candidateModels = [
      "gemini-3.8-flash",
      "gemini-flash-latest",
      "gemini-3.6-flash",
      "gemini-3.5-flash",
      "gemini-3.5-flash-lite"
    ];

    let lastError: Error | null = null;
    let successData: any = null;
    let usedModel = candidateModels[0];

    for (const model of candidateModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json"
            }
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = errData.error?.message || `Error HTTP ${response.status} de Gemini`;
          lastError = new Error(errMsg);
          console.warn(`[Edge Function translate] Modelo ${model} no disponible: ${errMsg}. Probando siguiente...`);
          continue;
        }

        successData = await response.json();
        usedModel = model;
        break;
      } catch (err: any) {
        lastError = err;
        continue;
      }
    }

    if (!successData) {
      throw lastError || new Error("No se pudo conectar con los modelos de Google Gemini");
    }

    // 5. Parseo y sanitización de la respuesta
    const candidate = successData.candidates?.[0];
    const parts = candidate?.content?.parts || candidate?.parts || [];
    const textParts = parts.filter((p: any) => p.text && !p.thought).map((p: any) => p.text);
    const rawContent = textParts.join("\n") || parts[0]?.text || "{}";

    let cleanJson = rawContent.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    }

    let parsed: any = {};
    try {
      parsed = JSON.parse(cleanJson);
    } catch {
      parsed = { translatedText: rawContent, detectedNovelty: "Nueva traducción" };
    }

    return new Response(
      JSON.stringify({
        translatedText: parsed.translatedText || "",
        detectedNovelty: parsed.detectedNovelty || (sourceLang === "es" ? "Actualización completada" : "Update completed"),
        model: usedModel
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (err: any) {
    console.error("[Edge Function translate Error]:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Error interno en el servicio de traducción" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
