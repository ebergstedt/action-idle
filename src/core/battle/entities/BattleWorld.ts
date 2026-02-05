/**
 * Battle World
 *
 * Entity manager that holds and updates all battle entities.
 * Maps to Godot's main scene node or SceneTree.
 *
 * Godot equivalent:
 * - Main scene (e.g., Battle.tscn) that contains all units
 * - _process(delta) iterates over children calling their _process
 */

import { Vector2 } from '../../physics/Vector2';
import {
  ALLY_PUSH_MULTIPLIER,
  DAMAGE_NUMBER_DURATION,
  ENEMY_PUSH_MULTIPLIER,
  PATH_BLOCK_RADIUS_MULTIPLIER,
  BASE_SEPARATION_FORCE,
  REFERENCE_ARENA_HEIGHT,
  UNIT_SPACING,
  scaleValue,
} from '../BattleConfig';
import { EntityBounds } from '../BoundsEnforcer';
import { isPlayerTeam } from '../TeamUtils';
import { UnitTeam } from '../units/types';
import {
  IDamageable,
  IWorldEventEmitter,
  WorldEventType,
  WorldEventMap,
  EventListener,
  KilledEvent,
  EntityEventMap,
} from '../IEntity';
import { IBattleWorld } from './IBattleWorld';
import { UnitEntity } from './UnitEntity';
import { ProjectileEntity, createProjectile } from './ProjectileEntity';
import { ShockwaveEntity, createShockwave } from './ShockwaveEntity';
import { DamageNumberEntity, DamageNumberData } from './DamageNumberEntity';
import { WorldEventEmitter } from './EventEmitter';

/**
 * Battle world - manages all battle entities.
 * Implements IWorldEventEmitter to notify listeners when entities are added/removed.
 */
export class BattleWorld implements IBattleWorld, IWorldEventEmitter {
  private units: UnitEntity[] = [];
  private projectiles: ProjectileEntity[] = [];
  private shockwaves: ShockwaveEntity[] = [];
  private damageNumbers: DamageNumberEntity[] = [];
  private nextProjectileId = 1;
  private nextShockwaveId = 1;
  private nextDamageNumberId = 1;
  private nextModifierId = 1;
  private arenaBounds: EntityBounds | null = null;
  private worldEvents = new WorldEventEmitter();
  /** Track initial castle counts per team to detect when castles are destroyed */
  private initialCastleCounts = new Map<UnitTeam, number>();
  /** Store event listeners for proper cleanup (prevents memory leaks) */
  private entityListeners = new Map<string, EventListener<EntityEventMap['killed']>>();

  // === Entity Management ===

  /**
   * Add a unit to the world.
   * Emits 'entity_added' world event.
   * Subscribes to 'killed' event for death handling:
   * - Mobile units: Clear linked modifiers from other units
   * - Stationary units (castles): Spawn shockwave on death, track castle counts
   */
  addUnit(unit: UnitEntity): void {
    unit.setWorld(this);
    unit.init();
    this.units.push(unit);
    this.worldEvents.emitWorld({ type: 'entity_added', entity: unit });

    // Track initial castle count for stationary units (castles)
    if (unit.isStationary) {
      const currentCount = this.initialCastleCounts.get(unit.team) ?? 0;
      this.initialCastleCounts.set(unit.team, currentCount + 1);
    }

    // Subscribe to unit death
    // Store listener reference for proper cleanup (prevents memory leaks)
    const killedListener: EventListener<KilledEvent> = (event: KilledEvent) => {
      // Clear linked modifiers (melee engagement debuffs)
      this.clearModifiersLinkedToUnit(event.entity.id);

      // Stationary units (castles) spawn shockwave on death
      if (unit.isStationary) {
        this.spawnShockwave(event.entity.position.clone(), unit.team);
      }
    };
    this.entityListeners.set(unit.id, killedListener);
    unit.on('killed', killedListener);
  }

  /**
   * Add a projectile to the world.
   * Emits 'entity_added' world event.
   */
  addProjectile(projectile: ProjectileEntity): void {
    projectile.setWorld(this);
    projectile.init();
    this.projectiles.push(projectile);
    this.worldEvents.emitWorld({ type: 'entity_added', entity: projectile });
  }

