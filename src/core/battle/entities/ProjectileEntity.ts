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
  BASE_PROJECTILE_SPEED,
  REFERENCE_ARENA_HEIGHT,
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
  /** Splash/AoE damage radius (0 = single target) */
  splashRadius: number;
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
  get splashRadius(): number {
    return this.data.splashRadius;
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

    const damageables = world.getDamageables();

    // AoE/Splash damage: hit all enemies within splash radius
    if (this.splashRadius > 0) {
      for (const target of damageables) {
        if (target.team === this.sourceTeam) continue;

        const dist = target.position.distanceTo(this.target);
        const hitRange = target.size + this.splashRadius;
        if (dist <= hitRange) {
          target.takeDamage(this.damage, this.sourceUnit ?? undefined);
        }
      }
      this.markDestroyed();
      return;
    }

    // Single target: find the closest enemy damageable within hit radius
    let closestTarget: (typeof damageables)[0] | null = null;
    let closestDist = Infinity;

    for (const target of damageables) {
      if (target.team === this.sourceTeam) continue;

      const dist = target.position.distanceTo(this.target);
      const hitRange = target.size + PROJECTILE_HIT_RADIUS;
      if (dist < hitRange && dist < closestDist) {
        closestTarget = target;
        closestDist = dist;
      }
    }

    // Damage only the closest target
    if (closestTarget) {
      closestTarget.takeDamage(this.damage, this.sourceUnit ?? undefined);
    }

    this.markDestroyed();
  }
}

/**
 * Factory function to create a projectile with scaled speed.
 * @param arenaHeight - Arena height for scaling projectile speed
 * @param projectileSpeed - Override base projectile speed (optional)
 * @param splashRadius - AoE damage radius, 0 = single target (optional)
 */
export function createProjectile(
  id: string,
  position: Vector2,
  target: Vector2,
  damage: number,
  sourceTeam: UnitTeam,
  sourceUnit: UnitEntity | null,
  color: string,
  arenaHeight: number = REFERENCE_ARENA_HEIGHT,
  projectileSpeed?: number,
  splashRadius: number = 0
): ProjectileEntity {
  const baseSpeed = projectileSpeed ?? BASE_PROJECTILE_SPEED;
  return new ProjectileEntity(id, position, {
    target,
    speed: scaleValue(baseSpeed, arenaHeight),
    damage,
    sourceTeam,
    sourceUnit,
    color,
    splashRadius: scaleValue(splashRadius, arenaHeight),
  });
}
