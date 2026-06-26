import React, { useEffect, useState, useRef } from 'react';
import { Hourglass, Coins, CheckCircle } from 'lucide-react';

// ── Tipos ─────────────────────────────────────────────────────────────────
interface PlayerData {
  name: string;
  heroName: string | null;
  heroLevel: number;
  alive: boolean;
  respawnSeconds: number;
  kills: number;
  deaths: number;
  assists: number;
  gold: number;
  gpm: number;
  xpm: number;
  lastHits: number;
  denies: number;
  team: 'radiant' | 'dire';
  items: (string | null)[];
  backpack?: (string | null)[];
  neutral?: string | null;
  selected: boolean;
  netWorth: number;
  buybackCost: number;
  buybackCooldown: number;
}

interface HudData {
  inGame: boolean;
  gameTime: number;
  matchGameTime?: number;
  gameState: string;
  goldLead: number;
  radiantScore?: number;
  direScore?: number;
  players?: PlayerData[];
}

// ── Helpers ────────────────────────────────────────────────────────────────
const formatGold = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v);

const heroImgUrl = (name: string) =>
  `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${name}.png`;

const itemImgUrl = (name: string) =>
  `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/items/${name}_lg.png`;

// ── Componente principal ───────────────────────────────────────────────────
export default function GsiHudPage() {
  const [data, setData] = useState<HudData>({ inGame: false });
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      const ws = new WebSocket('ws://localhost:3002');
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        console.log('[HUD] Conectado ao servidor GSI');
      };

      ws.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          setData(parsed);
        } catch {}
      };

      ws.onclose = () => {
        setConnected(false);
        console.log('[HUD] Desconectado, tentando reconectar em 3s...');
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();
    return () => {
      clearTimeout(reconnectTimeout);
      wsRef.current?.close();
    };
  }, []);

  // ── HUD Layout ─────────────────────────────────────────────────────────
  if (!connected) return null; // Invisível no OBS enquanto aguarda servidor
  if (!data.inGame || !data.players || data.players.length === 0) return null; // Invisível fora de jogo

  const leadText = data.goldLead !== undefined 
    ? (data.goldLead > 0 
      ? `${data.radiantName || 'Iluminados'} +${formatGold(data.goldLead)}` 
      : `${data.direName || 'Temidos'} +${formatGold(Math.abs(data.goldLead))}`)
    : '';
  const leadColor = data.goldLead !== undefined && data.goldLead > 0 ? '#4ade80' : '#f87171';

  const isEarlyGame = data.gameTime !== undefined && data.gameTime < 360; // 6 minutos em segundos
  const isItemsView = data.gameTime !== undefined && data.gameTime > 0 && (data.gameTime % 240 >= 0 && data.gameTime % 240 < 15); // Aparece a cada 4 minutos, durante 15 segundos
  const isExpandedTime = data.gameTime !== undefined && data.gameTime > 0 && (data.gameTime % 120 >= 0 && data.gameTime % 120 < 15);
  const isExpanded = !isEarlyGame && !isItemsView && isExpandedTime;
  const isUltraLateGame = data.gameTime !== undefined && data.gameTime >= 1800; // 30 minutos em segundos

  // Ordena localmente baseado no tempo de jogo e view atual
  const sortedPlayers = [...data.players].sort((a, b) => {
    // Na visualização de inventário, agrupa por time (Radiant 5 -> Dire 5)
    if (isItemsView) {
      if (a.team !== b.team) {
        return a.team === 'radiant' ? -1 : 1;
      }
      // Dentro do time, ordena por farm
      if (isEarlyGame) {
        return (b.lastHits || 0) - (a.lastHits || 0);
      }
      return b.netWorth - a.netWorth;
    }

    // Nas outras telas, ordem geral de quem tá farmando mais (misturado)
    if (isEarlyGame) {
      return (b.lastHits || 0) - (a.lastHits || 0);
    }
    return b.netWorth - a.netWorth;
  });

  return (
    <div
      style={{
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        background: 'transparent',
        userSelect: 'none',
        padding: '10px',
        width: isExpanded || isItemsView ? '380px' : (isUltraLateGame ? '310px' : '280px'), // UltraLateGame diminuído de 360px para 310px para "encurtar" as barras
        transition: 'width 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
      }}
    >
      <style>{`
        @keyframes shine-sweep {
          0% { transform: translateX(-100%); }
          20% { transform: translateX(200%); }
          100% { transform: translateX(200%); }
        }
        @keyframes subtle-pulse {
          0%, 100% { filter: brightness(1); text-shadow: 0 2px 4px rgba(0,0,0,1); }
          50% { filter: brightness(1.25); text-shadow: 0 0 10px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,1); }
        }
        @keyframes move-stripes {
          0% { background-position: 0 0; }
          100% { background-position: 32px 0; }
        }
      `}</style>
      {/* ── Cabeçalho ── */}
      <div
        style={{
          background: '#000000',
          border: '1px solid #000000',
          borderRadius: '8px 8px 0 0',
          padding: '6px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          fontWeight: 700,
          color: '#94a3b8',
          borderBottom: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        <span>{isItemsView ? 'INVENTÁRIO' : (isEarlyGame ? 'LAST HIT/DENY' : (isUltraLateGame ? 'BUYBACK + PATRIMÔNIO' : 'PATRIMÔNIO LÍQUIDO'))}</span>
        <span style={{ color: leadColor, textShadow: `0 0 8px ${leadColor}33` }}>
          {leadText}
        </span>
      </div>

      {/* ── Lista de Jogadores ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          background: 'transparent',
          borderRadius: '0 0 8px 8px',
          border: 'none', // Removida a borda para ficar mais limpo sem o fundo
          padding: '4px',
          backdropFilter: 'blur(10px)',
          boxShadow: 'none',
        }}
      >
        {sortedPlayers.map((player, idx) => {
          const isRadiant = player.team === 'radiant';
          const teamColor = isRadiant ? '#4ade80' : '#f87171';
          

          const maxStat = isEarlyGame ? (sortedPlayers[0]?.lastHits || 1) : (sortedPlayers[0]?.netWorth || 1);
          const currentStat = isEarlyGame ? player.lastHits : player.netWorth;
          const barPct = Math.min(100, (currentStat / maxStat) * 100);

          const EmptySlot = ({ circle }: { circle?: boolean }) => (
            <div style={{ width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', borderRadius: circle ? '50%' : '2px', border: '1px solid rgba(255,255,255,0.05)' }} />
          );

          if (isItemsView) {
            // Layout Inventário seguindo o padrão Fin/Neg e Net Worth
            return (
              <div
                key={player.name + idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  height: '36px',
                  background: isRadiant 
                    ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.75) 0%, rgba(6, 78, 59, 0.5) 45%, transparent 100%)' 
                    : 'linear-gradient(90deg, rgba(225, 29, 72, 0.75) 0%, rgba(136, 19, 55, 0.5) 45%, transparent 100%)',
                  borderTop: `1px solid ${isRadiant ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)'}`,
                  marginBottom: idx === 4 ? '16px' : '0', // Separa Radiant e Dire (5-5)
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Avatar do herói colado na esquerda */}
                <div style={{ 
                  width: '54px', 
                  height: '100%', 
                  flexShrink: 0,
                  borderRight: `3px solid ${isRadiant ? '#10b981' : '#e11d48'}`,
                  boxShadow: `2px 0 10px ${isRadiant ? 'rgba(16,185,129,0.3)' : 'rgba(225,29,72,0.3)'}`,
                  position: 'relative',
                  zIndex: 2
                }}>
                  {player.heroName ? (
                    <img
                      src={heroImgUrl(player.heroName)}
                      alt={player.heroName}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.05)' }} />
                  )}
                  {/* Indicador de morto */}
                  {!player.alive && (
                    <div style={{
                      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(0,0,0,0.6)', fontSize: '14px', fontWeight: 900, color: '#ef4444', textShadow: '0 0 4px #000'
                    }}>
                      {player.respawnSeconds > 0 ? player.respawnSeconds : ''}
                    </div>
                  )}
                </div>

                {/* Shimmer de luz passando pela linha periodicamente */}
                <div 
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
                    animation: `shine-sweep ${4 + (idx % 3)}s infinite linear`,
                    animationDelay: `${idx * 0.2}s`,
                    zIndex: 1,
                    pointerEvents: 'none'
                  }}
                />

                {/* Main Items Row (6x1) */}
                <div style={{ display: 'flex', gap: '3px', flex: 1, justifyContent: 'flex-start', paddingLeft: '14px', position: 'relative', zIndex: 2 }}>
                  {Array.from({ length: 6 }).map((_, i) => {
                     const itemName = player.items?.[i];
                     return itemName ? (
                       <img key={i} src={itemImgUrl(itemName)} style={{ width: '38px', height: '28px', borderRadius: '3px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }} />
                     ) : (
                       <div key={i} style={{ width: '38px', height: '28px', background: 'rgba(0,0,0,0.5)', borderRadius: '3px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)' }} />
                     );
                  })}
                </div>
              </div>
            );
          } else if (isEarlyGame) {
            // Layout Fin/Neg estilo oficial Dota 2 + DotaPix Modern
            return (
              <div
                key={player.name + idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  height: '36px',
                  background: isRadiant 
                    ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.75) 0%, rgba(6, 78, 59, 0.5) 45%, transparent 100%)' 
                    : 'linear-gradient(90deg, rgba(225, 29, 72, 0.75) 0%, rgba(136, 19, 55, 0.5) 45%, transparent 100%)',
                  borderTop: `1px solid ${isRadiant ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)'}`,
                  marginBottom: idx === 5 ? '16px' : '0',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Avatar do herói colado na esquerda */}
                <div style={{ 
                  width: '54px', 
                  height: '100%', 
                  flexShrink: 0,
                  borderRight: `3px solid ${isRadiant ? '#10b981' : '#e11d48'}`,
                  boxShadow: `2px 0 10px ${isRadiant ? 'rgba(16,185,129,0.3)' : 'rgba(225,29,72,0.3)'}`,
                  position: 'relative',
                  zIndex: 2
                }}>
                  {player.heroName ? (
                    <img
                      src={heroImgUrl(player.heroName)}
                      alt={player.heroName}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.05)' }} />
                  )}
                  {/* Indicador de morto */}
                  {!player.alive && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(0,0,0,0.6)', fontSize: '14px', fontWeight: 900, color: '#ef4444', textShadow: '0 0 4px #000'
                    }}>
                      {player.respawnSeconds > 0 ? player.respawnSeconds : ''}
                    </div>
                  )}
                </div>

                {/* Shimmer de luz passando pela linha periodicamente */}
                <div 
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
                    animation: `shine-sweep ${4 + (idx % 3)}s infinite linear`,
                    animationDelay: `${idx * 0.2}s`,
                    zIndex: 1,
                    pointerEvents: 'none'
                  }}
                />

                {/* Estatística Principal (LH / DN) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: '14px',
                    fontStyle: 'italic',
                    animation: 'subtle-pulse 3s infinite',
                    position: 'relative',
                    zIndex: 2
                  }}
                >
                  <span style={{ fontSize: '16px', fontWeight: 900, color: '#ffffff' }}>{player.lastHits ?? 0}</span>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#94a3b8', margin: '0 6px' }}>/</span>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#cbd5e1' }}>{player.denies ?? 0}</span>
                </div>
              </div>
            );
          } else {
            // Layout Net Worth com Barras Horizontais mantendo o padrão Fin/Neg
            return (
              <div
                key={player.name + idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  height: '36px',
                  background: isRadiant 
                    ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.75) 0%, rgba(6, 78, 59, 0.5) 45%, transparent 100%)' 
                    : 'linear-gradient(90deg, rgba(225, 29, 72, 0.75) 0%, rgba(136, 19, 55, 0.5) 45%, transparent 100%)',
                  borderTop: `1px solid ${isRadiant ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)'}`,
                  marginBottom: idx === 5 ? '16px' : '0',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Avatar do herói colado na esquerda */}
                <div style={{ 
                  width: '54px', 
                  height: '100%', 
                  flexShrink: 0,
                  borderRight: `3px solid ${isRadiant ? '#10b981' : '#e11d48'}`,
                  boxShadow: `2px 0 10px ${isRadiant ? 'rgba(16,185,129,0.3)' : 'rgba(225,29,72,0.3)'}`,
                  position: 'relative',
                  zIndex: 2
                }}>
                  {player.heroName ? (
                    <img
                      src={heroImgUrl(player.heroName)}
                      alt={player.heroName}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.05)' }} />
                  )}
                  
                  {/* Indicador de Nível (Destacado) */}
                  <div style={{
                    position: 'absolute',
                    bottom: '2px', left: '2px',
                    width: '18px', height: '18px',
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255,255,255,0.4)',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: 900, color: '#ffffff',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.8)',
                    textShadow: '0 1px 2px rgba(0,0,0,1)'
                  }}>
                    {player.heroLevel}
                  </div>

                  {/* Indicador de morto */}
                  {!player.alive && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(0,0,0,0.6)', fontSize: '14px', fontWeight: 900, color: '#ef4444', textShadow: '0 0 4px #000'
                    }}>
                      {player.respawnSeconds > 0 ? player.respawnSeconds : ''}
                    </div>
                  )}
                </div>

                {/* Coluna de Buyback (Ultra Late Game) - idêntico ao painel do Dota */}
                {isUltraLateGame && (() => {
                  // h.buyback_cooldown = segundos restantes de punição (0 = sem punição)
                  const cd = player.buybackCooldown || 0;
                  // p.buyback_cost = custo em ouro para recomprar agora
                  const cost = player.buybackCost || 0;

                  const isCooldown = cd > 0;                          // Ainda em punição de tempo?
                  const isMissingGold = (player.gold || 0) < cost;   // Não tem ouro suficiente?
                  const canBuyback = !isCooldown && !isMissingGold;   // Pode recomprar? (= SIM)

                  const bbMin = Math.floor(cd / 60);
                  const bbSec = (cd % 60).toString().padStart(2, '0');
                  const goldNeeded = cost - (player.gold || 0);

                  return (
                    <div style={{
                      width: '56px',
                      height: '100%',
                      flexShrink: 0,
                      background: canBuyback
                        ? 'rgba(16, 185, 129, 0.12)'
                        : 'rgba(0,0,0,0.55)',
                      borderRight: `1px solid ${
                        canBuyback
                          ? 'rgba(16, 185, 129, 0.4)'
                          : 'rgba(255,255,255,0.08)'
                      }`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '1px',
                      position: 'relative',
                      zIndex: 2,
                    }}>
                      {canBuyback ? (
                        // ✅ SIM — pode recomprar
                        <CheckCircle
                          size={18}
                          color="#10b981"
                          strokeWidth={2.5}
                          style={{ filter: 'drop-shadow(0 0 6px rgba(16,185,129,0.9))' }}
                        />
                      ) : (
                        // ❌ NÃO — mostra o(s) bloqueio(s)
                        <>
                          {isCooldown && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <Hourglass size={10} color="#fca5a5" strokeWidth={2.5} />
                              <span style={{
                                color: '#ef4444',
                                fontSize: '11px',
                                fontWeight: 900,
                                textShadow: '0 1px 3px #000',
                                lineHeight: 1
                              }}>
                                {bbMin}:{bbSec}
                              </span>
                            </div>
                          )}
                          {isMissingGold && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <Coins size={10} color="#fbbf24" strokeWidth={2.5} />
                              <span style={{
                                color: '#fbbf24',
                                fontSize: '11px',
                                fontWeight: 900,
                                textShadow: '0 1px 3px #000',
                                lineHeight: 1
                              }}>
                                {goldNeeded}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })()}

                {/* Container da Informação */}
                <div style={{ flex: 1, height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: '14px', paddingRight: '14px' }}>
                  {/* Shimmer de luz */}
                  <div 
                    style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
                      animation: `shine-sweep ${4 + (idx % 3)}s infinite linear`,
                      animationDelay: `${idx * 0.2}s`,
                      zIndex: 1,
                      pointerEvents: 'none'
                    }}
                  />

                  {/* Valor do Net Worth e Player Name */}
                  <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '15px', fontWeight: 900, color: '#fbbf24', fontStyle: 'italic', textShadow: '0 2px 4px rgba(0,0,0,1)' }}>
                      {player.netWorth}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: 800, 
                        color: 'rgba(255,255,255,0.85)', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.5px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '100px'
                      }}>
                        {player.name}
                      </span>
                    </div>
                  </div>

                  {/* Barra Fina Elegante (Pill) - Mais Grossa e Animada */}
                  <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '8px', background: 'transparent', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      position: 'relative',
                      width: `${barPct}%`,
                      height: '100%',
                      background: isRadiant 
                        ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)' 
                        : 'linear-gradient(90deg, #e11d48 0%, #fb7185 100%)',
                      borderRadius: '4px',
                      boxShadow: isRadiant ? '0 0 8px rgba(52, 211, 153, 0.6)' : '0 0 8px rgba(251, 113, 133, 0.6)',
                      transition: 'width 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
                      overflow: 'hidden'
                    }}>
                      {/* Listras animadas na barra */}
                      <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)',
                        backgroundSize: '16px 16px',
                        animation: 'move-stripes 1s linear infinite'
                      }} />
                    </div>
                  </div>
                </div>

              </div>
            );
          }
        })}
      </div>
    </div>
  );
}
