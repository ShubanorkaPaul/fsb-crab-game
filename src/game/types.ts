export interface Vector2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Player extends Rect {
  vx: number;
  vy: number;
  onGround: boolean;
  facingRight: boolean;
  animFrame: number;
  animTimer: number;
  isJumping: boolean;
  jumpsUsed: number;
  jumpKeyHeld: boolean;
  invulnTimer: number;
}

export interface BeerCan extends Rect {
  collected: boolean;
  bobOffset: number;
  id: number;
}

export interface Platform extends Rect {
  type: 'ground' | 'brick' | 'pipe';
}

export type EnemyType = 'bottle' | 'rat' | 'crow' | 'mine' | 'ninja';

export interface Enemy extends Rect {
  vx: number;
  vy: number;
  alive: boolean;
  type: EnemyType;
  animFrame: number;
  animTimer: number;
  baseY: number;      // for flying pattern
  jumpTimer: number;  // for ninja
  exploded: boolean;  // for mine
}

export interface Boss extends Rect {
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  facingRight: boolean;
  animTimer: number;
  throwTimer: number;
  invulnTimer: number;
  arenaLeft: number;
  arenaRight: number;
  phase: number;     // 1, 2, 3 — gets angrier
  active: boolean;   // becomes true when player reaches arena
}

export interface Projectile extends Rect {
  vx: number;
  vy: number;
  type: 'document' | 'poop';
  rotation: number;
  alive: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface GameState {
  player: Player;
  beers: BeerCan[];
  platforms: Platform[];
  enemies: Enemy[];
  boss: Boss;
  projectiles: Projectile[];
  particles: Particle[];
  cameraX: number;
  score: number;
  lives: number;
  gameOver: boolean;
  gameWon: boolean;
  gameStarted: boolean;
  time: number;
  clouds: Cloud[];
}

export interface Cloud {
  x: number;
  y: number;
  width: number;
  speed: number;
}

export interface Keys {
  left: boolean;
  right: boolean;
  up: boolean;
  space: boolean;
}
