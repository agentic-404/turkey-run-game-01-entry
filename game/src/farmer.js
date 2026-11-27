// The farmer: the chaser. He runs after the turkey, searches haystacks when he
// loses the trail, corners a turkey that dawdles at the screen's edge, and trips
// over his own feet often enough to keep a narrow escape fair.
import {
  FARMER_CHASE_BONUS, FARMER_LUNGE_BONUS, FARMER_SEARCH_TIME, GROUND_Y,
  TURKEY_RUN_SPEED,
} from './config.js';

export const FARMER_CHASE = 'chase';
export const FARMER_SEARCH = 'search';
export const FARMER_STUMBLE = 'stumble';
export const FARMER_GLOAT = 'gloat';

export function createFarmer() {
  const farmer = {
    x: -40,
    y: GROUND_Y - 96,
    mode: FARMER_CHASE,
    modeTimer: 0,
    stumbleTimer: 8, // seconds until the next comic trip
    runPhase: 0,
    speed: 0,
    searchX: 0, // the haystack he is sniffing around
    spotted: false, // true while close enough to flash the SPOTTED banner
  };

  function reset(startX) {
    farmer.x = startX;
    farmer.y = GROUND_Y - 96;
    farmer.mode = FARMER_CHASE;
    farmer.modeTimer = 0;
    farmer.stumbleTimer = 8;
    farmer.runPhase = 0;
    farmer.speed = 0;
    farmer.searchX = 0;
    farmer.spotted = false;
  }

  // Returns 'caught' when the farmer grabs the turkey, otherwise null.
  // turkeyHidden / haystackX let him lose the trail and start searching.
  function update(dt, turkey, turkeyHidden, haystackX, random) {
    const gap = turkey.x - farmer.x;
    farmer.spotted = gap < 230 && gap > 0 && !turkeyHidden;

    if (farmer.mode === FARMER_STUMBLE) {
      farmer.modeTimer -= dt;
      farmer.speed = 0;
      if (farmer.modeTimer <= 0) farmer.mode = FARMER_CHASE;
      return null;
    }

    // Gloating: after the turkey is hit, the farmer stops to laugh for a beat
    // instead of running it down — a narrow escape stays fair, and it is funny.
    if (farmer.mode === FARMER_GLOAT) {
      farmer.modeTimer -= dt;
      farmer.speed = 0;
      if (farmer.modeTimer <= 0) farmer.mode = FARMER_CHASE;
      return null;
    }

    if (farmer.mode === FARMER_SEARCH) {
      farmer.modeTimer -= dt;
      // He paces back and forth in front of the haystack, sniffing.
      const pace = Math.sin(farmer.modeTimer * 3) * 60;
      farmer.x += (farmer.searchX + pace - farmer.x) * Math.min(1, dt * 3);
      farmer.runPhase += dt * 6;
      if (farmer.modeTimer <= 0) {
        farmer.mode = FARMER_CHASE;
        // The search cost him ground: he resumes from behind the turkey.
        if (farmer.x > turkey.x - 120) farmer.x = turkey.x - 320;
      }
      return null;
    }

    // Chase: he runs a touch faster than the turkey, and lunges when the turkey
    // is almost cornered against the right edge of the screen.
    let speed = TURKEY_RUN_SPEED + FARMER_CHASE_BONUS;
    if (gap < 170) speed += FARMER_LUNGE_BONUS;
    if (turkeyHidden) speed = TURKEY_RUN_SPEED * 0.55;
    farmer.speed = speed;
    farmer.x += speed * dt;
    farmer.runPhase += dt * speed * 0.05;

    // Comic trip: every 8-14 seconds he goes down in a puff of dust.
    farmer.stumbleTimer -= dt;
    if (farmer.stumbleTimer <= 0) {
      farmer.mode = FARMER_STUMBLE;
      farmer.modeTimer = 0.9;
      farmer.stumbleTimer = random.range(8, 14);
      return 'stumbled';
    }

    // Losing the trail: the turkey vanished into a haystack right in front of him.
    if (turkeyHidden && haystackX !== null && Math.abs(farmer.x - haystackX) < 190) {
      farmer.mode = FARMER_SEARCH;
      farmer.modeTimer = FARMER_SEARCH_TIME;
      farmer.searchX = haystackX;
      return 'searching';
    }

    // A turkey that was just hit is blinking and untouchable: the catch waits.
    if (!turkeyHidden && turkey.invuln <= 0 && gap < 40 && turkey.onGround) return 'caught';
    return null;
  }

  // Called when the turkey loses a life: the farmer gloats instead of pressing
  // the attack, which is what makes a hit survivable.
  function gloat() {
    if (farmer.mode === FARMER_CHASE) {
      farmer.mode = FARMER_GLOAT;
      farmer.modeTimer = 0.9;
    }
  }

  function draw(ctx, screenX, time) {
    ctx.save();
    ctx.translate(screenX, GROUND_Y - 96);

    if (farmer.mode === FARMER_STUMBLE) {
      // Face-down in the dirt, hat off, stars circling: comic timing.
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.ellipse(0, 88, 34, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(-34, 66, 68, 22);
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(-46, 78, 18, 6, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde047';
      for (let i = 0; i < 3; i += 1) {
        const a = time * 4 + (i * Math.PI * 2) / 3;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 22, 44 + Math.sin(a) * 8, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#111';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('OOF!', 0, 20);
      ctx.restore();
      return;
    }

    const legSwing = Math.sin(farmer.runPhase) * 12;
    // Legs: blue overalls, boots pumping.
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-8, 62);
    ctx.lineTo(-8 + legSwing, 92);
    ctx.moveTo(8, 62);
    ctx.lineTo(8 - legSwing, 92);
    ctx.stroke();
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.ellipse(-8 + legSwing, 94, 9, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(8 - legSwing, 94, 9, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body: red shirt under blue overalls, arms swinging, pitchfork in hand.
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(-20, 22, 40, 44);
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(-20, 40, 40, 26);
    ctx.strokeStyle = '#7c2d12';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(18, 30);
    ctx.lineTo(34, -14);
    ctx.stroke();
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(34, -14);
    ctx.lineTo(28, -30);
    ctx.moveTo(34, -14);
    ctx.lineTo(34, -32);
    ctx.moveTo(34, -14);
    ctx.lineTo(40, -30);
    ctx.stroke();

    // Head: beard, moustache, straw hat bouncing with the run.
    ctx.fillStyle = '#fcd9b8';
    ctx.beginPath();
    ctx.arc(0, 8, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e5e7eb';
    ctx.beginPath();
    ctx.ellipse(0, 18, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-10, 2, 20, 4);
    const hatBob = Math.sin(farmer.runPhase * 2) * 2;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.ellipse(0, -4 + hatBob, 24, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -10 + hatBob, 13, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -6 + hatBob, 13, 4, 0, 0, Math.PI * 2);
    ctx.stroke();

    if (farmer.mode === FARMER_SEARCH) {
      ctx.fillStyle = '#111';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', 26, -24);
    }
    if (farmer.mode === FARMER_GLOAT) {
      ctx.fillStyle = '#111';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HA!', 30, -24);
    }
    ctx.restore();
  }

  return { farmer, reset, update, draw, gloat };
}
