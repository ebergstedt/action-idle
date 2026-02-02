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
import { getOppositeTeam, getTeamColor } from '../../theme/colors';
import {
  SHOCKWAVE_DEBUFF_DAMAGE,
  SHOCKWAVE_DEBUFF_DURATION_SECONDS,
  SHOCKWAVE_DEBUFF_MOVE_SPEED,
  BASE_SHOCKWAVE_EXPANSION_SPEED,
  SHOCKWAVE_MAX_RADIUS_FALLBACK,
  REFERENCE_ARENA_HEIGHT,
  scaleValue,
} from '../BattleConfig';
import { ShockwaveRenderData, UnitTeam } from '../types';
import { BaseEntity } from './BaseEntity';
import { IBattleWorld } from './IBattleWorld';
import { TemporaryModifier } from '../modifiers/TemporaryModifier';
import { UnitEntity } from './UnitEntity';

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
   * Expands the shockwave and checks for units to debuff/cleanse.
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

    // Process units within the new ring (between previous and current radius)
    this.processUnitsInRing(previousRadius, this.data.currentRadius);
  }

  /**
   * Process units within the shockwave ring.
   * - Units of the destroyed castle's team: apply debuff (demoralized)
   * - Units of the attacking team: clear enemy shockwave debuffs (rallied)
   */
  private processUnitsInRing(innerRadius: number, outerRadius: number): void {
    const world = this.getBattleWorld();
    if (!world) return;

    const attackingTeam = getOppositeTeam(this.sourceTeam);

    // Process units of the destroyed castle's team (apply debuff)
    const enemyUnits = world.getUnitsByTeam(this.sourceTeam);
    for (const unit of enemyUnits) {
      if (this.isUnitInRing(unit, innerRadius, outerRadius)) {
        this.applyDebuffToUnit(unit);
        this.data.hitUnitIds.add(unit.id);
      }
    }

    // Process units of the attacking team (clear enemy debuffs)
    const friendlyUnits = world.getUnitsByTeam(attackingTeam);
    for (const unit of friendlyUnits) {
      if (this.isUnitInRing(unit, innerRadius, outerRadius)) {
        this.clearDebuffFromUnit(unit);
        this.data.hitUnitIds.add(unit.id);
      }
    }
  }

  /**
   * Check if a unit is within the shockwave ring.
   */
  private isUnitInRing(unit: UnitEntity, innerRadius: number, outerRadius: number): boolean {
    // Skip already hit units
    if (this.data.hitUnitIds.has(unit.id)) return false;

    // Skip destroyed/dead units
    if (unit.isDestroyed() || unit.health <= 0) return false;

    // Check if unit is within the ring
    const distance = this.position.distanceTo(unit.position);
    return distance >= innerRadius && distance <= outerRadius + unit.size;
  }

  /**
   * Apply the shockwave debuff to a unit (enemy team - demoralized).
   * The debuff sourceTeam is the attacking team (opposite of the destroyed castle's team).
   */
  private applyDebuffToUnit(unit: UnitEntity): void {
    const world = this.getBattleWorld();
    if (!world) return;

    const attackingTeam = getOppositeTeam(this.sourceTeam);
    const modifierId = world.getNextModifierId();
    const modifier: TemporaryModifier = {
      id: `shockwave_debuff_${modifierId}`,
      sourceId: 'castle_death_shockwave',
      sourceTeam: attackingTeam, // The attacking team caused this debuff
      moveSpeedMod: SHOCKWAVE_DEBUFF_MOVE_SPEED,
      damageMod: SHOCKWAVE_DEBUFF_DAMAGE,
      collisionSizeMod: 0, // Shockwave doesn't affect collision size
      remainingDuration: SHOCKWAVE_DEBUFF_DURATION_SECONDS,
    };

    unit.applyModifier(modifier);
  }

  /**
   * Clear enemy debuffs from a unit (friendly team - rallied).
   * When your team destroys an enemy castle, the shockwave clears all
   * enemy debuffs from your units, but keeps friendly buffs intact.
   */
  private clearDebuffFromUnit(unit: UnitEntity): void {
    unit.clearEnemyDebuffs();
  }

  /**
   * Convert to render data for React layer.
   */
  toRenderData(): ShockwaveRenderData {
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
 *
 * The shockwave color is the ATTACKING team's color (the team that killed the castle).
 */
export function createShockwave(
  id: string,
  position: Vector2,
  sourceTeam: UnitTeam,
  maxRadius: number = SHOCKWAVE_MAX_RADIUS_FALLBACK,
  arenaHeight: number = REFERENCE_ARENA_HEIGHT
): ShockwaveEntity {
  // Shockwave color is the attacking team's color (opposite of the destroyed castle's team)
  const attackingTeam = getOppositeTeam(sourceTeam);
  const shockwaveColor = getTeamColor(attackingTeam);

  const data: ShockwaveData = {
    sourceTeam,
    maxRadius,
    expansionSpeed: scaleValue(BASE_SHOCKWAVE_EXPANSION_SPEED, arenaHeight),
    currentRadius: 0,
    hitUnitIds: new Set(),
    color: shockwaveColor,
  };

  return new ShockwaveEntity(id, position, data);
}
