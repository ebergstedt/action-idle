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
import {
  BATTLE_TIME_THRESHOLD,
  CASTLE_BACK_DISTANCE_ROWS,
  CASTLE_EDGE_DISTANCE_COLS,
  DEFAULT_ARENA_MARGIN,
  DRAG_OVERLAP_ITERATIONS,
  GRID_DEPLOYMENT_ROWS,
  GRID_FLANK_COLS,
  GRID_NO_MANS_LAND_ROWS,
  GRID_TOTAL_COLS,
  GRID_TOTAL_ROWS,
  IDLE_DAMAGE_TIMEOUT,
  IDLE_SPEED_INCREMENT,
  MAX_IDLE_SPEED_BONUS,
  STALEMATE_TIMEOUT,
  MIN_SEPARATION_DISTANCE,
  OVERLAP_BASE_PUSH,
  OVERLAP_PUSH_FACTOR,
  RANDOM_DIRECTION_CENTER,
  REFERENCE_ARENA_HEIGHT,
  SQUAD_MAX_COLUMNS,
  UNIT_SPACING,
  ZONE_CLAMP_MARGIN,
  MIN_WAVE,
  MAX_WAVE,
  calculateWaveGold,
  DEFAULT_GRID_FOOTPRINT,
} from './BattleConfig';
import type { GridConfig } from './grid/GridTypes';
import { calculateCellSize } from './grid/GridManager';
import { EntityBounds } from './BoundsEnforcer';
import { DEFAULT_WALK_ANIMATION } from './animations';
import { BattleWorld, UnitEntity, UnitData } from './entities';
import { DamagedEvent, EntityAddedEvent, EventListener } from './IEntity';
import { isPlayerTeam } from './TeamUtils';
import {
  BattleState,
  BattleOutcome,
  BattleOutcomeResult,
  getScaledUnitSize,
  UnitRenderData,
} from './types';
import { UnitDefinition, UnitTeam } from './units/types';
import { IUnitRegistry } from './units';
import { captureAllyLayout, SavedAllyLayout } from './deployment/LayoutManager';

/**
 * Configuration options for BattleEngine.
 */
export interface BattleEngineConfig {
  /** Custom battle world (optional, for testing) */
  world?: BattleWorld;
}

/**
 * Battle engine - orchestrates combat simulation.
 * Uses entity system internally, provides render data interface externally.
 */
