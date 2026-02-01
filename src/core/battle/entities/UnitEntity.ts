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
import { clampToArenaInPlace } from '../BoundsEnforcer';
import { applyShuffle } from '../shuffle';
import { AttackMode, Unit, UnitStats, UnitTeam, UnitType } from '../types';
import { BaseEntity } from './BaseEntity';
import { IBattleWorld } from './IBattleWorld';

// Constants
const UNIT_SPACING = 1.2;
const ALLY_AVOIDANCE_FORCE = 80;

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
      this.emit({ type: 'killed', source: this });
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
   */
  takeDamage(amount: number, source?: UnitEntity): void {
    const previousHealth = this.health;
    this.health = Math.max(0, this.health - amount);

    this.emit({
      type: 'damaged',
      source: this,
      target: source,
      data: { amount, previousHealth, currentHealth: this.health },
    });

    if (this.health <= 0) {
      this.markDestroyed();
      this.emit({ type: 'killed', source: this, target: source });
    }
  }

  /**
   * Convert to legacy Unit interface for backward compatibility.
   */
  toLegacyUnit(): Unit {
    return {
      id: this.id,
      type: this.type,
      team: this.team,
      position: this.position,
      health: this.health,
      stats: this.stats,
      target: this.target ? this.target.toLegacyUnit() : null,
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
      if (alliesTargeting > 0 && alliesTargeting < 3) {
        score += 50;
      }

      // For ranged units, prefer unblocked targets
      if (this.stats.ranged) {
        if (world.isPathBlocked(this.position, enemy.position, this)) {
          score -= 100;
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
    if (melee && distanceToTarget <= meleeRange + 20) {
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
    const meleeRange = melee.range + this.size * 2 + 20;
    return distanceToTarget <= meleeRange;
  }

  private performAttack(target: UnitEntity, attackMode: AttackMode): void {
    const isMelee = attackMode.range <= 50;

    this.emit({
      type: 'attacked',
      source: this,
      target,
      data: { damage: attackMode.damage, attackMode: isMelee ? 'melee' : 'ranged' },
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

    this.emit({ type: 'moved', source: this, data: { delta: movement } });
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
