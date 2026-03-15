// ─── UI / NAVEGAÇÃO ──────────────────────
const UI = (() => {
  function showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(`screen-${name}`);
    if (el) el.classList.add('active');
  }

  function goMenu() {
    showScreen('menu');
    Audio.stopMusic();
  }

  function showControls() {
    showScreen('controls');
  }

  function showEnd(score, seconds) {
    document.getElementById('finalScore').textContent = score;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    document.getElementById('finalTime').textContent = `${m}:${s.toString().padStart(2,'0')}`;

    // Escolher emoji com base no tempo
    const emoji = seconds < 900 ? '🏆' : seconds < 1200 ? '🎉' : '🏠';
    document.getElementById('endEmoji').textContent = emoji;

    const title = seconds < 900 ? 'Incrível! Chegaste a Casa!' : 'Chegaste a Casa!';
    const msg   = seconds < 600
      ? 'O Afonso é um herói! Chegou a casa em tempo recorde!' 
      : 'O Afonso está a salvo com a família!';

    document.getElementById('endTitle').textContent = title;
    document.getElementById('endMsg').textContent   = msg;

    showScreen('end');
  }

  // Inicialização
  function init() {
    showScreen('menu');
    Network.connect();

    // Adicionar efeito sonoro nos botões
    document.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('click', () => Audio.click());
    });
  }

  function showAbout() {
    showScreen('about');
  }

  function confirmInfinite() {
    document.getElementById('infiniteModal').style.display = 'flex';
  }

  return { showScreen, goMenu, showControls, showAbout, confirmInfinite, showEnd, init };
})();

// ── ARRANQUE ──
window.addEventListener('load', () => {
  UI.init();
});

window.addEventListener('resize', () => {
  // handled inside loop
});
