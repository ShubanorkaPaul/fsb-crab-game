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

  // Background image (parallax)
  if (bgImage && bgImage.complete) {
    const parallaxX = -(state.cameraX * 0.3) % CANVAS_WIDTH;
    ctx.globalAlpha = 0.4;
    ctx.drawImage(bgImage, parallaxX, 50, CANVAS_WIDTH, CANVAS_HEIGHT - 100);
    ctx.drawImage(bgImage, parallaxX + CANVAS_WIDTH, 50, CANVAS_WIDTH, CANVAS_HEIGHT - 100);
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
    // Ground with grass
    const grassGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.height);
    grassGrad.addColorStop(0, '#4CAF50');
    grassGrad.addColorStop(0.15, '#388E3C');
    grassGrad.addColorStop(0.15, '#8B4513');
    grassGrad.addColorStop(1, '#654321');
    ctx.fillStyle = grassGrad;
    ctx.fillRect(p.x, p.y, p.width, p.height);

    // Grass detail
    ctx.fillStyle = '#66BB6A';
    for (let gx = p.x; gx < p.x + p.width; gx += 12) {
      ctx.fillRect(gx, p.y - 2, 3, 5);
      ctx.fillRect(gx + 6, p.y - 1, 2, 4);
    }
  } else if (p.type === 'brick') {
    // Brick platform
    ctx.fillStyle = '#CD853F';
    ctx.fillRect(p.x, p.y, p.width, p.height);

    // Brick pattern
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

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(p.x, p.y, p.width, 2);
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(p.x, p.y + p.height - 2, p.width, 2);
  } else if (p.type === 'pipe') {
    // Pipe
    const pipeGrad = ctx.createLinearGradient(p.x, p.y, p.x + p.width, p.y);
    pipeGrad.addColorStop(0, '#2E7D32');
    pipeGrad.addColorStop(0.3, '#4CAF50');
    pipeGrad.addColorStop(0.7, '#388E3C');
    pipeGrad.addColorStop(1, '#1B5E20');
    ctx.fillStyle = pipeGrad;
    ctx.fillRect(p.x, p.y, p.width, p.height);

    // Pipe top rim
    ctx.fillRect(p.x - 5, p.y, p.width + 10, 15);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(p.x + 5, p.y + 15, 8, p.height - 15);
  }
}

