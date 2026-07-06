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

  // Definições de cor com base no status da partida para diferenciar de forma limpa e moderna
  let pill1Bg = '';
  let pill2Bg = '';
  let centerBorder = '';
  let logoBorder = '';
  let centerLabelColor = '';
  let centerTextColor = '';
  let centerShadow = '';
  let logoBg = '';
  let cardGlow = '';

  if (isLive) {
    // Tema Roxo/Rosa Claro (Ao vivo) - Combinando com a lateral direita do OBS
    pill1Bg = 'from-fuchsia-950/40 via-purple-950/30 to-fuchsia-950/40 border-fuchsia-500/20';
    pill2Bg = 'from-fuchsia-950/40 via-purple-950/30 to-fuchsia-950/40 border-fuchsia-500/20';
    centerBorder = 'border-fuchsia-500';
    logoBorder = 'border-fuchsia-500/40';
    logoBg = 'bg-[#150a1b]';
    centerLabelColor = 'text-fuchsia-400 animate-pulse';
    centerTextColor = 'text-fuchsia-300';
    centerShadow = 'shadow-[0_0_12px_rgba(217,70,239,0.35)]';
    cardGlow = 'after:absolute after:inset-0 after:rounded-2xl after:border after:border-fuchsia-500/10 after:pointer-events-none';
  } else if (isCompleted) {
    // Tema Azul/Ciano Claro (Concluído) - Combinando com a lateral esquerda do OBS
    pill1Bg = 'from-[#0a1829]/40 via-[#07111e]/30 to-[#0a1829]/40 border-cyan-500/10';
    pill2Bg = 'from-[#0a1829]/40 via-[#07111e]/30 to-[#0a1829]/40 border-cyan-500/10';
    centerBorder = 'border-cyan-400';
    logoBorder = 'border-cyan-500/30';
    logoBg = 'bg-[#06111e]';
    centerLabelColor = 'text-cyan-400';
    centerTextColor = 'text-cyan-300';
    centerShadow = 'shadow-[0_0_10px_rgba(34,211,238,0.2)]';
    cardGlow = '';
  } else {
    // Tema Escuro/Aço (Por vir) - Neutro integrado ao painel
    pill1Bg = 'from-[#111420]/45 via-[#080a10]/20 to-[#111420]/45 border-zinc-800/20';
    pill2Bg = 'from-[#111420]/45 via-[#080a10]/20 to-[#111420]/45 border-zinc-800/20';
    centerBorder = 'border-zinc-700/80';
    logoBorder = 'border-zinc-800/40';
    logoBg = 'bg-zinc-950';
    centerLabelColor = 'text-zinc-500';
    centerTextColor = 'text-zinc-300';
    centerShadow = 'shadow-md';
    cardGlow = '';
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.08 }}
      className={`w-full flex items-center justify-between relative h-16 ${cardGlow}`}
    >
      {/* Team 1 Circular Logo */}
      <div className={`w-14 h-14 rounded-full border-2 ${logoBorder} ${logoBg} flex items-center justify-center p-1 shadow-lg z-20 flex-shrink-0 relative overflow-hidden transition-all duration-300`}>
        {match.team1_logo ? (
          <img 
            src={match.team1_logo} 
            alt="" 
            className="w-9 h-9 object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]" 
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="text-[8px] font-black text-zinc-600">T1</span>
        )}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
      </div>

      {/* Team 1 Name Pill */}
      <div className={`flex-1 h-10 flex items-center justify-center bg-gradient-to-r ${pill1Bg} rounded-l-full ml-[-12px] pr-4 pl-6 z-10 border-t border-b border-l shadow-inner min-w-0`}>
        <span className="font-outfit text-[11px] font-semibold text-white uppercase tracking-wider text-center w-full truncate px-1">
          {match.team1}
        </span>
      </div>

      {/* Central Score/VS Pill */}
      <div className={`w-[84px] h-[52px] bg-[#090d16] border-2 ${centerBorder} rounded-[14px] flex flex-col items-center justify-center z-20 mx-[-10px] ${centerShadow} relative overflow-hidden transition-all duration-300`}>
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.06] pointer-events-none" />
        
        {/* Top small label */}
        <span className={`text-[7px] font-black tracking-widest uppercase leading-none mb-1 ${centerLabelColor}`}>
          {isLive ? 'EM JOGO' : (isCompleted ? 'FINAL' : 'HORÁRIO')}
        </span>
        {/* Score or Time */}
        <div className="flex items-center justify-center font-outfit font-black text-sm leading-none z-10">
          {isLive || isCompleted ? (
            <div className={`flex items-center ${centerTextColor} tracking-wide`}>
              <span className={isLive ? 'animate-pulse' : ''}>{match.score1 ?? 0}</span>
              <span className="mx-1 text-[8px] font-black text-zinc-500 uppercase tracking-tighter opacity-80">X</span>
              <span className={isLive ? 'animate-pulse' : ''}>{match.score2 ?? 0}</span>
            </div>
          ) : (
            <span className="text-xs text-zinc-100 tracking-wide font-bold">{hours}:{minutes}</span>
          )}
        </div>
      </div>

      {/* Team 2 Name Pill */}
      <div className={`flex-1 h-10 flex items-center justify-center bg-gradient-to-r ${pill2Bg} rounded-r-full mr-[-12px] pl-4 pr-6 z-10 border-t border-b border-r shadow-inner min-w-0`}>
        <span className="font-outfit text-[11px] font-semibold text-white uppercase tracking-wider text-center w-full truncate px-1">
          {match.team2}
        </span>
      </div>

      {/* Team 2 Circular Logo */}
      <div className={`w-14 h-14 rounded-full border-2 ${logoBorder} ${logoBg} flex items-center justify-center p-1 shadow-lg z-20 flex-shrink-0 relative overflow-hidden transition-all duration-300`}>
        {match.team2_logo ? (
          <img 
            src={match.team2_logo} 
            alt="" 
            className="w-9 h-9 object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]" 
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="text-[8px] font-black text-zinc-600">T2</span>
        )}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
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
    startDate: getTodayString(),
    endDate: getTodayString(),
    tournament: 'all'
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
        const todayStr = getTodayString();
        setSettings({
          startDate: obsSet.start_date || todayStr,
          endDate: obsSet.end_date || todayStr,
          tournament: obsSet.selected_tournament || 'all'
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
            const todayStr = getTodayString();
            setSettings({
              startDate: newSettings.start_date || todayStr,
              endDate: newSettings.end_date || todayStr,
              tournament: newSettings.selected_tournament || 'all'
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
    const start = settings.startDate ? new Date(settings.startDate + "T00:00:00") : null;
    const end = settings.endDate ? new Date(settings.endDate + "T23:59:59") : null;

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
       if (start && mDate < start) return false;
       if (end && mDate > end) return false;

       return true;
    });
  }, [matches, settings]);

  // Paginação Automática (Foco de UX para OBS)
  const [currentPage, setCurrentPage] = useState(0);
  const PAGE_SIZE = 5;
  const totalPages = Math.ceil(filteredMatches.length / PAGE_SIZE);

  const pageMatches = useMemo(() => {
    return filteredMatches.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
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

  // Calcula a altura ideal com base nas partidas exibidas na página ATUAL (evita espaço preto no último slide)
  const minHeight = pageMatches.length > 0 
    ? `${pageMatches.length * 64 + (pageMatches.length - 1) * 16}px`
    : '0px';

  const currentDateStr = format(new Date(), "dd 'DE' MMMM 'DE' yyyy", { locale: ptBR });

  return (
    <div className="w-[460px] p-5 text-white overflow-hidden bg-gradient-to-b from-[#0c0d16] to-[#05060a] border border-indigo-950/80 rounded-[24px] relative shadow-2xl transition-all duration-500 ease-in-out">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
        .font-outfit {
          font-family: 'Outfit', sans-serif;
        }
      `}</style>
      
      {/* Header estilo Copa com Kings League (Cores harmonizadas com o OBS) */}
      <div className="flex items-center justify-between mb-8 font-outfit border-b border-indigo-950/40 pb-5">
        <div className="flex items-center gap-3">
          {/* Dota Play Logo com gradiente Ciano-Fúcsia */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/10">
            <Trophy className="w-5.5 h-5.5 text-zinc-950 fill-zinc-950" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white uppercase leading-none">
              {settings.tournament === 'all' ? 'CHOCO CUP' : settings.tournament}
            </h1>
            <span className="text-[8px] font-black text-zinc-500 tracking-wider uppercase mt-1 block">
              AGENDA DE HOJE
            </span>
          </div>
        </div>
        
        {/* Right side: Italic fuchsia text */}
        <div className="text-right">
          <span className="text-xl font-black italic text-fuchsia-400 tracking-tighter block leading-none">
            CONFRONTOS
          </span>
          <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mt-1 block">
            {currentDateStr}
          </span>
        </div>
      </div>

      {/* Lista de Partidas com Transição de Slide */}
      <div style={{ minHeight }} className="relative overflow-hidden font-outfit transition-all duration-500 ease-in-out">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="space-y-4"
          >
            {pageMatches.map((match, index) => (
              <MatchCard key={match.id} match={match} index={index} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ObsMatchesPage;
