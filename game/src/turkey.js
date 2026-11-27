// The turkey: the player. It auto-runs to the right, and the player steers it,
// jumps it, dashes it and hides it. Drawing is all canvas vector art, autumn palette.
import {
  GRAVITY, GROUND_Y, STAMINA_MAX, STAMINA_DRAIN, STAMINA_REGEN,
  TURKEY_BACK_SPEED, TURKEY_DASH_MULT, TURKEY_HEIGHT, TURKEY_JUMP_SPEED,
  TURKEY_PUSH_SPEED, TURKEY_RUN_SPEED, TURKEY_WIDTH,
} from './config.js';

export function createTurkey() {
  const turkey = {
    x: 160,
    y: GROUND_Y - TURKEY_HEIGHT,
    vy: 0,
    onGround: true,
    hidden: false,
    hideTimer: 0,
    dashing: false,
    dashBoost: 0, // seconds of free golden-feather speed left
    stamina: STAMINA_MAX,
    invuln: 0, // seconds of post-hit blinking
    runPhase: 0, // leg animation clock
    lookBack: false, // head turned in panic when the farmer is close
    speed: TURKEY_RUN_SPEED,
  };

  function reset() {
    turkey.x = 160;
    turkey.y = GROUND_Y - TURKEY_HEIGHT;
    turkey.vy = 0;
    turkey.onGround = true;
    turkey.hidden = false;
    turkey.hideTimer = 0;
    turkey.dashing = false;
    turkey.dashBoost = 0;
    turkey.stamina = STAMINA_MAX;
    turkey.invuln = 0;
    turkey.runPhase = 0;
    turkey.lookBack = false;
    turkey.speed = TURKEY_RUN_SPEED;
  }

  // Returns true when a jump actually left the ground.
  function update(dt, controls, nearHaystack) {
    if (turkey.hidden) {
      turkey.hideTimer -= dt;
      if (turkey.hideTimer <= 0 || controls.steer !== 0 || controls.jump) {
        turkey.hidden = false;
        turkey.hideTimer = 0;
      }
      return false;
    }
    if (turkey.invuln > 0) turkey.invuln -= dt;
    if (turkey.dashBoost > 0) turkey.dashBoost -= dt;

    // Hiding needs a haystack underfoot and the Down key.
    if (controls.hide && nearHaystack && turkey.onGround) {
      turkey.hidden = true;
      turkey.hideTimer = 4;
      return false;
    }

    let jumped = false;
    if (controls.jump && turkey.onGround) {
      turkey.vy = -TURKEY_JUMP_SPEED;
      turkey.onGround = false;
      jumped = true;
    }

    turkey.dashing = controls.dash && turkey.stamina > 1 && turkey.onGround;
    if (turkey.dashing) {
      turkey.stamina = Math.max(0, turkey.stamina - STAMINA_DRAIN * dt);
    } else {
      turkey.stamina = Math.min(STAMINA_MAX, turkey.stamina + STAMINA_REGEN * dt);
    }

    let speed = TURKEY_RUN_SPEED;
    if (controls.steer > 0) speed += TURKEY_PUSH_SPEED;
    if (controls.steer < 0) speed -= TURKEY_BACK_SPEED;
    if (turkey.dashing || turkey.dashBoost > 0) speed *= TURKEY_DASH_MULT;
    turkey.speed = speed;
    turkey.x += speed * dt;
    turkey.runPhase += dt * speed * 0.055;

    turkey.vy += GRAVITY * dt;
    turkey.y += turkey.vy * dt;
    if (turkey.y >= GROUND_Y - TURKEY_HEIGHT) {
      turkey.y = GROUND_Y - TURKEY_HEIGHT;
      turkey.vy = 0;
      turkey.onGround = true;
    }
    return jumped;
  }

  function draw(ctx, screenX, time) {
    if (turkey.hidden) {
      // Only the tail feathers poke out of the hay: the comic hiding tell.
      ctx.save();
      ctx.translate(screenX + TURKEY_WIDTH / 2, GROUND_Y - 6);
      for (let i = -2; i <= 2; i += 1) {
        ctx.save();
        ctx.rotate(i * 0.35);
        ctx.fillStyle = ['#b45309', '#dc2626', '#d97706', '#92400e', '#ea580c'][i + 2];
        ctx.beginPath();
        ctx.ellipse(0, -26, 9, 26, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
      return;
    }
    // Blinking while invulnerable: the player reads "I was just hit".
    if (turkey.invuln > 0 && Math.floor(time * 14) % 2 === 0) return;

    const legSwing = turkey.onGround ? Math.sin(turkey.runPhase) * 10 : 8;
    const bodyY = turkey.y + 30;
    ctx.save();
    ctx.translate(screenX, bodyY);

    // Tail fan: five autumn feathers fanned behind the body.
    for (let i = -2; i <= 2; i += 1) {
      ctx.save();
      ctx.translate(-22, -6);
      ctx.rotate(-0.5 + (i + 2) * 0.28 + Math.sin(time * 6 + i) * 0.03);
      ctx.fillStyle = ['#7c2d12', '#b45309', '#dc2626', '#d97706', '#92400e'][i + 2];
      ctx.beginPath();
      ctx.ellipse(-16, 0, 22, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Legs, pumping while running, tucked while airborne.
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6, 18);
    ctx.lineTo(-6 + legSwing, 30);
    ctx.moveTo(8, 18);
    ctx.lineTo(8 - legSwing, 30);
    ctx.stroke();

    // Body: a plump brown oval with a cream belly.
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.ellipse(0, 0, 30, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.ellipse(8, 8, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    // Wing, flapping a little faster while dashing.
    const flap = turkey.dashing ? Math.sin(time * 26) * 0.5 : Math.sin(time * 8) * 0.15;
    ctx.save();
    ctx.translate(-4, -4);
    ctx.rotate(-0.4 + flap);
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.ellipse(-8, 0, 16, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Head: turned back in panic when the farmer is close, forward otherwise.
    const headX = turkey.lookBack ? -24 : 24;
    const headY = -26;
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.arc(headX, headY, 13, 0, Math.PI * 2);
    ctx.fill();
    // Wattle and beak.
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.ellipse(headX + (turkey.lookBack ? -8 : 8), headY + 8, 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(headX + (turkey.lookBack ? -13 : 13), headY - 2);
    ctx.lineTo(headX + (turkey.lookBack ? -24 : 24), headY + 2);
    ctx.lineTo(headX + (turkey.lookBack ? -13 : 13), headY + 6);
    ctx.closePath();
    ctx.fill();
    // Wide panicked eye when looking back, calm dot otherwise.
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(headX + (turkey.lookBack ? -4 : 4), headY - 4, turkey.lookBack ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(headX + (turkey.lookBack ? -4 : 4), headY - 4, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  return { turkey, reset, update, draw };
}
