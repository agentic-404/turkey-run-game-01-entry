// The renderer: autumn farmyard and kitchen backdrops, the title screen, the
// pause overlay and both end screens. Everything is drawn from the live world
// state, so a screenshot is always a real frame of the game.
import { GROUND_Y, VIEW_H, VIEW_W } from './config.js';
import { drawHud } from './hud.js';
import { drawKnife, drawKnifeShadow, drawOven } from './hazards.js';
import {
  SCREEN_CAUGHT, SCREEN_ESCAPED, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE,
} from './world.js';

function skyGradient(ctx, top, mid, bottom) {
  const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  g.addColorStop(0, top);
  g.addColorStop(0.55, mid);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, GROUND_Y);
}

function drawClouds(ctx, camX, time) {
  ctx.fillStyle = 'rgba(255,247,237,0.9)';
  for (let i = 0; i < 4; i += 1) {
    const cx = ((i * 360 - camX * 0.2 - time * 12) % (VIEW_W + 240) + VIEW_W + 240) % (VIEW_W + 240) - 120;
    const cy = 70 + i * 46;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 70, 20, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 44, cy + 8, 52, 16, 0, 0, Math.PI * 2);
    ctx.ellipse(cx - 46, cy + 8, 46, 14, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFarmyard(ctx, camX, time, decor = true) {
  skyGradient(ctx, '#ea580c', '#fbbf24', '#fef3c7');
  // Low autumn sun.
  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.arc(VIEW_W - 170, 110, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(253,230,138,0.35)';
  ctx.beginPath();
  ctx.arc(VIEW_W - 170, 110, 78, 0, Math.PI * 2);
  ctx.fill();
  drawClouds(ctx, camX, time);
  // Rolling hills and a red barn, parallaxed.
  ctx.fillStyle = '#a16207';
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  for (let x = 0; x <= VIEW_W; x += 40) {
    ctx.lineTo(x, GROUND_Y - 70 - Math.sin((x + camX * 0.3) * 0.004) * 36);
  }
  ctx.lineTo(VIEW_W, GROUND_Y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#65a30d';
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  for (let x = 0; x <= VIEW_W; x += 40) {
    ctx.lineTo(x, GROUND_Y - 26 - Math.sin((x + camX * 0.5) * 0.006 + 2) * 18);
  }
  ctx.lineTo(VIEW_W, GROUND_Y);
  ctx.closePath();
  ctx.fill();
  // Barn silhouette and autumn trees — skipped on the title screen, where the
  // turkey and the farmer stand on the same ground and must read cleanly.
  if (decor) {
    const barnX = 880 - ((camX * 0.5) % 1600);
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(barnX, GROUND_Y - 130, 150, 130);
    ctx.beginPath();
    ctx.moveTo(barnX - 12, GROUND_Y - 130);
    ctx.lineTo(barnX + 75, GROUND_Y - 178);
    ctx.lineTo(barnX + 162, GROUND_Y - 130);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(barnX + 58, GROUND_Y - 62, 34, 62);
    // Autumn trees.
    for (let i = 0; i < 3; i += 1) {
      const tx = 180 + i * 420 - ((camX * 0.6) % 1260);
      const ty = GROUND_Y - 60;
      ctx.fillStyle = '#78350f';
      ctx.fillRect(tx - 6, ty - 50, 12, 52);
      ctx.fillStyle = ['#ea580c', '#dc2626', '#d97706'][i];
      ctx.beginPath();
      ctx.arc(tx, ty - 66, 42, 0, Math.PI * 2);
      ctx.arc(tx - 30, ty - 44, 28, 0, Math.PI * 2);
      ctx.arc(tx + 30, ty - 44, 28, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Dirt ground.
  ctx.fillStyle = '#b45309';
  ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
  ctx.fillStyle = '#92400e';
  ctx.fillRect(0, GROUND_Y, VIEW_W, 8);
  ctx.fillStyle = '#78350f';
  for (let x = 0; x < VIEW_W; x += 90) {
    const px = x - (camX % 90);
    ctx.beginPath();
    ctx.ellipse(px, GROUND_Y + 40 + ((x * 7) % 50), 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // A strip of grass along the top of the ground.
  ctx.fillStyle = '#65a30d';
  for (let x = 0; x < VIEW_W; x += 46) {
    const px = x - (camX % 46);
    ctx.beginPath();
    ctx.moveTo(px, GROUND_Y + 2);
    ctx.lineTo(px + 5, GROUND_Y - 12);
    ctx.lineTo(px + 10, GROUND_Y + 2);
    ctx.closePath();
    ctx.fill();
  }
}

function drawKitchen(ctx, camX, time) {
  // Cream tiled wall, warm light from a window.
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(0, 0, VIEW_W, GROUND_Y);
  ctx.strokeStyle = '#e7c98a';
  ctx.lineWidth = 2;
  for (let y = 0; y < GROUND_Y; y += 56) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(VIEW_W, y);
    ctx.stroke();
  }
  for (let x = 0; x < VIEW_W; x += 56) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, GROUND_Y);
    ctx.stroke();
  }
  // Window with the autumn yard outside.
  ctx.fillStyle = '#78350f';
  ctx.fillRect(96, 70, 220, 180);
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(108, 82, 196, 156);
  ctx.fillStyle = '#65a30d';
  ctx.beginPath();
  ctx.arc(150, 220, 40, 0, Math.PI * 2);
  ctx.arc(260, 225, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#78350f';
  ctx.fillRect(200, 82, 12, 156);
  ctx.fillRect(108, 152, 196, 12);
  // Shelf with jars and a hanging row of pots.
  ctx.fillStyle = '#92400e';
  ctx.fillRect(900, 120, 300, 14);
  for (let i = 0; i < 4; i += 1) {
    ctx.fillStyle = ['#dc2626', '#16a34a', '#d97706', '#2563eb'][i];
    ctx.fillRect(920 + i * 66, 76, 40, 44);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(926 + i * 66, 66, 28, 10);
  }
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i += 1) {
    const px = 480 + i * 110;
    ctx.beginPath();
    ctx.moveTo(px, 40);
    ctx.lineTo(px, 84);
    ctx.stroke();
    ctx.fillStyle = '#4b5563';
    ctx.beginPath();
    ctx.arc(px, 104, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.arc(px, 104, 18, 0, Math.PI * 2);
    ctx.fill();
  }
  // Checkerboard floor.
  for (let x = 0; x < VIEW_W; x += 80) {
    for (let y = GROUND_Y; y < VIEW_H; y += 60) {
      const dark = ((x / 80) + ((y - GROUND_Y) / 60)) % 2 === 0;
      ctx.fillStyle = dark ? '#92400e' : '#b45309';
      ctx.fillRect(x, y, 80, 60);
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(0, GROUND_Y, VIEW_W, 10);
}

function drawTitleScreen(ctx, world, best, time) {
  const { turkey, farmer } = world;
  drawFarmyard(ctx, 0, time, false);
  // A soft panel behind the title so it reads at a glance.
  ctx.fillStyle = 'rgba(41,26,14,0.55)';
  ctx.fillRect(0, 96, VIEW_W, 300);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 92px sans-serif';
  ctx.fillText('GOBBLE DASH', VIEW_W / 2, 210);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText('THE GREAT TURKEY ESCAPE', VIEW_W / 2, 258);
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('Thanksgiving is coming — RUN, TOM, RUN!', VIEW_W / 2, 300);
  // The controls live inside the panel, clear of the figures on the ground.
  ctx.fillStyle = '#fde68a';
  ctx.font = '20px sans-serif';
  ctx.fillText('← → steer    SPACE / ↑ jump    SHIFT dash    ↓ hide in haystacks', VIEW_W / 2, 336);
  ctx.fillText('Jump fences and ovens — dodge the falling carving knives — grab corn!', VIEW_W / 2, 368);
  // The turkey and the farmer face off on the ground, nothing behind them.
  turkey.turkey.lookBack = true;
  turkey.turkey.runPhase = time * 8;
  turkey.draw(ctx, 380, time);
  farmer.farmer.mode = 'chase';
  farmer.farmer.runPhase = time * 8;
  farmer.draw(ctx, 860, time);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('PRESS SPACE OR CLICK TO START', VIEW_W / 2, 452);
  ctx.font = 'bold 20px sans-serif';
  if (best > 0) ctx.fillText(`BEST SCORE: ${best}`, VIEW_W / 2, 690);
  else ctx.fillText('Reach the forest gate to escape Thanksgiving dinner!', VIEW_W / 2, 690);
}

function drawCaughtScreen(ctx, world, time) {
  const { turkey, farmer } = world;
  drawFarmyard(ctx, world.state.camX, time, false);
  ctx.fillStyle = 'rgba(20,10,4,0.62)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // The farmer holds the turkey up in triumph, just above his straw hat.
  // The pair stands left of centre so the centred score line stays clear of them.
  farmer.farmer.mode = 'chase';
  farmer.farmer.runPhase = 0;
  const fx = VIEW_W / 2 - 220;
  farmer.draw(ctx, fx, time);
  const savedY = turkey.turkey.y;
  turkey.turkey.y = 420;
  turkey.turkey.hidden = false;
  turkey.turkey.invuln = 0;
  ctx.save();
  ctx.translate(fx + 10, 450);
  ctx.rotate(-0.25);
  ctx.translate(-(fx + 10), -450);
  turkey.draw(ctx, fx + 10, time);
  ctx.restore();
  turkey.turkey.y = savedY;

  ctx.textAlign = 'center';
  ctx.fillStyle = '#fca5a5';
  ctx.font = 'bold 84px sans-serif';
  ctx.fillText('CAUGHT!', VIEW_W / 2, 150);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 26px sans-serif';
  const reason = world.state.endReason === 'grabbed'
    ? 'The farmer grabbed Tom by the drumstick.'
    : world.state.endReason === 'oven'
      ? 'Tom got too well done in the oven.'
      : world.state.endReason === 'knife'
        ? 'A carving knife ended the run.'
        : 'Tom tripped over one fence too many.';
  ctx.fillText(reason, VIEW_W / 2, 196);
  ctx.fillText('Thanksgiving dinner is served...', VIEW_W / 2, 232);
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText(`SCORE  ${world.state.finalScore}`, VIEW_W / 2, 560);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('PRESS SPACE OR CLICK TO RUN AGAIN', VIEW_W / 2, 620);
}

function drawEscapedScreen(ctx, world, time) {
  const { turkey } = world;
  // The forest: deep green, tall pines, golden light through the leaves.
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, '#14532d');
  g.addColorStop(0.6, '#166534');
  g.addColorStop(1, '#052e16');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = 'rgba(253,230,138,0.25)';
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.moveTo(200 + i * 220, 0);
    ctx.lineTo(280 + i * 220, 0);
    ctx.lineTo(420 + i * 220, VIEW_H);
    ctx.lineTo(300 + i * 220, VIEW_H);
    ctx.closePath();
    ctx.fill();
  }
  for (let i = 0; i < 7; i += 1) {
    const tx = 60 + i * 190;
    ctx.fillStyle = '#052e16';
    ctx.beginPath();
    ctx.moveTo(tx, GROUND_Y);
    ctx.lineTo(tx + 70, GROUND_Y - 260);
    ctx.lineTo(tx + 140, GROUND_Y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#14532d';
    ctx.beginPath();
    ctx.moveTo(tx + 16, GROUND_Y - 60);
    ctx.lineTo(tx + 70, GROUND_Y - 240);
    ctx.lineTo(tx + 124, GROUND_Y - 60);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#166534';
  ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
  // Tom runs free on the right, clear of the centred score text, motion lines behind him.
  turkey.turkey.runPhase = time * 12;
  turkey.turkey.lookBack = false;
  turkey.turkey.invuln = 0;
  turkey.draw(ctx, 920, time);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 4;
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.moveTo(780 - i * 30, 560 + i * 22);
    ctx.lineTo(860 - i * 30, 560 + i * 22);
    ctx.stroke();
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = '#bbf7d0';
  ctx.font = 'bold 84px sans-serif';
  ctx.fillText('ESCAPED!', VIEW_W / 2, 150);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('Tom made it to the forest. No Thanksgiving dinner this year!', VIEW_W / 2, 196);
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText(`SCORE  ${world.state.finalScore}`, VIEW_W / 2, 560);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('PRESS SPACE OR CLICK TO RUN AGAIN', VIEW_W / 2, 620);
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = VIEW_W;
  canvas.height = VIEW_H;

  function draw(world, screen, best, time) {
    const { state } = world;
    ctx.save();
    if (state.shake > 0) {
      const mag = state.shake * 14;
      ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
    }
    if (screen === SCREEN_TITLE) {
      drawTitleScreen(ctx, world, best, time);
      ctx.restore();
      return;
    }
    if (screen === SCREEN_CAUGHT) {
      drawCaughtScreen(ctx, world, time);
      ctx.restore();
      return;
    }
    if (screen === SCREEN_ESCAPED) {
      drawEscapedScreen(ctx, world, time);
      ctx.restore();
      return;
    }

    if (state.stage === 2) drawKitchen(ctx, state.camX, time);
    else drawFarmyard(ctx, state.camX, time);

    for (const knife of state.knives) {
      drawKnifeShadow(ctx, knife, knife.x - state.camX);
    }
    world.drawEntities(ctx, time);
    for (const oven of state.ovens) {
      const sx = oven.x - state.camX;
      if (sx > -220 && sx < 1500) drawOven(ctx, oven, sx, time);
    }
    for (const knife of state.knives) {
      drawKnife(ctx, knife, knife.x - state.camX);
    }
    world.farmer.draw(ctx, world.farmer.farmer.x - state.camX, time);
    world.turkey.draw(ctx, world.turkey.turkey.x - state.camX, time);

    drawHud(ctx, {
      stage: state.stage,
      lives: state.lives,
      turkeyStamina: world.turkey.turkey.stamina,
      farmerSpotted: world.farmer.farmer.spotted,
      banner: state.banner,
      bannerTimer: state.bannerTimer,
      time: state.time,
    }, world.score(), world.distanceMeters());

    if (screen === SCREEN_PAUSED) {
      ctx.fillStyle = 'rgba(20,10,4,0.6)';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 64px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', VIEW_W / 2, 330);
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('Press P to keep running', VIEW_W / 2, 380);
    }
    ctx.restore();
  }

  return { draw };
}
