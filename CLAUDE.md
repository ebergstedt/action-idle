# Total Idle - Project Context

## Primary Constraint

All non-presentation code must be easily portable to Godot. Everything in `/src/core/` uses interfaces and pure TypeScript with zero React/browser dependencies.

**ESLint enforces this**: The `eslint.config.js` has a rule blocking React imports in `/src/core/`. Violations will fail linting.

## Development Status

The game has two major systems being developed in phases:

| System | Status | Description |
|--------|--------|-------------|
| **Battle System** | 🟢 Active | Auto-battler with formations, targeting AI, combat |
| **Economy System** | 🟡 Dormant | Idle progression, upgrades, currency (future integration) |

Current focus: **Battle System** - unit spawning, formations, combat mechanics.

## Architecture

### Folder Structure

```
/src
├── core/                    # Pure TypeScript - portable to Godot
│   ├── battle/             # 🟢 BattleEngine, combat AI, unit types
│   ├── engine/             # 🟡 GameEngine, Formulas (idle economy)
│   ├── persistence/        # 🟡 IPersistenceAdapter, SaveManager
│   ├── physics/            # 🟡 IPhysicsEngine, Vector2 (future use)
│   ├── theme/              # 🟢 Centralized colors (faction, UI, arena)
│   ├── types/              # GameState, Upgrade interfaces
│   └── utils/              # BigNumber (break_infinity.js wrapper)
├── hooks/                   # React integration layer
│   ├── useBattle.ts        # 🟢 Battle engine bridge
│   ├── useGameLoop.ts      # requestAnimationFrame tick loop
│   └── useGameState.ts     # 🟡 Economy engine bridge
├── components/              # React + Tailwind UI
│   ├── battle/             # 🟢 BattleView, BattleCanvas
│   ├── ui/                 # 🟡 StatsDisplay, UpgradeShop
│   └── App.tsx
├── data/
│   └── upgrades.json       # 🟡 Upgrade definitions (JSON-driven content)
└── test/
    └── setup.ts            # Vitest setup (jest-dom matchers)
```

🟢 = Active development | 🟡 = Dormant (future use)

## Module Design Principles

All code in `/src/core/` must be clean, testable, and directly portable to Godot.

### 1. Single Responsibility

Each module handles ONE concern. Never create god-classes that mix multiple responsibilities:

```typescript
// ✅ Good - focused modules
SelectionManager.ts   // Only selection state
DragController.ts     // Only drag logic
FormationManager.ts   // Only spawn positioning

// ❌ Bad - god-class
BattleCanvas.ts       // Selection + dragging + rendering + input + spawning
```

### 2. Pure Functions Over Stateful Classes

Prefer pure functions that take state and return new state. This maps directly to Godot's functional patterns:

```typescript
// ✅ Good - pure function, easy to port
function selectUnit(state: SelectionState, unitId: string): SelectionState {
  return { selectedIds: [unitId] };
}

// ❌ Avoid - hidden state makes porting harder
class SelectionManager {
  private selectedIds: string[] = [];
  selectUnit(unitId: string) { this.selectedIds = [unitId]; }
}
```

### 3. Thin Presentation Layer

React components must be thin wrappers. All logic lives in `/src/core/`:

```typescript
// ✅ Component just bridges input to core
const handleMouseDown = (e: MouseEvent) => {
  const pos = getMousePos(e);                    // Platform-specific (React)
  const unit = findUnitAtPosition(pos, units);   // Core module (portable)
  onSelectUnit(selectUnit(state, unit?.id));     // Core module (portable)
};

// ❌ Logic embedded in component - not portable
const handleMouseDown = (e: MouseEvent) => {
  for (const unit of units) {
    if (Math.hypot(pos.x - unit.x, pos.y - unit.y) < unit.size) {
      setSelectedIds([unit.id]);  // React-specific, can't port
    }
  }
};
```

### 4. Platform-Agnostic Interfaces

Core modules accept simple types (Vector2, arrays), not platform-specific events:

```typescript
// Core module - works anywhere
function findUnitAtPosition(pos: Vector2, units: Unit[]): Unit | null

// React converts MouseEvent → Vector2
// Godot converts InputEventMouse → Vector2
```

### 5. Design for Godot Translation

Write core code imagining how it translates to GDScript:

| TypeScript | GDScript Equivalent |
|------------|---------------------|
| `function foo(state, input): NewState` | `static func foo(state, input) -> NewState` |
| `interface State { ... }` | `class_name State extends Resource` |
| `class Registry { static get() }` | `Autoload singleton` |
| `tick(delta: number)` | `_process(delta: float)` |
| `new Vector2(x, y)` | `Vector2(x, y)` |
| `callback: (event) => void` | `signal event_occurred` |

