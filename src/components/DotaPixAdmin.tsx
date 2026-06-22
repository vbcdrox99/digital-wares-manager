import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History, Settings, Monitor, Play, Copy, Check, X, Volume2, Save, BadgeDollarSign, MessageSquare, Music, Target, Percent, Clock, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Donation {
  id: string;
  donor_name: string;
  message_type: 'text' | 'audio';
  message: string | null;
  audio_url: string | null;
  amount: number;
  voice_id: string | null;
  is_paid: boolean;
  played_on_stream: boolean;
  created_at: string;
}

interface DotaPixSettings {
  id: string;
  min_donation: number;
  min_donation_custom_voice: number;
  min_donation_audio: number;
  tts_enabled: boolean;
  tts_voice: string;
  alert_volume: number;
  goal_title: string;
  goal_target: number;
  goal_start_date: string;
  goal_enabled: boolean;
  goal_end_date: string | null;
  goal_command?: string | null;
  goal_initial_value?: number | null;
  youtube_api_key?: string | null;
  youtube_channel_id?: string | null;
  youtube_integration_enabled?: boolean | null;
  fish_audio_key?: string | null;
  fish_voices?: { id: string; name: string }[] | null;
  profile_image_url?: string | null;
  channel_name?: string | null;
}

export default function DotaPixAdmin() {
  const [activeTab, setActiveTab] = useState<'history' | 'widgets' | 'config' | 'goal'>('history');
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [settings, setSettings] = useState<DotaPixSettings>({
    id: '00000000-0000-0000-0000-000000000000',
    min_donation: 3.00,
    min_donation_custom_voice: 5.00,
    min_donation_audio: 8.00,
    tts_enabled: true,
    tts_voice: 'standard',
    alert_volume: 0.8,
    goal_title: 'Meta da Live',
    goal_target: 500.00,
    goal_start_date: new Date().toISOString(),
    goal_enabled: false,
    goal_end_date: null,
    goal_command: '!pix',
    goal_initial_value: 0,
    youtube_api_key: '',
    youtube_channel_id: '',
    youtube_integration_enabled: false,
    fish_audio_key: '',
    fish_voices: [],
    profile_image_url: null,
    channel_name: 'Dota Play Brasil'
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [testMessage, setTestMessage] = useState('gostei muito desse novo sistema DotaPix!');
  const [testVoiceId, setTestVoiceId] = useState('br_001');
  const [selectedMonth, setSelectedMonth] = useState<string>('current');

  const getMonthOptions = () => {
    const options = [{ value: 'all', label: 'Todos os meses' }];
    const now = new Date();
    
    const currentMonthLabel = now.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    const capitalizedLabel = currentMonthLabel.charAt(0).toUpperCase() + currentMonthLabel.slice(1);
    options.push({ value: 'current', label: `Este Mês (${capitalizedLabel})` });

    for (let i = 1; i <= 5; i++) {
      const pastDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${pastDate.getFullYear()}-${String(pastDate.getMonth() + 1).padStart(2, '0')}`;
      const label = pastDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
      const capitalizedPastLabel = label.charAt(0).toUpperCase() + label.slice(1);
      options.push({ value, label: capitalizedPastLabel });
    }
    
    return options;
  };

  const getFilteredDonations = () => {
    return donations.filter(d => {
      if (!d.is_paid) return false;
      if (selectedMonth === 'all') return true;
      const date = new Date(d.created_at);
      const year = date.getFullYear();
      const month = date.getMonth(); // 0-indexed
      
      if (selectedMonth === 'current') {
        const now = new Date();
        return year === now.getFullYear() && month === now.getMonth();
      }
      
      const [filterYear, filterMonth] = selectedMonth.split('-').map(Number);
      return year === filterYear && (month + 1) === filterMonth;
    });
  };

  const getTotalPaidForMonth = (year: number, monthZeroIndexed: number) => {
    return donations
      .filter(d => {
        if (!d.is_paid) return false;
        const date = new Date(d.created_at);
        return date.getFullYear() === year && date.getMonth() === monthZeroIndexed;
      })
      .reduce((sum, d) => sum + Number(d.amount), 0);
  };

  const getFilteredTotalPaid = () => {
    return getFilteredDonations()
      .filter(d => d.is_paid)
      .reduce((sum, d) => sum + Number(d.amount), 0);
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('dotapix_donations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDonations((data || []) as Donation[]);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao carregar histórico.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('dotapix_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSettings({
          id: data.id,
          min_donation: Number(data.min_donation),
          min_donation_custom_voice: Number(data.min_donation_custom_voice) || 5.00,
          min_donation_audio: Number(data.min_donation_audio) || 8.00,
          tts_enabled: data.tts_enabled,
          tts_voice: data.tts_voice,
          alert_volume: Number(data.alert_volume),
          goal_title: data.goal_title || 'Meta da Live',
          goal_target: Number(data.goal_target) || 500.00,
          goal_start_date: data.goal_start_date || new Date().toISOString(),
          goal_enabled: !!data.goal_enabled,
          goal_end_date: data.goal_end_date || null,
          goal_command: data.goal_command || '!pix',
          goal_initial_value: Number(data.goal_initial_value) || 0,
          youtube_api_key: data.youtube_api_key || '',
          youtube_channel_id: data.youtube_channel_id || '',
          youtube_integration_enabled: !!data.youtube_integration_enabled,
          fish_audio_key: data.fish_audio_key || '',
          fish_voices: Array.isArray(data.fish_voices) ? data.fish_voices : [],
          profile_image_url: data.profile_image_url || null,
          channel_name: data.channel_name || 'Dota Play Brasil'
        });
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const { error } = await supabase
        .from('dotapix_settings')
        .upsert({
          id: settings.id,
          min_donation: settings.min_donation,
          min_donation_custom_voice: settings.min_donation_custom_voice,
          min_donation_audio: settings.min_donation_audio,
          tts_enabled: settings.tts_enabled,
          tts_voice: settings.tts_voice,
          alert_volume: settings.alert_volume,
          goal_title: settings.goal_title,
          goal_target: settings.goal_target,
          goal_enabled: settings.goal_enabled,
          goal_start_date: settings.goal_start_date,
          goal_end_date: settings.goal_end_date,
          goal_command: settings.goal_command || '!pix',
          goal_initial_value: settings.goal_initial_value || 0,
          youtube_api_key: settings.youtube_api_key,
          youtube_channel_id: settings.youtube_channel_id,
          youtube_integration_enabled: settings.youtube_integration_enabled,
          fish_audio_key: settings.fish_audio_key,
          fish_voices: settings.fish_voices,
          profile_image_url: settings.profile_image_url,
          channel_name: settings.channel_name,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success("Configurações salvas com sucesso!");
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao salvar configurações.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `profile_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      toast.info("Enviando foto de perfil...");

      const { error: uploadError } = await supabase.storage
        .from('dotapix-audios')
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('dotapix-audios')
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;
      setSettings(prev => ({ ...prev, profile_image_url: publicUrl }));
      toast.success("Foto de perfil enviada. Salve as configurações para aplicar!");
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao subir foto: " + err.message);
    }
  };

  const resetGoalStartDate = () => {
    const now = new Date().toISOString();
    setSettings(prev => ({ ...prev, goal_start_date: now }));
    toast.success("Progresso zerado temporariamente! Clique em 'Salvar Configurações' para confirmar no banco.");
  };

  const handleAddVoice = () => {
    const currentVoices = settings.fish_voices || [];
    setSettings(prev => ({
      ...prev,
      fish_voices: [...currentVoices, { id: '', name: '' }]
    }));
  };

  const handleRemoveVoice = (index: number) => {
    const currentVoices = settings.fish_voices || [];
    setSettings(prev => ({
      ...prev,
      fish_voices: currentVoices.filter((_, idx) => idx !== index)
    }));
  };

  const handleVoiceChange = (index: number, field: 'id' | 'name', value: string) => {
    const currentVoices = settings.fish_voices || [];
    const updated = currentVoices.map((voice, idx) => {
      if (idx === index) {
        return { ...voice, [field]: value };
      }
      return voice;
    });
    setSettings(prev => ({
      ...prev,
      fish_voices: updated
    }));
  };

  const getGoalRaisedAmount = () => {
    if (!settings.goal_start_date) return Number(settings.goal_initial_value) || 0;
    const start = new Date(settings.goal_start_date).getTime();
    const raised = donations
      .filter(d => d.is_paid && new Date(d.created_at).getTime() >= start)
      .reduce((sum, d) => sum + Number(d.amount), 0);
    return raised + (Number(settings.goal_initial_value) || 0);
  };

  const getRemainingTimeAdmin = (endDateStr: string | null) => {
    if (!endDateStr) return null;
    const diff = new Date(endDateStr).getTime() - Date.now();
    if (diff <= 0) return 'Encerrada';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getWidgetUrl = (path: 'widget' | 'goal') => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const origin = isLocal ? 'https://dotaplaybrasil.lovable.app' : window.location.origin;
    return `${origin}/dotapix/${path}`;
  };

  const copyWidgetUrl = () => {
    const url = getWidgetUrl('widget');
    navigator.clipboard.writeText(url);
    toast.success("Link do Widget copiado!");
  };

  const triggerTestAlert = async (type: 'text' | 'audio') => {
    try {
      const channel = supabase.channel('dotapix_test_alerts');
      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.send({
            type: 'broadcast',
            event: 'test-alert',
            payload: {
              donor_name: 'Doador de Teste',
              message_type: type,
              message: type === 'text' ? testMessage : null,
              amount: 15.00,
              voice_id: type === 'text' ? testVoiceId : 'standard',
              audio_url: type === 'audio' ? 'https://www.myinstants.com/media/sounds/tuturu_1.mp3' : null
            }
          });
          toast.success("Alerta de teste enviado para o OBS!");
          supabase.removeChannel(channel);
        }
      });
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao disparar teste.");
    }
  };

  return (
    <Card className="bg-black/30 border border-white/10 text-white">
      <CardHeader className="border-b border-white/5 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-cyan-400">
              <BadgeDollarSign className="w-6 h-6 text-cyan-400" />
              Painel DotaPix
            </CardTitle>
            <CardDescription className="text-gray-400 text-xs">
              Gerencie seus alertas de PIX, veja históricos e configure seu widget do OBS Studio.
            </CardDescription>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mt-4">
          <Button
            variant={activeTab === 'history' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 rounded-xl text-xs ${
              activeTab === 'history' ? 'bg-cyan-500 hover:bg-cyan-600 text-black font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            Histórico de Doações
          </Button>
          <Button
            variant={activeTab === 'widgets' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('widgets')}
            className={`flex items-center gap-2 rounded-xl text-xs ${
              activeTab === 'widgets' ? 'bg-cyan-500 hover:bg-cyan-600 text-black font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4" />
            Widgets OBS
          </Button>
          <Button
            variant={activeTab === 'config' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 rounded-xl text-xs ${
              activeTab === 'config' ? 'bg-cyan-500 hover:bg-cyan-600 text-black font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            Configurar Perfil
          </Button>
          <Button
            variant={activeTab === 'goal' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('goal')}
            className={`flex items-center gap-2 rounded-xl text-xs ${
              activeTab === 'goal' ? 'bg-cyan-500 hover:bg-cyan-600 text-black font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Target className="w-4 h-4" />
            Meta da Live
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* TAB 1: HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {/* Stats Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-xs text-gray-400 font-medium">
                  Total Recebido (Este Mês - {(() => {
                    const label = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
                    return label.charAt(0).toUpperCase() + label.slice(1);
                  })()})
                </span>
                <span className="text-2xl font-black text-emerald-400 mt-1">
                  R$ {getTotalPaidForMonth(new Date().getFullYear(), new Date().getMonth()).toFixed(2)}
                </span>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-xs text-gray-400 font-medium">
                  {selectedMonth === 'all' ? 'Total Recebido (Todo o período)' : `Total Recebido (${getMonthOptions().find(o => o.value === selectedMonth)?.label})`}
                </span>
                <span className="text-2xl font-black text-cyan-400 mt-1">
                  R$ {getFilteredTotalPaid().toFixed(2)}
                </span>
              </div>
            </div>

            {/* Filter and Update Header */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-white/5 border border-white/5 p-3 rounded-2xl">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-medium">Filtrar por período:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-[#16161a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 h-8"
                >
                  {getMonthOptions().map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <Button onClick={fetchHistory} variant="outline" size="sm" className="border-white/10 text-xs text-white">
                  Atualizar Lista
                </Button>
              </div>
            </div>

            {loadingHistory ? (
              <div className="text-center py-8 text-gray-500 text-sm">Carregando doações...</div>
            ) : getFilteredDonations().length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">Nenhuma doação recebida/paga encontrada para o período selecionado.</div>
            ) : (
              <div className="border border-white/5 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="hover:bg-transparent border-white/5">
                      <TableHead className="text-gray-400 text-xs">Doador</TableHead>
                      <TableHead className="text-gray-400 text-xs">Tipo</TableHead>
                      <TableHead className="text-gray-400 text-xs">Mensagem / Áudio</TableHead>
                      <TableHead className="text-gray-400 text-xs">Valor</TableHead>
                      <TableHead className="text-gray-400 text-xs">Stream</TableHead>
                      <TableHead className="text-gray-400 text-xs">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredDonations().map((d) => (
                      <TableRow key={d.id} className="hover:bg-white/5 border-white/5 text-sm">
                        <TableCell className="font-bold text-white">{d.donor_name}</TableCell>
                        <TableCell>
                          {d.message_type === 'audio' ? (
                            <span className="flex items-center gap-1 text-emerald-400 text-xs">
                              <Music className="w-3.5 h-3.5" /> Áudio
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-cyan-400 text-xs">
                              <MessageSquare className="w-3.5 h-3.5" /> Texto
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {d.message_type === 'audio' && d.audio_url ? (
                            <audio src={d.audio_url} controls className="h-6 w-48 mt-1" />
                          ) : (
                            <span className="text-gray-300 italic truncate block">"{d.message}"</span>
                          )}
                        </TableCell>
                        <TableCell className="font-bold text-emerald-400">
                          R$ {Number(d.amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {d.played_on_stream ? (
                            <span className="text-gray-400 text-xs font-medium">Tocado</span>
                          ) : (
                            <span className="text-cyan-400 text-xs font-bold">Fila</span>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-400 text-xs">
                          {new Date(d.created_at).toLocaleString('pt-BR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: WIDGETS */}
        {activeTab === 'widgets' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-cyan-400">Link do Widget para OBS</h3>
              <p className="text-xs text-gray-400 leading-normal">
                Copie o link abaixo e insira-o como uma fonte de navegador (Browser Source) no seu OBS Studio. Configure o tamanho para **1920x1080** ou **800x600** dependendo de como quer centralizar o alerta.
              </p>
              <div className="flex gap-2 max-w-lg mt-2">
                <Input
                  value={getWidgetUrl('widget')}
                  readOnly
                  className="bg-black/40 border-white/10 text-white text-xs py-5"
                />
                <Button onClick={copyWidgetUrl} className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold flex items-center gap-2">
                  <Copy className="w-4 h-4" />
                  Copiar
                </Button>
              </div>
            </div>

            <hr className="border-white/5" />

             <div className="space-y-4">
               <h3 className="font-semibold text-sm text-cyan-400">Testar Alertas do OBS</h3>
               <p className="text-xs text-gray-400">
                 Se você já adicionou a fonte de navegador no OBS, preencha os dados abaixo para testar as vozes de celebridades e alertas em tempo real.
               </p>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mt-2">
                 <div className="space-y-1">
                   <label className="text-xs text-gray-400 font-medium">Mensagem de Teste</label>
                   <Input 
                     value={testMessage}
                     onChange={(e) => setTestMessage(e.target.value)}
                     className="bg-black/40 border-white/10 text-white text-xs"
                     placeholder="Ex: Minha mensagem de teste!"
                   />
                 </div>

                 <div className="space-y-1">
                   <label className="text-xs text-gray-400 font-medium">Voz para o Teste</label>
                    <select
                      value={testVoiceId}
                      onChange={(e) => setTestVoiceId(e.target.value)}
                      className="w-full bg-[#16161a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 h-9"
                    >
                      <option value="br_001">Voz padrão</option>
                      <option value="pt_male_bueno">Galvão Bueno</option>
                      <option value="bp_female_ivete">Ivete Sangalo</option>
                      <option value="bp_female_ludmilla">Ludmilla</option>
                      {settings.fish_voices && settings.fish_voices.map((voice) => (
                        voice.id && (
                          <option key={voice.id} value={voice.id}>{voice.name || 'Sem Nome'}</option>
                        )
                      ))}
                    </select>
                 </div>
               </div>

               <div className="flex gap-3 mt-4">
                 <Button onClick={() => triggerTestAlert('text')} variant="outline" className="border-white/10 text-white flex items-center gap-2 text-xs">
                   <Play className="w-4 h-4 text-cyan-400" />
                   Disparar Alerta de Texto (TTS)
                 </Button>
                 <Button onClick={() => triggerTestAlert('audio')} variant="outline" className="border-white/10 text-white flex items-center gap-2 text-xs">
                   <Play className="w-4 h-4 text-emerald-400" />
                   Disparar Alerta de Áudio (Tuturu)
                 </Button>
               </div>
             </div>

            <hr className="border-white/5" />

            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-cyan-400">Widget de Meta da Live (OBS)</h3>
              <p className="text-xs text-gray-400 leading-normal">
                Copie o link abaixo e insira-o no OBS como fonte de navegador para exibir a barra de progresso da meta em tempo real.
              </p>
              <div className="flex gap-2 max-w-lg mt-2">
                <Input
                  value={getWidgetUrl('goal')}
                  readOnly
                  className="bg-black/40 border-white/10 text-white text-xs py-5"
                />
                <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(getWidgetUrl('goal'));
                    toast.success("Link do Widget de Meta copiado!");
                  }} 
                  className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copiar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CONFIG */}
        {activeTab === 'config' && (
          <div className="space-y-5 max-w-md">
            <h3 className="font-semibold text-sm text-cyan-400">Configurações Gerais</h3>

            {/* Perfil */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="relative group w-16 h-16 bg-white/5 border border-white/10 rounded-full overflow-hidden p-0.5 cursor-pointer shrink-0">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    id="admin-profile-upload" 
                    onChange={handleProfileUpload}
                  />
                  <label htmlFor="admin-profile-upload" className="w-full h-full rounded-full overflow-hidden bg-black block relative cursor-pointer">
                    <img 
                      src={settings.profile_image_url || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=128&h=128&fit=crop"} 
                      alt="Perfil" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                      <Camera className="w-4 h-4 text-white" />
                    </div>
                  </label>
                </div>
                <div className="space-y-1 flex-1">
                  <label className="text-xs text-gray-400 font-medium">Nome do Canal</label>
                  <Input
                    placeholder="Ex: Dota Play Brasil"
                    value={settings.channel_name || ''}
                    onChange={(e) => setSettings({ ...settings, channel_name: e.target.value })}
                    className="bg-black/40 border-white/10 text-white text-xs h-9"
                  />
                </div>
              </div>
            </div>

            {/* Valores Mínimos */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium">Valor Mínimo - Voz Padrão (R$)</label>
                <Input
                  type="number"
                  step="1"
                  min="3"
                  value={settings.min_donation}
                  onChange={(e) => setSettings({ ...settings, min_donation: parseFloat(e.target.value) || 3.00 })}
                  className="bg-black/40 border-white/10 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium">Valor Mínimo - Vozes Especial/Customizada (R$)</label>
                <Input
                  type="number"
                  step="1"
                  min="3"
                  value={settings.min_donation_custom_voice}
                  onChange={(e) => setSettings({ ...settings, min_donation_custom_voice: parseFloat(e.target.value) || 5.00 })}
                  className="bg-black/40 border-white/10 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium">Valor Mínimo - Enviar Áudio Gravado (R$)</label>
                <Input
                  type="number"
                  step="1"
                  min="3"
                  value={settings.min_donation_audio}
                  onChange={(e) => setSettings({ ...settings, min_donation_audio: parseFloat(e.target.value) || 8.00 })}
                  className="bg-black/40 border-white/10 text-white"
                />
              </div>
            </div>

            {/* Config de TTS */}
            <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl">
              <div className="space-y-0.5">
                <label className="text-xs font-semibold text-white">Mensagens de Voz (TTS)</label>
                <p className="text-[10px] text-gray-400">Permitir que a live fale as mensagens de texto enviadas pelos inscritos.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.tts_enabled}
                onChange={(e) => setSettings({ ...settings, tts_enabled: e.target.checked })}
                className="h-4 w-4 rounded border-white/10 text-cyan-500 bg-black/40 focus:ring-cyan-500"
              />
            </div>

            {/* Volume do Alerta */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs text-gray-400 font-medium">Volume dos Alertas</label>
                <span className="text-xs text-cyan-400 font-bold">{Math.round(settings.alert_volume * 100)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-gray-400" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.alert_volume}
                  onChange={(e) => setSettings({ ...settings, alert_volume: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
            </div>

            <hr className="border-white/5 my-4" />
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Integração Fish Audio (Opcional)</h4>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Crie uma conta gratuita em <a href="https://fish.audio" target="_blank" rel="noreferrer" className="text-cyan-400 underline">fish.audio</a>, obtenha sua API Key e adicione os IDs de vozes personalizadas clonadas.
            </p>

            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium">Fish Audio API Key</label>
              <Input
                type="password"
                placeholder="Insira sua Chave de API (Authorization Bearer)"
                value={settings.fish_audio_key || ''}
                onChange={(e) => setSettings({ ...settings, fish_audio_key: e.target.value })}
                className="bg-black/40 border-white/10 text-white text-xs h-9"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400">Vozes do Fish Audio</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddVoice}
                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 text-xs px-2 py-1 h-7"
                >
                  + Adicionar Voz
                </Button>
              </div>

              {(!settings.fish_voices || settings.fish_voices.length === 0) ? (
                <p className="text-[10px] text-gray-500 italic">Nenhuma voz adicionada. Clique em Adicionar Voz.</p>
              ) : (
                settings.fish_voices.map((voice, idx) => (
                  <div key={idx} className="border border-white/5 p-3 rounded-lg bg-black/20 space-y-2 relative group">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-cyan-400">Voz #{idx + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveVoice(idx)}
                        className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-400 font-medium">Nome da Voz</label>
                        <Input
                          placeholder="Ex: Galvão Zuado"
                          value={voice.name || ''}
                          onChange={(e) => handleVoiceChange(idx, 'name', e.target.value)}
                          className="bg-black/40 border-white/10 text-white text-xs h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-400 font-medium">ID do Modelo (Fish)</label>
                        <Input
                          placeholder="ID do Modelo"
                          value={voice.id || ''}
                          onChange={(e) => handleVoiceChange(idx, 'id', e.target.value)}
                          className="bg-black/40 border-white/10 text-white text-xs h-9"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
 
            <hr className="border-white/5 my-4" />
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Integração YouTube Super Chat (Opcional)</h4>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Monitore Super Chats ao vivo e adicione-os na meta automaticamente. Requer uma chave da API do YouTube Data v3.
            </p>
 
            <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl">
              <div className="space-y-0.5">
                <label className="text-xs font-semibold text-white">Ativar Monitoramento do YouTube</label>
                <p className="text-[10px] text-gray-400">Ativa a leitura do chat ao vivo quando estiver online.</p>
              </div>
              <input
                type="checkbox"
                checked={!!settings.youtube_integration_enabled}
                onChange={(e) => setSettings({ ...settings, youtube_integration_enabled: e.target.checked })}
                className="h-4 w-4 rounded border-white/10 text-cyan-500 bg-black/40 focus:ring-cyan-500"
              />
            </div>
 
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium">Google Cloud API Key</label>
              <Input
                type="password"
                placeholder="Insira sua Chave da API do Google"
                value={settings.youtube_api_key || ''}
                onChange={(e) => setSettings({ ...settings, youtube_api_key: e.target.value })}
                className="bg-black/40 border-white/10 text-white text-xs h-9"
              />
            </div>
 
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium">YouTube Channel ID</label>
              <Input
                placeholder="Ex: UCxxxxxxxxxxxx"
                value={settings.youtube_channel_id || ''}
                onChange={(e) => setSettings({ ...settings, youtube_channel_id: e.target.value })}
                className="bg-black/40 border-white/10 text-white text-xs h-9"
              />
            </div>

            <Button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold flex items-center gap-2 w-full justify-center rounded-xl py-5 mt-4"
            >
              {savingSettings ? (
                <>Carregando...</>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </div>
        )}

        {/* TAB 4: GOAL */}
        {activeTab === 'goal' && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-sm text-cyan-400">Configurar Meta da Live</h3>
                <p className="text-xs text-gray-400 mt-1">Crie metas para engajar seus inscritos (ex: Novo Computador, Live de 12 horas).</p>
              </div>
              <Button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold flex items-center gap-1.5 rounded-xl py-3 px-4 text-xs"
              >
                <Save className="w-4 h-4" />
                Salvar Meta
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Form */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl">
                  <div className="space-y-0.5">
                    <label className="text-xs font-semibold text-white">Ativar Meta na Tela</label>
                    <p className="text-[10px] text-gray-400">Ativa a exibição do widget no OBS.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.goal_enabled}
                    onChange={(e) => setSettings({ ...settings, goal_enabled: e.target.checked })}
                    className="h-4 w-4 rounded border-white/10 text-cyan-500 bg-black/40 focus:ring-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-medium">Título da Meta (Máx. 25 caract.)</label>
                  <Input
                    placeholder="Ex: Novo Microfone Gamer"
                    maxLength={25}
                    value={settings.goal_title ? settings.goal_title.substring(0, 25) : ''}
                    onChange={(e) => setSettings({ ...settings, goal_title: e.target.value.substring(0, 25) })}
                    className="bg-black/40 border-white/10 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-medium">Valor Alvo (R$)</label>
                  <Input
                    type="number"
                    min="5"
                    value={settings.goal_target}
                    onChange={(e) => setSettings({ ...settings, goal_target: parseFloat(e.target.value) || 100 })}
                    className="bg-black/40 border-white/10 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-medium">Valor Inicial (R$ - Já Começa Preenchido)</label>
                  <Input
                    type="number"
                    min="0"
                    value={settings.goal_initial_value || 0}
                    onChange={(e) => setSettings({ ...settings, goal_initial_value: parseFloat(e.target.value) || 0 })}
                    className="bg-black/40 border-white/10 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-medium">Data de Encerramento (Opcional)</label>
                  <Input
                    type="datetime-local"
                    value={settings.goal_end_date ? settings.goal_end_date.substring(0, 16) : ''}
                    onChange={(e) => setSettings({ ...settings, goal_end_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    className="bg-black/40 border-white/10 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-medium">Comando / Link para Apoio (ex: !pix)</label>
                  <Input
                    placeholder="Ex: !pix ou link"
                    value={settings.goal_command || ''}
                    onChange={(e) => setSettings({ ...settings, goal_command: e.target.value })}
                    className="bg-black/40 border-white/10 text-white"
                  />
                </div>

                <div className="pt-2">
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={resetGoalStartDate}
                    className="w-full text-xs font-bold py-2 rounded-xl"
                  >
                    Zerar Progresso (Iniciar Nova Meta)
                  </Button>
                  <p className="text-[10px] text-gray-500 mt-1 text-center">
                    A meta contará doações a partir de: {new Date(settings.goal_start_date).toLocaleString('pt-BR')}
                  </p>
                </div>

                <div className="border-t border-white/5 pt-3 mt-2">
                  <label className="text-xs text-gray-400 font-medium">Link do Widget de Meta</label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={`${window.location.origin}/dotapix/goal`}
                      readOnly
                      className="bg-black/40 border-white/10 text-white text-xs py-4"
                    />
                    <Button 
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/dotapix/goal`);
                        toast.success("Link do Widget de Meta copiado!");
                      }}
                      className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold flex items-center gap-1.5 text-xs py-1"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copiar
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Preview */}
              <div className="space-y-4 border border-white/10 rounded-xl p-5 bg-black/40 flex flex-col justify-center">
                <h4 className="text-xs font-semibold text-gray-400 tracking-wider uppercase mb-2">Visualização do Widget</h4>
                
                {settings.goal_enabled ? (
                  <div className="bg-white border border-neutral-100 rounded-[2rem] p-5 relative shadow-[0_20px_50px_rgba(0,0,0,0.08)] flex flex-col gap-3 font-sans" style={{ fontFamily: '"Inter", sans-serif' }}>
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-neutral-800 font-black uppercase tracking-tight truncate max-w-[180px]">{settings.goal_title || 'Sem título'}</span>
                      {getRemainingTimeAdmin(settings.goal_end_date) ? (
                        <span className="text-[#ff9f0a] font-bold flex items-center gap-1 shrink-0 bg-[#ff9f0a]/10 px-2 py-0.5 rounded-full">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{getRemainingTimeAdmin(settings.goal_end_date)}</span>
                        </span>
                      ) : (
                        <span className="text-[#0a84ff] font-bold shrink-0 bg-[#0a84ff]/10 px-2 py-0.5 rounded-full">META DA LIVE</span>
                      )}
                    </div>

                    <div className="w-full h-3 bg-[#f0f2f6] rounded-full relative overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#ff5e36] via-[#ffc600] to-[#5e5ce6] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.round((getGoalRaisedAmount() / settings.goal_target) * 100))}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-end text-xs font-bold text-neutral-800">
                      <div className="flex flex-col">
                        <span className="font-black">R$ {getGoalRaisedAmount().toFixed(2)}</span>
                        <span className="text-neutral-400 text-[8px] uppercase tracking-wider font-bold">Conquistado</span>
                      </div>
                      <span className="text-[#0a84ff] font-black bg-[#0a84ff]/10 px-2 py-0.5 rounded-full text-[10px]">{Math.min(100, Math.round((getGoalRaisedAmount() / settings.goal_target) * 100))}%</span>
                      <div className="flex flex-col text-right">
                        <span className="font-black">R$ {settings.goal_target.toFixed(2)}</span>
                        <span className="text-neutral-400 text-[8px] uppercase tracking-wider font-bold">Meta Final</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 text-xs italic">
                    Ative a meta para ver a prévia.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
