import { BeerCan, Platform, Enemy, Boss } from './types';
import {
  GROUND_Y,
  PLATFORM_HEIGHT,
  BEER_WIDTH,
  BEER_HEIGHT,
  L2_BOSS_ARENA_LEFT,
  L2_BOSS_ARENA_RIGHT,
  BOSS_WIDTH,
  BOSS_HEIGHT,
  L2_BOSS_HP,
} from './constants';

/**
 * LEVEL 2: BAR "13 RULES"
 * — Barrels replace some brick platforms
 * — Bar counters (long low platforms)
 * — Beer taps replace pipes
 * — Denser enemy placement (harder level)
 */

export function createPlatformsL2(): Platform[] {
  const platforms: Platform[] = [];

  // Continuous bar floor with strategic gaps
  platforms.push({ x: 0, y: GROUND_Y, width: 1000, height: 60, type: 'ground' });
  platforms.push({ x: 1120, y: GROUND_Y, width: 700, height: 60, type: 'ground' });
  platforms.push({ x: 1920, y: GROUND_Y, width: 500, height: 60, type: 'ground' });
  platforms.push({ x: 2520, y: GROUND_Y, width: 450, height: 60, type: 'ground' });
  platforms.push({ x: 3080, y: GROUND_Y, width: 500, height: 60, type: 'ground' });
  platforms.push({ x: 3700, y: GROUND_Y, width: 400, height: 60, type: 'ground' });
  platforms.push({ x: 4220, y: GROUND_Y, width: 380, height: 60, type: 'ground' });
  platforms.push({ x: 4700, y: GROUND_Y, width: 450, height: 60, type: 'ground' });
  platforms.push({ x: 5250, y: GROUND_Y, width: 500, height: 60, type: 'ground' });
  platforms.push({ x: 5850, y: GROUND_Y, width: 400, height: 60, type: 'ground' });
  platforms.push({ x: 6350, y: GROUND_Y, width: 500, height: 60, type: 'ground' });

  // Boss arena floor
  platforms.push({ x: L2_BOSS_ARENA_LEFT - 130, y: GROUND_Y, width: 1130, height: 60, type: 'ground' });

  // Floating platforms — mix of bar counters and barrels
  const floating = [
    // Zone 1 — easy warmup
    { x: 200, y: 350, w: 140, type: 'bar' as const },
    { x: 400, y: 280, w: 100, type: 'barrel' as const },
    { x: 560, y: 340, w: 100, type: 'brick' as const },
    { x: 720, y: 260, w: 130, type: 'bar' as const },
    { x: 900, y: 330, w: 100, type: 'barrel' as const },

    // Bridge across first gap
    { x: 1030, y: 300, w: 80, type: 'brick' as const },

    // Zone 2 — harder
    { x: 1180, y: 290, w: 100, type: 'bar' as const },
    { x: 1370, y: 230, w: 90, type: 'barrel' as const },
    { x: 1550, y: 300, w: 120, type: 'bar' as const },
    { x: 1750, y: 240, w: 100, type: 'brick' as const },
    { x: 1830, y: 320, w: 90, type: 'barrel' as const },

    { x: 1990, y: 270, w: 100, type: 'bar' as const },
    { x: 2200, y: 210, w: 90, type: 'barrel' as const },
    { x: 2400, y: 300, w: 120, type: 'brick' as const },
    { x: 2440, y: 320, w: 80, type: 'barrel' as const },

    { x: 2600, y: 250, w: 100, type: 'bar' as const },
    { x: 2800, y: 190, w: 90, type: 'barrel' as const },
    { x: 2980, y: 320, w: 100, type: 'brick' as const },

    { x: 3160, y: 260, w: 100, type: 'bar' as const },
    { x: 3360, y: 200, w: 90, type: 'barrel' as const },
    { x: 3540, y: 300, w: 100, type: 'brick' as const },
    { x: 3610, y: 340, w: 70, type: 'barrel' as const },

    { x: 3780, y: 250, w: 100, type: 'bar' as const },
    { x: 3960, y: 190, w: 90, type: 'barrel' as const },
    { x: 4130, y: 320, w: 90, type: 'brick' as const },

    { x: 4300, y: 260, w: 100, type: 'bar' as const },
    { x: 4500, y: 200, w: 90, type: 'barrel' as const },
    { x: 4620, y: 340, w: 70, type: 'brick' as const },

    { x: 4780, y: 250, w: 100, type: 'bar' as const },
    { x: 4980, y: 190, w: 90, type: 'barrel' as const },
    { x: 5170, y: 320, w: 80, type: 'brick' as const },

    // Zone 3 — final push
    { x: 5330, y: 260, w: 110, type: 'bar' as const },
    { x: 5530, y: 200, w: 90, type: 'barrel' as const },
    { x: 5720, y: 300, w: 100, type: 'brick' as const },
    { x: 5900, y: 240, w: 100, type: 'bar' as const },
    { x: 6100, y: 190, w: 90, type: 'barrel' as const },
    { x: 6280, y: 310, w: 80, type: 'brick' as const },
    { x: 6450, y: 260, w: 100, type: 'bar' as const },
    { x: 6650, y: 210, w: 100, type: 'barrel' as const },
    { x: 6820, y: 290, w: 90, type: 'brick' as const },
  ];

  for (const p of floating) {
    platforms.push({
      x: p.x,
      y: p.y,
      width: p.w,
      height: p.type === 'bar' ? 15 : PLATFORM_HEIGHT,
      type: p.type,
    });
  }

  // Beer taps (replace pipes visually — same collision)
  const taps = [
    { x: 480, h: 80 },
    { x: 1050, h: 100 },
    { x: 1700, h: 90 },
    { x: 2340, h: 110 },
    { x: 2900, h: 80 },
    { x: 3450, h: 100 },
    { x: 4030, h: 90 },
    { x: 4620, h: 110 },
    { x: 5200, h: 80 },
    { x: 5780, h: 100 },
    { x: 6350, h: 90 },
    { x: 6920, h: 120 },
  ];

  for (const tap of taps) {
    platforms.push({
      x: tap.x,
      y: GROUND_Y - tap.h,
      width: 50,
      height: tap.h,
      type: 'pipe',
    });
  }

  return platforms;
}

