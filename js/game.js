// ─── JOGO PRINCIPAL ──────────────────────
const Game = (() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx    = canvas.getContext('2d');

  let mode        = 'story';   // 'story' | 'infinite'
  let paused      = false;
  let raf         = null;
  let tick        = 0;

  // Estado do jogo
  let lives        = 3;
  let score        = 0;
  let storyLevel   = 0;
  let storyTimer   = 0; // segundos
  let timerTick    = 0;
  let infiniteDist = 0;
  let goalReached  = false; // guarda contra chamadas repetidas
  let deathTimeout = null;  // timeout pendente de morte
  let gameEnded    = false; // jogo terminou (cutscene final a correr)
  let deathHandled = false; // guarda para handleDeath não repetir

  // Câmara
  let camX = 0, camY = 0;

  function resize() {
    canvas.width  = canvas.offsetWidth  || window.innerWidth;
    canvas.height = canvas.offsetHeight || (window.innerHeight - 60);
  }

  function startStory() {
    Audio.init();
    mode       = 'story';
    lives      = 3;
    score      = 0;
    storyLevel = 0;
    storyTimer = 0;
    timerTick  = 0;

    // Mostrar cutscene primeiro
    UI.showScreen('cutscene');
    Cutscene.play(() => {
      loadStoryLevel(0);
    });
  }

  function skipCutscene() {
    Cutscene.stop();
    loadStoryLevel(storyLevel);
  }

  function loadStoryLevel(levelIdx) {
    resize();
    const levels = World.getStoryLevels();
    if (levelIdx >= levels.length) {
      // VITÓRIA!
      stop();
      UI.showEnd(score, Math.round(storyTimer));
      Network.sendFinish(Math.round(storyTimer));
      Audio.win();
      return;
    }

    storyLevel = levelIdx;
    const lvl = levels[levelIdx];

    World.buildStoryLevel(canvas, lvl);
    Player.reset(World.getTile() * 2, canvas.height - World.getTile() * 4);

    camX = 0; camY = 0;
    paused = false;
    goalReached  = false;
    gameEnded    = false;
    deathHandled = false;
    if (deathTimeout) { clearTimeout(deathTimeout); deathTimeout = null; }

    document.getElementById('levelDisplay').textContent = `Nível ${levelIdx + 1} — ${lvl.name}`;
    updateHUD();

    Audio.startMusic('story');
    UI.showScreen('game');
    startLoop();
    Audio.levelUp();
    if (storyLevel === 0) Tutorial.start(World.getTile() * 2);
    else Tutorial.keepFollowing();
  }

  function startInfinite() {
    Audio.init();
    mode       = 'infinite';
    lives      = 3;
    score      = 0;
    infiniteDist = 0;
    storyTimer = 0;
    timerTick  = 0;

    resize();
    World.startInfiniteWorld(canvas, Date.now());
    Player.reset(World.getTile() * 2, canvas.height - World.getTile() * 4);

    camX = 0; camY = 0;
    paused = false;
    goalReached  = false;
    gameEnded    = false;
    deathHandled = false;
    if (deathTimeout) { clearTimeout(deathTimeout); deathTimeout = null; }

    document.getElementById('levelDisplay').textContent = '♾️ Modo Infinito';
    updateHUD();

    Audio.startMusic('infinite');
    UI.showScreen('game');
    startLoop();
  }

  function retry() {
    if (mode === 'story') {
      loadStoryLevel(storyLevel);
    } else {
      startInfinite();
    }
  }

  function startLoop() {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    Audio.stopMusic();
  }

  function togglePause() {
    paused = !paused;
    const overlay = document.getElementById('pauseOverlay');
    overlay.style.display = paused ? 'flex' : 'none';
    if (!paused) startLoop();
    else if (raf) { cancelAnimationFrame(raf); raf = null; }
  }

  // ── LOOP PRINCIPAL ──
  function loop() {
    resize();
    tick++;

    // Timer
    timerTick++;
    if (timerTick >= 60) {
      timerTick = 0;
      storyTimer++;
      updateTimer();
    }

    // Infinite: score by distance
    if (mode === 'infinite') {
      const p = Player.get();
      infiniteDist = Math.max(infiniteDist, Math.floor(p.x / World.getTile()));
      score = infiniteDist * 10 + Math.floor(storyTimer);
    }

    updateCamera();
    Player.update(canvas);
    Tutorial.update(Player.get());

    // Extend infinite world
    if (mode === 'infinite') {
      World.checkInfiniteExtension(canvas, Player.get().x);
    }

    Entities.updateEnemies(canvas);
    checkCollisions();
    draw();
    updateHUD();
    Network.sendScore(score);

    // Input pause
    if (Input.justPressed('pause')) togglePause();

    raf = requestAnimationFrame(loop);
  }

  function updateCamera() {
    const p = Player.get();
    const targetX = p.x + p.w/2 - canvas.width  * 0.35;
    const targetY = p.y + p.h/2 - canvas.height * 0.5;

    camX += (targetX - camX) * 0.12;
    camY += (targetY - camY) * 0.1;

    camX = Math.max(0, camX);
    camY = Math.max(0, camY);
  }

  function checkCollisions() {
    const p = Player.get();
    if (!p.alive) {
      handleDeath();
      return;
    }

    // Coins
    for (const coin of World.getCoins()) {
      if (!coin.collected && World.rectOverlap(p, coin)) {
        Entities.collectCoin(coin);
        score += 100;
      }
    }

    // Corações — recuperar vida
    for (const h of World.getHearts()) {
      if (!h.collected && World.rectOverlap(p, h)) {
        h.collected = true;
        if (lives < 5) {
          lives++;
          Audio.coin();
        }
      }
    }

    // Enemies
    for (const e of World.getEnemies()) {
      if (!e.alive) continue;
      if (!World.rectOverlap(p, e)) continue;

      // Saltar em cima → matar inimigo
      const fromAbove = p.vy > 0 && (p.y + p.h - p.vy) < (e.y + e.h * 0.4);
      if (fromAbove) {
        Entities.killEnemy(e);
        score += 200;
        Player.get().vy = -9; // pequeno bounce
      } else {
        // Dano no jogador
        if (Player.hurt()) {
          lives--;
          if (lives <= 0) handleDeath();
        }
      }
    }

    // Goal
    const goal = World.getGoal();
    if (goal && World.rectOverlap(p, goal)) {
      reachGoal(goal);
    }
  }

  function reachGoal(goal) {
    if (goalReached) return; // evitar chamadas repetidas
    goalReached = true;
    gameEnded   = true;
    if (deathTimeout) { clearTimeout(deathTimeout); deathTimeout = null; }
    Audio.levelUp();
    stop();

    if (mode === 'story') {
      if (goal.isFinal) {
        // Cutscene final antes do ecrã de vitória
        const finalScore = score;
        const finalTime  = Math.round(storyTimer);
        Audio.win();
        Network.sendFinish(finalTime);
        UI.showScreen('cutscene');
        Cutscene.playEnd(() => {
          UI.showEnd(finalScore, finalTime);
        });
      } else {
        score += 500 + Math.max(0, 1200 - storyTimer) * 2;
        setTimeout(() => loadStoryLevel(storyLevel + 1), 1200);
      }
    }
  }

  function handleDeath() {
    if (gameEnded || deathHandled) return; // já a tratar da morte
    deathHandled = true;
    stop();
    if (lives <= 0 || mode === 'infinite') {
      deathTimeout = setTimeout(() => {
        if (gameEnded) return;
        document.getElementById('goScore').textContent = score;
        UI.showScreen('gameover');
      }, 800);
    } else {
      deathTimeout = setTimeout(() => {
        if (gameEnded) return;
        Audio.levelUp();
        if (mode === 'story') loadStoryLevel(storyLevel);
      }, 1000);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    Entities.drawWorld(ctx, camX, camY, canvas.width, canvas.height, tick);
    Player.draw(ctx, camX, camY);
    Tutorial.draw(ctx, canvas.width, canvas.height, Player.get(), camX, camY);

    // HUD de distância (infinito)
    if (mode === 'infinite') {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, 0, canvas.width, 0); // already in HTML HUD
      ctx.restore();
    }
  }

  const MAX_LIVES = 5;
  const HEART_SVG_FULL  = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 21C12 21 3 14 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14 14 21 12 21Z" fill="#ff4477" stroke="#ff88aa" stroke-width="1"/></svg>`;
  const HEART_SVG_EMPTY = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 21C12 21 3 14 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14 14 21 12 21Z" fill="none" stroke="#888" stroke-width="1.5"/></svg>`;

  let lastLivesRendered = -1;

  function updateHUD() {
    document.getElementById('scoreDisplay').textContent = score;

    // Só redesenhar corações se o número mudou
    if (lives !== lastLivesRendered) {
      lastLivesRendered = lives;
      const container = document.getElementById('heartsDisplay');
      if (container) {
        container.innerHTML = '';
        for (let i = 0; i < MAX_LIVES; i++) {
          const span = document.createElement('span');
          span.className = 'hud-heart' + (i < lives ? '' : ' empty');
          span.innerHTML = i < lives ? HEART_SVG_FULL : HEART_SVG_EMPTY;
          container.appendChild(span);
        }
      }
    }
  }

  function updateTimer() {
    if (mode === 'story') {
      const remaining = Math.max(0, 1200 - storyTimer);
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      document.getElementById('timerDisplay').textContent =
        `${m}:${s.toString().padStart(2,'0')}`;
    } else {
      const m = Math.floor(storyTimer / 60);
      const s = storyTimer % 60;
      document.getElementById('timerDisplay').textContent =
        `${m}:${s.toString().padStart(2,'0')}`;
    }
  }

  return { startStory, startInfinite, skipCutscene, togglePause, retry };
})();
