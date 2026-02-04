/**
 * Battle Statistics Tracker
 *
 * Subscribes to entity events to track battle statistics.
 * Uses world events for automatic subscription to new units.
 * Demonstrates the event system and provides useful game data.
 *
 * Godot equivalent: Autoload or node that connects to unit signals.
 */

import {
  AttackedEvent,
  DamagedEvent,
  KilledEvent,
  EntityAddedEvent,
  EntityRemovedEvent,
  EventListener,
} from './IEntity';
import { BattleWorld } from './entities/BattleWorld';
import { UnitEntity } from './entities/UnitEntity';
import { getTeamValue, TeamDataMap } from './TeamUtils';
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
  /** Total number of attacks performed (melee + ranged) */
  attacksPerformed: number;
  /** Number of melee attacks performed */
  meleeAttacks: number;
  /** Number of ranged attacks performed */
  rangedAttacks: number;
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
    attacksPerformed: 0,
    meleeAttacks: 0,
    rangedAttacks: 0,
  };
}

/**
 * Type guard to check if an entity is a UnitEntity.
 * Uses the kind discriminant instead of instanceof for DIP compliance.
 */
function isUnitEntity(entity: unknown): entity is UnitEntity {
  return (
    typeof entity === 'object' &&
    entity !== null &&
    'kind' in entity &&
    (entity as { kind: string }).kind === 'unit'
  );
}

/**
 * Battle statistics tracker.
 * Subscribes to entity events to track kills, damage, etc.
 * Auto-subscribes to new units via world events.
 */
export class BattleStats {
  private stats: BattleStatistics;
  private subscribedUnits: Set<string> = new Set();
  private world: BattleWorld | null = null;

  // Typed event listeners (bound for proper unsubscription)
  private onAttackedListener: EventListener<AttackedEvent>;
  private onDamagedListener: EventListener<DamagedEvent>;
  private onKilledListener: EventListener<KilledEvent>;

  // World event listeners
  private onEntityAddedListener: EventListener<EntityAddedEvent>;
  private onEntityRemovedListener: EventListener<EntityRemovedEvent>;

  constructor() {
    this.stats = {
      player: createEmptyTeamStats(),
      enemy: createEmptyTeamStats(),
      battleDuration: 0,
      totalKills: 0,
    };

    // Bind entity event listeners
    this.onAttackedListener = this.handleAttacked.bind(this);
    this.onDamagedListener = this.handleDamaged.bind(this);
    this.onKilledListener = this.handleKilled.bind(this);

    // Bind world event listeners
    this.onEntityAddedListener = this.handleEntityAdded.bind(this);
    this.onEntityRemovedListener = this.handleEntityRemoved.bind(this);
  }

  /**
   * Attach to a BattleWorld and start tracking.
   * Subscribes to world events for automatic unit subscription.
   */
  attach(world: BattleWorld): void {
    this.world = world;

    // Subscribe to world events for auto-subscription
    world.onWorld('entity_added', this.onEntityAddedListener);
    world.onWorld('entity_removed', this.onEntityRemovedListener);

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

    // Unsubscribe from world events
    this.world.offWorld('entity_added', this.onEntityAddedListener);
    this.world.offWorld('entity_removed', this.onEntityRemovedListener);

    // Unsubscribe from all units
    for (const unit of this.world.getUnits()) {
      this.unsubscribeFromUnit(unit);
    }

    this.subscribedUnits.clear();
    this.world = null;
  }

  /**
   * Subscribe to a unit's events.
   */
  private subscribeToUnit(unit: UnitEntity): void {
    if (this.subscribedUnits.has(unit.id)) return;

    unit.on('attacked', this.onAttackedListener);
    unit.on('damaged', this.onDamagedListener);
    unit.on('killed', this.onKilledListener);

    this.subscribedUnits.add(unit.id);

    // Track spawn
    this.getTeamStats(unit.team).unitsSpawned++;
  }

  /**
   * Unsubscribe from a unit's events.
   */
  private unsubscribeFromUnit(unit: UnitEntity): void {
    if (!this.subscribedUnits.has(unit.id)) return;

    unit.off('attacked', this.onAttackedListener);
    unit.off('damaged', this.onDamagedListener);
    unit.off('killed', this.onKilledListener);

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

  // === World Event Handlers ===

  private handleEntityAdded(event: EntityAddedEvent): void {
    // Only subscribe to units, not projectiles
    if (isUnitEntity(event.entity)) {
      this.subscribeToUnit(event.entity);
    }
  }

  private handleEntityRemoved(event: EntityRemovedEvent): void {
    // Cleanup subscription when entity is removed
    if (isUnitEntity(event.entity)) {
      this.unsubscribeFromUnit(event.entity);
    }
  }

  // === Entity Event Handlers ===

  private handleAttacked(event: AttackedEvent): void {
    const attacker = event.entity as UnitEntity;
    const teamStats = this.getTeamStats(attacker.team);

    // Track total attacks
    teamStats.attacksPerformed++;

    // Track attack type
    if (event.attackMode === 'melee') {
      teamStats.meleeAttacks++;
    } else {
      teamStats.rangedAttacks++;
    }
  }

  private handleDamaged(event: DamagedEvent): void {
    const damaged = event.entity as UnitEntity;

    // Track damage taken by the damaged unit's team
    this.getTeamStats(damaged.team).damageTaken += event.amount;

    // Track damage dealt by the attacker's team (if known)
    if (event.attacker && isUnitEntity(event.attacker)) {
      this.getTeamStats(event.attacker.team).damageDealt += event.amount;
    }
  }

  private handleKilled(event: KilledEvent): void {
    const killed = event.entity as UnitEntity;

    // Track death for the killed unit's team
    this.getTeamStats(killed.team).deaths++;
    this.stats.totalKills++;

    // Track kill for the killer's team (if known)
    if (event.killer && isUnitEntity(event.killer)) {
      this.getTeamStats(event.killer.team).kills++;
    }

    // Unsubscribe from the dead unit
    this.unsubscribeFromUnit(killed);
  }

  private getTeamStats(team: UnitTeam): TeamStats {
    const teamMap: TeamDataMap<TeamStats> = {
      player: this.stats.player,
      enemy: this.stats.enemy,
    };
    return getTeamValue(teamMap, team);
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
