/**
 * Background Drawing Functions
 *
 * Renders parchment background with noise texture and vignette effect.
 * Creates an aged, hand-drawn map aesthetic.
 */

import {
  VIGNETTE_INTENSITY,
  VIGNETTE_RADIUS,
  PARCHMENT_NOISE_DENSITY,
  PARCHMENT_NOISE_OPACITY,
  PARCHMENT_NOISE_SIZE_MIN,
  PARCHMENT_NOISE_SIZE_MAX,
} from '../../../core/battle/BattleConfig';
import { ARENA_COLORS, UI_COLORS } from '../../../core/theme/colors';

/**
 * Cached noise pattern as offscreen canvas for proper blending.
 * Key is "width,height", value is CanvasImageSource.
 */
const noiseCache = new Map<string, HTMLCanvasElement>();

/**
 * Simple seeded random number generator for consistent noise.
 */
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

/**
 * Generate parchment noise pattern as offscreen canvas.
 * Uses seeded random for consistent pattern across frames.
 */
function generateNoiseCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Start with transparent
  ctx.clearRect(0, 0, width, height);

  // Calculate number of dots based on area and density
  const area = width * height;
  const dotCount = Math.floor((area / 10000) * PARCHMENT_NOISE_DENSITY);

  // Use seeded random for consistent pattern
  const random = seededRandom(42);

  // Draw noise dots in darker parchment color
  ctx.fillStyle = UI_COLORS.inkFaded;
  ctx.globalAlpha = PARCHMENT_NOISE_OPACITY;

  for (let i = 0; i < dotCount; i++) {
    const x = random() * width;
    const y = random() * height;
    const size =
      PARCHMENT_NOISE_SIZE_MIN + random() * (PARCHMENT_NOISE_SIZE_MAX - PARCHMENT_NOISE_SIZE_MIN);

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Add some lighter spots too for variation
  ctx.fillStyle = UI_COLORS.parchmentDark;
  ctx.globalAlpha = PARCHMENT_NOISE_OPACITY * 0.5;

  for (let i = 0; i < dotCount / 3; i++) {
    const x = random() * width;
    const y = random() * height;
    const size =
      PARCHMENT_NOISE_SIZE_MIN + random() * (PARCHMENT_NOISE_SIZE_MAX - PARCHMENT_NOISE_SIZE_MIN);

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}

/**
 * Get or create cached noise canvas for given dimensions.
 */
function getNoiseCanvas(width: number, height: number): HTMLCanvasElement {
  const key = `${width},${height}`;
  let canvas = noiseCache.get(key);

  if (!canvas) {
    canvas = generateNoiseCanvas(width, height);
    noiseCache.set(key, canvas);

    // Limit cache size to prevent memory issues
    if (noiseCache.size > 5) {
      const firstKey = noiseCache.keys().next().value;
      if (firstKey) noiseCache.delete(firstKey);
    }
  }

  return canvas;
}

/**
 * Draw parchment noise texture overlay.
 * Uses drawImage instead of putImageData to respect blend modes.
 */
export function drawParchmentNoise(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const noiseCanvas = getNoiseCanvas(width, height);
  ctx.drawImage(noiseCanvas, 0, 0);
}

/**
 * Draw vignette effect (darkened edges).
 */
export function drawVignette(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const centerX = width / 2;
  const centerY = height / 2;
  const diagonal = Math.sqrt(width * width + height * height);
  const innerRadius = diagonal * VIGNETTE_RADIUS;
  const outerRadius = diagonal * 0.75;

  // Create radial gradient from center (transparent) to edges (dark)
  const gradient = ctx.createRadialGradient(
    centerX,
    centerY,
    innerRadius,
    centerX,
    centerY,
    outerRadius
  );

  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, `rgba(60, 40, 20, ${VIGNETTE_INTENSITY})`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Draw complete parchment background with base color, grid, and noise.
 * Note: Vignette is drawn separately at the end of the render pass
 * so it affects all game elements.
 */
export function drawParchmentBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  // 1. Base parchment color
  ctx.fillStyle = ARENA_COLORS.background;
  ctx.fillRect(0, 0, width, height);

  // 2. Ruled paper lines
  drawPaperLines(ctx, width, height);

  // 3. Noise texture overlay (blends with alpha)
  drawParchmentNoise(ctx, width, height);
}

/**
 * Draw horizontal ruled lines like notebook paper.
 */
function drawPaperLines(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.strokeStyle = ARENA_COLORS.gridLine;
  ctx.lineWidth = 1;

  const lineSpacing = 40;

  // Horizontal ruled lines
  for (let y = 0; y < height; y += lineSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}
