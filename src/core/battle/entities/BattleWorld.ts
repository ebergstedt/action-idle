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
import { SEPARATION_FORCE, UNIT_SPACING } from '../BattleConfig';
import { EntityBounds } from '../BoundsEnforcer';
import { UnitTeam } from '../units/types';
import {
  IEntity,
  IWorldEventEmitter,
  WorldEventType,
  WorldEventMap,
  EventListener,
} from '../IEntity';
import { IEntityWorld } from './BaseEntity';
import { IBattleWorld } from './IBattleWorld';
import { UnitEntity } from './UnitEntity';
import { ProjectileEntity, createProjectile } from './ProjectileEntity';
import { WorldEventEmitter } from './EventEmitter';

/**
 * Battle world - manages all battle entities.
 * Implements IWorldEventEmitter to notify listeners when entities are added/removed.
 */
export class BattleWorld implements IEntityWorld, IBattleWorld, IWorldEventEmitter {
  private units: UnitEntity[] = [];
  private projectiles: ProjectileEntity[] = [];
  private nextProjectileId = 1;
  private arenaBounds: EntityBounds | null = null;
  private worldEvents = new WorldEventEmitter();

  // === Entity Management ===

  /**
   * Add a unit to the world.
   * Emits 'entity_added' world event.
   */
  addUnit(unit: UnitEntity): void {
    unit.setWorld(this);
    unit.init();
    this.units.push(unit);
    this.worldEvents.emitWorld({ type: 'entity_added', entity: unit });
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
   * Remove a unit from the world.
   * Emits 'entity_removed' world event.
   */
  removeUnit(unit: UnitEntity): void {
    const index = this.units.indexOf(unit);
    if (index !== -1) {
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
    for (const unit of this.units) {
      this.worldEvents.emitWorld({ type: 'entity_removed', entity: unit });
      unit.destroy();
      unit.setWorld(null);
    }
    for (const proj of this.projectiles) {
      this.worldEvents.emitWorld({ type: 'entity_removed', entity: proj });
      proj.destroy();
      proj.setWorld(null);
    }
    this.units = [];
    this.projectiles = [];
    this.nextProjectileId = 1;
  }

  // === Main Update Loop ===

  /**
   * Update all entities.
   * Godot: Called from main scene's _process(delta)
   */
  update(delta: number): void {
    // Phase 1: Update all units (targeting, combat, movement)
    for (const unit of this.units) {
      unit.update(delta);
    }

    // Phase 2: Apply separation between units
    this.applySeparation(delta);

    // Phase 3: Update projectiles
    for (const proj of this.projectiles) {
      proj.update(delta);
    }

    // Phase 4: Remove destroyed entities
    this.removeDestroyedEntities();
  }

  private applySeparation(delta: number): void {
    for (let i = 0; i < this.units.length; i++) {
      const unitA = this.units[i];
      if (unitA.isDestroyed()) continue;

      for (let j = i + 1; j < this.units.length; j++) {
        const unitB = this.units[j];
        if (unitB.isDestroyed()) continue;

        const diff = unitA.position.subtract(unitB.position);
        const dist = diff.magnitude();
        const minDist = (unitA.size + unitB.size) * UNIT_SPACING;

        if (dist < minDist && dist > 0) {
          const overlap = minDist - dist;
          const pushDir = diff.normalize();
          const pushAmount = overlap * SEPARATION_FORCE * delta;

          // Push both units, but less if they're enemies
          const pushMultiplier = unitA.team === unitB.team ? 0.5 : 0.3;

          unitA.position = unitA.position.add(pushDir.multiply(pushAmount * pushMultiplier));
          unitB.position = unitB.position.subtract(pushDir.multiply(pushAmount * pushMultiplier));
        }
      }
    }
  }

  private removeDestroyedEntities(): void {
    // Remove destroyed units
    this.units = this.units.filter((unit) => {
      if (unit.isDestroyed()) {
        this.worldEvents.emitWorld({ type: 'entity_removed', entity: unit });
        unit.setWorld(null);
        return false;
      }
      return true;
    });

    // Remove destroyed projectiles
    this.projectiles = this.projectiles.filter((proj) => {
      if (proj.isDestroyed()) {
        this.worldEvents.emitWorld({ type: 'entity_removed', entity: proj });
        proj.setWorld(null);
        return false;
      }
      return true;
    });
  }

  // === IEntityWorld Implementation ===

  getEntities(): readonly IEntity[] {
    return [...this.units, ...this.projectiles];
  }

  query<T extends IEntity>(predicate: (entity: IEntity) => entity is T): T[] {
    const result: T[] = [];
    for (const entity of this.getEntities()) {
      if (predicate(entity)) {
        result.push(entity);
      }
    }
    return result;
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
    return this.units.filter((u) => u.team !== unit.team && !u.isDestroyed() && u.health > 0);
  }

  getAlliesOf(unit: UnitEntity): UnitEntity[] {
    return this.units.filter(
      (u) => u.team === unit.team && u.id !== unit.id && !u.isDestroyed() && u.health > 0
    );
  }

  isPathBlocked(from: Vector2, to: Vector2, excludeUnit: UnitEntity): boolean {
    const allies = this.getAlliesOf(excludeUnit);

    for (const ally of allies) {
      const dist = this.pointToLineDistance(ally.position, from, to);
      if (dist < ally.size * 1.5) {
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
    color: string
  ): void {
    const id = `proj_${this.nextProjectileId++}`;
    const projectile = createProjectile(id, position, target, damage, sourceTeam, color);
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

  getPlayerUnits(): UnitEntity[] {
    return this.getUnitsByTeam('player');
  }

  getEnemyUnits(): UnitEntity[] {
    return this.getUnitsByTeam('enemy');
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
   */
  isBattleOver(): { over: boolean; winner: UnitTeam | null } {
    const playerAlive = this.getPlayerUnits().length > 0;
    const enemyAlive = this.getEnemyUnits().length > 0;

    if (!playerAlive && !enemyAlive) {
      return { over: true, winner: null }; // Draw
    }
    if (!playerAlive) {
      return { over: true, winner: 'enemy' };
    }
    if (!enemyAlive) {
      return { over: true, winner: 'player' };
    }
    return { over: false, winner: null };
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
