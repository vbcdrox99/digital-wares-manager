import React, { useEffect, useState, useRef } from 'react';
import { Coins, Zap, Clock, TrendingUp } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// ── Tipos ─────────────────────────────────────────────────────────────────
interface PlayerStats {
  name: string;
  heroName: string;
  team: 'radiant' | 'dire';
  gained: number;
}

interface BattleSummary {
  active: boolean;
  startTime: number;
  lastDeathTime: number;
  endTime: number | null;
  deaths: string[]; 
  radiantNetWorthChange: number;
  direNetWorthChange: number;
  netWorthWinner: 'radiant' | 'dire' | 'draw';
  netWorthDifference: number;
  topGold: PlayerStats[];
  topDamage: PlayerStats[];
}

interface MomentumRecap {
  intervalMinute: number;
  clearTime: number;
  radiantGoldDiff: number;
  direGoldDiff: number;
  netWorthChange: number;
  radXPDiff: number;
  direXPDiff: number;
  xpChange: number;
}

interface PlayerData {
  name: string;
  heroName: string | null;
  team: 'radiant' | 'dire';
}

interface HudData {
  inGame: boolean;
  gameTime: number;
  matchGameTime?: number;
  gameState: string;
  radiantName?: string;
  direName?: string;
  goldLead: number;
  players?: PlayerData[];
  battleSummary?: BattleSummary | null;
  momentumRecap?: MomentumRecap | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const formatValue = (v: number) => {
  return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v);
};

const heroImgUrl = (name: string) =>
  `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${name}.png`;

