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
import {
  PROJECTILE_HIT_RADIUS,
  PROJECTILE_SPLASH_RADIUS,
  BASE_PROJECTILE_SPEED,
  scaleValue,
} from '../BattleConfig';
import { isOutOfBounds } from '../BoundsEnforcer';
import { ProjectileRenderData, UnitTeam } from '../types';
import { BaseEntity } from './BaseEntity';
import { IBattleWorld } from './IBattleWorld';
import { UnitEntity } from './UnitEntity';

/**
 * Projectile data.
 */
export interface ProjectileData {
  target: Vector2;
  speed: number;
  damage: number;
  sourceTeam: UnitTeam;
  sourceUnit: UnitEntity | null;
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
  get sourceUnit(): UnitEntity | null {
    return this.data.sourceUnit;
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
   * Convert to render data for React layer.
   */
  toRenderData(): ProjectileRenderData {
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

    // Damage all enemy damageables (units and castles) at target location
    const damageables = world.getDamageables();
    for (const target of damageables) {
      if (target.team === this.sourceTeam) continue;

      const dist = target.position.distanceTo(this.target);
      if (dist < target.size + PROJECTILE_SPLASH_RADIUS) {
        target.takeDamage(this.damage, this.sourceUnit ?? undefined);
      }
    }

    this.markDestroyed();
  }
}

/**
 * Factory function to create a projectile with scaled speed.
 * @param arenaHeight - Arena height for scaling projectile speed
 */
export function createProjectile(
  id: string,
  position: Vector2,
  target: Vector2,
  damage: number,
  sourceTeam: UnitTeam,
  sourceUnit: UnitEntity | null,
  color: string,
  arenaHeight: number = 600
): ProjectileEntity {
  return new ProjectileEntity(id, position, {
    target,
    speed: scaleValue(BASE_PROJECTILE_SPEED, arenaHeight),
    damage,
    sourceTeam,
    sourceUnit,
    color,
  });
}
