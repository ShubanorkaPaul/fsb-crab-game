import { useRef, useEffect, useCallback, useState } from 'react';
import { Keys } from './types';
import { createInitialState, update } from './engine';
import { render, renderMobileControls, loadImages } from './renderer';
import { playJump, playCollect, playStomp, playHurt, playWin, playGameOver } from './audio';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';

// Detect touch device
function isTouchDevice(): boolean {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia('(pointer: coarse)').matches
  );
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Keys>({ left: false, right: false, up: false, space: false });
  const stateRef = useRef(createInitialState());
  const prevScoreRef = useRef(0);
  const prevLivesRef = useRef(3);
  const prevGameOverRef = useRef(false);
  const prevGameWonRef = useRef(false);
  const [isMobile, setIsMobile] = useState(false);
  const isMobileRef = useRef(false);

  // Track which touch is pressing which button (multi-touch)
  const activeTouchesRef = useRef<Map<number, 'left' | 'right' | 'jump'>>(new Map());
  // For "re-tap" double jump: pulse jump key
  const jumpPulseRef = useRef(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const keys = keysRef.current;
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        keys.left = true;
        e.preventDefault();
        break;
      case 'ArrowRight':
      case 'KeyD':
        keys.right = true;
        e.preventDefault();
        break;
      case 'ArrowUp':
      case 'KeyW':
        keys.up = true;
        e.preventDefault();
        break;
      case 'Space':
        keys.space = true;
        e.preventDefault();
        break;
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const keys = keysRef.current;
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        keys.left = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        keys.right = false;
        break;
      case 'ArrowUp':
      case 'KeyW':
        keys.up = false;
        break;
      case 'Space':
        keys.space = false;
        break;
    }
  }, []);

  // Convert touch position to canvas coords and detect button
  const getButtonFromTouch = useCallback(
    (touch: Touch, rect: DOMRect): 'left' | 'right' | 'jump' | null => {
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const x = (touch.clientX - rect.left) * scaleX;
      const y = (touch.clientY - rect.top) * scaleY;

      // Left button: x 20-140, bottom
      if (x >= 20 && x <= 150 && y >= CANVAS_HEIGHT - 130 && y <= CANVAS_HEIGHT) {
        return 'left';
      }
      // Right button: x 160-280, bottom
      if (x >= 160 && x <= 290 && y >= CANVAS_HEIGHT - 130 && y <= CANVAS_HEIGHT) {
        return 'right';
      }
      // Jump button: right side
      if (x >= CANVAS_WIDTH - 160 && x <= CANVAS_WIDTH - 20 && y >= CANVAS_HEIGHT - 130 && y <= CANVAS_HEIGHT) {
        return 'jump';
      }
      return null;
    },
    []
  );

  const updateKeysFromTouches = useCallback(() => {
    const keys = keysRef.current;
    const active = activeTouchesRef.current;

    keys.left = false;
    keys.right = false;
    // NOTE: don't reset jump/space here — they are pulsed separately

    let jumpHeld = false;
    active.forEach((btn) => {
      if (btn === 'left') keys.left = true;
      if (btn === 'right') keys.right = true;
      if (btn === 'jump') jumpHeld = true;
    });

    // Keep jump held while finger is on jump button
    if (jumpHeld) {
      keys.up = true;
      keys.space = true;
    } else {
      keys.up = false;
      keys.space = false;
    }
  }, []);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();
      isMobileRef.current = true;
      setIsMobile(true);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();

      // Tap-to-start / tap-to-restart when on menu screens
      const state = stateRef.current;
      const onMenu = !state.gameStarted || state.gameOver || state.gameWon;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const btn = getButtonFromTouch(touch, rect);

        if (btn) {
          activeTouchesRef.current.set(touch.identifier, btn);

          // For jump button: on menu → start game; in game → pulse jump for reliable double-jump
          if (btn === 'jump') {
            if (onMenu) {
              keysRef.current.space = true;
              setTimeout(() => {
                keysRef.current.space = false;
              }, 100);
            } else {
              // Pulse: release space for 1 frame so engine detects new press
              jumpPulseRef.current = true;
            }
          }
        } else if (onMenu) {
          // Any tap outside buttons starts/restarts game
          keysRef.current.space = true;
          setTimeout(() => {
            keysRef.current.space = false;
          }, 100);
        }
      }

      updateKeysFromTouches();
    },
    [getButtonFromTouch, updateKeysFromTouches]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();

      // Update which button each finger is on
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const btn = getButtonFromTouch(touch, rect);
        if (btn) {
          activeTouchesRef.current.set(touch.identifier, btn);
        } else {
          activeTouchesRef.current.delete(touch.identifier);
        }
      }
      updateKeysFromTouches();
    },
    [getButtonFromTouch, updateKeysFromTouches]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        activeTouchesRef.current.delete(e.changedTouches[i].identifier);
      }
      updateKeysFromTouches();
    },
    [updateKeysFromTouches]
  );

  useEffect(() => {
    loadImages();
    setIsMobile(isTouchDevice());
    isMobileRef.current = isTouchDevice();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    let animId: number;

    function gameLoop() {
      const state = stateRef.current;

      // Handle jump pulse: release space for 1 frame, then re-press
      // This makes double-jump work with a held finger (tap → tap)
      // Handled via touchstart: we don't need extra logic here since
      // touchstart re-fires each tap separately, giving natural edge-trigger.

      const newState = update(state, keysRef.current);

      // Sound effects
      if (newState.score > prevScoreRef.current) {
        const diff = newState.score - prevScoreRef.current;
        if (diff >= 200) {
          playStomp();
        } else {
          playCollect();
        }
      }
      if (newState.lives < prevLivesRef.current) {
        playHurt();
      }
      if (newState.gameOver && !prevGameOverRef.current) {
        playGameOver();
      }
      if (newState.gameWon && !prevGameWonRef.current) {
        playWin();
      }

      // Detect jump for sound
      if (
        newState.gameStarted &&
        !newState.gameOver &&
        state.player.onGround &&
        !newState.player.onGround &&
        newState.player.vy < 0
      ) {
        playJump();
      }

      prevScoreRef.current = newState.score;
      prevLivesRef.current = newState.lives;
      prevGameOverRef.current = newState.gameOver;
      prevGameWonRef.current = newState.gameWon;

      stateRef.current = newState;

      render(ctx!, newState);

      if (isMobileRef.current) {
        renderMobileControls(ctx!);
      }

      animId = requestAnimationFrame(gameLoop);
    }

    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleKeyDown, handleKeyUp, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="block max-w-full max-h-screen border-4 border-amber-600 rounded-lg shadow-2xl"
      style={{
        imageRendering: 'pixelated',
        aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}`,
        touchAction: 'none', // prevent browser scrolling/zooming on canvas
      }}
      tabIndex={0}
    />
  );
}
