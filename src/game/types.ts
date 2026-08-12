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
}

export interface BeerCan extends Rect {
  collected: boolean;
  bobOffset: number;
  id: number;
}

export interface Platform extends Rect {
  type: 'ground' | 'brick' | 'pipe';
}

export interface Enemy extends Rect {
  vx: number;
  alive: boolean;
  type: 'bottle' | 'rat';
  animFrame: number;
  animTimer: number;
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
