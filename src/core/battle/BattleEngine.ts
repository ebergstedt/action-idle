import { Vector2 } from '../physics/Vector2';
import {
  BattleState,
  getScaledUnitSize,
  Projectile,
  TEAM_COLORS,
  Unit,
  UNIT_STATS,
  UNIT_VISUALS,
  UnitTeam,
  UnitType,
} from './types';

const PROJECTILE_SPEED = 300; // pixels per second

export class BattleEngine {
  private state: BattleState;
  private nextUnitId = 1;
  private nextProjectileId = 1;

  constructor() {
    this.state = {
      units: [],
      projectiles: [],
      isRunning: false,
      hasStarted: false,
      waveNumber: 1,
    };
  }

  getState(): BattleState {
    return this.state;
  }

  start(): void {
    this.state.isRunning = true;
    this.state.hasStarted = true;
  }

  stop(): void {
    this.state.isRunning = false;
  }

  clear(): void {
    this.state.units = [];
    this.state.projectiles = [];
    this.state.hasStarted = false;
    this.nextUnitId = 1;
    this.nextProjectileId = 1;
  }

  spawnUnit(type: UnitType, team: UnitTeam, position: Vector2, arenaHeight: number = 600): Unit {
    const stats = { ...UNIT_STATS[type] };
    const visuals = UNIT_VISUALS[type];
    const color = TEAM_COLORS[team][type];
    const size = getScaledUnitSize(visuals.baseSize, arenaHeight);

    const unit: Unit = {
      id: `unit_${this.nextUnitId++}`,
      type,
      team,
      position: position.clone(),
      health: stats.maxHealth,
      stats,
      target: null,
      attackCooldown: 0,
      color,
      shape: visuals.shape,
      size,
    };

    this.state.units.push(unit);
    return unit;
  }

  tick(delta: number): void {
    if (!this.state.isRunning) return;

    // Update all units
    for (const unit of this.state.units) {
      if (unit.health <= 0) continue;

      // Find target if none
      if (!unit.target || unit.target.health <= 0) {
        unit.target = this.findNearestEnemy(unit);
      }

      if (unit.target) {
        const distanceToTarget = unit.position.distanceTo(unit.target.position);
        const inRange = distanceToTarget <= unit.stats.range;

        if (inRange) {
          // Attack if cooldown ready
          if (unit.attackCooldown <= 0) {
            this.performAttack(unit, unit.target);
            unit.attackCooldown = 1 / unit.stats.attackSpeed;
          }
        } else {
          // Move toward target
          this.moveToward(unit, unit.target.position, delta);
        }
      }

      // Update cooldown
      if (unit.attackCooldown > 0) {
        unit.attackCooldown -= delta;
      }
    }

    // Update projectiles
    this.updateProjectiles(delta);

    // Remove dead units
    this.state.units = this.state.units.filter((u) => u.health > 0);
  }

  private findNearestEnemy(unit: Unit): Unit | null {
    const enemies = this.state.units.filter((u) => u.team !== unit.team && u.health > 0);

    if (enemies.length === 0) return null;

    let nearest: Unit | null = null;
    let nearestDist = Infinity;

    for (const enemy of enemies) {
      const dist = unit.position.distanceSquaredTo(enemy.position);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = enemy;
      }
    }

    return nearest;
  }

  private moveToward(unit: Unit, target: Vector2, delta: number): void {
    const direction = target.subtract(unit.position).normalize();
    const movement = direction.multiply(unit.stats.moveSpeed * delta);
    unit.position = unit.position.add(movement);
  }

  private performAttack(attacker: Unit, target: Unit): void {
    if (attacker.stats.attackType === 'melee') {
      // Direct damage
      target.health -= attacker.stats.damage;
    } else {
      // Spawn projectile
      this.spawnProjectile(attacker, target);
    }
  }

  private spawnProjectile(attacker: Unit, target: Unit): void {
    const projectile: Projectile = {
      id: `proj_${this.nextProjectileId++}`,
      position: attacker.position.clone(),
      target: target.position.clone(),
      speed: PROJECTILE_SPEED,
      damage: attacker.stats.damage,
      sourceTeam: attacker.team,
      color: attacker.team === 'player' ? '#90EE90' : '#FF6B6B',
    };

    this.state.projectiles.push(projectile);
  }

  private updateProjectiles(delta: number): void {
    const toRemove: string[] = [];

    for (const proj of this.state.projectiles) {
      const direction = proj.target.subtract(proj.position).normalize();
      const movement = direction.multiply(proj.speed * delta);
      proj.position = proj.position.add(movement);

      // Check if reached target
      const distToTarget = proj.position.distanceTo(proj.target);
      if (distToTarget < 10) {
        // Deal damage to units at target location
        const hitUnits = this.state.units.filter(
          (u) =>
            u.team !== proj.sourceTeam &&
            u.health > 0 &&
            u.position.distanceTo(proj.target) < u.size + 10
        );

        for (const unit of hitUnits) {
          unit.health -= proj.damage;
        }

        toRemove.push(proj.id);
      }
    }

    this.state.projectiles = this.state.projectiles.filter((p) => !toRemove.includes(p.id));
  }

  getPlayerUnits(): Unit[] {
    return this.state.units.filter((u) => u.team === 'player');
  }

  getEnemyUnits(): Unit[] {
    return this.state.units.filter((u) => u.team === 'enemy');
  }

  getUnit(id: string): Unit | undefined {
    return this.state.units.find((u) => u.id === id);
  }

  moveUnit(id: string, position: Vector2): void {
    // Only allow movement before battle has started
    if (this.state.hasStarted) return;

    const unit = this.state.units.find((u) => u.id === id);
    if (unit && unit.team === 'player') {
      unit.position = position.clone();
    }
  }
}