  /**
   * Add a shockwave to the world.
   */
  addShockwave(shockwave: ShockwaveEntity): void {
    shockwave.setWorld(this);
    shockwave.init();
    this.shockwaves.push(shockwave);
    this.worldEvents.emitWorld({ type: 'entity_added', entity: shockwave });
  }

  /**
   * Spawn a shockwave at a position.
   * @param position - Center of the shockwave
   * @param sourceTeam - The team whose castle was destroyed (this team's units get debuffed)
   */
  spawnShockwave(position: Vector2, sourceTeam: UnitTeam): void {
    const id = `shockwave_${this.nextShockwaveId++}`;

    // Calculate max radius to cover entire arena (distance to farthest corner)
    let maxRadius: number | undefined;
    let arenaHeight = REFERENCE_ARENA_HEIGHT; // Default fallback
    if (this.arenaBounds) {
      const { width, height } = this.arenaBounds;
      arenaHeight = height;
      // Check distance to all 4 corners and use the maximum
      const corners = [
        new Vector2(0, 0),
        new Vector2(width, 0),
        new Vector2(0, height),
        new Vector2(width, height),
      ];
      maxRadius = Math.max(...corners.map((corner) => position.distanceTo(corner)));
    }

    const shockwave = createShockwave(id, position, sourceTeam, maxRadius, arenaHeight);
    this.addShockwave(shockwave);
  }

  /**
   * Add a damage number to the world.
   */
  addDamageNumber(damageNumber: DamageNumberEntity): void {
    damageNumber.setWorld(this);
    damageNumber.init();
    this.damageNumbers.push(damageNumber);
  }

  /**
   * Spawn a floating damage number.
   * @param position - Position to spawn the number
   * @param amount - Damage amount to display
   * @param sourceTeam - Team that dealt the damage (for color)
   */
  spawnDamageNumber(position: Vector2, amount: number, sourceTeam: UnitTeam): void {
    const id = `dmgnum_${this.nextDamageNumberId++}`;
    const arenaHeight = this.arenaBounds?.height ?? REFERENCE_ARENA_HEIGHT;

    const data: DamageNumberData = {
      amount,
      sourceTeam,
      lifetime: DAMAGE_NUMBER_DURATION,
      maxLifetime: DAMAGE_NUMBER_DURATION,
      startY: position.y,
      arenaHeight,
    };

    const damageNumber = new DamageNumberEntity(id, position.clone(), data);
    this.addDamageNumber(damageNumber);
  }

  /**
   * Unsubscribe from an entity's events and clean up listener reference.
   * Prevents memory leaks from retained event listeners.
   */
  private cleanupEntityListener(entity: UnitEntity): void {
    const listener = this.entityListeners.get(entity.id);
    if (listener) {
      entity.off('killed', listener);
      this.entityListeners.delete(entity.id);
    }
  }

  /**
   * Remove a unit from the world.
   * Emits 'entity_removed' world event.
   */
  removeUnit(unit: UnitEntity): void {
    const index = this.units.indexOf(unit);
    if (index !== -1) {
      this.cleanupEntityListener(unit);
      this.worldEvents.emitWorld({ type: 'entity_removed', entity: unit });
      unit.destroy();
      unit.setWorld(null);
      this.units.splice(index, 1);
    }
  }

  /**
   * Clear all entities.
   * Emits 'entity_removed' for each entity.
   */
  clear(): void {
    // Clear all units (including stationary/castles)
    for (const unit of this.units) {
      this.cleanupEntityListener(unit);
      this.worldEvents.emitWorld({ type: 'entity_removed', entity: unit });
      unit.destroy();
      unit.setWorld(null);
    }
    for (const proj of this.projectiles) {
      this.worldEvents.emitWorld({ type: 'entity_removed', entity: proj });
      proj.destroy();
      proj.setWorld(null);
    }
    for (const shockwave of this.shockwaves) {
      this.worldEvents.emitWorld({ type: 'entity_removed', entity: shockwave });
      shockwave.destroy();
      shockwave.setWorld(null);
    }
    for (const damageNumber of this.damageNumbers) {
      damageNumber.destroy();
      damageNumber.setWorld(null);
    }
    this.units = [];
    this.projectiles = [];
    this.shockwaves = [];
    this.damageNumbers = [];
    this.nextProjectileId = 1;
    this.nextShockwaveId = 1;
    this.nextDamageNumberId = 1;
    this.nextModifierId = 1;
    this.initialCastleCounts.clear();
    this.entityListeners.clear();
  }

