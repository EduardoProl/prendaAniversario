// ─── REDE (WebSocket) ────────────────────
const Network = (() => {
  let ws = null;
  let playerId = null;
  let connected = false;

  function connect() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const url   = `${proto}://${location.host}`;

    try {
      ws = new WebSocket(url);
    } catch(e) {
      setStatus(false, 'Sem servidor');
      return;
    }

    ws.onopen = () => {
      console.log('[WS] Ligado ao servidor');
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      handleMessage(msg);
    };

    ws.onerror = () => {
      setStatus(false, 'Sem servidor (modo local)');
    };

    ws.onclose = () => {
      connected = false;
      setStatus(false, 'Desligado');
      // Retry after 5s
      setTimeout(connect, 5000);
    };
  }

  function handleMessage(msg) {
    switch (msg.type) {
      case 'welcome':
        playerId = msg.playerId;
        connected = true;
        setStatus(true, `Ligado! ${msg.totalPlayers} jogador(es)`);
        break;

      case 'playerCount':
        const el = document.getElementById('playerCount');
        const badge = document.getElementById('playerCountBadge');
        if (el) el.textContent = msg.count;
        if (badge) badge.style.display = msg.count > 1 ? '' : 'none';
        if (connected) {
          const txt = document.getElementById('connText');
          if (txt) txt.textContent = `Ligado! ${msg.count} jogador(es)`;
        }
        break;

      case 'leaderboard':
        // Could display a leaderboard overlay — for now just log
        break;

      case 'playerFinished':
        if (msg.playerId !== playerId) {
          // Another player finished — could show notification
          console.log(`Outro jogador completou em ${msg.time}s!`);
        }
        break;
    }
  }

  function setStatus(ok, text) {
    const dot  = document.getElementById('connDot');
    const txt  = document.getElementById('connText');
    if (dot) dot.className = 'dot' + (ok ? ' connected' : '');
    if (txt) txt.textContent = text;
  }

  function send(msg) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  function sendScore(score) { send({ type: 'score', score }); }
  function sendFinish(time)  { send({ type: 'finish', time }); }

  return { connect, sendScore, sendFinish, isConnected: () => connected };
})();
