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
  BASE_SQUAD_UNIT_SPACING,
  BATTLE_TIME_THRESHOLD,
  CASTLE_MAX_HEALTH,
  CASTLE_SIZE,
  DEFAULT_ARENA_MARGIN,
  DRAG_OVERLAP_ITERATIONS,
  DRAG_POSITION_MAX_ITERATIONS,
  IDLE_DAMAGE_TIMEOUT,
  IDLE_SPEED_INCREMENT,
  MAX_IDLE_SPEED_BONUS,
  MAX_SCALE,
  STALEMATE_TIMEOUT,
  MIN_SEPARATION_DISTANCE,
  MIN_SCALE,
  OVERLAP_BASE_PUSH,
  OVERLAP_PUSH_FACTOR,
  RANDOM_DIRECTION_CENTER,
  REFERENCE_ARENA_HEIGHT,
  SQUAD_MAX_COLUMNS,
  UNIT_SPACING,
  ZONE_CLAMP_MARGIN,
  ZONE_HEIGHT_PERCENT,
  ZONE_MIDWAY_DIVISOR,
  scaleValue,
  MIN_WAVE,
  MAX_WAVE,
  calculateWaveGold,
} from './BattleConfig';
import { EntityBounds } from './BoundsEnforcer';
import { DEFAULT_WALK_ANIMATION } from './animations';
import { BattleWorld, UnitEntity, UnitData, CastleEntity, CastleData } from './entities';
import { DamagedEvent, EntityAddedEvent, EventListener } from './IEntity';
import {
  BattleState,
  BattleOutcome,
  BattleOutcomeResult,
  getScaledUnitSize,
  UnitRenderData,
} from './types';
import { UnitDefinition, UnitTeam } from './units/types';
import { UnitRegistry } from './units';
import {
  IUnitEntityFactory,
  ICastleEntityFactory,
  DefaultUnitFactory,
  DefaultCastleFactory,
} from './factories';

/**
 * Configuration options for BattleEngine.
 */
export interface BattleEngineConfig {
  /** Custom unit factory (optional, uses default if not provided) */
  unitFactory?: IUnitEntityFactory;
  /** Custom castle factory (optional, uses default if not provided) */
  castleFactory?: ICastleEntityFactory;
  /** Custom battle world (optional, for testing) */
  world?: BattleWorld;
}

/**
 * Battle engine - orchestrates combat simulation.
 * Uses entity system internally, provides render data interface externally.
 */
export class BattleEngine {
  private world: BattleWorld;
  private registry: UnitRegistry;
  private unitFactory: IUnitEntityFactory;
  private castleFactory: ICastleEntityFactory;
  private nextUnitId = 1;
  private nextCastleId = 1;
  private nextSquadId = 1;
  private isRunning = false;
  private hasStarted = false;
  private waveNumber = 1;
  private highestWave = 1;
  private gold = 0;
  private arenaBounds: EntityBounds | null = null;
  private battleOutcome: BattleOutcome = 'pending';

  // Speed control
  private userBattleSpeed = 1;

  // Auto speed-up system
  // - Speeds up battle by 40% every 3s when idle (no damage)
  // - After 20s or stalemate (5s no damage), speeds up unconditionally
  private battleTime = 0;
  private idleTimer = 0;
  private speedBonus = 0;
  private speedUpEnabled = false; // Activates after first damage
  private unconditionalMode = false; // Once true, damage no longer resets timer
  private subscribedUnits: Set<string> = new Set();

  // Event listeners (bound for proper unsubscription)
  private onDamagedListener: EventListener<DamagedEvent>;
  private onEntityAddedListener: EventListener<EntityAddedEvent>;

