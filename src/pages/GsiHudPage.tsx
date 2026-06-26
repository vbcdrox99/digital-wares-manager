import React, { useEffect, useState, useRef } from 'react';

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
}

interface HudData {
  inGame: boolean;
  gameTime?: number;
  gameState?: string;
  goldLead?: number;
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
      ? `Radiant +${formatGold(data.goldLead)}` 
      : `Dire +${formatGold(Math.abs(data.goldLead))}`)
    : '';
  const leadColor = data.goldLead !== undefined && data.goldLead > 0 ? '#4ade80' : '#f87171';

  const isEarlyGame = data.gameTime !== undefined && data.gameTime < 420; // 7 minutos em segundos
  const isItemsView = data.gameTime !== undefined && data.gameTime > 0 && (data.gameTime % 60 >= 45); // Aparece nos últimos 15s de cada minuto
  const isExpandedTime = data.gameTime !== undefined && data.gameTime > 0 && (data.gameTime % 120 >= 0 && data.gameTime % 120 < 15);
  const isExpanded = !isEarlyGame && !isItemsView && isExpandedTime;

  // Ordena localmente baseado no tempo de jogo
  const sortedPlayers = [...data.players].sort((a, b) => {
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
        width: isExpanded || isItemsView ? '380px' : '280px', // Expandido horizontalmente
        transition: 'width 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
      }}
    >
      {/* ── Cabeçalho ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(10,10,20,0.95) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
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
        <span>{isItemsView ? 'INVENTÁRIO' : (isEarlyGame ? 'ÚLTIMOS GOLPES' : 'PATRIMÔNIO LÍQUIDO')}</span>
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
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
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
            return (
              <div
                key={player.name + idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  background: 'rgba(15, 23, 42, 0.4)', // Glassmorphism escuro
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  position: 'relative',
                  transition: 'all 0.4s ease',
                  overflow: 'hidden',
                }}
              >
                {/* Barra de time na esquerda do bloco */}
                <div
                  style={{
                    width: '3px',
                    height: '32px',
                    borderRadius: '2px',
                    background: teamColor,
                    marginRight: '8px',
                  }}
                />

                {/* Avatar do herói */}
                <div style={{ position: 'relative', width: '56px', height: '32px', marginRight: '12px', flexShrink: 0 }}>
                  {player.heroName ? (
                    <img
                      src={heroImgUrl(player.heroName)}
                      alt={player.heroName}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '3px',
                        objectFit: 'cover',
                        border: `1px solid ${player.alive ? 'rgba(255,255,255,0.2)' : '#f87171'}`,
                        filter: 'none',
                      }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', borderRadius: '3px', background: 'rgba(255,255,255,0.05)' }} />
                  )}
                  {/* Indicador de morto */}
                  {!player.alive && (
                    <div style={{
                      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'transparent', borderRadius: '3px', fontSize: '14px', fontWeight: 900, color: '#ef4444', textShadow: '0 0 4px #000, 0 0 4px #000, 0 0 6px #000'
                    }}>
                      {player.respawnSeconds > 0 ? player.respawnSeconds : ''}
                    </div>
                  )}
                </div>

                {/* Main Items Row (6x1) */}
                <div style={{ display: 'flex', gap: '4px', flex: 1, justifyContent: 'flex-start' }}>
                  {Array.from({ length: 6 }).map((_, i) => {
                     const itemName = player.items?.[i];
                     return itemName ? (
                       <img key={i} src={itemImgUrl(itemName)} style={{ width: '40px', height: '30px', borderRadius: '3px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                     ) : (
                       <div key={i} style={{ width: '40px', height: '30px', background: 'rgba(0,0,0,0.4)', borderRadius: '3px', border: '1px solid rgba(255,255,255,0.05)' }} />
                     );
                  })}
                </div>
              </div>
            );
          } else if (isEarlyGame) {
            return (
              <div
                key={player.name + idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  height: '24px', // Altura fixa pequena para ficar "prensado" igual ao jogo
                  background: 'transparent',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  overflow: 'hidden',
                }}
              >
                {/* Fundo da trilha da barra (Glassmorphism) */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '4px', 
                    left: '52px', 
                    right: '12px',
                    height: '6px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 0,
                  }}
                >
                  {/* Barra preenchida com degradê suave */}
                  <div
                    style={{
                      height: '100%',
                      width: `${barPct}%`,
                      background: isRadiant 
                        ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.4) 0%, rgba(52, 211, 153, 1) 100%)' 
                        : 'linear-gradient(90deg, rgba(220, 38, 38, 0.4) 0%, rgba(248, 113, 113, 1) 100%)',
                      borderRadius: '10px',
                      boxShadow: isRadiant ? '0 1px 6px rgba(52, 211, 153, 0.4)' : '0 1px 6px rgba(248, 113, 113, 0.4)',
                      transition: 'width 0.3s ease-out',
                      position: 'relative',
                    }}
                  >
                    {/* Botão/Handle brilhante na ponta (estilo UI Slider) */}
                    <div
                      style={{
                        position: 'absolute',
                        right: '-4px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '10px',
                        height: '10px',
                        background: '#ffffff',
                        borderRadius: '50%',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.6), inset 0 -1px 2px rgba(0,0,0,0.1)',
                        zIndex: 1,
                      }}
                    />
                  </div>
                </div>



                {/* Conteúdo principal */}
                <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                  
                  {/* Avatar do herói */}
                  <div style={{ 
                    width: '42px', 
                    height: '100%', 
                    flexShrink: 0,
                    border: '1px solid transparent',
                    boxSizing: 'border-box'
                  }}>
                    {player.heroName ? (
                      <img
                        src={heroImgUrl(player.heroName)}
                        alt={player.heroName}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          filter: 'none',
                        }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.05)' }} />
                    )}
                    {/* Indicador de morto (Tempo) cobrindo a foto inteira se estiver morto */}
                    {!player.alive && (
                      <div style={{
                        position: 'absolute', top: 0, left: 0, width: '42px', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'transparent', fontSize: '14px', fontWeight: 900, color: '#ef4444', textShadow: '0 0 4px #000, 0 0 4px #000, 0 0 6px #000'
                      }}>
                        {player.respawnSeconds > 0 ? player.respawnSeconds : ''}
                      </div>
                    )}
                  </div>

                  {/* Estatística Principal (LH/DN) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: '10px',
                      fontStyle: 'italic', // Fonte inclinada igual ao jogo
                      textShadow: '1px 1px 2px rgba(0,0,0,0.9)',
                    }}
                  >
                    <span style={{ fontSize: '14px', fontWeight: 900, color: '#f8fafc' }}>{player.lastHits ?? 0}</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', margin: '0 3px' }}>/</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1' }}>{player.denies ?? 0}</span>
                  </div>

                </div>
              </div>
            );
          } else {
            // Layout Moderno de Patrimônio Líquido (Avatar e info em cima, barra brilhante embaixo)
            return (
              <div
                key={player.name + idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  background: 'rgba(15, 23, 42, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  position: 'relative',
                  transition: 'all 0.4s ease',
                }}
              >
                {/* Linha Superior: Avatar, Nomes e Valor */}
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  {/* Avatar do herói com borda do time */}
                  <div 
                    style={{ 
                      position: 'relative', 
                      width: '40px', 
                      height: '24px', 
                      flexShrink: 0,
                      border: `1.5px solid ${teamColor}`,
                      borderRadius: '4px',
                      overflow: 'hidden',
                      boxShadow: `0 0 6px ${teamColor}33`,
                    }}
                  >
                    {player.heroName ? (
                      <img
                        src={heroImgUrl(player.heroName)}
                        alt={player.heroName}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.05)' }} />
                    )}
                    
                    {/* Level badge */}
                    <div style={{
                      position: 'absolute', bottom: 0, right: 0,
                      background: 'rgba(15, 23, 42, 0.95)',
                      borderTopLeftRadius: '3px',
                      padding: '0 3px', 
                      fontSize: '7px', 
                      fontWeight: 800, 
                      color: '#e2e8f0',
                      lineHeight: '10px',
                      zIndex: 2,
                    }}>
                      {player.heroLevel}
                    </div>

                    {/* Indicador de morto */}
                    {!player.alive && (
                      <div style={{
                        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.35)', fontSize: '11px', fontWeight: 900, color: '#ef4444', textShadow: '0 0 4px #000',
                        zIndex: 1,
                      }}>
                        {player.respawnSeconds > 0 ? player.respawnSeconds : ''}
                      </div>
                    )}
                  </div>

                  {/* Nome do Jogador e Estatísticas adicionais */}
                  <div style={{ marginLeft: '10px', flex: 1, minWidth: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#ffffff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: 1.2,
                        }}
                      >
                        {player.name}
                      </span>
                      
                      {/* Estatísticas (KD/A e GPM) animadas na expansão */}
                      <span 
                        style={{ 
                          fontSize: '8px', 
                          color: '#94a3b8', 
                          lineHeight: 1,
                          height: isExpanded ? '10px' : '0px',
                          opacity: isExpanded ? 1 : 0,
                          transition: 'all 0.4s ease',
                          overflow: 'hidden',
                          marginTop: isExpanded ? '2px' : '0px',
                        }}
                      >
                        {player.kills}/{player.deaths}/{player.assists} • GPM: {player.gpm}
                      </span>
                    </div>

                    {/* Valor do Patrimônio Líquido */}
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 900,
                        color: '#fbbf24',
                        textShadow: '0 0 8px rgba(251, 191, 36, 0.3)',
                        lineHeight: 1,
                        flexShrink: 0,
                        marginLeft: '8px',
                      }}
                    >
                      {formatGold(player.netWorth)}
                    </span>
                  </div>
                </div>

                {/* Linha Inferior: Barra de Net Worth com Efeito Glow */}
                <div 
                  style={{ 
                    width: '100%', 
                    height: '8px', 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    borderRadius: '4px', 
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      width: `${barPct}%`,
                      height: '100%',
                      background: isRadiant 
                        ? 'linear-gradient(90deg, #22c55e 0%, #4ade80 100%)' 
                        : 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)',
                      borderRadius: '4px',
                      boxShadow: `0 0 8px ${teamColor}66`,
                      transition: 'width 0.4s ease-out',
                    }}
                  />
                </div>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}

