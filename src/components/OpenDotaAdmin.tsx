import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Key, Save, Database, Loader2, Send, MonitorPlay, Bot, Mic, Copy, Check, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function OpenDotaAdmin() {
  const [apiKey, setApiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [prompt, setPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [previewCard, setPreviewCard] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showApiSettings, setShowApiSettings] = useState(false);
  
  // Voices States
  const [ttsVoice, setTtsVoice] = useState(() => localStorage.getItem('opendota_tts_voice') || 'br_001');
  const [fishVoices, setFishVoices] = useState<any[]>([]);

  const handleCopyWidgetLink = () => {
    const url = `${window.location.origin}/opendota/widget`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link do widget copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const fetchKey = async () => {
      try {
        const { data, error } = await supabase
          .from('dotapix_settings')
          .select('opendota_api_key, gemini_api_key, fish_voices')
          .maybeSingle();
        
        if (data) {
          if (data.opendota_api_key) setApiKey(data.opendota_api_key);
          if (data.gemini_api_key) setGeminiKey(data.gemini_api_key);
          if (data.fish_voices) setFishVoices(data.fish_voices);
        }
      } catch (err) {
        console.error('Erro ao buscar chave do opendota:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchKey();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('dotapix_settings')
        .update({ 
          opendota_api_key: apiKey,
          gemini_api_key: geminiKey
        })
        .eq('id', '00000000-0000-0000-0000-000000000000');
        
      if (error) throw error;
      
      toast.success('Chaves salvas no Supabase com sucesso!');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao salvar no banco. Verifique as configurações.');
    } finally {
      setSaving(false);
    }
  };

  const handleAskAI = async () => {
    if (!prompt.trim()) return;
    
    setAiLoading(true);
    setPreviewCard(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-caster-assistant', {
        body: { prompt }
      });
      
      if (error) throw error;
      if (data && data.error) throw new Error(data.error);
      
      const payload = { ...data, ttsVoice };
      setPreviewCard(payload);
      toast.success('IA gerou o card com sucesso!');
      
      // Auto-send to OBS
      const channel = supabase.channel('ai-caster-events');
      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.send({
            type: 'broadcast',
            event: 'new-ai-card',
            payload: payload
          });
          toast.success('Card enviado automaticamente para a live!');
          supabase.removeChannel(channel);
        }
      });

    } catch (err: any) {
      console.error('Erro ao pedir para IA:', err);
      toast.error('Erro ao chamar a IA: ' + (err.message || 'Desconhecido'));
    } finally {
      setAiLoading(false);
    }
  };

  const handleSpeechToText = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Seu navegador não suporta reconhecimento de voz.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      toast.info('Ouvindo... Pode falar!');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setPrompt(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech error:', event.error);
      if (event.error !== 'no-speech') {
        toast.error('Erro ao ouvir a voz.');
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handlePushToLive = async () => {
    if (!previewCard) return;
    
    // Disparar evento para o widget via Supabase Channels
    const channel = supabase.channel('ai-caster-events');
    
    // É necessário estar inscrito para enviar broadcast no Supabase
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.send({
          type: 'broadcast',
          event: 'new-ai-card',
          payload: previewCard
        });
        toast.success('Card enviado para a live!');
        supabase.removeChannel(channel);
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="bg-black/30 border border-white/10 text-white">
        <CardHeader 
          className="border-b border-white/5 pb-4 cursor-pointer hover:bg-white/5 transition-colors flex flex-row items-center justify-between"
          onClick={() => setShowApiSettings(!showApiSettings)}
        >
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-6 h-6 text-red-500" />
              <CardTitle className="text-xl font-bold text-red-500">
                Integração de APIs (OpenDota & Gemini)
              </CardTitle>
            </div>
            <CardDescription className="text-gray-400 text-xs mt-1">
              Configurações de chaves de API (OpenDota, Google Gemini). Clique para expandir.
            </CardDescription>
          </div>
          {showApiSettings ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
        </CardHeader>

        {showApiSettings && (
          <CardContent className="pt-6 space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-red-400">Chave de Autenticação (API Key)</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              O OpenDota oferece uma API pública que pode ser usada sem chave, mas possui limites baixos.
              Para ter um limite maior (50.000 chamadas/mês grátis), você pode gerar uma API Key.
            </p>
            
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                <Key className="w-4 h-4 text-red-400" />
                Como obter a chave de graça:
              </h4>
              <ol className="list-decimal list-inside text-xs text-gray-400 space-y-2 ml-1">
                <li>Acesse o site <a href="https://www.opendota.com/api-keys" target="_blank" rel="noreferrer" className="text-red-400 hover:underline">opendota.com/api-keys</a>.</li>
                <li>Faça login de forma segura utilizando sua conta da Steam.</li>
                <li>No painel, você verá a sua chave gerada. Basta copiar e colar no campo abaixo.</li>
              </ol>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-medium">Sua OpenDota API Key</label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder={loading ? "Carregando..." : "Ex: 0123456789abcdef..."}
                  value={apiKey}
                  disabled={loading}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="bg-black/40 border-white/10 text-white font-mono flex-1"
                />
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <label className="text-xs text-gray-400 font-medium">Google Gemini API Key (IA Assistant)</label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder={loading ? "Carregando..." : "Ex: AIzaSyB..."}
                  value={geminiKey}
                  disabled={loading}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="bg-black/40 border-white/10 text-white font-mono flex-1"
                />
              </div>
            </div>

            <div className="pt-4">
              <Button onClick={handleSave} disabled={loading || saving} className="bg-red-600 hover:bg-red-700 text-white w-full">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {saving ? "Salvando..." : "Salvar Configurações no Banco"}
              </Button>
            </div>
          </div>
        </CardContent>
        )}
      </Card>

      {/* Assistente de IA Card */}
      <Card className="bg-black/30 border border-white/10 text-white">
        <CardHeader className="border-b border-white/5 pb-4 flex flex-row items-start justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6 text-[#2fd0df]" />
              <CardTitle className="text-xl font-bold text-[#2fd0df]">
                Assistente IA do Caster
              </CardTitle>
            </div>
            <CardDescription className="text-gray-400 text-xs max-w-xl">
              A IA usa <strong>Google Search em tempo real</strong> para buscar estatísticas de campeonatos, times e heróis. Ideal para: winrates em torneios, resultados de eventos, informações de time. <em>Histórico individual de partidas (live)</em> em breve.
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopyWidgetLink}
            className="border-[#2fd0df]/30 text-[#2fd0df] hover:bg-[#2fd0df]/10 flex-shrink-0"
          >
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            Copiar Widget
          </Button>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          <div className="flex gap-2">
            <Input
              placeholder="Ex: Qual a taxa de vitórias do jogador Yatoro com o herói Faceless Void?"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
              className="bg-black/40 border-white/10 text-white flex-1"
            />
            <Button
              onClick={handleSpeechToText}
              disabled={isListening}
              className={`bg-slate-800 hover:bg-slate-700 text-white border border-white/10 ${isListening ? 'animate-pulse text-red-400 border-red-500/50' : ''}`}
              title="Falar por voz"
            >
              <Mic className="w-4 h-4" />
            </Button>
            <Button onClick={handleAskAI} disabled={aiLoading || !prompt.trim()} className="bg-[#2fd0df] hover:bg-cyan-400 text-black font-bold">
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          
          <div className="space-y-2 mt-4">
            <label className="text-xs text-gray-400 font-medium">Voz de Leitura (TikTok TTS)</label>
            <select
              value={ttsVoice}
              onChange={(e) => {
                setTtsVoice(e.target.value);
                localStorage.setItem('opendota_tts_voice', e.target.value);
              }}
              className="w-full bg-[#16161a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 h-9"
            >
              <option value="br_001">Voz padrão (Feminina)</option>
              <option value="br_003">Voz Masculina Padrão</option>
              <option value="br_004">Voz Masculina 2</option>
              <option value="br_005">Voz Masculina 3</option>
              <option value="pt_male_bueno">Galvão Bueno</option>
              <option value="bp_female_ivete">Ivete Sangalo</option>
              <option value="bp_female_ludmilla">Ludmilla</option>
              {fishVoices && fishVoices.map((voice) => (
                voice.id && (
                  <option key={voice.id} value={voice.id}>{voice.name || 'Sem Nome'}</option>
                )
              ))}
            </select>
          </div>

          {previewCard && (
            <div className="mt-6 space-y-4">
              <h3 className="font-semibold text-sm text-[#2fd0df]">Pré-visualização do Widget</h3>
              
              <div className="p-4 bg-gradient-to-r from-slate-900 to-black border border-white/10 rounded-xl relative overflow-hidden flex items-center gap-4">
                {previewCard.avatar && (
                  <img src={previewCard.avatar} alt="Player" className="w-16 h-16 rounded-full border-2 border-[#2fd0df] shadow-[0_0_10px_rgba(47,208,223,0.5)]" />
                )}
                <div>
                  <h4 className="text-lg font-black text-white tracking-wider uppercase">{previewCard.title}</h4>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-[#2fd0df]">{previewCard.highlight}</span>
                    <span className="text-sm text-gray-300">{previewCard.description}</span>
                  </div>
                  {previewCard.player_name && (
                    <span className="text-xs text-gray-500 mt-1 block">Jogador: {previewCard.player_name}</span>
                  )}
                </div>
              </div>

              <Button 
                onClick={handlePushToLive} 
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold h-12 shadow-[0_0_15px_rgba(22,163,74,0.4)] transition-all hover:shadow-[0_0_25px_rgba(22,163,74,0.6)]"
              >
                <MonitorPlay className="w-5 h-5 mr-2" />
                Enviar Card para a Live (OBS)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
