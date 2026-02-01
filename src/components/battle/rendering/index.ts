/**
 * Rendering Module
 *
 * Canvas drawing functions for the battle arena.
 * These are React/browser-specific and won't port to Godot directly.
 */

export { renderBattle } from './BattleRenderer';
export type { DustParticle, RenderContext } from './BattleRenderer';

export { drawParchmentBackground, drawVignette, drawParchmentNoise } from './drawBackground';
export { drawUnitShadow, drawUnitBody, drawHealthBar, drawDebuffIndicator } from './drawUnit';
export { drawProjectile } from './drawProjectile';
export { drawCastle, drawCastleHealthBar } from './drawCastle';
export { drawShockwave, drawDamageNumber } from './drawEffects';
export { drawSelectionBox } from './drawSelection';
export type { SelectionBox } from './drawSelection';
export { drawInkSplatters } from './drawInkSplatter';
export { drawCompassRose } from './drawCompass';
