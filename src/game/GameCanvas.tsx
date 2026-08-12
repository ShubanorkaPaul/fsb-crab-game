import { useRef, useEffect, useCallback, useState } from 'react';
import { Keys } from './types';
import { createInitialState, update } from './engine';
import { render, renderMobileControls, loadImages } from './renderer';
import { playJump, playCollect, playStomp, playHurt, playWin, playGameOver } from './audio';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';

function isTouchDevice(): boolean {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia('(pointer: coarse)').matches
  );
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const keysRef = useRef<Keys>({ left: false, right: false, up: false, space: false });
  const stateRef = useRef(createInitialState());
  const prevScoreRef = useRef(0);
  const prevLivesRef = useRef(3);
  const prevGameOverRef = useRef(false);
  const prevGameWonRef = useRef(false);
  const [, setIsMobile] = useState(false);
  const isMobileRef = useRef(false);

  const activeTouchesRef = useRef<Map<number, 'left' | 'right' | 'jump'>>(new Map());

  // === Auto-resize canvas to fit screen while keeping aspect ratio ===
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Available viewport
    const availW = window.innerWidth;
    const availH = window.innerHeight;

    const aspect = CANVAS_WIDTH / CANVAS_HEIGHT;
    const screenAspect = availW / availH;

    let cssW: number;
    let cssH: number;

    if (screenAspect > aspect) {
      // Screen wider than game — fit by height
      cssH = availH;
      cssW = availH * aspect;
    } else {
      // Screen taller/narrower than game — fit by width
      cssW = availW;
      cssH = availW / aspect;
    }

    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
  }, []);

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

  const getButtonFromTouch = useCallback(
    (touch: Touch, rect: DOMRect): 'left' | 'right' | 'jump' | null => {
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const x = (touch.clientX - rect.left) * scaleX;
      const y = (touch.clientY - rect.top) * scaleY;

      if (x >= 20 && x <= 150 && y >= CANVAS_HEIGHT - 130 && y <= CANVAS_HEIGHT) {
        return 'left';
      }
      if (x >= 160 && x <= 290 && y >= CANVAS_HEIGHT - 130 && y <= CANVAS_HEIGHT) {
        return 'right';
      }
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

    let jumpHeld = false;
    active.forEach((btn) => {
      if (btn === 'left') keys.left = true;
      if (btn === 'right') keys.right = true;
      if (btn === 'jump') jumpHeld = true;
    });

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

      const state = stateRef.current;
      const onMenu = !state.gameStarted || state.gameOver || state.gameWon;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const btn = getButtonFromTouch(touch, rect);

        if (btn) {
          activeTouchesRef.current.set(touch.identifier, btn);
          if (btn === 'jump' && onMenu) {
            keysRef.current.space = true;
            setTimeout(() => {
              keysRef.current.space = false;
            }, 100);
          }
        } else if (onMenu) {
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

    // Initial resize + listeners
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', resizeCanvas);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    let animId: number;

    function gameLoop() {
      const state = stateRef.current;
      const newState = update(state, keysRef.current);

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
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('orientationchange', resizeCanvas);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleKeyDown, handleKeyUp, handleTouchStart, handleTouchMove, handleTouchEnd, resizeCanvas]);

  return (
    <div
      ref={wrapperRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="block border-4 border-amber-600 rounded-lg shadow-2xl"
        style={{
          imageRendering: 'pixelated',
          touchAction: 'none',
          display: 'block',
        }}
        tabIndex={0}
      />
    </div>
  );
}
