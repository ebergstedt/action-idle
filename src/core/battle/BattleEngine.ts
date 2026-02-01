/**
 * Battle Engine
 *
 * Orchestrates battle simulation using the entity system.
 * Uses UnitRegistry for data-driven unit definitions.
 *
 * Godot equivalent: Main battle scene that owns the BattleWorld.
 */

import { Vector2 } from '../physics/Vector2';
import { getUnitColor } from '../theme/colors';
import { EntityBounds } from './BoundsEnforcer';
import { BattleWorld, UnitEntity, UnitData } from './entities';
import { BattleState, getScaledUnitSize, Unit } from './types';
import { UnitDefinition, UnitTeam } from './units/types';
import { UnitRegistry } from './units';

const UNIT_SPACING = 1.2;
const DEFAULT_ARENA_MARGIN = 10;

/**
 * Battle engine - orchestrates combat simulation.
 * Uses entity system internally, provides legacy interface externally.
 */
export class BattleEngine {
  private world: BattleWorld;
  private registry: UnitRegistry;
  private nextUnitId = 1;
  private isRunning = false;
  private hasStarted = false;
  private waveNumber = 1;
  private arenaBounds: EntityBounds | null = null;

  constructor(registry: UnitRegistry) {
    this.registry = registry;
    this.world = new BattleWorld();
  }

  /**
   * Get the unit registry.
   */
  getRegistry(): UnitRegistry {
    return this.registry;
  }

  /**
   * Get battle state in legacy format.
   * Converts internal entities to legacy types for backward compatibility.
   */
  getState(): BattleState {
    return {
      units: this.world.getUnits().map((u) => u.toLegacyUnit()),
      projectiles: this.world.getProjectiles().map((p) => p.toLegacyProjectile()),
      isRunning: this.isRunning,
      hasStarted: this.hasStarted,
      waveNumber: this.waveNumber,
    };
  }

  /**
   * Get the internal BattleWorld for direct entity access.
   * Use this for new code that wants to work with entities directly.
   */
  getWorld(): BattleWorld {
    return this.world;
  }

  start(): void {
    this.isRunning = true;
    this.hasStarted = true;
  }

  stop(): void {
    this.isRunning = false;
  }

  clear(): void {
    this.world.clear();
    this.hasStarted = false;
    this.nextUnitId = 1;
  }

  /**
   * Set arena bounds for boundary enforcement.
   */
  setArenaBounds(width: number, height: number, margin: number = DEFAULT_ARENA_MARGIN): void {
    this.arenaBounds = { width, height, margin };
    this.world.setArenaBounds(this.arenaBounds);
  }

  getArenaBounds(): EntityBounds | null {
    return this.arenaBounds;
  }

  /**
   * Spawn a unit from a definition and add it to the battle.
   * @param definitionId - The unit definition ID (e.g., 'warrior', 'archer')
   * @param team - Which team the unit belongs to
   * @param position - Spawn position
   * @param arenaHeight - Arena height for size scaling
   * @returns The spawned unit entity
   */
  spawnUnit(
    definitionId: string,
    team: UnitTeam,
    position: Vector2,
    arenaHeight: number = 600
  ): Unit {
    const definition = this.registry.get(definitionId);
    return this.spawnUnitFromDefinition(definition, team, position, arenaHeight);
  }

  /**
   * Spawn a unit directly from a definition object.
   */
  spawnUnitFromDefinition(
    definition: UnitDefinition,
    team: UnitTeam,
    position: Vector2,
    arenaHeight: number = 600
  ): Unit {
    const { baseStats, visuals } = definition;

    // Convert BaseStats to legacy UnitStats format (without armor)
    const stats = {
      maxHealth: baseStats.maxHealth,
      moveSpeed: baseStats.moveSpeed,
      melee: baseStats.melee,
      ranged: baseStats.ranged,
    };

    // Get color from theme using colorKey
    const color = getUnitColor(team, visuals.colorKey as 'warrior' | 'archer' | 'knight');
    const size = getScaledUnitSize(visuals.baseSize, arenaHeight);

    const id = `unit_${this.nextUnitId++}`;
    const data: UnitData = {
      type: definition.id as 'warrior' | 'archer' | 'knight',
      team,
      health: stats.maxHealth,
      stats,
      color,
      shape: visuals.shape,
      size,
      target: null,
      attackCooldown: 0,
      shuffleDirection: null,
      shuffleTimer: 0,
    };

    const entity = new UnitEntity(id, position.clone(), data);
    this.world.addUnit(entity);

    return entity.toLegacyUnit();
  }

