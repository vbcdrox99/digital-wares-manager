import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy } from "lucide-react";

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
};

const MatchCard = ({ match, index }: { match: DotaMatch; index: number }) => {
  const isLive = match.status === 'live';
  const isCompleted = match.status === 'completed';
  const safeTimeStr = match.match_time ? match.match_time.replace(' ', 'T') : '';
  const matchDate = new Date(safeTimeStr);
  
  let hours = '00';
  let minutes = '00';
  if (!isNaN(matchDate.getTime())) {
    hours = String(matchDate.getHours()).padStart(2, '0');
    minutes = String(matchDate.getMinutes()).padStart(2, '0');
  }

  // Definições de col com base no status da partida para diferenciar de forma limpa e moderna
  let cardBg = 'bg-[#090b14]/65 border-zinc-800/60 shadow-lg';
  let centerBorder = 'border-white/10';
  let centerLabelColor = 'text-zinc-400';
  let centerTextColor = 'text-white';
  let centerShadow = 'shadow-md';
  let statusText = 'HORÁRIO';
  let centerBg = 'bg-[#05060b]/75';

  if (isLive) {
    // Tema Roxo/Rosa Claro (Ao vivo) - Combinando com a lateral direita do OBS
    cardBg = 'bg-gradient-to-r from-fuchsia-950/65 via-[#090b14]/65 to-fuchsia-950/65 border-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.25)]';
    centerBorder = 'border-fuchsia-500';
    centerLabelColor = 'text-fuchsia-400 animate-pulse';
    centerTextColor = 'text-fuchsia-300';
    centerShadow = 'shadow-[0_0_15px_rgba(217,70,239,0.3)]';
    statusText = 'AO VIVO';
    centerBg = 'bg-fuchsia-950/65';
  } else if (isCompleted) {
    // Tema Azul/Ciano Claro (Concluído) - Combinando com a lateral esquerda do OBS
    cardBg = 'bg-gradient-to-r from-[#06111e]/65 via-[#090b14]/65 to-[#06111e]/65 border-cyan-500/30 shadow-[0_0_12px_rgba(34,211,238,0.2)]';
    centerBorder = 'border-cyan-400';
    centerLabelColor = 'text-cyan-400';
    centerTextColor = 'text-cyan-300';
    centerShadow = 'shadow-[0_0_12px_rgba(34,211,238,0.25)]';
    statusText = 'FINAL';
    centerBg = 'bg-cyan-950/65';
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.08 }}
      className={`flex-1 max-w-[560px] h-[130px] p-4 flex items-center justify-between rounded-2xl border ${cardBg} backdrop-blur-sm relative overflow-hidden`}
    >
      {/* Background glassmorphism effect */}
      <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />

      {/* Team 1 (Left) */}
      <div className="w-[220px] flex items-center justify-end gap-4 min-w-0">
        <span className="font-outfit text-2xl font-black text-white uppercase tracking-wider truncate text-right flex-1 select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
          {match.team1}
        </span>
        <div className="w-22 h-22 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-center p-2 shadow-md flex-shrink-0 overflow-hidden relative">
          {match.team1_logo ? (
            <img 
              src={match.team1_logo} 
              alt="" 
              className="w-16 h-16 object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" 
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="text-xs font-black text-zinc-500 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">T1</span>
          )}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
        </div>
      </div>

      {/* Central Score/VS Box */}
      <div className={`w-[120px] h-[98px] ${centerBg} border-2 ${centerBorder} rounded-2xl flex flex-col items-center justify-center z-10 ${centerShadow} relative overflow-hidden flex-shrink-0 backdrop-blur-sm`}>
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
        
        {/* Status label */}
        <span className={`text-[10px] font-black tracking-[0.15em] uppercase leading-none mb-2 ${centerLabelColor} drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]`}>
          {statusText}
        </span>
        {/* Score or Time */}
        <div className="flex items-center justify-center font-outfit font-black leading-none z-10">
          {isLive || isCompleted ? (
            <div className={`flex items-center ${centerTextColor} tracking-wider text-5xl font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]`}>
              <span className={isLive ? 'animate-pulse' : ''}>{match.score1 ?? 0}</span>
              <span className="mx-2 text-sm font-black text-zinc-500 uppercase tracking-tighter opacity-80">X</span>
              <span className={isLive ? 'animate-pulse' : ''}>{match.score2 ?? 0}</span>
            </div>
          ) : (
            <span className="text-3xl text-zinc-100 tracking-wide font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">{hours}:{minutes}</span>
          )}
        </div>
      </div>

      {/* Team 2 (Right) */}
      <div className="w-[220px] flex items-center justify-start gap-4 min-w-0">
        <div className="w-22 h-22 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-center p-2 shadow-md flex-shrink-0 overflow-hidden relative">
          {match.team2_logo ? (
            <img 
              src={match.team2_logo} 
              alt="" 
              className="w-16 h-16 object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" 
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="text-xs font-black text-zinc-500 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">T2</span>
          )}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
        </div>
        <span className="font-outfit text-2xl font-black text-white uppercase tracking-wider truncate text-left flex-1 select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
          {match.team2}
        </span>
      </div>
    </motion.div>
  );
};

