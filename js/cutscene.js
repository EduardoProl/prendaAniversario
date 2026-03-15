// ─── CUTSCENE ────────────────────────────
const Cutscene = (() => {
  const canvas = document.getElementById('cutsceneCanvas');
  const ctx = canvas.getContext('2d');
  const textEl = document.getElementById('cutsceneText');

  function getSceneScale() {
    const W = canvas.width;

    // breakpoint simples
    if (W < 600) {
      return {
        charScale: 1.05,   // personagens menores
        spacing: 1.35      // mais distância entre elas
      };
    }

    return {
      charScale: 1.4,
      spacing: 1
    };
  }

  let t = 0;
  let frame = 0;
  let raf = null;
  let onDone = null;
  let currentScene = 0;

  const scenes = [
    { duration: 220, draw: drawScene0, text: '🌙 Era uma noite escura...\nO Afonso perdeu-se a brincar no bosque!' },
    { duration: 260, draw: drawScene1, text: '⛰️ Lá no alto da montanha,\nos pais do Afonso esperavam ansiosos...' },
    { duration: 300, draw: drawScene2, text: '💡 A Mãe teve uma ideia genial!\nApontou a lanterna para a careca brilhante do Pai...' },
    { duration: 260, draw: drawScene3, text: '🔦 E assim, a careca do Pai\ntornou-se um farol para guiar o menino a casa!' },
    { duration: 200, draw: drawScene4, text: '🏃 Agora é a tua vez!\nGuia o Afonso de volta à família!' },
  ];

  // Cena final (chamada após vitória)
  const endScenes = [
    { duration: 360, draw: drawEndScene0, text: '🏃 O Afonso corre pela última vez...\nA casa está mesmo ali!' },
    { duration: 420, draw: drawEndScene1, text: '🏠 A porta abre-se de repente...\nOs pais saem a correr!' },
    { duration: 480, draw: drawEndScene2, text: '❤️ A família está reunida!\nO Afonso está em segurança!' },
    { duration: 360, draw: drawEndScene3, text: '✨ E a careca do Pai brilhou\nessa noite mais do que nunca...' },
  ];

  let activeScenes = scenes; // pode ser 'scenes' ou 'endScenes'

  function resize() {
    canvas.width = canvas.offsetWidth || window.innerWidth;
    canvas.height = canvas.offsetHeight || window.innerHeight;
  }

  // ── CENA 0: Bosque escuro, Afonso assustado ──
  function drawScene0(t) {
    const W = canvas.width, H = canvas.height;
    const groundY = H * 0.78; // linha do chão consistente

    // Céu noturno
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#050510');
    sky.addColorStop(1, '#0a1428');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Estrelas
    drawStars(t);

    // Chão
    ctx.fillStyle = '#1a3320';
    ctx.fillRect(0, groundY, W, H - groundY);
    ctx.fillStyle = '#2a5c2a';
    ctx.fillRect(0, groundY, W, 10);

    // Olhos ANTES das árvores da frente (dentro das árvores de fundo)
    drawSpookyEyes(W * 0.15, groundY - H * 0.18, t);
    drawSpookyEyes(W * 0.82, groundY - H * 0.22, t + 60);

    // Árvores de fundo (mais claras, menores)
    for (let i = 0; i < 18; i++) {
      const phi = 1.618;
      const x = ((i * phi * 211) % 1.0) * W;
      const h = H * 0.22 + ((i * 73) % (H * 0.12));
      drawTree(x, groundY, h, `hsl(${125 + i * 3},20%,${8 + i % 5 * 2}%)`);
    }

    // Árvores da frente (mais escuras, maiores, enquadram o Afonso)
    for (let i = 0; i < 7; i++) {
      const x = (i / 6) * W * 1.1 - W * 0.05;
      const h = H * 0.45 + (i % 3) * H * 0.08;
      // Deixar espaço no centro para o Afonso
      if (Math.abs(x - W * 0.5) < W * 0.18) continue;
      drawTree(x, groundY, h, `hsl(${128 + i * 4},22%,${6 + i % 3 * 2}%)`);
    }

    // Afonso assustado — pés no chão
    const px = W * 0.5 + Math.sin(t * 0.05) * 4;
    // drawAfonso desenha com translate(x,y), o personagem sobe ~60px acima de y
    const py = groundY;
    drawAfonso(px, py, 1.4, true);
  }

  // ── CENA 1: Alto da montanha, pais ──
  function drawScene1(t) {
    const W = canvas.width, H = canvas.height;
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#0a0520');
    sky.addColorStop(0.6, '#1a0a30');
    sky.addColorStop(1, '#2a1040');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    drawStars(t);
    drawMountainAndHouse(W, H);

    // Pais ao lado da casa
    const topY = H * 0.32;
    const { charScale, spacing } = getSceneScale();

    drawMom(W * (0.38 - (spacing - 1) * 0.08), topY, charScale);
    drawDad(W * (0.56 + (spacing - 1) * 0.08), topY, charScale, false);
  }

  // ── CENA 2: Mãe aponta lanterna para careca ──
  function drawScene2(t) {
    const W = canvas.width, H = canvas.height;
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#050510');
    sky.addColorStop(1, '#0a1428');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    drawStars(t);
    drawMountainAndHouse(W, H);

    // Pais nas mesmas posições da cena 1
    const charY = H * 0.32;
    const { charScale, spacing } = getSceneScale();

    const momX = W * (0.38 - (spacing - 1) * 0.08);
    const dadX = W * (0.56 + (spacing - 1) * 0.08);

    drawMom(momX, charY, charScale);
    drawDad(dadX, charY, charScale, false);

    // Lanterna alinhada com a mão da mãe
    drawFlashlight(
      momX + 22 * charScale,
      charY - 32 * charScale,
      0.12 + Math.sin(t * 0.03) * 0.04
    );
  }

  // ── CENA 3: Careca como farol ──
  function drawScene3(t) {
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#020208';
    ctx.fillRect(0, 0, W, H);

    drawStars(t);
    drawMountainAndHouse(W, H);

    // Raio de luz giratório — pai na mesma posição das outras cenas
    const { charScale, spacing } = getSceneScale();

    const dadX = W * (0.56 + (spacing - 1) * 0.08);
    const dadY = H * 0.32;
    const beamAngle = t * 0.03;

    ctx.save();
    ctx.translate(dadX, dadY - 50);
    for (let b = 0; b < 3; b++) {
      const a = beamAngle + (b * Math.PI * 2 / 3);
      const beam = ctx.createRadialGradient(0, 0, 5, 0, 0, W * 0.8);
      beam.addColorStop(0, 'rgba(255,255,200,0.5)');
      beam.addColorStop(1, 'rgba(255,255,200,0)');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, W * 0.8, a - 0.15, a + 0.15);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    drawMom(W * (0.38 - (spacing - 1) * 0.08), H * 0.32, charScale);
    drawDad(dadX, H * 0.32, charScale, true);

  }

  // ── CENA 4: Chamada à aventura ──
  function drawScene4(t) {
    const W = canvas.width, H = canvas.height;
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#0a0a2a');
    sky.addColorStop(1, '#0f2050');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    drawStars(t);

    // Chão com linha de erva
    ctx.fillStyle = '#1a3320';
    ctx.fillRect(0, H * 0.78, W, H * 0.22);
    ctx.fillStyle = '#2a5c2a';
    ctx.fillRect(0, H * 0.78, W, 10);

    // Árvores de enquadramento
    for (let i = 0; i < 5; i++) {
      const tx = (i / 4) * W * 0.28;
      const th = H * 0.30 + (i % 3) * 20;
      ctx.fillStyle = `hsl(128,20%,${7 + i % 3 * 2}%)`;
      ctx.beginPath();
      ctx.moveTo(tx, H * 0.78 - th);
      ctx.lineTo(tx - th * 0.35, H * 0.78);
      ctx.lineTo(tx + th * 0.35, H * 0.78);
      ctx.closePath(); ctx.fill();
    }
    for (let i = 0; i < 4; i++) {
      const tx = W * 0.78 + (i / 3) * W * 0.22;
      const th = H * 0.25 + (i % 2) * 25;
      ctx.fillStyle = `hsl(128,20%,${6 + i % 3 * 2}%)`;
      ctx.beginPath();
      ctx.moveTo(tx, H * 0.78 - th);
      ctx.lineTo(tx - th * 0.35, H * 0.78);
      ctx.lineTo(tx + th * 0.35, H * 0.78);
      ctx.closePath(); ctx.fill();
    }

    // Afonso no chão ao centro — a saltar alegremente
    const groundY = H * 0.78;
    const jumpY = Math.abs(Math.sin(t * 0.07)) * 28;
    drawAfonso(W * 0.5, groundY - jumpY, 2.0, false);

    // Indicador de caminho — pontinhos luminosos no chão à direita
    ctx.save();
    for (let d = 0; d < 4; d++) {
      const dx = W * 0.6 + d * 40;
      const alpha = ((t * 0.05 + d * 0.4) % 1.0);
      ctx.globalAlpha = Math.sin(alpha * Math.PI) * 0.9;
      ctx.fillStyle = '#FFD93D';
      ctx.beginPath();
      ctx.arc(dx, groundY - 12, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ── HELPERS GRÁFICOS ──

  // ── MONTANHA + CASA PARTILHADA (cenas 1, 2, 3) ──
  function drawMountainAndHouse(W, H) {
    const peakX = W * 0.5;
    const peakY = H * 0.15;

    // largura mínima da montanha para evitar pico estreito
    const baseHalfWidth = Math.max(W * 0.35, H * 0.55);

    const leftBase = peakX - baseHalfWidth;
    const rightBase = peakX + baseHalfWidth;


    // Montanha
    ctx.fillStyle = '#1a1a2a';
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(leftBase, H * 0.32);
    ctx.lineTo(peakX, peakY);
    ctx.lineTo(rightBase, H * 0.32);
    ctx.lineTo(W, H);
    ctx.fill();


    // Casa grande — drawHouse(x,y,scale): x é canto esquerdo, y ancora com base da porta em y+20*scale
    // Queremos que a base (y + 20*scale) coincida com peakY
    // Com scale=3: base = y + 60 → y = peakY - 60
    const isMobile = W < 600;
    const houseScale = isMobile ? 3.0 : 6.0;
    const houseX = peakX - 5 * houseScale; // centrar: metade da largura (30*scale)
    const houseBaseOffset = 5 * houseScale; // base da porta relativa a y
    const houseY = peakY - houseBaseOffset + 10; // +10 para encaixar ligeiramente dentro do pico
    drawHouse(houseX, houseY, houseScale);
  }

  // Posições fixas das estrelas (calculadas uma vez com sequência de Halton)
  const _starPos = (() => {
    function h(i, b) { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; }
    return Array.from({ length: 90 }, (_, i) => ({
      nx: h(i + 1, 2), ny: h(i + 1, 3),
      col: i % 11 === 0 ? '#ffe8a0' : i % 7 === 0 ? '#aaccff' : 'white',
      sz: 0.8 + (i % 3) * 0.55,
      sp: 0.02 + (i % 5) * 0.008,
    }));
  })();

  function drawStars(t) {
    const W = canvas.width, H = canvas.height;
    ctx.save();
    for (const s of _starPos) {
      const tw = Math.sin(t * s.sp + s.nx * 10) * 0.5 + 0.5;
      ctx.globalAlpha = 0.25 + tw * 0.75;
      ctx.fillStyle = s.col;
      ctx.beginPath();
      ctx.arc(s.nx * W, s.ny * H * 0.65, s.sz + tw * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawTree(x, y, h, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - h);
    ctx.lineTo(x - h * 0.35, y);
    ctx.lineTo(x + h * 0.35, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#5c3d1e';
    ctx.fillRect(x - 5, y, 10, 30);
  }

  function drawAfonso(x, y, scale, scared) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Corpo (redondo, azul)
    ctx.fillStyle = '#4D96FF';
    ctx.beginPath();
    ctx.ellipse(0, -15, 16, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cabeça
    ctx.fillStyle = '#FFD6A5';
    ctx.beginPath();
    ctx.arc(0, -40, 16, 0, Math.PI * 2);
    ctx.fill();

    // Cabelo (topete de menino)
    ctx.fillStyle = '#6B3A1F';
    ctx.beginPath();
    ctx.arc(0, -50, 12, Math.PI + 0.2, -0.1);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(4, -58, 6, 4, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Olhos
    if (scared) {
      // Olhos aterrorizados
      ctx.fillStyle = 'white';
      ctx.beginPath(); ctx.arc(-6, -41, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(6, -41, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.arc(-6, -41, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(6, -41, 3, 0, Math.PI * 2); ctx.fill();
      // Boca aberta
      ctx.fillStyle = '#ff4444';
      ctx.beginPath();
      ctx.arc(0, -33, 5, 0, Math.PI);
      ctx.fill();
    } else {
      // Olhos felizes
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.arc(-5, -41, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(5, -41, 4, 0, Math.PI * 2); ctx.fill();
      // Brilho
      ctx.fillStyle = 'white';
      ctx.beginPath(); ctx.arc(-4, -43, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(6, -43, 1.5, 0, Math.PI * 2); ctx.fill();
      // Sorriso
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -36, 6, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }

    // Braços
    ctx.strokeStyle = '#4D96FF';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-16, -18); ctx.lineTo(-26, -8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(16, -18); ctx.lineTo(26, -8); ctx.stroke();

    // Pernas
    ctx.strokeStyle = '#3060aa';
    ctx.beginPath(); ctx.moveTo(-5, 4); ctx.lineTo(-8, 20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, 4); ctx.lineTo(8, 20); ctx.stroke();

    ctx.restore();
  }

  function drawMom(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Vestido rosa
    ctx.fillStyle = '#FF6B9D';
    ctx.beginPath();
    ctx.moveTo(-15, -10);
    ctx.lineTo(-20, 25);
    ctx.lineTo(20, 25);
    ctx.lineTo(15, -10);
    ctx.closePath();
    ctx.fill();

    // Cabeça
    ctx.fillStyle = '#FFD6A5';
    ctx.beginPath();
    ctx.arc(0, -28, 15, 0, Math.PI * 2);
    ctx.fill();

    // Cabelo longo — cobre toda a cabeça e desce pelos lados
    ctx.fillStyle = '#4d2409';
    // Topo e lados: arco maior que a cabeça
    ctx.beginPath();
    ctx.arc(0, -30, 17, Math.PI, 0);
    ctx.fill();
    // Madeixas laterais longas
    ctx.fillRect(-17, -30, 7, 32);
    ctx.fillRect(10, -30, 7, 32);
    // Franja no topo
    ctx.beginPath();
    ctx.arc(0, -34, 14, Math.PI + 0.2, -0.2);
    ctx.fill();

    // Olhos
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(-5, -29, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5, -29, 3, 0, Math.PI * 2); ctx.fill();

    // Óculos
    ctx.strokeStyle = '#eed756';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(180,220,255,0.18)';
    // Lente esquerda
    ctx.beginPath(); ctx.arc(-5, -29, 6, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    // Lente direita
    ctx.beginPath(); ctx.arc(5, -29, 6, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    // Ponte entre as lentes
    ctx.beginPath(); ctx.moveTo(1, -29); ctx.lineTo(-1, -29); ctx.stroke();
    // Hastes para os lados
    ctx.beginPath(); ctx.moveTo(-11, -29); ctx.lineTo(-16, -27); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(11, -29); ctx.lineTo(16, -27); ctx.stroke();

    // Sorriso preocupado
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -22, 5, 0.3, Math.PI - 0.3);
    ctx.stroke();

    ctx.restore();
  }

  function drawDad(x, y, scale, glowing) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Calças azuis
    ctx.fillStyle = '#2255aa';
    ctx.fillRect(-12, -5, 24, 30);

    // Camisola verde
    ctx.fillStyle = '#4a8a4a';
    ctx.fillRect(-15, -22, 30, 20);

    // Cabeça
    ctx.fillStyle = '#FFD6A5';
    ctx.beginPath();
    ctx.arc(0, -36, 16, 0, Math.PI * 2);
    ctx.fill();

    // CARECA — sem cabelo, com brilho!
    if (glowing) {
      // Halo brilhante
      const grd = ctx.createRadialGradient(0, -42, 5, 0, -42, 30);
      grd.addColorStop(0, 'rgba(255,255,150,0.9)');
      grd.addColorStop(0.5, 'rgba(255,220,50,0.5)');
      grd.addColorStop(1, 'rgba(255,200,0,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(0, -42, 35, 0, Math.PI * 2);
      ctx.fill();

      // Reflexo brilhante na careca
      ctx.fillStyle = 'rgba(255,255,200,0.7)';
      ctx.beginPath();
      ctx.ellipse(-4, -44, 6, 4, -0.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Só um pequenininho brilho
      ctx.fillStyle = 'rgba(255,255,220,0.3)';
      ctx.beginPath();
      ctx.ellipse(-4, -44, 5, 3, -0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Olhos
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(-5, -37, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5, -37, 3, 0, Math.PI * 2); ctx.fill();

    // Bigode
    ctx.fillStyle = '#5c3d00';
    ctx.beginPath();
    ctx.ellipse(0, -29, 8, 3, 0, 0, Math.PI);
    ctx.fill();

    ctx.restore();
  }

  function drawFlashlight(x, y, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Corpo da lanterna
    ctx.fillStyle = '#888';
    ctx.fillRect(-4, -4, 22, 8);
    ctx.fillStyle = '#aaa';
    ctx.fillRect(18, -6, 8, 12);

    // Feixe de luz
    const beam = ctx.createRadialGradient(26, 0, 2, 80, 0, 80);
    beam.addColorStop(0, 'rgba(255,255,200,0.8)');
    beam.addColorStop(1, 'rgba(255,255,200,0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(26, 0);
    ctx.lineTo(150, -50);
    ctx.lineTo(150, 50);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function drawHouse(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Casa
    ctx.fillStyle = '#e8c080';
    ctx.fillRect(-30, -20, 60, 40);

    // Telhado
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.moveTo(-35, -20);
    ctx.lineTo(0, -55);
    ctx.lineTo(35, -20);
    ctx.closePath();
    ctx.fill();

    // Porta
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(-8, 0, 16, 20);

    // Janela
    ctx.fillStyle = '#FFD93D';
    ctx.fillRect(-20, -12, 12, 12);

    // Luz da janela
    const wgrd = ctx.createRadialGradient(-14, -6, 0, -14, -6, 30);
    wgrd.addColorStop(0, 'rgba(255,230,100,0.4)');
    wgrd.addColorStop(1, 'rgba(255,230,100,0)');
    ctx.fillStyle = wgrd;
    ctx.beginPath();
    ctx.arc(-14, -6, 30, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawSpookyEyes(x, y, t) {
    const blink = Math.sin(t * 0.07) > 0.9;
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#88ff00';
    if (!blink) {
      ctx.beginPath(); ctx.ellipse(x - 8, y, 5, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + 8, y, 5, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#003300';
      ctx.beginPath(); ctx.ellipse(x - 8, y, 2, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + 8, y, 2, 6, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // ── CENA FINAL 0: Afonso a correr para casa ──
  function drawEndScene0(t) {
    const W = canvas.width, H = canvas.height;
    const groundY = H * 0.78;
    // Fundo noturno quente — amanhecer no horizonte
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#050515');
    sky.addColorStop(0.7, '#1a0a2e');
    sky.addColorStop(1, '#3a1a10');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    drawStars(t);

    // Chão
    ctx.fillStyle = '#1a3320'; ctx.fillRect(0, groundY, W, H - groundY);
    ctx.fillStyle = '#2a5c2a'; ctx.fillRect(0, groundY, W, 10);

    // Casa iluminada ao fundo
    const houseScale = 1.2 + Math.min(t * 0.004, 0.6); // casa fica maior
    drawHouseScene(ctx, W * 0.75, groundY, houseScale);

    // Árvores laterais
    for (let i = 0; i < 5; i++) {
      const x = (i / 4) * W * 0.35;
      drawTree(x, groundY, H * 0.35 + i * 20, `hsl(128,18%,8%)`);
    }

    // Afonso a correr (animado)
    const runX = W * 0.15 + Math.min(t * 2.5, W * 0.35);
    drawAfonso(runX, groundY, 1.5, false);

    // Trilho de pés (pegadas)
    ctx.save();
    for (let p = 0; p < 5; p++) {
      const px = runX - 30 - p * 28;
      if (px < 0) continue;
      ctx.globalAlpha = 0.3 - p * 0.05;
      ctx.fillStyle = '#4a8a4a';
      ctx.beginPath(); ctx.ellipse(px, groundY + 5, 6, 3, 0.3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // ── CENA FINAL 1: A porta abre-se ──
  function drawEndScene1(t) {
    const W = canvas.width, H = canvas.height;
    const groundY = H * 0.75;
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#050515');
    sky.addColorStop(1, '#1a0a20');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    drawStars(t);

    ctx.fillStyle = '#1a3320'; ctx.fillRect(0, groundY, W, H - groundY);
    ctx.fillStyle = '#2a5c2a'; ctx.fillRect(0, groundY, W, 10);

    // Casa grande ao centro
    drawHouseScene(ctx, W * 0.5, groundY, 2.5);

    // Luz da porta (cresce)
    const doorOpen = Math.min(t / 80, 1);
    const lightR = doorOpen * 120;
    const doorX = W * 0.5, doorY = groundY - 20;
    const lg = ctx.createRadialGradient(doorX, doorY, 0, doorX, doorY, lightR);
    lg.addColorStop(0, 'rgba(255,200,80,0.8)');
    lg.addColorStop(1, 'rgba(255,200,80,0)');
    ctx.fillStyle = lg;
    ctx.beginPath(); ctx.arc(doorX, doorY, lightR, 0, Math.PI * 2); ctx.fill();

    // Pais a sair
    if (t > 60) {
      const emerge = Math.min((t - 60) / 60, 1);
      drawMom(W * 0.42 + (1 - emerge) * 30, groundY - emerge * 5, 2.0);
      drawDad(W * 0.58 - (1 - emerge) * 30, groundY - emerge * 5, 2.0, true);
    }

    // Afonso a aproximar-se
    const AfonsoX = W * 0.1 + Math.min(t * 1.8, W * 0.22);
    drawAfonso(AfonsoX, groundY, 1.4, false);
  }

  // ── CENA FINAL 2: Abraço ──
  function drawEndScene2(t) {
    const W = canvas.width, H = canvas.height;
    const groundY = H * 0.75;

    // Fundo começa a clarear ligeiramente
    const dawn = Math.min(t / 300, 0.35);
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, `rgba(5,5,25,${1 - dawn})`);
    sky.addColorStop(1, `rgba(40,20,10,${1 - dawn * 0.5})`);
    ctx.fillStyle = '#050515'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    if (dawn < 0.3) drawStars(t);

    ctx.fillStyle = '#1a3320'; ctx.fillRect(0, groundY, W, H - groundY);
    ctx.fillStyle = '#2a5c2a'; ctx.fillRect(0, groundY, W, 10);

    drawHouseScene(ctx, W * 0.72, groundY, 1.8);

    // Família reunida — todos juntos
    const cx = W * 0.42;
    drawMom(cx - 55, groundY, 2.0);
    drawAfonso(cx + 5, groundY, 1.2, false);
    drawDad(cx + 65, groundY, 2.0, true);

    // Corações e estrelas a aparecer
    const numHearts = Math.floor(t / 20);
    ctx.save();
    for (let h = 0; h < Math.min(numHearts, 8); h++) {
      const hx = cx - 60 + ((h * 137) % 140);
      const hy = groundY - 60 - h * 18 - Math.sin(t * 0.05 + h) * 12;
      ctx.globalAlpha = Math.max(0, 1 - (t - h * 20) / 120);
      ctx.font = '1.5rem serif';
      ctx.fillStyle = h % 2 === 0 ? '#ff6b9d' : '#FFD93D';
      ctx.fillText(h % 3 === 0 ? '⭐' : '❤️', hx, hy);
    }
    ctx.restore();

    // Brilho da careca do pai ilumina toda a cena
    const glowR = 60 + Math.sin(t * 0.08) * 15;
    const dadGlow = ctx.createRadialGradient(cx + 50, groundY - 80, 5, cx + 50, groundY - 80, glowR);
    dadGlow.addColorStop(0, 'rgba(255,255,150,0.4)');
    dadGlow.addColorStop(1, 'rgba(255,255,150,0)');
    ctx.fillStyle = dadGlow;
    ctx.beginPath(); ctx.arc(cx + 50, groundY - 80, glowR, 0, Math.PI * 2); ctx.fill();
  }

  // ── CENA FINAL 3: Título final ──
  function drawEndScene3(t) {
    const W = canvas.width, H = canvas.height;
    // Fundo gradual para azul mais claro — quase amanhecer
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#050520');
    sky.addColorStop(0.6, '#0a1535');
    sky.addColorStop(1, '#1a2a50');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    drawStars(t);

    const groundY = H * 0.75;
    ctx.fillStyle = '#1a3320'; ctx.fillRect(0, groundY, W, H - groundY);
    ctx.fillStyle = '#2a5c2a'; ctx.fillRect(0, groundY, W, 10);

    drawHouseScene(ctx, W * 0.5, groundY, 2.0);

    // Família na janela
    const cx = W * 0.5;
    ctx.save();
    ctx.globalAlpha = Math.min(t / 60, 1);
    drawMom(cx - 70, groundY - 5, 1.9);
    drawAfonso(cx, groundY - 5, 1.1, false);
    drawDad(cx + 68, groundY - 5, 1.9, true);
    ctx.restore();

    // Título "FIM" com brilho
    const alpha = Math.min((t - 80) / 60, 1);
    if (alpha > 0) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 3.5rem "Fredoka One", cursive';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFD93D';
      ctx.shadowColor = '#FFD93D';
      ctx.shadowBlur = 30;
      ctx.fillText('Casa, Doce Casa!', W / 2, H * 0.18);
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  // Helper — casa para as cenas finais
  function drawHouseScene(c, x, groundY, scale) {
    c.save();
    c.translate(x, groundY);
    c.scale(scale, scale);
    const hw = 55, hh = 70;
    // Corpo
    c.fillStyle = '#c8a060'; c.fillRect(-hw, -hh, hw * 2, hh);
    // Telhado
    c.fillStyle = '#882211';
    c.beginPath(); c.moveTo(-hw - 8, -hh); c.lineTo(0, -hh - 50); c.lineTo(hw + 8, -hh); c.closePath(); c.fill();
    // Janelas iluminadas
    c.fillStyle = '#FFD93D';
    c.fillRect(-hw + 8, -hh + 12, 22, 18);
    c.fillRect(hw - 30, -hh + 12, 22, 18);
    // Porta
    c.fillStyle = '#7B3F00';
    c.beginPath(); c.roundRect(-12, -28, 24, 28, [8, 8, 0, 0]); c.fill();
    // Chaminé
    c.fillStyle = '#884422'; c.fillRect(hw - 20, -hh - 35, 14, 30);
    // Fumo
    for (let s = 0; s < 3; s++) {
      const sf = ((Date.now() * 0.0005 + s * 0.33) % 1);
      c.save(); c.globalAlpha = (1 - sf) * 0.4;
      c.fillStyle = '#aaa';
      c.beginPath();
      c.arc(hw - 13, -hh - 35 - sf * 40 + Math.sin(Date.now() * 0.002 + s) * 6, 4 + sf * 7, 0, Math.PI * 2);
      c.fill(); c.restore();
    }
    c.restore();
  }

  // ── LOOP ──
  function loop() {
    if (!canvas.offsetWidth) { raf = requestAnimationFrame(loop); return; }

    resize();
    const scene = activeScenes[currentScene];
    scene.draw(frame);
    frame++;

    // Fade out and advance
    if (frame >= scene.duration) {
      frame = 0;
      currentScene++;
      if (currentScene >= activeScenes.length) {
        stop();
        onDone && onDone();
        return;
      }
      textEl.style.opacity = '0';
      setTimeout(() => {
        textEl.textContent = activeScenes[currentScene].text;
        textEl.style.opacity = '1';
      }, 500);
    }

    raf = requestAnimationFrame(loop);
  }

  // activeScenes declared above endScenes

  function play(callback) {
    onDone = callback;
    activeScenes = scenes;
    currentScene = 0;
    frame = 0;
    resize();
    textEl.textContent = activeScenes[0].text;
    textEl.style.opacity = '1';
    raf = requestAnimationFrame(loop);
  }

  function playEnd(callback) {
    onDone = callback;
    activeScenes = endScenes;
    currentScene = 0;
    frame = 0;
    resize();
    textEl.textContent = activeScenes[0].text;
    textEl.style.opacity = '1';
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    textEl.textContent = '';
  }

  window.addEventListener('resize', resize);

  return { play, playEnd, stop };
})();