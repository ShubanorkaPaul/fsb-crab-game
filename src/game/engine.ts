import { GameState, Keys, Rect } from './types';
import { createPlatforms, createBeers, createEnemies, createClouds } from './level';
import {
  GRAVITY,
  JUMP_FORCE,
  DOUBLE_JUMP_FORCE,
  MAX_JUMPS,
  MOVE_SPEED,
  MAX_FALL_SPEED,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  CANVAS_HEIGHT,
  SCROLL_THRESHOLD,
  GROUND_Y,
} from './constants';

export function createInitialState(): GameState {
  return {
    player: {
      x: 100,
      y: GROUND_Y - PLAYER_HEIGHT,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      vx: 0,
      vy: 0,
      onGround: false,
      facingRight: true,
      animFrame: 0,
      animTimer: 0,
      isJumping: false,
      jumpsUsed: 0,
      jumpKeyHeld: false,
    },
    beers: createBeers(),
    platforms: createPlatforms(),
    enemies: createEnemies(),
    particles: [],
    cameraX: 0,
    score: 0,
    lives: 3,
    gameOver: false,
    gameWon: false,
    gameStarted: false,
    time: 0,
    clouds: createClouds(),
  };
}

export function update(state: GameState, keys: Keys): GameState {
  if (!state.gameStarted || state.gameOver || state.gameWon) {
    if (keys.space) {
      if (!state.gameStarted) {
        return { ...state, gameStarted: true };
      }
      if (state.gameOver || state.gameWon) {
        return createInitialState();
      }
    }
    return { ...state, time: state.time + 1 };
  }

  const newState = { ...state, time: state.time + 1 };

  updatePlayer(newState, keys);
  updateEnemies(newState);
  checkBeerCollisions(newState);
  checkEnemyCollisions(newState);
  updateParticles(newState);
  updateCamera(newState);

  const allCollected = newState.beers.every(b => b.collected);
  if (allCollected) {
    newState.gameWon = true;
  }

  if (newState.player.y > CANVAS_HEIGHT + 100) {
    newState.lives -= 1;
    if (newState.lives <= 0) {
      newState.gameOver = true;
    } else {
      newState.player.x = Math.max(0, newState.cameraX + 100);
      newState.player.y = 100;
      newState.player.vx = 0;
      newState.player.vy = 0;
      newState.player.jumpsUsed = 0;
      newState.player.jumpKeyHeld = false;
    }
  }

  return newState;
}

function updatePlayer(state: GameState, keys: Keys) {
  const player = state.player;

  // Horizontal movement
  if (keys.left) {
    player.vx = -MOVE_SPEED;
    player.facingRight = false;
  } else if (keys.right) {
    player.vx = MOVE_SPEED;
    player.facingRight = true;
  } else {
    player.vx *= 0.85;
    if (Math.abs(player.vx) < 0.2) player.vx = 0;
  }

  // === JUMP LOGIC (edge-triggered for reliable double jump) ===
  const jumpKeyDown = keys.up || keys.space;

  if (jumpKeyDown && !player.jumpKeyHeld) {
    if (player.onGround) {
      // First jump
      player.vy = JUMP_FORCE;
      player.onGround = false;
      player.isJumping = true;
      player.jumpsUsed = 1;
    } else if (player.jumpsUsed < MAX_JUMPS) {
      // Double jump
      player.vy = DOUBLE_JUMP_FORCE;
      player.jumpsUsed += 1;

      // Sparkle particles for double jump
      for (let i = 0; i < 10; i++) {
        state.particles.push({
          x: player.x + player.width / 2,
          y: player.y + player.height,
          vx: (Math.random() - 0.5) * 5,
          vy: Math.random() * 3,
          life: 25,
          maxLife: 25,
          color: '#FFFFFF',
          size: 3 + Math.random() * 2,
        });
      }
    }
  }

  player.jumpKeyHeld = jumpKeyDown;

  // Gravity
  player.vy += GRAVITY;
  if (player.vy > MAX_FALL_SPEED) player.vy = MAX_FALL_SPEED;

  // Move X
  player.x += player.vx;

  if (player.x < state.cameraX) {
    player.x = state.cameraX;
  }

  // Platform collision X
  for (const platform of state.platforms) {
    if (rectsOverlap(player, platform)) {
      if (player.vx > 0) {
        player.x = platform.x - player.width;
      } else if (player.vx < 0) {
        player.x = platform.x + platform.width;
      }
      player.vx = 0;
    }
  }

  // Move Y
  player.y += player.vy;

  // Platform collision Y
  player.onGround = false;
  for (const platform of state.platforms) {
    if (rectsOverlap(player, platform)) {
      if (player.vy > 0) {
        player.y = platform.y - player.height;
        player.vy = 0;
        player.onGround = true;
        player.isJumping = false;
        player.jumpsUsed = 0; // reset on landing
      } else if (player.vy < 0) {
        player.y = platform.y + platform.height;
        player.vy = 0;
      }
    }
  }

  // Animation
  if (Math.abs(player.vx) > 0.5) {
    player.animTimer++;
    if (player.animTimer % 8 === 0) {
      player.animFrame = (player.animFrame + 1) % 4;
    }
  } else {
    player.animTimer++;
  }
}

