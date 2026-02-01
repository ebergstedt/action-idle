/**
 * Unit Entity
 *
 * A unit that handles its own behavior: targeting, movement, combat.
 * Maps directly to Godot's CharacterBody2D with attached script.
 *
 * Godot equivalent:
 * - class_name Unit extends CharacterBody2D
 * - _process(delta) handles all behavior
 * - Signals: died, attacked, damaged
 */

import { Vector2 } from '../../physics/Vector2';
import { getProjectileColor } from '../../theme/colors';
import {
  ALLY_AVOIDANCE_FORCE,
  BLOCKED_TARGET_PENALTY,
  FOCUS_FIRE_BONUS,
  MAX_FOCUS_FIRE_ALLIES,
  MELEE_ATTACK_RANGE_THRESHOLD,
  MELEE_RANGE_BUFFER,
  UNIT_SPACING,
} from '../BattleConfig';
import { clampToArenaInPlace } from '../BoundsEnforcer';
import { applyShuffle } from '../shuffle';
import { AttackMode, Unit, UnitStats, UnitTeam, UnitType } from '../types';
import { BaseEntity } from './BaseEntity';
import { IBattleWorld } from './IBattleWorld';

/**
 * Unit data that UnitEntity wraps.
 * This is the "component data" - UnitEntity is the "behavior".
 */
export interface UnitData {
  type: UnitType;
  team: UnitTeam;
  health: number;
  stats: UnitStats;
  color: string;
  shape: 'circle' | 'square' | 'triangle';
  size: number;
  // Combat state
  target: UnitEntity | null;
  attackCooldown: number;
  shuffleDirection: Vector2 | null;
  shuffleTimer: number;
}

/**
 * Unit entity with full behavior.
 */
export class UnitEntity extends BaseEntity {
  public data: UnitData;

  constructor(id: string, position: Vector2, data: UnitData) {
    super(id, position);
    this.data = data;
  }

  // Accessors for common properties
  get team(): UnitTeam {
    return this.data.team;
  }
  get type(): UnitType {
    return this.data.type;
  }
  get health(): number {
    return this.data.health;
  }
  set health(value: number) {
    this.data.health = value;
  }
  get stats(): UnitStats {
    return this.data.stats;
  }
  get size(): number {
    return this.data.size;
  }
  get color(): string {
    return this.data.color;
  }
  get shape(): 'circle' | 'square' | 'triangle' {
    return this.data.shape;
  }
  get target(): UnitEntity | null {
    return this.data.target;
  }
  set target(value: UnitEntity | null) {
    this.data.target = value;
  }
  get attackCooldown(): number {
    return this.data.attackCooldown;
  }
  set attackCooldown(value: number) {
    this.data.attackCooldown = value;
  }

  // Shuffle state accessors (for shuffle.ts compatibility)
  get shuffleDirection(): Vector2 | null {
    return this.data.shuffleDirection;
  }
  set shuffleDirection(value: Vector2 | null) {
    this.data.shuffleDirection = value;
  }
  get shuffleTimer(): number {
    return this.data.shuffleTimer;
  }
  set shuffleTimer(value: number) {
    this.data.shuffleTimer = value;
  }

  /**
   * Get the world as IBattleWorld for battle-specific queries.
   */
  private getBattleWorld(): IBattleWorld | null {
    return this.world as IBattleWorld | null;
  }

  /**
   * Main update loop - called every frame.
   * Godot: _process(delta)
   */
  override update(delta: number): void {
    if (this.health <= 0) {
      this.markDestroyed();
      this.emit({ type: 'killed', entity: this });
      return;
    }

    // Phase 1: Target acquisition
    this.updateTargeting();

    // Phase 2: Combat (attacks)
    this.updateCombat(delta);

    // Phase 3: Movement
    this.updateMovement(delta);

    // Phase 4: Boundary enforcement
    this.enforceBounds();
  }

  /**
   * Apply damage to this unit.
   * @param amount - Damage to apply
   * @param attacker - The entity that dealt the damage (optional)
   */
  takeDamage(amount: number, attacker?: UnitEntity): void {
    const previousHealth = this.health;
    this.health = Math.max(0, this.health - amount);

    // Emit damaged event: entity = who was damaged, attacker = who caused it
    this.emit({
      type: 'damaged',
      entity: this,
      attacker,
      amount,
      previousHealth,
      currentHealth: this.health,
    });

    if (this.health <= 0) {
      this.markDestroyed();
      // Emit killed event: entity = who died, killer = who killed them
      this.emit({ type: 'killed', entity: this, killer: attacker });
    }
  }