function drawBeer(ctx: CanvasRenderingContext2D, beer: BeerCan, time: number) {
  const bobY = Math.sin(time * 0.05 + beer.bobOffset) * 5;
  const drawY = beer.y + bobY;

  if (beerImage && beerImage.complete) {
    ctx.drawImage(beerImage, beer.x, drawY, beer.width, beer.height);
  } else {
    // Fallback: draw beer can
    // Can body
    const canGrad = ctx.createLinearGradient(beer.x, drawY, beer.x + beer.width, drawY);
    canGrad.addColorStop(0, '#DAA520');
    canGrad.addColorStop(0.5, '#FFD700');
    canGrad.addColorStop(1, '#B8860B');
    ctx.fillStyle = canGrad;

    // Rounded rectangle for can
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

    // Label
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(beer.x + 2, drawY + 12, beer.width - 4, 20);

    // Text
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 7px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('AMBER', beer.x + beer.width / 2, drawY + 24);
    ctx.fillText('LAND', beer.x + beer.width / 2, drawY + 31);
    ctx.textAlign = 'left';

    // Top of can
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(beer.x + 3, drawY, beer.width - 6, 5);
  }

  // Glow effect
  ctx.save();
  ctx.globalAlpha = 0.2 + Math.sin(time * 0.1) * 0.1;
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 15;
  ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
  ctx.beginPath();
  ctx.arc(beer.x + beer.width / 2, drawY + beer.height / 2, beer.width * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy) {
  if (enemy.type === 'bottle') {
    // Vodka bottle enemy
    ctx.fillStyle = '#2196F3';
    ctx.fillRect(enemy.x + 5, enemy.y + 5, enemy.width - 10, enemy.height - 5);
    // Neck
    ctx.fillRect(enemy.x + 12, enemy.y - 8, enemy.width - 24, 15);
    // Cap
    ctx.fillStyle = '#F44336';
    ctx.fillRect(enemy.x + 14, enemy.y - 12, enemy.width - 28, 6);
    // Label
    ctx.fillStyle = '#fff';
    ctx.fillRect(enemy.x + 8, enemy.y + 12, enemy.width - 16, 14);
    // Eyes (angry)
    ctx.fillStyle = '#000';
    ctx.fillRect(enemy.x + 12, enemy.y + 14, 5, 5);
    ctx.fillRect(enemy.x + enemy.width - 17, enemy.y + 14, 5, 5);
    // Angry eyebrows
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
    // Rat enemy
    ctx.fillStyle = '#666';
    // Body
    ctx.beginPath();
    ctx.ellipse(enemy.x + enemy.width / 2, enemy.y + enemy.height - 12, enemy.width / 2 - 2, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    // Head
    ctx.beginPath();
    ctx.ellipse(enemy.vx < 0 ? enemy.x + 5 : enemy.x + enemy.width - 5, enemy.y + enemy.height - 18, 10, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    // Ears
    ctx.fillStyle = '#FF9800';
    const headX = enemy.vx < 0 ? enemy.x + 2 : enemy.x + enemy.width - 2;
    ctx.beginPath();
    ctx.arc(headX - 5, enemy.y + enemy.height - 28, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(headX + 5, enemy.y + enemy.height - 28, 5, 0, Math.PI * 2);
    ctx.fill();
    // Eyes
    ctx.fillStyle = '#F44336';
    const eyeX = enemy.vx < 0 ? enemy.x + 3 : enemy.x + enemy.width - 7;
    ctx.fillRect(eyeX, enemy.y + enemy.height - 20, 3, 3);
    // Tail
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

  if (crabImage && crabImage.complete) {
    // Draw the crab image
    if (!player.facingRight) {
      ctx.translate(player.x + player.width / 2, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(crabImage, -player.width / 2, player.y, player.width, player.height);
    } else {
      ctx.drawImage(crabImage, player.x, player.y, player.width, player.height);
    }
  } else {
    // Fallback: pixel art crab
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

  // Body (red crab)
  ctx.fillStyle = '#E53935';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h * 0.6, w * 0.38, h * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();

  // Darker shell detail
  ctx.fillStyle = '#C62828';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h * 0.55, w * 0.25, h * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Claws
  const clawBob = Math.sin(player.animTimer * 0.15) * 3;
  // Left claw
  ctx.fillStyle = '#EF5350';
  ctx.beginPath();
  ctx.ellipse(x + 5, y + h * 0.5 + clawBob, 10, 8, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#E53935';
  ctx.beginPath();
  ctx.ellipse(x + 2, y + h * 0.45 + clawBob, 6, 5, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Right claw
  ctx.fillStyle = '#EF5350';
  ctx.beginPath();
  ctx.ellipse(x + w - 5, y + h * 0.5 - clawBob, 10, 8, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#E53935';
  ctx.beginPath();
  ctx.ellipse(x + w - 2, y + h * 0.45 - clawBob, 6, 5, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Legs
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

  // Eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x + w * 0.35, y + h * 0.35, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w * 0.65, y + h * 0.35, 6, 0, Math.PI * 2);
  ctx.fill();

  // Eye stalks
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

  // Pupils
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(x + w * 0.37, y + h * 0.34, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w * 0.67, y + h * 0.34, 3, 0, Math.PI * 2);
  ctx.fill();

  // FSB Cap
  ctx.fillStyle = '#2E7D32';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h * 0.28, w * 0.35, 8, 0, Math.PI, 0);
  ctx.fill();
  // Cap top
  ctx.fillStyle = '#1B5E20';
  ctx.fillRect(x + w * 0.2, y + h * 0.12, w * 0.6, h * 0.16);
  // Cap brim
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h * 0.28, w * 0.4, 4, 0, 0, Math.PI);
  ctx.fill();
  // FSB text
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
  // Score background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, 45);

  // Score
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 20px "Press Start 2P", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`🍺 ${state.score}`, 20, 30);

  // Lives
  ctx.fillStyle = '#FF5252';
  ctx.textAlign = 'center';
  ctx.fillText(`❤️ x${state.lives}`, CANVAS_WIDTH / 2, 30);

  // Beer count
  const totalBeers = state.beers.length;
  const collected = state.beers.filter(b => b.collected).length;
  ctx.fillStyle = '#FFD700';
  ctx.textAlign = 'right';
  ctx.fillText(`${collected}/${totalBeers}`, CANVAS_WIDTH - 20, 30);

  ctx.textAlign = 'left';

  // Game over screen
  if (state.gameOver) {
    drawOverlay(ctx, '💀 GAME OVER 💀', '#FF1744', 'Press SPACE to restart');
  }

  // Win screen
  if (state.gameWon) {
    drawOverlay(ctx, '🎉 YOU WIN! 🎉', '#FFD700', `Score: ${state.score} | Press SPACE to restart`);
  }

  // Start screen
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

  // Title
  ctx.fillStyle = '#FF5252';
  ctx.font = 'bold 32px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('🦀 FSB CRAB 🦀', CANVAS_WIDTH / 2, 120);

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 20px "Press Start 2P", monospace';
  ctx.fillText('AMBERLAND HUNTER', CANVAS_WIDTH / 2, 160);

  // Instructions
  ctx.fillStyle = '#fff';
  ctx.font = '14px monospace';
  const instructions = [
    '← → or A/D - Move',
    '↑ or W or SPACE - Jump',
    'Collect all 🍺 beer cans!',
    'Jump on enemies to defeat them!',
    'Avoid falling into gaps!',
  ];

  instructions.forEach((text, i) => {
    ctx.fillText(text, CANVAS_WIDTH / 2, 220 + i * 28);
  });

  // Blink "Press Space"
  const blink = Math.sin(Date.now() * 0.005) > 0;
  if (blink) {
    ctx.fillStyle = '#4CAF50';
    ctx.font = 'bold 18px "Press Start 2P", monospace';
    ctx.fillText('Press SPACE to start!', CANVAS_WIDTH / 2, 410);
  }

  ctx.textAlign = 'left';
}

export function renderMobileControls(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.globalAlpha = 0.4;

  // Left button
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(70, CANVAS_HEIGHT - 60, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('◀', 70, CANVAS_HEIGHT - 52);

  // Right button
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(150, CANVAS_HEIGHT - 60, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.fillText('▶', 150, CANVAS_HEIGHT - 52);

  // Jump button
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(CANVAS_WIDTH - 80, CANVAS_HEIGHT - 60, 35, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.font = 'bold 20px Arial';
  ctx.fillText('JUMP', CANVAS_WIDTH - 80, CANVAS_HEIGHT - 55);

  ctx.textAlign = 'left';
  ctx.restore();
}
