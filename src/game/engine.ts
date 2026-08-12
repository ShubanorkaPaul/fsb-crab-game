import { GameState, Keys, Rect, Enemy } from './types';
import { createPlatforms, createBeers, createEnemies, createClouds, createBoss } from './level';
import { createPlatformsL2, createBeersL2, createEnemiesL2, createBossL2 } from './level2';
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
  L1_BOSS_ARENA_LEFT,
  L2_BOSS_ARENA_LEFT,
  STORY_PROLOGUE,
  STORY_INTERLUDE,
  STORY_FINALE,
} from './constants';

// Module-level flag: whether the menu-space key press has been consumed already.
// Prevents multiple story pages skipping per single tap.
let menuInputConsumed = false;

export function createInitialState(): GameState {
  return {
    screen: 'menu',
    currentLevel: 1,
    player: makePlayer(),
    beers: [],
    platforms: [],
    enemies: [],
    boss: createBoss(),
    projectiles: [],
    particles: [],
    cameraX: 0,
    score: 0,
    lives: 3,
    gameOver: false,
    gameWon: false,
    gameStarted: false,
    time: 0,
    clouds: createClouds(),
    storyPage: 0,
  };
}

function makePlayer() {
  return {
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
    invulnTimer: 0,
  };
}

function loadLevel1(state: GameState): GameState {
  return {
    ...state,
    screen: 'level1',
    currentLevel: 1,
    player: makePlayer(),
    beers: createBeers(),
    platforms: createPlatforms(),
    enemies: createEnemies(),
    boss: createBoss(),
    projectiles: [],
    particles: [],
    cameraX: 0,
    gameOver: false,
    gameWon: false,
    gameStarted: true,
  };
}

function loadLevel2(state: GameState): GameState {
  return {
    ...state,
    screen: 'level2',
    currentLevel: 2,
    player: makePlayer(),
    beers: createBeersL2(),
    platforms: createPlatformsL2(),
    enemies: createEnemiesL2(),
    boss: createBossL2(),
    projectiles: [],
    particles: [],
    cameraX: 0,
    gameOver: false,
    gameWon: false,
    gameStarted: true,
  };
}

/**
 * Menu-style input.
 * Only fires on the FRAME the space/tap key transitions from up→down.
 * Uses `menuInputConsumed` to prevent multi-fire while held.
 */
function handleMenuInput(state: GameState, keys: Keys): GameState {
  // Reset consumed flag when key is released
  if (!keys.space) {
    menuInputConsumed = false;
    return { ...state, time: state.time + 1 };
  }

  // If already consumed this key-press, ignore
  if (menuInputConsumed) {
    return { ...state, time: state.time + 1 };
  }

  // Consume this key-press so it only counts once
  menuInputConsumed = true;

  switch (state.screen) {
    case 'menu':
      return { ...state, screen: 'prologue', storyPage: 0, time: state.time + 1 };

    case 'prologue': {
      const nextPage = state.storyPage + 1;
      if (nextPage >= STORY_PROLOGUE.length) {
        return loadLevel1(state);
      }
      return { ...state, storyPage: nextPage, time: state.time + 1 };
    }

    case 'interlude': {
      const nextPage = state.storyPage + 1;
      if (nextPage >= STORY_INTERLUDE.length) {
        return loadLevel2(state);
      }
      return { ...state, storyPage: nextPage, time: state.time + 1 };
    }

    case 'finale': {
      const nextPage = state.storyPage + 1;
      if (nextPage >= STORY_FINALE.length) {
        return { ...createInitialState(), score: state.score };
      }
      return { ...state, storyPage: nextPage, time: state.time + 1 };
    }

    case 'gameOver':
      return state.currentLevel === 1
        ? { ...loadLevel1(state), lives: 3, score: 0 }
        : { ...loadLevel2(state), lives: 3, score: 0 };

    default:
      return { ...state, time: state.time + 1 };
  }
}

