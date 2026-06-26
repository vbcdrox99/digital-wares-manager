/**
 * DOTA 2 GSI SERVER - Game State Integration
 * 
 * Este servidor recebe os dados em tempo real do Dota 2
 * e transmite para o widget OBS via WebSocket.
 * 
 * Execute com: node index.js
 */

const http = require('http');
const { WebSocketServer } = require('ws');

const GSI_PORT = 3001;  // Porta que o Dota 2 manda os dados
const WS_PORT = 3002;   // Porta que o widget OBS vai ler

let lastState = null;
let activeBattle = null;
let lastBattle = null;
let previousPlayers = {};

// Momentum
let momentumSnapshots = {};
let momentumRecap = null;

// ─── HTTP Server (recebe dados do Dota 2) ──────────────────────────────────
const httpServer = http.createServer((req, res) => {
  // Permite o widget acessar (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const state = JSON.parse(body);
        lastState = state;

        // Salva um dump do payload para debug do buyback
        const fs = require('fs');
        if (!fs.existsSync('payload_dump.json')) {
          fs.writeFileSync('payload_dump.json', JSON.stringify(state, null, 2));
        }

        // Extrai só o que importa para a HUD
        const hudData = extractHudData(state);

        // Envia para todos os widgets conectados via WebSocket
        wss.clients.forEach(client => {
          if (client.readyState === 1) {
            client.send(JSON.stringify(hudData));
          }
        });

        // console.log(`[GSI] Dados recebidos - Net Worth: ${hudData.players[0]?.netWorth}`);
      } catch (e) {
        console.error('[GSI] Erro ao parsear estado:', e.message);
      }
      res.writeHead(200);
      res.end('OK');
    });
  } else if (req.method === 'GET' && req.url === '/state') {
    // Endpoint para o widget buscar o estado atual (polling)
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(lastState ? extractHudData(lastState) : { inGame: false }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// ─── WebSocket Server (transmite para o widget) ───────────────────────────
const wss = new WebSocketServer({ port: WS_PORT });

wss.on('connection', (ws) => {
  console.log('[WS] Widget conectado!');
  // Envia o estado atual imediatamente ao conectar
  if (lastState) {
    ws.send(JSON.stringify(extractHudData(lastState)));
  } else {
    ws.send(JSON.stringify({ inGame: false }));
  }

  ws.on('close', () => console.log('[WS] Widget desconectado'));
});

// ─── Extração dos dados relevantes ────────────────────────────────────────
function extractHudData(state) {
  const map = state.map || {};
  const inGame = map.game_state === 'DOTA_GAMERULES_STATE_GAME_IN_PROGRESS'
    || map.game_state === 'DOTA_GAMERULES_STATE_PRE_GAME';

  const players = [];

  // Se estiver em jogo, extrai os dados dos 10 players
  if (inGame && state.player && state.hero) {
    const teams = ['team2', 'team3'];
    
    teams.forEach(teamKey => {
      const teamPlayers = state.player[teamKey] || {};
      const teamHeroes = state.hero[teamKey] || {};
      const teamItems = state.items?.[teamKey] || {};

      Object.keys(teamPlayers).forEach(pKey => {
        const p = teamPlayers[pKey] || {};
        const h = teamHeroes[pKey] || {};
        const itemsObj = teamItems[pKey] || {};

        // Parse dos items do player
        const mainItems = [];
        for (let i = 0; i <= 5; i++) {
          const slot = itemsObj[`slot${i}`];
          mainItems.push(slot && slot.name && slot.name !== 'empty' ? slot.name.replace('item_', '') : null);
        }
        
        const backpackItems = [];
        for (let i = 6; i <= 8; i++) {
          const slot = itemsObj[`slot${i}`];
          backpackItems.push(slot && slot.name && slot.name !== 'empty' ? slot.name.replace('item_', '') : null);
        }
        
        const neutralSlot = itemsObj['neutral0'];
        const neutralItem = neutralSlot && neutralSlot.name && neutralSlot.name !== 'empty' ? neutralSlot.name.replace('item_', '') : null;

        if (pKey === 'player0') console.log('[GSI DEBUG] Player keys:', Object.keys(p));

        players.push({
          name: p.name || 'Desconhecido',
          heroName: h.name ? h.name.replace('npc_dota_hero_', '') : null,
          heroLevel: h.level || 1,
          alive: h.alive !== false,
          respawnSeconds: h.respawn_seconds || 0,
          kills: p.kills || 0,
          deaths: p.deaths || 0,
          assists: p.assists || 0,
          lastHits: p.last_hits || p.lh || 0,
          denies: p.denies || p.deny || 0,
          netWorth: p.net_worth || 0,
          heroDamage: p.hero_damage || 0,
          gold: p.gold || 0,
          gpm: p.gpm || 0,
          xpm: p.xpm || 0,
          // buyback_cooldown é um TIMESTAMP do map.game_time quando o cooldown acaba (não segundos restantes!)
          // Então subtraimos o game_time atual para obter os segundos restantes reais.
          buybackCooldown: h.buyback_cooldown > 0 ? Math.max(0, h.buyback_cooldown - map.game_time) : 0,
          buybackCost: h.buyback_cost || 0,
          team: teamKey === 'team2' ? 'radiant' : 'dire',
          items: mainItems,
          backpack: backpackItems,
          neutral: neutralItem,
          selected: h.selected_unit === true
        });
      });
    });
  }

  // Ordena por Net Worth decrescente por padrão
  players.sort((a, b) => b.netWorth - a.netWorth);

  // Calcula a vantagem de ouro total
  const radiantGold = players.filter(p => p.team === 'radiant').reduce((sum, p) => sum + p.netWorth, 0);
  const direGold = players.filter(p => p.team === 'dire').reduce((sum, p) => sum + p.netWorth, 0);
  const goldLead = radiantGold - direGold; // Positivo = Radiant na frente, Negativo = Dire na frente

  // ─── Rastreamento e Processamento da Batalha (Battle Summary) ───
  const isLiveGame = map.game_state === 'DOTA_GAMERULES_STATE_GAME_IN_PROGRESS';

  if (isLiveGame && players.length > 0) {
    const gameTime = map.game_time || 0;
    let newDeathDetected = false;
    const currentDeaths = [];

    players.forEach(p => {
      if (!p.heroName) return;
      const prevP = previousPlayers[p.heroName];
      if (prevP) {
        // Mudou de vivo para morto
        if (prevP.alive && !p.alive) {
          newDeathDetected = true;
          currentDeaths.push(p.heroName);
        }
      }
      previousPlayers[p.heroName] = {
        alive: p.alive,
        netWorth: p.netWorth,
        heroDamage: p.heroDamage,
        name: p.name,
        team: p.team
      };
    });

    if (newDeathDetected) {
      if (!activeBattle) {
        // Inicia nova batalha e captura baselines do tick anterior (ou atual se indisponível)
        activeBattle = {
          active: true,
          startTime: gameTime,
          lastDeathTime: gameTime,
          deaths: [...currentDeaths],
          baselines: {}
        };
        players.forEach(p => {
          if (!p.heroName) return;
          const prev = previousPlayers[p.heroName];
          activeBattle.baselines[p.heroName] = {
            netWorth: prev ? prev.netWorth : p.netWorth,
            heroDamage: prev ? prev.heroDamage : p.heroDamage
          };
        });
      } else {
        // Atualiza batalha existente
        activeBattle.lastDeathTime = gameTime;
        currentDeaths.forEach(d => {
          if (!activeBattle.deaths.includes(d)) {
            activeBattle.deaths.push(d);
          }
        });
      }
    }

    // Termina a batalha após 15 segundos sem mortes
    if (activeBattle && (gameTime - activeBattle.lastDeathTime > 15)) {
      activeBattle.active = false;
      activeBattle.endTime = gameTime;
      
      // Compila e congela o resumo final apenas se 3 ou mais heróis morreram
      if (activeBattle.deaths.length >= 3) {
        lastBattle = compileBattleSummary(activeBattle, players);
      } else {
        lastBattle = null; // Ignora a batalha (foi apenas um pick-off ou skirmish)
      }
      
      activeBattle = null;
    }
    // Momentum Recap (a cada 5 minutos de clock_time)
    const clockTime = map.clock_time || 0;
    if (clockTime >= 0) {
      const currentInterval = Math.floor(clockTime / 300);
      if (currentInterval > 0 && !momentumSnapshots[currentInterval]) {
        const radXP = players.filter(p => p.team === 'radiant').reduce((sum, p) => sum + (p.xpm * (clockTime / 60)), 0);
        const direXP = players.filter(p => p.team === 'dire').reduce((sum, p) => sum + (p.xpm * (clockTime / 60)), 0);
        
        momentumSnapshots[currentInterval] = {
          clockTime,
          radiantGold,
          direGold,
          goldLead,
          radXP,
          direXP
        };

        const prev = momentumSnapshots[currentInterval - 1];
        if (prev) {
          const radiantGoldDiff = radiantGold - prev.radiantGold;
          const direGoldDiff = direGold - prev.direGold;
          const radXPDiff = radXP - prev.radXP;
          const direXPDiff = direXP - prev.direXP;

          momentumRecap = {
            intervalMinute: currentInterval * 5, // Marca registrada de 5 em 5 minutos
            clearTime: clockTime + 10, // Duração de exatos 10 segundos na tela
            radiantGoldDiff,
            direGoldDiff,
            netWorthChange: radiantGoldDiff - direGoldDiff,
            radXPDiff,
            direXPDiff,
            xpChange: radXPDiff - direXPDiff
          };
          console.log(`[MOMENTUM] Triggered recap at clock: ${clockTime}. Interval: ${currentInterval}. Valid until: ${momentumRecap.clearTime}`);
        } else {
          console.log(`[MOMENTUM] Snapshotted interval ${currentInterval} at clock ${clockTime}. Waiting for interval ${currentInterval + 1} to calculate diff.`);
        }
      }

      if (momentumRecap && clockTime >= momentumRecap.clearTime) {
        momentumRecap = null;
      }
    }
  } else if (!isLiveGame) {
    activeBattle = null;
    lastBattle = null;
    previousPlayers = {};
    momentumSnapshots = {};
    momentumRecap = null;
  }

  let battleSummary = null;
  if (activeBattle) {
    battleSummary = compileBattleSummary(activeBattle, players);
  } else if (lastBattle) {
    // Retorna o resumo que foi congelado no encerramento da batalha
    battleSummary = lastBattle;
  }

  return {
    inGame,
    gameTime: map.clock_time || 0,
    matchGameTime: map.game_time || 0, // Necessário para calcular o buyback cooldown real que usa o game_time (inclui pauses)
    gameState: map.game_state || '',
    goldLead,
    radiantScore: map.radiant_score || 0,
    direScore: map.dire_score || 0,
    radiantName: map.radiant_name || 'Iluminados',
    direName: map.dire_name || 'Temidos',
    players,
    battleSummary,
    momentumRecap
  };
}

// Auxiliar para consolidar estatísticas de combate
function compileBattleSummary(battle, currentPlayers) {
  if (!battle) return null;

  const playerStats = [];
  let radiantNetWorthChange = 0;
  let direNetWorthChange = 0;

  currentPlayers.forEach(p => {
    if (!p.heroName) return;
    const baseline = battle.baselines[p.heroName];
    if (!baseline) return;

    const netWorthChange = p.netWorth - baseline.netWorth;
    const damageDealt = Math.max(0, p.heroDamage - baseline.heroDamage);

    if (p.team === 'radiant') {
      radiantNetWorthChange += netWorthChange;
    } else {
      direNetWorthChange += netWorthChange;
    }

    playerStats.push({
      name: p.name,
      heroName: p.heroName,
      team: p.team,
      netWorthChange,
      damageDealt
    });
  });

  // Top 3 heróis com mais ouro (Net Worth) ganho no combate
  const topGold = [...playerStats]
    .sort((a, b) => b.netWorthChange - a.netWorthChange)
    .slice(0, 3)
    .map(x => ({
      name: x.name,
      heroName: x.heroName,
      team: x.team,
      gained: x.netWorthChange
    }));

  // Top 3 heróis com mais dano causado no combate
  const topDamage = [...playerStats]
    .sort((a, b) => b.damageDealt - a.damageDealt)
    .slice(0, 3)
    .map(x => ({
      name: x.name,
      heroName: x.heroName,
      team: x.team,
      gained: x.damageDealt
    }));

  let netWorthWinner = 'draw';
  let netWorthDifference = 0;
  if (radiantNetWorthChange > direNetWorthChange) {
    netWorthWinner = 'radiant';
    netWorthDifference = radiantNetWorthChange - direNetWorthChange;
  } else if (direNetWorthChange > radiantNetWorthChange) {
    netWorthWinner = 'dire';
    netWorthDifference = direNetWorthChange - radiantNetWorthChange;
  }

  return {
    active: battle.active,
    startTime: battle.startTime,
    lastDeathTime: battle.lastDeathTime,
    endTime: battle.endTime || null,
    deaths: battle.deaths,
    radiantNetWorthChange,
    direNetWorthChange,
    netWorthWinner,
    netWorthDifference,
    topGold,
    topDamage
  };
}

// ─── Inicializa ───────────────────────────────────────────────────────────
httpServer.listen(GSI_PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('  🎮 DOTA 2 GSI SERVER ATIVO');
  console.log('═══════════════════════════════════════════════');
  console.log(`  📡 Recebendo dados do Dota 2 na porta: ${GSI_PORT}`);
  console.log(`  🔌 Widget WebSocket disponível em: ws://localhost:${WS_PORT}`);
  console.log(`  🌐 Polling disponível em: http://localhost:${GSI_PORT}/state`);
  console.log('═══════════════════════════════════════════════');
  console.log('  Aguardando conexão do Dota 2...');
  console.log('');
});
