/**
 * Battle Engine
 *
 * Orchestrates battle simulation using the entity system.
 * Uses UnitRegistry for data-driven unit definitions.
 *
 * Godot equivalent: Main battle scene that owns the BattleWorld.
 */

import { Vector2 } from '../physics/Vector2';
import { getCastleColor, getUnitColor } from '../theme/colors';
import {
  BASE_CASTLE_HORIZONTAL_MARGIN,
  CASTLE_MAX_HEALTH,
  CASTLE_SIZE,
  DEFAULT_ARENA_MARGIN,
  DRAG_OVERLAP_ITERATIONS,
  DRAG_POSITION_MAX_ITERATIONS,
  MAX_SCALE,
  MIN_SEPARATION_DISTANCE,
  MIN_SCALE,
  OVERLAP_BASE_PUSH,
  OVERLAP_PUSH_FACTOR,
  RANDOM_DIRECTION_CENTER,
  REFERENCE_ARENA_HEIGHT,
  UNIT_SPACING,
  ZONE_CLAMP_MARGIN,
  ZONE_HEIGHT_PERCENT,
  scaleValue,
} from './BattleConfig';
import { EntityBounds } from './BoundsEnforcer';
import { BattleWorld, UnitEntity, UnitData, CastleEntity, CastleData } from './entities';
import { BattleState, BattleOutcome, getScaledUnitSize, UnitRenderData } from './types';
import { UnitDefinition, UnitTeam } from './units/types';
import { UnitRegistry } from './units';

/**
 * Battle engine - orchestrates combat simulation.
 * Uses entity system internally, provides render data interface externally.
 */
export class BattleEngine {
  private world: BattleWorld;
  private registry: UnitRegistry;
  private nextUnitId = 1;
  private nextCastleId = 1;
  private isRunning = false;
  private hasStarted = false;
  private waveNumber = 1;
  private arenaBounds: EntityBounds | null = null;
  private battleOutcome: BattleOutcome = 'pending';

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
   * Get battle state as render data.
   * Converts internal entities to render data types for React rendering.
   */
  getState(): BattleState {
    return {
      units: this.world.getUnits().map((u) => u.toRenderData()),
      projectiles: this.world.getProjectiles().map((p) => p.toRenderData()),
      castles: this.world.getCastles().map((c) => c.toRenderData()),
      shockwaves: this.world.getShockwaves().map((s) => s.toRenderData()),
      isRunning: this.isRunning,
      hasStarted: this.hasStarted,
      waveNumber: this.waveNumber,
      outcome: this.battleOutcome,
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
    this.nextCastleId = 1;
    this.battleOutcome = 'pending';
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
    arenaHeight: number = REFERENCE_ARENA_HEIGHT
  ): UnitRenderData {
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
    arenaHeight: number = REFERENCE_ARENA_HEIGHT
  ): UnitRenderData {
    const { baseStats, visuals } = definition;

    // Convert BaseStats to render data UnitStats format (without armor)
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
      seekMode: false,
      retargetCooldown: 0,
      activeModifiers: [],
      visualOffset: Vector2.zero(),
      hitFlashTimer: 0,
    };

    const entity = new UnitEntity(id, position.clone(), data);
    this.world.addUnit(entity);

    return entity.toRenderData();
  }

  /**
   * Spawn a castle for a team.
   * @param team - Which team the castle belongs to
   * @param position - Spawn position
   * @param arenaHeight - Arena height for size scaling
   * @returns The spawned castle entity
   */
  spawnCastle(
    team: UnitTeam,
    position: Vector2,
    arenaHeight: number = REFERENCE_ARENA_HEIGHT
  ): CastleEntity {
    const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, arenaHeight / REFERENCE_ARENA_HEIGHT));
    const size = Math.round(CASTLE_SIZE * scale);

    const id = `castle_${this.nextCastleId++}`;
    const data: CastleData = {
      team,
      maxHealth: CASTLE_MAX_HEALTH,
      health: CASTLE_MAX_HEALTH,
      size,
      color: getCastleColor(team),
    };

    const entity = new CastleEntity(id, position.clone(), data);
    this.world.addCastle(entity);

    return entity;
  }

  /**
   * Spawn castles for both teams at their deployment zones.
   * Places 2 castles per team (left and right flanks), vertically centered in each zone.
   */
  spawnCastles(): void {
    if (!this.arenaBounds) return;

    const { width, height } = this.arenaBounds;
    const zoneHeight = height * ZONE_HEIGHT_PERCENT;

    // Castle X positions (horizontal flanks) - scaled for arena size
    const castleMargin = scaleValue(BASE_CASTLE_HORIZONTAL_MARGIN, height);
    const leftX = castleMargin;
    const rightX = width - castleMargin;

    // Player castles (bottom zone) - vertically centered in zone
    const playerY = height - zoneHeight / 2;
    this.spawnCastle('player', new Vector2(leftX, playerY), height);
    this.spawnCastle('player', new Vector2(rightX, playerY), height);

    // Enemy castles (top zone) - vertically centered in zone
    const enemyY = zoneHeight / 2;
    this.spawnCastle('enemy', new Vector2(leftX, enemyY), height);
    this.spawnCastle('enemy', new Vector2(rightX, enemyY), height);
  }

  /**
   * Resolve overlapping units immediately.
   * Call after spawning all units.
   */
  resolveOverlaps(
    iterations: number = DRAG_OVERLAP_ITERATIONS,
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
              dist > MIN_SEPARATION_DISTANCE
                ? diff.normalize()
                : new Vector2(
                    Math.random() - RANDOM_DIRECTION_CENTER,
                    Math.random() - RANDOM_DIRECTION_CENTER
                  ).normalize();
            const pushAmount = overlap * OVERLAP_PUSH_FACTOR + OVERLAP_BASE_PUSH;

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
    const margin = ZONE_CLAMP_MARGIN;

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

    // Check for battle end
    const result = this.world.isBattleOver();
    if (result.over) {
      this.isRunning = false;
      if (result.winner === 'player') {
        this.battleOutcome = 'player_victory';
      } else if (result.winner === 'enemy') {
        this.battleOutcome = 'enemy_victory';
      } else {
        this.battleOutcome = 'draw';
      }
    }
  }

  /**
   * Get player units as render data.
   */
  getPlayerUnits(): UnitRenderData[] {
    return this.world.getPlayerUnits().map((u) => u.toRenderData());
  }

  /**
   * Get enemy units as render data.
   */
  getEnemyUnits(): UnitRenderData[] {
    return this.world.getEnemyUnits().map((u) => u.toRenderData());
  }

  /**
   * Get a unit by ID as render data.
   */
  getUnit(id: string): UnitRenderData | undefined {
    const entity = this.world.getUnitById(id);
    return entity?.toRenderData();
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
    const maxIterations = DRAG_POSITION_MAX_ITERATIONS;

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
