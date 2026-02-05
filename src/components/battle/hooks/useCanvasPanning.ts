/**
 * Canvas Panning Hook
 *
 * Handles WASD keyboard panning and edge-of-screen mouse panning.
 * Only active when zoomed in (zoom > 1.0).
 */

import { useEffect, useRef, useCallback } from 'react';
import { ZoomState } from './useCanvasInput';
import { clampPan } from '../../../core/physics/Zoom';
import {
  KEYBOARD_PAN_SPEED,
  EDGE_PAN_SPEED,
  EDGE_ZONE_SIZE,
} from '../../../core/battle/BattleConfig';

interface UseCanvasPanningProps {
  /** Callback to update zoom state */
  setZoomState: React.Dispatch<React.SetStateAction<ZoomState>>;
  /** Canvas width */
  width: number;
  /** Canvas height */
  height: number;
  /** Reference to canvas element for mouse position detection */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** Whether panning is enabled (disabled at min zoom) */
  enabled: boolean;
}

interface PanDirection {
  x: number; // -1, 0, or 1
  y: number; // -1, 0, or 1
}

export function useCanvasPanning({
  setZoomState,
  width,
  height,
  canvasRef,
  enabled,
}: UseCanvasPanningProps): void {
  // Track which keys are pressed
  const keysPressed = useRef<Set<string>>(new Set());
  // Track mouse position for edge panning
  const mousePos = useRef<{ x: number; y: number } | null>(null);
  // Track if mouse is over canvas
  const isMouseOverCanvas = useRef(false);

  // Calculate pan direction from keyboard input
  const getKeyboardPanDirection = useCallback((): PanDirection => {
    const keys = keysPressed.current;
    let x = 0;
    let y = 0;

    if (keys.has('w') || keys.has('arrowup')) y = 1; // Pan up (move view up = increase panY)
    if (keys.has('s') || keys.has('arrowdown')) y = -1; // Pan down
    if (keys.has('a') || keys.has('arrowleft')) x = 1; // Pan left
    if (keys.has('d') || keys.has('arrowright')) x = -1; // Pan right

    return { x, y };
  }, []);

  // Calculate pan direction from mouse edge position
  const getEdgePanDirection = useCallback((): PanDirection => {
    if (!isMouseOverCanvas.current || !mousePos.current) {
      return { x: 0, y: 0 };
    }

    const { x, y } = mousePos.current;
    let dirX = 0;
    let dirY = 0;

    // Check horizontal edges
    if (x < EDGE_ZONE_SIZE)
      dirX = 1; // Mouse at left edge, pan left (increase panX)
    else if (x > width - EDGE_ZONE_SIZE) dirX = -1; // Mouse at right edge, pan right

    // Check vertical edges
    if (y < EDGE_ZONE_SIZE)
      dirY = 1; // Mouse at top edge, pan up
    else if (y > height - EDGE_ZONE_SIZE) dirY = -1; // Mouse at bottom edge, pan down

    return { x: dirX, y: dirY };
  }, [width, height]);

  // Animation loop for smooth panning
  useEffect(() => {
    if (!enabled) return;

    let frameId: number;
    let lastTime = performance.now();

    const animate = () => {
      const now = performance.now();
      const delta = (now - lastTime) / 1000; // Convert to seconds
      lastTime = now;

      // Get combined pan direction from keyboard and edge
      const keyDir = getKeyboardPanDirection();
      const edgeDir = getEdgePanDirection();

      // Combine directions (keyboard takes priority if both active)
      const hasKeyInput = keyDir.x !== 0 || keyDir.y !== 0;
      const dir = hasKeyInput ? keyDir : edgeDir;

      if (dir.x !== 0 || dir.y !== 0) {
        const speed = hasKeyInput ? KEYBOARD_PAN_SPEED : EDGE_PAN_SPEED;

        setZoomState((prev) => {
          const newState = {
            ...prev,
            panX: prev.panX + dir.x * speed * delta,
            panY: prev.panY + dir.y * speed * delta,
          };
          return clampPan(newState, { width, height });
        });
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [enabled, width, height, setZoomState, getKeyboardPanDirection, getEdgePanDirection]);

  // Keyboard event handlers
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        keysPressed.current.add(key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current.delete(key);
    };

    // Clear keys when window loses focus
    const handleBlur = () => {
      keysPressed.current.clear();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [enabled]);

  // Mouse tracking for edge panning (document-level to avoid ref timing issues)
  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        isMouseOverCanvas.current = false;
        mousePos.current = null;
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check if mouse is within canvas bounds
      const isOver = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;
      isMouseOverCanvas.current = isOver;

      if (isOver) {
        mousePos.current = { x, y };
      } else {
        mousePos.current = null;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [enabled, canvasRef]);
}
