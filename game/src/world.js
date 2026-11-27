// The world: level layout, stage flow, collisions and pickups. The farmyard
// (stage 1) runs into the kitchen (stage 2) and ends at the forest gate.
// All placement comes from a seed, so the same seed builds the same run.
import {
  CORN_SCORE, FEATHER_SCORE, GROUND_Y, LIVES, METER_PX, STAGE_LENGTH,
  TURKEY_HEIGHT, TURKEY_WIDTH, WORLD_LENGTH,
} from './config.js';
import { createTurkey } from './turkey.js';
import { createFarmer } from './farmer.js';
import { createKnife, createOven, updateKnife } from './hazards.js';
import { createRandom } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_ESCAPED = 'escaped';

export const EVENT_HIT = 1;
export const EVENT_CORN = 2;
export const EVENT_FEATHER = 4;
export const EVENT_OVER = 8;
export const EVENT_JUMP = 16;
export const EVENT_SPOTTED = 32;
export const EVENT_STUMBLED = 64;
export const EVENT_SEARCHING = 128;
export const EVENT_ESCAPED = 256;

export function createWorld(random) {
  const turkey = createTurkey();
  const farmer = createFarmer();

  const state = {
    screen: SCREEN_TITLE,
    stage: 1,
    bonus: 0,
    lives: LIVES,
    time: 0,
    camX: 0,
    shake: 0,
    banner: null,
    bannerTimer: 0,
    knifeTimer: 2.5,
    dustTimer: 0,
    endReason: null,
    finalScore: 0,
    fences: [],
    ovens: [],
    haystacks: [],
    corns: [],
    feathers: [],
    knives: [],
    particles: [],
  };

  function buildLevel() {
    state.fences = [];
    state.ovens = [];
    state.haystacks = [];
    state.corns = [];
    state.feathers = [];
    state.knives = [];
    state.particles = [];
    // Stage 1, the farmyard: fences to jump, haystacks to hide in, corn to grab.
    let x = 700;
    while (x < STAGE_LENGTH - 600) {
      state.fences.push({ x, width: 70, height: 64, tripped: false });
      // A corn arc over the fence rewards a well-timed jump.
      for (let i = -1; i <= 1; i += 1) {
        state.corns.push({ x: x + 35 + i * 46, y: GROUND_Y - 150 + Math.abs(i) * 34, taken: false });
      }
      x += random.range(720, 1120);
    }
    x = 1500;
    while (x < STAGE_LENGTH - 400) {
      state.haystacks.push({ x, width: 130 });
      x += random.range(1500, 2100);
    }
    // A couple of ovens already smoulder at the farmhouse door, late in stage 1.
    state.ovens.push(createOven(7300));
    state.ovens.push(createOven(8300));
    // Stage 2, the kitchen: ovens close together, knives from above, fewer hides.
    x = STAGE_LENGTH + 500;
    while (x < WORLD_LENGTH - 700) {
      state.ovens.push(createOven(x));
      if (random.next() < 0.6) {
        state.fences.push({ x: x + 420, width: 70, height: 64, tripped: false });
      }
      for (let i = 0; i < 3; i += 1) {
        state.corns.push({ x: x + 220 + i * 52, y: GROUND_Y - 60 - (i % 2) * 44, taken: false });
      }
      x += random.range(760, 1050);
    }
    x = STAGE_LENGTH + 1400;
    while (x < WORLD_LENGTH - 500) {
      state.haystacks.push({ x, width: 130 });
      x += random.range(1700, 2300);
    }
    // One golden feather per stage: a free dash and a big score bonus.
    state.feathers.push({ x: 4200, y: GROUND_Y - 170, taken: false });
    state.feathers.push({ x: STAGE_LENGTH + 3600, y: GROUND_Y - 170, taken: false });
    // Loose corn on the ground between obstacles, so the run always pays.
    for (let cx = 1000; cx < WORLD_LENGTH - 400; cx += random.range(380, 620)) {
      if (state.corns.some((c) => Math.abs(c.x - cx) < 90)) continue;
      state.corns.push({ x: cx, y: GROUND_Y - 52, taken: false });
    }
  }

  function reset() {
    buildLevel();
    turkey.reset();
    farmer.reset(-60);
    state.screen = SCREEN_PLAY;
    state.stage = 1;
    state.bonus = 0;
    state.lives = LIVES;
    state.time = 0;
    state.camX = 0;
    state.shake = 0;
    state.banner = 'STAGE 1 — THE FARMYARD';
    state.bannerTimer = 2.4;
    state.knifeTimer = 2.5;
    state.dustTimer = 0;
    state.endReason = null;
    state.finalScore = 0;
  }

  function distanceMeters() {
    return Math.max(0, Math.floor((turkey.turkey.x - 160) / METER_PX));
  }

  function score() {
    return distanceMeters() * 10 + state.bonus;
  }

  function addDust(x, y, count, color) {
    for (let i = 0; i < count; i += 1) {
      state.particles.push({
        x: x + random.range(-8, 8),
        y: y + random.range(-4, 2),
        vx: random.range(-40, 20),
        vy: random.range(-70, -10),
        life: random.range(0.3, 0.6),
        maxLife: 0.6,
        size: random.range(4, 9),
        color,
      });
    }
  }

  function loseLife(reason) {
    state.lives -= 1;
    turkey.turkey.invuln = 1.6;
    state.shake = 0.45;
    farmer.gloat(); // he stops to laugh — the hit does not auto-catch the turkey
    addDust(turkey.turkey.x + 30, GROUND_Y - 10, 10, '#a16207');
    if (state.lives <= 0) {
      state.screen = SCREEN_CAUGHT;
      state.endReason = reason;
      state.finalScore = score();
      return EVENT_OVER | EVENT_HIT;
    }
    return EVENT_HIT;
  }

  function nearHaystack() {
    const t = turkey.turkey;
    for (const hay of state.haystacks) {
      if (Math.abs(t.x + TURKEY_WIDTH / 2 - (hay.x + hay.width / 2)) < 90) return hay;
    }
    return null;
  }

  // One fixed step of the run. Returns an event bitmask for sounds and announcements.
  function step(dt, controls) {
    let events = 0;
    state.time += dt;
    if (state.bannerTimer > 0) state.bannerTimer -= dt;
    if (state.shake > 0) state.shake -= dt;

    const t = turkey.turkey;
    const hay = nearHaystack();
    const jumped = turkey.update(dt, controls, hay !== null);
    if (jumped) events |= EVENT_JUMP;

    // Running dust, kicked up behind the turkey's feet.
    state.dustTimer -= dt;
    if (t.onGround && !t.hidden && state.dustTimer <= 0) {
      addDust(t.x + 8, GROUND_Y - 4, 2, '#d6a86c');
      state.dustTimer = 0.14;
    }

    // The farmer's turn: chase, search, stumble, or catch.
    const farmerEvent = farmer.update(dt, t, t.hidden, hay ? hay.x : null, random);
    if (farmerEvent === 'caught') {
      state.screen = SCREEN_CAUGHT;
      state.endReason = 'grabbed';
      state.finalScore = score();
      return events | EVENT_OVER;
    }
    if (farmerEvent === 'stumbled') {
      events |= EVENT_STUMBLED;
      addDust(farmer.farmer.x, GROUND_Y - 6, 8, '#a16207');
    }
    if (farmerEvent === 'searching') events |= EVENT_SEARCHING;
    if (farmer.farmer.spotted && !state.spottedLatch) {
      events |= EVENT_SPOTTED;
      state.spottedLatch = true;
    }
    if (!farmer.farmer.spotted) state.spottedLatch = false;
    t.lookBack = farmer.farmer.spotted;

    // Falling knives: they start in the kitchen, and a few drop late in stage 1.
    state.knifeTimer -= dt;
    const knifeZone = state.stage === 2 || t.x > STAGE_LENGTH - 1400;
    if (knifeZone && state.knifeTimer <= 0) {
      const delay = random.range(0.15, 0.5);
      state.knives.push(createKnife(t.x + random.range(60, 520), delay));
      state.knifeTimer = random.range(1.3, 2.1);
    }
    for (const knife of state.knives) updateKnife(knife, dt);
    state.knives = state.knives.filter((k) => !k.gone);

    if (t.invuln <= 0) {
      // Fences: clear them with a jump, or trip and lose a life.
      for (const fence of state.fences) {
        const overlapX = t.x + TURKEY_WIDTH - 14 > fence.x && t.x + 14 < fence.x + fence.width;
        const feet = t.y + TURKEY_HEIGHT;
        if (overlapX && feet > GROUND_Y - fence.height && !fence.tripped) {
          if (feet < GROUND_Y - fence.height + 16) continue; // cleared it
          fence.tripped = true;
          t.x = Math.max(40, t.x - 70);
          farmer.farmer.x += 110;
          events |= loseLife('fence');
          break;
        }
        if (fence.tripped && t.x > fence.x + fence.width + 60) fence.tripped = false;
      }
      // Ovens: jumping clean over is the only safe way past.
      if (state.screen === SCREEN_PLAY) {
        for (const oven of state.ovens) {
          const overlapX = t.x + TURKEY_WIDTH - 12 > oven.x && t.x + 12 < oven.x + oven.width;
          const feet = t.y + TURKEY_HEIGHT;
          if (overlapX && feet > GROUND_Y - oven.height + 26) {
            t.vy = -520;
            t.y -= 6;
            t.onGround = false;
            t.x = Math.max(40, t.x - 50);
            farmer.farmer.x += 90;
            events |= loseLife('oven');
            break;
          }
        }
      }
      // Knives: a falling blade that touches the turkey costs a life.
      if (state.screen === SCREEN_PLAY) {
        for (const knife of state.knives) {
          if (knife.stuck > 0 || knife.delay > 0) continue;
          const overlapX = t.x + TURKEY_WIDTH - 10 > knife.x - 10 && t.x + 10 < knife.x + 10;
          const overlapY = t.y < knife.y + 10 && t.y + TURKEY_HEIGHT > knife.y - 58;
          if (overlapX && overlapY) {
            knife.gone = true;
            t.vy = -420;
            t.onGround = false;
            events |= loseLife('knife');
            break;
          }
        }
      }
    }

    // Pickups: corn for score, golden feathers for a free dash and a bonus.
    for (const corn of state.corns) {
      if (corn.taken) continue;
      if (Math.abs(t.x + TURKEY_WIDTH / 2 - corn.x) < 44 && Math.abs(t.y + 30 - corn.y) < 48) {
        corn.taken = true;
        state.bonus += CORN_SCORE;
        events |= EVENT_CORN;
        addDust(corn.x, corn.y, 5, '#facc15');
      }
    }
    for (const feather of state.feathers) {
      if (feather.taken) continue;
      if (Math.abs(t.x + TURKEY_WIDTH / 2 - feather.x) < 46 && Math.abs(t.y + 30 - feather.y) < 52) {
        feather.taken = true;
        state.bonus += FEATHER_SCORE;
        t.dashBoost = 3;
        t.stamina = 100;
        events |= EVENT_FEATHER;
        addDust(feather.x, feather.y, 8, '#fbbf24');
      }
    }

    // Stage flow: the farmyard becomes the kitchen, then the forest gate.
    if (state.stage === 1 && t.x >= STAGE_LENGTH) {
      state.stage = 2;
      state.banner = 'STAGE 2 — THE KITCHEN!';
      state.bannerTimer = 2.6;
    }
    if (t.x >= WORLD_LENGTH) {
      state.screen = SCREEN_ESCAPED;
      state.endReason = 'gate';
      state.finalScore = score();
      return events | EVENT_OVER | EVENT_ESCAPED;
    }

    // Particles fade.
    for (const p of state.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 300 * dt;
      p.life -= dt;
    }
    state.particles = state.particles.filter((p) => p.life > 0);

    // The camera trails the turkey, never scrolling back.
    state.camX = Math.max(state.camX, t.x - 380);
    return events;
  }

  function drawEntities(ctx, time) {
    const camX = state.camX;
    // The forest gate at the end of the world: the way out.
    const gateX = WORLD_LENGTH - camX;
    if (gateX > -200 && gateX < 1500) {
      ctx.fillStyle = '#166534';
      ctx.fillRect(gateX - 10, GROUND_Y - 190, 16, 190);
      ctx.fillRect(gateX + 130, GROUND_Y - 190, 16, 190);
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(gateX + 68, GROUND_Y - 190, 84, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#fef3c7';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('FOREST', gateX + 68, GROUND_Y - 210);
      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('FREEDOM!', gateX + 68, GROUND_Y - 186);
    }
    // Haystacks: the turkey's hiding places.
    for (const hay of state.haystacks) {
      const sx = hay.x - camX;
      if (sx < -180 || sx > 1400) continue;
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.moveTo(sx, GROUND_Y);
      ctx.quadraticCurveTo(sx + 20, GROUND_Y - 86, sx + hay.width / 2, GROUND_Y - 92);
      ctx.quadraticCurveTo(sx + hay.width - 20, GROUND_Y - 86, sx + hay.width, GROUND_Y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i += 1) {
        ctx.beginPath();
        ctx.moveTo(sx + 14 + i * 22, GROUND_Y - 8);
        ctx.quadraticCurveTo(sx + 18 + i * 22, GROUND_Y - 52, sx + 24 + i * 20, GROUND_Y - 78);
        ctx.stroke();
      }
      ctx.fillStyle = '#451a03';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HIDE — HOLD DOWN', sx + hay.width / 2, GROUND_Y - 100);
    }
    // Fences.
    for (const fence of state.fences) {
      const sx = fence.x - camX;
      if (sx < -120 || sx > 1400) continue;
      ctx.fillStyle = '#78350f';
      ctx.fillRect(sx, GROUND_Y - fence.height, 8, fence.height);
      ctx.fillRect(sx + fence.width - 8, GROUND_Y - fence.height, 8, fence.height);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(sx - 4, GROUND_Y - fence.height + 6, fence.width + 8, 10);
      ctx.fillRect(sx - 4, GROUND_Y - 34, fence.width + 8, 10);
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.moveTo(sx + 4, GROUND_Y - fence.height + 6);
      ctx.lineTo(sx + 14, GROUND_Y - fence.height - 8);
      ctx.lineTo(sx + 24, GROUND_Y - fence.height + 6);
      ctx.closePath();
      ctx.fill();
    }
    // Corn cobs, bobbing gently.
    for (const corn of state.corns) {
      if (corn.taken) continue;
      const sx = corn.x - camX;
      if (sx < -60 || sx > 1340) continue;
      const bob = Math.sin(time * 3 + corn.x) * 4;
      ctx.save();
      ctx.translate(sx, corn.y + bob);
      ctx.rotate(-0.35);
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#eab308';
      for (let r = -1; r <= 1; r += 1) {
        ctx.fillRect(-8, r * 10, 16, 2);
      }
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.ellipse(-10, -14, 6, 12, 0.5, 0, Math.PI * 2);
      ctx.ellipse(10, -14, 6, 12, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Golden feathers.
    for (const feather of state.feathers) {
      if (feather.taken) continue;
      const sx = feather.x - camX;
      if (sx < -60 || sx > 1340) continue;
      const bob = Math.sin(time * 4 + feather.x) * 6;
      const glow = 0.5 + Math.sin(time * 5) * 0.3;
      ctx.save();
      ctx.translate(sx, feather.y + bob);
      ctx.fillStyle = `rgba(251,191,36,${glow})`;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 18, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff7ed';
      ctx.beginPath();
      ctx.ellipse(0, -4, 3, 8, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Particles: dust and sparkles.
    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x - camX, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  return {
    state, turkey, farmer, reset, step, score, distanceMeters, drawEntities,
    // Test and screenshot staging hooks: the live game never calls these.
    _setState(patch) {
      Object.assign(state, patch);
    },
  };
}
