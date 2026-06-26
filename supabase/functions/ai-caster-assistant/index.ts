// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { prompt } = await req.json();
    if (!prompt) throw new Error("Prompt is required");

    const { data: settings, error: settingsError } = await supabase
      .from('dotapix_settings')
      .select('gemini_api_key')
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .single();

    if (settingsError || !settings?.gemini_api_key) {
      throw new Error("Chave da Gemini API nao configurada no painel Admin.");
    }

    const geminiKey = settings.gemini_api_key;
    const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const systemInstruction = `Voce e o melhor analista e comentarista de Dota 2 do Brasil. Conhece tudo sobre o cenario competitivo mundial e adora compartilhar isso com bom humor.

SEU PERFIL:
- Especialista absoluto em: herois, drafts, meta, habilidades, matchups, confrontos historicos entre times, estatisticas de campeonatos, resultados e noticias do cenario pro
- Conhece de cor os jogadores profissionais, especialmente os brasileiros: Raven, Thiolicor, Nanahara, Duster, Lelis, Analog, e os internacionais: 33, Yatoro, Puppey, Miracle, Topson, Sumail, Ame, fy, etc
- Acompanha todos os grandes torneios: Blast Slam, The International, DPC, ESL One, Dreamleague, PGL, BetBoom Dacha e afins
- Sabe o que rolou ontem, sabe o que vai rolar amanha

TOM DE VOZ:
- Bem humorado, descontraido e irreverente, como um amigo que entende tudo de Dota e nao leva a vida tao a serio
- Publico-alvo: galera entre 25 e 40 anos que joga ou assistia Dota faz anos, entende as referencias, ri de meme de Pudge e sofreu com a queda do TI
- Pode usar expressoes como: caramba, isso e brabo, que pick horrivel, meu deus que winrate, a galera ia listar, mano que isso, nossa senhora
- Direto ao ponto, sem enrolacao. O caster precisa ler em segundos ao vivo
- Nunca grosseiro ou ofensivo. Humor inteligente e afetuoso com a galera

REGRAS DE DADOS:
- Hoje e ${today}. USE a data atual para definir ultimo, mais recente, atual
- SEMPRE use Google Search para buscar dados atualizados. Priorize: Liquipedia Dota 2, Dotabuff, Stratz, HLTV, portais de esports
- NUNCA invente estatisticas, winrates ou resultados. So use o que encontrar nas buscas
- Se nao tiver dado live de historico individual de partidas, diga que isso chega em breve com o modulo live
- Quando souber o time de um jogador, SEMPRE mencione
- Cite o nome do campeonato e data quando falar de estatisticas`;

    const geminiBase = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;

    // Fase 1: Buscar dados com Google Search
    const searchResponse = await fetch(geminiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [{
          role: "user",
          parts: [{ text: `Pesquise e me traga dados precisos e atualizados sobre: ${prompt}\n\nMe da os dados brutos que encontrou: estatisticas numericas, nome completo do campeonato, data, nome e time do jogador se aplicavel.` }]
        }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.2 }
      })
    });

    const searchData = await searchResponse.json();
    if (searchData.error) throw new Error(`Gemini Search Error: ${searchData.error.message}`);

    const rawAnswer = searchData.candidates?.[0]?.content?.parts
      ?.filter((p: any) => p.text)
      ?.map((p: any) => p.text)
      ?.join('') || "Nao foi possivel obter dados.";

    console.log("Raw answer:", rawAnswer.substring(0, 600));

    // Fase 2: Formatar em card visual com tom bem humorado
    const cardResponse = await fetch(geminiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [{
          role: "user",
          parts: [{ text: `Com base nos dados abaixo, crie um card informativo para uma transmissao ao vivo de Dota 2.
O card precisa ser lido em voz alta pelo caster, entao precisa ser curto, direto e com aquele toque de humor que a galera de 25-40 anos que curte Dota vai adorar.

DADOS ENCONTRADOS:
${rawAnswer}

PERGUNTA ORIGINAL DO CASTER: "${prompt}"

COMO PREENCHER:
- title: Maximo 5 palavras, CAIXA ALTA. Pode ser dramatico ou engracado (ex: "HOODWINK TA DESTRUINDO!", "QUE WINRATE MEU DEUS")
- highlight: O numero ou dado principal em destaque. Seja impactante (ex: "37% Winrate", "46 jogos", "Team Liquid")
- description: 1-2 frases curtas com o tom humorado e informativo. O caster vai ler isso ao vivo. SEMPRE mencione o time do jogador se souber.
- player_name: Nome do jogador ou heroi relevante, ou null
- avatar_query: nome do heroi em ingles snake_case (ex: hoodwink, anti_mage, faceless_void) OU null se for sobre jogador humano ou nao aplicavel

RETORNE APENAS JSON sem markdown:
{
  "title": "...",
  "highlight": "...",
  "description": "...",
  "player_name": null,
  "avatar_query": null
}` }]
        }],
        generationConfig: { temperature: 0.6 }
      })
    });

    const cardData2 = await cardResponse.json();
    if (cardData2.error) throw new Error(`Gemini Card Error: ${cardData2.error.message}`);

    let cardText = cardData2.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    cardText = cardText.replace(/```json/g, '').replace(/```/g, '').trim();

    let cardData: any;
    try {
      cardData = JSON.parse(cardText);
    } catch (e) {
      cardData = { title: "DOTA 2 STATS", highlight: "Ver resposta", description: rawAnswer.substring(0, 200), player_name: null, avatar_query: null };
    }

    if (cardData.avatar_query) {
      const heroName = cardData.avatar_query.toLowerCase().replace(/ /g, '_').replace(/[^a-z0-9_]/g, '');
      cardData.avatar = `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${heroName}.png`;
    } else {
      cardData.avatar = null;
    }
    delete cardData.avatar_query;

    return new Response(JSON.stringify(cardData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("Erro na Edge Function:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
