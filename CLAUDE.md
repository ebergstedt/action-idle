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

## Key Files

### Battle System (Active)

**Core Modules (Godot-portable):**

| File | Purpose |
|------|---------|
| `src/core/battle/BattleEngine.ts` | Combat simulation - targeting, movement, attacks |
| `src/core/battle/SelectionManager.ts` | Pure selection state - select, toggle, selectAllOfType |
| `src/core/battle/DragController.ts` | Multi-unit drag with relative positioning, edge clamping |
| `src/core/battle/FormationManager.ts` | Formation templates and spawn positioning |
| `src/core/battle/InputAdapter.ts` | Platform-agnostic input - hit detection |
| `src/core/battle/types.ts` | Unit stats, visual definitions |
| `src/core/battle/units/` | Unit definitions, instances, registry, factory |
| `src/core/battle/modifiers/` | Stat modification system with stacking rules |
| `src/core/battle/abilities/` | Trigger-based abilities (on_kill, on_hit, etc.) |
| `src/core/battle/upgrades/` | Battle upgrades with cost scaling |
| `src/core/theme/colors.ts` | Centralized color palette (Medieval II factions) |
| `src/core/physics/Vector2.ts` | 2D math utilities for positioning |

**React Layer (Thin wrappers):**

| File | Purpose |
|------|---------|
| `src/hooks/useBattle.ts` | React bridge - calls core modules, manages state |
| `src/components/battle/BattleView.tsx` | Main battle UI - controls, unit info panel |
| `src/components/battle/BattleCanvas.tsx` | Canvas rendering - draws units, routes input to core |

### Economy System (Dormant)

| File | Purpose |
|------|---------|
| `src/core/engine/GameEngine.ts` | Idle engine - `tick(delta)`, `purchaseUpgrade(id)` |
| `src/core/engine/Formulas.ts` | Pure math: `calculateCost()`, `calculateProduction()` |
| `src/core/persistence/IPersistenceAdapter.ts` | Interface for save/load (swap for Godot) |
| `src/core/utils/BigNumber.ts` | break_infinity.js wrapper, `formatNumber()` |
| `src/hooks/useGameState.ts` | React hook that owns engine instance |
| `src/data/upgrades.json` | All upgrade stats (baseCost, costMultiplier, baseProduction) |

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
