import { GameState, Platform, BeerCan, Enemy, Player, Particle, Cloud, Boss, Projectile } from './types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  STORY_PROLOGUE,
  STORY_INTERLUDE,
  STORY_FINALE,
} from './constants';

let crabImage: HTMLImageElement | null = null;
let beerImage: HTMLImageElement | null = null;
let bgImage1: HTMLImageElement | null = null;
let bgImage2: HTMLImageElement | null = null;

export function loadImages() {
  crabImage = new Image();
  crabImage.src = '/images/crab-fsb.png';

  beerImage = new Image();
  beerImage.src = '/images/beer-can.png';

  bgImage1 = new Image();
  bgImage1.src = '/images/background.png';

  bgImage2 = new Image();
  bgImage2.src = '/images/background2.png';
}

export function render(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.save();

  if (state.screen === 'menu') {
    drawMenuScreen(ctx);
    ctx.restore();
    return;
  }
  if (state.screen === 'prologue') {
    drawStoryScreen(ctx, 'ПРОЛОГ', STORY_PROLOGUE[state.storyPage] || '', state.storyPage, STORY_PROLOGUE.length, '#FFD700');
    ctx.restore();
    return;
  }
  if (state.screen === 'interlude') {
    drawStoryScreen(ctx, 'МЕЖДУ УРОВНЯМИ', STORY_INTERLUDE[state.storyPage] || '', state.storyPage, STORY_INTERLUDE.length, '#FF8C00');
    ctx.restore();
    return;
  }
  if (state.screen === 'finale') {
    drawStoryScreen(ctx, 'ФИНАЛ', STORY_FINALE[state.storyPage] || '', state.storyPage, STORY_FINALE.length, '#4CAF50');
    ctx.restore();
    return;
  }
  if (state.screen === 'gameOver') {
    drawGameOverScreen(ctx, state);
    ctx.restore();
    return;
  }

  const currentBg = state.currentLevel === 1 ? bgImage1 : bgImage2;

  ctx.fillStyle = state.currentLevel === 1 ? '#4a90d9' : '#1a0a1e';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (state.currentLevel === 1) {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    skyGrad.addColorStop(0, '#1a1a4e');
    skyGrad.addColorStop(0.3, '#4a90d9');
    skyGrad.addColorStop(0.7, '#87CEEB');
    skyGrad.addColorStop(1, '#b8e6f0');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  } else {
    const barGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    barGrad.addColorStop(0, '#1a0a1e');
    barGrad.addColorStop(0.4, '#2a0e1e');
    barGrad.addColorStop(1, '#1a0505');
    ctx.fillStyle = barGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const pulse = 0.7 + 0.3 * Math.sin(state.time * 0.1);
    ctx.fillStyle = `rgba(255, 0, 60, ${0.05 * pulse})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, 150);
  }

  if (currentBg && currentBg.complete && currentBg.naturalWidth > 0) {
    const imgRatio = currentBg.naturalWidth / currentBg.naturalHeight;
    const canvasRatio = CANVAS_WIDTH / CANVAS_HEIGHT;

    let drawW = CANVAS_WIDTH;
    let drawH = CANVAS_HEIGHT;

    if (imgRatio > canvasRatio) {
      drawH = CANVAS_HEIGHT;
      drawW = CANVAS_HEIGHT * imgRatio;
    } else {
      drawW = CANVAS_WIDTH;
      drawH = CANVAS_WIDTH / imgRatio;
    }

    const parallaxX = -(state.cameraX * 0.3) % drawW;
    const offsetY = (CANVAS_HEIGHT - drawH) / 2;

    ctx.globalAlpha = 0.55;
    ctx.drawImage(currentBg, parallaxX, offsetY, drawW, drawH);
    ctx.drawImage(currentBg, parallaxX + drawW, offsetY, drawW, drawH);
    if (parallaxX + drawW * 2 < CANVAS_WIDTH) {
      ctx.drawImage(currentBg, parallaxX + drawW * 2, offsetY, drawW, drawH);
    }
    ctx.globalAlpha = 1;
  }

  drawClouds(ctx, state.clouds, state.cameraX);

  ctx.save();
  ctx.translate(-state.cameraX, 0);

  if (state.boss.alive || state.boss.active) {
    drawArenaMarker(ctx, state.boss, state.currentLevel);
  }

  for (const p of state.platforms) {
    drawPlatform(ctx, p, state.currentLevel);
  }

  for (const beer of state.beers) {
    if (!beer.collected) {
      drawBeer(ctx, beer, state.time);
    }
  }

  for (const enemy of state.enemies) {
    if (enemy.alive) {
      drawEnemy(ctx, enemy);
    }
  }

  if (state.boss.alive) {
    drawBoss(ctx, state.boss, state.time);
  }

  for (const proj of state.projectiles) {
    if (proj.alive) drawProjectile(ctx, proj);
  }

  for (const p of state.particles) {
    drawParticle(ctx, p);
  }

  drawPlayer(ctx, state.player, state.time);

  ctx.restore();

  drawUI(ctx, state);

  ctx.restore();
}

function drawArenaMarker(ctx: CanvasRenderingContext2D, boss: Boss, level: number) {
  const color = level === 1 ? 'rgba(255, 0, 0, 0.25)' : 'rgba(160, 0, 200, 0.35)';
  const g = ctx.createLinearGradient(boss.arenaLeft, 400, boss.arenaLeft, 460);
  g.addColorStop(0, 'rgba(0, 0, 0, 0)');
  g.addColorStop(1, color);
  ctx.fillStyle = g;
  ctx.fillRect(boss.arenaLeft, 400, boss.arenaRight - boss.arenaLeft, 60);
}

function drawClouds(ctx: CanvasRenderingContext2D, clouds: Cloud[], cameraX: number) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  for (const cloud of clouds) {
    const x = (cloud.x - cameraX * cloud.speed * 0.5) % (CANVAS_WIDTH + cloud.width * 2) - cloud.width;
    drawCloud(ctx, x, cloud.y, cloud.width);
  }
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  ctx.beginPath();
  ctx.arc(x, y, w * 0.3, 0, Math.PI * 2);
  ctx.arc(x + w * 0.25, y - w * 0.15, w * 0.35, 0, Math.PI * 2);
  ctx.arc(x + w * 0.55, y - w * 0.1, w * 0.3, 0, Math.PI * 2);
  ctx.arc(x + w * 0.8, y, w * 0.25, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlatform(ctx: CanvasRenderingContext2D, p: Platform, level: number) {
  if (p.type === 'ground') {
    if (level === 1) {
      const grassGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.height);
      grassGrad.addColorStop(0, '#4CAF50');
      grassGrad.addColorStop(0.15, '#388E3C');
      grassGrad.addColorStop(0.15, '#8B4513');
      grassGrad.addColorStop(1, '#654321');
      ctx.fillStyle = grassGrad;
      ctx.fillRect(p.x, p.y, p.width, p.height);
      ctx.fillStyle = '#66BB6A';
      for (let gx = p.x; gx < p.x + p.width; gx += 12) {
        ctx.fillRect(gx, p.y - 2, 3, 5);
        ctx.fillRect(gx + 6, p.y - 1, 2, 4);
      }
    } else {
      const floorGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.height);
      floorGrad.addColorStop(0, '#5D3A1A');
      floorGrad.addColorStop(0.1, '#4A2E15');
      floorGrad.addColorStop(1, '#2A1A08');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(p.x, p.y, p.width, p.height);
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 1;
      for (let gx = p.x; gx < p.x + p.width; gx += 40) {
        ctx.beginPath();
        ctx.moveTo(gx, p.y);
        ctx.lineTo(gx, p.y + p.height);
        ctx.stroke();
      }
    }
  } else if (p.type === 'brick') {
    ctx.fillStyle = level === 1 ? '#CD853F' : '#6D4C41';
    ctx.fillRect(p.x, p.y, p.width, p.height);
    ctx.strokeStyle = level === 1 ? '#8B6914' : '#3E2723';
    ctx.lineWidth = 1;
    const brickW = 20;
    const brickH = p.height / 2;
    for (let row = 0; row < 2; row++) {
      const offset = row % 2 === 0 ? 0 : brickW / 2;
      for (let bx = p.x + offset; bx < p.x + p.width; bx += brickW) {
        ctx.strokeRect(bx, p.y + row * brickH, brickW, brickH);
      }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(p.x, p.y, p.width, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(p.x, p.y + p.height - 2, p.width, 2);
  } else if (p.type === 'pipe') {
    if (level === 1) {
      const pipeGrad = ctx.createLinearGradient(p.x, p.y, p.x + p.width, p.y);
      pipeGrad.addColorStop(0, '#2E7D32');
      pipeGrad.addColorStop(0.3, '#4CAF50');
      pipeGrad.addColorStop(0.7, '#388E3C');
      pipeGrad.addColorStop(1, '#1B5E20');
      ctx.fillStyle = pipeGrad;
      ctx.fillRect(p.x, p.y, p.width, p.height);
      ctx.fillRect(p.x - 5, p.y, p.width + 10, 15);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(p.x + 5, p.y + 15, 8, p.height - 15);
    } else {
      const tapGrad = ctx.createLinearGradient(p.x, p.y, p.x + p.width, p.y);
      tapGrad.addColorStop(0, '#455A64');
      tapGrad.addColorStop(0.3, '#78909C');
      tapGrad.addColorStop(0.7, '#546E7A');
      tapGrad.addColorStop(1, '#37474F');
      ctx.fillStyle = tapGrad;
      ctx.fillRect(p.x, p.y, p.width, p.height);
      ctx.fillStyle = '#B71C1C';
      ctx.fillRect(p.x - 8, p.y - 12, p.width + 16, 12);
      ctx.fillStyle = '#000';
      ctx.fillRect(p.x - 8, p.y - 12, p.width + 16, 3);
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(p.x + 8, p.y + 20, p.width - 16, 15);
      ctx.fillStyle = '#000';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('13R', p.x + p.width / 2, p.y + 31);
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(p.x + 4, p.y + 15, 4, p.height - 20);
    }
  } else if (p.type === 'bar') {
    const barGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.height);
    barGrad.addColorStop(0, '#8D6E63');
    barGrad.addColorStop(0.5, '#5D4037');
    barGrad.addColorStop(1, '#3E2723');
    ctx.fillStyle = barGrad;
    ctx.fillRect(p.x, p.y, p.width, p.height);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(p.x, p.y, p.width, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(p.x, p.y + p.height - 2, p.width, 2);
  } else if (p.type === 'barrel') {
    const barrelGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.height);
    barrelGrad.addColorStop(0, '#8D6E63');
    barrelGrad.addColorStop(0.5, '#5D4037');
    barrelGrad.addColorStop(1, '#3E2723');
    ctx.fillStyle = barrelGrad;
    ctx.fillRect(p.x, p.y, p.width, p.height);
    ctx.fillStyle = '#9E9E9E';
    ctx.fillRect(p.x, p.y + 2, p.width, 3);
    ctx.fillRect(p.x, p.y + p.height - 5, p.width, 3);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1;
    for (let bx = p.x + 8; bx < p.x + p.width; bx += 12) {
      ctx.beginPath();
      ctx.moveTo(bx, p.y + 3);
      ctx.lineTo(bx, p.y + p.height - 3);
      ctx.stroke();
    }
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('13R', p.x + p.width / 2, p.y + p.height / 2 + 3);
    ctx.textAlign = 'left';
  }
}

function drawBeer(ctx: CanvasRenderingContext2D, beer: BeerCan, time: number) {
  const bobY = Math.sin(time * 0.05 + beer.bobOffset) * 5;
  const drawY = beer.y + bobY;

  ctx.save();
  ctx.globalAlpha = 0.2 + Math.sin(time * 0.1) * 0.1;
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 15;
  ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
  ctx.beginPath();
  ctx.arc(beer.x + beer.width / 2, drawY + beer.height / 2, beer.width * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (beerImage && beerImage.complete && beerImage.naturalWidth > 0) {
    ctx.drawImage(beerImage, beer.x, drawY, beer.width, beer.height);
  } else {
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(beer.x, drawY, beer.width, beer.height);
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(beer.x + 2, drawY + 12, beer.width - 4, 20);
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 7px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('AMBIR', beer.x + beer.width / 2, drawY + 24);
    ctx.fillText('LAND', beer.x + beer.width / 2, drawY + 31);
    ctx.textAlign = 'left';
  }
}

function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy) {
  switch (enemy.type) {
    case 'bottle': drawBottle(ctx, enemy); break;
    case 'rat':    drawRat(ctx, enemy);    break;
    case 'crow':   drawDrone(ctx, enemy);  break;
    case 'mine':   drawMine(ctx, enemy);   break;
    case 'ninja':  drawCossack(ctx, enemy); break;
  }
}

function drawBottle(ctx: CanvasRenderingContext2D, e: Enemy) {
  ctx.fillStyle = '#2196F3';
  ctx.fillRect(e.x + 5, e.y + 5, e.width - 10, e.height - 5);
  ctx.fillRect(e.x + 12, e.y - 8, e.width - 24, 15);
  ctx.fillStyle = '#F44336';
  ctx.fillRect(e.x + 14, e.y - 12, e.width - 28, 6);
  ctx.fillStyle = '#fff';
  ctx.fillRect(e.x + 8, e.y + 12, e.width - 16, 14);
  ctx.fillStyle = '#000';
  ctx.fillRect(e.x + 12, e.y + 14, 5, 5);
  ctx.fillRect(e.x + e.width - 17, e.y + 14, 5, 5);
  ctx.strokeStyle = '#F44336';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(e.x + 10, e.y + 13);
  ctx.lineTo(e.x + 18, e.y + 15);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(e.x + e.width - 10, e.y + 13);
  ctx.lineTo(e.x + e.width - 18, e.y + 15);
  ctx.stroke();
}

function drawRat(ctx: CanvasRenderingContext2D, e: Enemy) {
  ctx.fillStyle = '#666';
  ctx.beginPath();
  ctx.ellipse(e.x + e.width / 2, e.y + e.height - 12, e.width / 2 - 2, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(e.vx < 0 ? e.x + 5 : e.x + e.width - 5, e.y + e.height - 18, 10, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FF9800';
  const headX = e.vx < 0 ? e.x + 2 : e.x + e.width - 2;
  ctx.beginPath();
  ctx.arc(headX - 5, e.y + e.height - 28, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(headX + 5, e.y + e.height - 28, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#F44336';
  const eyeX = e.vx < 0 ? e.x + 3 : e.x + e.width - 7;
  ctx.fillRect(eyeX, e.y + e.height - 20, 3, 3);
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const tailStart = e.vx < 0 ? e.x + e.width - 3 : e.x + 3;
  const tailEnd = e.vx < 0 ? e.x + e.width + 15 : e.x - 15;
  ctx.moveTo(tailStart, e.y + e.height - 10);
  ctx.quadraticCurveTo(tailEnd, e.y + e.height - 25, tailEnd, e.y + e.height - 5);
  ctx.stroke();
}

function drawDrone(ctx: CanvasRenderingContext2D, e: Enemy) {
  const cx = e.x + e.width / 2;
  const cy = e.y + e.height / 2;

  ctx.fillStyle = '#37474F';
  ctx.beginPath();
  ctx.roundRect(cx - 14, cy - 6, 28, 14, 3);
  ctx.fill();

  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(cx + (e.vx < 0 ? -12 : 12), cy + 1, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#F44336';
  ctx.beginPath();
  ctx.arc(cx + (e.vx < 0 ? -12 : 12), cy + 1, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#455A64';
  ctx.lineWidth = 3;
  const armEnds: [number, number][] = [
    [cx - 20, cy - 12],
    [cx + 20, cy - 12],
    [cx - 20, cy + 12],
    [cx + 20, cy + 12],
  ];
  ctx.beginPath();
  for (const [ax, ay] of armEnds) {
    ctx.moveTo(cx, cy);
    ctx.lineTo(ax, ay);
  }
  ctx.stroke();

  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = '#B0BEC5';
  ctx.lineWidth = 2;
  for (const [ax, ay] of armEnds) {
    ctx.beginPath();
    ctx.ellipse(ax, ay, 10, 3, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const blink = Math.floor(e.animTimer / 15) % 2 === 0;
  ctx.fillStyle = blink ? '#00E676' : '#004D40';
  ctx.beginPath();
  ctx.arc(cx, cy - 4, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#212121';
  ctx.beginPath();
  ctx.arc(cx, cy + 15, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy + 8);
  ctx.lineTo(cx, cy + 12);
  ctx.stroke();
}

function drawMine(ctx: CanvasRenderingContext2D, e: Enemy) {
  const cx = e.x + e.width / 2;
  const cy = e.y + e.height / 2;

  ctx.fillStyle = '#212121';
  ctx.beginPath();
  ctx.arc(cx, cy, e.width / 2 - 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.arc(cx - 5, cy - 5, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#424242';
  const spikes = 8;
  for (let i = 0; i < spikes; i++) {
    const a = (i / spikes) * Math.PI * 2;
    const sx = cx + Math.cos(a) * (e.width / 2 - 4);
    const sy = cy + Math.sin(a) * (e.width / 2 - 4);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(a) * 5, sy + Math.sin(a) * 5);
    ctx.lineTo(sx + Math.cos(a + 0.3) * 3, sy + Math.sin(a + 0.3) * 3);
    ctx.closePath();
    ctx.fill();
  }

  const blink = Math.floor(e.animTimer / 10) % 2 === 0;
  ctx.fillStyle = blink ? '#FF1744' : '#5D0000';
  ctx.beginPath();
  ctx.arc(cx, cy - 3, 3, 0, Math.PI * 2);
  ctx.fill();
  if (blink) {
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(cx, cy - 3, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawCossack(ctx: CanvasRenderingContext2D, e: Enemy) {
  const flip = e.vx > 0;
  ctx.save();
  if (flip) {
    ctx.translate(e.x + e.width / 2, 0);
    ctx.scale(-1, 1);
    ctx.translate(-(e.x + e.width / 2), 0);
  }

  const cx = e.x + e.width / 2;
  const bodyTop = e.y + 18;
  const bodyBottom = e.y + e.height;

  ctx.fillStyle = '#B71C1C';
  ctx.beginPath();
  ctx.moveTo(e.x + 3, bodyBottom);
  ctx.lineTo(e.x + e.width - 3, bodyBottom);
  ctx.lineTo(e.x + e.width - 6, bodyTop + 18);
  ctx.lineTo(e.x + 6, bodyTop + 18);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#3E2723';
  ctx.fillRect(e.x + 5, bodyBottom - 6, 12, 6);
  ctx.fillRect(e.x + e.width - 17, bodyBottom - 6, 12, 6);

  ctx.fillStyle = '#FAFAFA';
  ctx.fillRect(e.x + 6, bodyTop, e.width - 12, 20);

  ctx.fillStyle = '#D32F2F';
  ctx.fillRect(e.x + 6, bodyTop, e.width - 12, 3);
  ctx.fillRect(e.x + 6, bodyTop + 6, e.width - 12, 1);
  for (let sx = e.x + 8; sx < e.x + e.width - 8; sx += 4) {
    ctx.fillRect(sx, bodyTop + 4, 2, 1);
  }

  ctx.fillStyle = '#FFD600';
  ctx.fillRect(e.x + 5, bodyTop + 18, e.width - 10, 3);

  ctx.fillStyle = '#FFCC80';
  ctx.beginPath();
  ctx.arc(cx, e.y + 10, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#5D4037';
  ctx.beginPath();
  ctx.ellipse(cx - 4, e.y + 2, 4, 5, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx - 6, e.y + 6, 5, 3, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(cx - 3, e.y + 9, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 3, e.y + 9, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#5D4037';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 6, e.y + 13);
  ctx.quadraticCurveTo(cx - 9, e.y + 17, cx - 10, e.y + 20);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 6, e.y + 13);
  ctx.quadraticCurveTo(cx + 9, e.y + 17, cx + 10, e.y + 20);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 6, e.y + 13);
  ctx.lineTo(cx + 6, e.y + 13);
  ctx.stroke();
  ctx.lineCap = 'butt';

  ctx.strokeStyle = '#3E2723';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 6, e.y + 6);
  ctx.lineTo(cx - 1, e.y + 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 6, e.y + 6);
  ctx.lineTo(cx + 1, e.y + 8);
  ctx.stroke();

  ctx.fillStyle = '#0057B7';
  ctx.fillRect(e.x + e.width - 14, bodyTop + 8, 6, 3);
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(e.x + e.width - 14, bodyTop + 11, 6, 3);

  ctx.restore();
}

function drawBoss(ctx: CanvasRenderingContext2D, boss: Boss, _time: number) {
  ctx.save();

  if (boss.invulnTimer > 0 && Math.floor(boss.invulnTimer / 5) % 2 === 0) {
    ctx.globalAlpha = 0.5;
  }

  const flip = !boss.facingRight;
  if (flip) {
    ctx.translate(boss.x + boss.width / 2, 0);
    ctx.scale(-1, 1);
    ctx.translate(-(boss.x + boss.width / 2), 0);
  }

  if (boss.type === 'general') {
    drawGeneralBoss(ctx, boss);
  } else {
    drawTurkmenElder(ctx, boss);
  }

  ctx.restore();

  drawBossHealthBar(ctx, boss);
}

function drawGeneralBoss(ctx: CanvasRenderingContext2D, boss: Boss) {
  const cx = boss.x + boss.width / 2;
  const bodyTop = boss.y + 45;

  ctx.fillStyle = '#2E4A1E';
  ctx.fillRect(boss.x + 20, boss.y + boss.height - 30, 25, 30);
  ctx.fillRect(boss.x + boss.width - 45, boss.y + boss.height - 30, 25, 30);

  ctx.fillStyle = '#1B1B1B';
  ctx.fillRect(boss.x + 18, boss.y + boss.height - 8, 28, 8);
  ctx.fillRect(boss.x + boss.width - 47, boss.y + boss.height - 8, 28, 8);

  const bellyGrad = ctx.createRadialGradient(cx, bodyTop + 30, 5, cx, bodyTop + 30, 55);
  bellyGrad.addColorStop(0, '#5C7A3E');
  bellyGrad.addColorStop(1, '#3E5528');
  ctx.fillStyle = bellyGrad;
  ctx.beginPath();
  ctx.ellipse(cx, bodyTop + 30, 48, 40, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFD700';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(cx, bodyTop + 15 + i * 12, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#8B6914';
  ctx.fillRect(boss.x + 8, bodyTop + 55, boss.width - 16, 8);
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(cx - 8, bodyTop + 55, 16, 8);

  ctx.fillStyle = '#8B0000';
  ctx.fillRect(boss.x + 10, bodyTop + 5, 25, 8);
  ctx.fillRect(boss.x + boss.width - 35, bodyTop + 5, 25, 8);
  ctx.fillStyle = '#FFD700';
  drawStar(ctx, boss.x + 22, bodyTop + 9, 3);
  drawStar(ctx, boss.x + boss.width - 22, bodyTop + 9, 3);

  ctx.fillStyle = '#3E5528';
  ctx.beginPath();
  ctx.ellipse(boss.x + 10, bodyTop + 30, 10, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(boss.x + boss.width - 10, bodyTop + 30, 10, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFCC80';
  ctx.beginPath();
  ctx.arc(boss.x + 8, bodyTop + 50, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(boss.x + boss.width - 8, bodyTop + 50, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFCC80';
  ctx.beginPath();
  ctx.arc(cx, boss.y + 30, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(244, 67, 54, 0.4)';
  ctx.beginPath();
  ctx.arc(cx - 12, boss.y + 34, 5, 0, Math.PI * 2);
  ctx.arc(cx + 12, boss.y + 34, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(cx - 7, boss.y + 27, 2, 0, Math.PI * 2);
  ctx.arc(cx + 7, boss.y + 27, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#3E2723';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 12, boss.y + 22);
  ctx.lineTo(cx - 3, boss.y + 25);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 12, boss.y + 22);
  ctx.lineTo(cx + 3, boss.y + 25);
  ctx.stroke();

  ctx.strokeStyle = '#3E2723';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 8, boss.y + 36);
  ctx.quadraticCurveTo(cx - 16, boss.y + 40, cx - 20, boss.y + 44);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 8, boss.y + 36);
  ctx.quadraticCurveTo(cx + 16, boss.y + 40, cx + 20, boss.y + 44);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 8, boss.y + 36);
  ctx.lineTo(cx + 8, boss.y + 36);
  ctx.stroke();
  ctx.lineCap = 'butt';

  ctx.fillStyle = '#2E4A1E';
  ctx.beginPath();
  ctx.ellipse(cx, boss.y + 10, 26, 8, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(cx - 26, boss.y + 10, 52, 4);
  ctx.fillStyle = '#B71C1C';
  ctx.fillRect(cx - 26, boss.y + 12, 52, 3);
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(cx, boss.y + 17, 30, 3, 0, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = '#FFD700';
  drawStar(ctx, cx, boss.y + 8, 5);
}

function drawTurkmenElder(ctx: CanvasRenderingContext2D, boss: Boss) {
  const cx = boss.x + boss.width / 2;
  const bodyTop = boss.y + 45;
  const bodyBottom = boss.y + boss.height;

  const robeGrad = ctx.createLinearGradient(boss.x, bodyTop, boss.x, bodyBottom);
  robeGrad.addColorStop(0, '#F5F5DC');
  robeGrad.addColorStop(1, '#D7CCC8');
  ctx.fillStyle = robeGrad;
  ctx.beginPath();
  ctx.moveTo(boss.x + 15, bodyBottom);
  ctx.lineTo(boss.x + boss.width - 15, bodyBottom);
  ctx.lineTo(boss.x + boss.width - 25, bodyTop);
  ctx.lineTo(boss.x + 25, bodyTop);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#B71C1C';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(cx, bodyTop + 15 + i * 18);
    ctx.lineTo(cx - 6, bodyTop + 22 + i * 18);
    ctx.lineTo(cx, bodyTop + 29 + i * 18);
    ctx.lineTo(cx + 6, bodyTop + 22 + i * 18);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = '#1B5E20';
  ctx.fillRect(boss.x + 18, bodyTop + 55, boss.width - 36, 7);
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(cx - 5, bodyTop + 55, 10, 7);

  ctx.fillStyle = '#EEEEEE';
  ctx.beginPath();
  ctx.ellipse(boss.x + 12, bodyTop + 35, 12, 22, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(boss.x + boss.width - 12, bodyTop + 35, 12, 22, 0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#F5D6B3';
  ctx.beginPath();
  ctx.arc(boss.x + 9, bodyTop + 55, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(boss.x + boss.width - 9, bodyTop + 55, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#795548';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(boss.x + 5 + i * 3, bodyTop + 65, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#F5D6B3';
  ctx.beginPath();
  ctx.arc(cx, boss.y + 32, 20, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#8D6E63';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 10, boss.y + 27);
  ctx.lineTo(cx - 5, boss.y + 28);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 5, boss.y + 28);
  ctx.lineTo(cx + 10, boss.y + 27);
  ctx.stroke();

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 10, boss.y + 30);
  ctx.lineTo(cx - 3, boss.y + 30);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 3, boss.y + 30);
  ctx.lineTo(cx + 10, boss.y + 30);
  ctx.stroke();

  ctx.strokeStyle = '#8D6E63';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, boss.y + 33);
  ctx.quadraticCurveTo(cx + 2, boss.y + 38, cx, boss.y + 40);
  ctx.stroke();

  const beardGrad = ctx.createLinearGradient(cx, boss.y + 40, cx, bodyTop + 60);
  beardGrad.addColorStop(0, '#EEEEEE');
  beardGrad.addColorStop(0.5, '#BDBDBD');
  beardGrad.addColorStop(1, '#9E9E9E');
  ctx.fillStyle = beardGrad;

  ctx.beginPath();
  ctx.moveTo(cx - 15, boss.y + 42);
  ctx.quadraticCurveTo(cx - 22, boss.y + 65, cx - 20, bodyTop + 40);
  ctx.quadraticCurveTo(cx - 15, bodyTop + 60, cx, bodyTop + 65);
  ctx.quadraticCurveTo(cx + 15, bodyTop + 60, cx + 20, bodyTop + 40);
  ctx.quadraticCurveTo(cx + 22, boss.y + 65, cx + 15, boss.y + 42);
  ctx.quadraticCurveTo(cx, boss.y + 46, cx - 15, boss.y + 42);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + i * 5, boss.y + 45);
    ctx.quadraticCurveTo(cx + i * 6, boss.y + 55, cx + i * 4, bodyTop + 55);
    ctx.stroke();
  }

  ctx.fillStyle = '#BDBDBD';
  ctx.beginPath();
  ctx.ellipse(cx - 6, boss.y + 40, 6, 3, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 6, boss.y + 40, 6, 3, 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#3E2723';
  ctx.beginPath();
  ctx.moveTo(cx - 24, boss.y + 15);
  ctx.lineTo(cx - 20, boss.y - 20);
  ctx.lineTo(cx + 20, boss.y - 20);
  ctx.lineTo(cx + 24, boss.y + 15);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#5D4037';
  for (let i = -20; i < 20; i += 5) {
    ctx.beginPath();
    ctx.arc(cx + i, boss.y - 15 + Math.abs(i) * 0.3, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = -18; i < 18; i += 5) {
    ctx.beginPath();
    ctx.arc(cx + i, boss.y - 5 + Math.abs(i) * 0.2, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = -22; i < 22; i += 5) {
    ctx.beginPath();
    ctx.arc(cx + i, boss.y + 8, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#1B5E20';
  ctx.fillRect(cx - 22, boss.y + 12, 44, 4);

  ctx.fillStyle = '#FFD700';
  drawStar(ctx, cx, boss.y - 5, 4);
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function drawBossHealthBar(ctx: CanvasRenderingContext2D, boss: Boss) {
  const barW = 120;
  const barH = 12;
  const bx = boss.x + boss.width / 2 - barW / 2;
  const by = boss.y - 22;

  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(bx - 2, by - 2, barW + 4, barH + 4);
  ctx.fillStyle = '#3E1010';
  ctx.fillRect(bx, by, barW, barH);

  const pct = boss.hp / boss.maxHp;
  const hpColor = pct > 0.66 ? '#4CAF50' : pct > 0.33 ? '#FFC107' : '#F44336';
  ctx.fillStyle = hpColor;
  ctx.fillRect(bx, by, barW * pct, barH);

  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  const bossName = boss.type === 'general' ? 'ТОЛСТЫЙ ГЕНЕРАЛ' : 'ТУРКМЕНСКИЙ СТАРЕЦ';
  ctx.fillText(`${bossName}  ${boss.hp}/${boss.maxHp}`, boss.x + boss.width / 2, by - 5);
  ctx.textAlign = 'left';
}

function drawProjectile(ctx: CanvasRenderingContext2D, p: Projectile) {
  ctx.save();
  ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
  ctx.rotate(p.rotation);

  if (p.type === 'document') {
    ctx.fillStyle = '#F5DEB3';
    ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 1;
    ctx.strokeRect(-p.width / 2, -p.height / 2, p.width, p.height);
    ctx.strokeStyle = '#5D4037';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-p.width / 2 + 3, -p.height / 2 + 4 + i * 4);
      ctx.lineTo(p.width / 2 - 3, -p.height / 2 + 4 + i * 4);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(198,40,40,0.8)';
    ctx.beginPath();
    ctx.arc(p.width / 2 - 5, -p.height / 2 + 4, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.type === 'bowl') {
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(0, 0, p.width / 2, Math.PI * 0.1, Math.PI * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#F5F5DC';
    ctx.beginPath();
    ctx.ellipse(0, -1, p.width / 2 - 3, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFF59D';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, p.width / 2, Math.PI * 0.1, Math.PI * 0.9);
    ctx.stroke();
  } else if (p.type === 'genie') {
    const wave = Math.sin(p.rotation * 2) * 4;
    ctx.fillStyle = 'rgba(156, 39, 176, 0.3)';
    ctx.beginPath();
    ctx.arc(-5, wave, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(156, 39, 176, 0.5)';
    ctx.beginPath();
    ctx.arc(-2, wave / 2, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#9C27B0';
    ctx.beginPath();
    ctx.arc(0, 0, p.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(-3, -2, 2, 0, Math.PI * 2);
    ctx.arc(3, -2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-3, -2, 1, 0, Math.PI * 2);
    ctx.arc(3, -2, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#E1BEE7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.quadraticCurveTo(-3, 10, -6, 8);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(0, 0, p.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#424242';
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (p.width / 2 - 1), Math.sin(a) * (p.width / 2 - 1));
      ctx.lineTo(Math.cos(a) * (p.width / 2 + 3), Math.sin(a) * (p.width / 2 + 3));
      ctx.lineTo(Math.cos(a + 0.3) * (p.width / 2 + 1), Math.sin(a + 0.3) * (p.width / 2 + 1));
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#FF1744';
    ctx.beginPath();
    ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: Player, _time: number) {
  ctx.save();

  if (player.invulnTimer > 0 && Math.floor(player.invulnTimer / 5) % 2 === 0) {
    ctx.globalAlpha = 0.4;
  }

  if (crabImage && crabImage.complete && crabImage.naturalWidth > 0) {
    if (!player.facingRight) {
      ctx.translate(player.x + player.width / 2, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(crabImage, -player.width / 2, player.y, player.width, player.height);
    } else {
      ctx.drawImage(crabImage, player.x, player.y, player.width, player.height);
    }
  } else {
    ctx.fillStyle = '#E53935';
    ctx.beginPath();
    ctx.ellipse(player.x + player.width / 2, player.y + player.height * 0.6, player.width * 0.38, player.height * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ФСБ', player.x + player.width / 2, player.y + player.height * 0.24);
    ctx.textAlign = 'left';
  }

  ctx.restore();
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.globalAlpha = p.life / p.maxLife;
  ctx.fillStyle = p.color;
  ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  ctx.globalAlpha = 1;
}

function drawUI(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, 45);

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 18px "Press Start 2P", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`🍺 ${state.score}`, 20, 30);

  ctx.fillStyle = '#FF5252';
  ctx.textAlign = 'center';
  ctx.fillText(`❤️ x${state.lives}`, CANVAS_WIDTH / 2 - 80, 30);

  ctx.fillStyle = '#4CAF50';
  ctx.fillText(`L${state.currentLevel}`, CANVAS_WIDTH / 2 + 60, 30);

  const totalBeers = state.beers.length;
  const collected = state.beers.filter(b => b.collected).length;
  ctx.fillStyle = '#FFD700';
  ctx.textAlign = 'right';
  ctx.fillText(`${collected}/${totalBeers}`, CANVAS_WIDTH - 80, 30);

  ctx.textAlign = 'left';

  if (state.boss.active && state.boss.alive) {
    const pulse = 0.5 + 0.5 * Math.sin(state.time * 0.15);
    const bossColor = state.boss.type === 'general' ? '244, 67, 54' : '156, 39, 176';
    ctx.fillStyle = `rgba(${bossColor}, ${0.15 + pulse * 0.15})`;
    ctx.fillRect(0, 45, CANVAS_WIDTH, 25);
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 13px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    const bossText = state.boss.type === 'general'
      ? '⚠ БОСС: ТОЛСТЫЙ ГЕНЕРАЛ ⚠'
      : '⚠ БОСС: ТУРКМЕНСКИЙ СТАРЕЦ ⚠';
    ctx.fillText(bossText, CANVAS_WIDTH / 2, 63);
    ctx.textAlign = 'left';
  }

  if (state.gameWon) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 32px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🎉 БОСС ПОВЕРЖЕН! 🎉', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.textAlign = 'left';
  }
}

function drawMenuScreen(ctx: CanvasRenderingContext2D) {
  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  bgGrad.addColorStop(0, '#0a0a1e');
  bgGrad.addColorStop(0.5, '#1a0a2e');
  bgGrad.addColorStop(1, '#0a0a1e');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Neon red glow at top
  const time = Date.now();
  const pulse = 0.5 + 0.5 * Math.sin(time * 0.002);
  ctx.fillStyle = `rgba(255, 30, 60, ${0.08 + pulse * 0.05})`;
  ctx.fillRect(0, 0, CANVAS_WIDTH, 100);

  // Title
  ctx.save();
  ctx.shadowColor = '#FF3D00';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#FF5252';
  ctx.font = 'bold 42px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('🦀 ФСБ КРАБ 🦀', CANVAS_WIDTH / 2, 75);
  ctx.restore();

  // Subtitle
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 20px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ОХОТНИК ЗА AMBIRLAND', CANVAS_WIDTH / 2, 115);

  // Divider
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(150, 135);
  ctx.lineTo(CANVAS_WIDTH - 150, 135);
  ctx.stroke();

  // Story teaser
  ctx.fillStyle = '#FFF';
  ctx.font = '13px monospace';
  ctx.textAlign = 'center';
  const teaser = [
    'В стране АМБИРЛЕНДИЯ пропадает',
    'легендарное золотое пиво "AMBIRLAND".',
    '',
    'Агент ФСБ по кличке КРАСНЫЙ КРАБ',
    'должен раскрыть заговор пивоваров...',
  ];
  teaser.forEach((line, i) => {
    ctx.fillText(line, CANVAS_WIDTH / 2, 165 + i * 20);
  });

  // Level 1
  ctx.fillStyle = '#FF8C00';
  ctx.font = 'bold 12px "Press Start 2P", monospace';
  ctx.fillText('УРОВЕНЬ 1 — КАБИНЕТ 14', CANVAS_WIDTH / 2, 295);
  ctx.fillStyle = '#AAA';
  ctx.font = '11px monospace';
  ctx.fillText('Босс: Толстый Генерал', CANVAS_WIDTH / 2, 313);

  // Level 2
  ctx.fillStyle = '#9C27B0';
  ctx.font = 'bold 12px "Press Start 2P", monospace';
  ctx.fillText('УРОВЕНЬ 2 — БАР "13 RULES"', CANVAS_WIDTH / 2, 340);
  ctx.fillStyle = '#AAA';
  ctx.font = '11px monospace';
  ctx.fillText('Босс: Туркменский Старец', CANVAS_WIDTH / 2, 358);

  // Controls
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '10px monospace';
  ctx.fillText('← → или A/D — идти  |  ↑ / SPACE — прыжок  (х2 — двойной)', CANVAS_WIDTH / 2, 390);
  ctx.fillText('На телефоне: жми ⛶ для полного экрана', CANVAS_WIDTH / 2, 407);

  // Blinking start prompt
  const blink = Math.sin(time * 0.005) > 0;
  if (blink) {
    ctx.save();
    ctx.shadowColor = '#4CAF50';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#4CAF50';
    ctx.font = 'bold 18px "Press Start 2P", monospace';
    ctx.fillText('▶ НАЧАТЬ ИГРУ  (SPACE / TAP)', CANVAS_WIDTH / 2, 450);
    ctx.restore();
  }

  ctx.textAlign = 'left';
}

function drawStoryScreen(
  ctx: CanvasRenderingContext2D,
  title: string,
  text: string,
  page: number,
  totalPages: number,
  accentColor: string
) {
  const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  bgGrad.addColorStop(0, '#000');
  bgGrad.addColorStop(0.5, '#0a0a1e');
  bgGrad.addColorStop(1, '#000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = accentColor;
  ctx.font = 'bold 20px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(title, CANVAS_WIDTH / 2, 50);

  const dotY = 75;
  const dotSpacing = 15;
  const startX = CANVAS_WIDTH / 2 - ((totalPages - 1) * dotSpacing) / 2;
  for (let i = 0; i < totalPages; i++) {
    ctx.fillStyle = i === page ? accentColor : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(startX + i * dotSpacing, dotY, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#FFF';
  ctx.font = '15px monospace';
  const lines = text.split('\n');
  const lineHeight = 26;
  const totalHeight = lines.length * lineHeight;
  const startY = (CANVAS_HEIGHT - totalHeight) / 2 + 15;

  lines.forEach((line, i) => {
    if (/[А-ЯA-Z]{3,}/.test(line) && !/^\s*$/.test(line)) {
      ctx.fillStyle = accentColor;
      ctx.font = 'bold 17px monospace';
    } else {
      ctx.fillStyle = '#FFF';
      ctx.font = '15px monospace';
    }
    ctx.fillText(line, CANVAS_WIDTH / 2, startY + i * lineHeight);
  });

  const blink = Math.sin(Date.now() * 0.005) > 0;
  if (blink) {
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 12px "Press Start 2P", monospace';
    const promptText = page < totalPages - 1
      ? '▶ TAP / SPACE — ДАЛЬШЕ'
      : '▶ TAP / SPACE — НАЧАТЬ';
    ctx.fillText(promptText, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  }

  ctx.textAlign = 'left';
}

function drawGameOverScreen(ctx: CanvasRenderingContext2D, state: GameState) {
  const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  bgGrad.addColorStop(0, '#1a0000');
  bgGrad.addColorStop(1, '#000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = '#FF1744';
  ctx.font = 'bold 44px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('💀 ИГРА ОКОНЧЕНА 💀', CANVAS_WIDTH / 2, 180);

  ctx.fillStyle = '#FFF';
  ctx.font = '18px "Press Start 2P", monospace';
  ctx.fillText(`УРОВЕНЬ ${state.currentLevel}`, CANVAS_WIDTH / 2, 240);

  ctx.fillStyle = '#FFD700';
  ctx.font = '16px "Press Start 2P", monospace';
  ctx.fillText(`ОЧКИ: ${state.score}`, CANVAS_WIDTH / 2, 285);

  const blink = Math.sin(Date.now() * 0.005) > 0;
  if (blink) {
    ctx.fillStyle = '#4CAF50';
    ctx.font = 'bold 16px "Press Start 2P", monospace';
    ctx.fillText('SPACE / TAP — начать сначала', CANVAS_WIDTH / 2, 380);
  }

  ctx.textAlign = 'left';
}

export function renderMobileControls(ctx: CanvasRenderingContext2D, isFullscreen: boolean = false) {
  ctx.save();

  const btnY = CANVAS_HEIGHT - 75;
  const btnR = 40;

  ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(75, btnY, btnR, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.85;
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(75, btnY, btnR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('◀', 75, btnY);

  ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(210, btnY, btnR, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.85;
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(210, btnY, btnR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 32px Arial';
  ctx.fillText('▶', 210, btnY);

  const jumpX = CANVAS_WIDTH - 80;
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#4CAF50';
  ctx.beginPath();
  ctx.arc(jumpX, btnY, 48, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = '#FFF';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(jumpX, btnY, 48, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 14px "Press Start 2P", monospace';
  ctx.fillText('JUMP', jumpX, btnY - 4);
  ctx.font = 'bold 10px monospace';
  ctx.fillText('x2 = ↑↑', jumpX, btnY + 12);

  ctx.globalAlpha = 0.7;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.roundRect(CANVAS_WIDTH - 50, 8, 40, 34, 5);
  ctx.fill();
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(CANVAS_WIDTH - 50, 8, 40, 34, 5);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 22px Arial';
  ctx.fillText('⛶', CANVAS_WIDTH - 30, 27);

  if (!isFullscreen) {
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('FULL', CANVAS_WIDTH - 55, 22);
    ctx.fillText('SCREEN', CANVAS_WIDTH - 55, 32);
    ctx.textAlign = 'center';
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.globalAlpha = 1;
  ctx.restore();
}