  // === Main Update Loop ===

  /**
   * Update all entities.
   * Godot: Called from main scene's _process(delta)
   */
  update(delta: number): void {
    // Phase 1: Update all units (targeting, combat, movement)
    // Note: stationary units (castles) are included but their update() is mostly no-op
    for (const unit of this.units) {
      unit.update(delta);
    }

    // Phase 2: Apply separation between units
    this.applySeparation(delta);

    // Phase 3: Update projectiles
    for (const proj of this.projectiles) {
      proj.update(delta);
    }

    // Phase 4: Update shockwaves (expansion and debuff application)
    for (const shockwave of this.shockwaves) {
      shockwave.update(delta);
    }

    // Phase 5: Update damage numbers (float and fade)
    for (const damageNumber of this.damageNumbers) {
      damageNumber.update(delta);
    }

    // Phase 6: Remove destroyed entities
    this.removeDestroyedEntities();
  }

  private applySeparation(delta: number): void {
    const arenaHeight = this.arenaBounds?.height ?? REFERENCE_ARENA_HEIGHT;
    const separationForce = scaleValue(BASE_SEPARATION_FORCE, arenaHeight);

    for (let i = 0; i < this.units.length; i++) {
      const unitA = this.units[i];
      if (unitA.isDestroyed()) continue;

      for (let j = i + 1; j < this.units.length; j++) {
        const unitB = this.units[j];
        if (unitB.isDestroyed()) continue;

        // Skip collision with stationary units (castles) - units can move through them
        if (unitA.isStationary || unitB.isStationary) continue;

        const diff = unitA.position.subtract(unitB.position);
        const dist = diff.magnitude();
        const minDist = (unitA.getCollisionSize() + unitB.getCollisionSize()) * UNIT_SPACING;

        if (dist < minDist && dist > 0) {
          const overlap = minDist - dist;
          const pushDir = diff.normalize();
          const pushAmount = overlap * separationForce * delta;

          // Push both units, but less if they're enemies
          const pushMultiplier =
            unitA.team === unitB.team ? ALLY_PUSH_MULTIPLIER : ENEMY_PUSH_MULTIPLIER;

          unitA.position = unitA.position.add(pushDir.multiply(pushAmount * pushMultiplier));
          unitB.position = unitB.position.subtract(pushDir.multiply(pushAmount * pushMultiplier));
        }
      }
    }
  }

  private removeDestroyedEntities(): void {
    // Remove destroyed units (including stationary/castles)
    this.units = this.units.filter((unit) => {
      if (unit.isDestroyed()) {
        // Clean up our listener before destroying entity
        this.cleanupEntityListener(unit);
        // destroy() emits 'destroyed' event and clears entity's listeners
        unit.destroy();
        // Then emit world event so subscribers see entity after its final event
        this.worldEvents.emitWorld({ type: 'entity_removed', entity: unit });
        unit.setWorld(null);
        return false;
      }
      return true;
    });

    // Remove destroyed projectiles
    this.projectiles = this.projectiles.filter((proj) => {
      if (proj.isDestroyed()) {
        proj.destroy();
        this.worldEvents.emitWorld({ type: 'entity_removed', entity: proj });
        proj.setWorld(null);
        return false;
      }
      return true;
    });

    // Remove destroyed shockwaves
    this.shockwaves = this.shockwaves.filter((shockwave) => {
      if (shockwave.isDestroyed()) {
        shockwave.destroy();
        this.worldEvents.emitWorld({ type: 'entity_removed', entity: shockwave });
        shockwave.setWorld(null);
        return false;
      }
      return true;
    });

    // Remove destroyed damage numbers
    this.damageNumbers = this.damageNumbers.filter((damageNumber) => {
      if (damageNumber.isDestroyed()) {
        damageNumber.destroy();
        damageNumber.setWorld(null);
        return false;
      }
      return true;
    });
  }

