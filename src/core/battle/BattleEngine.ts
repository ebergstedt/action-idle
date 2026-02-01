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
const UNIT_SPACING = 1.2; // Multiplier for minimum distance between units (1.0 = touching)
const SEPARATION_FORCE = 150; // How strongly units push apart
const ALLY_AVOIDANCE_FORCE = 80; // How strongly units avoid allies when moving

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

  // Resolve overlapping units immediately (call after spawning all units)
  resolveOverlaps(
    iterations: number = 20,
    bounds?: { arenaWidth: number; arenaHeight: number; zoneHeightPercent: number }
  ): void {
    for (let iter = 0; iter < iterations; iter++) {
      let hasOverlap = false;

      for (let i = 0; i < this.state.units.length; i++) {
        const unitA = this.state.units[i];

        for (let j = i + 1; j < this.state.units.length; j++) {
          const unitB = this.state.units[j];

          const diff = unitA.position.subtract(unitB.position);
          const dist = diff.magnitude();
          const minDist = (unitA.size + unitB.size) * UNIT_SPACING;

          if (dist < minDist) {
            hasOverlap = true;
            const overlap = minDist - dist;
            // Push apart - use a normalized direction, handle zero distance
            const pushDir =
              dist > 0.1
                ? diff.normalize()
                : new Vector2(Math.random() - 0.5, Math.random() - 0.5).normalize();
            const pushAmount = overlap * 0.5 + 1; // Push a bit extra

            unitA.position = unitA.position.add(pushDir.multiply(pushAmount));
            unitB.position = unitB.position.subtract(pushDir.multiply(pushAmount));
          }
        }
      }

      // Clamp units to their zones if bounds provided
      if (bounds) {
        this.clampUnitsToZones(bounds.arenaWidth, bounds.arenaHeight, bounds.zoneHeightPercent);
      }

      if (!hasOverlap) break;
    }
  }

  // Ensure units stay within their designated zones
  clampUnitsToZones(arenaWidth: number, arenaHeight: number, zoneHeightPercent: number): void {
    const zoneHeight = arenaHeight * zoneHeightPercent;
    const margin = 20;

    for (const unit of this.state.units) {
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

  tick(delta: number): void {
    if (!this.state.isRunning) return;

    // Phase 1: Target acquisition and combat decisions
    for (const unit of this.state.units) {
      if (unit.health <= 0) continue;

      // Find target if none or target is dead
      if (!unit.target || unit.target.health <= 0) {
        unit.target = this.findBestTarget(unit);
      }

      // Check if in range to attack
      if (unit.target) {
        const distanceToTarget = unit.position.distanceTo(unit.target.position);
        const effectiveRange = unit.stats.range + unit.size + unit.target.size;
        const inRange = distanceToTarget <= effectiveRange;

        if (inRange) {
          // Attack if cooldown ready
          if (unit.attackCooldown <= 0) {
            this.performAttack(unit, unit.target);
            unit.attackCooldown = 1 / unit.stats.attackSpeed;
          }
        }
      }

      // Update cooldown
      if (unit.attackCooldown > 0) {
        unit.attackCooldown -= delta;
      }
    }

    // Phase 2: Movement with formation logic
    for (const unit of this.state.units) {
      if (unit.health <= 0) continue;

      if (unit.target) {
        const distanceToTarget = unit.position.distanceTo(unit.target.position);
        const effectiveRange = unit.stats.range + unit.size + unit.target.size;

        if (distanceToTarget > effectiveRange) {
          // Need to move closer - but respect formations
          this.moveWithFormation(unit, unit.target.position, delta);
        }
      }
    }

    // Phase 3: Separation - prevent overlapping
    this.applySeparation(delta);

    // Update projectiles
    this.updateProjectiles(delta);

    // Remove dead units
    this.state.units = this.state.units.filter((u) => u.health > 0);
  }

  private findBestTarget(unit: Unit): Unit | null {
    const enemies = this.state.units.filter((u) => u.team !== unit.team && u.health > 0);

    if (enemies.length === 0) return null;

    // For ranged units, prefer targets not blocked by other enemies
    // For melee units, prefer nearest
    let best: Unit | null = null;
    let bestScore = -Infinity;

    for (const enemy of enemies) {
      const dist = unit.position.distanceTo(enemy.position);

      // Score: closer is better, but also consider if path is clear
      let score = -dist;

      // Bonus for enemies already engaged (focus fire)
      const alliesTargeting = this.state.units.filter(
        (u) => u.team === unit.team && u.target === enemy && u.id !== unit.id
      ).length;
      if (alliesTargeting > 0 && alliesTargeting < 3) {
        score += 50; // Encourage focus fire but not too much stacking
      }

      // For ranged units, prefer targets they have line of sight to
      if (unit.stats.attackType === 'ranged') {
        const blocked = this.isPathBlocked(unit.position, enemy.position, unit);
        if (blocked) {
          score -= 100;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        best = enemy;
      }
    }

    return best;
  }

  private isPathBlocked(from: Vector2, to: Vector2, excludeUnit: Unit): boolean {
    // Check if any ally is blocking the path
    const allies = this.state.units.filter(
      (u) => u.team === excludeUnit.team && u.id !== excludeUnit.id && u.health > 0
    );

    for (const ally of allies) {
      const dist = this.pointToLineDistance(ally.position, from, to);
      if (dist < ally.size * 1.5) {
        // Check if ally is between us and target
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

  private moveWithFormation(unit: Unit, targetPos: Vector2, delta: number): void {
    // Calculate base direction to target
    const toTarget = targetPos.subtract(unit.position);
    const distToTarget = toTarget.magnitude();
    if (distToTarget < 1) return;

    let moveDirection = toTarget.normalize();

    // Apply ally avoidance - steer around allies
    const allies = this.state.units.filter(
      (u) => u.team === unit.team && u.id !== unit.id && u.health > 0
    );

    let avoidance = Vector2.zero();
    for (const ally of allies) {
      const toAlly = unit.position.subtract(ally.position);
      const dist = toAlly.magnitude();
      const minDist = (unit.size + ally.size) * UNIT_SPACING;

      if (dist < minDist * 2 && dist > 0) {
        // Check if ally is in front of us (in the direction we're moving)
        const dot = moveDirection.dot(toAlly.normalize().multiply(-1));
        if (dot > 0.3) {
          // Ally is somewhat in our way - steer around
          // Choose left or right based on which is clearer
          const perpendicular = new Vector2(-moveDirection.y, moveDirection.x);
          const leftClear = this.isDirectionClear(unit, perpendicular, allies);
          const rightClear = this.isDirectionClear(unit, perpendicular.multiply(-1), allies);

          if (leftClear && !rightClear) {
            avoidance = avoidance.add(perpendicular.multiply(ALLY_AVOIDANCE_FORCE / dist));
          } else if (rightClear && !leftClear) {
            avoidance = avoidance.add(perpendicular.multiply(-ALLY_AVOIDANCE_FORCE / dist));
          } else {
            // Both or neither clear - use position relative to ally
            const cross = moveDirection.x * toAlly.y - moveDirection.y * toAlly.x;
            avoidance = avoidance.add(
              perpendicular.multiply(((cross > 0 ? 1 : -1) * ALLY_AVOIDANCE_FORCE) / dist)
            );
          }
        }
      }
    }

    // Combine movement direction with avoidance
    moveDirection = moveDirection.multiply(unit.stats.moveSpeed).add(avoidance);
    const speed = moveDirection.magnitude();
    if (speed > unit.stats.moveSpeed) {
      moveDirection = moveDirection.normalize().multiply(unit.stats.moveSpeed);
    }

    const movement = moveDirection.multiply(delta);
    unit.position = unit.position.add(movement);
  }

  private isDirectionClear(unit: Unit, direction: Vector2, allies: Unit[]): boolean {
    const checkDist = unit.size * 3;
    const checkPos = unit.position.add(direction.normalize().multiply(checkDist));

    for (const ally of allies) {
      if (checkPos.distanceTo(ally.position) < (unit.size + ally.size) * UNIT_SPACING) {
        return false;
      }
    }
    return true;
  }

  private applySeparation(delta: number): void {
    // Push overlapping units apart
    for (let i = 0; i < this.state.units.length; i++) {
      const unitA = this.state.units[i];
      if (unitA.health <= 0) continue;

      for (let j = i + 1; j < this.state.units.length; j++) {
        const unitB = this.state.units[j];
        if (unitB.health <= 0) continue;

        const diff = unitA.position.subtract(unitB.position);
        const dist = diff.magnitude();
        const minDist = (unitA.size + unitB.size) * UNIT_SPACING;

        if (dist < minDist && dist > 0) {
          // Units are overlapping - push apart
          const overlap = minDist - dist;
          const pushDir = diff.normalize();
          const pushAmount = overlap * SEPARATION_FORCE * delta;

          // Push both units, but less if they're enemies (let them clash)
          const pushMultiplier = unitA.team === unitB.team ? 0.5 : 0.3;

          unitA.position = unitA.position.add(pushDir.multiply(pushAmount * pushMultiplier));
          unitB.position = unitB.position.subtract(pushDir.multiply(pushAmount * pushMultiplier));
        }
      }
    }
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
            u.position.distanceTo(proj.target) < u.size + 15
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
      // Check if new position would overlap with allies
      const newPos = this.findNonOverlappingPosition(unit, position);
      unit.position = newPos;
    }
  }

  private findNonOverlappingPosition(unit: Unit, desiredPos: Vector2): Vector2 {
    const allies = this.state.units.filter(
      (u) => u.team === unit.team && u.id !== unit.id && u.health > 0
    );

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
