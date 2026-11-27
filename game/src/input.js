// Keyboard and mouse input. The game reads held keys every frame and one-shot
// actions (jump, confirm, pause) are consumed once, so a held key never double-fires.
export const ACTION_JUMP = 1;
export const ACTION_CONFIRM = 2;
export const ACTION_PAUSE = 4;
export const ACTION_MUTE = 8;

const JUMP_KEYS = new Set(['Space', 'ArrowUp', 'KeyW']);
const HIDE_KEYS = new Set(['ArrowDown', 'KeyS']);
const LEFT_KEYS = new Set(['ArrowLeft', 'KeyA']);
const RIGHT_KEYS = new Set(['ArrowRight', 'KeyD']);
const DASH_KEYS = new Set(['ShiftLeft', 'ShiftRight']);
const CONFIRM_KEYS = new Set(['Space', 'Enter']);
const PAUSE_KEYS = new Set(['KeyP', 'Escape']);

export function createInput(canvas) {
  const held = new Set();
  let queued = 0;
  let mouseJump = false;

  function onKeyDown(event) {
    if (JUMP_KEYS.has(event.code) || CONFIRM_KEYS.has(event.code)) {
      if (!event.repeat) queued |= ACTION_JUMP | ACTION_CONFIRM;
      event.preventDefault();
    }
    if (PAUSE_KEYS.has(event.code) && !event.repeat) queued |= ACTION_PAUSE;
    if (event.code === 'KeyM' && !event.repeat) queued |= ACTION_MUTE;
    held.add(event.code);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
  }
  function onKeyUp(event) {
    held.delete(event.code);
  }
  function onMouseDown(event) {
    // A click confirms on menus and jumps mid-run: the whole game is mouse-playable.
    queued |= ACTION_CONFIRM;
    mouseJump = true;
    event.preventDefault();
  }
  function onBlur() {
    held.clear();
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('mousedown', onMouseDown);

  function isHeld(keys) {
    for (const code of keys) if (held.has(code)) return true;
    return false;
  }

  return {
    // -1 left, 0 none, 1 right: how hard the player is steering the run.
    steer() {
      const left = isHeld(LEFT_KEYS) ? 1 : 0;
      const right = isHeld(RIGHT_KEYS) ? 1 : 0;
      return right - left;
    },
    dashHeld() {
      return isHeld(DASH_KEYS);
    },
    hideHeld() {
      return isHeld(HIDE_KEYS);
    },
    // One-shot actions since the last call; the mouse jump is folded into ACTION_JUMP.
    takeActions() {
      const actions = queued | (mouseJump ? ACTION_JUMP : 0);
      queued = 0;
      mouseJump = false;
      return actions;
    },
  };
}