  /**
   * Resolve overlapping units immediately.
   * Call after spawning all units.
   */
  resolveOverlaps(
    iterations: number = 20,
    bounds?: { arenaWidth: number; arenaHeight: number; zoneHeightPercent: number }
  ): void {
    const units = this.world.getUnits();

    for (let iter = 0; iter < iterations; iter++) {
      let hasOverlap = false;

      for (let i = 0; i < units.length; i++) {
        const unitA = units[i];

        for (let j = i + 1; j < units.length; j++) {
          const unitB = units[j];

          const diff = unitA.position.subtract(unitB.position);
          const dist = diff.magnitude();
          const minDist = (unitA.size + unitB.size) * UNIT_SPACING;

          if (dist < minDist) {
            hasOverlap = true;
            const overlap = minDist - dist;
            const pushDir =
              dist > 0.1
                ? diff.normalize()
                : new Vector2(Math.random() - 0.5, Math.random() - 0.5).normalize();
            const pushAmount = overlap * 0.5 + 1;

            unitA.position = unitA.position.add(pushDir.multiply(pushAmount));
            unitB.position = unitB.position.subtract(pushDir.multiply(pushAmount));
          }
        }
      }

      if (bounds) {
        this.clampUnitsToZones(bounds.arenaWidth, bounds.arenaHeight, bounds.zoneHeightPercent);
      }

      if (!hasOverlap) break;
    }
  }

  /**
   * Clamp units to their deployment zones.
   */
  clampUnitsToZones(arenaWidth: number, arenaHeight: number, zoneHeightPercent: number): void {
    const zoneHeight = arenaHeight * zoneHeightPercent;
    const margin = 20;

    for (const unit of this.world.getUnits()) {
      // Clamp X to arena bounds
      unit.position.x = Math.max(
        margin + unit.size,
        Math.min(arenaWidth - margin - unit.size, unit.position.x)
      );

      if (unit.team === 'enemy') {
        // Enemy zone is at top
        unit.position.y = Math.max(
          margin + unit.size,
          Math.min(zoneHeight - margin - unit.size, unit.position.y)
        );
      } else {
        // Allied zone is at bottom
        const allyZoneTop = arenaHeight - zoneHeight;
        unit.position.y = Math.max(
          allyZoneTop + margin + unit.size,
          Math.min(arenaHeight - margin - unit.size, unit.position.y)
        );
      }
    }
  }

  /**
   * Main game loop tick.
   * Delegates to BattleWorld for entity updates.
   */
  tick(delta: number): void {
    if (!this.isRunning) return;
    this.world.update(delta);
  }

  /**
   * Get player units in legacy format.
   */
  getPlayerUnits(): Unit[] {
    return this.world.getPlayerUnits().map((u) => u.toLegacyUnit());
  }

  /**
   * Get enemy units in legacy format.
   */
  getEnemyUnits(): Unit[] {
    return this.world.getEnemyUnits().map((u) => u.toLegacyUnit());
  }

  /**
   * Get a unit by ID in legacy format.
   */
  getUnit(id: string): Unit | undefined {
    const entity = this.world.getUnitById(id);
    return entity?.toLegacyUnit();
  }

  /**
   * Get a unit entity by ID (for direct entity access).
   */
  getUnitEntity(id: string): UnitEntity | undefined {
    return this.world.getUnitById(id);
  }

  /**
   * Move a unit before battle starts.
   */
  moveUnit(id: string, position: Vector2): void {
    if (this.hasStarted) return;

    const entity = this.world.getUnitById(id);
    if (entity && entity.team === 'player') {
      const newPos = this.findNonOverlappingPosition(entity, position);
      entity.position = newPos;
    }
  }

  private findNonOverlappingPosition(unit: UnitEntity, desiredPos: Vector2): Vector2 {
    const allies = this.world.getAlliesOf(unit);

    let pos = desiredPos.clone();
    const maxIterations = 10;

    for (let i = 0; i < maxIterations; i++) {
      let hasOverlap = false;
      let pushDir = Vector2.zero();

      for (const ally of allies) {
        const diff = pos.subtract(ally.position);
        const dist = diff.magnitude();
        const minDist = (unit.size + ally.size) * UNIT_SPACING;

        if (dist < minDist && dist > 0) {
          hasOverlap = true;
          pushDir = pushDir.add(diff.normalize().multiply(minDist - dist));
        }
      }

      if (!hasOverlap) break;
      pos = pos.add(pushDir);
    }

    return pos;
  }
}