export function update(state: GameState, keys: Keys): GameState {
  if (
    state.screen === 'menu' ||
    state.screen === 'prologue' ||
    state.screen === 'interlude' ||
    state.screen === 'finale' ||
    state.screen === 'gameOver'
  ) {
    return handleMenuInput(state, keys);
  }

  // In gameplay — reset the menu-input consumed flag so it's fresh next time
  menuInputConsumed = false;

  const newState = { ...state, time: state.time + 1 };

  updatePlayer(newState, keys);
  updateEnemies(newState);
  updateBoss(newState);
  updateProjectiles(newState);
  checkBeerCollisions(newState);
  checkEnemyCollisions(newState);
  checkBossCollision(newState);
  checkProjectileCollisions(newState);
  updateParticles(newState);
  updateCamera(newState);

  if (newState.player.invulnTimer > 0) newState.player.invulnTimer -= 1;
  if (newState.boss.invulnTimer > 0) newState.boss.invulnTimer -= 1;

  if (!newState.boss.alive && !newState.gameWon) {
    newState.gameWon = true;
  }

  if (newState.gameWon) {
    (newState as any)._winTimer = ((newState as any)._winTimer || 0) + 1;
    if ((newState as any)._winTimer > 120) {
      if (state.currentLevel === 1) {
        return { ...newState, screen: 'interlude', storyPage: 0, gameWon: false };
      } else {
        return { ...newState, screen: 'finale', storyPage: 0, gameWon: false };
      }
    }
  }

  if (newState.player.y > CANVAS_HEIGHT + 100) {
    newState.lives -= 1;
    if (newState.lives <= 0) {
      newState.screen = 'gameOver';
      newState.gameOver = true;
    } else {
      newState.player.x = Math.max(0, newState.cameraX + 100);
      newState.player.y = 100;
      newState.player.vx = 0;
      newState.player.vy = 0;
      newState.player.jumpsUsed = 0;
      newState.player.jumpKeyHeld = false;
      newState.player.invulnTimer = 60;
    }
  }

  return newState;
}

