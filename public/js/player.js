// ─── JOGADOR (Afonso) ───────────────────────
const Player = (() => {
  const GRAVITY    = 0.42;
  const JUMP_FORCE = -15.5;
  const SPEED      = 5.5;
  const FRICTION   = 0.82;

  let p = {};

  function reset(x, y) {
    p = {
      x, y, w: 32, h: 44,
      vx: 0, vy: 0,
      onGround: false,
      jumpsLeft: 2,
      facingRight: true,
      alive: true,
      invincible: 0,
      deathSounded: false,
      hurtSounded: false,
      animFrame: 0,
      animTick: 0,
      state: 'idle',
      trail: [],
    };
  }

  function update(canvas) {
    if (!p.alive) return;

    const wasOnGround = p.onGround;

    // ── INPUT ──
    if (Input.isDown('left'))  { p.vx -= 0.8; p.facingRight = false; }
    if (Input.isDown('right')) { p.vx += 0.8; p.facingRight = true;  }

    if (Input.justPressed('jump') && p.jumpsLeft > 0) {
      if (p.jumpsLeft === 2) { Audio.jump(); }
      else                   { Audio.doubleJump(); }
      p.vy = JUMP_FORCE;
      p.jumpsLeft--;
    }

    // ── PHYSICS ──
    p.vy += GRAVITY;
    p.vx *= FRICTION;
    p.vx = Math.max(-SPEED, Math.min(SPEED, p.vx));
    p.x  += p.vx;
    p.y  += p.vy;

    // ── COLLISION ──
    p.onGround = World.resolvePlayer(p);
    if (p.onGround && !wasOnGround) {
      Audio.land();
      p.jumpsLeft = 2;
    }
    if (p.onGround) p.jumpsLeft = Math.max(p.jumpsLeft, 1);

    // ── BOUNDS ──
    if (p.x < 0) { p.x = 0; p.vx = 0; }

    // ── INVINCIBILITY ──
    if (p.invincible > 0) p.invincible--;

    // ── ANIMATION ──
    p.animTick++;
    if (p.animTick % 8 === 0) p.animFrame++;

    if (!p.onGround) {
      p.state = p.vy < 0 ? 'jump' : 'fall';
    } else if (Math.abs(p.vx) > 0.3) {
      p.state = 'run';
    } else {
      p.state = 'idle';
    }

    // Trail for double-jump effect
    if (p.jumpsLeft === 0) {
      p.trail.push({ x: p.x + p.w/2, y: p.y + p.h/2, life: 15 });
    }
    p.trail = p.trail.filter(t => { t.life--; return t.life > 0; });

    // ── DEATH ZONE ──
    if (p.y > canvas.height + 200) {
      die();
    }
  }

  function die() {
    if (!p.alive) return; // já morreu — não repetir
    p.alive = false;
    if (!p.deathSounded) {
      p.deathSounded = true;
      Audio.death();
    }
  }

  function hurt() {
    if (p.invincible > 0 || !p.alive) return;
    p.invincible = 90;
    p.vy = -9;
    p.vx = p.facingRight ? -3 : 3;
    Audio.hurt();
    p.state = 'hurt';
    return true;
  }

  // ── RENDER ──
  function draw(ctx, camX, camY) {
    if (!p.alive) return;

    const sx = p.x - camX;
    const sy = p.y - camY;

    // Trail
    for (const t of p.trail) {
      ctx.save();
      ctx.globalAlpha = (t.life / 15) * 0.5;
      ctx.fillStyle = '#9B5DE5';
      ctx.beginPath();
      ctx.arc(t.x - camX, t.y - camY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Blink when invincible
    if (p.invincible > 0 && Math.floor(p.invincible / 5) % 2 === 0) return;

    ctx.save();
    ctx.translate(sx + p.w / 2, sy + p.h / 2);
    if (!p.facingRight) ctx.scale(-1, 1);

    // Squash/stretch
    let sx2 = 1, sy2 = 1;
    if (p.state === 'jump') { sx2 = 0.85; sy2 = 1.15; }
    if (p.state === 'fall') { sx2 = 1.1;  sy2 = 0.9;  }
    if (p.onGround && Math.abs(p.vx) > 2) {
      const bob = Math.sin(p.animFrame * 0.8) * 0.05;
      sy2 = 1 + bob; sx2 = 1 - bob;
    }
    ctx.scale(sx2, sy2);

    const hw = p.w / 2;
    const hh = p.h / 2;

    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(0, hh + 2, hw * 0.9, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Corpo
    ctx.fillStyle = '#4D96FF';
    ctx.beginPath();
    ctx.roundRect(-hw, -hh + 8, p.w, p.h - 8, 8);
    ctx.fill();

    // Cabeça
    ctx.fillStyle = '#FFD6A5';
    ctx.beginPath();
    ctx.arc(0, -hh - 2, 17, 0, Math.PI * 2);
    ctx.fill();

    // Cabelo castanho (estilo menino — topete)
    ctx.fillStyle = '#6B3A1F';
    ctx.beginPath();
    ctx.arc(0, -hh - 8, 13, Math.PI + 0.2, -0.1);
    ctx.fill();
    // Topete
    ctx.beginPath();
    ctx.ellipse(4, -hh - 18, 7, 5, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Olhos
    const eyeY = -hh - 2;
    if (p.state === 'fall') {
      // Olhos de susto
      ctx.fillStyle = 'white';
      ctx.beginPath(); ctx.arc(-6, eyeY, 6, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(5, eyeY, 6, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath(); ctx.arc(-6, eyeY, 3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(5, eyeY, 3, 0, Math.PI*2); ctx.fill();
    } else {
      // Olhos normais
      ctx.fillStyle = '#1a1a1a';
      const blink = p.state === 'idle' && p.animFrame % 60 < 3;
      if (blink) {
        ctx.fillRect(-10, eyeY - 1, 8, 3);
        ctx.fillRect(2, eyeY - 1, 8, 3);
      } else {
        ctx.beginPath(); ctx.arc(-6, eyeY, 4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(5, eyeY, 4, 0, Math.PI*2); ctx.fill();
        // Brilho
        ctx.fillStyle = 'white';
        ctx.beginPath(); ctx.arc(-5, eyeY - 1, 1.5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(6, eyeY - 1, 1.5, 0, Math.PI*2); ctx.fill();
      }
    }

    // Sorriso
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (p.state === 'run') {
      ctx.arc(0, -hh + 6, 5, 0.1, Math.PI - 0.1);
    } else {
      ctx.arc(0, -hh + 5, 4, 0.3, Math.PI - 0.3);
    }
    ctx.stroke();

    // Braços animados
    ctx.strokeStyle = '#4D96FF';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    const armSwing = p.state === 'run' ? Math.sin(p.animFrame * 0.6) * 15 : 0;
    // Braço esquerdo
    ctx.beginPath();
    ctx.moveTo(-hw, -hh + 14);
    ctx.lineTo(-hw - 10, -hh + 22 + armSwing);
    ctx.stroke();
    // Braço direito
    ctx.beginPath();
    ctx.moveTo(hw, -hh + 14);
    ctx.lineTo(hw + 10, -hh + 22 - armSwing);
    ctx.stroke();

    // Pernas
    ctx.strokeStyle = '#3060aa';
    ctx.lineWidth = 6;
    const legSwing = p.onGround ? Math.sin(p.animFrame * 0.6) * 12 : 0;
    ctx.beginPath();
    ctx.moveTo(-5, hh - 4);
    ctx.lineTo(-8 + legSwing, hh + 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(5, hh - 4);
    ctx.lineTo(8 - legSwing, hh + 10);
    ctx.stroke();

    ctx.restore();
  }

  function get() { return p; }

  return { reset, update, draw, get, hurt, die };
})();