  /**
   * Create a new BattleEngine.
   * @param registry - Unit registry for spawning units
   * @param config - Optional configuration with factories and world (for DI/testing)
   */
  constructor(registry: UnitRegistry, config?: BattleEngineConfig) {
    this.registry = registry;
    this.world = config?.world ?? new BattleWorld();
    this.unitFactory = config?.unitFactory ?? new DefaultUnitFactory();
    this.castleFactory = config?.castleFactory ?? new DefaultCastleFactory();

    // Bind event listeners for idle speed-up system
    this.onDamagedListener = this.handleDamaged.bind(this);
    this.onEntityAddedListener = this.handleEntityAdded.bind(this);

    // Subscribe to world events for auto-subscription to new units
    this.world.onWorld('entity_added', this.onEntityAddedListener);
  }

  /**
   * Handle damage event from any unit.
   */
  private handleDamaged(): void {
    this.speedUpEnabled = true;
    if (!this.unconditionalMode) {
      this.idleTimer = 0;
    }
  }

  /**
   * Handle entity added - subscribe to damage events for units.
   */
  private handleEntityAdded(event: EntityAddedEvent): void {
    if (event.entity.kind === 'unit') {
      this.subscribeToUnit(event.entity as UnitEntity);
    }
  }

  /**
   * Subscribe to a unit's damage events.
   */
  private subscribeToUnit(unit: UnitEntity): void {
    if (this.subscribedUnits.has(unit.id)) return;
    unit.on('damaged', this.onDamagedListener);
    this.subscribedUnits.add(unit.id);
  }