function updatePlayer(state: GameState, keys: Keys) {
  const player = state.player;

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

  const jumpKeyDown = keys.up || keys.space;

  if (jumpKeyDown && !player.jumpKeyHeld) {
    if (player.onGround) {
      player.vy = JUMP_FORCE;
      player.onGround = false;
      player.isJumping = true;
      player.jumpsUsed = 1;
    } else if (player.jumpsUsed < MAX_JUMPS) {
      player.vy = DOUBLE_JUMP_FORCE;
      player.jumpsUsed += 1;
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

  player.vy += GRAVITY;
  if (player.vy > MAX_FALL_SPEED) player.vy = MAX_FALL_SPEED;

  player.x += player.vx;
  if (player.x < state.cameraX) player.x = state.cameraX;

  for (const platform of state.platforms) {
    if (rectsOverlap(player, platform)) {
      if (player.vx > 0) player.x = platform.x - player.width;
      else if (player.vx < 0) player.x = platform.x + platform.width;
      player.vx = 0;
    }
  }

  player.y += player.vy;
  player.onGround = false;
  for (const platform of state.platforms) {
    if (rectsOverlap(player, platform)) {
      if (player.vy > 0) {
        player.y = platform.y - player.height;
        player.vy = 0;
        player.onGround = true;
        player.isJumping = false;
        player.jumpsUsed = 0;
      } else if (player.vy < 0) {
        player.y = platform.y + platform.height;
        player.vy = 0;
      }
    }
  }

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
    enemy.animTimer++;

    if (enemy.type === 'crow') {
      enemy.x += enemy.vx;
      enemy.y = enemy.baseY + Math.sin(enemy.animTimer * 0.05) * 30;
      if (enemy.animTimer % 180 === 0 && Math.abs(enemy.x - state.player.x) < 300) {
        state.projectiles.push({
          x: enemy.x + enemy.width / 2 - 8,
          y: enemy.y + enemy.height,
          width: 16,
          height: 16,
          vx: 0,
          vy: 3,
          type: 'poop',
          rotation: 0,
          alive: true,
        });
      }
      if (enemy.x < state.cameraX - 200) enemy.x = state.cameraX + 900;
      continue;
    }

    if (enemy.type === 'mine') {
      enemy.y = enemy.baseY + Math.sin(enemy.animTimer * 0.1) * 3;
      const dx = (state.player.x + state.player.width / 2) - (enemy.x + enemy.width / 2);
      const dy = (state.player.y + state.player.height / 2) - (enemy.y + enemy.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 50 && !enemy.exploded) {
        enemy.exploded = true;
        enemy.alive = false;
        if (dist < 45 && state.player.invulnTimer <= 0) hurtPlayer(state);
        for (let i = 0; i < 25; i++) {
          state.particles.push({
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height / 2,
            vx: (Math.random() - 0.5) * 12,
            vy: (Math.random() - 0.5) * 12,
            life: 40,
            maxLife: 40,
            color: ['#FF5722', '#FFC107', '#F44336', '#FFEB3B'][Math.floor(Math.random() * 4)],
            size: 5 + Math.random() * 4,
          });
        }
      }
      continue;
    }

    if (enemy.type === 'ninja') {
      enemy.jumpTimer -= 1;
      enemy.vy += GRAVITY;
      if (enemy.vy > MAX_FALL_SPEED) enemy.vy = MAX_FALL_SPEED;

      enemy.x += enemy.vx;

      const dx = state.player.x - enemy.x;
      if (Math.abs(dx) < 400 && enemy.vy === 0) {
        enemy.vx = dx > 0 ? 2 : -2;
      }

      for (const platform of state.platforms) {
        if (platform.type === 'pipe' || platform.type === 'brick' || platform.type === 'barrel') {
          if (rectsOverlap(enemy, platform)) {
            if (enemy.vx > 0) enemy.x = platform.x - enemy.width;
            else if (enemy.vx < 0) enemy.x = platform.x + platform.width;
            enemy.vx = -enemy.vx;
          }
        }
      }

      enemy.y += enemy.vy;
      let onGround = false;
      for (const platform of state.platforms) {
        if (rectsOverlap(enemy, platform) && enemy.vy >= 0) {
          enemy.y = platform.y - enemy.height;
          enemy.vy = 0;
          onGround = true;
        }
      }
      if (onGround && enemy.jumpTimer <= 0) {
        enemy.vy = -10;
        enemy.jumpTimer = 90 + Math.random() * 60;
      }
      continue;
    }

    const oldX = enemy.x;
    enemy.x += enemy.vx;

    let bumped = false;
    for (const platform of state.platforms) {
      if (platform.type === 'pipe' || platform.type === 'brick' || platform.type === 'barrel') {
        if (rectsOverlap(enemy, platform)) {
          enemy.x = oldX;
          enemy.vx = -enemy.vx;
          bumped = true;
          break;
        }
      }
    }
    if (bumped) continue;

    let onPlatform = false;
    let platformEndsSoon = false;
    for (const platform of state.platforms) {
      if (platform.type !== 'ground' && platform.type !== 'brick' && platform.type !== 'bar') continue;
      if (
        enemy.x + enemy.width > platform.x &&
        enemy.x < platform.x + platform.width &&
        Math.abs(enemy.y + enemy.height - platform.y) < 5
      ) {
        onPlatform = true;
        if (enemy.vx < 0 && enemy.x <= platform.x + 3) platformEndsSoon = true;
        else if (enemy.vx > 0 && enemy.x + enemy.width >= platform.x + platform.width - 3) platformEndsSoon = true;
      }
    }

    if (platformEndsSoon || !onPlatform) {
      enemy.vx = -enemy.vx;
      enemy.x = oldX;
    }
  }
}

function updateBoss(state: GameState) {
  const boss = state.boss;
  if (!boss.alive) return;

  const arenaLeft = boss.type === 'general' ? L1_BOSS_ARENA_LEFT : L2_BOSS_ARENA_LEFT;

  if (!boss.active && state.player.x > arenaLeft - 100) boss.active = true;
  if (!boss.active) return;

  boss.animTimer++;

  boss.x += boss.vx;
  if (boss.x < boss.arenaLeft) {
    boss.x = boss.arenaLeft;
    boss.vx = Math.abs(boss.vx);
    boss.facingRight = true;
  } else if (boss.x + boss.width > boss.arenaRight) {
    boss.x = boss.arenaRight - boss.width;
    boss.vx = -Math.abs(boss.vx);
    boss.facingRight = false;
  }

  boss.vy += GRAVITY;
  boss.y += boss.vy;
  for (const platform of state.platforms) {
    if (rectsOverlap(boss, platform) && boss.vy > 0) {
      boss.y = platform.y - boss.height;
      boss.vy = 0;
    }
  }

  boss.throwTimer -= 1;
  if (boss.throwTimer <= 0) {
    if (boss.type === 'general') {
      const throwInterval = boss.phase === 1 ? 110 : boss.phase === 2 ? 75 : 45;
      boss.throwTimer = throwInterval;

      const dirX = state.player.x - boss.x;
      const dir = dirX > 0 ? 1 : -1;
      const count = boss.phase;
      for (let i = 0; i < count; i++) {
        state.projectiles.push({
          x: boss.x + boss.width / 2 - 12,
          y: boss.y + 30,
          width: 24,
          height: 18,
          vx: dir * (3 + i * 0.5 + Math.random()),
          vy: -6 - Math.random() * 2,
          type: 'document',
          rotation: 0,
          alive: true,
        });
      }
    } else {
      const throwInterval = boss.phase <= 2 ? 90 : boss.phase === 3 ? 65 : 45;
      boss.throwTimer = throwInterval;

      const dirX = state.player.x - boss.x;
      const dir = dirX > 0 ? 1 : -1;
      const count = Math.min(boss.phase, 3);
      for (let i = 0; i < count; i++) {
        state.projectiles.push({
          x: boss.x + boss.width / 2 - 12,
          y: boss.y + 20,
          width: 22,
          height: 22,
          vx: dir * (2.5 + i * 0.6),
          vy: -8 - Math.random() * 2,
          type: 'bowl',
          rotation: 0,
          alive: true,
        });
      }
      if (boss.phase >= 3) {
        state.projectiles.push({
          x: boss.x + boss.width / 2,
          y: boss.y + 10,
          width: 20,
          height: 30,
          vx: dir * 5,
          vy: 0,
          type: 'genie',
          rotation: 0,
          alive: true,
        });
      }
    }
  }
}

function updateProjectiles(state: GameState) {
  for (const p of state.projectiles) {
    if (!p.alive) continue;
    if (p.type === 'genie') {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.rotation += 0.15;
    } else {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.3;
      p.rotation += 0.2;
    }

    if (p.y > GROUND_Y - p.height + 5) {
      p.alive = false;
      const color = p.type === 'document' ? '#F5DEB3' :
                    p.type === 'bowl' ? '#F5DEB3' :
                    p.type === 'genie' ? '#9C27B0' : '#8B4513';
      for (let i = 0; i < 6; i++) {
        state.particles.push({
          x: p.x,
          y: p.y,
          vx: (Math.random() - 0.5) * 3,
          vy: -Math.random() * 2,
          life: 20,
          maxLife: 20,
          color,
          size: 3,
        });
      }
    }
    if (p.x < state.cameraX - 100 || p.x > state.cameraX + 1000) p.alive = false;
  }
  state.projectiles = state.projectiles.filter(p => p.alive);
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
      const canStomp = enemy.type !== 'mine';
      const isStomping = state.player.vy > 0 &&
        state.player.y + state.player.height - 10 < enemy.y + enemy.height / 2;

      if (canStomp && isStomping) {
        enemy.alive = false;
        state.player.vy = JUMP_FORCE * 0.6;
        state.player.jumpsUsed = 1;
        state.score += enemy.type === 'crow' ? 300 : enemy.type === 'ninja' ? 250 : 200;
        spawnStompParticles(state, enemy);
      } else if (state.player.invulnTimer <= 0) {
        hurtPlayer(state);
        state.player.vy = -8;
        state.player.vx = state.player.x < enemy.x ? -5 : 5;
        state.player.y -= 20;
        state.player.jumpsUsed = 1;
      }
    }
  }
}

