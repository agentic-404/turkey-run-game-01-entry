// Staged scenes for screenshots: each one runs the real game simulation from a
// chosen starting state and leaves a lively frame behind. Nothing here draws
// anything itself — the renderer paints the staged world exactly as it paints play.
import { STAGE_LENGTH, STEP, WORLD_LENGTH } from './config.js';
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

function placeFarmerClose(world, gap) {
  const t = world.turkey.turkey;
  world.farmer.farmer.x = t.x - gap;
  world.farmer.farmer.mode = 'chase';
  world.farmer.farmer.spotted = true;
}

export function stageShot(name, world) {
  world.reset();
  const t = world.turkey.turkey;

  if (name === 'title') {
    world.state.screen = SCREEN_TITLE;
    return { screen: SCREEN_TITLE, best: 0 };
  }

  if (name === 'play') {
    // Late farmyard: the first oven is ahead, knives have started to fall,
    // fences and corn fill the frame, the farmer is right on the turkey's tail.
    t.x = 7450;
    world.farmer.farmer.x = 7240;
    world.state.camX = t.x - 380;
    world.state.knifeTimer = 0.2; // a knife is already falling when the frame is taken
    runAutopilot(world, 170);
    placeFarmerClose(world, 215);
    // Frame the shot: shift the camera until the parallax barn is clear of the
    // farmer, the turkey stays left of centre, and the oven stays in frame.
    const ovenX = 8300;
    for (const d of [0, -80, 80, -160, 160, -240, 240, -320, 320, -360, 360, -400, 400]) {
      const camX = t.x - 380 + d;
      const barnX = 880 - (((camX * 0.5) % 1600) + 1600) % 1600;
      const farmerSX = t.x - 215 - camX;
      const turkeySX = t.x - camX;
      const ovenSX = ovenX - camX;
      const barnClear = barnX + 162 < farmerSX - 20 || barnX > farmerSX + 70;
      if (barnClear && turkeySX >= 200 && turkeySX <= 760 && ovenSX >= 150 && ovenSX <= 1250) {
        world.state.camX = camX;
        break;
      }
    }
    world.state.banner = null;
    world.state.bannerTimer = 0;
    return { screen: SCREEN_PLAY, best: 0 };
  }

  if (name === 'kitchen') {
    // Deep in the kitchen: ovens close together, knives falling, a haystack to hide in.
    t.x = STAGE_LENGTH + 4200;
    world.farmer.farmer.x = t.x - 260;
    world.state.stage = 2;
    world.state.camX = t.x - 380;
    world.state.knifeTimer = 0.2; // knives are already falling in the kitchen
    runAutopilot(world, 120);
    // Drop one more knife just ahead of the turkey so a blade is visibly falling
    // in the frame, then let the autopilot run under it.
    world.state.knives.push(createKnife(t.x + 300, 0));
    runAutopilot(world, 28);
    placeFarmerClose(world, 235);
    world.state.banner = 'STAGE 2 — THE KITCHEN!';
    world.state.bannerTimer = 1.8;
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