function updateEnemies(state: GameState) {
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;

    enemy.x += enemy.vx;
    enemy.animTimer++;

    let onPlatform = false;
    for (const platform of state.platforms) {
      if (
        enemy.x + enemy.width > platform.x &&
        enemy.x < platform.x + platform.width &&
        Math.abs(enemy.y + enemy.height - platform.y) < 5
      ) {
        onPlatform = true;
        if (enemy.vx < 0 && enemy.x <= platform.x + 5) {
          enemy.vx = Math.abs(enemy.vx);
        } else if (enemy.vx > 0 && enemy.x + enemy.width >= platform.x + platform.width - 5) {
          enemy.vx = -Math.abs(enemy.vx);
        }
      }

      if (rectsOverlap(enemy, platform) && platform.type === 'pipe') {
        enemy.vx = -enemy.vx;
      }
    }

    if (!onPlatform) {
      enemy.vx = -enemy.vx;
      enemy.x += enemy.vx * 5;
    }
  }
}

function checkBeerCollisions(state: GameState) {
  for (const beer of state.beers) {
    if (beer.collected) continue;

    const bobY = Math.sin(state.time * 0.05 + beer.bobOffset) * 5;
    const beerRect = { ...beer, y: beer.y + bobY };

    if (rectsOverlap(state.player, beerRect)) {
      beer.collected = true;
      state.score += 100;

      for (let i = 0; i < 12; i++) {
        state.particles.push({
          x: beer.x + beer.width / 2,
          y: beer.y + beer.height / 2,
          vx: (Math.random() - 0.5) * 6,
          vy: -Math.random() * 5 - 2,
          life: 40 + Math.random() * 20,
          maxLife: 60,
          color: ['#FFD700', '#FFA000', '#FF6F00', '#FFEB3B'][Math.floor(Math.random() * 4)],
          size: 3 + Math.random() * 4,
        });
      }
    }
  }
}

function checkEnemyCollisions(state: GameState) {
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;

    if (rectsOverlap(state.player, enemy)) {
      if (state.player.vy > 0 && state.player.y + state.player.height - 10 < enemy.y + enemy.height / 2) {
        enemy.alive = false;
        state.player.vy = JUMP_FORCE * 0.6;
        state.player.jumpsUsed = 1;
        state.score += 200;

        for (let i = 0; i < 10; i++) {
          state.particles.push({
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height / 2,
            vx: (Math.random() - 0.5) * 8,
            vy: -Math.random() * 6 - 1,
            life: 30 + Math.random() * 20,
            maxLife: 50,
            color: enemy.type === 'bottle' ? '#2196F3' : '#666',
            size: 4 + Math.random() * 3,
          });
        }
      } else {
        state.lives -= 1;
        if (state.lives <= 0) {
          state.gameOver = true;
        } else {
          state.player.vy = -8;
          state.player.vx = state.player.x < enemy.x ? -5 : 5;
          state.player.y -= 20;
          state.player.jumpsUsed = 1;
        }
      }
    }
  }
}

function updateParticles(state: GameState) {
  state.particles = state.particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15;
    p.life -= 1;
    p.size *= 0.98;
    return p.life > 0;
  });
}

function updateCamera(state: GameState) {
  const targetX = state.player.x - SCROLL_THRESHOLD;
  if (targetX > state.cameraX) {
    state.cameraX += (targetX - state.cameraX) * 0.1;
  }
  if (state.cameraX < 0) state.cameraX = 0;
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}
