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
  type: 'ground' | 'brick' | 'pipe' | 'bar' | 'barrel';
}

export type EnemyType = 'bottle' | 'rat' | 'crow' | 'mine' | 'ninja';

export interface Enemy extends Rect {
  vx: number;
  vy: number;
  alive: boolean;
  type: EnemyType;
  animFrame: number;
  animTimer: number;
  baseY: number;
  jumpTimer: number;
  exploded: boolean;
}

export type BossType = 'general' | 'elder';

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
  phase: number;
  active: boolean;
  type: BossType;
}

export type ProjectileType = 'document' | 'poop' | 'bowl' | 'genie';

export interface Projectile extends Rect {
  vx: number;
  vy: number;
  type: ProjectileType;
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

// Game screens for story flow
export type Screen =
  | 'menu'
  | 'prologue'      // shown once before level 1
  | 'level1'
  | 'interlude'     // between L1 and L2
  | 'level2'
  | 'finale'        // final story after L2
  | 'gameOver';

export interface GameState {
  screen: Screen;
  currentLevel: 1 | 2;

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

  // Story text page index (for prologue/interlude/finale)
  storyPage: number;
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
