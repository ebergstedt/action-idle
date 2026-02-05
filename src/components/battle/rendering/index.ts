/**
 * Rendering Module
 *
 * Canvas drawing functions for the battle arena.
 * These are React/browser-specific and won't port to Godot directly.
 */

export { renderBattle } from './BattleRenderer';
export type { RenderContext } from './BattleRenderer';
export type { DustParticle } from '../../../core/battle/particles';

export { drawParchmentBackground, drawVignette, drawParchmentNoise } from './drawBackground';
export {
  drawUnitShadow,
  drawUnitBody,
  drawHealthBar,
  drawDebuffIndicator,
  drawSquadLevels,
} from './drawUnit';
export { drawProjectile } from './drawProjectile';
export { drawCastle, drawCastleHealthBar } from './drawCastle';
export { drawShockwave, drawDamageNumber } from './drawEffects';
export { drawSelectionBox, drawSquadSelections } from './drawSelection';
export type { SelectionBox } from './drawSelection';
export { drawInkSplatters } from './drawInkSplatter';
export {
  drawDeploymentGrid,
  drawFootprintPreview,
  drawNoMansLand,
  drawFlankZones,
  drawDeploymentOverlay,
  drawBackgroundGrid,
} from './drawGrid';