  // === IBattleWorld Implementation ===

  getUnits(): readonly UnitEntity[] {
    return this.units;
  }

  getUnitById(id: string): UnitEntity | undefined {
    return this.units.find((u) => u.id === id);
  }

  getUnitsByTeam(team: UnitTeam): UnitEntity[] {
    return this.units.filter((u) => u.team === team && !u.isDestroyed());
  }

  getEnemiesOf(unit: UnitEntity): UnitEntity[] {
    return this.units.filter(
      (u) => u.team !== unit.team && !u.isDestroyed() && u.health > 0 && !u.isStationary
    );
  }

  getAlliesOf(unit: UnitEntity): UnitEntity[] {
    return this.units.filter(
      (u) =>
        u.team === unit.team &&
        u.id !== unit.id &&
        !u.isDestroyed() &&
        u.health > 0 &&
        !u.isStationary
    );
  }

  // === Castle Queries (Stationary Units) ===

  /**
   * Get all stationary units (castles).
   * Returns units with moveSpeed === 0.
   * @deprecated Use getStationaryUnits() for clarity
   */
  getCastles(): readonly UnitEntity[] {
    return this.units.filter((u) => u.isStationary);
  }

  /**
   * Get all stationary units (castles).
   * Clearer name than getCastles().
   */
  getStationaryUnits(): readonly UnitEntity[] {
    return this.units.filter((u) => u.isStationary);
  }

  /**
   * Get all mobile (non-stationary) units.
   */
  getMobileUnits(): readonly UnitEntity[] {
    return this.units.filter((u) => !u.isStationary);
  }

  getCastlesByTeam(team: UnitTeam): UnitEntity[] {
    return this.units.filter((u) => u.isStationary && u.team === team && !u.isDestroyed());
  }

  getEnemyCastlesOf(unit: UnitEntity): UnitEntity[] {
    return this.units.filter(
      (u) => u.isStationary && u.team !== unit.team && !u.isDestroyed() && u.health > 0
    );
  }

  /**
   * Get the initial number of castles for a team (before any were destroyed).
   * Used to detect when castles have been destroyed.
   */
  getInitialCastleCount(team: UnitTeam): number {
    return this.initialCastleCounts.get(team) ?? 0;
  }

  // === Damageable Queries ===

  /**
   * Get all damageable entities (all units, including stationary).
   */
  getDamageables(): readonly IDamageable[] {
    return this.units.filter((u) => !u.isDestroyed() && u.health > 0);
  }

  /**
   * Get enemy damageable entities for a given entity.
   */
  getEnemyDamageablesOf(entity: IDamageable): IDamageable[] {
    return this.units.filter((u) => u.team !== entity.team && !u.isDestroyed() && u.health > 0);
  }

  isPathBlocked(from: Vector2, to: Vector2, excludeUnit: UnitEntity): boolean {
    const allies = this.getAlliesOf(excludeUnit);

    for (const ally of allies) {
      const dist = this.pointToLineDistance(ally.position, from, to);
      if (dist < ally.size * PATH_BLOCK_RADIUS_MULTIPLIER) {
        const toTarget = to.subtract(from);
        const toAlly = ally.position.subtract(from);
        const dot = toTarget.dot(toAlly);
        if (dot > 0 && dot < toTarget.magnitudeSquared()) {
          return true;
        }
      }
    }
    return false;
  }

  private pointToLineDistance(point: Vector2, lineStart: Vector2, lineEnd: Vector2): number {
    const line = lineEnd.subtract(lineStart);
    const len = line.magnitude();
    if (len === 0) return point.distanceTo(lineStart);

    const t = Math.max(0, Math.min(1, point.subtract(lineStart).dot(line) / (len * len)));
    const projection = lineStart.add(line.multiply(t));
    return point.distanceTo(projection);
  }

