// ─── ENTIDADES & RENDERIZAÇÃO ────────────
const Entities = (() => {
  const GRAVITY = 0.5;
  const TILE    = 48;

  // Partículas de efeitos
  let particles = [];

  function spawnParticles(x, y, color, n = 6) {
    for (let i = 0; i < n; i++) {
      const angle  = (Math.PI * 2 / n) * i + Math.random() * 0.5;
      const speed  = 2 + Math.random() * 4;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 40 + Math.random() * 20,
        maxLife: 60,
        color,
        size: 4 + Math.random() * 6,
      });
    }
  }

  function updateParticles() {
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.life--;
    }
    particles = particles.filter(p => p.life > 0);
  }

  function drawParticles(ctx, camX, camY) {
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x - camX, p.y - camY, p.size * (p.life / p.maxLife), 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ── DESENHAR MUNDO ──
  function drawWorld(ctx, camX, camY, canvasW, canvasH, tick) {
    const pal = World.getPalette();

    // Fundo (gradiente de céu)
    const sky = ctx.createLinearGradient(0, 0, 0, canvasH);
    sky.addColorStop(0, pal.sky[0]);
    sky.addColorStop(1, pal.sky[1]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Nuvens parallax
    drawClouds(ctx, camX, canvasW, canvasH, tick);

    // Árvores de fundo (parallax lento)
    drawBackgroundTrees(ctx, camX, camY, canvasW, canvasH, pal);

    // Chão de fundo muito escuro — só para as árvores terem base
    // NÃO preenche gaps (buracos são escuros = perigo visível)
    const bgGroundScreenY = (canvasH - TILE * 2) - camY;
    if (bgGroundScreenY < canvasH && bgGroundScreenY > 0) {
      // Fundo muito escuro nos buracos — aviso visual claro
      ctx.fillStyle = '#060608';
      ctx.fillRect(0, bgGroundScreenY, canvasW, canvasH - bgGroundScreenY);
    }

    // Plataformas
    for (const plat of World.getPlatforms()) {
      const sx = plat.x - camX;
      const sy = plat.y - camY;
      if (sx > canvasW + TILE || sx + plat.w < -TILE) continue;

      if (plat.isGround) {
        // Terra sólida até ao fundo — cor escura para contrastar com os buracos
        const darkDirt = adjustBrightness(pal.dirt, -25);
        ctx.fillStyle = darkDirt;
        ctx.fillRect(sx, sy + TILE * 0.4, plat.w, canvasH - (sy + TILE * 0.4));

        // Camada de erva no topo — mais escura que de dia
        const darkGround = adjustBrightness(pal.ground, -30);
        ctx.fillStyle = darkGround;
        ctx.fillRect(sx, sy, plat.w, TILE * 0.4);

        // Borda de topo brilhante — para se ver o limite do chão claramente
        ctx.fillStyle = adjustBrightness(pal.ground, 15);
        ctx.fillRect(sx, sy, plat.w, 3);

        // Detalhes de erva
        ctx.fillStyle = adjustBrightness(pal.ground, -10);
        for (let gx = 4; gx < plat.w - 4; gx += 14) {
          const gh = 5 + Math.sin(gx * 0.5) * 3;
          ctx.fillRect(sx + gx, sy - gh, 3, gh);
        }

        // Pedras decorativas na terra
        ctx.fillStyle = adjustBrightness(pal.dirt, -35);
        for (let rx = 18; rx < plat.w - 10; rx += 45 + ((rx * 7) % 25)) {
          ctx.beginPath();
          ctx.ellipse(sx + rx, sy + TILE * 0.9, 6, 4, 0, 0, Math.PI*2);
          ctx.fill();
        }
      } else {
        // Plataforma flutuante
        ctx.fillStyle = pal.ground;
        ctx.beginPath();
        ctx.roundRect(sx, sy, plat.w, plat.h, 6);
        ctx.fill();
        // Sombra suave
        ctx.fillStyle = adjustBrightness(pal.ground, -20);
        ctx.fillRect(sx + 4, sy + plat.h - 4, plat.w - 8, 4);
        // Decoração de topo
        ctx.fillStyle = adjustBrightness(pal.ground, 30);
        ctx.fillRect(sx + 2, sy, plat.w - 4, 4);
      }
    }

    // Moedas
    for (const coin of World.getCoins()) {
      if (coin.collected) continue;
      const sx = coin.x - camX;
      const sy = coin.y - camY + Math.sin(tick * 0.05 + coin.x * 0.01) * 4;
      if (sx < -40 || sx > canvasW + 40) continue;
      if (sy < -40 || sy > canvasH + 40) continue; // culling vertical

      // Moeda estrela
      drawStar(ctx, sx + 12, sy + 12, 12, '#FFD93D', '#FFA500', tick);
    }

    // Corações (recuperar vida)
    for (const h of World.getHearts()) {
      if (h.collected) continue;
      const hsx = h.x - camX;
      const hsy = h.y - camY + Math.sin(tick * 0.07 + h.x * 0.01) * 5;
      if (hsx < -40 || hsx > canvasW + 40) continue;
      drawHeart(ctx, hsx + h.w/2, hsy + h.h/2, 14, tick);
    }

    // Inimigos
    for (const e of World.getEnemies()) {
      if (!e.alive) continue;
      const sx = e.x - camX;
      const sy = e.y - camY;
      if (sx < -60 || sx > canvasW + 60) continue;
      drawEnemy(ctx, e, sx, sy, tick);
    }

    // Goal
    const goal = World.getGoal();
    if (goal) {
      const sx = goal.x - camX;
      const sy = goal.y - camY;
      drawGoal(ctx, goal, sx, sy, tick, pal);
    }

    // Partículas
    drawParticles(ctx, camX, camY);
  }

  function drawBackgroundTrees(ctx, camX, camY, canvasW, canvasH, pal) {
    // groundY em coordenadas de ecrã: posição real do chão menos câmara
    // O chão do mundo fica a canvasH - TILE*2 em coordenadas de mundo
    const worldGroundY = canvasH - TILE * 2; // posição Y do chão no mundo
    const groundY = worldGroundY - camY;      // em coordenadas de ecrã

    // ── ESTRELAS (só em paletas noturnas) ──
    if (pal.stars !== false) {
      ctx.save();
      // Usar sequência de Halton para distribuição 2D uniforme sem linhas
      // Base 2 para X, base 3 para Y — garantidamente sem padrões
      function halton(i, base) {
        let f = 1, r = 0;
        while (i > 0) { f /= base; r += f * (i % base); i = Math.floor(i / base); }
        return r;
      }
      for (let i = 1; i <= 100; i++) {
        // Posição base normalizada [0,1] — distribuição uniforme
        const nx = halton(i, 2);
        const ny = halton(i, 3);
        // Aplicar parallax mínimo (estrelas quase fixas)
        const starX = ((nx * canvasW - camX * 0.015) % canvasW + canvasW) % canvasW;
        const starY = ny * canvasH * 0.68; // só no céu, não no chão
        const twinkle = Math.sin(Date.now() * 0.001 * (0.4 + (i % 7) * 0.15) + i * 2.3) * 0.5 + 0.5;
        const size = 0.7 + (i % 4) * 0.45;
        ctx.globalAlpha = 0.25 + twinkle * 0.75;
        ctx.fillStyle = i % 11 === 0 ? '#ffe8a0' : i % 7 === 0 ? '#a0c8ff' : 'white';
        ctx.beginPath();
        ctx.arc(starX, starY, size, 0, Math.PI * 2);
        ctx.fill();
      }
      // Lua — parallax muito lento, sempre visível
      const moonX = ((canvasW * 0.78 - camX * 0.015) % canvasW + canvasW) % canvasW;
      const moonY = canvasH * 0.13;
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = '#fff8d0';
      ctx.shadowColor = '#ffe870';
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = adjustBrightness(pal.sky[0], -3);
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(moonX + 11, moonY, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // ── CAMADA 1: Árvores muito ao fundo (parallax 15%) ──
    drawTreeLayer(ctx, camX, canvasW, groundY, pal, {
      parallax: 0.15, spacing: 65, heightBase: 140, heightVar: 80,
      alpha: 0.22, darkOffset: -55, trunkRatio: 0.28, spreadRatio: 0.44, layers: 2,
    });

    // ── CAMADA 2: Árvores médias (parallax 28%) ──
    drawTreeLayer(ctx, camX, canvasW, groundY, pal, {
      parallax: 0.28, spacing: 80, heightBase: 110, heightVar: 60,
      alpha: 0.35, darkOffset: -35, trunkRatio: 0.30, spreadRatio: 0.42, layers: 2,
      seedOffset: 1000,
    });

    // ── CAMADA 3: Árvores próximas (parallax 45%) ──
    drawTreeLayer(ctx, camX, canvasW, groundY, pal, {
      parallax: 0.45, spacing: 90, heightBase: 90, heightVar: 55,
      alpha: 0.52, darkOffset: -18, trunkRatio: 0.32, spreadRatio: 0.40, layers: 3,
      seedOffset: 2000,
    });
  }

  function drawTreeLayer(ctx, camX, canvasW, groundY, pal, opts) {
    const offsetX = camX * opts.parallax;
    const spacing = opts.spacing;
    const start = Math.floor((offsetX - canvasW * 0.2) / spacing) - 2;
    const end   = Math.ceil((offsetX + canvasW * 1.2) / spacing) + 2;

    ctx.save();
    for (let i = start; i < end; i++) {
      const seed = Math.abs(i + (opts.seedOffset || 0));
      const tx = i * spacing + ((seed * 47) % (spacing * 0.6)) - offsetX;
      if (tx < -160 || tx > canvasW + 160) continue;

      const h = opts.heightBase + (seed * 31) % opts.heightVar;
      const treeColor = adjustBrightness(pal.ground, opts.darkOffset - (seed * 7) % 20);
      const trunkColor = adjustBrightness(pal.dirt, -30);
      const trunkW = 7 + (seed * 3) % 6;
      const baseY = groundY;

      ctx.globalAlpha = opts.alpha;

      // Tronco
      ctx.fillStyle = trunkColor;
      ctx.fillRect(tx - trunkW/2, baseY - h * opts.trunkRatio, trunkW, h * opts.trunkRatio + 2);

      // Copas (várias camadas para dar volume)
      for (let layer = 0; layer < opts.layers; layer++) {
        const frac = 1 - layer * 0.28;
        const layerH = h * frac;
        const spread = layerH * opts.spreadRatio * (1 - layer * 0.15);
        const baseLayerY = baseY - h * opts.trunkRatio * 0.8 - layer * h * 0.22;

        ctx.fillStyle = layer === 0
          ? treeColor
          : adjustBrightness(treeColor, -10 - layer * 8);

        ctx.beginPath();
        ctx.moveTo(tx, baseLayerY - layerH * 0.75);
        ctx.lineTo(tx - spread, baseLayerY);
        ctx.lineTo(tx + spread, baseLayerY);
        ctx.closePath();
        ctx.fill();
      }

      // Pontinhos de brilho (vaga-lumes / folhas iluminadas pela lua)
      if (pal.stars !== false && (seed % 4 === 0)) {
        ctx.globalAlpha = opts.alpha * 0.6;
        ctx.fillStyle = '#aaff88';
        const glowX = tx + ((seed * 13) % 30) - 15;
        const glowY = baseY - h * 0.5 - ((seed * 17) % 30);
        ctx.beginPath();
        ctx.arc(glowX, glowY, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawClouds(ctx, camX, canvasW, canvasH, tick) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    const clouds = [
      { bx: 200, y: canvasH * 0.08, w: 120, h: 40 },
      { bx: 600, y: canvasH * 0.12, w: 90,  h: 32 },
      { bx: 1100, y: canvasH * 0.06, w: 150, h: 45 },
      { bx: 1600, y: canvasH * 0.14, w: 100, h: 35 },
      { bx: 2200, y: canvasH * 0.09, w: 130, h: 42 },
    ];
    for (const c of clouds) {
      // Parallax: 20% speed
      const cx = ((c.bx - camX * 0.2) % (canvasW + 200)) - 100;
      ctx.beginPath();
      ctx.ellipse(cx + c.w/2, c.y, c.w/2, c.h/2, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + c.w*0.3, c.y + 8, c.w*0.32, c.h*0.55, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + c.w*0.7, c.y + 5, c.w*0.28, c.h*0.5, 0, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawEnemy(ctx, e, sx, sy, tick) {
    ctx.save();
    ctx.translate(sx + e.w/2, sy + e.h/2);
    if (e.vx < 0) ctx.scale(-1, 1);

    const bob = Math.sin(tick * 0.08) * 3;

    if (e.type === 'jumper') {
      // Cogumelo saltador - rosa/magenta
      ctx.fillStyle = '#FF6B9D';
      // Corpo
      ctx.beginPath();
      ctx.ellipse(0, 4 + bob, 14, 12, 0, 0, Math.PI*2);
      ctx.fill();
      // Chapéu de cogumelo
      ctx.fillStyle = '#FF1493';
      ctx.beginPath();
      ctx.ellipse(0, -6 + bob, 18, 12, 0, Math.PI, 0);
      ctx.fill();
      // Pintas brancas
      ctx.fillStyle = 'white';
      ctx.beginPath(); ctx.arc(-7, -8 + bob, 4, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(5, -6 + bob, 3, 0, Math.PI*2); ctx.fill();
      // Olhos
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.arc(-5, 3+bob, 4, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(5, 3+bob, 4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'white';
      ctx.beginPath(); ctx.arc(-4, 2+bob, 1.5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(6, 2+bob, 1.5, 0, Math.PI*2); ctx.fill();
    } else {
      // Inimigo simples - bicho laranja
      ctx.fillStyle = '#FF6B35';
      ctx.beginPath();
      ctx.ellipse(0, bob, 15, 14, 0, 0, Math.PI*2);
      ctx.fill();
      // Antenas
      ctx.strokeStyle = '#cc4400';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-5, -10+bob); ctx.lineTo(-10, -22+bob); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(5, -10+bob); ctx.lineTo(10, -22+bob); ctx.stroke();
      // Bola no fim
      ctx.fillStyle = '#FFD93D';
      ctx.beginPath(); ctx.arc(-10, -22+bob, 3.5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(10, -22+bob, 3.5, 0, Math.PI*2); ctx.fill();
      // Olhos zanagados
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.arc(-5, -2+bob, 4, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(5, -2+bob, 4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ff0000';
      ctx.beginPath(); ctx.arc(-5, -2+bob, 2, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(5, -2+bob, 2, 0, Math.PI*2); ctx.fill();
      // Sobrancelhas zangadas
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-9, -6+bob); ctx.lineTo(-2, -8+bob); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(9, -6+bob); ctx.lineTo(2, -8+bob); ctx.stroke();
    }

    ctx.restore();
  }

  function drawGoal(ctx, goal, sx, sy, tick, pal) {
    ctx.save();
    ctx.translate(sx, sy);

    if (goal.isFinal) {
      // CASA! (objetivo final)
      // Luz pulsante
      const pulse = Math.sin(tick * 0.06) * 0.3 + 0.7;
      const grd = ctx.createRadialGradient(goal.w/2, goal.h/2, 0, goal.w/2, goal.h/2, 80);
      grd.addColorStop(0, `rgba(255,217,61,${pulse * 0.6})`);
      grd.addColorStop(1, 'rgba(255,217,61,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(-40, -40, goal.w + 80, goal.h + 80);

      // Casa
      const hw = goal.w;
      const hh = goal.h;
      // Paredes
      ctx.fillStyle = '#e8c080';
      ctx.fillRect(0, hh * 0.4, hw, hh * 0.6);
      // Telhado
      ctx.fillStyle = '#c0392b';
      ctx.beginPath();
      ctx.moveTo(-8, hh * 0.4);
      ctx.lineTo(hw/2, -10);
      ctx.lineTo(hw + 8, hh * 0.4);
      ctx.closePath();
      ctx.fill();
      // Porta
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.roundRect(hw*0.3, hh * 0.65, hw*0.38, hh*0.35, [6,6,0,0]);
      ctx.fill();
      // Janela iluminada
      ctx.fillStyle = '#FFD93D';
      ctx.fillRect(hw*0.1, hh*0.5, hw*0.22, hw*0.22);
      // Fumo da chaminé
      for (let s = 0; s < 3; s++) {
        const sfrac = ((tick * 0.015 + s * 0.33) % 1);
        ctx.save();
        ctx.globalAlpha = (1 - sfrac) * 0.5;
        ctx.fillStyle = '#aaa';
        ctx.beginPath();
        ctx.arc(hw * 0.78, hh * 0.35 - sfrac * 40 + Math.sin(tick*0.1+s)*8,
                4 + sfrac * 8, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
      }
      // Pais visíveis pela janela
      drawDadInWindow(ctx, hw * 0.1 + 5, hh * 0.5 + 5, hw * 0.22 - 10, tick);

    } else {
      // BANDEIRA (checkpoints/objetivos intermédios)
      // Pau
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 5;
      ctx.lineCap = 'butt';
      ctx.beginPath();
      ctx.moveTo(goal.w/2, goal.h);
      ctx.lineTo(goal.w/2, 0);
      ctx.stroke();
      // Bandeira animada
      const wave = Math.sin(tick * 0.08) * 5;
      ctx.fillStyle = pal.accent;
      ctx.beginPath();
      ctx.moveTo(goal.w/2, 4);
      ctx.lineTo(goal.w/2 + 36, 12 + wave);
      ctx.lineTo(goal.w/2, 28);
      ctx.closePath();
      ctx.fill();
      // Estrela na bandeira
      ctx.fillStyle = 'white';
      drawSmallStar(ctx, goal.w/2 + 18, 16 + wave * 0.5, 7);
    }

    ctx.restore();
  }

  function drawDadInWindow(ctx, wx, wy, ww, tick) {
    // Pequeno pai na janela a acenar
    ctx.save();
    ctx.beginPath();
    ctx.rect(wx, wy, ww, ww);
    ctx.clip();

    const wave = Math.sin(tick * 0.08) * 5;
    const cx = wx + ww/2, cy = wy + ww * 0.7;

    // Corpo
    ctx.fillStyle = '#4a8a4a';
    ctx.fillRect(cx - 5, cy - 8, 10, 12);
    // Cabeça (careca)
    ctx.fillStyle = '#FFD6A5';
    ctx.beginPath(); ctx.arc(cx, cy - 13, 7, 0, Math.PI*2); ctx.fill();
    // Brilho careca
    ctx.fillStyle = 'rgba(255,255,200,0.6)';
    ctx.beginPath(); ctx.ellipse(cx-2, cy-16, 3, 2, -0.4, 0, Math.PI*2); ctx.fill();
    // Braço a acenar
    ctx.strokeStyle = '#4a8a4a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx + 5, cy - 5);
    ctx.lineTo(cx + 12, cy - 12 + wave);
    ctx.stroke();

    ctx.restore();
  }

  function drawHeart(ctx, cx, cy, r, tick) {
    ctx.save();
    const pulse = 1 + Math.sin(tick * 0.08) * 0.08;
    ctx.scale(pulse, pulse);
    // Glow
    const grd = ctx.createRadialGradient(cx/pulse, cy/pulse, 0, cx/pulse, cy/pulse, r * 2);
    grd.addColorStop(0, 'rgba(255,80,120,0.5)');
    grd.addColorStop(1, 'rgba(255,80,120,0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(cx/pulse, cy/pulse, r * 2, 0, Math.PI * 2);
    ctx.fill();
    // Coração
    const x = cx/pulse, y = cy/pulse;
    ctx.fillStyle = '#ff4477';
    ctx.strokeStyle = '#ff88aa';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y + r * 0.3);
    ctx.bezierCurveTo(x, y - r * 0.3, x - r, y - r * 0.3, x - r, y);
    ctx.bezierCurveTo(x - r, y + r * 0.5, x, y + r, x, y + r);
    ctx.bezierCurveTo(x, y + r, x + r, y + r * 0.5, x + r, y);
    ctx.bezierCurveTo(x + r, y - r * 0.3, x, y - r * 0.3, x, y + r * 0.3);
    ctx.fill();
    ctx.stroke();
    // Brilho
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(x - r*0.3, y - r*0.2, r*0.25, r*0.18, -0.5, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  function drawStar(ctx, cx, cy, r, fill, stroke, tick) {
    ctx.save();
    // Usar tick do jogo (passado pela drawWorld) — sem Date.now() que deixa rastos
    const spin = (tick || 0) * 0.02;
    ctx.translate(cx, cy);
    ctx.rotate(spin);
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a1 = (i / 5) * Math.PI * 2 - Math.PI/2;
      const a2 = ((i + 0.5) / 5) * Math.PI * 2 - Math.PI/2;
      if (i === 0) ctx.moveTo(Math.cos(a1)*r, Math.sin(a1)*r);
      else ctx.lineTo(Math.cos(a1)*r, Math.sin(a1)*r);
      ctx.lineTo(Math.cos(a2)*(r*0.4), Math.sin(a2)*(r*0.4));
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawSmallStar(ctx, cx, cy, r) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a1 = (i/5)*Math.PI*2-Math.PI/2;
      const a2 = ((i+0.5)/5)*Math.PI*2-Math.PI/2;
      if (i===0) ctx.moveTo(cx+Math.cos(a1)*r, cy+Math.sin(a1)*r);
      else ctx.lineTo(cx+Math.cos(a1)*r, cy+Math.sin(a1)*r);
      ctx.lineTo(cx+Math.cos(a2)*(r*0.4), cy+Math.sin(a2)*(r*0.4));
    }
    ctx.closePath();
    ctx.fill();
  }

  function adjustBrightness(hex, amount) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, Math.max(0, (n >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((n >> 8) & 0xFF) + amount));
    const b = Math.min(255, Math.max(0, (n & 0xFF) + amount));
    return `rgb(${r},${g},${b})`;
  }

  function updateEnemies(canvas) {
    const groundY = canvas.height - TILE * 2;
    for (const e of World.getEnemies()) {
      if (!e.alive) continue;

      e.vy += GRAVITY;
      e.x  += e.vx;
      e.y  += e.vy;

      // Resolve enemies against platforms (simplified: just ground)
      e.onGround = false;
      for (const plat of World.getPlatforms()) {
        if (World.rectOverlap(e, plat)) {
          if (e.vy >= 0 && e.y + e.h - e.vy <= plat.y + 4) {
            e.y = plat.y - e.h;
            e.vy = 0;
            e.onGround = true;
          } else if (e.vy < 0) {
            e.y = plat.y + plat.h;
            e.vy = 0;
          } else {
            e.vx = -e.vx;
            e.x += e.vx * 2;
          }
        }
      }

      // Turn at edges of ground platforms
      if (e.onGround) {
        const ahead = { x: e.x + e.vx * 10, y: e.y + e.h + 4, w: 4, h: 4 };
        let hasGround = false;
        for (const p of World.getPlatforms()) {
          if (p.isGround && World.rectOverlap(ahead, p)) { hasGround = true; break; }
        }
        if (!hasGround) e.vx = -e.vx;

        // Jumper behaviour
        if (e.type === 'jumper') {
          e.jumpTimer--;
          if (e.jumpTimer <= 0) {
            e.vy = -10;
            e.jumpTimer = 80 + Math.random() * 80;
          }
        }
      }

      // World bounds
      if (e.y > canvas.height + 200) {
        e.alive = false;
      }
    }
  }

  function killEnemy(enemy) {
    enemy.alive = false;
  }

  function collectCoin(coin) {
    coin.collected = true;
    Audio.coin();
  }

  return {
    drawWorld, updateEnemies, killEnemy, collectCoin, spawnParticles
  };
})();