export class BattleEngine {
  private world: BattleWorld;
  private registry: IUnitRegistry;
  private nextUnitId = 1;
  private nextSquadId = 1;
  private isRunning = false;
  private hasStarted = false;
  private waveNumber = 1;
  private highestWave = 1;
  private gold = 0;
  private arenaBounds: EntityBounds | null = null;
  private battleOutcome: BattleOutcome = 'pending';
  private cellSize: number = 0;
  private savedAllyLayout: SavedAllyLayout | null = null;

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
  constructor(registry: IUnitRegistry, config?: BattleEngineConfig) {
    this.registry = registry;
    this.world = config?.world ?? new BattleWorld();

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
  getRegistry(): IUnitRegistry {
    return this.registry;
  }

  /**
   * Get battle state as render data.
   * Converts internal entities to render data types for React rendering.
   */
  getState(): BattleState {
    // Get all units (including stationary/castles) for selection
    const allUnits = this.world.getUnits();

    // Map stationary units (castles) to CastleRenderData format for rendering
    const castles = this.world.getCastles().map((u) => ({
      id: u.id,
      team: u.team,
      position: u.position,
      health: u.health,
      maxHealth: u.stats.maxHealth,
      gridFootprint: u.gridFootprint,
      size: u.size, // Deprecated but kept for backwards compatibility
      color: u.color,
    }));

    return {
      // Include ALL units (mobile + stationary) for selection support
      units: allUnits.map((u) => u.toRenderData()),
      projectiles: this.world.getProjectiles().map((p) => p.toRenderData()),
      castles,
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
    // Capture ally positions before battle starts (reflects player's intentional arrangement)
    if (this.cellSize > 0) {
      this.savedAllyLayout = captureAllyLayout(this.world.getMobilePlayerUnits(), this.cellSize);
    }

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

    // Unsubscribe from world events before clearing (prevents memory leak)
    this.world.offWorld('entity_added', this.onEntityAddedListener);

    this.world.clear();

    // Re-subscribe for the next battle
    this.world.onWorld('entity_added', this.onEntityAddedListener);

    this.hasStarted = false;
    this.nextUnitId = 1;
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
  handleBattleOutcome(stayOnWave: boolean = false): BattleOutcomeResult {
    const outcome = this.battleOutcome;
    const previousWave = this.waveNumber;
    let goldEarned = 0;
    let newWave = this.waveNumber;

    if (outcome === 'player_victory') {
      // Award gold for clearing this wave
      goldEarned = this.awardWaveGold();
      // Advance to next wave (unless stay mode is on)
      if (!stayOnWave) {
        this.nextWave();
        newWave = this.waveNumber;
      }
    } else if (outcome === 'enemy_victory') {
      // No gold on defeat
      // Go back one wave (minimum 1) - unless stay mode is on
      if (!stayOnWave) {
        this.previousWave();
        newWave = this.waveNumber;
      }
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
   * Also calculates and stores the grid cell size.
   */
  setArenaBounds(width: number, height: number, margin: number = DEFAULT_ARENA_MARGIN): void {
    this.arenaBounds = { width, height, margin };
    this.world.setArenaBounds(this.arenaBounds);

    // Calculate cell size for grid-based positioning
    this.cellSize = calculateCellSize(width, height);
  }

  getArenaBounds(): EntityBounds | null {
    return this.arenaBounds;
  }

  /**
   * Get the current grid cell size in pixels.
   * Returns 0 if arena bounds haven't been set.
   */
  getCellSize(): number {
    return this.cellSize;
  }

  /**
   * Get the saved ally layout (persists across waves).
   * Returns null if no layout has been captured yet.
   */
  getSavedAllyLayout(): SavedAllyLayout | null {
    return this.savedAllyLayout;
  }

  /**
   * Get the grid configuration constants.
   */
  getGridConfig(): GridConfig {
    return {
      totalCols: GRID_TOTAL_COLS,
      totalRows: GRID_TOTAL_ROWS,
      flankCols: GRID_FLANK_COLS,
      noMansLandRows: GRID_NO_MANS_LAND_ROWS,
      deploymentRows: GRID_DEPLOYMENT_ROWS,
    };
  }

  /**
   * Spawn a unit from a definition and add it to the battle.
   * @param definitionId - The unit definition ID (e.g., 'hound', 'fang')
   * @param team - Which team the unit belongs to
   * @param position - Spawn position
   * @param arenaHeight - Arena height for size scaling
   * @param level - Unit level (1-9). HP and damage scale linearly with level.
   * @returns The spawned unit entity
   */
  spawnUnit(
    definitionId: string,
    team: UnitTeam,
    position: Vector2,
    arenaHeight: number = REFERENCE_ARENA_HEIGHT,
    level: number = 1
  ): UnitRenderData {
    const definition = this.registry.get(definitionId);
    return this.spawnUnitFromDefinition(definition, team, position, arenaHeight, undefined, level);
  }

  /**
   * Spawn a unit directly from a definition object.
   * @param level - Unit level (1-9). HP and damage scale linearly with level.
   */
  spawnUnitFromDefinition(
    definition: UnitDefinition,
    team: UnitTeam,
    position: Vector2,
    arenaHeight: number = REFERENCE_ARENA_HEIGHT,
    squadId?: string,
    level: number = 1
  ): UnitRenderData {
    const { baseStats, visuals } = definition;

    // Apply level scaling: HP and damage multiply by level (no upper limit)
    const levelMultiplier = Math.max(1, level);

    // Scale melee attack damage by level
    const scaledMelee = baseStats.melee
      ? { ...baseStats.melee, damage: baseStats.melee.damage * levelMultiplier }
      : null;

    // Scale ranged attack damage by level
    const scaledRanged = baseStats.ranged
      ? { ...baseStats.ranged, damage: baseStats.ranged.damage * levelMultiplier }
      : null;

    // Convert BaseStats to render data UnitStats format (without armor)
    // HP and damage are scaled by level
    const stats = {
      maxHealth: baseStats.maxHealth * levelMultiplier,
      moveSpeed: baseStats.moveSpeed,
      attackInterval: baseStats.attackInterval,
      melee: scaledMelee,
      ranged: scaledRanged,
      resetAttackOnTargetSwitch: baseStats.resetAttackOnTargetSwitch,
    };

    // Get color from theme using colorKey
    const color = getUnitColor(team, visuals.colorKey as 'hound' | 'fang' | 'crawler');
    // Calculate size based on unit's grid footprint (individual unit size)
    const unitGridCols = definition.unitGridSize?.cols ?? 1;
    const size = getScaledUnitSize(unitGridCols, arenaHeight);

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
      level: levelMultiplier,
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
      gridFootprint: definition.gridFootprint ?? DEFAULT_GRID_FOOTPRINT,
    };

    const entity = new UnitEntity(id, position.clone(), data);
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
   * @param level - Unit level (1-9). HP and damage scale linearly with level.
   * @returns Array of spawned unit render data
   */
  spawnSquad(
    definitionId: string,
    team: UnitTeam,
    centerPosition: Vector2,
    arenaHeight: number = REFERENCE_ARENA_HEIGHT,
    level: number = 1
  ): UnitRenderData[] {
    const definition = this.registry.get(definitionId);
    const squadSize = definition.baseStats.squadSize ?? 1;

    // Generate a unique squad ID for all units in this squad
    const squadId = `squad_${this.nextSquadId++}`;

    if (squadSize <= 1) {
      // Single unit, no squad formation needed
      return [
        this.spawnUnitFromDefinition(definition, team, centerPosition, arenaHeight, squadId, level),
      ];
    }

    // Use cell size for spacing so each unit is centered in its grid cell
    const cellSize = arenaHeight / GRID_TOTAL_ROWS;
    const cols = Math.min(squadSize, SQUAD_MAX_COLUMNS);
    const rows = Math.ceil(squadSize / cols);

    // Calculate grid offset so formation is centered
    // Each unit is spaced by one cell size
    const gridWidth = (cols - 1) * cellSize;
    const gridHeight = (rows - 1) * cellSize;
    const startX = centerPosition.x - gridWidth / 2;
    const startY = centerPosition.y - gridHeight / 2;

    const units: UnitRenderData[] = [];
    let unitIndex = 0;

    for (let row = 0; row < rows && unitIndex < squadSize; row++) {
      // Calculate columns for this row (last row may have fewer)
      const colsInRow = row === rows - 1 ? squadSize - unitIndex : cols;
      // Center the last row if it has fewer units
      const rowOffsetX = row === rows - 1 ? ((cols - colsInRow) * cellSize) / 2 : 0;

      for (let col = 0; col < colsInRow && unitIndex < squadSize; col++) {
        const x = startX + rowOffsetX + col * cellSize;
        const y = startY + row * cellSize;
        const position = new Vector2(x, y);

        const unit = this.spawnUnitFromDefinition(
          definition,
          team,
          position,
          arenaHeight,
          squadId,
          level
        );
        units.push(unit);
        unitIndex++;
      }
    }

    return units;
  }

  /**
   * Spawn a castle (stationary unit) for a team.
   * Castles are now regular units with moveSpeed: 0.
   * @param team - Which team the castle belongs to
   * @param position - Spawn position
   * @param arenaHeight - Arena height for size scaling
   * @returns The spawned castle unit render data
   */
  spawnCastle(
    team: UnitTeam,
    position: Vector2,
    arenaHeight: number = REFERENCE_ARENA_HEIGHT
  ): UnitRenderData {
    // Spawn castle as a regular unit using the 'castle' definition
    return this.spawnUnit('castle', team, position, arenaHeight);
  }

  /**
   * Spawn castles for both teams at their deployment zones.
   * Places 2 castles per team (left and right flanks), using grid-based positioning.
   */
  spawnCastles(): void {
    if (!this.arenaBounds) return;

    const { width, height } = this.arenaBounds;
    const cellSize = calculateCellSize(width, height);

    // Castle grid dimensions (4x4 footprint)
    const castleSize = 4;

    // Horizontal positions: use pure grid-based positioning for exact alignment
    // Left castle: center at col 22 (occupies cols 20-23, 20 squares from left edge)
    const leftCol = CASTLE_EDGE_DISTANCE_COLS + castleSize / 2; // 20 + 2 = 22
    // Right castle: center at col 50 (occupies cols 48-51, 20 squares from right edge)
    const rightCol = GRID_TOTAL_COLS - CASTLE_EDGE_DISTANCE_COLS - castleSize / 2; // 72 - 20 - 2 = 50
    const leftX = leftCol * cellSize;
    const rightX = rightCol * cellSize;

    // Vertical positions: place castles at the back of deployment zones (10 squares from edge)
    // Enemy back is at top, center at row 12 (occupies rows 10-13)
    const enemyY = (CASTLE_BACK_DISTANCE_ROWS + castleSize / 2) * cellSize; // (10 + 2) * cellSize
    // Player back is at bottom, center at row 50 (occupies rows 48-51)
    const playerY = (GRID_TOTAL_ROWS - CASTLE_BACK_DISTANCE_ROWS - castleSize / 2) * cellSize; // (62 - 10 - 2) * cellSize

    // Spawn player castles (bottom zone)
    this.spawnCastle('player', new Vector2(leftX, playerY), height);
    this.spawnCastle('player', new Vector2(rightX, playerY), height);

    // Spawn enemy castles (top zone)
    this.spawnCastle('enemy', new Vector2(leftX, enemyY), height);
    this.spawnCastle('enemy', new Vector2(rightX, enemyY), height);
  }

  /**
   * Resolve overlapping units immediately.
   * Call after spawning all units.
   * Only resolves overlaps between different squads - units within the same squad
   * are positioned via the grid system and shouldn't push each other.
   * Castles (stationary units) are never moved - other units move around them.
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

          // Skip units in the same squad - they move as a unit
          if (unitA.squadId === unitB.squadId) continue;

          // Skip collision with stationary units (castles) - units can move through them
          if (unitA.isStationary || unitB.isStationary) continue;

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

            // Push both units equally
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
   * During deployment, positions are set directly without individual unit push logic.
   * Squad overlap prevention is handled by grid-based validation (validateSquadMoves)
   * and resolution (resolveSquadOverlaps) at the squad level.
   */
  moveUnit(id: string, position: Vector2): void {
    if (this.hasStarted) return;

    const entity = this.world.getUnitById(id);
    if (entity && isPlayerTeam(entity.team)) {
      // Set position directly - grid-based validation handles overlap prevention at squad level
      entity.position = position.clone();
    }
  }
}