  /**
   * Convert to legacy Unit interface for backward compatibility.
   * Note: target is set to null to avoid infinite recursion when units target each other.
   * React rendering doesn't need the full target object - that's internal battle logic.
   */
  toLegacyUnit(): Unit {
    return {
      id: this.id,
      type: this.type,
      team: this.team,
      position: this.position,
      health: this.health,
      stats: this.stats,
      target: null, // Avoid circular reference - React doesn't need target for rendering
      attackCooldown: this.attackCooldown,
      color: this.color,
      shape: this.shape,
      size: this.size,
      shuffleDirection: this.shuffleDirection,
      shuffleTimer: this.shuffleTimer,
    };
  }

  // === Private behavior methods ===

  private updateTargeting(): void {
    const world = this.getBattleWorld();
    if (!world) return;

    // Find new target if none or target is dead
    if (!this.target || this.target.isDestroyed() || this.target.health <= 0) {
      this.target = this.findBestTarget();
    }
  }

  private updateCombat(delta: number): void {
    // Update cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }

    const world = this.getBattleWorld();
    if (!this.target || !world) return;

    const distanceToTarget = this.position.distanceTo(this.target.position);
    const attackMode = this.getAttackMode(distanceToTarget);

    if (attackMode) {
      const effectiveRange = attackMode.range + this.size + this.target.size;
      const inRange = distanceToTarget <= effectiveRange;

      if (inRange && this.attackCooldown <= 0) {
        this.performAttack(this.target, attackMode);
        this.attackCooldown = 1 / attackMode.attackSpeed;
      }
    }
  }

  private updateMovement(delta: number): void {
    const world = this.getBattleWorld();
    if (!this.target || !world) return;

    const distanceToTarget = this.position.distanceTo(this.target.position);
    const attackMode = this.getAttackMode(distanceToTarget);
    const effectiveRange = attackMode
      ? attackMode.range + this.size + this.target.size
      : this.getMaxRange() + this.size + this.target.size;

    if (distanceToTarget > effectiveRange) {
      // Need to move closer
      this.moveWithFormation(this.target.position, delta);
    } else if (this.isInMeleeMode(distanceToTarget)) {
      // In melee range - apply combat shuffle
      this.applyCombatShuffle(delta);
    }
  }

  private enforceBounds(): void {
    const world = this.getBattleWorld();
    if (!world) return;
    const bounds = world.getArenaBounds();
    if (bounds) {
      clampToArenaInPlace(this.position, this.size, bounds);
    }
  }

