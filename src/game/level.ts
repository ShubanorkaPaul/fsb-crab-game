import { BeerCan, Platform, Enemy, Cloud } from './types';
import {
  GROUND_Y,
  LEVEL_WIDTH,
  PLATFORM_HEIGHT,
  BEER_WIDTH,
  BEER_HEIGHT,
} from './constants';

export function createPlatforms(): Platform[] {
  const platforms: Platform[] = [];

  // Ground segments with gaps
  const groundSegments = [
    { x: 0, w: 800 },
    { x: 900, w: 600 },
    { x: 1600, w: 500 },
    { x: 2200, w: 700 },
    { x: 3000, w: 400 },
    { x: 3500, w: 600 },
    { x: 4200, w: 500 },
    { x: 4800, w: 1200 },
  ];

  for (const seg of groundSegments) {
    platforms.push({
      x: seg.x,
      y: GROUND_Y,
      width: seg.w,
      height: 60,
      type: 'ground',
    });
  }

  // Floating platforms (brick style)
  const floatingPlatforms = [
    { x: 300, y: 330, w: 120 },
    { x: 550, y: 260, w: 100 },
    { x: 200, y: 200, w: 80 },
    { x: 850, y: 350, w: 100 },
    { x: 1000, y: 280, w: 130 },
    { x: 1200, y: 220, w: 100 },
    { x: 1400, y: 310, w: 120 },
    { x: 1700, y: 340, w: 100 },
    { x: 1900, y: 260, w: 140 },
    { x: 2100, y: 200, w: 100 },
    { x: 2400, y: 320, w: 120 },
    { x: 2600, y: 250, w: 100 },
    { x: 2800, y: 180, w: 80 },
    { x: 3100, y: 310, w: 130 },
    { x: 3350, y: 240, w: 100 },
    { x: 3600, y: 330, w: 120 },
    { x: 3850, y: 260, w: 100 },
    { x: 4050, y: 200, w: 80 },
    { x: 4300, y: 310, w: 120 },
    { x: 4550, y: 250, w: 100 },
    { x: 4900, y: 320, w: 140 },
    { x: 5200, y: 250, w: 120 },
    { x: 5500, y: 300, w: 150 },
  ];

  for (const p of floatingPlatforms) {
    platforms.push({
      x: p.x,
      y: p.y,
      width: p.w,
      height: PLATFORM_HEIGHT,
      type: 'brick',
    });
  }

  // Pipes
  const pipes = [
    { x: 700, h: 80 },
    { x: 1550, h: 100 },
    { x: 2900, h: 70 },
    { x: 3450, h: 90 },
    { x: 4700, h: 80 },
    { x: 5700, h: 110 },
  ];

  for (const pipe of pipes) {
    platforms.push({
      x: pipe.x,
      y: GROUND_Y - pipe.h,
      width: 50,
      height: pipe.h,
      type: 'pipe',
    });
  }

  return platforms;
}

export function createBeers(): BeerCan[] {
  const positions = [
    { x: 350, y: 280 },
    { x: 570, y: 210 },
    { x: 220, y: 150 },
    { x: 450, y: GROUND_Y - BEER_HEIGHT - 5 },
    { x: 650, y: GROUND_Y - BEER_HEIGHT - 5 },
    { x: 870, y: 300 },
    { x: 1050, y: 230 },
    { x: 1250, y: 170 },
    { x: 1450, y: 260 },
    { x: 1750, y: 290 },
    { x: 1950, y: 210 },
    { x: 2150, y: 150 },
    { x: 2300, y: GROUND_Y - BEER_HEIGHT - 5 },
    { x: 2450, y: 270 },
    { x: 2650, y: 200 },
    { x: 2850, y: 130 },
    { x: 3050, y: GROUND_Y - BEER_HEIGHT - 5 },
    { x: 3150, y: 260 },
    { x: 3400, y: 190 },
    { x: 3650, y: 280 },
    { x: 3900, y: 210 },
    { x: 4100, y: 150 },
    { x: 4350, y: 260 },
    { x: 4600, y: 200 },
    { x: 4950, y: 270 },
    { x: 5250, y: 200 },
    { x: 5550, y: 250 },
    { x: 5800, y: GROUND_Y - BEER_HEIGHT - 5 },
    { x: 5900, y: GROUND_Y - BEER_HEIGHT - 5 },
    { x: 5950, y: GROUND_Y - BEER_HEIGHT - 100 },
  ];

  return positions.map((pos, i) => ({
    x: pos.x,
    y: pos.y,
    width: BEER_WIDTH,
    height: BEER_HEIGHT,
    collected: false,
    bobOffset: Math.random() * Math.PI * 2,
    id: i,
  }));
}

export function createEnemies(): Enemy[] {
  const enemies: Enemy[] = [
    { x: 500, y: GROUND_Y - 40, width: 40, height: 40, vx: -1.5, alive: true, type: 'bottle', animFrame: 0, animTimer: 0 },
    { x: 1100, y: GROUND_Y - 40, width: 40, height: 40, vx: -1.2, alive: true, type: 'rat', animFrame: 0, animTimer: 0 },
    { x: 1800, y: GROUND_Y - 40, width: 40, height: 40, vx: -1.8, alive: true, type: 'bottle', animFrame: 0, animTimer: 0 },
    { x: 2500, y: GROUND_Y - 40, width: 40, height: 40, vx: -1.5, alive: true, type: 'rat', animFrame: 0, animTimer: 0 },
    { x: 3200, y: GROUND_Y - 40, width: 40, height: 40, vx: -2, alive: true, type: 'bottle', animFrame: 0, animTimer: 0 },
    { x: 3800, y: GROUND_Y - 40, width: 40, height: 40, vx: -1.3, alive: true, type: 'rat', animFrame: 0, animTimer: 0 },
    { x: 4400, y: GROUND_Y - 40, width: 40, height: 40, vx: -1.6, alive: true, type: 'bottle', animFrame: 0, animTimer: 0 },
    { x: 5100, y: GROUND_Y - 40, width: 40, height: 40, vx: -1.4, alive: true, type: 'rat', animFrame: 0, animTimer: 0 },
    { x: 5600, y: GROUND_Y - 40, width: 40, height: 40, vx: -1.7, alive: true, type: 'bottle', animFrame: 0, animTimer: 0 },
  ];

  return enemies;
}

export function createClouds(): Cloud[] {
  const clouds: Cloud[] = [];
  for (let i = 0; i < 15; i++) {
    clouds.push({
      x: Math.random() * LEVEL_WIDTH,
      y: 30 + Math.random() * 100,
      width: 60 + Math.random() * 80,
      speed: 0.2 + Math.random() * 0.3,
    });
  }
  return clouds;
}
