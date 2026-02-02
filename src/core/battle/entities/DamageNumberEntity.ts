/**
 * Damage Number Entity
 *
 * A floating damage number that appears when units take damage.
 * Floats upward and fades out over time.
 *
 * Godot equivalent: A Label node with animation/tween for float and fade.
 */

import { Vector2 } from '../../physics/Vector2';
import { BASE_DAMAGE_NUMBER_FLOAT_DISTANCE, scaleValue } from '../BattleConfig';
import { EntityKind } from '../IEntity';
import { UnitTeam } from '../types';
import { BaseEntity } from './BaseEntity';

/**
 * Data for a damage number.
 */
export interface DamageNumberData {
  /** Damage amount to display */
  amount: number;
  /** Team that dealt the damage (for color) */
  sourceTeam: UnitTeam;
  /** Time remaining before removal */
  lifetime: number;
  /** Total duration for calculating progress */
  maxLifetime: number;
  /** Starting Y position */
  startY: number;
  /** Arena height for scaling */
  arenaHeight: number;
}

/**
 * Render data for damage numbers.
 */
export interface DamageNumberRenderData {
  id: string;
  position: Vector2;
  amount: number;
  sourceTeam: UnitTeam;
  /** Progress from 0 (just spawned) to 1 (about to disappear) */
  progress: number;
}

/**
 * Floating damage number entity.
 */
export class DamageNumberEntity extends BaseEntity {
  public readonly kind: EntityKind = 'damage_number';
  public data: DamageNumberData;

  constructor(id: string, position: Vector2, data: DamageNumberData) {
    super(id, position);
    this.data = data;
  }

  get amount(): number {
    return this.data.amount;
  }

  get sourceTeam(): UnitTeam {
    return this.data.sourceTeam;
  }

  get lifetime(): number {
    return this.data.lifetime;
  }

  /**
   * Get progress from 0 (just spawned) to 1 (about to disappear).
   */
  get progress(): number {
    return 1 - this.data.lifetime / this.data.maxLifetime;
  }

  override update(delta: number): void {
    if (this._destroyed) return;

    // Decrease lifetime
    this.data.lifetime -= delta;

    // Float upward based on progress
    const floatDistance = scaleValue(BASE_DAMAGE_NUMBER_FLOAT_DISTANCE, this.data.arenaHeight);
    this.position.y = this.data.startY - floatDistance * this.progress;

    // Mark for removal when lifetime expires
    if (this.data.lifetime <= 0) {
      this.markDestroyed();
    }
  }

  toRenderData(): DamageNumberRenderData {
    return {
      id: this.id,
      position: this.position.clone(),
      amount: this.amount,
      sourceTeam: this.sourceTeam,
      progress: this.progress,
    };
  }
}