### 6. Data-Driven Content

Game content lives in JSON, loaded by registries:
- `/src/data/units/*.json` - Unit definitions
- `/src/data/abilities/*.json` - Ability definitions
- `/src/data/battle-upgrades/*.json` - Upgrade definitions

This maps to Godot's Resource system - JSON becomes `.tres` files.

### 7. Interface-First Design

For platform-specific features (persistence, physics, rendering), define interfaces in core and implement outside:

```
/src/core/
├── persistence/
│   ├── IPersistenceAdapter.ts    # Interface - what Godot must implement
│   └── SaveManager.ts            # Uses interface, not concrete class
├── physics/
│   └── IPhysicsEngine.ts         # Interface for physics operations
```

```typescript
// ✅ Good - interface defines contract
interface IPersistenceAdapter {
  save(key: string, data: string): Promise<void>;
  load(key: string): Promise<string | null>;
}

// ✅ Good - core depends on interface
class SaveManager {
  constructor(private adapter: IPersistenceAdapter) {}
}

// ❌ Bad - core depends on concrete implementation
class SaveManager {
  private adapter = new LocalStorageAdapter();  // Hardcoded!
}
```

**Index files export interfaces, not implementations:**

```typescript
// ✅ Good - /src/core/persistence/index.ts
export type { IPersistenceAdapter } from './IPersistenceAdapter';
export { SaveManager } from './SaveManager';

// ❌ Bad - exports platform-specific implementation
export { LocalStorageAdapter } from './LocalStorageAdapter';  // Don't!
```

Platform implementations live OUTSIDE core:
- `/src/adapters/LocalStorageAdapter.ts` - React/browser implementation
- Godot implements same interface with `FileAccess`

### 8. Dependency Injection

Never instantiate platform-specific classes inside core. Pass dependencies in:

```typescript
// ✅ Good - dependency injected (in React hook or Godot scene)
const adapter = new LocalStorageAdapter();  // Platform layer creates this
const saveManager = new SaveManager(adapter);  // Core receives interface

// ❌ Bad - hardcoded inside core module
class GameManager {
  private saveManager = new SaveManager(new LocalStorageAdapter());
}
```

This lets Godot swap implementations without touching core:

```gdscript
# Godot implementation
var adapter = GodotFileAdapter.new()
var save_manager = SaveManager.new(adapter)
```

### 9. Entity Architecture (Scene/Node Pattern)

**Current approach: Godot-style Scene/Node Pattern**

The battle system uses a Godot-compatible entity architecture:

