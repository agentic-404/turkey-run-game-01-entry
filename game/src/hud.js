// The HUD: score, distance, lives, stamina and stage, drawn big enough to read
// on a screenshot shrunk to a contact sheet.
import { STAMINA_MAX, VIEW_W } from './config.js';

function drawHeart(ctx, x, y, size, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 20, size / 20);
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.bezierCurveTo(-12, -6, -6, -16, 0, -8);
  ctx.bezierCurveTo(6, -16, 12, -6, 0, 6);
  ctx.closePath();
  ctx.fillStyle = filled ? '#dc2626' : 'rgba(0,0,0,0.35)';
  ctx.fill();
  ctx.strokeStyle = '#7f1d1d';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

export function drawHud(ctx, state, scoreValue, distanceValue) {
  ctx.save();
  // Top bar: a translucent autumn band so the numbers read over any background.
  ctx.fillStyle = 'rgba(41,26,14,0.72)';
  ctx.fillRect(0, 0, VIEW_W, 86);

  ctx.textBaseline = 'alphabetic';
  // Score, top left.
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('SCORE', 22, 28);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText(String(scoreValue), 22, 62);

  // Stamina bar under the score: dash fuel, gold when full.
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(22, 70, 150, 10);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(22, 70, 150 * (state.turkeyStamina / STAMINA_MAX), 10);
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('DASH  [SHIFT]', 178, 79);

  // Distance and stage, top centre.
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 17px sans-serif';
  ctx.fillText(state.stage === 1 ? 'STAGE 1 — THE FARMYARD' : 'STAGE 2 — THE KITCHEN', VIEW_W / 2, 28);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText(`${distanceValue} m`, VIEW_W / 2, 62);

  // Lives as hearts, top right.
  ctx.textAlign = 'right';
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 17px sans-serif';
  ctx.fillText('LIVES', VIEW_W - 22, 28);
  for (let i = 0; i < 3; i += 1) {
    drawHeart(ctx, VIEW_W - 34 - i * 36, 50, 30, i < state.lives);
  }

  // The SPOTTED banner: the farmer is close and the turkey is in danger.
  if (state.farmerSpotted) {
    const pulse = 0.75 + Math.sin(state.time * 10) * 0.25;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(VIEW_W / 2 - 130, 96, 260, 40);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('! SPOTTED — RUN !', VIEW_W / 2, 124);
  }

  // The stage banner, shown for a few seconds after each stage starts.
  if (state.bannerTimer > 0 && state.banner) {
    ctx.globalAlpha = Math.min(1, state.bannerTimer);
    ctx.fillStyle = 'rgba(41,26,14,0.8)';
    ctx.fillRect(VIEW_W / 2 - 330, 300, 660, 64);
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.banner, VIEW_W / 2, 344);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
