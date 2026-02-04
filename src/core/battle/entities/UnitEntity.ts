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
  BASE_AGGRO_RADIUS,
  ALLY_AVOIDANCE_DISTANCE_MULTIPLIER,
  BASE_ALLY_AVOIDANCE_FORCE,
  BASE_MELEE_KNOCKBACK_DISTANCE,
  BASE_MELEE_LUNGE_DISTANCE,
  DEATH_FADE_DURATION,
  DIRECTION_CHECK_MULTIPLIER,
  HIT_FLASH_DURATION,
  MELEE_ATTACK_RANGE_THRESHOLD,
  MELEE_OFFSET_DECAY_RATE,
  MELEE_RANGE_BUFFER,
  MELEE_SIZE_MULTIPLIER,
  MIN_COLLISION_SIZE_MULTIPLIER,
  MIN_MOVE_DISTANCE,
  MIN_NORMALIZE_THRESHOLD,
  MIN_VISUAL_OFFSET_THRESHOLD,
  PATH_DOT_THRESHOLD,
  REFERENCE_ARENA_HEIGHT,
  TARGET_SWITCH_COOLDOWN_SECONDS,
  TARGET_SWITCH_DISTANCE_RATIO,
  UNIT_SPACING,
  WALK_ANIMATION_WRAP_TIME,
  ZONE_HEIGHT_PERCENT,
  ZONE_MIDWAY_DIVISOR,
  scaleValue,
} from '../BattleConfig';

import { TemporaryModifier, PendingModifier } from '../modifiers/TemporaryModifier';
import {
  MELEE_ENGAGEMENT_DEBUFF,
  createAttackerDebuff,
  createDefenderDebuff,
} from '../modifiers/MeleeEngagementDebuff';
import { clampToArenaInPlace } from '../BoundsEnforcer';
import { EntityKind, IDamageable, IMeleeTarget } from '../IEntity';
import { applyShuffle } from '../shuffle';
import { AttackMode, UnitRenderData, UnitStats, UnitTeam, UnitType, UnitShape } from '../types';
import type { GridFootprint } from '../grid/GridTypes';
import type { IObstacle } from '../obstacles/Obstacle';
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
  shape: UnitShape;
  size: number;
  /** Squad identifier - units spawned together share the same squadId */
  squadId: string;
  // Combat state - unified target (can be unit or castle)
  target: IDamageable | null;
  attackCooldown: number;
  shuffleDirection: Vector2 | null;
  shuffleTimer: number;
  // Once true, unit permanently seeks targets instead of marching
  seekMode: boolean;
  // Cooldown before unit can switch to a closer target
  retargetCooldown: number;
  // Active modifiers (buffs/debuffs)
  activeModifiers: TemporaryModifier[];
  // Pending modifiers waiting to be applied after a delay
  pendingModifiers: PendingModifier[];
  // Visual offset for melee lunge/knockback effects (decays over time)
  visualOffset: Vector2;
  // Timer for hit flash effect (counts down from HIT_FLASH_DURATION)
  hitFlashTimer: number;
  // Timer for death fade effect (counts down from DEATH_FADE_DURATION, -1 = alive)
  deathFadeTimer: number;
  // Walk animation elapsed time (seconds spent moving, used by animation system)
  walkAnimationTime: number;
  // Walk animation type ID (e.g., 'bounce', 'none')
  walkAnimation: string;
  // If true, shows a targeting laser when aiming (for snipers)
  hasAimingLaser: boolean;
  // Grid footprint for deployment positioning
  gridFootprint: GridFootprint;
}

/**
 * Unit entity with full behavior.
 * Stationary units (moveSpeed === 0) also implement IObstacle.
 */
