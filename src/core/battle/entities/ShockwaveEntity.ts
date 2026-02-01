/**
 * Shockwave Entity
 *
 * An expanding circular shockwave that applies debuffs to enemy units.
 * Spawned when a castle is destroyed.
 *
 * Godot equivalent:
 * - class_name Shockwave extends Node2D
 * - _process(delta) handles expansion
 * - Uses Area2D for collision detection
 */

import { Vector2 } from '../../physics/Vector2';
import { DEBUFF_COLORS } from '../../theme/colors';
import {
  SHOCKWAVE_DEBUFF_DAMAGE,
  SHOCKWAVE_DEBUFF_DURATION_SECONDS,
  SHOCKWAVE_DEBUFF_MOVE_SPEED,
  BASE_SHOCKWAVE_EXPANSION_SPEED,
  SHOCKWAVE_MAX_RADIUS_FALLBACK,
  scaleValue,
} from '../BattleConfig';
import { Shockwave, UnitTeam } from '../types';
import { BaseEntity } from './BaseEntity';
import { IBattleWorld } from './IBattleWorld';
import { TemporaryModifier, UnitEntity } from './UnitEntity';

/**
 * Shockwave data.
 */
export interface ShockwaveData {
  /** Team whose castle was destroyed (this team's units get debuffed) */
  sourceTeam: UnitTeam;
  /** Maximum radius before shockwave disappears */
  maxRadius: number;
  /** Expansion speed in pixels per second */
  expansionSpeed: number;
  /** Current radius of the shockwave */
  currentRadius: number;
  /** Track units already debuffed to avoid re-applying */
  hitUnitIds: Set<string>;
  /** Color for rendering */
  color: string;
}

let nextModifierId = 1;

/**
 * Shockwave entity - expanding ring that debuffs enemies.
 */
export class ShockwaveEntity extends BaseEntity {
  public data: ShockwaveData;

  constructor(id: string, position: Vector2, data: ShockwaveData) {
    super(id, position);
    this.data = data;
  }

  // Accessors
  get sourceTeam(): UnitTeam {
    return this.data.sourceTeam;
  }
  get currentRadius(): number {
    return this.data.currentRadius;
  }
  get maxRadius(): number {
    return this.data.maxRadius;
  }
  get color(): string {
    return this.data.color;
  }

  /**
   * Get the world as IBattleWorld for battle-specific queries.
   */
  private getBattleWorld(): IBattleWorld | null {
    return this.world as IBattleWorld | null;
  }

  /**
   * Main update loop.
   * Expands the shockwave and checks for units to debuff.
   */
  override update(delta: number): void {
    if (this._destroyed) return;

    // Expand the shockwave
    const previousRadius = this.data.currentRadius;
    this.data.currentRadius += this.data.expansionSpeed * delta;

    // Check if we've reached max radius
    if (this.data.currentRadius >= this.data.maxRadius) {
      this.markDestroyed();
      return;
    }

    // Find enemy units within the new ring (between previous and current radius)
    this.applyDebuffsToUnitsInRing(previousRadius, this.data.currentRadius);
  }

  /**
   * Apply debuffs to units of the same team as the destroyed castle.
   * When a castle is destroyed, its own team's units are debuffed (demoralized).
   */
  private applyDebuffsToUnitsInRing(innerRadius: number, outerRadius: number): void {
    const world = this.getBattleWorld();
    if (!world) return;

    // Get units of the same team as the destroyed castle (they get debuffed)
    const affectedUnits = world.getUnitsByTeam(this.sourceTeam);

    for (const unit of affectedUnits) {
      // Skip already hit units
      if (this.data.hitUnitIds.has(unit.id)) continue;

      // Skip destroyed/dead units
      if (unit.isDestroyed() || unit.health <= 0) continue;

      // Check if unit is within the ring
      const distance = this.position.distanceTo(unit.position);

      // Unit is hit if its center is within the ring
      if (distance >= innerRadius && distance <= outerRadius + unit.size) {
        this.applyDebuffToUnit(unit);
        this.data.hitUnitIds.add(unit.id);
      }
    }
  }

  /**
   * Apply the shockwave debuff to a unit.
   */
  private applyDebuffToUnit(unit: UnitEntity): void {
    const modifier: TemporaryModifier = {
      id: `shockwave_debuff_${nextModifierId++}`,
      sourceId: 'castle_death_shockwave',
      moveSpeedMod: SHOCKWAVE_DEBUFF_MOVE_SPEED,
      damageMod: SHOCKWAVE_DEBUFF_DAMAGE,
      remainingDuration: SHOCKWAVE_DEBUFF_DURATION_SECONDS,
    };

    unit.applyModifier(modifier);
  }

  /**
   * Convert to legacy Shockwave interface for React rendering.
   */
  toLegacyShockwave(): Shockwave {
    return {
      id: this.id,
      position: this.position,
      currentRadius: this.currentRadius,
      maxRadius: this.maxRadius,
      sourceTeam: this.sourceTeam,
      color: this.color,
    };
  }
}

/**
 * Factory function to create a shockwave at a castle's position.
 * @param sourceTeam - The team whose castle was destroyed (this team's units get debuffed)
 * @param maxRadius - Maximum expansion radius (should be arena diagonal for full coverage)
 * @param arenaHeight - Arena height for scaling expansion speed
 */
export function createShockwave(
  id: string,
  position: Vector2,
  sourceTeam: UnitTeam,
  maxRadius: number = SHOCKWAVE_MAX_RADIUS_FALLBACK,
  arenaHeight: number = 600
): ShockwaveEntity {
  const data: ShockwaveData = {
    sourceTeam,
    maxRadius,
    expansionSpeed: scaleValue(BASE_SHOCKWAVE_EXPANSION_SPEED, arenaHeight),
    currentRadius: 0,
    hitUnitIds: new Set(),
    color: DEBUFF_COLORS.shockwaveRing,
  };

  return new ShockwaveEntity(id, position, data);
}
