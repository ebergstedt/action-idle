/**
 * Castle Entity
 *
 * A stationary objective that teams must defend/attack.
 * Castles have health but no attack - they're pure objectives.
 * Implements IObstacle for collision and deployment blocking.
 *
 * Godot equivalent:
 * - class_name Castle extends StaticBody2D
 * - No _process logic needed (stationary)
 * - Signals: damaged, destroyed
 */

import { Vector2 } from '../../physics/Vector2';
import { EntityKind } from '../IEntity';
import type { GridFootprint } from '../grid/GridTypes';
import type { IObstacle } from '../obstacles/Obstacle';
import { CastleRenderData } from '../types';
import { UnitTeam } from '../units/types';
import { BaseEntity } from './BaseEntity';

/**
 * Castle data.
 */
export interface CastleData {
  team: UnitTeam;
  maxHealth: number;
  health: number;
  /** Grid footprint (cols x rows) */
  gridFootprint: GridFootprint;
  color: string;
}

/**
 * Castle entity - stationary objective and obstacle.
 */
export class CastleEntity extends BaseEntity implements IObstacle {
  public readonly kind: EntityKind = 'castle';
  public data: CastleData;

  // IObstacle implementation
  public readonly blocksMovement: boolean = true;
  public readonly blocksDeployment: boolean = true;

  constructor(id: string, position: Vector2, data: CastleData) {
    super(id, position);
    this.data = data;
  }

  // Accessors
  get team(): UnitTeam {
    return this.data.team;
  }
  get maxHealth(): number {
    return this.data.maxHealth;
  }
  get health(): number {
    return this.data.health;
  }
  set health(value: number) {
    this.data.health = value;
  }
  get gridFootprint(): GridFootprint {
    return this.data.gridFootprint;
  }
  get color(): string {
    return this.data.color;
  }
  /** Deprecated: use gridFootprint instead. Returns half-width for backwards compatibility. */
  get size(): number {
    // Backwards compatibility: return approximate half-size
    return (this.data.gridFootprint.cols * 8) / 2; // Approximate for rendering
  }

  /**
   * Castles are stationary - no update logic needed.
   * Death is handled by takeDamage() which emits the 'killed' event.
   * This method exists for IEntity compliance but does nothing.
   */
  override update(_delta: number): void {
    // Death is handled by takeDamage() - no action needed here
  }

  /**
   * Apply damage to this castle.
   * @param amount - Damage to apply
   * @param attacker - The entity that dealt the damage (optional)
   */
  takeDamage(amount: number, attacker?: BaseEntity): void {
    const previousHealth = this.health;
    this.health = Math.max(0, this.health - amount);

    this.emit({
      type: 'damaged',
      entity: this,
      attacker,
      amount,
      previousHealth,
      currentHealth: this.health,
    });

    if (this.health <= 0 && !this._destroyed) {
      this.markDestroyed();
      this.emit({ type: 'killed', entity: this, killer: attacker });
    }
  }

  /**
   * Convert to render data for React layer.
   * Returns a plain object compatible with the CastleRenderData interface in types.ts.
   */
  toRenderData(): CastleRenderData {
    return {
      id: this.id,
      team: this.team,
      position: this.position,
      health: this.health,
      maxHealth: this.maxHealth,
      gridFootprint: this.gridFootprint,
      size: this.size, // Deprecated - kept for backwards compatibility
      color: this.color,
    };
  }

  override isDestroyed(): boolean {
    // Rely solely on _destroyed flag set by takeDamage() when health reaches 0.
    // This ensures the 'killed' event is emitted before isDestroyed() returns true.
    return this._destroyed;
  }
}
