// Boot and the one loop: input is read every frame, the world advances in fixed
// 1/60 s steps, and the renderer paints what is there. The game moves between
// five screens: title, play, paused, caught and escaped.
//
// ?seed=N fixes the level layout. ?shot=title|play|kitchen|escaped|caught stages
// that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import {
  createWorld, EVENT_CORN, EVENT_ESCAPED, EVENT_FEATHER, EVENT_HIT, EVENT_JUMP,
  EVENT_OVER, EVENT_SEARCHING, EVENT_SPOTTED, EVENT_STUMBLED,
  SCREEN_CAUGHT, SCREEN_ESCAPED, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE,
} from './world.js';
import {
  ACTION_CONFIRM, ACTION_JUMP, ACTION_MUTE, ACTION_PAUSE, createInput,
} from './input.js';
import { createRenderer } from './render.js';
import { createSound } from './sound.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const sound = createSound();

// Any uncaught error is recorded where a play-test can see it.
window.addEventListener('error', (event) => {
  window.__gameError = String(event.message || event.error || 'unknown error');
});

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

// Test and play-test hooks: the live game never calls these, and they change no
// rules — they only move the turkey or the farmer so a test can reach an end screen.
window.__turkeyGame = {
  world,
  screen: () => world.state.screen,
  score: () => world.score(),
  distance: () => world.distanceMeters(),
  lives: () => world.state.lives,
  stage: () => world.state.stage,
  debugWarpToGate() {
    world.turkey.turkey.x = 18000 - 700;
    world.state.stage = 2;
    world.state.camX = world.turkey.turkey.x - 380;
  },
  debugSummonFarmer() {
    world.farmer.farmer.x = world.turkey.turkey.x - 30;
    world.farmer.farmer.mode = 'chase';
    world.turkey.turkey.invuln = 0;
  },
};

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world, scene.screen, scene.best, world.state.time);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let jumpQueued = false;
  world.reset();
  world.state.screen = SCREEN_TITLE;
  // The play-test handle reads the UI screen too: pause lives here, not in the world.
  window.__turkeyGame.uiScreen = () => screen;

  // Screen readers (and anyone watching the page's text) hear the screen changes and each hit.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    sound.unlock();
    world.reset();
    screen = SCREEN_PLAY;
    jumpQueued = false;
    announce('Playing. Run from the farmer, jump the fences and ovens, dodge the knives.');
  }

  function endGame(escaped) {
    screen = escaped ? SCREEN_ESCAPED : SCREEN_CAUGHT;
    if (world.state.finalScore > best) {
      best = world.state.finalScore;
      saveBest(best);
    }
    announce(escaped
      ? `Escaped! Score ${world.state.finalScore}. Best ${best}.`
      : `Caught. Score ${world.state.finalScore}. Best ${best}.`);
  }

  function handleEvents(events) {
    if (events & EVENT_JUMP) sound.jump();
    if (events & EVENT_CORN) sound.corn();
    if (events & EVENT_FEATHER) sound.feather();
    if (events & EVENT_HIT) {
      sound.hit();
      announce(world.state.lives === 1 ? 'Hit. 1 life left.' : `Hit. ${world.state.lives} lives left.`);
    }
    if (events & EVENT_SPOTTED) {
      sound.spotted();
      announce('Spotted! The farmer is close — run!');
    }
    if (events & EVENT_STUMBLED) {
      sound.stumble();
      announce('The farmer tripped! Now is your chance.');
    }
    if (events & EVENT_SEARCHING) {
      sound.gobble();
      announce('The farmer lost your trail and is searching the haystack.');
    }
    if (events & EVENT_OVER) {
      if (events & EVENT_ESCAPED) sound.escapeFanfare();
      else sound.caughtSting();
      endGame(Boolean(events & EVENT_ESCAPED));
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const muted = sound.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
    if (actions & ACTION_JUMP) jumpQueued = true;
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_CAUGHT || screen === SCREEN_ESCAPED)) {
      startGame();
    } else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
  }

  function step() {
    if (screen === SCREEN_TITLE) {
      world.state.time += STEP;
      world.turkey.turkey.runPhase += STEP * 8;
      world.farmer.farmer.runPhase += STEP * 8;
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    const controls = {
      jump: jumpQueued,
      steer: input.steer(),
      dash: input.dashHeld(),
      hide: input.hideHeld(),
    };
    jumpQueued = false;
    handleEvents(world.step(STEP, controls));
    if (world.state.screen === SCREEN_CAUGHT || world.state.screen === SCREEN_ESCAPED) {
      screen = world.state.screen;
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    while (accumulator >= STEP) {
      step();
      accumulator -= STEP;
      if (screen !== SCREEN_TITLE && screen !== SCREEN_PLAY) {
        accumulator = 0;
        break;
      }
    }
    renderer.draw(world, screen, best, now / 1000);
  }

  // Leaving the tab pauses a running game rather than letting knives fall unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Gobble Dash. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