  private findBestTarget(): UnitEntity | null {
    const world = this.getBattleWorld();
    if (!world) return null;

    const enemies = world.getEnemiesOf(this);
    if (enemies.length === 0) return null;

    let best: UnitEntity | null = null;
    let bestScore = -Infinity;

    for (const enemy of enemies) {
      if (enemy.health <= 0) continue;

      const dist = this.position.distanceTo(enemy.position);
      let score = -dist;

      // Bonus for enemies already engaged (focus fire)
      const allies = world.getAlliesOf(this);
      const alliesTargeting = allies.filter((a) => a.target === enemy && a.id !== this.id).length;
      if (alliesTargeting > 0 && alliesTargeting < MAX_FOCUS_FIRE_ALLIES) {
        score += FOCUS_FIRE_BONUS;
      }

      // For ranged units, prefer unblocked targets
      if (this.stats.ranged) {
        if (world.isPathBlocked(this.position, enemy.position, this)) {
          score -= BLOCKED_TARGET_PENALTY;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        best = enemy;
      }
    }

    return best;
  }

  private getAttackMode(distanceToTarget: number): AttackMode | null {
    const { melee, ranged } = this.stats;
    const meleeRange = melee ? melee.range + this.size * 2 : 0;

    // If in melee range and has melee attack, use melee
    if (melee && distanceToTarget <= meleeRange + MELEE_RANGE_BUFFER) {
      return melee;
    }

    // If has ranged attack and not in melee range, use ranged
    if (ranged) {
      return ranged;
    }

    // Fall back to melee
    return melee;
  }

  private getMaxRange(): number {
    const { melee, ranged } = this.stats;
    if (ranged) return ranged.range;
    if (melee) return melee.range;
    return 0;
  }

  private isInMeleeMode(distanceToTarget: number): boolean {
    const { melee } = this.stats;
    if (!melee) return false;
    const meleeRange = melee.range + this.size * 2 + MELEE_RANGE_BUFFER;
    return distanceToTarget <= meleeRange;
  }

  private performAttack(target: UnitEntity, attackMode: AttackMode): void {
    const isMelee = attackMode.range <= MELEE_ATTACK_RANGE_THRESHOLD;

    // Emit attacked event: entity = attacker, target = who was attacked
    this.emit({
      type: 'attacked',
      entity: this,
      target,
      damage: attackMode.damage,
      attackMode: isMelee ? 'melee' : 'ranged',
    });

    if (isMelee) {
      // Direct damage
      target.takeDamage(attackMode.damage, this);
    } else {
      // Spawn projectile
      const world = this.getBattleWorld();
      if (world) {
        world.spawnProjectile(
          this.position.clone(),
          target.position.clone(),
          attackMode.damage,
          this.team,
          getProjectileColor(this.team)
        );
      }
    }
  }

  private moveWithFormation(targetPos: Vector2, delta: number): void {
    const world = this.getBattleWorld();
    if (!world) return;

    const previousPosition = this.position.clone();
    const toTarget = targetPos.subtract(this.position);
    const distToTarget = toTarget.magnitude();
    if (distToTarget < 1) return;

    let moveDirection = toTarget.normalize();

    // Apply ally avoidance
    const allies = world.getAlliesOf(this);
    let avoidance = Vector2.zero();

    for (const ally of allies) {
      if (ally.id === this.id || ally.health <= 0) continue;

      const toAlly = this.position.subtract(ally.position);
      const dist = toAlly.magnitude();
      const minDist = (this.size + ally.size) * UNIT_SPACING;

      if (dist < minDist * 2 && dist > 0) {
        const dot = moveDirection.dot(toAlly.normalize().multiply(-1));
        if (dot > 0.3) {
          const perpendicular = new Vector2(-moveDirection.y, moveDirection.x);
          const leftClear = this.isDirectionClear(perpendicular, allies);
          const rightClear = this.isDirectionClear(perpendicular.multiply(-1), allies);

          if (leftClear && !rightClear) {
            avoidance = avoidance.add(perpendicular.multiply(ALLY_AVOIDANCE_FORCE / dist));
          } else if (rightClear && !leftClear) {
            avoidance = avoidance.add(perpendicular.multiply(-ALLY_AVOIDANCE_FORCE / dist));
          } else {
            const cross = moveDirection.x * toAlly.y - moveDirection.y * toAlly.x;
            avoidance = avoidance.add(
              perpendicular.multiply(((cross > 0 ? 1 : -1) * ALLY_AVOIDANCE_FORCE) / dist)
            );
          }
        }
      }
    }

    // Combine movement with avoidance
    moveDirection = moveDirection.multiply(this.stats.moveSpeed).add(avoidance);
    const speed = moveDirection.magnitude();
    if (speed > this.stats.moveSpeed) {
      moveDirection = moveDirection.normalize().multiply(this.stats.moveSpeed);
    }

    const movement = moveDirection.multiply(delta);
    this.position = this.position.add(movement);

    // Emit moved event with typed payload
    this.emit({
      type: 'moved',
      entity: this,
      delta: movement,
      previousPosition,
    });
  }

  private isDirectionClear(direction: Vector2, allies: UnitEntity[]): boolean {
    const checkDist = this.size * 3;
    const checkPos = this.position.add(direction.normalize().multiply(checkDist));

    for (const ally of allies) {
      if (checkPos.distanceTo(ally.position) < (this.size + ally.size) * UNIT_SPACING) {
        return false;
      }
    }
    return true;
  }

  private applyCombatShuffle(delta: number): void {
    // Use the existing shuffle module
    // We need to create a temporary unit-like object for the shuffle function
    const shuffleUnit = {
      position: this.position,
      stats: this.stats,
      shuffleDirection: this.shuffleDirection,
      shuffleTimer: this.shuffleTimer,
    };

    applyShuffle(shuffleUnit as Unit, delta);

    // Copy back the state
    this.position = shuffleUnit.position;
    this.shuffleDirection = shuffleUnit.shuffleDirection;
    this.shuffleTimer = shuffleUnit.shuffleTimer;
  }

  override isDestroyed(): boolean {
    return this._destroyed || this.health <= 0;
  }
}
