// ─── LIMA — O GATO TUTORIAL ──────────────
const Tutorial = (() => {

  // Após o tutorial, Lima senta-se no ombro do Afonso para sempre
  const STEPS = [
    {
      key: 'move',
      text: 'Olá! Sou o Lima! 🐱\nUsa ← → para andar!',
      // Completo quando o Afonso anda pelo menos 80px
      doneWhen: (p, startX) => Math.abs(p.x - startX) > 80,
    },
    {
      key: 'jump',
      text: 'Muito bem!\nAgora salta com ↑ ou Espaço!',
      doneWhen: (p) => p.jumpsLeft < 2 && !p.onGround,
    },
    {
      key: 'doublejump',
      text: 'Incrível! Sabias que podes\nsaltar DUAS vezes seguidas? ↑ ↑',
      doneWhen: (p) => p.jumpsLeft === 0,
    },
    {
      key: 'done',
      text: 'Excelente Afonso! 🏠\nChega a casa, eu fico aqui contigo!',
      doneWhen: null, // nunca completa — fecha sozinho após timer
      autoClose: 300,
    },
  ];

  let active      = false;
  let stepIdx     = 0;
  let stepFrame   = 0;
  let advancing   = false; // a aguardar o delay antes de avançar
  let tutoDone    = false; // tutorial completo — Lima fica no ombro
  let limaAnim    = 0;
  let startX      = 0;    // posição X do Afonso quando o passo começou

  function start(playerX) {
    active    = true;
    stepIdx   = 0;
    stepFrame = 0;
    advancing = false;
    tutoDone  = false;
    limaAnim  = 0;
    limaInit  = false;
    startX    = playerX;
  }

  function keepFollowing() {
    // Chamar nos níveis seguintes para manter o Lima activo a seguir o Afonso
    active   = true;
    tutoDone = true;
    limaInit = false;
  }

  function stop() {
    active   = false;
    tutoDone = false;
  }

  function update(player) {
    if (!active) return;
    limaAnim++;

    // Após o tutorial, Lima apenas acompanha o Afonso no ombro
    if (tutoDone) return;

    const step = STEPS[stepIdx];
    stepFrame++;

    // Já está a aguardar avançar — não verificar de novo
    if (advancing) return;

    // Fechar automaticamente o último passo
    if (step.autoClose && stepFrame > step.autoClose) {
      tutoDone = true;
      return;
    }

    // Verificar se o passo foi concluído
    if (step.doneWhen && step.doneWhen(player, startX)) {
      advancing = true;
      setTimeout(() => {
        stepIdx++;
        stepFrame = 0;
        advancing = false;
        startX    = player.x;
        if (stepIdx >= STEPS.length) {
          tutoDone = true;
        }
      }, 600);
    }
  }

  // Lima segue o Afonso — posição suavizada
  let limaX = 0;
  let limaY = 0;
  let limaInit = false;

  function draw(ctx, canvasW, canvasH, player, camX, camY) {
    if (!active) return;

    // Posição alvo: ligeiramente atrás do Afonso (dependendo da direcção)
    const Afonso_sx = player.x - camX + player.w / 2;
    const Afonso_sy = player.y - camY;

    // Inicializar posição do Lima na primeira frame
    if (!limaInit) {
      limaX = Afonso_sx + (player.facingRight ? 60 : -60);
      limaY = Afonso_sy;
      limaInit = true;
    }

    // Alvo do Lima: atrás do Afonso, no chão
    const targetX = Afonso_sx + (player.facingRight ? -60 : 60);
    const targetY = Afonso_sy;

    // Suavizar movimento (lerp) — Lima "corre" para apanhar o Afonso
    limaX += (targetX - limaX) * 0.12;
    limaY += (targetY - limaY) * 0.18;

    if (tutoDone) {
      // Tutorial acabado — Lima segue compacto sem balão
      drawLima(ctx, limaX, limaY, limaAnim, false);
      return;
    }

    const step = STEPS[stepIdx];
    if (!step) return;

    drawLima(ctx, limaX, limaY, limaAnim, false);
    drawBubble(ctx, limaX, limaY, step, canvasW, limaAnim, player);
  }

  // ── LIMA TAMANHO NORMAL ──
  function drawLima(ctx, x, y, t, seated) {
    ctx.save();
    const bob = Math.sin(t * 0.06) * 4;
    ctx.translate(x, y + bob);
    drawLimaBody(ctx, t, seated);
    ctx.restore();
  }

  function drawLimaBody(ctx, t, seated) {
    // Tudo preto com detalhes brancos/cinzentos
    const fur     = '#1a1a1a';
    const furDark = '#111111';
    const furHL   = '#333333'; // highlight suave
    const eye     = '#44dd66'; // olhos verdes brilhantes

    // Sombra
    if (!seated) {
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(0, 10, 16, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Corpo
    ctx.fillStyle = fur;
    ctx.beginPath();
    ctx.ellipse(0, seated ? -4 : -10, 14, seated ? 10 : 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // Highlight de pelo no corpo
    ctx.fillStyle = furHL;
    ctx.beginPath();
    ctx.ellipse(-3, seated ? -8 : -14, 5, 4, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // Cabeça
    ctx.fillStyle = fur;
    ctx.beginPath();
    ctx.arc(0, -26, 13, 0, Math.PI * 2);
    ctx.fill();

    // Orelhas pretas
    ctx.fillStyle = fur;
    ctx.beginPath();
    ctx.moveTo(-9, -35); ctx.lineTo(-15, -46); ctx.lineTo(-3, -39);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(9, -35); ctx.lineTo(15, -46); ctx.lineTo(3, -39);
    ctx.closePath(); ctx.fill();
    // Interior das orelhas (cinzento escuro)
    ctx.fillStyle = '#3a2a2a';
    ctx.beginPath();
    ctx.moveTo(-9,-36); ctx.lineTo(-13,-44); ctx.lineTo(-5,-40);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(9,-36); ctx.lineTo(13,-44); ctx.lineTo(5,-40);
    ctx.closePath(); ctx.fill();

    // Olhos verdes brilhantes — destaque do Lima
    ctx.fillStyle = eye;
    ctx.beginPath(); ctx.ellipse(-5, -27, 4, 5, -0.15, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(5, -27, 4, 5, 0.15, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.ellipse(-5, -27, 2, 3.5, -0.15, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(5, -27, 2, 3.5, 0.15, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(-4, -29, 1.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(6, -29, 1.5, 0, Math.PI*2); ctx.fill();

    // Nariz rosado
    ctx.fillStyle = '#ff88bb';
    ctx.beginPath(); ctx.arc(0, -23, 2, 0, Math.PI*2); ctx.fill();

    // Bigodes brancos
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    for (const [ox, dir] of [[-1,-1],[1,1]]) {
      ctx.beginPath(); ctx.moveTo(ox*2,-23); ctx.lineTo(ox*15,-21+dir); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ox*2,-22); ctx.lineTo(ox*15,-25+dir); ctx.stroke();
    }

    // Sorriso suave
    ctx.strokeStyle = '#cc4488';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -20, 3.5, 0.3, Math.PI - 0.3);
    ctx.stroke();

    // Rabo (enrolado se sentado, comprido se a andar)
    ctx.strokeStyle = fur;
    ctx.lineWidth = seated ? 4 : 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (seated) {
      ctx.moveTo(10, -2);
      ctx.quadraticCurveTo(22, 4, 16, 10);
      ctx.quadraticCurveTo(10, 16, 4, 10);
    } else {
      ctx.moveTo(13, -4);
      ctx.quadraticCurveTo(26, 4, 20, 12);
      ctx.quadraticCurveTo(14, 20, 6, 14);
    }
    ctx.stroke();

    // Patas
    ctx.fillStyle = fur;
    if (!seated) {
      ctx.beginPath(); ctx.ellipse(-8, 5, 6, 3, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(8, 5, 6, 3, 0, 0, Math.PI*2); ctx.fill();
    } else {
      // Sentado — patas dobradas à frente
      ctx.beginPath(); ctx.ellipse(-5, 4, 5, 3, 0.3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(5, 4, 5, 3, -0.3, 0, Math.PI*2); ctx.fill();
    }
  }

  // ── BALÃO DE FALA ──
  function drawBubble(ctx, limaX, limaY, step, canvasW, t, player) {
    const lines = step.text.split('\n');
    const lineH = 24;
    const pad   = 16;

    ctx.font = 'bold 17px Nunito, sans-serif';
    let textW = 0;
    for (const l of lines) textW = Math.max(textW, ctx.measureText(l).width);
    const bw = Math.max(textW + pad * 2, 270);
    const bh = lines.length * lineH + pad * 1.4;

    // Balão sempre visível no ecrã
    let bx = limaX - bw / 2;
    let by = limaY - bh - 70;
    bx = Math.max(10, Math.min(bx, canvasW - bw - 10));
    if (by < 10) by = limaY + 10;

    // Fundo
    ctx.save();
    ctx.fillStyle = 'rgba(10,10,20,0.92)';
    ctx.strokeStyle = '#44dd66';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#44dd66';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 12);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Seta
    const tipX = Math.min(Math.max(limaX, bx + 16), bx + bw - 16);
    const tipY  = by + bh;
    ctx.fillStyle = 'rgba(10,10,20,0.92)';
    ctx.strokeStyle = '#44dd66';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(tipX - 9, tipY - 1);
    ctx.lineTo(tipX, tipY + 12);
    ctx.lineTo(tipX + 9, tipY - 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Texto
    ctx.fillStyle = '#eeffee';
    ctx.font = 'bold 17px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 0;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], bx + bw / 2, by + pad + i * lineH + 8);
    }

    // Indicadores animados
    const bob = Math.sin(t * 0.1) * 5;
    ctx.font = '1.1rem serif';
    if (step.key === 'move') {
      ctx.fillStyle = '#FFD93D';
      ctx.fillText('←', bx - 20, by + bh/2 + bob);
      ctx.fillText('→', bx + bw + 20, by + bh/2 - bob);
    }
    if (step.key === 'jump' || step.key === 'doublejump') {
      ctx.fillStyle = '#FFD93D';
      ctx.fillText('↑', bx + bw/2, by - 14 - Math.abs(bob));
    }

    ctx.restore();
  }

  return { start, stop, keepFollowing, update, draw };
})();
