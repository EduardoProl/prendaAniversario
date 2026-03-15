const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const os = require('os');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, '../public');
const STANDALONE = path.join(__dirname, '../caminho-para-casa-standalone.html');

// Gerar ficheiro standalone ao arrancar (junta todo o CSS/JS num único HTML)
function buildStandalone() {
  try {
    const read  = p => fs.readFileSync(p, 'utf8');
    const read64 = p => fs.readFileSync(p).toString('base64');

    let html = read(path.join(PUBLIC, 'index.html'));
    const css = read(path.join(PUBLIC, 'css/style.css'));
    const icon64 = read64(path.join(PUBLIC, 'icon-192.png'));

    const jsFiles = ['input','tutorial','audio','network','cutscene','world','player','entities','game','ui'];
    const jsAll = jsFiles.map(f => `// ── ${f}.js ──\n${read(path.join(PUBLIC,'js',f+'.js'))}`).join('\n\n');

    const fontCss = `
@font-face { font-family:'Fredoka One'; src:local('Fredoka One'),local('Arial Rounded MT Bold'),local('Arial'); font-display:swap; }
@font-face { font-family:'Nunito'; src:local('Nunito'),local('Segoe UI'),local('Arial'); font-display:swap; }
`;
    const manifestBlob = `
<script>
(function(){
  const m={name:'O Caminho para Casa',short_name:'Caminho Casa',start_url:'.',display:'fullscreen',
    orientation:'landscape',background_color:'#0a1628',theme_color:'#0a1628',
    icons:[{src:'data:image/png;base64,${icon64}',sizes:'192x192',type:'image/png',purpose:'any maskable'}]};
  const b=new Blob([JSON.stringify(m)],{type:'application/manifest+json'});
  const l=document.createElement('link');l.rel='manifest';l.href=URL.createObjectURL(b);
  document.head.appendChild(l);
})();
</script>`;

    // Limpar links externos e scripts separados
    html = html
      .replace(/<link rel="manifest"[^>]*>/g, '')
      .replace(/<link rel="preconnect"[^>]*>/g, '')
      .replace(/<link href="https:\/\/fonts\.googleapis[^>]*>/g, '')
      .replace(/<style>[\s\S]*?<\/style>/g, '')
      .replace(/<link rel="stylesheet" href="css\/style\.css">/g, '')
      .replace(/<script src="js\/[^"]*"><\/script>\s*/g, '')
      .replace(/<script>\s*const PWA[\s\S]*?<\/script>/g, '')
      .replace(/<link rel="apple-touch-icon"[^>]*>/g, '');

    const headInject = `
  <link rel="apple-touch-icon" href="data:image/png;base64,${icon64}">
  <style>${fontCss}\n${css}</style>
  ${manifestBlob}`;

    const pwaScript = `
<script>
const PWA=(()=>{
  let dp=null;
  const iOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
  const sa=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();dp=e;});
  window.addEventListener('appinstalled',()=>{dp=null;const b=document.getElementById('btnInstall');if(b)b.style.display='none';});
  function install(){if(dp){dp.prompt();dp.userChoice.then(()=>{dp=null;});}else{document.getElementById('installModal').style.display='flex';}}
  function showIOSGuide(){document.getElementById('installModal').style.display='flex';}
  if(sa){window.addEventListener('load',()=>{const b=document.getElementById('btnInstall');if(b)b.style.display='none';});}
  return{install,showIOSGuide};
})();
</script>`;

    html = html
      .replace('</head>', headInject + '\n</head>')
      .replace('</body>', `<script>\n${jsAll}\n</script>\n${pwaScript}\n</body>`);

    fs.writeFileSync(STANDALONE, html, 'utf8');
    const kb = Math.round(fs.statSync(STANDALONE).size / 1024);
    console.log(`📦 Standalone gerado: ${kb} KB`);
  } catch(e) {
    console.error('⚠️  Erro ao gerar standalone:', e.message);
  }
}

buildStandalone();

// Rota de download do ficheiro standalone
app.get('/download', (req, res) => {
  if (!fs.existsSync(STANDALONE)) buildStandalone();
  res.download(STANDALONE, 'caminho-para-casa.html', err => {
    if (err) res.status(500).send('Erro ao gerar ficheiro');
  });
});

// Serve static files
app.use(express.static(PUBLIC));

// Get local IP addresses
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push({ name, address: iface.address });
      }
    }
  }
  return ips;
}

// Track connected players
const players = new Map();
let playerCount = 0;

wss.on('connection', (ws, req) => {
  playerCount++;
  const playerId = `player_${Date.now()}_${playerCount}`;
  const playerIp = req.socket.remoteAddress;

  players.set(ws, { id: playerId, ip: playerIp, score: 0 });
  console.log(`[+] Jogador conectado: ${playerId} (${playerIp}) — Total: ${players.size}`);

  // Send welcome + player id
  ws.send(JSON.stringify({
    type: 'welcome',
    playerId,
    totalPlayers: players.size
  }));

  // Broadcast player count to all
  broadcast({ type: 'playerCount', count: players.size });

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw);
      handleMessage(ws, msg);
    } catch (e) {
      console.error('Mensagem inválida:', e.message);
    }
  });

  ws.on('close', () => {
    const p = players.get(ws);
    if (p) {
      console.log(`[-] Jogador desconectado: ${p.id} — Total: ${players.size - 1}`);
    }
    players.delete(ws);
    broadcast({ type: 'playerCount', count: players.size });
  });
});

function handleMessage(ws, msg) {
  const player = players.get(ws);
  if (!player) return;

  switch (msg.type) {
    case 'score':
      player.score = msg.score;
      // Broadcast leaderboard update
      const leaderboard = [...players.values()]
        .map(p => ({ id: p.id, score: p.score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      broadcast({ type: 'leaderboard', leaderboard });
      break;

    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', time: Date.now() }));
      break;

    case 'finish':
      console.log(`🏆 ${player.id} completou o modo história! Tempo: ${msg.time}s`);
      broadcast({ type: 'playerFinished', playerId: player.id, time: msg.time });
      break;
  }
}

function broadcast(msg) {
  const data = JSON.stringify(msg);
  for (const [client] of players) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

server.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIPs();
  console.log('\n🏠 ═══════════════════════════════════════');
  console.log('   O CAMINHO PARA CASA — Servidor iniciado!');
  console.log('═══════════════════════════════════════════');
  console.log(`\n📡 Acesso local:    http://localhost:${PORT}`);
  if (ips.length > 0) {
    console.log('\n🌐 Acesso na rede:');
    ips.forEach(ip => {
      console.log(`   ${ip.name.padEnd(15)} http://${ip.address}:${PORT}`);
    });
  }
  console.log('\n💡 Partilha o IP da rede com outros jogadores!');
  console.log('═══════════════════════════════════════════\n');
});
