/**
 * Unit Entity
 *
 * A unit that handles its own behavior: targeting, movement, combat.
 * Delegates to pure function behavior systems for core logic.
 *
 * Godot equivalent:
 * - class_name Unit extends CharacterBody2D
 * - _process(delta) handles all behavior
 * - Signals: died, attacked, damaged
 */

import { Vector2 } from '../../physics/Vector2';
import { getProjectileColor } from '../../theme/colors';
import {
  BASE_MELEE_KNOCKBACK_DISTANCE,
  BASE_MELEE_LUNGE_DISTANCE,
  DEATH_FADE_DURATION,
  HIT_FLASH_DURATION,
  MELEE_ATTACK_RANGE_THRESHOLD,
  MIN_NORMALIZE_THRESHOLD,
  REFERENCE_ARENA_HEIGHT,
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
import { getEnemyTeam } from '../TeamUtils';
import { AttackMode, UnitRenderData, UnitStats, UnitTeam, UnitType, UnitShape } from '../types';
import type { GridFootprint } from '../grid/GridTypes';
import type { IObstacle } from '../obstacles/Obstacle';
import { BaseEntity } from './BaseEntity';
import { IBattleWorld } from './IBattleWorld';

// Import behavior systems
import {
  TargetingContext,
  TargetableUnit,
  MovementContext,
  AllyData,
} from '../unit-behaviors/types';
import { updateTargeting as targetingUpdate } from '../unit-behaviors/TargetingSystem';
import {
  updateCombat as combatUpdate,
  getAttackMode,
  getMaxRange,
  isInMeleeMode,
} from '../unit-behaviors/CombatSystem';
import {
  marchForward as movementMarchForward,
  moveTowardTarget,
} from '../unit-behaviors/MovementSystem';
import {
  decayVisualOffset,
  advanceWalkAnimation,
  resetWalkAnimation,
} from '../unit-behaviors/VisualEffects';
import {
  applyModifier as modifierApply,
  tickModifiers as modifierTick,
  tickPendingModifiers as pendingTick,
  calculateModifiedMoveSpeed,
  calculateDamageMultiplier,
  calculateCollisionSize,
  hasModifierFromSource,
  removeModifiersBySource,
  clearEnemyDebuffs as modifierClearEnemyDebuffs,
  removeModifiersLinkedToUnit as modifierRemoveLinked,
  removePendingModifiersLinkedToUnit,
  queueModifier as modifierQueue,
} from '../unit-behaviors/ModifierSystem';

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

  // === Core Accessors ===

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

  // === Stationary Unit Support ===

  get isStationary(): boolean {
    return this.stats.moveSpeed === 0;
  }

  get blocksMovement(): boolean {
    return false;
  }

  get blocksDeployment(): boolean {
    return this.isStationary;
  }

  // === Combat State Accessors ===

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

  // === Visual State Accessors ===

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

  // === Helper Methods ===

  private getBattleWorld(): IBattleWorld | null {
    return this.world as IBattleWorld | null;
  }

  private getArenaHeight(): number {
    const world = this.getBattleWorld();
    return world?.getArenaBounds()?.height ?? REFERENCE_ARENA_HEIGHT;
  }

  /**
   * Get the position this unit is aiming at (for laser rendering).
   */
  getAimingTarget(): Vector2 | null {
    if (!this.hasAimingLaser || !this.target) return null;
    const { ranged } = this.stats;
    if (!ranged) return null;
    const distToTarget = this.position.distanceTo(this.target.position);
    if (distToTarget <= MELEE_ATTACK_RANGE_THRESHOLD + this.size) return null;
    return this.target.position;
  }

  // === Modifier Methods (delegate to ModifierSystem) ===

  applyModifier(modifier: TemporaryModifier): void {
    const result = modifierApply(this.data.activeModifiers, modifier);
    this.data.activeModifiers = result.modifiers;
  }

  private tickModifiers(delta: number): void {
    const result = modifierTick(this.data.activeModifiers, delta);
    this.data.activeModifiers = result.modifiers;
  }

  private tickPendingModifiers(delta: number): void {
    const result = pendingTick(this.data.pendingModifiers, delta);
    this.data.pendingModifiers = result.pendingModifiers;
    for (const mod of result.readyModifiers) {
      this.applyModifier(mod);
    }
  }

  getModifiedMoveSpeed(): number {
    return calculateModifiedMoveSpeed(this.stats.moveSpeed, this.data.activeModifiers);
  }

  getDamageMultiplier(): number {
    return calculateDamageMultiplier(this.data.activeModifiers);
  }

  getCollisionSize(): number {
    return calculateCollisionSize(this.size, this.data.activeModifiers);
  }

  hasModifier(sourceId: string): boolean {
    return hasModifierFromSource(this.data.activeModifiers, sourceId);
  }

  removeModifierBySource(sourceId: string): boolean {
    const result = removeModifiersBySource(this.data.activeModifiers, sourceId);
    this.data.activeModifiers = result.modifiers;
    return result.removedCount > 0;
  }

  clearEnemyDebuffs(): void {
    this.data.activeModifiers = modifierClearEnemyDebuffs(this.data.activeModifiers, this.team);
  }

  queueModifier(modifier: TemporaryModifier, delay: number): void {
    this.data.pendingModifiers = modifierQueue(this.data.pendingModifiers, modifier, delay);
  }

  removeModifiersLinkedToUnit(unitId: string): boolean {
    const initialActive = this.data.activeModifiers.length;
    const initialPending = this.data.pendingModifiers.length;
    this.data.activeModifiers = modifierRemoveLinked(this.data.activeModifiers, unitId);
    this.data.pendingModifiers = removePendingModifiersLinkedToUnit(
      this.data.pendingModifiers,
      unitId
    );
    return (
      this.data.activeModifiers.length < initialActive ||
      this.data.pendingModifiers.length < initialPending
    );
  }

  // === Main Update Loop ===

  override update(delta: number): void {
    if (this.isDying) {
      this.deathFadeTimer -= delta;
      if (this.deathFadeTimer <= 0) {
        this.markDestroyed();
      }
      return;
    }

    if (this._destroyed) return;

    // Tick modifiers
    this.tickModifiers(delta);
    this.tickPendingModifiers(delta);

    // Decay visual offset using behavior system
    this.visualOffset = decayVisualOffset(this.visualOffset, delta);

    // Decay hit flash timer
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer = Math.max(0, this.hitFlashTimer - delta);
    }

    // Decrement retarget cooldown
    if (this.retargetCooldown > 0) {
      this.retargetCooldown -= delta;
    }

    // Phase 1: Target acquisition (using behavior system)
    this.updateTargetingPhase();

    // Phase 2: Combat (using behavior system)
    this.updateCombatPhase(delta);

    // Phase 3: Movement (using behavior system)
    this.updateMovementPhase(delta);

    // Phase 4: Boundary enforcement
    this.enforceBounds();
  }

  // === Targeting Phase ===

  private updateTargetingPhase(): void {
    if (this.isStationary) return;

    const world = this.getBattleWorld();
    if (!world) return;

    // Create context for targeting system
    const context: TargetingContext = {
      getEnemyDamageables: () => world.getEnemyDamageablesOf(this),
      getEnemyCastles: () => world.getEnemyCastlesOf(this),
      getInitialCastleCount: (team: UnitTeam) => world.getInitialCastleCount(team),
      bounds: world.getArenaBounds(),
      arenaHeight: this.getArenaHeight(),
    };

    // Create targetable unit view
    const unit: TargetableUnit = {
      id: this.id,
      team: this.team,
      position: this.position,
      size: this.size,
      target: this.target,
      seekMode: this.seekMode,
      retargetCooldown: this.retargetCooldown,
    };

    // Get new targeting result
    const result = targetingUpdate(unit, context);

    // Handle target switch with attack cooldown reset
    if (
      this.data.stats.resetAttackOnTargetSwitch &&
      result.target !== null &&
      this.target !== result.target
    ) {
      const attackMode = this.data.stats.ranged ?? this.data.stats.melee;
      if (attackMode) {
        this.attackCooldown = this.data.stats.attackInterval ?? 1 / attackMode.attackSpeed;
      }
    }

    // Apply results
    this.target = result.target;
    this.seekMode = result.seekMode;
    this.retargetCooldown = result.retargetCooldown;
  }

  // === Combat Phase ===

  private updateCombatPhase(delta: number): void {
    if (this.isStationary) return;

    const world = this.getBattleWorld();

    // Use combat system to determine if attack should occur
    const result = combatUpdate(
      this.attackCooldown,
      delta,
      this.position,
      this.size,
      this.stats,
      this.target,
      this.getDamageMultiplier()
    );

    // For precision units, only decrement cooldown when in range and has target
    if (!result.didAttack && this.data.stats.resetAttackOnTargetSwitch && !this.target) {
      // Don't decrement cooldown without target
      return;
    }

    this.attackCooldown = result.attackCooldown;

    if (result.didAttack && result.attackMode && this.target) {
      // Emit attacked event
      this.emit({
        type: 'attacked',
        entity: this,
        target: this.target as UnitEntity,
        damage: result.damage,
        attackMode: result.isMelee ? 'melee' : 'ranged',
      });

      if (result.isMelee) {
        this.performMeleeAttack(this.target, result.damage);
      } else if (world) {
        this.performRangedAttack(this.target, result.damage, result.attackMode, world);
      }
    }
  }

  private performMeleeAttack(target: IDamageable, damage: number): void {
    const arenaHeight = this.getArenaHeight();
    const toTarget = target.position.subtract(this.position);
    const direction =
      toTarget.magnitude() > MIN_NORMALIZE_THRESHOLD ? toTarget.normalize() : new Vector2(0, -1);

    // Attacker lunges forward
    const lungeDistance = scaleValue(BASE_MELEE_LUNGE_DISTANCE, arenaHeight);
    this.visualOffset = this.visualOffset.add(direction.multiply(lungeDistance));

    // Apply melee-specific effects if target supports them
    if (this.isMeleeTarget(target)) {
      const knockbackDistance = scaleValue(BASE_MELEE_KNOCKBACK_DISTANCE, arenaHeight);
      target.applyKnockback(direction, knockbackDistance);

      const defenderTeam = target.team;
      this.applyModifier(createAttackerDebuff(this.id, target.id, defenderTeam));
      target.queueModifier(
        createDefenderDebuff(target.id, this.team),
        MELEE_ENGAGEMENT_DEBUFF.defenderDelay
      );
    }

    target.takeDamage(damage, this);
  }

  private performRangedAttack(
    target: IDamageable,
    damage: number,
    attackMode: AttackMode,
    world: IBattleWorld
  ): void {
    world.spawnProjectile(
      this.position.clone(),
      target.position.clone(),
      damage,
      this.team,
      this,
      getProjectileColor(this.team),
      attackMode.projectileSpeed,
      attackMode.splashRadius
    );
  }

  private isMeleeTarget(target: IDamageable): target is IMeleeTarget {
    return 'applyKnockback' in target && 'queueModifier' in target;
  }

  // === Movement Phase ===

  private updateMovementPhase(delta: number): void {
    if (this.isStationary) return;

    const world = this.getBattleWorld();
    if (!world) return;

    if (!this.target) {
      this.marchForward(delta, world);
      return;
    }

    const distanceToTarget = this.position.distanceTo(this.target.position);
    const attackMode = getAttackMode(this.stats, this.size, distanceToTarget);
    const effectiveRange = attackMode
      ? attackMode.range + this.size + this.target.size
      : getMaxRange(this.stats) + this.size + this.target.size;

    if (distanceToTarget > effectiveRange) {
      this.moveToTarget(delta, world);
    } else if (isInMeleeMode(this.stats, this.size, distanceToTarget) && this.isUnit(this.target)) {
      this.applyCombatShuffle(delta);
      this.walkAnimationTime = resetWalkAnimation();
    } else {
      this.walkAnimationTime = resetWalkAnimation();
    }
  }

  private marchForward(delta: number, world: IBattleWorld): void {
    const context = this.createMovementContext(world);

    const result = movementMarchForward(
      this.position,
      this.team,
      this.id,
      this.getCollisionSize(),
      this.getModifiedMoveSpeed(),
      context,
      delta
    );

    if (result.didMove) {
      this.applyMovement(result.position, result.movementDelta, result.previousPosition, delta);
    }
  }

  private moveToTarget(delta: number, world: IBattleWorld): void {
    if (!this.target) return;

    const context = this.createMovementContext(world);

    const result = moveTowardTarget(
      this.position,
      this.target.position,
      this.id,
      this.getCollisionSize(),
      this.getModifiedMoveSpeed(),
      context,
      delta
    );

    if (result.didMove) {
      this.applyMovement(result.position, result.movementDelta, result.previousPosition, delta);
    }
  }

  private createMovementContext(world: IBattleWorld): MovementContext {
    const initialCastleCount = world.getInitialCastleCount(getEnemyTeam(this.team));
    const currentCastles = world.getEnemyCastlesOf(this);
    const currentCount = currentCastles.filter((c) => !c.isDestroyed() && c.health > 0).length;

    return {
      getAllies: () => this.getAlliesAsAllyData(world),
      getEnemyCastles: () => world.getEnemyCastlesOf(this),
      hasAnyEnemyCastleBeenDestroyed: () => currentCount < initialCastleCount,
      getObstacles: () => [], // Obstacle avoidance not implemented in IBattleWorld yet
      bounds: world.getArenaBounds(),
      arenaHeight: this.getArenaHeight(),
    };
  }

  private getAlliesAsAllyData(world: IBattleWorld): readonly AllyData[] {
    return world.getAlliesOf(this).map((ally) => ({
      id: ally.id,
      position: ally.position,
      health: ally.health,
      getCollisionSize: () => ally.getCollisionSize(),
    }));
  }

  /**
   * Apply movement to unit, emit 'moved' event, and advance walk animation.
   * Single point of emission for the 'moved' event.
   */
  private applyMovement(
    newPosition: Vector2,
    movementDelta: Vector2,
    previousPosition: Vector2,
    delta: number
  ): void {
    this.position = newPosition;
    this.walkAnimationTime = advanceWalkAnimation(this.walkAnimationTime, delta);

    this.emit({
      type: 'moved',
      entity: this,
      delta: movementDelta,
      previousPosition,
    });
  }

  private applyCombatShuffle(delta: number): void {
    const shuffleUnit = {
      position: this.position,
      stats: { moveSpeed: this.getModifiedMoveSpeed() },
      shuffleDirection: this.shuffleDirection,
      shuffleTimer: this.shuffleTimer,
    };

    applyShuffle(shuffleUnit, delta);

    this.position = shuffleUnit.position;
    this.shuffleDirection = shuffleUnit.shuffleDirection;
    this.shuffleTimer = shuffleUnit.shuffleTimer;
  }

  private isUnit(target: IDamageable): target is UnitEntity {
    return 'stats' in target;
  }

  private enforceBounds(): void {
    const world = this.getBattleWorld();
    if (!world) return;
    const bounds = world.getArenaBounds();
    if (bounds) {
      clampToArenaInPlace(this.position, this.size, bounds);
    }
  }

  // === Damage & Death ===

  applyKnockback(direction: Vector2, distance: number): void {
    const knockback = direction.normalize().multiply(distance);
    this.visualOffset = this.visualOffset.add(knockback);
  }

  takeDamage(amount: number, attacker?: UnitEntity): void {
    const previousHealth = this.health;
    this.health = Math.max(0, this.health - amount);

    this.hitFlashTimer = HIT_FLASH_DURATION;

    const world = this.getBattleWorld();
    if (world && amount > 0) {
      const sourceTeam = attacker?.team ?? getEnemyTeam(this.team);
      world.spawnDamageNumber(this.position.clone(), amount, sourceTeam);
    }

    this.emit({
      type: 'damaged',
      entity: this,
      attacker,
      amount,
      previousHealth,
      currentHealth: this.health,
    });

    if (this.health <= 0 && !this.isDying) {
      this.deathFadeTimer = DEATH_FADE_DURATION;
      this.emit({ type: 'killed', entity: this, killer: attacker });
    }
  }

  // === Render Data ===

  toRenderData(): UnitRenderData {
    return {
      id: this.id,
      type: this.type,
      team: this.team,
      squadId: this.squadId,
      position: this.position,
      health: this.health,
      stats: this.stats,
      target: null,
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
      aimProgress: this.getAimProgress(),
      gridFootprint: this.gridFootprint,
    };
  }

  private getAimProgress(): number {
    if (!this.hasAimingLaser || !this.target) return 0;

    const attackMode = this.stats.ranged ?? this.stats.melee;
    if (!attackMode) return 0;

    const maxCooldown = this.stats.attackInterval ?? 1 / attackMode.attackSpeed;
    if (maxCooldown <= 0) return 1;

    const progress = 1 - this.attackCooldown / maxCooldown;
    return Math.max(0, Math.min(1, progress));
  }

  override isDestroyed(): boolean {
    return this._destroyed;
  }
}
