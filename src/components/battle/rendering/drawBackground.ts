/**
 * Background Drawing Functions
 *
 * Renders industrial combat arena floor with subtle texture.
 * Creates a clean mech battle aesthetic.
 */

import {
  VIGNETTE_INTENSITY,
  VIGNETTE_RADIUS,
  VIGNETTE_COLOR,
  PARCHMENT_NOISE_DENSITY,
  PARCHMENT_NOISE_OPACITY,
  PARCHMENT_NOISE_SIZE_MIN,
  PARCHMENT_NOISE_SIZE_MAX,
} from '../../../core/battle/BattleConfig';
import { ARENA_COLORS, UI_COLORS } from '../../../core/theme/colors';
import battleground2Url from '../../../assets/battleground2.png';

/**
 * Cached background image.
 */
let backgroundImage: HTMLImageElement | null = null;
let backgroundLoaded = false;

// Preload the background image
const img = new Image();
img.src = battleground2Url;
img.onload = () => {
  backgroundImage = img;
  backgroundLoaded = true;
};
img.onerror = () => {
  console.warn('Failed to load battleground2.png');
};

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
 * Generate floor texture pattern as offscreen canvas.
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

  // Draw noise dots in metallic tones for industrial floor texture
  ctx.fillStyle = UI_COLORS.white;
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

  // Add some lighter metallic spots for variation
  ctx.fillStyle = UI_COLORS.metalDark;
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
 * Draw floor texture overlay.
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
  gradient.addColorStop(
    1,
    `rgba(${VIGNETTE_COLOR.r}, ${VIGNETTE_COLOR.g}, ${VIGNETTE_COLOR.b}, ${VIGNETTE_INTENSITY})`
  );

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Draw complete arena background with base color and texture.
 * Note: Vignette is drawn separately at the end of the render pass
 * so it affects all game elements.
 */
export function drawParchmentBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  // 1. Base arena floor color (fallback while image loads)
  ctx.fillStyle = ARENA_COLORS.background;
  ctx.fillRect(0, 0, width, height);

  // 2. Draw background image if loaded (covers entire arena)
  if (backgroundLoaded && backgroundImage) {
    ctx.drawImage(backgroundImage, 0, 0, width, height);
  } else {
    // Texture overlay as fallback (blends with alpha)
    drawParchmentNoise(ctx, width, height);
  }
}
