import { GameState, Platform, BeerCan, Enemy, Player, Particle, Cloud } from './types';
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

  // Clear
  ctx.fillStyle = '#4a90d9';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Background gradient sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  skyGrad.addColorStop(0, '#1a1a4e');
  skyGrad.addColorStop(0.3, '#4a90d9');
  skyGrad.addColorStop(0.7, '#87CEEB');
  skyGrad.addColorStop(1, '#b8e6f0');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Background image (parallax) — stretched to full canvas
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

  // Draw clouds
  drawClouds(ctx, state.clouds, state.cameraX);

  // Camera transform
  ctx.save();
  ctx.translate(-state.cameraX, 0);

  // Draw platforms
  for (const p of state.platforms) {
    drawPlatform(ctx, p);
  }

  // Draw beer cans
  for (const beer of state.beers) {
    if (!beer.collected) {
      drawBeer(ctx, beer, state.time);
    }
  }

  // Draw enemies
  for (const enemy of state.enemies) {
    if (enemy.alive) {
      drawEnemy(ctx, enemy);
    }
  }

  // Draw particles
  for (const p of state.particles) {
    drawParticle(ctx, p);
  }

  // Draw player
  drawPlayer(ctx, state.player);

  ctx.restore();

  // UI overlay
  drawUI(ctx, state);

  ctx.restore();
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

  // Glow effect BEHIND the can
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
    ctx.fillText('AMBER', beer.x + beer.width / 2, drawY + 24);
    ctx.fillText('LAND', beer.x + beer.width / 2, drawY + 31);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(beer.x + 3, drawY, beer.width - 6, 5);
  }
}

function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy) {
  if (enemy.type === 'bottle') {
    ctx.fillStyle = '#2196F3';
    ctx.fillRect(enemy.x + 5, enemy.y + 5, enemy.width - 10, enemy.height - 5);
    ctx.fillRect(enemy.x + 12, enemy.y - 8, enemy.width - 24, 15);
    ctx.fillStyle = '#F44336';
    ctx.fillRect(enemy.x + 14, enemy.y - 12, enemy.width - 28, 6);
    ctx.fillStyle = '#fff';
    ctx.fillRect(enemy.x + 8, enemy.y + 12, enemy.width - 16, 14);
    ctx.fillStyle = '#000';
    ctx.fillRect(enemy.x + 12, enemy.y + 14, 5, 5);
    ctx.fillRect(enemy.x + enemy.width - 17, enemy.y + 14, 5, 5);
    ctx.strokeStyle = '#F44336';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(enemy.x + 10, enemy.y + 13);
    ctx.lineTo(enemy.x + 18, enemy.y + 15);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(enemy.x + enemy.width - 10, enemy.y + 13);
    ctx.lineTo(enemy.x + enemy.width - 18, enemy.y + 15);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#666';
    ctx.beginPath();
    ctx.ellipse(enemy.x + enemy.width / 2, enemy.y + enemy.height - 12, enemy.width / 2 - 2, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(enemy.vx < 0 ? enemy.x + 5 : enemy.x + enemy.width - 5, enemy.y + enemy.height - 18, 10, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FF9800';
    const headX = enemy.vx < 0 ? enemy.x + 2 : enemy.x + enemy.width - 2;
    ctx.beginPath();
    ctx.arc(headX - 5, enemy.y + enemy.height - 28, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(headX + 5, enemy.y + enemy.height - 28, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F44336';
    const eyeX = enemy.vx < 0 ? enemy.x + 3 : enemy.x + enemy.width - 7;
    ctx.fillRect(eyeX, enemy.y + enemy.height - 20, 3, 3);
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const tailStart = enemy.vx < 0 ? enemy.x + enemy.width - 3 : enemy.x + 3;
    const tailEnd = enemy.vx < 0 ? enemy.x + enemy.width + 15 : enemy.x - 15;
    ctx.moveTo(tailStart, enemy.y + enemy.height - 10);
    ctx.quadraticCurveTo(tailEnd, enemy.y + enemy.height - 25, tailEnd, enemy.y + enemy.height - 5);
    ctx.stroke();
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: Player) {
  ctx.save();

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

  if (state.gameOver) {
    drawOverlay(ctx, '💀 GAME OVER 💀', '#FF1744', 'Press SPACE / Tap to restart');
  }

  if (state.gameWon) {
    drawOverlay(ctx, '🎉 YOU WIN! 🎉', '#FFD700', `Score: ${state.score} | Tap to restart`);
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
  ctx.font = '16px "Press Start 2P", monospace';
  ctx.fillText(subtitle, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  ctx.textAlign = 'left';
}

function drawStartScreen(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = '#FF5252';
  ctx.font = 'bold 32px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('🦀 FSB CRAB 🦀', CANVAS_WIDTH / 2, 100);

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 20px "Press Start 2P", monospace';
  ctx.fillText('AMBERLAND HUNTER', CANVAS_WIDTH / 2, 140);

  ctx.fillStyle = '#fff';
  ctx.font = '14px monospace';
  const instructions = [
    '← → or A/D — Move',
    '↑ or W or SPACE — Jump',
    'Press JUMP twice for DOUBLE JUMP!',
    'On phone: use on-screen buttons',
    'Collect all 🍺 beer cans!',
    'Jump on enemies to defeat them!',
  ];

  instructions.forEach((text, i) => {
    ctx.fillText(text, CANVAS_WIDTH / 2, 200 + i * 26);
  });

  const blink = Math.sin(Date.now() * 0.005) > 0;
  if (blink) {
    ctx.fillStyle = '#4CAF50';
    ctx.font = 'bold 18px "Press Start 2P", monospace';
    ctx.fillText('Press SPACE / Tap to start!', CANVAS_WIDTH / 2, 430);
  }

  ctx.textAlign = 'left';
}

export function renderMobileControls(ctx: CanvasRenderingContext2D) {
  ctx.save();

  const btnY = CANVAS_HEIGHT - 65;
  const btnR = 45;

  // ==== LEFT BUTTON ====
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

  // ==== RIGHT BUTTON ====
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

  // ==== JUMP BUTTON (right side, bigger) ====
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
