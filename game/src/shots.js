// Staged scenes for screenshots: each one runs the real game simulation from a
// chosen starting state and leaves a lively frame behind. Nothing here draws
// anything itself — the renderer paints the staged world exactly as it paints play.
import { STAGE_LENGTH, STEP, WORLD_LENGTH, GROUND_Y, TURKEY_HEIGHT } from './config.js';
import { FARMER_LUNGE, FARMER_SEARCH } from './farmer.js';
import { createKnife } from './hazards.js';
import { SCREEN_CAUGHT, SCREEN_ESCAPED, SCREEN_PLAY, SCREEN_TITLE } from './world.js';

// A simple autopilot: push right, jump fences and ovens in time, and slow down
// to let a falling knife land ahead instead of running under it.
function autopilotControls(world) {
  const t = world.turkey.turkey;
  let jump = false;
  let steer = 1;
  if (t.onGround) {
    for (const fence of world.state.fences) {
      if (fence.x > t.x && fence.x - t.x < 190) jump = true;
    }
    for (const oven of world.state.ovens) {
      if (oven.x > t.x && oven.x - t.x < 150) jump = true;
    }
  }
  for (const knife of world.state.knives) {
    if (!knife.gone && knife.delay <= 0 && knife.stuck <= 0
      && knife.x > t.x && knife.x - t.x < 260) steer = -1;
  }
  return { jump, steer, dash: false, hide: false };
}

function runAutopilot(world, steps) {
  for (let i = 0; i < steps; i += 1) {
    if (world.state.screen !== SCREEN_PLAY) break;
    world.step(STEP, autopilotControls(world));
  }
}