export class UnitEntity extends BaseEntity implements IObstacle {
  public readonly kind: EntityKind = 'unit';
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
  get squadId(): string {
    return this.data.squadId;
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
  get shape(): UnitShape {
    return this.data.shape;
  }
  get gridFootprint(): GridFootprint {
    return this.data.gridFootprint;
  }

  // === Stationary Unit Support (for castles) ===

  /**
   * Whether this unit is stationary (moveSpeed === 0).
   * Stationary units don't move and act as obstacles.
   */
  get isStationary(): boolean {
    return this.stats.moveSpeed === 0;
  }

  /**
   * IObstacle: Whether this unit blocks movement of other units.
   * Stationary units (castles) do NOT block movement - units can move through them.
   */
  get blocksMovement(): boolean {
    return false;
  }

  /**
   * IObstacle: Whether this unit blocks deployment of other units.
   * Only stationary units block deployment.
   */
  get blocksDeployment(): boolean {
    return this.isStationary;
  }

  get target(): IDamageable | null {
    return this.data.target;
  }
  set target(value: IDamageable | null) {
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
  get seekMode(): boolean {
    return this.data.seekMode;
  }
  set seekMode(value: boolean) {
    this.data.seekMode = value;
  }
  get retargetCooldown(): number {
    return this.data.retargetCooldown;
  }
  set retargetCooldown(value: number) {
    this.data.retargetCooldown = value;
  }
  get activeModifiers(): TemporaryModifier[] {
    return this.data.activeModifiers;
  }
  get pendingModifiers(): PendingModifier[] {
    return this.data.pendingModifiers;
  }
  get visualOffset(): Vector2 {
    return this.data.visualOffset;
  }
  set visualOffset(value: Vector2) {
    this.data.visualOffset = value;
  }
  get hitFlashTimer(): number {
    return this.data.hitFlashTimer;
  }
  set hitFlashTimer(value: number) {
    this.data.hitFlashTimer = value;
  }
  get deathFadeTimer(): number {
    return this.data.deathFadeTimer;
  }
  set deathFadeTimer(value: number) {
    this.data.deathFadeTimer = value;
  }
  get isDying(): boolean {
    return this.data.deathFadeTimer >= 0;
  }
  get walkAnimationTime(): number {
    return this.data.walkAnimationTime;
  }
  set walkAnimationTime(value: number) {
    this.data.walkAnimationTime = value;
  }
  get walkAnimation(): string {
    return this.data.walkAnimation;
  }
  get hasAimingLaser(): boolean {
    return this.data.hasAimingLaser;
  }

  /**
   * Get the position this unit is aiming at (for laser rendering).
   * Returns null if not aiming, doesn't have aiming laser, or target is out of range.
   */
  getAimingTarget(): Vector2 | null {
    if (!this.hasAimingLaser) return null;
    if (!this.target) return null;
    // Only aim when in ranged mode (not melee)
    const { ranged } = this.stats;
    if (!ranged) return null;
    // Check distance to target
    const distToTarget = this.position.distanceTo(this.target.position);
    // Not in melee range
    if (distToTarget <= MELEE_ATTACK_RANGE_THRESHOLD + this.size) return null;
    // Must be within ranged attack range
    if (distToTarget > ranged.range) return null;
    return this.target.position;
  }

  /**
   * Get the world as IBattleWorld for battle-specific queries.
   */
  private getBattleWorld(): IBattleWorld | null {
    return this.world as IBattleWorld | null;
  }

  /**
   * Get current arena height for scaling calculations.
   */
  private getArenaHeight(): number {
    const world = this.getBattleWorld();
    return world?.getArenaBounds()?.height ?? REFERENCE_ARENA_HEIGHT;
  }

  /**
   * Get scaled aggro radius for current arena size.
   */
  private getAggroRadius(): number {
    return scaleValue(BASE_AGGRO_RADIUS, this.getArenaHeight());
  }

  /**
   * Get scaled ally avoidance force for current arena size.
   */
  private getAllyAvoidanceForce(): number {
    return scaleValue(BASE_ALLY_AVOIDANCE_FORCE, this.getArenaHeight());
  }

  // === Modifier Methods ===

  /**
   * Apply a modifier to this unit.
   * If a modifier with the same sourceId exists, it refreshes the duration instead of stacking.
   */
  applyModifier(modifier: TemporaryModifier): void {
    // Check for existing modifier from same source
    const existing = this.data.activeModifiers.find((m) => m.sourceId === modifier.sourceId);
    if (existing) {
      // Refresh duration instead of stacking
      existing.remainingDuration = Math.max(existing.remainingDuration, modifier.remainingDuration);
      return;
    }
    this.data.activeModifiers.push(modifier);
  }

  /**
   * Tick all active modifiers, removing expired ones.
   */
  tickModifiers(delta: number): void {
    for (let i = this.data.activeModifiers.length - 1; i >= 0; i--) {
      this.data.activeModifiers[i].remainingDuration -= delta;
      if (this.data.activeModifiers[i].remainingDuration <= 0) {
        this.data.activeModifiers.splice(i, 1);
      }
    }
  }

  /**
   * Get movement speed after applying all active modifiers.
   */
  getModifiedMoveSpeed(): number {
    let speed = this.stats.moveSpeed;
    for (const mod of this.data.activeModifiers) {
      // Multiplicative: -0.9 means 10% of original
      speed *= 1 + mod.moveSpeedMod;
    }
    return Math.max(0, speed);
  }

  /**
   * Get damage multiplier from all active modifiers.
   * Returns a multiplier to apply to damage dealt.
   */
  getDamageMultiplier(): number {
    let mult = 1;
    for (const mod of this.data.activeModifiers) {
      mult *= 1 + mod.damageMod;
    }
    return Math.max(0, mult);
  }

  /**
   * Get collision size after applying all active modifiers.
   * Used for separation and collision calculations (not visual rendering).
   */
  getCollisionSize(): number {
    let mult = 1;
    for (const mod of this.data.activeModifiers) {
      mult *= 1 + mod.collisionSizeMod;
    }
    return Math.max(this.size * MIN_COLLISION_SIZE_MULTIPLIER, this.size * mult);
  }

  /**
   * Check if unit has a modifier from a specific source.
   */
  hasModifierFromSource(sourceId: string): boolean {
    return this.data.activeModifiers.some((m) => m.sourceId === sourceId);
  }

  /**
   * Remove all modifiers from a specific source.
   * Used for clearing debuffs (e.g., friendly shockwave clears enemy shockwave debuff).
   * @returns true if any modifiers were removed
   */
  removeModifierBySource(sourceId: string): boolean {
    const initialLength = this.data.activeModifiers.length;
    this.data.activeModifiers = this.data.activeModifiers.filter((m) => m.sourceId !== sourceId);
    return this.data.activeModifiers.length < initialLength;
  }

  /**
   * Clear all enemy debuffs from this unit (keeps friendly buffs).
   * Used when a friendly shockwave rallies the unit.
   * A debuff is any modifier where sourceTeam differs from the unit's team.
   */
  clearEnemyDebuffs(): void {
    this.data.activeModifiers = this.data.activeModifiers.filter((m) => m.sourceTeam === this.team);
  }

  /**
   * Queue a modifier to be applied after a delay.
   * Used for delayed effects like defender's melee engagement debuff.
   */
  queueModifier(modifier: TemporaryModifier, delay: number): void {
    this.data.pendingModifiers.push({ modifier, delay });
  }

  /**
   * Tick pending modifiers, applying those whose delay has expired.
   */
  tickPendingModifiers(delta: number): void {
    for (let i = this.data.pendingModifiers.length - 1; i >= 0; i--) {
      const pending = this.data.pendingModifiers[i];
      pending.delay -= delta;
      if (pending.delay <= 0) {
        // Apply the modifier
        this.applyModifier(pending.modifier);
        // Remove from pending queue
        this.data.pendingModifiers.splice(i, 1);
      }
    }
  }

  /**
   * Remove all modifiers (active and pending) linked to a specific unit.
   * Called when the linked unit dies (e.g., attacker's debuff is cleared when defender dies).
   * @returns true if any modifiers were removed
   */
  removeModifiersLinkedToUnit(unitId: string): boolean {
    const initialActiveCount = this.data.activeModifiers.length;
    const initialPendingCount = this.data.pendingModifiers.length;

    // Remove active modifiers linked to this unit
    this.data.activeModifiers = this.data.activeModifiers.filter((m) => m.linkedUnitId !== unitId);

    // Remove pending modifiers linked to this unit
    this.data.pendingModifiers = this.data.pendingModifiers.filter(
      (p) => p.modifier.linkedUnitId !== unitId
    );

    return (
      this.data.activeModifiers.length < initialActiveCount ||
      this.data.pendingModifiers.length < initialPendingCount
    );
  }

  /**
   * Cancel all pending modifiers (e.g., when unit dies before modifiers apply).
   */
  clearPendingModifiers(): void {
    this.data.pendingModifiers = [];
  }

  /**
   * Main update loop - called every frame.
   * Godot: _process(delta)
   *
   * Note: Death is handled by takeDamage() which emits the 'killed' event.
   * We only check if already destroyed to skip processing dead units.
   */
  override update(delta: number): void {
    // Handle death fade animation
    if (this.isDying) {
      this.deathFadeTimer -= delta;
      if (this.deathFadeTimer <= 0) {
        this.markDestroyed();
      }
      return;
    }

    // Skip if already destroyed
    if (this._destroyed) {
      return;
    }

    // Tick active modifiers (buffs/debuffs)
    this.tickModifiers(delta);

    // Tick pending modifiers (apply delayed modifiers)
    this.tickPendingModifiers(delta);

    // Decay visual offset (lunge/knockback effect)
    this.decayVisualOffset(delta);

    // Decay hit flash timer
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer = Math.max(0, this.hitFlashTimer - delta);
    }

    // Decrement retarget cooldown
    if (this.retargetCooldown > 0) {
      this.retargetCooldown -= delta;
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
   * Decay the visual offset back toward zero.
   * Used for melee lunge and knockback effects.
   */
  private decayVisualOffset(delta: number): void {
    const magnitude = this.visualOffset.magnitude();
    if (magnitude < MIN_VISUAL_OFFSET_THRESHOLD) {
      this.visualOffset = Vector2.zero();
      return;
    }
    // Exponential decay
    const decay = Math.exp(-MELEE_OFFSET_DECAY_RATE * delta);
    this.visualOffset = this.visualOffset.multiply(decay);
  }

  /**
   * Advance walk animation time when moving.
   * Generic time accumulator - specific animations interpret this as they need.
   */
  private advanceWalkAnimation(delta: number): void {
    this.walkAnimationTime += delta;
    // Keep time in reasonable range to prevent floating point issues
    if (this.walkAnimationTime > WALK_ANIMATION_WRAP_TIME) {
      this.walkAnimationTime -= WALK_ANIMATION_WRAP_TIME;
    }
  }

  /**
   * Reset walk animation to idle state when unit stops moving.
   */
  private resetWalkAnimation(): void {
    this.walkAnimationTime = 0;
  }

  /**
   * Apply a knockback offset to this unit (from melee hit).
   */
  applyKnockback(direction: Vector2, distance: number): void {
    const knockback = direction.normalize().multiply(distance);
    this.visualOffset = this.visualOffset.add(knockback);
  }

  /**
   * Apply damage to this unit.
   * @param amount - Damage to apply
   * @param attacker - The entity that dealt the damage (optional)
   */
  takeDamage(amount: number, attacker?: UnitEntity): void {
    const previousHealth = this.health;
    this.health = Math.max(0, this.health - amount);

    // Trigger hit flash effect
    this.hitFlashTimer = HIT_FLASH_DURATION;

    // Spawn floating damage number
    const world = this.getBattleWorld();
    if (world && amount > 0) {
      // Use attacker's team for color, or this unit's opposite team if no attacker
      const sourceTeam = attacker?.team ?? (this.team === 'player' ? 'enemy' : 'player');
      world.spawnDamageNumber(this.position.clone(), amount, sourceTeam);
    }

    // Emit damaged event: entity = who was damaged, attacker = who caused it
    this.emit({
      type: 'damaged',
      entity: this,
      attacker,
      amount,
      previousHealth,
      currentHealth: this.health,
    });

    if (this.health <= 0 && !this.isDying) {
      // Start death fade animation instead of immediate destruction
      this.deathFadeTimer = DEATH_FADE_DURATION;
      // Emit killed event: entity = who died, killer = who killed them
      this.emit({ type: 'killed', entity: this, killer: attacker });
    }
  }

  /**
   * Convert to render data for React layer.
   * Note: target is set to null to avoid infinite recursion when units target each other.
   * React rendering doesn't need the full target object - that's internal battle logic.
   */
  toRenderData(): UnitRenderData {
    return {
      id: this.id,
      type: this.type,
      team: this.team,
      squadId: this.squadId,
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
      activeModifiers: this.activeModifiers.map((m) => ({
        id: m.id,
        sourceId: m.sourceId,
        remainingDuration: m.remainingDuration,
      })),
      visualOffset: this.visualOffset,
      hitFlashTimer: this.hitFlashTimer,
      deathFadeTimer: this.deathFadeTimer,
      walkAnimationTime: this.walkAnimationTime,
      walkAnimation: this.walkAnimation,
      aimingAt: this.getAimingTarget(),
      gridFootprint: this.gridFootprint,
    };
  }

  // === Private behavior methods ===

  private updateTargeting(): void {
    // Stationary units (like castles) don't target enemies
    if (this.isStationary) return;

    const world = this.getBattleWorld();
    if (!world) return;

    // Clear dead/destroyed targets (and reset retarget cooldown when target dies)
    if (this.target && (this.target.isDestroyed() || this.target.health <= 0)) {
      this.target = null;
      this.retargetCooldown = 0; // Can immediately acquire new target
    }

    // Check if unit should permanently enter seek mode:
    // 1. All enemy castles destroyed, OR
    // 2. Deep in enemy zone (original condition)
    if (!this.seekMode) {
      if (this.areAllEnemyCastlesDestroyed() || this.isDeepInEnemyZone()) {
        this.seekMode = true;
      }
    }

    // In seek mode, recheck for closer targets (with cooldown)
    if (this.seekMode) {
      const nearestTarget = this.findNearestDamageable();

      // If we have a current target and cooldown expired, check for closer targets
      if (this.target && nearestTarget && this.retargetCooldown <= 0) {
        const currentDist = this.position.distanceTo(this.target.position);
        const nearestDist = this.position.distanceTo(nearestTarget.position);
        // Switch to closer target if it's significantly closer
        if (nearestDist < currentDist * TARGET_SWITCH_DISTANCE_RATIO) {
          this.target = nearestTarget;
          this.retargetCooldown = TARGET_SWITCH_COOLDOWN_SECONDS;
          return;
        }
      }

      // If no target yet, acquire one
      if (!this.target && nearestTarget) {
        this.target = nearestTarget;
        this.retargetCooldown = TARGET_SWITCH_COOLDOWN_SECONDS;
        return;
      }

      // Keep existing valid target in seek mode
      if (this.target) {
        return;
      }
    }

    // If already have a valid target (not in seek mode), keep it
    if (this.target) {
      return;
    }

    // Phase 1: Check for targets within aggro radius (always active)
    const nearestInRange = this.findDamageableInAggroRadius();

    if (nearestInRange) {
      this.target = nearestInRange;
      return;
    }

    // Not in seek mode and nothing in aggro range - will march toward closest castle
  }

  /**
   * Check if unit is deep into the enemy's deployment zone (past midway).
   * Player units: past midway of top zone (Y < zoneHeight / 2)
   * Enemy units: past midway of bottom zone (Y > height - zoneHeight / 2)
   */
  private isDeepInEnemyZone(): boolean {
    const world = this.getBattleWorld();
    if (!world) return false;

    const bounds = world.getArenaBounds();
    if (!bounds) return false;

    const zoneHeight = bounds.height * ZONE_HEIGHT_PERCENT;

    if (this.team === 'player') {
      // Player advances upward - deep when past midway of enemy zone
      return this.position.y < zoneHeight / ZONE_MIDWAY_DIVISOR;
    } else {
      // Enemy advances downward - deep when past midway of player zone
      return this.position.y > bounds.height - zoneHeight / ZONE_MIDWAY_DIVISOR;
    }
  }

  /**
   * Find the nearest enemy damageable (unit or castle) within aggro radius.
   */
  private findDamageableInAggroRadius(): IDamageable | null {
    const world = this.getBattleWorld();
    if (!world) return null;

    const enemies = world.getEnemyDamageablesOf(this);
    let nearest: IDamageable | null = null;
    let nearestDist = this.getAggroRadius();

    for (const enemy of enemies) {
      // Skip dying enemies (health <= 0)
      if (enemy.health <= 0) continue;
      const dist = this.position.distanceTo(enemy.position);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = enemy;
      }
    }

    return nearest;
  }

  /**
   * Find the nearest enemy damageable (unit or castle) with no distance limit.
   */
  private findNearestDamageable(): IDamageable | null {
    const world = this.getBattleWorld();
    if (!world) return null;

    const enemies = world.getEnemyDamageablesOf(this);
    let nearest: IDamageable | null = null;
    let nearestDist = Infinity;

    for (const enemy of enemies) {
      // Skip dying enemies (health <= 0)
      if (enemy.health <= 0) continue;
      const dist = this.position.distanceTo(enemy.position);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = enemy;
      }
    }

    return nearest;
  }

  /**
   * Find the closest living enemy castle.
   * Returns null if all enemy castles are destroyed.
   */
  private findClosestEnemyCastle(): IDamageable | null {
    const world = this.getBattleWorld();
    if (!world) return null;

    const enemyCastles = world.getEnemyCastlesOf(this);
    let closest: IDamageable | null = null;
    let closestDist = Infinity;

    for (const castle of enemyCastles) {
      // Skip destroyed castles
      if (castle.isDestroyed() || castle.health <= 0) continue;
      const dist = this.position.distanceTo(castle.position);
      if (dist < closestDist) {
        closestDist = dist;
        closest = castle;
      }
    }

    return closest;
  }

  /**
   * Check if all enemy castles have been destroyed.
   * Returns true if initial count > 0 and current count is 0.
   */
  private areAllEnemyCastlesDestroyed(): boolean {
    const world = this.getBattleWorld();
    if (!world) return false;

    const enemyTeam = this.team === 'player' ? 'enemy' : 'player';
    const initialCount = world.getInitialCastleCount(enemyTeam);
    const currentCount = world.getEnemyCastlesOf(this).length;

    // All destroyed if there were castles initially and none remain
    return initialCount > 0 && currentCount === 0;
  }

  /**
   * Check if any enemy castle has been destroyed.
   * Compares current living castle count to initial count.
   */
  private hasAnyEnemyCastleBeenDestroyed(): boolean {
    const world = this.getBattleWorld();
    if (!world) return false;

    const enemyTeam = this.team === 'player' ? 'enemy' : 'player';
    const initialCount = world.getInitialCastleCount(enemyTeam);
    const currentCount = world.getEnemyCastlesOf(this).length;

    return currentCount < initialCount;
  }

  private updateCombat(delta: number): void {
    // Stationary units (like castles) don't attack
    if (this.isStationary) return;

    // Update cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }

    if (!this.target) return;

    const distanceToTarget = this.position.distanceTo(this.target.position);
    const attackMode = this.getAttackMode(distanceToTarget);

    if (attackMode) {
      const effectiveRange = attackMode.range + this.size + this.target.size;
      const inRange = distanceToTarget <= effectiveRange;

      if (inRange && this.attackCooldown <= 0) {
        this.performAttack(this.target, attackMode);
        // Use attackInterval from stats if available, otherwise calculate from attackSpeed
        this.attackCooldown = this.data.stats.attackInterval ?? 1 / attackMode.attackSpeed;
      }
    }
  }

  private updateMovement(delta: number): void {
    // Stationary units (like castles) don't move
    if (this.isStationary) return;

    const world = this.getBattleWorld();
    if (!world) return;

    // No target - march straight forward toward enemy zone
    if (!this.target) {
      this.marchForward(delta);
      return;
    }

    const distanceToTarget = this.position.distanceTo(this.target.position);
    const attackMode = this.getAttackMode(distanceToTarget);
    const effectiveRange = attackMode
      ? attackMode.range + this.size + this.target.size
      : this.getMaxRange() + this.size + this.target.size;

    if (distanceToTarget > effectiveRange) {
      // Need to move closer
      this.moveWithFormation(this.target.position, delta);
    } else if (this.isInMeleeMode(distanceToTarget) && this.isUnit(this.target)) {
      // In melee range against a unit - apply combat shuffle
      // No shuffle when attacking castles - they don't attack back
      this.applyCombatShuffle(delta);
      // Shuffling is not walking - reset animation to idle
      this.resetWalkAnimation();
    } else {
      // In range (ranged mode) but not moving - reset animation to idle
      this.resetWalkAnimation();
    }
  }

  /**
   * Type guard to check if a damageable is a unit (has stats).
   */
  private isUnit(target: IDamageable): target is UnitEntity {
    return 'stats' in target;
  }

  /**
   * Type guard to check if a damageable can receive melee combat effects.
   * IMeleeTarget entities support knockback and modifier queueing.
   */
  private isMeleeTarget(target: IDamageable): target is IMeleeTarget {
    return 'applyKnockback' in target && 'queueModifier' in target;
  }

  /**
   * March toward enemy territory.
   * - Before any castle destroyed: march straight forward (team-based direction)
   * - After a castle destroyed: march toward closest remaining castle
   */
  private marchForward(delta: number): void {
    const world = this.getBattleWorld();
    if (!world) return;

    let forwardDir: Vector2;

    // Only march toward specific castle after one has been destroyed
    if (this.hasAnyEnemyCastleBeenDestroyed()) {
      const closestCastle = this.findClosestEnemyCastle();
      if (closestCastle) {
        // March toward the closest remaining castle
        const toCastle = closestCastle.position.subtract(this.position);
        const dist = toCastle.magnitude();
        if (dist > MIN_MOVE_DISTANCE) {
          forwardDir = toCastle.normalize();
        } else {
          // Already at castle position, default to team direction
          const forwardY = this.team === 'player' ? -1 : 1;
          forwardDir = new Vector2(0, forwardY);
        }
      } else {
        // No castles left - fall back to team direction (shouldn't happen, we'd be in seek mode)
        const forwardY = this.team === 'player' ? -1 : 1;
        forwardDir = new Vector2(0, forwardY);
      }
    } else {
      // No castle destroyed yet - march straight forward based on team
      const forwardY = this.team === 'player' ? -1 : 1;
      forwardDir = new Vector2(0, forwardY);
    }

    // Apply ally avoidance while marching
    const allies = world.getAlliesOf(this);
    let allyAvoidance = Vector2.zero();
    const allyAvoidanceForce = this.getAllyAvoidanceForce();

    for (const ally of allies) {
      if (ally.id === this.id || ally.health <= 0) continue;

      const toAlly = this.position.subtract(ally.position);
      const dist = toAlly.magnitude();
      const minDist = (this.getCollisionSize() + ally.getCollisionSize()) * UNIT_SPACING;

      const avoidDist = minDist * ALLY_AVOIDANCE_DISTANCE_MULTIPLIER;
      if (dist < avoidDist && dist > 0) {
        // Push away from nearby allies
        const pushStrength = (avoidDist - dist) / avoidDist;
        allyAvoidance = allyAvoidance.add(
          toAlly.normalize().multiply(pushStrength * allyAvoidanceForce)
        );
      }
    }

    // Combine forward movement with ally avoidance
    const modifiedSpeed = this.getModifiedMoveSpeed();
    let moveDirection = forwardDir.multiply(modifiedSpeed).add(allyAvoidance);
    const speed = moveDirection.magnitude();
    if (speed > modifiedSpeed) {
      moveDirection = moveDirection.normalize().multiply(modifiedSpeed);
    }

    const movement = moveDirection.multiply(delta);
    const previousPosition = this.position.clone();
    this.position = this.position.add(movement);

    // Advance walk animation time while moving
    this.advanceWalkAnimation(delta);

    this.emit({
      type: 'moved',
      entity: this,
      delta: movement,
      previousPosition,
    });
  }

  private enforceBounds(): void {
    const world = this.getBattleWorld();
    if (!world) return;
    const bounds = world.getArenaBounds();
    if (bounds) {
      clampToArenaInPlace(this.position, this.size, bounds);
    }
  }

  private getAttackMode(distanceToTarget: number): AttackMode | null {
    const { melee, ranged } = this.stats;
    const meleeRange = melee ? melee.range + this.size * MELEE_SIZE_MULTIPLIER : 0;

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
    const meleeRange = melee.range + this.size * MELEE_SIZE_MULTIPLIER + MELEE_RANGE_BUFFER;
    return distanceToTarget <= meleeRange;
  }

  private performAttack(target: IDamageable, attackMode: AttackMode): void {
    const isMelee = attackMode.range <= MELEE_ATTACK_RANGE_THRESHOLD;
    // Apply damage modifier from buffs/debuffs
    const modifiedDamage = Math.round(attackMode.damage * this.getDamageMultiplier());

    // Emit attacked event: entity = attacker, target = who was attacked
    this.emit({
      type: 'attacked',
      entity: this,
      target: target as UnitEntity, // Cast for event (works for IEntity)
      damage: modifiedDamage,
      attackMode: isMelee ? 'melee' : 'ranged',
    });

    if (isMelee) {
      // Apply visual effects for melee combat
      const arenaHeight = this.getArenaHeight();
      const toTarget = target.position.subtract(this.position);
      const direction =
        toTarget.magnitude() > MIN_NORMALIZE_THRESHOLD ? toTarget.normalize() : new Vector2(0, -1);

      // Attacker lunges forward
      const lungeDistance = scaleValue(BASE_MELEE_LUNGE_DISTANCE, arenaHeight);
      this.visualOffset = this.visualOffset.add(direction.multiply(lungeDistance));

      // Apply melee-specific effects if target supports them (units, not castles)
      if (this.isMeleeTarget(target)) {
        // Target gets knocked back
        const knockbackDistance = scaleValue(BASE_MELEE_KNOCKBACK_DISTANCE, arenaHeight);
        target.applyKnockback(direction, knockbackDistance);

        // Apply melee engagement debuffs
        const defenderTeam = target.team;

        // Attacker debuff (immediate) - linked to defender for death cleanup
        this.applyModifier(createAttackerDebuff(this.id, target.id, defenderTeam));

        // Defender debuff (delayed)
        target.queueModifier(
          createDefenderDebuff(target.id, this.team),
          MELEE_ENGAGEMENT_DEBUFF.defenderDelay
        );
      }

      // Direct damage
      target.takeDamage(modifiedDamage, this);
    } else {
      // Spawn projectile with attack mode's projectile properties
      const world = this.getBattleWorld();
      if (world) {
        world.spawnProjectile(
          this.position.clone(),
          target.position.clone(),
          modifiedDamage,
          this.team,
          this, // Pass source unit for damage attribution
          getProjectileColor(this.team),
          attackMode.projectileSpeed,
          attackMode.splashRadius
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
    if (distToTarget < MIN_MOVE_DISTANCE) return;

    let moveDirection = toTarget.normalize();

    // Apply ally avoidance
    const allies = world.getAlliesOf(this);
    let allyAvoidance = Vector2.zero();
    const allyAvoidanceForce = this.getAllyAvoidanceForce();

    for (const ally of allies) {
      if (ally.id === this.id || ally.health <= 0) continue;

      const toAlly = this.position.subtract(ally.position);
      const dist = toAlly.magnitude();
      const minDist = (this.getCollisionSize() + ally.getCollisionSize()) * UNIT_SPACING;

      const avoidDist = minDist * ALLY_AVOIDANCE_DISTANCE_MULTIPLIER;
      if (dist < avoidDist && dist > 0) {
        const dot = moveDirection.dot(toAlly.normalize().multiply(-1));
        if (dot > PATH_DOT_THRESHOLD) {
          const perpendicular = new Vector2(-moveDirection.y, moveDirection.x);
          const leftClear = this.isDirectionClear(perpendicular, allies);
          const rightClear = this.isDirectionClear(perpendicular.multiply(-1), allies);

          if (leftClear && !rightClear) {
            allyAvoidance = allyAvoidance.add(perpendicular.multiply(allyAvoidanceForce / dist));
          } else if (rightClear && !leftClear) {
            allyAvoidance = allyAvoidance.add(perpendicular.multiply(-allyAvoidanceForce / dist));
          } else {
            const cross = moveDirection.x * toAlly.y - moveDirection.y * toAlly.x;
            allyAvoidance = allyAvoidance.add(
              perpendicular.multiply(((cross > 0 ? 1 : -1) * allyAvoidanceForce) / dist)
            );
          }
        }
      }
    }

    // Combine movement direction with ally avoidance
    const modifiedSpeed = this.getModifiedMoveSpeed();
    moveDirection = moveDirection.multiply(modifiedSpeed).add(allyAvoidance);
    const speed = moveDirection.magnitude();
    if (speed > modifiedSpeed) {
      moveDirection = moveDirection.normalize().multiply(modifiedSpeed);
    }

    const movement = moveDirection.multiply(delta);
    this.position = this.position.add(movement);

    // Advance walk animation time while moving
    this.advanceWalkAnimation(delta);

    // Emit moved event with typed payload
    this.emit({
      type: 'moved',
      entity: this,
      delta: movement,
      previousPosition,
    });
  }

  private isDirectionClear(direction: Vector2, allies: UnitEntity[]): boolean {
    const checkDist = this.size * DIRECTION_CHECK_MULTIPLIER;
    const checkPos = this.position.add(direction.normalize().multiply(checkDist));

    for (const ally of allies) {
      if (
        checkPos.distanceTo(ally.position) <
        (this.getCollisionSize() + ally.getCollisionSize()) * UNIT_SPACING
      ) {
        return false;
      }
    }
    return true;
  }

  private applyCombatShuffle(delta: number): void {
    // Use the existing shuffle module
    // Create a Shuffleable object that the shuffle function can work with (using modified speed)
    const shuffleUnit = {
      position: this.position,
      stats: { moveSpeed: this.getModifiedMoveSpeed() },
      shuffleDirection: this.shuffleDirection,
      shuffleTimer: this.shuffleTimer,
    };

    applyShuffle(shuffleUnit, delta);

    // Copy back the state
    this.position = shuffleUnit.position;
    this.shuffleDirection = shuffleUnit.shuffleDirection;
    this.shuffleTimer = shuffleUnit.shuffleTimer;
  }

  override isDestroyed(): boolean {
    // Only destroyed after death fade completes
    return this._destroyed;
  }
}