  /**
   * Unsubscribe from a unit's damage events.
   */
  private unsubscribeFromUnit(unit: UnitEntity): void {
    if (!this.subscribedUnits.has(unit.id)) return;
    unit.off('damaged', this.onDamagedListener);
    this.subscribedUnits.delete(unit.id);
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
      damageNumbers: this.world.getDamageNumbers().map((d) => d.toRenderData()),
      isRunning: this.isRunning,
      hasStarted: this.hasStarted,
      waveNumber: this.waveNumber,
      highestWave: this.highestWave,
      gold: this.gold,
      outcome: this.battleOutcome,
      timeScale: this.getTimeScale(),
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

  /**
   * Set the user's battle speed setting (0.5, 1, 2, etc.).
   * This is added to the idle speed bonus for the total time scale.
   */
  setBattleSpeed(speed: number): void {
    this.userBattleSpeed = speed;
  }

  clear(): void {
    // Unsubscribe from all units before clearing
    for (const unit of this.world.getUnits()) {
      this.unsubscribeFromUnit(unit);
    }

    this.world.clear();
    this.hasStarted = false;
    this.nextUnitId = 1;
    this.nextCastleId = 1;
    this.nextSquadId = 1;
    this.battleOutcome = 'pending';

    // Reset auto speed-up state
    this.battleTime = 0;
    this.idleTimer = 0;
    this.speedBonus = 0;
    this.speedUpEnabled = false;
    this.unconditionalMode = false;
    this.subscribedUnits.clear();
  }

  /**
   * Set the current wave number.
   */
  setWave(wave: number): void {
    this.waveNumber = Math.max(MIN_WAVE, Math.min(MAX_WAVE, wave));
    if (this.waveNumber > this.highestWave) {
      this.highestWave = this.waveNumber;
    }
  }

  /**
   * Advance to the next wave.
   */
  nextWave(): void {
    this.setWave(this.waveNumber + 1);
  }

  /**
   * Go back one wave (on defeat).
   */
  previousWave(): void {
    this.setWave(this.waveNumber - 1);
  }

  /**
   * Add gold to the player's balance.
   */
  addGold(amount: number): void {
    this.gold += amount;
  }

  /**
   * Set gold directly (for loading saved state).
   */
  setGold(amount: number): void {
    this.gold = Math.max(0, amount);
  }

  /**
   * Set the highest wave reached (for loading saved state).
   */
  setHighestWave(wave: number): void {
    this.highestWave = Math.max(MIN_WAVE, Math.min(MAX_WAVE, wave));
  }

  /**
   * Get current gold balance.
   */
  getGold(): number {
    return this.gold;
  }

  /**
   * Award gold for clearing the current wave.
   */
  awardWaveGold(): number {
    const reward = calculateWaveGold(this.waveNumber);
    this.addGold(reward);
    return reward;
  }

  /**
   * Handle battle outcome - awards gold, adjusts wave, returns result.
   * Call this when player dismisses the victory/defeat overlay.
   *
   * This is the single source of truth for outcome logic.
   * React layer should only call this and display the result.
   */
  handleBattleOutcome(): BattleOutcomeResult {
    const outcome = this.battleOutcome;
    const previousWave = this.waveNumber;
    let goldEarned = 0;
    let newWave = this.waveNumber;

    if (outcome === 'player_victory') {
      // Award gold for clearing this wave
      goldEarned = this.awardWaveGold();
      // Advance to next wave
      this.nextWave();
      newWave = this.waveNumber;
    } else if (outcome === 'enemy_victory') {
      // No gold on defeat
      // Go back one wave (minimum 1)
      this.previousWave();
      newWave = this.waveNumber;
    }
    // Draw: no gold, stay on same wave

    return {
      outcome,
      previousWave,
      newWave,
      goldEarned,
      waveChanged: previousWave !== newWave,
    };
  }

  /**
   * Get the gold reward for the current wave (for display purposes).
   * Does not actually award the gold.
   */
  getWaveGoldReward(): number {
    return calculateWaveGold(this.waveNumber);
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
   * @param definitionId - The unit definition ID (e.g., 'hound', 'fang')
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
    arenaHeight: number = REFERENCE_ARENA_HEIGHT,
    squadId?: string
  ): UnitRenderData {
    const { baseStats, visuals } = definition;

    // Convert BaseStats to render data UnitStats format (without armor)
    const stats = {
      maxHealth: baseStats.maxHealth,
      moveSpeed: baseStats.moveSpeed,
      attackInterval: baseStats.attackInterval,
      melee: baseStats.melee,
      ranged: baseStats.ranged,
    };

    // Get color from theme using colorKey
    const color = getUnitColor(team, visuals.colorKey as 'hound' | 'fang' | 'crawler');
    const size = getScaledUnitSize(visuals.baseSize, arenaHeight);

    const id = `unit_${this.nextUnitId++}`;
    // Use provided squadId or generate one for solo units
    const finalSquadId = squadId ?? `squad_${this.nextSquadId++}`;
    const data: UnitData = {
      type: definition.id,
      team,
      health: stats.maxHealth,
      stats,
      color,
      shape: visuals.shape,
      size,
      squadId: finalSquadId,
      target: null,
      attackCooldown: 0,
      shuffleDirection: null,
      shuffleTimer: 0,
      seekMode: false,
      retargetCooldown: 0,
      activeModifiers: [],
      pendingModifiers: [],
      visualOffset: Vector2.zero(),
      hitFlashTimer: 0,
      deathFadeTimer: -1, // -1 means alive
      walkAnimationTime: 0, // Walk animation starts at time 0
      walkAnimation: visuals.walkAnimation ?? DEFAULT_WALK_ANIMATION,
      hasAimingLaser: visuals.aimingLaser ?? false,
    };

    const entity = this.unitFactory.createUnit(id, position.clone(), data);
    this.world.addUnit(entity);

    return entity.toRenderData();
  }

  /**
   * Spawn a squad of units from a definition.
   * Units are arranged in a grid formation centered on the given position.
   *
   * @param definitionId - The unit definition ID (e.g., 'hound', 'fang')
   * @param team - Which team the squad belongs to
   * @param centerPosition - Center position for the squad formation
   * @param arenaHeight - Arena height for size scaling
   * @returns Array of spawned unit render data
   */
  spawnSquad(
    definitionId: string,
    team: UnitTeam,
    centerPosition: Vector2,
    arenaHeight: number = REFERENCE_ARENA_HEIGHT
  ): UnitRenderData[] {
    const definition = this.registry.get(definitionId);
    const squadSize = definition.baseStats.squadSize ?? 1;

    // Generate a unique squad ID for all units in this squad
    const squadId = `squad_${this.nextSquadId++}`;

    if (squadSize <= 1) {
      // Single unit, no squad formation needed
      return [this.spawnUnitFromDefinition(definition, team, centerPosition, arenaHeight, squadId)];
    }

    const spacing = scaleValue(BASE_SQUAD_UNIT_SPACING, arenaHeight);
    const cols = Math.min(squadSize, SQUAD_MAX_COLUMNS);
    const rows = Math.ceil(squadSize / cols);

    // Calculate grid offset so formation is centered
    const gridWidth = (cols - 1) * spacing;
    const gridHeight = (rows - 1) * spacing;
    const startX = centerPosition.x - gridWidth / 2;
    const startY = centerPosition.y - gridHeight / 2;

    const units: UnitRenderData[] = [];
    let unitIndex = 0;

    for (let row = 0; row < rows && unitIndex < squadSize; row++) {
      // Calculate columns for this row (last row may have fewer)
      const colsInRow = row === rows - 1 ? squadSize - unitIndex : cols;
      // Center the last row if it has fewer units
      const rowOffsetX = row === rows - 1 ? ((cols - colsInRow) * spacing) / 2 : 0;

      for (let col = 0; col < colsInRow && unitIndex < squadSize; col++) {
        const x = startX + rowOffsetX + col * spacing;
        const y = startY + row * spacing;
        const position = new Vector2(x, y);

        const unit = this.spawnUnitFromDefinition(definition, team, position, arenaHeight, squadId);
        units.push(unit);
        unitIndex++;
      }
    }

    return units;
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

    const entity = this.castleFactory.createCastle(id, position.clone(), data);
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
    const playerY = height - zoneHeight / ZONE_MIDWAY_DIVISOR;
    this.spawnCastle('player', new Vector2(leftX, playerY), height);
    this.spawnCastle('player', new Vector2(rightX, playerY), height);

    // Enemy castles (top zone) - vertically centered in zone
    const enemyY = zoneHeight / ZONE_MIDWAY_DIVISOR;
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
   * Applies combined speed: user battle speed + idle speed-up bonus (additive).
   *
   * @param delta - Raw frame delta in seconds (not pre-scaled)
   */
  tick(delta: number): void {
    if (!this.isRunning) return;

    this.battleTime += delta;
    this.updateAutoSpeedUp(delta);

    const timeScale = this.userBattleSpeed + this.speedBonus;
    this.world.update(delta * timeScale);

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
   * Update auto speed-up system.
   * - After first damage, idle timer starts counting
   * - Every 3s idle, speed increases by 40%
   * - After 20s battle time OR 5s stalemate, speed-up becomes unconditional
   */
  private updateAutoSpeedUp(delta: number): void {
    if (!this.speedUpEnabled) return;

    this.idleTimer += delta;

    // Check if we should enter unconditional mode (stays forever once triggered)
    if (!this.unconditionalMode) {
      const battleTimeExceeded = this.battleTime >= BATTLE_TIME_THRESHOLD;
      const stalemateDetected = this.idleTimer >= STALEMATE_TIMEOUT;
      if (battleTimeExceeded || stalemateDetected) {
        this.unconditionalMode = true;
      }
    }

    // Apply speed increases for every 3s on the idle timer
    while (this.idleTimer >= IDLE_DAMAGE_TIMEOUT && this.speedBonus < MAX_IDLE_SPEED_BONUS) {
      this.idleTimer -= IDLE_DAMAGE_TIMEOUT;
      this.speedBonus = Math.min(this.speedBonus + IDLE_SPEED_INCREMENT, MAX_IDLE_SPEED_BONUS);
    }
  }

  /**
   * Get current time scale (user speed + auto speed bonus).
   */
  getTimeScale(): number {
    return this.userBattleSpeed + this.speedBonus;
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
