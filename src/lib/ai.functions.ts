import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const profileShape = {
  nome: z.string(),
  contato: z.string(),
  links: z.string(),
  resumo: z.string(),
  experiencias: z.string(),
  formacao: z.string(),
  cursos: z.string(),
  habilidades: z.string(),
  idiomas: z.string(),
};
const ProfileSchema = z.object(profileShape);
export type Profile = z.infer<typeof ProfileSchema>;

const AnalysisSchema = z.object({
  score: z.number(),
  presentes: z.array(z.string()),
  ausentes: z.array(z.string()),
  sugestoes: z.array(z.string()),
  curriculo: z.string(),
});
export type Analysis = z.infer<typeof AnalysisSchema>;

const Input = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("import"), texto: z.string().min(20).max(30000) }),
  z.object({
    mode: z.literal("analyze"),
    perfil: ProfileSchema,
    vaga: z.object({
      empresa: z.string().max(200),
      cargo: z.string().max(200),
      descricao: z.string().min(20).max(30000),
    }),
  }),
]);

const ATS_RULES = `Regras do currículo ATS: coluna única, texto puro, sem tabelas, imagens, ícones ou emojis. Comece com nome e contato/links. Seções nesta ordem com títulos em MAIÚSCULAS: RESUMO PROFISSIONAL, EXPERIÊNCIA PROFISSIONAL, FORMAÇÃO, HABILIDADES, CURSOS E IDIOMAS. Datas no formato MM/AAAA. Bullets simples com "- " iniciando por verbos de ação. Reescreva o resumo e os bullets incorporando palavras-chave da vaga, mas NUNCA invente empresas, cargos, datas, formações, certificações ou habilidades que não estejam no perfil.`;

export const analyzeAndGenerate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Chave de IA não configurada.");
    const { createOpenAI } = await import("@ai-sdk/openai");
    const { streamText, Output } = await import("ai");
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });

    const isImport = data.mode === "import";
    const prompt = isImport
      ? `Extraia os dados deste currículo para os campos. Use texto puro; em experiencias, formacao e cursos coloque um item por bloco com cargo/empresa/período (MM/AAAA) e bullets "- ". Habilidades e idiomas separados por vírgula. Campos ausentes = "". Não invente nada.\n\nCURRÍCULO:\n${data.texto}`
      : `Compare o perfil do candidato com a vaga. Retorne: score de 0 a 100 de aderência; palavras-chave importantes da vaga presentes no perfil (presentes) e ausentes (ausentes), até 15 cada; exatamente 3 sugestões práticas e curtas; e o currículo completo em texto (curriculo).\n${ATS_RULES}\n\nVAGA: ${data.vaga.cargo} na ${data.vaga.empresa}\n${data.vaga.descricao}\n\nPERFIL:\n${JSON.stringify(data.perfil, null, 2)}`;

    const result = streamText({
      model: provider.responses("openai/gpt-6-astra"),
      system: "Você é especialista em recrutamento e currículos ATS no Brasil. Responda em português do Brasil.",
      prompt,
      maxRetries: 0,
      output: Output.object({ schema: (isImport ? ProfileSchema : AnalysisSchema) as typeof AnalysisSchema }),
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });
    try {
      const out = await result.output;
      return out as Profile | Analysis;
    } catch (e: unknown) {
      const status = (e as { statusCode?: number })?.statusCode;
      if (status === 429) throw new Error("Muitas requisições. Tente novamente em instantes.");
      if (status === 402 || status === 403) throw new Error("Créditos de IA esgotados ou acesso bloqueado.");
      console.error(e);
      throw new Error("Não foi possível processar com a IA. Tente novamente.");
    }
  });
