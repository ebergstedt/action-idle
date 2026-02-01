/**
 * Projectile Entity
 *
 * A projectile that moves toward a target and damages units on impact.
 * Maps directly to Godot's Area2D with attached script.
 *
 * Godot equivalent:
 * - class_name Projectile extends Area2D
 * - _process(delta) handles movement
 * - Uses body_entered signal for collision
 */

import { Vector2 } from '../../physics/Vector2';
import { PROJECTILE_HIT_RADIUS, PROJECTILE_SPLASH_RADIUS, PROJECTILE_SPEED } from '../BattleConfig';
import { isOutOfBounds } from '../BoundsEnforcer';
import { Projectile, UnitTeam } from '../types';
import { BaseEntity } from './BaseEntity';
import { IBattleWorld } from './IBattleWorld';

/**
 * Projectile data.
 */
export interface ProjectileData {
  target: Vector2;
  speed: number;
  damage: number;
  sourceTeam: UnitTeam;
  color: string;
}

/**
 * Projectile entity with movement and hit detection.
 */
export class ProjectileEntity extends BaseEntity {
  public data: ProjectileData;

  constructor(id: string, position: Vector2, data: ProjectileData) {
    super(id, position);
    this.data = data;
  }

  // Accessors
  get target(): Vector2 {
    return this.data.target;
  }
  get speed(): number {
    return this.data.speed;
  }
  get damage(): number {
    return this.data.damage;
  }
  get sourceTeam(): UnitTeam {
    return this.data.sourceTeam;
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
   * Godot: _process(delta)
   */
  override update(delta: number): void {
    if (this._destroyed) return;

    // Move toward target
    const direction = this.target.subtract(this.position).normalize();
    const movement = direction.multiply(this.speed * delta);
    this.position = this.position.add(movement);

    // Check if out of bounds
    const world = this.getBattleWorld();
    if (world) {
      const bounds = world.getArenaBounds();
      if (bounds && isOutOfBounds(this.position, 0, bounds)) {
        this.markDestroyed();
        return;
      }
    }

    // Check if reached target
    const distToTarget = this.position.distanceTo(this.target);
    if (distToTarget < PROJECTILE_HIT_RADIUS) {
      this.onReachTarget();
    }
  }

  /**
   * Convert to legacy Projectile interface.
   */
  toLegacyProjectile(): Projectile {
    return {
      id: this.id,
      position: this.position,
      target: this.target,
      speed: this.speed,
      damage: this.damage,
      sourceTeam: this.sourceTeam,
      color: this.color,
    };
  }

  private onReachTarget(): void {
    const world = this.getBattleWorld();
    if (!world) {
      this.markDestroyed();
      return;
    }

    // Damage units at target location
    const units = world.getUnits();
    for (const unit of units) {
      if (unit.team === this.sourceTeam) continue;
      if (unit.health <= 0) continue;

      const dist = unit.position.distanceTo(this.target);
      if (dist < unit.size + PROJECTILE_SPLASH_RADIUS) {
        unit.takeDamage(this.damage);
      }
    }

    this.markDestroyed();
  }
}

/**
 * Factory function to create a projectile with default speed.
 */
export function createProjectile(
  id: string,
  position: Vector2,
  target: Vector2,
  damage: number,
  sourceTeam: UnitTeam,
  color: string
): ProjectileEntity {
  return new ProjectileEntity(id, position, {
    target,
    speed: PROJECTILE_SPEED,
    damage,
    sourceTeam,
    color,
  });
}
