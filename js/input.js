// ─── INPUT ───────────────────────────────
const Input = (() => {
  const keys = {};

  const keyMap = {
    'ArrowLeft': 'left',   'KeyA': 'left',
    'ArrowRight': 'right', 'KeyD': 'right',
    'ArrowUp': 'jump',     'KeyW': 'jump',
    'Space': 'jump',
    'Escape': 'pause',     'KeyP': 'pause',
  };

  document.addEventListener('keydown', e => {
    const action = keyMap[e.code];
    if (action) {
      e.preventDefault();
      if (!keys[action]) {
        keys[action] = true;
        keys[action + '_just'] = true;
      }
    }
  });

  document.addEventListener('keyup', e => {
    const action = keyMap[e.code];
    if (action) {
      keys[action] = false;
      keys[action + '_just'] = false;
    }
  });

  function press(action) {
    if (!keys[action]) {
      keys[action] = true;
      keys[action + '_just'] = true;
    }
  }

  function release(action) {
    keys[action] = false;
    keys[action + '_just'] = false;
  }

  function clearJust() {
    for (const k in keys) {
      if (k.endsWith('_just')) keys[k] = false;
    }
  }

  function isDown(action)  { return !!keys[action]; }
  function justPressed(action) {
    const v = !!keys[action + '_just'];
    keys[action + '_just'] = false;
    return v;
  }

  return { isDown, justPressed, clearJust, press, release };
})();
