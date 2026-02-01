/**
 * Battle Statistics Tracker
 *
 * Subscribes to entity events to track battle statistics.
 * Demonstrates the event system and provides useful game data.
 *
 * Godot equivalent: Autoload or node that connects to unit signals.
 */

import { EntityEvent, EntityEventListener } from './IEntity';
import { BattleWorld } from './entities/BattleWorld';
import { UnitEntity } from './entities/UnitEntity';
import { UnitTeam } from './units/types';

/**
 * Statistics for a single team.
 */
export interface TeamStats {
  kills: number;
  deaths: number;
  damageDealt: number;
  damageTaken: number;
  unitsSpawned: number;
}

/**
 * Overall battle statistics.
 */
export interface BattleStatistics {
  player: TeamStats;
  enemy: TeamStats;
  battleDuration: number;
  totalKills: number;
}

/**
 * Creates empty team stats.
 */
function createEmptyTeamStats(): TeamStats {
  return {
    kills: 0,
    deaths: 0,
    damageDealt: 0,
    damageTaken: 0,
    unitsSpawned: 0,
  };
}

/**
 * Battle statistics tracker.
 * Subscribes to entity events to track kills, damage, etc.
 */
export class BattleStats {
  private stats: BattleStatistics;
  private subscribedUnits: Set<string> = new Set();
  private world: BattleWorld | null = null;

  // Event listeners (bound for proper unsubscription)
  private onDamagedListener: EntityEventListener;
  private onKilledListener: EntityEventListener;
  private onSpawnedListener: EntityEventListener;

  constructor() {
    this.stats = {
      player: createEmptyTeamStats(),
      enemy: createEmptyTeamStats(),
      battleDuration: 0,
      totalKills: 0,
    };

    // Bind listeners
    this.onDamagedListener = this.handleDamaged.bind(this);
    this.onKilledListener = this.handleKilled.bind(this);
    this.onSpawnedListener = this.handleSpawned.bind(this);
  }

  /**
   * Attach to a BattleWorld and start tracking.
   */
  attach(world: BattleWorld): void {
    this.world = world;

    // Subscribe to existing units
    for (const unit of world.getUnits()) {
      this.subscribeToUnit(unit);
    }
  }

  /**
   * Detach from the world and stop tracking.
   */
  detach(): void {
    if (!this.world) return;

    // Unsubscribe from all units
    for (const unit of this.world.getUnits()) {
      this.unsubscribeFromUnit(unit);
    }

    this.subscribedUnits.clear();
    this.world = null;
  }

  /**
   * Subscribe to a unit's events.
   * Call this when a new unit is spawned.
   */
  subscribeToUnit(unit: UnitEntity): void {
    if (this.subscribedUnits.has(unit.id)) return;

    unit.on('damaged', this.onDamagedListener);
    unit.on('killed', this.onKilledListener);
    unit.on('spawned', this.onSpawnedListener);

    this.subscribedUnits.add(unit.id);

    // Track spawn
    this.getTeamStats(unit.team).unitsSpawned++;
  }

  /**
   * Unsubscribe from a unit's events.
   */
  unsubscribeFromUnit(unit: UnitEntity): void {
    if (!this.subscribedUnits.has(unit.id)) return;

    unit.off('damaged', this.onDamagedListener);
    unit.off('killed', this.onKilledListener);
    unit.off('spawned', this.onSpawnedListener);

    this.subscribedUnits.delete(unit.id);
  }

  /**
   * Get current statistics.
   */
  getStats(): Readonly<BattleStatistics> {
    return this.stats;
  }

  /**
   * Reset all statistics.
   */
  reset(): void {
    this.stats = {
      player: createEmptyTeamStats(),
      enemy: createEmptyTeamStats(),
      battleDuration: 0,
      totalKills: 0,
    };
    this.subscribedUnits.clear();
  }

  /**
   * Update battle duration (call from game loop).
   */
  updateDuration(delta: number): void {
    this.stats.battleDuration += delta;
  }

  // === Event Handlers ===

  private handleDamaged(event: EntityEvent): void {
    const damaged = event.source as UnitEntity;
    const amount = (event.data?.amount as number) ?? 0;

    // Track damage taken by the damaged unit's team
    this.getTeamStats(damaged.team).damageTaken += amount;

    // Track damage dealt by the attacker's team (if known)
    if (event.target) {
      const attacker = event.target as UnitEntity;
      this.getTeamStats(attacker.team).damageDealt += amount;
    }
  }

  private handleKilled(event: EntityEvent): void {
    const killed = event.source as UnitEntity;

    // Track death for the killed unit's team
    this.getTeamStats(killed.team).deaths++;
    this.stats.totalKills++;

    // Track kill for the killer's team (if known)
    if (event.target) {
      const killer = event.target as UnitEntity;
      this.getTeamStats(killer.team).kills++;
    }

    // Unsubscribe from the dead unit
    this.unsubscribeFromUnit(killed);
  }

  private handleSpawned(_event: EntityEvent): void {
    // Spawn is tracked in subscribeToUnit
  }

  private getTeamStats(team: UnitTeam): TeamStats {
    return team === 'player' ? this.stats.player : this.stats.enemy;
  }
}

/**
 * Create a BattleStats instance attached to a world.
 */
export function createBattleStats(world: BattleWorld): BattleStats {
  const stats = new BattleStats();
  stats.attach(world);
  return stats;
}
