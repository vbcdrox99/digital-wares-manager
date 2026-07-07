import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trophy, Clock, Swords, RefreshCw, CalendarDays, Activity, HelpCircle, Copy, CalendarRange, Filter, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type DotaMatch = {
  id: string;
  tournament_name: string;
  team1: string;
  team2: string;
  team1_logo?: string;
  team2_logo?: string;
  match_time: string;
  status: string;
  format: string;
  score1?: number | null;
  score2?: number | null;
};

type OBSSetting = {
  id: string;
  start_date: string | null;
  end_date: string | null;
  selected_tournament: string;
  updated_at?: string | null;
};

const DotaMatchesWidget = () => {
  const [matches, setMatches] = useState<DotaMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Filtros padrão (data de hoje)
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [dateMode, setDateMode] = useState<string>('today');
  const [selectedTournament, setSelectedTournament] = useState<string>('all');
  
  const { toast } = useToast();

  const fetchMatchesAndSettings = async () => {
    setLoading(true);
    try {
      // 1. Pega os jogos
      const { data: matchesData, error: matchesError } = await supabase
        .from('dota_matches')
        .select('*')
        .order('match_time', { ascending: true });

      if (matchesError) throw matchesError;
      setMatches(matchesData || []);

      // 2. Pega as configurações salvas do OBS
      const { data: settingsData, error: settingsError } = await supabase
        .from('dota_matches_settings')
        .select('*')
        .eq('id', 'default')
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') { // PGRST116 é quando não encontra registros
        throw settingsError;
      }

      if (settingsData) {
        const settings = settingsData as OBSSetting;
        if (settings.selected_tournament) setSelectedTournament(settings.selected_tournament);

        let resolvedMode = 'today';
        const todayStr = getTodayString();

        if (settings.start_date === 'yesterday') {
          resolvedMode = 'yesterday';
        } else if (settings.start_date === 'tomorrow') {
          resolvedMode = 'tomorrow';
        } else if (settings.start_date === 'today') {
          resolvedMode = 'today';
        } else if (settings.start_date) {
          // Se for uma data estática antiga que bate com hoje, considera como 'today'
          if (settings.start_date === todayStr) {
            resolvedMode = 'today';
          } else {
            // Se for de outro dia, força o reset automático para 'today'
            resolvedMode = 'today';
            supabase
              .from('dota_matches_settings')
              .upsert({
                id: 'default',
                start_date: 'today',
                end_date: 'today',
                selected_tournament: settings.selected_tournament || 'all',
                updated_at: new Date().toISOString()
              })
              .then(({ error }) => {
                if (error) console.error('Erro no reset automático de data no banco:', error);
              });
          }
        }

        // Se o registro foi atualizado em um dia anterior, também força o reset para 'today'
        if (settings.updated_at) {
          const updatedDate = new Date(settings.updated_at);
          const updatedDateYear = updatedDate.getFullYear();
          const updatedDateMonth = String(updatedDate.getMonth() + 1).padStart(2, '0');
          const updatedDateDay = String(updatedDate.getDate()).padStart(2, '0');
          const updatedDateStr = `${updatedDateYear}-${updatedDateMonth}-${updatedDateDay}`;
          
          if (updatedDateStr !== todayStr && resolvedMode !== 'today') {
            resolvedMode = 'today';
            supabase
              .from('dota_matches_settings')
              .upsert({
                id: 'default',
                start_date: 'today',
                end_date: 'today',
                selected_tournament: settings.selected_tournament || 'all',
                updated_at: new Date().toISOString()
              })
              .then(({ error }) => {
                if (error) console.error('Erro no reset automático de data por updated_at:', error);
              });
          }
        }

        setDateMode(resolvedMode);
      }
    } catch (err: any) {
      console.error('Erro ao buscar dados e configurações:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchesAndSettings();
    
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dota_matches',
        },
        () => fetchMatchesAndSettings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const triggerCron = async () => {
    setTriggering(true);
    try {
      const { data, error } = await supabase.functions.invoke('dota-matches', {
        body: { tournament: '' }
      });
      
      if (error) throw error;
      
      toast({
        title: "Sincronização Concluída",
        description: `Foram encontradas ${data?.count || 0} partidas na Liquipedia. O painel foi atualizado.`,
      });
      
      fetchMatchesAndSettings();
    } catch (err: any) {
      console.error('Erro ao acionar atualização:', err);
      toast({
        title: "Erro ao atualizar partidas",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setTriggering(false);
    }
  };

  // Salvar as configurações no Supabase para atualizar o widget estático do OBS
  const handleApplySettings = async () => {
    setSavingSettings(true);
    try {
      const { error } = await supabase
        .from('dota_matches_settings')
        .upsert({
          id: 'default',
          start_date: dateMode,
          end_date: dateMode,
          selected_tournament: selectedTournament,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Filtros Aplicados!",
        description: "A tela do OBS Studio foi atualizada instantaneamente.",
      });
    } catch (err: any) {
      console.error('Erro ao salvar configurações do OBS:', err);
      toast({
        title: "Erro ao aplicar filtros",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const uniqueTournaments = useMemo(() => {
    const tourneys = matches.map(m => m.tournament_name);
    return Array.from(new Set(tourneys)).sort();
  }, [matches]);

  const filteredMatches = useMemo(() => {
    const today = new Date();
    let targetDateStr = getTodayString();

    if (dateMode === 'yesterday') {
      const yest = new Date(today);
      yest.setDate(yest.getDate() - 1);
      const year = yest.getFullYear();
      const month = String(yest.getMonth() + 1).padStart(2, '0');
      const day = String(yest.getDate()).padStart(2, '0');
      targetDateStr = `${year}-${month}-${day}`;
    } else if (dateMode === 'tomorrow') {
      const tom = new Date(today);
      tom.setDate(tom.getDate() + 1);
      const year = tom.getFullYear();
      const month = String(tom.getMonth() + 1).padStart(2, '0');
      const day = String(tom.getDate()).padStart(2, '0');
      targetDateStr = `${year}-${month}-${day}`;
    }

    const start = new Date(targetDateStr + "T00:00:00");
    const end = new Date(targetDateStr + "T23:59:59");

    return matches.filter(match => {
      const matchDate = new Date(match.match_time);
      
      // Filtro de Torneio
      if (selectedTournament !== 'all' && match.tournament_name !== selectedTournament) {
        return false;
      }
      
      // Filtro de Data (Sempre mostra live, senão filtra pela data do dia selecionado)
      if (match.status === 'live') return true;
      if (matchDate < start) return false;
      if (matchDate > end) return false;
      
      return true;
    });
  }, [matches, dateMode, selectedTournament]);

  const copyObsUrl = () => {
    const url = `${window.location.origin}/obs/jogos-do-dia`;
    navigator.clipboard.writeText(url);
    toast({
      title: "URL Copiada!",
      description: "Agora cole nas propriedades do Browser Source no seu OBS Studio.",
    });
  };

  const todayStr = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Jogos do Dia (Liquipedia)</h2>
          <p className="text-muted-foreground mt-1 capitalize">
            {todayStr}
          </p>
        </div>
        <Button 
          variant="secondary" 
          onClick={triggerCron} 
          disabled={triggering}
          className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${triggering ? 'animate-spin' : ''}`} /> 
          Sincronizar com Liquipedia
        </Button>
      </div>

      {/* Barra de Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-black/40 rounded-xl border border-white/10 items-end">
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-purple-400" /> Período de Exibição
          </label>
          <select 
            value={dateMode} 
            onChange={(e) => setDateMode(e.target.value)}
            className="w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
          >
            <option value="yesterday">Ontem (Jogos anteriores)</option>
            <option value="today">Hoje (Ao vivo / Jogos do Dia)</option>
            <option value="tomorrow">Amanhã (Próximos confrontos)</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" /> Campeonato (Torneio)
          </label>
          <select 
            value={selectedTournament} 
            onChange={(e) => setSelectedTournament(e.target.value)}
            className="w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="all">Todos os Campeonatos</option>
            {uniqueTournaments.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <Button
            onClick={handleApplySettings}
            disabled={savingSettings}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg transition-all"
          >
            <Save className={`w-4 h-4 mr-2 ${savingSettings ? 'animate-pulse' : ''}`} />
            Aplicar Filtros no OBS
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-black/30 border border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <CardTitle>Partidas Filtradas ({filteredMatches.length})</CardTitle>
                </div>
                <CardDescription className="mt-1">
                  Confrontos correspondentes aos filtros selecionados
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <RefreshCw className="w-6 h-6 animate-spin text-purple-500" />
                </div>
              ) : filteredMatches.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground space-y-3">
                  <Swords className="w-8 h-8 opacity-20" />
                  <p>Nenhuma partida encontrada para estes filtros.</p>
                  <p className="text-xs opacity-60">Experimente alterar as datas ou torneios selecionados.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMatches.map((match) => {
                    const isLive = match.status === 'live';
                    const isCompleted = match.status === 'completed';
                    const matchDate = new Date(match.match_time);
                    return (
                      <div 
                        key={match.id} 
                        className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-300 ${
                          isLive 
                            ? 'bg-red-950/20 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]' 
                            : isCompleted 
                              ? 'bg-purple-950/5 border-purple-500/20'
                              : 'bg-black/40 border-white/10 hover:border-purple-500/50'
                        }`}
                      >
                        {isLive && (
                          <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg flex items-center gap-1 uppercase tracking-wider">
                            <Activity className="w-3 h-3" /> Ao Vivo
                          </div>
                        )}
                        {isCompleted && (
                          <div className="absolute top-0 right-0 bg-purple-900/40 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg flex items-center gap-1 uppercase tracking-wider border-l border-b border-purple-500/20">
                            Encerrado
                          </div>
                        )}
                        
                        <div className="flex flex-col h-full space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Trophy className="w-3 h-3 text-yellow-500/70" />
                              <span className="truncate max-w-[140px]" title={match.tournament_name}>
                                {match.tournament_name}
                              </span>
                            </div>
                            <div className="flex flex-col items-end text-xs font-mono text-purple-400">
                              <div className="flex items-center gap-1">
                                {isLive ? null : <Clock className="w-3 h-3" />}
                                {!isLive && format(matchDate, "HH:mm")}
                              </div>
                              <span className="text-[10px] text-gray-500">
                                {format(matchDate, "dd/MM")}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between flex-1 gap-2">
                            {/* Time 1 */}
                            <div className="flex flex-col items-center flex-1 text-center min-w-0">
                              {match.team1_logo && (
                                <img 
                                  src={match.team1_logo} 
                                  alt="" 
                                  referrerPolicy="no-referrer"
                                  className="w-8 h-8 object-contain mb-1.5 filter drop-shadow-[0_0_4px_rgba(255,255,255,0.1)]" 
                                />
                              )}
                              <span className="font-bold text-sm truncate w-full" title={match.team1}>{match.team1}</span>
                            </div>
                            
                            <div className="px-1 flex flex-col items-center flex-shrink-0">
                              {match.score1 !== null && match.score2 !== null ? (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded border mb-1 ${
                                  isLive 
                                    ? 'text-red-400 bg-red-500/10 border-red-500/20' 
                                    : 'text-purple-300 bg-purple-500/10 border-purple-500/20'
                                }`}>
                                  {match.score1} - {match.score2}
                                </span>
                              ) : (
                                <span className="text-[9px] text-muted-foreground mb-1">{match.format || 'Bo3'}</span>
                              )}
                              <Swords className="w-4 h-4 text-gray-600" />
                              {isLive && <span className="text-[8px] text-red-500 font-bold uppercase mt-1 animate-pulse">Live</span>}
                              {isCompleted && <span className="text-[8px] text-purple-400 font-bold uppercase mt-1">Fim</span>}
                              {!isLive && !isCompleted && <span className="text-[8px] text-gray-500 font-bold uppercase mt-1">{match.format || 'Bo3'}</span>}
                            </div>
                            
                            {/* Time 2 */}
                            <div className="flex flex-col items-center flex-1 text-center min-w-0">
                              {match.team2_logo && (
                                <img 
                                  src={match.team2_logo} 
                                  alt="" 
                                  referrerPolicy="no-referrer"
                                  className="w-8 h-8 object-contain mb-1.5 filter drop-shadow-[0_0_4px_rgba(255,255,255,0.1)]" 
                                />
                              )}
                              <span className="font-bold text-sm truncate w-full" title={match.team2}>{match.team2}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Informações do OBS */}
        <div className="space-y-6">
          <Card className="bg-black/30 border border-white/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-purple-400" />
                <CardTitle className="text-lg">Link do OBS Studio</CardTitle>
              </div>
              <CardDescription>
                Use esta URL estática como Fonte de Navegador.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-black/60 rounded-lg border border-white/10 font-mono text-xs text-purple-300 break-all select-all flex justify-between items-center gap-2">
                <span>{`${window.location.origin}/obs/jogos-do-dia`}</span>
                <Button variant="ghost" size="icon" onClick={copyObsUrl} className="h-8 w-8 hover:bg-purple-600/20 text-purple-400">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>

              <div className="text-xs text-gray-400 space-y-2">
                <p>🚀 <strong>Sem dor de cabeça:</strong> Esse link é 100% estático. Não precisa atualizar no OBS mesmo se você mudar as datas ou campeonatos.</p>
                <p>1. Copie o link acima e adicione no OBS.</p>
                <p>2. Configure a largura para <strong>1800</strong> e altura para <strong>150</strong>.</p>
                <p>3. Quando quiser mudar os jogos da transmissão, ajuste a data e campeonato nas caixas ao lado e clique em <strong>Aplicar Filtros no OBS</strong>.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DotaMatchesWidget;