function checkBossCollision(state: GameState) {
  const boss = state.boss;
  if (!boss.alive || !boss.active) return;

  if (rectsOverlap(state.player, boss)) {
    const isStomping = state.player.vy > 0 &&
      state.player.y + state.player.height - 15 < boss.y + boss.height / 2;

    if (isStomping && boss.invulnTimer <= 0) {
      boss.hp -= 1;
      boss.invulnTimer = 60;
      state.player.vy = JUMP_FORCE * 0.9;
      state.player.jumpsUsed = 1;
      state.score += 500;

      boss.phase = Math.min(4, boss.maxHp - boss.hp + 1);
      boss.vx = boss.vx > 0 ? 2 + boss.phase * 0.5 : -(2 + boss.phase * 0.5);

      for (let i = 0; i < 30; i++) {
        state.particles.push({
          x: boss.x + boss.width / 2,
          y: boss.y + 20,
          vx: (Math.random() - 0.5) * 10,
          vy: -Math.random() * 8 - 2,
          life: 40,
          maxLife: 40,
          color: ['#FFD700', '#FF5722', '#F44336'][Math.floor(Math.random() * 3)],
          size: 4 + Math.random() * 4,
        });
      }

      if (boss.hp <= 0) {
        boss.alive = false;
        state.score += 2000;
        for (let i = 0; i < 60; i++) {
          state.particles.push({
            x: boss.x + boss.width / 2,
            y: boss.y + boss.height / 2,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 0.5) * 15,
            life: 60,
            maxLife: 60,
            color: ['#FFD700', '#FF5722', '#F44336', '#4CAF50'][Math.floor(Math.random() * 4)],
            size: 6 + Math.random() * 5,
          });
        }
      }
    } else if (state.player.invulnTimer <= 0 && boss.invulnTimer <= 0) {
      hurtPlayer(state);
      state.player.vy = -10;
      state.player.vx = state.player.x < boss.x ? -7 : 7;
      state.player.jumpsUsed = 1;
    }
  }
}

function checkProjectileCollisions(state: GameState) {
  for (const p of state.projectiles) {
    if (!p.alive) continue;
    if (rectsOverlap(state.player, p) && state.player.invulnTimer <= 0) {
      p.alive = false;
      hurtPlayer(state);
      state.player.vy = -6;
    }
  }
}

function spawnStompParticles(state: GameState, enemy: Enemy) {
  for (let i = 0; i < 10; i++) {
    state.particles.push({
      x: enemy.x + enemy.width / 2,
      y: enemy.y + enemy.height / 2,
      vx: (Math.random() - 0.5) * 8,
      vy: -Math.random() * 6 - 1,
      life: 30 + Math.random() * 20,
      maxLife: 50,
      color: enemy.type === 'bottle' ? '#2196F3' :
             enemy.type === 'crow'   ? '#333' :
             enemy.type === 'ninja'  ? '#111' :
             '#666',
      size: 4 + Math.random() * 3,
    });
  }
}

function hurtPlayer(state: GameState) {
  state.lives -= 1;
  state.player.invulnTimer = 90;
  if (state.lives <= 0) {
    state.screen = 'gameOver';
    state.gameOver = true;
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