export function stageShot(name, world) {
  world.reset();
  const t = world.turkey.turkey;

  if (name === 'title') {
    world.state.screen = SCREEN_TITLE;
    return { screen: SCREEN_TITLE, best: 0 };
  }

  if (name === 'play') {
    // Late farmyard: run the autopilot up to the first oven so the world is
    // lived-in (corn collected, knives already falling), then freeze the frame
    // at the near-caught beat — the turkey at the top of its jump over the lit
    // oven, the farmer lunging a single stride behind it.
    t.x = 7450;
    world.farmer.farmer.x = 7240;
    world.state.camX = t.x - 380;
    world.state.knifeTimer = 0.2; // a knife is already falling when the frame is taken
    runAutopilot(world, 170);
    // Pose the near-caught moment by hand: turkey centred over the oven at
    // mid-jump, head turned back in panic; farmer one stride behind, leaning
    // into the lunge with the pitchfork reaching forward.
    const oven = world.state.ovens.find((o) => o.x === 8300) ?? world.state.ovens[0];
    t.x = oven.x + oven.width / 2 - 32;
    t.y = GROUND_Y - TURKEY_HEIGHT - 140;
    t.onGround = false;
    t.vy = 0;
    t.lookBack = true;
    t.invuln = 0;
    const farmer = world.farmer.farmer;
    farmer.x = t.x - 70;
    farmer.mode = FARMER_LUNGE;
    farmer.lean = 1;
    farmer.runPhase = Math.PI / 2; // legs at their widest split
    farmer.spotted = true;
    // A knife already falling just ahead of the turkey, low enough to read
    // mid-frame, shadow and "!" on the ground below it, and a corn arc over
    // the jump.
    const knife = createKnife(t.x + 240, 0);
    knife.y = 330;
    world.state.knives.push(knife);
    for (const [dx, dy] of [[-45, -230], [0, -262], [45, -230]]) {
      world.state.corns.push({
        x: oven.x + oven.width / 2 + dx,
        y: GROUND_Y + dy,
        taken: false,
      });
    }
    // Frame it low: ground and actors fill the bottom half, the barn stays
    // clear of the farmer, the oven stays fully in frame.
    for (const d of [0, -60, 60, -120, 120, -180, 180, -240, 240]) {
      const camX = t.x - 480 + d;
      const barnX = 880 - (((camX * 0.5) % 1600) + 1600) % 1600;
      const farmerSX = farmer.x - camX;
      const turkeySX = t.x - camX;
      const ovenSX = oven.x - camX;
      const knifeSX = knife.x - camX;
      const barnClear = barnX + 162 < farmerSX - 20 || barnX > farmerSX + 70;
      if (barnClear && turkeySX >= 380 && turkeySX <= 620
        && ovenSX >= 120 && ovenSX + oven.width <= 1250
        && knifeSX >= 150 && knifeSX <= 1250) {
        world.state.camX = camX;
        break;
      }
    }
    world.state.banner = null;
    world.state.bannerTimer = 0;
    return { screen: SCREEN_PLAY, best: 0 };
  }

  if (name === 'kitchen') {
    // The hide beat: the turkey is inside a stage-2 haystack with only its
    // tail feathers showing, and the farmer is right there sniffing the same
    // haystack, "?" over his head. No giant banner — the HUD top bar already
    // names the stage, so the frame stays about the hiding.
    // Pick a haystack that has a lit oven a short run to its right, so the
    // frame holds the hide, the search, the knife and the oven at once.
    const stageHay = world.state.haystacks.filter((h) => h.x > STAGE_LENGTH);
    const stageOvens = world.state.ovens.filter((o) => o.x > STAGE_LENGTH);
    let hay = stageHay[0];
    let oven = stageOvens[0];
    for (const h of stageHay) {
      const nearOven = stageOvens.find((o) => o.x - h.x > 350 && o.x - h.x < 750);
      if (nearOven) { hay = h; oven = nearOven; break; }
    }
    world.state.stage = 2;
    t.x = hay.x + hay.width / 2 - 32;
    t.y = GROUND_Y - TURKEY_HEIGHT;
    t.onGround = true;
    t.hidden = true;
    t.hideTimer = 4;
    t.lookBack = false;
    const farmer = world.farmer.farmer;
    // Far enough left to stand clear of the oven behind him, so the "?" sits
    // over the pale tiled wall instead of the dark oven.
    farmer.x = hay.x - 170;
    farmer.mode = FARMER_SEARCH;
    farmer.searchX = hay.x;
    farmer.modeTimer = 2.5;
    farmer.runPhase = 0.8;
    farmer.spotted = false;
    // A knife already falling just past the haystack, low enough to read.
    const knife = createKnife(hay.x + 380, 0);
    knife.y = 330;
    world.state.knives.push(knife);
    // Frame the haystack left of centre with the farmer on its doorstep and
    // the oven fully in frame on the right — never cut at the edge.
    world.state.camX = Math.min(
      Math.max(oven.x - 1110, hay.x - 430),
      hay.x - 330,
    );
    world.state.banner = null;
    world.state.bannerTimer = 0;
    return { screen: SCREEN_PLAY, best: 0 };
  }

  if (name === 'escaped') {
    // A short sprint from just before the forest gate, autopilot-flown to the end.
    t.x = WORLD_LENGTH - 700;
    world.farmer.farmer.x = t.x - 400;
    world.state.stage = 2;
    world.state.camX = t.x - 380;
    runAutopilot(world, 400);
    if (world.state.screen !== SCREEN_ESCAPED) {
      // The autopilot should have made it; if it did not, say so in the state.
      world.state.screen = SCREEN_ESCAPED;
      world.state.endReason = 'gate';
      world.state.finalScore = world.score();
    }
    return { screen: SCREEN_ESCAPED, best: 0 };
  }

  if (name === 'caught') {
    // The farmer starts on top of the turkey: one real step ends the run.
    world.farmer.farmer.x = t.x - 30;
    t.invuln = 0;
    world.step(STEP, { jump: false, steer: 0, dash: false, hide: false });
    if (world.state.screen !== SCREEN_CAUGHT) {
      world.state.screen = SCREEN_CAUGHT;
      world.state.endReason = 'grabbed';
      world.state.finalScore = world.score();
    }
    return { screen: SCREEN_CAUGHT, best: 0 };
  }

  return { screen: SCREEN_TITLE, best: 0 };
}
