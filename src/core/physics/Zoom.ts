/**
 * Zoom Utilities
 *
 * Pure functions for zoom and pan calculations.
 * Extracted from BattleCanvas.tsx for Godot portability.
 *
 * Godot equivalent: Utility functions for Camera2D manipulation
 */

import { Vector2 } from './Vector2';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Current zoom and pan state.
 */
export interface ZoomPanState {
  /** Current zoom level (1.0 = no zoom) */
  zoom: number;
  /** Horizontal pan offset in pixels */
  panX: number;
  /** Vertical pan offset in pixels */
  panY: number;
}

/**
 * Configuration for zoom behavior.
 */
export interface ZoomConfig {
  /** Minimum zoom level (typically 1.0 for no zoom) */
  minZoom: number;
  /** Maximum zoom level (e.g., 3.0 for 3x magnification) */
  maxZoom: number;
  /** Zoom speed factor per scroll wheel delta */
  zoomSpeed: number;
}

/**
 * Viewport dimensions.
 */
export interface ViewportSize {
  width: number;
  height: number;
}

// =============================================================================
// DEFAULT STATE
// =============================================================================

/**
 * Creates a default zoom pan state (no zoom, centered).
 */
export function createDefaultZoomState(): ZoomPanState {
  return {
    zoom: 1.0,
    panX: 0,
    panY: 0,
  };
}

// =============================================================================
// COORDINATE TRANSFORMS
// =============================================================================

/**
 * Converts screen coordinates to world coordinates.
 * Use this to find where in the world a mouse click occurred.
 *
 * @param screenPos - Position in screen/canvas coordinates
 * @param state - Current zoom and pan state
 * @returns Position in world coordinates
 */
export function screenToWorld(screenPos: Vector2, state: ZoomPanState): Vector2 {
  const worldX = (screenPos.x - state.panX) / state.zoom;
  const worldY = (screenPos.y - state.panY) / state.zoom;
  return new Vector2(worldX, worldY);
}

/**
 * Converts world coordinates to screen coordinates.
 * Use this to find where in the viewport a world position appears.
 *
 * @param worldPos - Position in world coordinates
 * @param state - Current zoom and pan state
 * @returns Position in screen/canvas coordinates
 */
export function worldToScreen(worldPos: Vector2, state: ZoomPanState): Vector2 {
  const screenX = worldPos.x * state.zoom + state.panX;
  const screenY = worldPos.y * state.zoom + state.panY;
  return new Vector2(screenX, screenY);
}

// =============================================================================
// ZOOM CALCULATIONS
// =============================================================================

/**
 * Calculates a new zoom level based on wheel delta.
 *
 * @param currentZoom - Current zoom level
 * @param wheelDelta - Mouse wheel delta (negative = zoom in)
 * @param config - Zoom configuration
 * @returns New zoom level clamped to min/max
 */
export function calculateNewZoomLevel(
  currentZoom: number,
  wheelDelta: number,
  config: ZoomConfig
): number {
  const zoomDelta = -wheelDelta * config.zoomSpeed;
  const newZoom = currentZoom + zoomDelta * currentZoom;
  return Math.max(config.minZoom, Math.min(config.maxZoom, newZoom));
}

/**
 * Calculates new pan values to keep a point fixed during zoom.
 * This creates a "zoom toward mouse" effect.
 *
 * @param currentState - Current zoom and pan state
 * @param newZoom - New zoom level
 * @param mouseScreenPos - Mouse position in screen coordinates
 * @returns New pan values (panX, panY)
 */
export function calculateZoomPan(
  currentState: ZoomPanState,
  newZoom: number,
  mouseScreenPos: Vector2
): { panX: number; panY: number } {
  // Calculate the world position under the mouse before zoom
  const worldX = (mouseScreenPos.x - currentState.panX) / currentState.zoom;
  const worldY = (mouseScreenPos.y - currentState.panY) / currentState.zoom;

  // Calculate new pan to keep mouse position fixed
  const newPanX = mouseScreenPos.x - worldX * newZoom;
  const newPanY = mouseScreenPos.y - worldY * newZoom;

  return { panX: newPanX, panY: newPanY };
}

/**
 * Clamps pan values to keep the view within bounds.
 * Prevents panning past the edges of the world.
 *
 * @param state - Current zoom and pan state
 * @param viewportSize - Viewport dimensions
 * @returns Clamped zoom pan state
 */
export function clampPan(state: ZoomPanState, viewportSize: ViewportSize): ZoomPanState {
  const maxPanX = 0;
  const minPanX = viewportSize.width - viewportSize.width * state.zoom;
  const maxPanY = 0;
  const minPanY = viewportSize.height - viewportSize.height * state.zoom;

  return {
    zoom: state.zoom,
    panX: Math.max(minPanX, Math.min(maxPanX, state.panX)),
    panY: Math.max(minPanY, Math.min(maxPanY, state.panY)),
  };
}

/**
 * Calculates the complete zoom state after a wheel event.
 * Combines zoom level calculation, pan adjustment, and clamping.
 *
 * @param currentState - Current zoom and pan state
 * @param mouseScreenPos - Mouse position in screen coordinates
 * @param wheelDelta - Mouse wheel delta (negative = zoom in)
 * @param config - Zoom configuration
 * @param viewportSize - Viewport dimensions
 * @returns New zoom pan state
 */
export function calculateZoom(
  currentState: ZoomPanState,
  mouseScreenPos: Vector2,
  wheelDelta: number,
  config: ZoomConfig,
  viewportSize: ViewportSize
): ZoomPanState {
  // Calculate new zoom level
  const newZoom = calculateNewZoomLevel(currentState.zoom, wheelDelta, config);

  // Calculate new pan to keep mouse position fixed
  const { panX, panY } = calculateZoomPan(currentState, newZoom, mouseScreenPos);

  // Create new state and clamp pan values
  const newState: ZoomPanState = { zoom: newZoom, panX, panY };
  return clampPan(newState, viewportSize);
}
