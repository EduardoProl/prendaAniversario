// ─── ÁUDIO PROCEDURAL (Web Audio API) ────
const Audio = (() => {
  let ctx = null;
  const MASTER = 0.09; // volume mestre baixo

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  // Nota suave com ataque e decay controlados
  function tone(freq, type, dur, vol = 1.0, delay = 0, detune = 0) {
    if (!ctx) return;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    // Filtro passa-baixo para suavizar o som
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1800;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    osc.detune.value = detune;
    const v = vol * MASTER;
    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(v, ctx.currentTime + delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + dur);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + dur + 0.02);
  }

  function jump() {
    init();
    // Slide suave para cima — tipo "boing" leve
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 1200;
    osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(MASTER * 0.8, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  }

  function doubleJump() {
    init();
    // Dois "boing" ascendentes com brilho
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 2000;
    osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(330, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(MASTER * 0.7, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
    // Faísca extra
    tone(880, 'sine', 0.1, 0.4, 0.1);
  }

  function coin() {
    init();
    // Dois pings cristalinos
    tone(1047, 'sine', 0.18, 0.9, 0);
    tone(1319, 'sine', 0.15, 0.7, 0.1);
  }

  function hurt() {
    init();
    // Golpe suave, não assustador
    tone(180, 'sine', 0.15, 0.8, 0);
    tone(120, 'sine', 0.2,  0.5, 0.08);
  }

  function death() {
    init();
    // Melodia descendente suave — triste mas não assustadora
    const notes = [392, 349, 330, 294, 261];
    notes.forEach((f, i) => {
      tone(f, 'triangle', 0.35, 0.5, i * 0.12);
    });
    // Eco final
    tone(196, 'sine', 0.5, 0.25, 0.65);
  }

  let lastLevelUp = 0;
  function levelUp() {
    init();
    const now = Date.now();
    if (now - lastLevelUp < 300) return; // debounce — evitar spam
    lastLevelUp = now;
    [523, 659, 784, 1047].forEach((f, i) =>
      tone(f, 'sine', 0.22, 0.8, i * 0.1)
    );
  }

  function win() {
    init();
    const melody = [523, 523, 523, 415, 523, 659, 784];
    melody.forEach((f, i) => tone(f, 'sine', 0.25, 0.75, i * 0.13));
  }

  function land() {
    init();
    // Batida suave no chão
    tone(110, 'sine', 0.08, 0.6, 0);
  }

  function click() {
    init();
    tone(660, 'sine', 0.08, 0.5, 0);
    tone(880, 'sine', 0.06, 0.3, 0.05);
  }

  // Música ambiente — acordes suaves com triângulos
  let musicLoop = null;
  let musicPlaying = false;

  function startMusic(mode = 'story') {
    if (!ctx) init();
    stopMusic();          // para qualquer loop anterior e incrementa musicGen
    musicPlaying = true;
    const myGen = musicGen; // este loop só toca enquanto for o gerador actual

    const storyChords = [
      [220, 261, 330], [196, 247, 311], [220, 261, 330], [174, 220, 277]
    ];
    const infiniteChords = [
      [185, 220, 277], [196, 247, 311], [185, 220, 277], [165, 208, 261]
    ];
    const chords = mode === 'infinite' ? infiniteChords : storyChords;

    let step = 0;
    let chord = 0;

    function tick() {
      if (!musicPlaying || musicGen !== myGen) return; // geração obsoleta — parar
      const c = chords[chord % chords.length];
      const freq = c[step % c.length];
      tone(freq, 'triangle', 0.4, 0.55);
      step++;
      if (step % c.length === 0) chord++;
      musicLoop = setTimeout(tick, mode === 'infinite' ? 220 : 260);
    }
    tick();
  }

  // Contador de geração — qualquer loop antigo verifica se ainda é o actual
  let musicGen = 0;

  function stopMusic() {
    musicPlaying = false;
    musicGen++;
    if (musicLoop) { clearTimeout(musicLoop); musicLoop = null; }
  }

  return { jump, doubleJump, coin, hurt, death, levelUp, win, land, click, startMusic, stopMusic, init };
})();