- **Entities** (`UnitEntity`, `ProjectileEntity`) handle their own behavior
- **BattleWorld** manages entity lifecycle and queries (like Godot's SceneTree)
- **BattleEngine** orchestrates the battle, delegates to BattleWorld
- **Events** map directly to Godot signals

```typescript
// Entity handles its own behavior
class UnitEntity extends BaseEntity implements IEntity, IEventEmitter {
  update(delta: number): void {
    this.updateTargeting();
    this.updateCombat(delta);
    this.updateMovement(delta);
  }
}

// World manages entities (like Godot main scene)
class BattleWorld {
  update(delta: number): void {
    for (const entity of this.entities) {
      entity.update(delta);  // Each entity updates itself
    }
  }
}
```

**Godot mapping:**

| TypeScript | GDScript Equivalent |
|------------|---------------------|
| `IEntity.init()` | `_ready()` |
| `IEntity.update(delta)` | `_process(delta)` |
| `IEntity.destroy()` | `queue_free()` |
| `IEventEmitter.emit()` | `emit_signal()` |
| `IEventEmitter.on()` | `connect()` |
| `BattleWorld` | Main scene or autoload |

**Key classes:**

```
/src/core/battle/entities/
├── IEntity.ts           # Lifecycle interface
├── EventEmitter.ts      # Signal system implementation
├── BaseEntity.ts        # Abstract base with common functionality
├── UnitEntity.ts        # Unit with targeting, combat, movement
├── ProjectileEntity.ts  # Projectile with movement, hit detection
├── BattleWorld.ts       # Entity manager (SceneTree equivalent)
├── IBattleWorld.ts      # Query interface for entities
└── index.ts
```

**Using the Event System (Godot Signals):**

Entities emit events that map to Godot signals. Subscribe to react to game events:

```typescript
// Subscribe to entity events (like Godot's connect())
const unit = engine.getWorld().getUnitById('unit_1');
unit.on('damaged', (event) => {
  console.log(`${event.source.id} took ${event.data?.amount} damage`);
});
unit.on('killed', (event) => {
  console.log(`${event.source.id} was killed by ${event.target?.id}`);
});
unit.on('attacked', (event) => {
  // Play attack animation, spawn particles, etc.
});

// Unsubscribe (like Godot's disconnect())
unit.off('damaged', myHandler);
```

**Available events:**
- `spawned` - Entity added to world
- `destroyed` - Entity removed from world
- `damaged` - Unit took damage (data: amount, previousHealth, currentHealth)
- `killed` - Unit died (target = killer)
- `attacked` - Unit performed attack (data: damage, attackMode)
- `moved` - Unit moved (data: delta vector)

**Creating New Entity Types:**

To add a new entity (e.g., `TrapEntity`):

```typescript
// 1. Create entity class extending BaseEntity
export class TrapEntity extends BaseEntity {
  constructor(id: string, position: Vector2, public damage: number) {
    super(id, position);
  }

  update(delta: number): void {
    const world = this.world as IBattleWorld;
    if (!world) return;

    // Check for units stepping on trap
    for (const unit of world.getUnits()) {
      if (this.position.distanceTo(unit.position) < 20) {
        unit.takeDamage(this.damage);
        this.emit({ type: 'attacked', source: this, target: unit });
        this.markDestroyed();
        break;
      }
    }
  }
}

// 2. Add to BattleWorld (or create method in BattleWorld)
// 3. In Godot: becomes Trap.gd extending Area2D
```

**Migration Status: ✅ COMPLETE**

The battle system is fully Godot-ready:

| Layer | Status | Notes |
|-------|--------|-------|
| Core entities | ✅ Done | UnitEntity, ProjectileEntity, BattleWorld |
| Event system | ✅ Done | IEventEmitter with BattleStats consumer |
| Unit definitions | ✅ Done | JSON files in `/src/data/units/` |
| Unit registry | ✅ Done | BattleEngine uses UnitRegistry |
| Stats tracking | ✅ Done | BattleStats subscribes to entity events |
| React rendering | ✅ Done | Uses legacy adapter (intentional) |

**For new code:** Use `engine.getWorld()` to access entities directly.
**For Godot port:** Translate entity classes to GDScript scenes. Ignore legacy types in `types.ts` - they only exist for React rendering.

## Key Files

### Battle System (Active)

**Core Modules (Godot-portable):**

| File | Purpose |
|------|---------|
| `src/core/battle/BattleEngine.ts` | Battle orchestrator - delegates to BattleWorld |
| `src/core/battle/entities/` | **Entity system (Godot Scene/Node pattern)** |
| `src/core/battle/entities/BattleWorld.ts` | Entity manager - lifecycle, queries, separation |
| `src/core/battle/entities/UnitEntity.ts` | Unit entity - targeting, combat, movement AI |
| `src/core/battle/entities/ProjectileEntity.ts` | Projectile entity - movement, hit detection |
| `src/core/battle/entities/BaseEntity.ts` | Abstract base with lifecycle + events |
| `src/core/battle/IEntity.ts` | Entity lifecycle interface (init/update/destroy) |
| `src/core/battle/SelectionManager.ts` | Pure selection state - select, toggle, selectAllOfType |
| `src/core/battle/DragController.ts` | Multi-unit drag with relative positioning, edge clamping |
| `src/core/battle/FormationManager.ts` | Formation templates and spawn positioning |
| `src/core/battle/InputAdapter.ts` | Platform-agnostic input - hit detection |
| `src/core/battle/types.ts` | Legacy types for React rendering only |
| `src/core/battle/BattleStats.ts` | Battle statistics via entity events |
| `src/core/battle/units/` | Unit definitions, instances, registry, factory |
| `src/core/battle/modifiers/` | Stat modification system with stacking rules |
| `src/core/battle/abilities/` | Trigger-based abilities (on_kill, on_hit, etc.) |
| `src/core/battle/upgrades/` | Battle upgrades with cost scaling |
| `src/core/theme/colors.ts` | Centralized color palette (Medieval II factions) |
| `src/core/physics/Vector2.ts` | 2D math utilities for positioning |

**React Layer (Thin wrappers - uses legacy interface):**

| File | Purpose | Migration |
|------|---------|-----------|
| `src/hooks/useBattle.ts` | React bridge - manages state | Uses `BattleState` with `Unit[]` |
| `src/components/battle/BattleView.tsx` | Main battle UI | Uses legacy `Unit` type |
| `src/components/battle/BattleCanvas.tsx` | Canvas rendering | Uses legacy `Unit` type |

*Note: React layer intentionally uses legacy interface. Core entities are Godot-ready; React rendering doesn't need migration.*

### Economy System (Dormant)

**Core Modules (Godot-portable):**

| File | Purpose |
|------|---------|
| `src/core/engine/IGameEngine.ts` | Interface - what Godot must implement |
| `src/core/engine/GameEngine.ts` | Idle engine - `tick(delta)`, `purchaseUpgrade(id)` |
| `src/core/engine/UpgradeRegistry.ts` | Registry pattern for loading upgrade definitions |
| `src/core/engine/Formulas.ts` | Pure math: `calculateCost()`, `calculateProduction()` |
| `src/core/persistence/IPersistenceAdapter.ts` | Interface for save/load (swap for Godot) |
| `src/core/types/GameState.ts` | State interfaces (GameState, UpgradeState) |
| `src/core/types/Upgrade.ts` | Upgrade definition interface |
| `src/core/utils/BigNumber.ts` | break_infinity.js wrapper, `formatNumber()` |

**React Layer (Thin wrappers):**

| File | Purpose |
|------|---------|
| `src/hooks/useGameState.ts` | React bridge - owns engine, handles save/load |
| `src/data/upgrades.json` | Upgrade definitions (baseCost, costMultiplier, baseProduction) |

## Formulas

- **Upgrade Cost**: `Cost = BaseCost * CostMultiplier^Level`
- **Production**: `Production = BaseProduction * Level`
- **Currency Gain**: `Gained = TotalProduction * Delta`

## Commands

**⚠️ IMPORTANT: Always use Docker for development, never run npm commands directly.**

### Development (Docker - PREFERRED)

```bash
# Start dev server with hot reload on port 5177
docker compose -f docker-compose.dev.yml up

# Or run in background
docker compose -f docker-compose.dev.yml up -d
```

### npm scripts (run inside Docker container only)

```bash
npm run dev              # Start Vite dev server
npm run build            # TypeScript check + production build
npm run preview          # Preview production build
```

### Quality

```bash
npm run validate         # Full validation (typecheck + lint + test)
npm run typecheck        # TypeScript type checking only
npm run lint             # ESLint check
npm run lint:fix         # ESLint with auto-fix
npm run format           # Prettier format all files
npm run format:check     # Prettier check (CI mode)
```

### Testing

```bash
npm run test             # Vitest watch mode
npm run test:run         # Single test run
npm run test:coverage    # With coverage report
npm run test:core        # Only core tests (Godot-portable code)
```

### Docker

```bash
# Development (hot reload on port 5177)
docker compose -f docker-compose.dev.yml up

# Production (static build on port 3000)
docker compose up -d
docker compose down
docker compose build     # Rebuild after dependency changes
```

## Testing

Tests use **Vitest** with `jsdom` environment for React components.

- Test files: `*.test.ts` or `*.test.tsx` in `src/`
- Core tests (`src/core/**/*.test.ts`) are pure TypeScript with no React dependencies
- Use `npm run test:core` to validate Godot-portable code in isolation

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest';
import { Decimal } from '../utils/BigNumber';

describe('MyFunction', () => {
  it('does something', () => {
    expect(result.eq(expected)).toBe(true);  // Use .eq() for Decimal comparison
  });
});
```

## Coding Standards

1. **No React in `/src/core/`** - Never import React, hooks, or browser APIs (enforced by ESLint)
2. **Explicit Delta** - Always pass `delta` (seconds) to time-based functions
3. **Decimal Everywhere** - Use `Decimal` from break_infinity.js for all game numbers
4. **JSON-Driven Content** - Upgrade stats stay in JSON files, not code
5. **Interface-Based Persistence** - `SaveManager` depends on `IPersistenceAdapter`
6. **Minimum Font Size** - Never use `text-xs` in Tailwind. Minimum is `text-sm` for readability
7. **Use Theme Colors** - Never use hardcoded hex colors. Always reference `UI_COLORS` or other theme constants from `src/core/theme/colors.ts`
8. **No Gold/Yellow Text** - Never use gold or yellow colors (`UI_COLORS.goldPrimary`, `UI_COLORS.goldDark`, etc.) for text. They are hard to read on parchment backgrounds. Use `UI_COLORS.black` for text instead

## Linting & Formatting

- **ESLint**: Flat config in `eslint.config.js` with TypeScript and React rules
- **Prettier**: Config in `.prettierrc` (single quotes, semicolons, 100 char width)
- **Pre-commit hook**: Husky runs lint-staged on commit (auto-fixes and formats staged files)

## Big Numbers

Uses `break_infinity.js` for numbers up to 10^9e15. Key functions in `src/core/utils/BigNumber.ts`:

- `formatNumber(value: Decimal)` - Human-readable (1.5M, 2.3B, 1.2e15)
- `serializeDecimal()` / `deserializeDecimal()` - For save/load

## Color System

All colors are centralized in `src/core/theme/colors.ts` - a single source of truth that's Godot-portable.

### Color Palette

Based on **Medieval II: Total War** faction colors:

| Category | Usage |
|----------|-------|
| `FACTION_COLORS` | 20+ historical factions (England, France, Byzantium, etc.) |
| `TEAM_COLORS` | Player (England red/white) vs Enemy (France blue/yellow) |
| `UNIT_TYPE_COLORS` | Warrior, Archer, Knight colors per team |
| `ARENA_COLORS` | Canvas backgrounds, zones, health bars, selection |
| `DARK_THEME` | UI backgrounds, text, borders, accents |
| `UI_COLORS` | Parchment, ink, gold, semantic (success/warning/danger) |

### Usage

```typescript
// In React components (inline styles for critical colors)
import { DARK_THEME, UNIT_TYPE_COLORS } from '../core/theme/colors';
<span style={{ color: DARK_THEME.accentGold }}>Gold Text</span>

// In Canvas rendering
import { ARENA_COLORS } from '../core/theme/colors';
ctx.fillStyle = ARENA_COLORS.background;

// Utility functions
import { hexToRgba, getUnitColor } from '../core/theme/colors';
const transparentRed = hexToRgba('#C80000', 0.5);
const warriorColor = getUnitColor('player', 'warrior');
```

### Godot Migration

Convert hex strings to Godot colors:
```gdscript
# GDScript
var england_red = Color.html("#C80000")
var england_rgb = Color8(200, 0, 0)  # Same color via RGB

# Use the hexToRgb() function output for Color8()
```

## Godot Migration Path

1. Port `/src/core/` to GDScript/C# (syntactic translation)
2. Convert `colors.ts` to GDScript using `Color.html()` or `Color8()`
3. Implement `IPersistenceAdapter` using Godot's `ConfigFile`
4. Replace React components with Godot Control nodes
5. Use `_process(delta)` instead of `requestAnimationFrame`

Run `npm run test:core` to validate core code independently of React.

## Save System

- Autosaves every 30 seconds
- Offline earnings calculated on load (capped at 1 hour)
- Save key: `action_idle_save` in localStorage
- Version field in saves for future migrations

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push/PR to main:

1. Type checking
2. Linting
3. Format checking
4. Tests with coverage
5. Build verification

## Visual Debugging

Use Puppeteer to take screenshots and verify UI changes:

```bash
# Take a screenshot of the running app (saves to screenshots/ folder)
node scripts/screenshot.cjs http://localhost:5177 screenshots/my-screenshot.png
```

The script (`scripts/screenshot.cjs`):

- Disables cache to get fresh content
- Forces a page reload before capturing
- Waits for rendering to complete

Use screenshots to:

- Verify layout changes before telling the user
- Debug visual issues
- Confirm styling updates

The dev server runs on port **5177** (configured in `vite.config.ts` with `strictPort: true`).

## Battle System

Units can have both melee and ranged attacks. They automatically switch based on distance:

- **Ranged mode**: Used when target is far (if unit has ranged attack)
- **Melee mode**: Used when in close range (combat shuffle activates)

**Design**: Pure melee units can gain ranged attacks via upgrades/equipment later.

### Combat Flow

1. Units spawn in deployment zones (25% height each)
2. Player can drag allied units before battle starts
3. Battle starts → units acquire targets and move
4. Ranged units fire projectiles, switch to melee when enemies close
5. Melee units shuffle side-to-side while fighting
6. Dead units removed, battle continues until one side eliminated

## Battle Arena Coordinate System

The battle arena uses standard screen coordinates:
- **Y = 0** is at the **top** of the screen (enemy side)
- **Y increases downward** toward the bottom (allied side)

When positioning units:
- **Lower Y = closer to enemy** (front line)
- **Higher Y = further from enemy** (back line)

## Documentation

| Document | Description |
|----------|-------------|
| `docs/GAME_DESIGN.md` | Game design document - mechanics, balance, progression |
| `docs/PHYSICS.md` | Physics engine architecture and Godot migration guide |
