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

        // Extrai só o que importa para a HUD
        const hudData = extractHudData(state);

        // Envia para todos os widgets conectados via WebSocket
        wss.clients.forEach(client => {
          if (client.readyState === 1) {
            client.send(JSON.stringify(hudData));
          }
        });

        console.log(`[GSI] Dados recebidos - Hero: ${hudData.heroName} | KDA: ${hudData.kills}/${hudData.deaths}/${hudData.assists} | Net Worth: ${hudData.netWorth}`);
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
          gold: p.gold || 0,
          gpm: p.gpm || 0,
          xpm: p.xpm || 0,
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

  return {
    inGame,
    gameTime: map.clock_time || 0,
    gameState: map.game_state || '',
    goldLead,
    radiantScore: map.radiant_score || 0,
    direScore: map.dire_score || 0,
    players
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