// ── Componente Principal ───────────────────────────────────────────────────
export default function GsiBattleSummaryPage() {
  const [data, setData] = useState<HudData>({ inGame: false, gameTime: 0, goldLead: 0 });
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Estados locais para controlar exibição do Momentum quando a batalha terminar
  const [recapQueue, setRecapQueue] = useState<MomentumRecap | null>(null);

  useEffect(() => {
    let reconnectTimeout: ReturnType<typeof setTimeout>;
    const connect = () => {
      const ws = new WebSocket('ws://localhost:3002');
      wsRef.current = ws;
      ws.onopen = () => setConnected(true);
      ws.onmessage = (e) => {
        try { setData(JSON.parse(e.data)); } catch (err) {}
      };
      ws.onclose = () => {
        setConnected(false);
        reconnectTimeout = setTimeout(connect, 3000);
      };
      ws.onerror = () => ws.close();
    };
    connect();
    return () => { clearTimeout(reconnectTimeout); wsRef.current?.close(); };
  }, []);

  // Sincroniza o queue se vier do backend
  useEffect(() => {
    if (data.momentumRecap) {
      setRecapQueue(data.momentumRecap);
    }
  }, [data.momentumRecap]);

  if (!connected || !data.inGame) return null;

  // Variantes de Animação
  const contentVariants = {
    initial: { opacity: 0, y: 10, filter: 'blur(4px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.2, ease: "easeOut" } },
    exit: { opacity: 0, y: -10, filter: 'blur(4px)', transition: { duration: 0.15, ease: "easeIn" } }
  };

  // Lógica da Batalha
  const summary = data.battleSummary;
  const isBattleActive = summary?.active || false;
  const timeSinceEnd = summary && summary.endTime !== null && summary.endTime !== undefined
    ? (data.matchGameTime !== undefined ? data.matchGameTime - summary.endTime : data.gameTime - summary.endTime)
    : 0;
    
  const battleTotalDuration = 13;
  const shouldShowBattle = summary && !isBattleActive && timeSinceEnd < (battleTotalDuration + 1);

  // Lógica do Momentum
  // Se está mostrando batalha (ou se tem contagem rolando), não mostramos momentum
  let shouldShowMomentum = false;
  const clockMomentum = data.gameTime; // gameTime corresponde ao map.clock_time do backend
  const isBattleBusy = isBattleActive || shouldShowBattle;
  
  if (!isBattleBusy && recapQueue) {
    if (clockMomentum < recapQueue.clearTime) {
      shouldShowMomentum = true;
    } else {
      // Limpa a fila se já expirou
      if (clockMomentum > recapQueue.clearTime + 5) setRecapQueue(null);
    }
  }

  // Se nenhum dos dois, não renderiza a casca principal
  if (!shouldShowBattle && !shouldShowMomentum) return null;

  const renderBattleSummary = () => {
    if (!summary) return null;
    let phase = 1;
    if (timeSinceEnd >= 9) phase = 3;
    else if (timeSinceEnd >= 5) phase = 2;

    const isRadiantWin = summary.netWorthWinner === 'radiant';
    const isDireWin = summary.netWorthWinner === 'dire';
    const winnerName = isRadiantWin ? (data.radiantName || 'Radiant') : (isDireWin ? (data.direName || 'Dire') : '');
    const winnerColor = isRadiantWin ? 'text-emerald-400' : 'text-rose-400';

    const renderSingleLineTop = (title: string, list: PlayerStats[], icon: React.ReactNode, isGold: boolean) => {
      const maxVal = Math.max(...list.map(d => d.gained), 1);
  
      return (
        <motion.div key={title} variants={contentVariants} initial="initial" animate="animate" exit="exit" className="absolute inset-0 flex items-center w-full h-full gap-4 px-6">
          <div className="flex items-center gap-1.5 w-[110px] shrink-0 border-r border-white/10 pr-2">
            {icon}
            <span className={`text-[11px] font-black uppercase tracking-[0.1em] ${isGold ? 'text-amber-400' : 'text-orange-400'}`}>
              {title}
            </span>
          </div>
          
          <div className="flex flex-1 items-center gap-6 justify-between">
            {list.slice(0, 3).map((hero, i) => {
              const pct = (hero.gained / maxVal) * 100;
              const isRad = hero.team === 'radiant';
              const barColor = isRad ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 'bg-gradient-to-r from-rose-600 to-rose-400';
              const borderColor = isRad ? 'border-emerald-500/60' : 'border-rose-500/60';
  
              return (
                <div key={i} className="flex flex-1 items-center gap-3">
                  <div className={`relative w-[46px] h-[26px] shrink-0 overflow-hidden rounded-sm border ${borderColor}`}>
                    <img src={heroImgUrl(hero.heroName)} alt={hero.heroName} className="w-full h-full object-cover scale-110" />
                  </div>
                  <div className="flex flex-col flex-1 gap-[3px] justify-center pt-0.5">
                    <span className={`text-[13px] font-black leading-none tracking-wide ${isGold ? 'text-amber-300' : 'text-orange-200'}`}>
                      {isGold ? '+' : ''}{formatValue(hero.gained)}
                    </span>
                    <div className="w-full h-1.5 bg-black/80 rounded-full overflow-hidden flex border border-white/10 shadow-inner">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.1 }} className={`h-full ${barColor}`} />
                    </div>
                  </div>
                </div>
              );
            })}
            {list.length === 0 && <span className="text-[11px] text-slate-500">Nenhum dado</span>}
          </div>
        </motion.div>
      );
    };

    return (
      <>
        {phase === 1 && (
          <motion.div key="phase1" variants={contentVariants} initial="initial" animate="animate" exit="exit" className="absolute inset-0 flex items-center justify-center w-full h-full gap-2">
            {summary.netWorthWinner !== 'draw' ? (
              <>
                <span className="text-slate-400 font-bold uppercase tracking-widest text-[12px]">O time</span>
                <span className={`${winnerColor} font-black uppercase tracking-[0.1em] text-lg mx-1`}>
                  {winnerName}
                </span>
                <span className="text-slate-400 font-bold uppercase tracking-widest text-[12px]">ganhou</span>
                <span className={`${winnerColor} font-black text-2xl mx-1`}>
                  +{formatValue(summary.netWorthDifference)}
                </span>
                <span className="text-slate-400 font-bold uppercase tracking-widest text-[12px]">nesta Team Fight</span>
              </>
            ) : (
              <span className="text-slate-300 font-bold uppercase tracking-widest text-[12px]">Empate financeiro na Team Fight</span>
            )}
          </motion.div>
        )}
        {phase === 2 && renderSingleLineTop('Maior Dano', summary.topDamage, <Zap className="w-4 h-4 text-orange-400" />, false)}
        {phase === 3 && renderSingleLineTop('Mais Ouro', summary.topGold, <Coins className="w-4 h-4 text-amber-400" />, true)}
      </>
    );
  };

  const renderMomentumRecap = () => {
    if (!recapQueue) return null;
    
    // Nomes das equipes
    const radName = data.radiantName || 'Radiant';
    const dirName = data.direName || 'Dire';

    // Calcula quem ganhou a janela de 5 minutos
    const radiantGainedNW = recapQueue.netWorthChange > 0;
    const radiantGainedXP = recapQueue.xpChange > 0;
    
    const nwWinner = radiantGainedNW ? radName : dirName;
    const nwWinnerColor = radiantGainedNW ? 'text-emerald-400' : 'text-rose-400';
    
    const absNwChange = Math.abs(recapQueue.netWorthChange);
    const absXpChange = Math.abs(recapQueue.xpChange);

    return (
      <motion.div key="momentum" variants={contentVariants} initial="initial" animate="animate" exit="exit" className="absolute inset-0 flex items-center w-full h-full gap-4 px-6">
        {/* Título */}
        <div className="flex flex-col items-center justify-center w-[140px] shrink-0 border-r border-white/20 pr-4">
          <div className="flex items-center gap-1.5 text-cyan-300">
            <Clock className="w-4 h-4" />
            <span className="text-[12px] font-black uppercase tracking-widest">Últimos 5 Min</span>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="flex flex-1 items-center justify-around px-2">
          {/* Box de Ouro */}
          <div className="flex items-center gap-3">
             <TrendingUp className={`w-6 h-6 ${nwWinnerColor}`} />
             <div className="flex flex-col justify-center">
               <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Ouro Adquirido</span>
               <div className="flex items-baseline gap-1.5 -mt-1">
                 <span className={`${nwWinnerColor} font-black text-2xl tracking-tighter drop-shadow-md`}>+{formatValue(absNwChange)}</span>
                 <span className={`${nwWinnerColor} text-[12px] font-black uppercase tracking-wider`}>{nwWinner}</span>
               </div>
             </div>
          </div>

          <div className="w-px h-8 bg-white/20"></div>

          {/* Box de XP */}
          <div className="flex items-center gap-3">
             <TrendingUp className={`w-6 h-6 ${radiantGainedXP ? 'text-emerald-400' : 'text-rose-400'}`} />
             <div className="flex flex-col justify-center">
               <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">XP Adquirido</span>
               <div className="flex items-baseline gap-1.5 -mt-1">
                 <span className={`${radiantGainedXP ? 'text-emerald-400' : 'text-rose-400'} font-black text-2xl tracking-tighter drop-shadow-md`}>+{formatValue(absXpChange)}</span>
                 <span className={`${radiantGainedXP ? 'text-emerald-400' : 'text-rose-400'} text-[12px] font-black uppercase tracking-wider`}>{radiantGainedXP ? radName : dirName}</span>
               </div>
             </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="fixed top-[95px] left-1/2 transform -translate-x-1/2 z-50 pointer-events-none select-none">
      <motion.div
        initial={{ opacity: 0, scaleX: 0.9, y: -20 }}
        animate={{ opacity: 1, scaleX: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-[850px] h-[48px] bg-gradient-to-r from-[#070a0f]/95 via-[#111722]/95 to-[#070a0f]/95 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_15px_40px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden relative"
      >
        <AnimatePresence mode="wait">
          {shouldShowBattle ? renderBattleSummary() : (shouldShowMomentum ? renderMomentumRecap() : null)}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