export function createBeersL2(): BeerCan[] {
  const positions = [
    { x: 180, y: 300 },
    { x: 350, y: 230 },
    { x: 570, y: 290 },
    { x: 750, y: 200 },
    { x: 920, y: 280 },
    { x: 1060, y: 250 },
    { x: 1220, y: 240 },
    { x: 1400, y: 180 },
    { x: 1600, y: 250 },
    { x: 1790, y: 190 },
    { x: 2000, y: 220 },
    { x: 2220, y: 160 },
    { x: 2420, y: 250 },
    { x: 2630, y: 200 },
    { x: 2830, y: 140 },
    { x: 3010, y: 270 },
    { x: 3200, y: 210 },
    { x: 3390, y: 150 },
    { x: 3580, y: 250 },
    { x: 3820, y: 200 },
    { x: 4000, y: 140 },
    { x: 4330, y: 210 },
    { x: 4530, y: 150 },
    { x: 4820, y: 200 },
    { x: 5010, y: 140 },
    { x: 5370, y: 210 },
    { x: 5570, y: 150 },
    { x: 5940, y: 190 },
    { x: 6140, y: 140 },
    { x: 6500, y: 210 },
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

export function createEnemiesL2(): Enemy[] {
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

  // Level 2 is harder — more enemies, faster

  // Zone 1 (0-2000)
  enemies.push(make(300, GROUND_Y, 'bottle', -2));    // beer mug
  enemies.push(make(600, GROUND_Y, 'rat', -2.5));     // sausage
  enemies.push(make(850, GROUND_Y, 'ninja', -2));     // drunk regular
  enemies.push(make(1150, GROUND_Y, 'bottle', -2));
  enemies.push(make(1400, GROUND_Y, 'mine'));         // vodka shot
  enemies.push(make(1650, GROUND_Y, 'rat', -2.8));
  enemies.push(make(1900, GROUND_Y, 'ninja', -2));
  enemies.push(make(700, 220, 'crow', -2));           // beer ghost
  enemies.push(make(1450, 200, 'crow', -2.5));

  // Zone 2 (2000-5000) — dense
  enemies.push(make(2150, GROUND_Y, 'rat', -2.8));
  enemies.push(make(2400, GROUND_Y, 'mine'));
  enemies.push(make(2650, GROUND_Y, 'bottle', -2.2));
  enemies.push(make(2850, GROUND_Y, 'ninja', -2.5));
  enemies.push(make(2200, 180, 'crow', -2.5));
  enemies.push(make(2800, 160, 'crow', -2));

  enemies.push(make(3100, GROUND_Y, 'rat', -3));
  enemies.push(make(3350, GROUND_Y, 'mine'));
  enemies.push(make(3550, GROUND_Y, 'ninja', -2.5));
  enemies.push(make(3800, GROUND_Y, 'bottle', -2.5));
  enemies.push(make(3300, 170, 'crow', -2.5));
  enemies.push(make(3900, 150, 'crow', -3));

  enemies.push(make(4100, GROUND_Y, 'mine'));
  enemies.push(make(4300, GROUND_Y, 'rat', -3));
  enemies.push(make(4500, GROUND_Y, 'ninja', -2.5));
  enemies.push(make(4700, GROUND_Y, 'bottle', -2.5));
  enemies.push(make(4900, GROUND_Y, 'ninja', -2.5));
  enemies.push(make(4500, 160, 'crow', -3));

  // Zone 3 (5000-7000) — final gauntlet before boss
  enemies.push(make(5150, GROUND_Y, 'mine'));
  enemies.push(make(5350, GROUND_Y, 'ninja', -3));
  enemies.push(make(5550, GROUND_Y, 'rat', -3));
  enemies.push(make(5750, GROUND_Y, 'mine'));
  enemies.push(make(5950, GROUND_Y, 'bottle', -2.8));
  enemies.push(make(6150, GROUND_Y, 'ninja', -3));
  enemies.push(make(6350, GROUND_Y, 'rat', -3));
  enemies.push(make(6550, GROUND_Y, 'mine'));
  enemies.push(make(6750, GROUND_Y, 'ninja', -3));
  enemies.push(make(5500, 140, 'crow', -3));
  enemies.push(make(6100, 130, 'crow', -3));
  enemies.push(make(6700, 140, 'crow', -3.5));

  return enemies;
}

export function createBossL2(): Boss {
  return {
    x: L2_BOSS_ARENA_RIGHT - BOSS_WIDTH - 50,
    y: GROUND_Y - BOSS_HEIGHT,
    width: BOSS_WIDTH,
    height: BOSS_HEIGHT,
    vx: -2.5,
    vy: 0,
    hp: L2_BOSS_HP,
    maxHp: L2_BOSS_HP,
    alive: true,
    facingRight: false,
    animTimer: 0,
    throwTimer: 50,
    invulnTimer: 0,
    arenaLeft: L2_BOSS_ARENA_LEFT,
    arenaRight: L2_BOSS_ARENA_RIGHT,
    phase: 1,
    active: false,
    type: 'elder',
  };
}
