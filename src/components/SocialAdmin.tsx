import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Sparkles, MessageSquare, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SocialAdmin = () => {
  const { toast } = useToast();
  const todayStr = new Date().toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const promptText = `Você é o social media da "Dota Play", o melhor canal de transmissão de campeonatos profissionais de Dota 2 focado 100% no público brasileiro. Seu tom de voz é de um caster/narrador de esports: hype, empolgado, focado no competitivo, conhecedor profundo do "meta", das rivalidades entre os times e dos jogadores profissionais.

DATA DE REFERÊNCIA:
Hoje é ${todayStr}. Use essa data para contextualizar as buscas.

OBJETIVO:
Use a ferramenta de busca (Google Search / Web Search) para encontrar uma notícia, resultado de partida recente, atualização de patch ou novidade altamente relevante de HOJE sobre o cenário competitivo profissional de Dota 2 (focando em torneios como ESL, DreamLeague, PGL, Blast Slam, BetBoom Dacha, The International ou novidades de times e jogadores de destaque).

Após encontrar a notícia mais quente do momento, transforme-a em 1 opção de Post para Instagram (Feed ou Stories) que gere muito hype na comunidade brasileira.

FORMATO DE SAÍDA OBRIGATÓRIO:
1. LEGENDA DO POST:
(Crie uma legenda cativante em português do Brasil. O primeiro parágrafo tem que ser um "gancho" forte e impactante narrando o acontecimento com empolgação de caster. Feche com uma Call to Action chamando a galera para acompanhar as transmissões da Dota Play (Twitch/YouTube) ou perguntando a opinião deles sobre o impacto disso no cenário competitivo).

2. HASHTAGS:
(Gere de 5 a 10 hashtags relevantes. Ex: #Dota2 #Dota2Brasil #DotaPlay #Dota2Esports #ProCircuit)`;

  const copyPrompt = () => {
    navigator.clipboard.writeText(promptText);
    toast({
      title: "Prompt Copiado!",
      description: "Agora você pode colar isso no Google AI Studio (Gemini) com o Search ativado para testar.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Social Media AI (Laboratório)</h2>
          <p className="text-muted-foreground mt-1">
            Teste os prompts base do gerador de conteúdo antes de automatizar o fluxo com APIs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-black/30 border border-white/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <CardTitle>Ferramenta 1: Engenharia de Prompt (Busca por IA)</CardTitle>
            </div>
            <CardDescription>
              Prompt base configurado para que a IA busque ativamente no Google e formate o post para o Instagram.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <div className="absolute right-2 top-2 flex gap-2">
                <Button variant="secondary" size="sm" onClick={copyPrompt} className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30">
                  <Copy className="w-4 h-4 mr-2" /> Copiar Prompt
                </Button>
              </div>
              <textarea 
                className="w-full h-[420px] p-4 bg-[#0a0a0a] border border-white/10 rounded-lg text-sm font-mono text-gray-300 resize-none focus:outline-none focus:ring-1 focus:ring-purple-500 custom-scrollbar"
                readOnly
                value={promptText}
              />
            </div>
            
            <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-200">
                <strong>Como testar no Google AI Studio:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Clique em <strong>"Copiar Prompt"</strong> acima.</li>
                  <li>Acesse o <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-blue-400 underline font-bold">Google AI Studio</a>.</li>
                  <li>Cole o prompt no painel.</li>
                  <li>No menu lateral direito, ative a opção <strong>"Google Search"</strong> (ferramenta de Grounding) para permitir que a IA faça buscas em tempo real.</li>
                  <li>Execute o prompt e veja a IA buscar e criar o post perfeito!</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Roadmap */}
        <div className="space-y-6">
          <Card className="bg-black/30 border border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Próximos Passos de Integração</CardTitle>
              <CardDescription>Como esse fluxo será automatizado no sistema:</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3">
                <div className="p-3 border border-white/10 rounded-lg bg-black/50 text-sm">
                  <span className="font-bold text-purple-400 block mb-1">Passo 1: Gemini com Google Search (Edge Function)</span>
                  Uma Edge Function no Supabase (como a nossa <code className="text-gray-300">ai-caster-assistant</code>) executará esse prompt via API passando o parâmetro <code className="text-gray-300">"tools": [{"{"} google_search: {"}"}]</code>.
                </div>
                <div className="p-3 border border-white/10 rounded-lg bg-black/50 text-sm opacity-60">
                  <span className="font-bold text-gray-400 block mb-1">Passo 2: Geração de Arte Padrão</span>
                  Com base no tema da notícia encontrada, enviaremos instruções para uma API de imagem de IA (com template/logo da Dota Play pré-definido) para manter a consistência visual.
                </div>
                <div className="p-3 border border-white/10 rounded-lg bg-black/50 text-sm opacity-60">
                  <span className="font-bold text-gray-400 block mb-1">Passo 3: Publicação</span>
                  Aprovação final do admin e publicação automática via Instagram Graph API.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SocialAdmin;
