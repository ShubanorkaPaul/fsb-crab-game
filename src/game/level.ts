import { BeerCan, Platform, Enemy, Cloud, Boss } from './types';
import {
  GROUND_Y,
  PLATFORM_HEIGHT,
  BEER_WIDTH,
  BEER_HEIGHT,
  L1_BOSS_ARENA_LEFT,
  L1_BOSS_ARENA_RIGHT,
  BOSS_WIDTH,
  BOSS_HEIGHT,
  L1_BOSS_HP,
} from './constants';

export function createPlatforms(): Platform[] {
  const platforms: Platform[] = [];

  platforms.push({ x: 0, y: GROUND_Y, width: 1200, height: 60, type: 'ground' });
  platforms.push({ x: 1320, y: GROUND_Y, width: 800, height: 60, type: 'ground' });
  platforms.push({ x: 2220, y: GROUND_Y, width: 500, height: 60, type: 'ground' });
  platforms.push({ x: 2820, y: GROUND_Y, width: 400, height: 60, type: 'ground' });
  platforms.push({ x: 3320, y: GROUND_Y, width: 600, height: 60, type: 'ground' });
  platforms.push({ x: 4020, y: GROUND_Y, width: 350, height: 60, type: 'ground' });
  platforms.push({ x: 4470, y: GROUND_Y, width: 500, height: 60, type: 'ground' });
  platforms.push({ x: 5070, y: GROUND_Y, width: 400, height: 60, type: 'ground' });
  platforms.push({ x: 5570, y: GROUND_Y, width: 700, height: 60, type: 'ground' });
  platforms.push({ x: 6370, y: GROUND_Y, width: 500, height: 60, type: 'ground' });
  platforms.push({ x: L1_BOSS_ARENA_LEFT - 130, y: GROUND_Y, width: 1130, height: 60, type: 'ground' });

  const floating = [
    { x: 250, y: 340, w: 120 },
    { x: 450, y: 270, w: 100 },
    { x: 650, y: 320, w: 100 },
    { x: 850, y: 250, w: 120 },
    { x: 1050, y: 320, w: 100 },
    { x: 1220, y: 300, w: 90 },
    { x: 1450, y: 280, w: 100 },
    { x: 1650, y: 220, w: 90 },
    { x: 1850, y: 300, w: 100 },
    { x: 2050, y: 250, w: 90 },
    { x: 2130, y: 320, w: 90 },
    { x: 2740, y: 320, w: 80 },
    { x: 2380, y: 260, w: 100 },
    { x: 2580, y: 200, w: 90 },
    { x: 2900, y: 290, w: 100 },
    { x: 3080, y: 220, w: 90 },
    { x: 3240, y: 320, w: 80 },
    { x: 3430, y: 260, w: 100 },
    { x: 3630, y: 200, w: 90 },
    { x: 3820, y: 280, w: 100 },
    { x: 3950, y: 340, w: 60 },
    { x: 4180, y: 250, w: 100 },
    { x: 4380, y: 300, w: 90 },
    { x: 4400, y: 340, w: 70 },
    { x: 4580, y: 220, w: 100 },
    { x: 4780, y: 280, w: 90 },
    { x: 5000, y: 340, w: 60 },
    { x: 5150, y: 250, w: 100 },
    { x: 5350, y: 300, w: 90 },
    { x: 5620, y: 280, w: 100 },
    { x: 5820, y: 220, w: 100 },
    { x: 6020, y: 290, w: 90 },
    { x: 6320, y: 320, w: 80 },
    { x: 6450, y: 250, w: 100 },
    { x: 6700, y: 290, w: 100 },
  ];

  for (const p of floating) {
    platforms.push({
      x: p.x,
      y: p.y,
      width: p.w,
      height: PLATFORM_HEIGHT,
      type: 'brick',
    });
  }

  const pipes = [
    { x: 550, h: 70 },
    { x: 1100, h: 90 },
    { x: 1750, h: 80 },
    { x: 2400, h: 100 },
    { x: 3000, h: 70 },
    { x: 3500, h: 90 },
    { x: 4100, h: 80 },
    { x: 4700, h: 100 },
    { x: 5300, h: 70 },
    { x: 5900, h: 90 },
    { x: 6500, h: 80 },
    { x: 6920, h: 110 },
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
    { x: 200, y: GROUND_Y - BEER_HEIGHT - 5 },
    { x: 280, y: 280 },
    { x: 490, y: 210 },
    { x: 700, y: 260 },
    { x: 880, y: 190 },
    { x: 1080, y: 260 },
    { x: 1240, y: 240 },
    { x: 1480, y: 220 },
    { x: 1680, y: 160 },
    { x: 1880, y: 240 },
    { x: 2080, y: 190 },
    { x: 2410, y: 200 },
    { x: 2610, y: 140 },
    { x: 2930, y: 230 },
    { x: 3110, y: 160 },
    { x: 3460, y: 200 },
    { x: 3660, y: 140 },
    { x: 3850, y: 220 },
    { x: 4210, y: 190 },
    { x: 4410, y: 240 },
    { x: 4610, y: 160 },
    { x: 4810, y: 220 },
    { x: 5180, y: 190 },
    { x: 5380, y: 240 },
    { x: 5650, y: 220 },
    { x: 5850, y: 160 },
    { x: 6050, y: 230 },
    { x: 6480, y: 190 },
    { x: 6730, y: 230 },
    { x: 7500, y: GROUND_Y - BEER_HEIGHT - 5 },
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
  const enemies: Enemy[] = [];

  const make = (
    x: number,
    y: number,
    type: 'bottle' | 'rat' | 'crow' | 'mine' | 'ninja',
    vx: number = 0
  ): Enemy => {
    const sizes: Record<string, { w: number; h: number }> = {
      bottle: { w: 40, h: 40 },
      rat: { w: 45, h: 35 },
      crow: { w: 50, h: 40 },
      mine: { w: 35, h: 35 },
      ninja: { w: 45, h: 60 },
    };
    const s = sizes[type];
    return {
      x,
      y: y - s.h,
      width: s.w,
      height: s.h,
      vx,
      vy: 0,
      alive: true,
      type,
      animFrame: 0,
      animTimer: 0,
      baseY: y - s.h,
      jumpTimer: Math.random() * 60,
      exploded: false,
    };
  };

  enemies.push(make(300, GROUND_Y, 'bottle', -1.5));
  enemies.push(make(800, GROUND_Y, 'rat', -2));
  enemies.push(make(1000, GROUND_Y, 'ninja', -1.5));
  enemies.push(make(1400, GROUND_Y, 'bottle', -1.8));
  enemies.push(make(700, 250, 'crow', -1.5));

  enemies.push(make(2280, GROUND_Y, 'rat', -2.2));
  enemies.push(make(2500, GROUND_Y, 'ninja', -2));
  enemies.push(make(2650, GROUND_Y, 'mine'));
  enemies.push(make(2900, GROUND_Y, 'bottle', -1.7));
  enemies.push(make(2400, 220, 'crow', -2));
  enemies.push(make(3350, GROUND_Y, 'rat', -2.5));
  enemies.push(make(3600, GROUND_Y, 'mine'));
  enemies.push(make(3750, GROUND_Y, 'ninja', -2));
  enemies.push(make(3900, 200, 'crow', -1.8));
  enemies.push(make(4050, GROUND_Y, 'bottle', -1.8));
  enemies.push(make(4300, GROUND_Y, 'mine'));
  enemies.push(make(4550, GROUND_Y, 'ninja', -2));
  enemies.push(make(4700, 180, 'crow', -2));
  enemies.push(make(4900, GROUND_Y, 'rat', -2.3));
  enemies.push(make(5150, GROUND_Y, 'bottle', -2));
  enemies.push(make(5380, GROUND_Y, 'mine'));

  enemies.push(make(5700, GROUND_Y, 'ninja', -2));
  enemies.push(make(5950, GROUND_Y, 'rat', -2.5));
  enemies.push(make(5850, 180, 'crow', -2.2));
  enemies.push(make(6150, GROUND_Y, 'mine'));
  enemies.push(make(6400, GROUND_Y, 'bottle', -2));
  enemies.push(make(6600, GROUND_Y, 'ninja', -2));
  enemies.push(make(6500, 160, 'crow', -2.5));
  enemies.push(make(6800, GROUND_Y, 'rat', -2.8));

  return enemies;
}

export function createBoss(): Boss {
  return {
    x: L1_BOSS_ARENA_RIGHT - BOSS_WIDTH - 50,
    y: GROUND_Y - BOSS_HEIGHT,
    width: BOSS_WIDTH,
    height: BOSS_HEIGHT,
    vx: -2,
    vy: 0,
    hp: L1_BOSS_HP,
    maxHp: L1_BOSS_HP,
    alive: true,
    facingRight: false,
    animTimer: 0,
    throwTimer: 60,
    invulnTimer: 0,
    arenaLeft: L1_BOSS_ARENA_LEFT,
    arenaRight: L1_BOSS_ARENA_RIGHT,
    phase: 1,
    active: false,
    type: 'general',
  };
}

export function createClouds(): Cloud[] {
  return [];
}