  spawnProjectile(
    position: Vector2,
    target: Vector2,
    damage: number,
    sourceTeam: UnitTeam,
    sourceUnit: UnitEntity | null,
    color: string,
    projectileSpeed?: number,
    splashRadius?: number
  ): void {
    const id = `proj_${this.nextProjectileId++}`;
    const arenaHeight = this.arenaBounds?.height ?? REFERENCE_ARENA_HEIGHT;
    const projectile = createProjectile(
      id,
      position,
      target,
      damage,
      sourceTeam,
      sourceUnit,
      color,
      arenaHeight,
      projectileSpeed,
      splashRadius ?? 0
    );
    this.addProjectile(projectile);
  }

  // === Bounds ===

  setArenaBounds(bounds: EntityBounds | null): void {
    this.arenaBounds = bounds;
  }

  getArenaBounds(): EntityBounds | null {
    return this.arenaBounds;
  }

  // === Queries for external use ===

  getProjectiles(): readonly ProjectileEntity[] {
    return this.projectiles;
  }

  getShockwaves(): readonly ShockwaveEntity[] {
    return this.shockwaves;
  }

  getDamageNumbers(): readonly DamageNumberEntity[] {
    return this.damageNumbers;
  }

  /**
   * Get all player units (including stationary/castles).
   */
  getPlayerUnits(): UnitEntity[] {
    return this.getUnitsByTeam('player');
  }

  /**
   * Get all enemy units (including stationary/castles).
   */
  getEnemyUnits(): UnitEntity[] {
    return this.getUnitsByTeam('enemy');
  }

  /**
   * Get mobile player units (excluding castles).
   */
  getMobilePlayerUnits(): UnitEntity[] {
    return this.units.filter((u) => isPlayerTeam(u.team) && !u.isStationary && !u.isDestroyed());
  }

  /**
   * Get mobile enemy units (excluding castles).
   */
  getMobileEnemyUnits(): UnitEntity[] {
    return this.units.filter((u) => !isPlayerTeam(u.team) && !u.isStationary && !u.isDestroyed());
  }

  /**
   * Get unit count by team.
   */
  getUnitCount(team?: UnitTeam): number {
    if (team) {
      return this.units.filter((u) => u.team === team && !u.isDestroyed()).length;
    }
    return this.units.filter((u) => !u.isDestroyed()).length;
  }

  /**
   * Check if battle is over.
   * Win condition: A side loses when ALL their mobile units are destroyed.
   * Stationary units (castles) don't count for victory - they're objectives, not win conditions.
   */
  isBattleOver(): { over: boolean; winner: UnitTeam | null } {
    const playerMobileUnitsAlive = this.getMobilePlayerUnits().length > 0;
    const enemyMobileUnitsAlive = this.getMobileEnemyUnits().length > 0;

    // A side loses when they have no mobile units remaining (castles don't matter)
    const playerLost = !playerMobileUnitsAlive;
    const enemyLost = !enemyMobileUnitsAlive;

    if (playerLost && enemyLost) {
      return { over: true, winner: null }; // Draw
    }
    if (playerLost) {
      return { over: true, winner: 'enemy' };
    }
    if (enemyLost) {
      return { over: true, winner: 'player' };
    }

    return { over: false, winner: null };
  }

  // === ID Generation ===

  /**
   * Generate a unique modifier ID.
   * Used by ShockwaveEntity for shockwave debuffs.
   */
  getNextModifierId(): number {
    return this.nextModifierId++;
  }

  /**
   * Clear all modifiers linked to a specific unit from all other units.
   * Called when a unit dies to cleanse melee engagement debuffs.
   * @param unitId - ID of the unit that died
   */
  clearModifiersLinkedToUnit(unitId: string): void {
    for (const unit of this.units) {
      unit.removeModifiersLinkedToUnit(unitId);
    }
  }

  // === IWorldEventEmitter Implementation ===

  /**
   * Subscribe to world events.
   * Godot: connect("entity_added", callable)
   */
  onWorld<K extends WorldEventType>(event: K, listener: EventListener<WorldEventMap[K]>): void {
    this.worldEvents.onWorld(event, listener);
  }

  /**
   * Unsubscribe from world events.
   * Godot: disconnect("entity_added", callable)
   */
  offWorld<K extends WorldEventType>(event: K, listener: EventListener<WorldEventMap[K]>): void {
    this.worldEvents.offWorld(event, listener);
  }
}
