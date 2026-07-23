import { useRef, useEffect, useCallback } from 'react';
import { Keys } from './types';
import { createInitialState, update } from './engine';
import { render, renderMobileControls, loadImages } from './renderer';
import { playJump, playCollect, playStomp, playHurt, playWin, playGameOver } from './audio';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Keys>({ left: false, right: false, up: false, space: false });
  const stateRef = useRef(createInitialState());
  const prevScoreRef = useRef(0);
  const prevLivesRef = useRef(3);
  const prevGameOverRef = useRef(false);
  const prevGameWonRef = useRef(false);
  const isMobileRef = useRef(false);

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

  const handleTouch = useCallback((e: TouchEvent) => {
    e.preventDefault();
    isMobileRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    const keys = keysRef.current;
    keys.left = false;
    keys.right = false;
    keys.up = false;
    keys.space = false;

    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      const x = (touch.clientX - rect.left) * scaleX;
      const y = (touch.clientY - rect.top) * scaleY;

      // Left button area
      if (x < 110 && y > CANVAS_HEIGHT - 100) {
        keys.left = true;
      }
      // Right button area
      if (x >= 110 && x < 200 && y > CANVAS_HEIGHT - 100) {
        keys.right = true;
      }
      // Jump button area
      if (x > CANVAS_WIDTH - 130 && y > CANVAS_HEIGHT - 100) {
        keys.up = true;
        keys.space = true;
      }
      // Tap anywhere to start/restart
      if (!stateRef.current.gameStarted || stateRef.current.gameOver || stateRef.current.gameWon) {
        keys.space = true;
      }
    }
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 0) {
      const keys = keysRef.current;
      keys.left = false;
      keys.right = false;
      keys.up = false;
      keys.space = false;
    } else {
      // Re-evaluate remaining touches
      handleTouch(e as unknown as TouchEvent);
    }
  }, [handleTouch]);

  useEffect(() => {
    loadImages();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    canvas.addEventListener('touchmove', handleTouch, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    let animId: number;

    function gameLoop() {
      const state = stateRef.current;
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

      // Reset space key after processing to prevent re-triggering
      if (keysRef.current.space && (!newState.gameStarted || newState.gameOver || newState.gameWon)) {
        setTimeout(() => {
          keysRef.current.space = false;
        }, 100);
      }

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
      canvas.removeEventListener('touchstart', handleTouch);
      canvas.removeEventListener('touchmove', handleTouch);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleKeyDown, handleKeyUp, handleTouch, handleTouchEnd]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="block max-w-full max-h-screen border-4 border-amber-600 rounded-lg shadow-2xl"
      style={{
        imageRendering: 'pixelated',
        aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}`,
      }}
      tabIndex={0}
    />
  );
}
