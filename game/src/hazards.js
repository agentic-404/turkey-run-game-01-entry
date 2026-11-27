// The kitchen dangers: ovens (hot zones on the ground) and carving knives that
// fall from above. Both are drawn as canvas vector art and both are telegraphed
// before they hurt: the oven glows, the knife casts a shadow and glints.
import { GROUND_Y } from './config.js';

export function createOven(x) {
  return { kind: 'oven', x, width: 150, height: 96, heat: 0 };
}

export function createKnife(x, delay) {
  return {
    kind: 'knife',
    x,
    y: -90,
    vy: 0,
    delay, // seconds before it starts falling
    stuck: 0, // seconds spent stuck in the ground
    gone: false,
  };
}

// Knives accelerate down once their delay expires; a stuck knife fades away.
export function updateKnife(knife, dt) {
  if (knife.gone) return;
  if (knife.delay > 0) {
    knife.delay -= dt;
    return;
  }
  if (knife.stuck > 0) {
    knife.stuck -= dt;
    if (knife.stuck <= 0) knife.gone = true;
    return;
  }
  knife.vy += 2600 * dt;
  knife.y += knife.vy * dt;
  if (knife.y >= GROUND_Y - 74) {
    knife.y = GROUND_Y - 74;
    knife.stuck = 1.4;
  }
}

// The warning shadow on the ground while the knife is still falling.
export function drawKnifeShadow(ctx, knife, screenX) {
  if (knife.gone || knife.delay > 0 || knife.stuck > 0) return;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(screenX, GROUND_Y + 4, 26, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('!', screenX, GROUND_Y - 8);
}

export function drawKnife(ctx, knife, screenX) {
  if (knife.gone || knife.delay > 0) return;
  const alpha = knife.stuck > 0 ? Math.max(0.15, knife.stuck / 1.4) : 1;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(screenX, knife.y);
  // Blade: a long steel triangle pointing down, with a glint.
  ctx.fillStyle = '#e5e7eb';
  ctx.beginPath();
  ctx.moveTo(-8, -34);
  ctx.lineTo(8, -34);
  ctx.lineTo(0, 40);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#9ca3af';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-3, -30);
  ctx.lineTo(0, 30);
  ctx.stroke();
  // Wooden handle on top.
  ctx.fillStyle = '#78350f';
  ctx.fillRect(-7, -58, 14, 26);
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(-7, -34, 14, 4);
  ctx.restore();
}

export function drawOven(ctx, oven, screenX, time) {
  const flicker = 0.7 + Math.sin(time * 9 + oven.x) * 0.3;
  // Body: a big steel box with a glowing open door and a chimney.
  ctx.fillStyle = '#374151';
  ctx.fillRect(screenX, GROUND_Y - oven.height, oven.width, oven.height);
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(screenX, GROUND_Y - oven.height - 34, 34, 34);
  ctx.fillStyle = '#6b7280';
  ctx.fillRect(screenX + 6, GROUND_Y - oven.height - 40, 22, 8);
  // Heat shimmer above the chimney.
  ctx.fillStyle = `rgba(249,115,22,${0.25 * flicker})`;
  ctx.beginPath();
  ctx.ellipse(screenX + 17, GROUND_Y - oven.height - 52, 14, 12 + Math.sin(time * 5) * 3, 0, 0, Math.PI * 2);
  ctx.fill();
  // Open door: orange fire inside, dancing flames.
  ctx.fillStyle = `rgba(249,115,22,${0.55 + 0.45 * flicker})`;
  ctx.fillRect(screenX + 22, GROUND_Y - 62, 106, 56);
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.moveTo(screenX + 40, GROUND_Y - 8);
  ctx.quadraticCurveTo(screenX + 52, GROUND_Y - 52 - Math.sin(time * 11) * 8, screenX + 64, GROUND_Y - 8);
  ctx.quadraticCurveTo(screenX + 76, GROUND_Y - 46, screenX + 88, GROUND_Y - 8);
  ctx.quadraticCurveTo(screenX + 104, GROUND_Y - 40, screenX + 116, GROUND_Y - 8);
  ctx.closePath();
  ctx.fill();
  // Door frame and knobs.
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 4;
  ctx.strokeRect(screenX + 22, GROUND_Y - 62, 106, 56);
  ctx.fillStyle = '#9ca3af';
  ctx.beginPath();
  ctx.arc(screenX + 34, GROUND_Y - 76, 5, 0, Math.PI * 2);
  ctx.arc(screenX + 116, GROUND_Y - 76, 5, 0, Math.PI * 2);
  ctx.fill();
  // The warning sign above the door.
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(screenX + 48, GROUND_Y - oven.height - 16, 54, 14);
  ctx.fillStyle = '#b91c1c';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HOT!', screenX + 75, GROUND_Y - oven.height - 5);
}
