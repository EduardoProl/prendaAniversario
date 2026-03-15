// ─── MUNDO / NÍVEIS ──────────────────────
const World = (() => {
  const TILE = 48;

  // Paletes de cores por nível — ambiente NOTURNO
  const palettes = [
    { sky: ['#0a1628','#0d2240'], ground: '#2a5c2a', dirt: '#3d2b1a', accent: '#FFD93D', stars: true,  name: 'Bosque Noturno' },
    { sky: ['#1a0a2e','#0d0a1e'], ground: '#1e3d1e', dirt: '#2a1a0d', accent: '#9B5DE5', stars: true,  name: 'Floresta Mágica' },
    { sky: ['#050c1a','#0a1428'], ground: '#1a3320', dirt: '#2d1f10', accent: '#4D96FF', stars: true,  name: 'Pântano' },
    { sky: ['#0a0520','#160830'], ground: '#2d2060', dirt: '#1a1035', accent: '#FF6B9D', stars: true,  name: 'Vale Encantado' },
    { sky: ['#020810','#050f1a'], ground: '#1a3d1a', dirt: '#0d2010', accent: '#6BCB77', stars: true,  name: 'Selva Noturna' },
    { sky: ['#1a0500','#2a0800'], ground: '#3d0000', dirt: '#220000', accent: '#FF4500', stars: false, name: 'Terra Vulcânica' },
    { sky: ['#050a14','#0a1020'], ground: '#d0d8e0', dirt: '#708090', accent: '#87CEEB', stars: true,  name: 'Montanha Nevada' },
  ];

  // Definições dos níveis da história (7 níveis = ~20min)
  const storyLevels = [
    { id: 0, palette: 0, name: 'O Bosque Perdido',        width: 80,  coins: 8,  enemies: 3, hasGoal: true },
    { id: 1, palette: 1, name: 'A Praia ao Pôr-do-Sol',   width: 90,  coins: 10, enemies: 5, hasGoal: true },
    { id: 2, palette: 2, name: 'A Floresta Mágica',       width: 100, coins: 12, enemies: 6, hasGoal: true },
    { id: 3, palette: 3, name: 'As Planícies Azuis',      width: 110, coins: 14, enemies: 8, hasGoal: true },
    { id: 4, palette: 4, name: 'A Selva Tropical',        width: 120, coins: 16, enemies: 9, hasGoal: true },
    { id: 5, palette: 5, name: 'A Terra Vulcânica',       width: 130, coins: 18, enemies:11, hasGoal: true },
    { id: 6, palette: 6, name: 'A Montanha Nevada',       width: 140, coins: 20, enemies:12, hasGoal: true, isFinal: true },
  ];

  let platforms = [];
  let coins     = [];
  let enemies   = [];
  let hazards   = [];
  let hearts    = [];
  let goal      = null;
  let currentPalette = palettes[0];
  let worldWidth = 0;
  let worldHeight = 0;
  let seed = 0;
  let infiniteChunks = [];
  let generatedX = 0;

  // ── GERADOR PSEUDO-ALEATÓRIO ──
  function rng() {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  }

  function rngRange(min, max) { return min + rng() * (max - min); }
  function rngInt(min, max)   { return Math.floor(rngRange(min, max + 1)); }

  // ── GERAÇÃO DE NÍVEL HISTÓRIA — estilo Mario ──
  // Lógica: o nível é uma sequência de "salas" lineares.
  // Cada sala tem um padrão (chão plano, salto de plataformas, buraco, escada de plataformas).
  // As plataformas são sempre alcançáveis com um salto normal ou duplo salto.
  function buildStoryLevel(canvas, levelDef) {
    seed = levelDef.id * 31337 + 42;
    platforms = [];
    coins     = [];
    enemies   = [];
    hazards   = [];
    hearts    = [];

    currentPalette = palettes[levelDef.palette];
    worldWidth  = levelDef.width * TILE;
    worldHeight = canvas.height;

    const H       = worldHeight;
    const groundY = H - TILE * 2;
    const JUMP_H  = TILE * 5;   // altura máx do salto simples
    const JUMP_W  = TILE * 7;   // largura máx do salto simples
    const DJ_W    = TILE * 11;  // largura máx do duplo salto

    // ── Zona de início segura ──
    platforms.push({ x: 0, y: groundY, w: TILE * 6, h: TILE * 2, isGround: true });

    let curX      = TILE * 6;  // posição X actual na geração
    let curY      = groundY;   // Y do chão actual (pode subir/descer com escadas)
    let roomCount = 0;
    const difficulty = levelDef.id / 6; // 0..1

    while (curX < worldWidth - TILE * 14) {
      roomCount++;
      // Escolher padrão com base na dificuldade
      const roll = rng();
      let pattern;
      if (difficulty < 0.2)       pattern = roll < 0.6 ? 'flat'    : roll < 0.85 ? 'platjump' : 'gap';
      else if (difficulty < 0.5)  pattern = roll < 0.3 ? 'flat'    : roll < 0.65 ? 'platjump' : roll < 0.85 ? 'gap' : 'staircase';
      else                        pattern = roll < 0.15 ? 'flat'   : roll < 0.45 ? 'platjump' : roll < 0.72 ? 'gap' : 'staircase';

      if (pattern === 'flat') {
        // ── Chão plano com possível inimigo ──
        const segW = rngInt(4, 8) * TILE;
        platforms.push({ x: curX, y: curY, w: segW, h: TILE * 2, isGround: true });
        // Moedas em linha
        const nc = rngInt(2, 5);
        for (let c = 0; c < nc; c++) {
          coins.push({ x: curX + (c+1) * (segW/(nc+1)) - 12, y: curY - TILE * 1.5, w: 24, h: 24, collected: false });
        }
        // Inimigo ocasional — só a partir de uma distância segura do início
        if (curX > TILE * 18 && rng() < 0.3 + difficulty * 0.3) {
          enemies.push(createEnemy(curX + segW * 0.4, curY - TILE, 'walker'));
        }
        curX += segW;

      } else if (pattern === 'gap') {
        // ── Buraco no chão ──
        const gapW = rngInt(2, Math.floor(2 + difficulty * 2)) * TILE;
        // Garantir que o buraco é saltável (máx duplo salto)
        const safeGap = Math.min(gapW, DJ_W - TILE);
        curX += safeGap;
        // Segmento depois do buraco
        const segW = rngInt(3, 6) * TILE;
        platforms.push({ x: curX, y: curY, w: segW, h: TILE * 2, isGround: true });
        coins.push({ x: curX + TILE * 0.5, y: curY - TILE * 1.5, w: 24, h: 24, collected: false });
        curX += segW;

      } else if (pattern === 'platjump') {
        // ── Série de plataformas para saltar — garantidamente alcançáveis ──
        const nPlats = rngInt(2, 4);
        let px = curX;
        let py = curY;
        // Buraco por baixo
        curX += rngInt(2, 3) * TILE; // começa com um pequeno gap
        px = curX;
        for (let p = 0; p < nPlats; p++) {
          const pw   = rngInt(2, 4) * TILE;
          // Altura: sobe ou mantém, nunca mais do que um salto simples
          const upDown = rng() < 0.5 ? -1 : (py < groundY - TILE * 3 ? 1 : -1);
          py = Math.max(groundY - JUMP_H, Math.min(groundY, py + upDown * rngInt(1, 3) * TILE));
          // Gap horizontal: sempre < JUMP_W
          const gap = rngInt(2, Math.floor(JUMP_W / TILE) - 1) * TILE;
          platforms.push({ x: px, y: py, w: pw, h: TILE * 0.6, isGround: false });
          // Moedas em cima
          const nc = rngInt(1, 3);
          for (let c = 0; c < nc; c++) {
            coins.push({ x: px + (c+0.5) * (pw/nc), y: py - TILE * 1.2, w: 24, h: 24, collected: false });
          }
          px += pw + gap;
        }
        // Plataforma de aterragem de volta ao chão
        const landW = rngInt(3, 5) * TILE;
        platforms.push({ x: px, y: curY, w: landW, h: TILE * 2, isGround: true });
        // Inimigo nesta plataforma — só a partir de uma distância segura
        if (curX > TILE * 18 && rng() < 0.4 + difficulty * 0.3) {
          enemies.push(createEnemy(px + landW * 0.5, curY - TILE, rng() > 0.6 ? 'jumper' : 'walker'));
        }
        curX = px + landW;

      } else if (pattern === 'staircase') {
        // ── Escadaria de plataformas (sobe depois desce) ──
        const steps = rngInt(2, 4);
        const stepH = rngInt(2, 3) * TILE;
        const stepW = rngInt(2, 3) * TILE;
        // Subida
        for (let s = 0; s < steps; s++) {
          const sy2 = curY - (s + 1) * stepH;
          if (sy2 < TILE * 2) break;
          platforms.push({ x: curX + s * (stepW + TILE), y: sy2, w: stepW, h: TILE * 0.6, isGround: false });
          coins.push({ x: curX + s*(stepW+TILE) + stepW*0.4, y: sy2 - TILE * 1.2, w: 24, h: 24, collected: false });
        }
        // Coração no topo da escadaria!
        const topY = curY - steps * stepH;
        if (topY > TILE * 2) {
          hearts.push({ x: curX + (steps - 1) * (stepW + TILE) + stepW * 0.3, y: topY - TILE * 2, w: 28, h: 28, collected: false });
        }
        // Plataforma de aterragem no mesmo nível
        const landX = curX + steps * (stepW + TILE) + TILE;
        platforms.push({ x: landX, y: curY, w: rngInt(3,5)*TILE, h: TILE * 2, isGround: true });
        curX = landX + rngInt(3,5)*TILE;
      }
    }

    // ── Zona final — sempre baseada em curX real, não em worldWidth ──
    const finalStart = curX;
    const finalW     = TILE * 14;
    platforms.push({ x: finalStart, y: groundY, w: finalW, h: TILE * 2, isGround: true });
    // Actualizar worldWidth para o fim real do nível
    worldWidth = finalStart + finalW + TILE * 2;

    // Objectivo no fim da zona final
    goal = {
      x: finalStart + finalW - TILE * 5,
      y: groundY - TILE * 3,
      w: TILE * 1.5,
      h: TILE * 3,
      isFinal: !!levelDef.isFinal
    };
  }

  // ── GERAÇÃO PROCEDURAL INFINITA ──
  function startInfiniteWorld(canvas, s) {
    seed = s || Date.now();
    platforms = [];
    coins     = [];
    enemies   = [];
    hazards   = [];
    hearts    = [];
    infiniteChunks = [];
    generatedX = 0;

    worldWidth  = Infinity;
    worldHeight = canvas.height;

    const pal = Math.floor(rng() * palettes.length);
    currentPalette = palettes[pal];

    // Gerar os primeiros chunks
    for (let i = 0; i < 5; i++) generateChunk(canvas);
  }

  function generateChunk(canvas) {
    const H = canvas.height;
    const groundY = H - TILE * 2;
    const chunkW = TILE * 20;
    const cx = generatedX;
    generatedX += chunkW;

    // Chão do chunk (com buracos possíveis)
    let x = cx;
    const end = cx + chunkW;
    while (x < end) {
      const gapChance = cx > TILE * 8 ? 0.18 : 0;
      if (rng() < gapChance) {
        x += rngInt(2, 5) * TILE;
      } else {
        const segLen = rngInt(3, 7) * TILE;
        platforms.push({ x, y: groundY, w: Math.min(segLen, end - x), h: TILE * 2, isGround: true, chunk: cx });
        x += segLen;
      }
    }

    // Plataformas flutuantes
    const n = rngInt(2, 5);
    for (let i = 0; i < n; i++) {
      const px = cx + rngRange(TILE, chunkW - TILE * 3);
      const py = rngRange(H * 0.25, groundY - TILE * 2);
      const pw = rngInt(2, 5) * TILE;
      platforms.push({ x: px, y: py, w: pw, h: TILE * 0.6, isGround: false, chunk: cx });
    }

    // Moedas
    const nc = rngInt(2, 5);
    for (let i = 0; i < nc; i++) {
      const coinX = cx + rngRange(TILE, chunkW - TILE);
      const coinY = rngRange(H * 0.25, groundY - TILE);
      coins.push({ x: coinX, y: coinY, w: 24, h: 24, collected: false, chunk: cx });
    }

    // Inimigos
    if (cx > TILE * 10) {
      const ne = rngInt(1, 3);
      for (let i = 0; i < ne; i++) {
        const ex = cx + rngRange(TILE * 2, chunkW - TILE * 2);
        enemies.push(createEnemy(ex, groundY - TILE, rng() > 0.7 ? 'jumper' : 'walker'));
      }
    }
  }

  function createEnemy(x, y, type) {
    return {
      x, y,
      w: 36, h: 36,
      vx: (rng() > 0.5 ? 1 : -1) * (type === 'jumper' ? 1.5 : 2),
      vy: 0,
      type,
      jumpTimer: type === 'jumper' ? rngInt(60, 120) : 0,
      alive: true,
      onGround: false
    };
  }

  function checkInfiniteExtension(canvas, playerX) {
    // Generate more chunks ahead
    if (generatedX - playerX < TILE * 60) {
      generateChunk(canvas);
    }
    // Cull old chunks
    const culled = platforms.filter(p => !p.chunk || p.chunk > playerX - TILE * 30);
    if (culled.length !== platforms.length) {
      platforms.length = 0;
      platforms.push(...culled);
    }
    const cullCoins = coins.filter(c => !c.chunk || c.chunk > playerX - TILE * 30);
    if (cullCoins.length !== coins.length) {
      coins.length = 0;
      coins.push(...cullCoins);
    }
    const cullEnemies = enemies.filter(e => !e.chunk || e.chunk > playerX - TILE * 30);
    if (cullEnemies.length !== enemies.length) {
      enemies.length = 0;
      enemies.push(...cullEnemies);
    }
  }

  // ── COLISÃO ──
  function rectOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function resolvePlayer(player) {
    let onGround = false;

    // Passo 1: resolver só eixo Y (evitar recuos horizontais falsos)
    for (const p of platforms) {
      if (!rectOverlap(player, p)) continue;

      const overlapTop    = player.y + player.h - p.y;
      const overlapBottom = p.y + p.h - player.y;
      const overlapLeft   = player.x + player.w - p.x;
      const overlapRight  = p.x + p.w - player.x;

      // Só resolver verticalmente se o overlap vertical for o menor
      const minV = Math.min(overlapTop, overlapBottom);
      const minH = Math.min(overlapLeft, overlapRight);

      if (minV <= minH) {
        // Colisão vertical
        if (overlapTop < overlapBottom && player.vy >= 0) {
          player.y = p.y - player.h;
          player.vy = 0;
          onGround = true;
        } else if (overlapBottom <= overlapTop && player.vy < 0) {
          player.y = p.y + p.h;
          player.vy = 0;
        }
      }
    }

    // Passo 2: resolver só eixo X (depois de Y estar resolvido)
    for (const p of platforms) {
      if (!rectOverlap(player, p)) continue;

      const overlapTop    = player.y + player.h - p.y;
      const overlapBottom = p.y + p.h - player.y;
      const overlapLeft   = player.x + player.w - p.x;
      const overlapRight  = p.x + p.w - player.x;

      const minV = Math.min(overlapTop, overlapBottom);
      const minH = Math.min(overlapLeft, overlapRight);

      // Só resolver horizontalmente se não foi já resolvido verticalmente
      if (minH < minV) {
        if (overlapLeft < overlapRight) {
          player.x = p.x - player.w;
        } else {
          player.x = p.x + p.w;
        }
        player.vx = 0;
      }
    }

    return onGround;
  }

  function getGoal()      { return goal; }
  function getPlatforms() { return platforms; }
  function getCoins()     { return coins; }
  function getEnemies()   { return enemies; }
  function getPalette()   { return currentPalette; }
  function getTile()      { return TILE; }
  function getStoryLevels() { return storyLevels; }

  return {
    buildStoryLevel, startInfiniteWorld, checkInfiniteExtension,
    resolvePlayer, rectOverlap,
    getGoal, getPlatforms, getCoins, getEnemies, getHearts: () => hearts,
    getPalette, getTile, getStoryLevels
  };
})();