const ObsMatchesPage = () => {
  const [matches, setMatches] = useState<DotaMatch[]>([]);
  
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [settings, setSettings] = useState({
    startDate: 'today',
    endDate: 'today',
    tournament: 'all',
    updatedAt: null as string | null
  });

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('dota_matches')
        .select('*')
        .order('match_time', { ascending: true });

      if (error) throw error;
      setMatches(data || []);
    } catch (err) {
      console.error('Erro ao buscar partidas:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('dota_matches_settings')
        .select('*')
        .eq('id', 'default')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        const obsSet = data as OBSSetting;
        setSettings({
          startDate: obsSet.start_date || 'today',
          endDate: obsSet.end_date || 'today',
          tournament: obsSet.selected_tournament || 'all',
          updatedAt: obsSet.updated_at || null
        });
      }
    } catch (err) {
      console.error('Erro ao buscar configurações do OBS:', err);
    }
  };

  useEffect(() => {
    fetchMatches();
    fetchSettings();
    
    // Auto atualiza a cada 5 minutos
    const interval = setInterval(() => {
      fetchMatches();
    }, 60000 * 5);

    // Escutar mudanças nas partidas
    const matchesChannel = supabase
      .channel('matches-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dota_matches' },
        () => fetchMatches()
      )
      .subscribe();

    // Escutar mudanças nas configurações do OBS
    const settingsChannel = supabase
      .channel('settings-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dota_matches_settings', filter: 'id=eq.default' },
        (payload) => {
          const newSettings = payload.new as OBSSetting;
          if (newSettings) {
            setSettings({
              startDate: newSettings.start_date || 'today',
              endDate: newSettings.end_date || 'today',
              tournament: newSettings.selected_tournament || 'all',
              updatedAt: newSettings.updated_at || null
            });
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(matchesChannel);
      supabase.removeChannel(settingsChannel);
    };
  }, []);

  // Filtrar partidas baseadas nos settings
  const filteredMatches = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");

    // Verifica se as configurações foram salvas em um dia anterior para o reset automático de meia-noite
    let resolvedMode = settings.startDate || 'today';
    if (settings.updatedAt) {
      const updatedDate = new Date(settings.updatedAt);
      const updatedDateYear = updatedDate.getFullYear();
      const updatedDateMonth = String(updatedDate.getMonth() + 1).padStart(2, '0');
      const updatedDateDay = String(updatedDate.getDate()).padStart(2, '0');
      const updatedDateStr = `${updatedDateYear}-${updatedDateMonth}-${updatedDateDay}`;
      
      if (updatedDateStr !== todayStr) {
        resolvedMode = 'today';
      }
    }

    let targetDateStr = todayStr;
    if (resolvedMode === 'yesterday') {
      const yest = new Date(today);
      yest.setDate(yest.getDate() - 1);
      const year = yest.getFullYear();
      const month = String(yest.getMonth() + 1).padStart(2, '0');
      const day = String(yest.getDate()).padStart(2, '0');
      targetDateStr = `${year}-${month}-${day}`;
    } else if (resolvedMode === 'tomorrow') {
      const tom = new Date(today);
      tom.setDate(tom.getDate() + 1);
      const year = tom.getFullYear();
      const month = String(tom.getMonth() + 1).padStart(2, '0');
      const day = String(tom.getDate()).padStart(2, '0');
      targetDateStr = `${year}-${month}-${day}`;
    } else if (resolvedMode !== 'today' && resolvedMode.match(/^\d{4}-\d{2}-\d{2}$/)) {
      if (resolvedMode === todayStr) {
        targetDateStr = todayStr;
      } else {
        targetDateStr = todayStr;
      }
    }

    const start = new Date(targetDateStr + "T00:00:00");
    const end = new Date(targetDateStr + "T23:59:59");

    return matches.filter(m => {
       const safeTimeStr = m.match_time ? m.match_time.replace(' ', 'T') : '';
       const mDate = new Date(safeTimeStr);
       
       if (isNaN(mDate.getTime())) return true;
       
       // Sempre mostrar jogos ao vivo independente do filtro
       if (m.status === 'live') return true;

       // Filtro de torneio
       if (settings.tournament !== 'all' && m.tournament_name !== settings.tournament) {
         return false;
       }

       // Filtro de data
       if (mDate < start) return false;
       if (mDate > end) return false;

       return true;
    });
  }, [matches, settings]);

  // Paginação Automática (Foco de UX para OBS)
  const [currentPage, setCurrentPage] = useState(0);
  const PAGE_SIZE = 3;
  const totalPages = 1 + Math.ceil(filteredMatches.length / PAGE_SIZE);

  const pageMatches = useMemo(() => {
    if (currentPage === 0) return [];
    const p = currentPage - 1;
    return filteredMatches.slice(p * PAGE_SIZE, (p + 1) * PAGE_SIZE);
  }, [filteredMatches, currentPage]);

  // Reseta para a página 0 se o número de confrontos ou filtros mudar
  useEffect(() => {
    setCurrentPage(0);
  }, [filteredMatches.length, settings.tournament, settings.startDate, settings.endDate]);

  // Timer para rotacionar as páginas de 8 em 8 segundos
  useEffect(() => {
    if (totalPages <= 1) return;
    const interval = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }, 8000);
    return () => clearInterval(interval);
  }, [totalPages]);

  if (filteredMatches.length === 0) {
    return null; // Tela limpa se não houver jogos
  }

  const currentDateStr = format(new Date(), "dd 'DE' MMMM 'DE' yyyy", { locale: ptBR });

  return (
    <div className="w-[1800px] h-[150px] text-white overflow-hidden bg-transparent flex items-center transition-all duration-500 ease-in-out">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
        .font-outfit {
          font-family: 'Outfit', sans-serif;
        }
      `}</style>
      
      <div className="w-full h-full relative overflow-hidden font-outfit">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="w-full h-full flex items-center"
          >
            {currentPage === 0 ? (
              /* SLIDE 0: INTRO DO CAMPEONATO (APENAS NOME DO TORNEIO) */
              <div className="flex items-center justify-center w-full h-full">
                <h1 className="text-6xl font-black tracking-widest text-white uppercase leading-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.95)] select-none">
                  {settings.tournament === 'all' ? 'CHOCO CUP' : settings.tournament}
                </h1>
              </div>
            ) : (
              /* SLIDES >= 1: CONFRONTOS */
              <div className="flex-1 h-full flex justify-center items-center gap-8 px-6">
                {pageMatches.map((match, index) => (
                  <MatchCard key={match.id} match={match} index={index} />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ObsMatchesPage;
