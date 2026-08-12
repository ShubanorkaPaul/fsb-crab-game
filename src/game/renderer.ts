import { GameState, Platform, BeerCan, Enemy, Player, Particle, Cloud, Boss, Projectile } from './types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from './constants';

let crabImage: HTMLImageElement | null = null;
let beerImage: HTMLImageElement | null = null;
let bgImage: HTMLImageElement | null = null;
let imagesLoaded = 0;

export function loadImages() {
  crabImage = new Image();
  crabImage.src = '/images/crab-fsb.png';
  crabImage.onload = () => imagesLoaded++;

  beerImage = new Image();
  beerImage.src = '/images/beer-can.png';
  beerImage.onload = () => imagesLoaded++;

  bgImage = new Image();
  bgImage.src = '/images/background.png';
  bgImage.onload = () => imagesLoaded++;
}

export function render(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.save();

  ctx.fillStyle = '#4a90d9';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  skyGrad.addColorStop(0, '#1a1a4e');
  skyGrad.addColorStop(0.3, '#4a90d9');
  skyGrad.addColorStop(0.7, '#87CEEB');
  skyGrad.addColorStop(1, '#b8e6f0');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (bgImage && bgImage.complete && bgImage.naturalWidth > 0) {
    const imgRatio = bgImage.naturalWidth / bgImage.naturalHeight;
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
    ctx.drawImage(bgImage, parallaxX, offsetY, drawW, drawH);
    ctx.drawImage(bgImage, parallaxX + drawW, offsetY, drawW, drawH);
    if (parallaxX + drawW * 2 < CANVAS_WIDTH) {
      ctx.drawImage(bgImage, parallaxX + drawW * 2, offsetY, drawW, drawH);
    }
    ctx.globalAlpha = 1;
  }

  drawClouds(ctx, state.clouds, state.cameraX);

  ctx.save();
  ctx.translate(-state.cameraX, 0);

  // Boss arena marker
  if (state.boss.alive || state.boss.active) {
    drawArenaMarker(ctx, state.boss);
  }

  for (const p of state.platforms) {
    drawPlatform(ctx, p);
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

  // Boss
  if (state.boss.alive) {
    drawBoss(ctx, state.boss, state.time);
  }

  // Projectiles
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

function drawArenaMarker(ctx: CanvasRenderingContext2D, boss: Boss) {
  // Faint red glow on ground of arena
  const g = ctx.createLinearGradient(boss.arenaLeft, 400, boss.arenaLeft, 460);
  g.addColorStop(0, 'rgba(255, 0, 0, 0)');
  g.addColorStop(1, 'rgba(255, 0, 0, 0.25)');
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

function drawPlatform(ctx: CanvasRenderingContext2D, p: Platform) {
  if (p.type === 'ground') {
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
  } else if (p.type === 'brick') {
    ctx.fillStyle = '#CD853F';
    ctx.fillRect(p.x, p.y, p.width, p.height);

    ctx.strokeStyle = '#8B6914';
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
    const canGrad = ctx.createLinearGradient(beer.x, drawY, beer.x + beer.width, drawY);
    canGrad.addColorStop(0, '#DAA520');
    canGrad.addColorStop(0.5, '#FFD700');
    canGrad.addColorStop(1, '#B8860B');
    ctx.fillStyle = canGrad;

    const r = 5;
    ctx.beginPath();
    ctx.moveTo(beer.x + r, drawY);
    ctx.lineTo(beer.x + beer.width - r, drawY);
    ctx.quadraticCurveTo(beer.x + beer.width, drawY, beer.x + beer.width, drawY + r);
    ctx.lineTo(beer.x + beer.width, drawY + beer.height - r);
    ctx.quadraticCurveTo(beer.x + beer.width, drawY + beer.height, beer.x + beer.width - r, drawY + beer.height);
    ctx.lineTo(beer.x + r, drawY + beer.height);
    ctx.quadraticCurveTo(beer.x, drawY + beer.height, beer.x, drawY + beer.height - r);
    ctx.lineTo(beer.x, drawY + r);
    ctx.quadraticCurveTo(beer.x, drawY, beer.x + r, drawY);
    ctx.fill();

    ctx.fillStyle = '#8B0000';
    ctx.fillRect(beer.x + 2, drawY + 12, beer.width - 4, 20);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 7px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('AMBIR', beer.x + beer.width / 2, drawY + 24);
    ctx.fillText('LAND', beer.x + beer.width / 2, drawY + 31);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(beer.x + 3, drawY, beer.width - 6, 5);
  }
}

function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy) {
  switch (enemy.type) {
    case 'bottle': drawBottle(ctx, enemy); break;
    case 'rat':    drawRat(ctx, enemy);    break;
    case 'crow':   drawDrone(ctx, enemy);  break; // renamed: drone
    case 'mine':   drawMine(ctx, enemy);   break;
    case 'ninja':  drawCossack(ctx, enemy); break; // renamed: Ukrainian cossack
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

/**
 * DRONE (replaces crow) — quadcopter with spinning propellers.
 * Drops mines occasionally (handled in engine).
 */
function drawDrone(ctx: CanvasRenderingContext2D, e: Enemy) {
  const cx = e.x + e.width / 2;
  const cy = e.y + e.height / 2;

  // Central body — dark gray box
  ctx.fillStyle = '#37474F';
  ctx.beginPath();
  ctx.roundRect(cx - 14, cy - 6, 28, 14, 3);
  ctx.fill();

  // Camera lens (front)
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(cx + (e.vx < 0 ? -12 : 12), cy + 1, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#F44336';
  ctx.beginPath();
  ctx.arc(cx + (e.vx < 0 ? -12 : 12), cy + 1, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Arms to propellers
  ctx.strokeStyle = '#455A64';
  ctx.lineWidth = 3;
  const armEnds = [
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

  // Spinning propellers (blur effect)
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = '#B0BEC5';
  ctx.lineWidth = 2;
  for (const [ax, ay] of armEnds) {
    ctx.beginPath();
    ctx.ellipse(ax, ay, 10, 3, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Blinking status LED
  const blink = Math.floor(e.animTimer / 15) % 2 === 0;
  ctx.fillStyle = blink ? '#00E676' : '#004D40';
  ctx.beginPath();
  ctx.arc(cx, cy - 4, 2, 0, Math.PI * 2);
  ctx.fill();

  // Small hanging mine below
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

  // Body — dark sphere
  ctx.fillStyle = '#212121';
  ctx.beginPath();
  ctx.arc(cx, cy, e.width / 2 - 2, 0, Math.PI * 2);
  ctx.fill();

  // Metallic highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.arc(cx - 5, cy - 5, 5, 0, Math.PI * 2);
  ctx.fill();

  // Spikes around
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

  // Blinking red danger light
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

/**
 * COSSACK (replaces ninja) — Ukrainian guy with mustaches, oseledets and vyshyvanka.
 */
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

  // Baggy red trousers (шаровары)
  ctx.fillStyle = '#B71C1C';
  ctx.beginPath();
  ctx.moveTo(e.x + 3, bodyBottom);
  ctx.lineTo(e.x + e.width - 3, bodyBottom);
  ctx.lineTo(e.x + e.width - 6, bodyTop + 18);
  ctx.lineTo(e.x + 6, bodyTop + 18);
  ctx.closePath();
  ctx.fill();

  // Boots — dark brown
  ctx.fillStyle = '#3E2723';
  ctx.fillRect(e.x + 5, bodyBottom - 6, 12, 6);
  ctx.fillRect(e.x + e.width - 17, bodyBottom - 6, 12, 6);

  // Vyshyvanka (white shirt with red embroidery)
  ctx.fillStyle = '#FAFAFA';
  ctx.fillRect(e.x + 6, bodyTop, e.width - 12, 20);

  // Red embroidery pattern on collar
  ctx.fillStyle = '#D32F2F';
  ctx.fillRect(e.x + 6, bodyTop, e.width - 12, 3);
  ctx.fillRect(e.x + 6, bodyTop + 6, e.width - 12, 1);
  // Small stitches
  for (let sx = e.x + 8; sx < e.x + e.width - 8; sx += 4) {
    ctx.fillRect(sx, bodyTop + 4, 2, 1);
  }

  // Yellow belt
  ctx.fillStyle = '#FFD600';
  ctx.fillRect(e.x + 5, bodyTop + 18, e.width - 10, 3);

  // Head — skin tone
  ctx.fillStyle = '#FFCC80';
  ctx.beginPath();
  ctx.arc(cx, e.y + 10, 9, 0, Math.PI * 2);
  ctx.fill();

  // OSELEDETS (chub / topknot) — hair tuft on shaved head
  ctx.fillStyle = '#5D4037';
  ctx.beginPath();
  ctx.ellipse(cx - 4, e.y + 2, 4, 5, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx - 6, e.y + 6, 5, 3, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(cx - 3, e.y + 9, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 3, e.y + 9, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // MUSTACHE — big drooping (украинские усы)
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
  // Center piece of mustache
  ctx.beginPath();
  ctx.moveTo(cx - 6, e.y + 13);
  ctx.lineTo(cx + 6, e.y + 13);
  ctx.stroke();
  ctx.lineCap = 'butt';

  // Angry eyebrows
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

  // Small yellow/blue flag patch on chest
  ctx.fillStyle = '#0057B7';
  ctx.fillRect(e.x + e.width - 14, bodyTop + 8, 6, 3);
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(e.x + e.width - 14, bodyTop + 11, 6, 3);

  ctx.restore();
}

function drawBoss(ctx: CanvasRenderingContext2D, boss: Boss, time: number) {
  ctx.save();

  // Invulnerability flash
  if (boss.invulnTimer > 0 && Math.floor(boss.invulnTimer / 5) % 2 === 0) {
    ctx.globalAlpha = 0.5;
  }

  const flip = !boss.facingRight;
  if (flip) {
    ctx.translate(boss.x + boss.width / 2, 0);
    ctx.scale(-1, 1);
    ctx.translate(-(boss.x + boss.width / 2), 0);
  }

  const cx = boss.x + boss.width / 2;
  const bodyTop = boss.y + 45;

  // Legs — dark green trousers
  ctx.fillStyle = '#2E4A1E';
  ctx.fillRect(boss.x + 20, boss.y + boss.height - 30, 25, 30);
  ctx.fillRect(boss.x + boss.width - 45, boss.y + boss.height - 30, 25, 30);

  // Boots
  ctx.fillStyle = '#1B1B1B';
  ctx.fillRect(boss.x + 18, boss.y + boss.height - 8, 28, 8);
  ctx.fillRect(boss.x + boss.width - 47, boss.y + boss.height - 8, 28, 8);

  // BIG belly — army green tunic
  const bellyGrad = ctx.createRadialGradient(cx, bodyTop + 30, 5, cx, bodyTop + 30, 55);
  bellyGrad.addColorStop(0, '#5C7A3E');
  bellyGrad.addColorStop(1, '#3E5528');
  ctx.fillStyle = bellyGrad;
  ctx.beginPath();
  ctx.ellipse(cx, bodyTop + 30, 48, 40, 0, 0, Math.PI * 2);
  ctx.fill();

  // Buttons on tunic
  ctx.fillStyle = '#FFD700';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(cx, bodyTop + 15 + i * 12, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Golden belt
  ctx.fillStyle = '#8B6914';
  ctx.fillRect(boss.x + 8, bodyTop + 55, boss.width - 16, 8);
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(cx - 8, bodyTop + 55, 16, 8);
  // Belt shine
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(boss.x + 8, bodyTop + 56, boss.width - 16, 2);

  // Shoulder epaulettes with stars
  ctx.fillStyle = '#8B0000';
  ctx.fillRect(boss.x + 10, bodyTop + 5, 25, 8);
  ctx.fillRect(boss.x + boss.width - 35, bodyTop + 5, 25, 8);
  ctx.fillStyle = '#FFD700';
  // Stars on epaulettes
  drawStar(ctx, boss.x + 22, bodyTop + 9, 3);
  drawStar(ctx, boss.x + boss.width - 22, bodyTop + 9, 3);

  // Arms
  ctx.fillStyle = '#3E5528';
  ctx.beginPath();
  ctx.ellipse(boss.x + 10, bodyTop + 30, 10, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(boss.x + boss.width - 10, bodyTop + 30, 10, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hands
  ctx.fillStyle = '#FFCC80';
  ctx.beginPath();
  ctx.arc(boss.x + 8, bodyTop + 50, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(boss.x + boss.width - 8, bodyTop + 50, 6, 0, Math.PI * 2);
  ctx.fill();

  // Head — round chubby face
  ctx.fillStyle = '#FFCC80';
  ctx.beginPath();
  ctx.arc(cx, boss.y + 30, 22, 0, Math.PI * 2);
  ctx.fill();

  // Cheeks (red — angry / drunk)
  ctx.fillStyle = 'rgba(244, 67, 54, 0.4)';
  ctx.beginPath();
  ctx.arc(cx - 12, boss.y + 34, 5, 0, Math.PI * 2);
  ctx.arc(cx + 12, boss.y + 34, 5, 0, Math.PI * 2);
  ctx.fill();

  // Small angry eyes
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(cx - 7, boss.y + 27, 2, 0, Math.PI * 2);
  ctx.arc(cx + 7, boss.y + 27, 2, 0, Math.PI * 2);
  ctx.fill();

  // Angry eyebrows
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

  // HUGE MUSTACHE (генеральские усы)
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

  // Officer cap (fуражка) — huge Soviet-style
  ctx.fillStyle = '#2E4A1E';
  ctx.beginPath();
  ctx.ellipse(cx, boss.y + 10, 26, 8, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(cx - 26, boss.y + 10, 52, 4);

  // Red band on cap
  ctx.fillStyle = '#B71C1C';
  ctx.fillRect(cx - 26, boss.y + 12, 52, 3);

  // Black brim
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(cx, boss.y + 17, 30, 3, 0, 0, Math.PI);
  ctx.fill();

  // Golden badge with star on cap
  ctx.fillStyle = '#FFD700';
  drawStar(ctx, cx, boss.y + 8, 5);

  ctx.restore();

  // Health bar above boss (always upright, no flip)
  drawBossHealthBar(ctx, boss);
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
  const barW = 100;
  const barH = 10;
  const bx = boss.x + boss.width / 2 - barW / 2;
  const by = boss.y - 20;

  // Background
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(bx - 2, by - 2, barW + 4, barH + 4);

  // Empty bar
  ctx.fillStyle = '#3E1010';
  ctx.fillRect(bx, by, barW, barH);

  // Filled portion
  const pct = boss.hp / boss.maxHp;
  const hpColor = pct > 0.66 ? '#4CAF50' : pct > 0.33 ? '#FFC107' : '#F44336';
  ctx.fillStyle = hpColor;
  ctx.fillRect(bx, by, barW * pct, barH);

  // HP text
  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`BOSS: ${boss.hp}/${boss.maxHp}`, boss.x + boss.width / 2, by - 6);
  ctx.textAlign = 'left';
}

function drawProjectile(ctx: CanvasRenderingContext2D, p: Projectile) {
  ctx.save();
  ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
  ctx.rotate(p.rotation);

  if (p.type === 'document') {
    // Paper document
    ctx.fillStyle = '#F5DEB3';
    ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 1;
    ctx.strokeRect(-p.width / 2, -p.height / 2, p.width, p.height);
    // Lines of text
    ctx.strokeStyle = '#5D4037';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-p.width / 2 + 3, -p.height / 2 + 4 + i * 4);
      ctx.lineTo(p.width / 2 - 3, -p.height / 2 + 4 + i * 4);
      ctx.stroke();
    }
    // Red stamp
    ctx.fillStyle = 'rgba(198,40,40,0.8)';
    ctx.beginPath();
    ctx.arc(p.width / 2 - 5, -p.height / 2 + 4, 3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // "Poop" from drone — actually a mini bomb/mine now
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(0, 0, p.width / 2, 0, Math.PI * 2);
    ctx.fill();
    // Small spikes
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
    // Blinking light
    ctx.fillStyle = '#FF1744';
    ctx.beginPath();
    ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: Player, _time: number) {
  ctx.save();

  // Blink when invulnerable
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
    drawPixelCrab(ctx, player);
  }

  ctx.restore();
}

function drawPixelCrab(ctx: CanvasRenderingContext2D, player: Player) {
  const x = player.x;
  const y = player.y;
  const w = player.width;
  const h = player.height;

  const flip = !player.facingRight;
  ctx.save();
  if (flip) {
    ctx.translate(x + w / 2, 0);
    ctx.scale(-1, 1);
    ctx.translate(-(x + w / 2), 0);
  }

  ctx.fillStyle = '#E53935';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h * 0.6, w * 0.38, h * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#C62828';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h * 0.55, w * 0.25, h * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();

  const clawBob = Math.sin(player.animTimer * 0.15) * 3;
  ctx.fillStyle = '#EF5350';
  ctx.beginPath();
  ctx.ellipse(x + 5, y + h * 0.5 + clawBob, 10, 8, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#E53935';
  ctx.beginPath();
  ctx.ellipse(x + 2, y + h * 0.45 + clawBob, 6, 5, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#EF5350';
  ctx.beginPath();
  ctx.ellipse(x + w - 5, y + h * 0.5 - clawBob, 10, 8, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#E53935';
  ctx.beginPath();
  ctx.ellipse(x + w - 2, y + h * 0.45 - clawBob, 6, 5, 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#D32F2F';
  ctx.lineWidth = 2;
  const legAnim = Math.sin(player.animTimer * 0.2) * 4;
  for (let i = 0; i < 3; i++) {
    const lx = x + w * 0.3 + i * 8;
    ctx.beginPath();
    ctx.moveTo(lx, y + h * 0.75);
    ctx.lineTo(lx - 5, y + h - 2 + (i % 2 === 0 ? legAnim : -legAnim));
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + w - (w * 0.3 + i * 8), y + h * 0.75);
    ctx.lineTo(x + w - (w * 0.3 + i * 8) + 5, y + h - 2 + (i % 2 === 0 ? -legAnim : legAnim));
    ctx.stroke();
  }

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x + w * 0.35, y + h * 0.35, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w * 0.65, y + h * 0.35, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#E53935';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.35, y + h * 0.45);
  ctx.lineTo(x + w * 0.35, y + h * 0.35);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + w * 0.65, y + h * 0.45);
  ctx.lineTo(x + w * 0.65, y + h * 0.35);
  ctx.stroke();

  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(x + w * 0.37, y + h * 0.34, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w * 0.67, y + h * 0.34, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2E7D32';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h * 0.28, w * 0.35, 8, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#1B5E20';
  ctx.fillRect(x + w * 0.2, y + h * 0.12, w * 0.6, h * 0.16);
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h * 0.28, w * 0.4, 4, 0, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 9px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('FSB', x + w / 2, y + h * 0.24);
  ctx.textAlign = 'left';

  ctx.restore();
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.globalAlpha = p.life / p.maxLife;
  ctx.fillStyle = p.color;
  ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  ctx.globalAlpha = 1;
}

function drawUI(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, 45);

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 20px "Press Start 2P", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`🍺 ${state.score}`, 20, 30);

  ctx.fillStyle = '#FF5252';
  ctx.textAlign = 'center';
  ctx.fillText(`❤️ x${state.lives}`, CANVAS_WIDTH / 2, 30);

  const totalBeers = state.beers.length;
  const collected = state.beers.filter(b => b.collected).length;
  ctx.fillStyle = '#FFD700';
  ctx.textAlign = 'right';
  ctx.fillText(`${collected}/${totalBeers}`, CANVAS_WIDTH - 20, 30);

  ctx.textAlign = 'left';

  // Boss warning banner
  if (state.boss.active && state.boss.alive) {
    const pulse = 0.5 + 0.5 * Math.sin(state.time * 0.15);
    ctx.fillStyle = `rgba(244, 67, 54, ${0.15 + pulse * 0.15})`;
    ctx.fillRect(0, 45, CANVAS_WIDTH, 25);
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 14px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚠ GENERAL BOSS FIGHT ⚠', CANVAS_WIDTH / 2, 63);
    ctx.textAlign = 'left';
  }

  if (state.gameOver) {
    drawOverlay(ctx, '💀 GAME OVER 💀', '#FF1744', 'Press SPACE / Tap to restart');
  }

  if (state.gameWon) {
    drawOverlay(ctx, '🎉 VICTORY! 🎉', '#FFD700', `Boss defeated! Score: ${state.score} | Tap to restart`);
  }

  if (!state.gameStarted) {
    drawStartScreen(ctx);
  }
}

function drawOverlay(ctx: CanvasRenderingContext2D, title: string, color: string, subtitle: string) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = color;
  ctx.font = 'bold 36px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(title, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

  ctx.fillStyle = '#fff';
  ctx.font = '14px "Press Start 2P", monospace';
  ctx.fillText(subtitle, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  ctx.textAlign = 'left';
}

function drawStartScreen(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = '#FF5252';
  ctx.font = 'bold 32px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('🦀 FSB CRAB 🦀', CANVAS_WIDTH / 2, 80);

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 20px "Press Start 2P", monospace';
  ctx.fillText('AMBIRLAND HUNTER', CANVAS_WIDTH / 2, 115);

  ctx.fillStyle = '#fff';
  ctx.font = '13px monospace';
  const instructions = [
    '← → or A/D — Move | ↑ / W / SPACE — Jump',
    'Press JUMP twice for DOUBLE JUMP!',
    '',
    'ENEMIES: 🍾 Bottle · 🐀 Rat · 🛸 Drone',
    '         💣 Mine · 🇺🇦 Cossack',
    '',
    'FINAL BOSS: 🎖 Fat General',
    'Stomp him 3 times to WIN!',
    '',
    'Collect 🍺 beers for bonus points',
  ];

  instructions.forEach((text, i) => {
    ctx.fillText(text, CANVAS_WIDTH / 2, 155 + i * 22);
  });

  const blink = Math.sin(Date.now() * 0.005) > 0;
  if (blink) {
    ctx.fillStyle = '#4CAF50';
    ctx.font = 'bold 16px "Press Start 2P", monospace';
    ctx.fillText('Press SPACE / Tap to start!', CANVAS_WIDTH / 2, 440);
  }

  ctx.textAlign = 'left';
}

export function renderMobileControls(ctx: CanvasRenderingContext2D) {
  ctx.save();

  const btnY = CANVAS_HEIGHT - 65;
  const btnR = 45;

  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(85, btnY, btnR, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.85;
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(85, btnY, btnR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('◀', 85, btnY);

  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(225, btnY, btnR, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.85;
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(225, btnY, btnR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 36px Arial';
  ctx.fillText('▶', 225, btnY);

  const jumpX = CANVAS_WIDTH - 90;
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#4CAF50';
  ctx.beginPath();
  ctx.arc(jumpX, btnY, 55, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = '#FFF';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(jumpX, btnY, 55, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 16px "Press Start 2P", monospace';
  ctx.fillText('JUMP', jumpX, btnY - 4);
  ctx.font = 'bold 12px monospace';
  ctx.fillText('x2 = ↑↑', jumpX, btnY + 16);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.restore();
}
