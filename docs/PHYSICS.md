# Physics Engine Architecture

## Overview

The physics engine provides a portable abstraction for 2D physics simulation. It handles squad movement, collision detection, and range queries for the auto-battler combat system.

**Design Principle**: Interface-based abstraction allows swapping implementations (matter.js → Godot physics) without changing game logic.

**Web Implementation**: Uses [matter.js](https://brm.io/matter-js/) as the backing physics engine.

---

## File Structure

```
/src/core/physics/
├── Vector2.ts              # 2D vector math
├── types.ts                # Body interfaces and types
├── IPhysicsEngine.ts       # Main engine interface
├── MatterPhysicsEngine.ts  # matter.js-backed implementation
└── index.ts                # Exports
```

---

## Core Types

### Vector2

Pure 2D vector math class with no dependencies.

```typescript
const pos = new Vector2(100, 50);
const target = new Vector2(200, 50);

pos.distanceTo(target);        // 100
pos.subtract(target).normalize(); // direction vector
pos.lerp(target, 0.5);         // midpoint
```

### Team

```typescript
type Team = 'player' | 'enemy';
```

### IPhysicsBody

Represents a physics entity (squad) in the simulation.

```typescript
interface IPhysicsBody {
  readonly id: string;
  position: Vector2;
  velocity: Vector2;
  readonly radius: number;
  readonly team: Team;
  readonly speed: number;
  readonly mass: number;
  active: boolean;
}
```

### BodyConfig

Configuration for creating a new body.

```typescript
interface BodyConfig {
  id: string;
  position: Vector2;
  radius: number;
  team: Team;
  speed: number;
  mass?: number;  // defaults to 1
}
```

---

## IPhysicsEngine Interface

The main interface that game logic depends on. Implementations can be swapped without changing game code.

### Body Management

```typescript
// Create a squad body
const body = engine.createBody({
  id: 'warrior-1',
  position: new Vector2(100, 300),
  radius: 20,
  team: 'player',
  speed: 50
});

// Remove when defeated
engine.removeBody('warrior-1');

// Query bodies
engine.getBody('warrior-1');
engine.getAllBodies();
engine.getBodiesByTeam('enemy');
```

### Simulation

```typescript
// Step physics forward (call each frame)
engine.step(deltaSeconds);
```

### Movement

```typescript
// Command a body to move toward a position
engine.moveToward(body, targetPosition);

// Stop movement
engine.stopMovement(body);
```

### Range Queries

```typescript
// Find all bodies within attack range
const inRange = engine.getBodiesInRange(
  body.position,
  attackRange,
  body.id  // exclude self
);

// Find nearest enemy
const target = engine.getNearestBody(
  body.position,
  'enemy',  // filter by team
  body.id   // exclude self
);
```

### Collision Detection

```typescript
// Register collision callback
engine.onCollision((event) => {
  console.log(`${event.bodyA.id} hit ${event.bodyB.id}`);
  console.log(`Overlap: ${event.overlap}`);
});
```

---

## MatterPhysicsEngine Implementation

The web implementation wraps [matter.js](https://brm.io/matter-js/) with our interface:

- **Backing engine**: matter.js handles all physics simulation
- **Circle bodies**: Squads are represented as `Matter.Bodies.circle()`
- **Zero gravity**: Engine configured with `gravity: { x: 0, y: 0 }`
- **Target-based movement**: Bodies move toward targets by setting velocity each frame

### Behavior Details

**Movement**: Bodies move toward their target at constant speed. Velocity is recalculated each frame based on direction to target. Movement stops when within 5 units of target.

**Collision Response**: matter.js handles collision detection and resolution. Collision events are forwarded to registered callbacks.

**Physics Properties**:
- `frictionAir: 0.1` - Dampens movement when no target
- `friction: 0.05` - Surface friction on contact
- `restitution: 0.2` - Slight bounce on collision

---

## Integration with Combat

Typical usage in a combat system:

```typescript
const physics = new MatterPhysicsEngine();

// Create squads
for (const squad of playerSquads) {
  physics.createBody({
    id: squad.id,
    position: squad.spawnPosition,
    radius: 20,
    team: 'player',
    speed: squad.unitType.speed
  });
}

// Game loop
function tick(delta: number) {
  // AI: move toward nearest enemy
  for (const body of physics.getBodiesByTeam('player')) {
    const target = physics.getNearestBody(body.position, 'enemy', body.id);
    if (target) {
      physics.moveToward(body, target.position);
    }
  }

  // Step physics
  physics.step(delta);

  // Combat: check attack ranges
  for (const body of physics.getAllBodies()) {
    const inRange = physics.getBodiesInRange(body.position, attackRange, body.id);
    // Apply damage to enemies in range...
  }
}
```

---

## Godot Migration Guide

The interface maps directly to Godot concepts:

| TypeScript | Godot Equivalent |
|------------|------------------|
| `IPhysicsBody` | `CharacterBody2D` or `Area2D` |
| `Vector2` | `Vector2` (built-in) |
| `createBody()` | `instantiate()` + `add_child()` |
| `removeBody()` | `queue_free()` |
| `step()` | `_physics_process()` (automatic) |
| `moveToward()` | `move_and_slide()` with velocity |
| `getBodiesInRange()` | `Area2D.get_overlapping_bodies()` |
| `onCollision()` | `body_entered` / `area_entered` signals |

### GDScript Implementation Sketch

```gdscript
class_name GodotPhysicsEngine
extends Node

var bodies: Dictionary = {}

func create_body(config: Dictionary) -> CharacterBody2D:
    var body = preload("res://squad_body.tscn").instantiate()
    body.name = config.id
    body.position = config.position
    body.team = config.team
    add_child(body)
    bodies[config.id] = body
    return body

func get_bodies_in_range(pos: Vector2, range: float, exclude: String) -> Array:
    var result = []
    for id in bodies:
        if id == exclude:
            continue
        var body = bodies[id]
        if body.position.distance_to(pos) <= range + body.radius:
            result.append(body)
    return result
```

---

## Performance Notes

- **matter.js optimization**: Handles collision detection efficiently with built-in spatial partitioning
- **Linear range queries**: Our `getBodiesInRange()` uses linear scan. Acceptable for <100 bodies.
- **No angular physics**: Bodies have position only, rotation is ignored. Sufficient for squad-based combat.
- **Headless mode**: matter.js runs without a renderer - we only use the physics simulation.
