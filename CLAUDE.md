# Action Idle - Project Context

## Primary Constraint

All non-presentation code must be easily portable to Godot. Everything in `/src/core/` uses interfaces and pure TypeScript with zero React/browser dependencies.

**ESLint enforces this**: The `eslint.config.js` has a rule blocking React imports in `/src/core/`. Violations will fail linting.

## Architecture

### Folder Structure

```
/src
├── core/                    # Pure TypeScript - portable to Godot
│   ├── types/              # GameState, Upgrade interfaces
│   ├── engine/             # GameEngine class, Formulas (pure functions)
│   ├── persistence/        # IPersistenceAdapter, LocalStorageAdapter, SaveManager
│   ├── physics/            # IPhysicsEngine, Vector2, MatterPhysicsEngine
│   └── utils/              # BigNumber (break_infinity.js wrapper)
├── hooks/                   # React integration layer
│   ├── useGameLoop.ts      # requestAnimationFrame tick loop
│   └── useGameState.ts     # Bridges engine to React state
├── components/              # React + Tailwind UI
│   ├── ui/                 # StatsDisplay, UpgradeButton, UpgradeShop
│   └── App.tsx
├── data/
│   └── upgrades.json       # Upgrade definitions (JSON-driven content)
└── test/
    └── setup.ts            # Vitest setup (jest-dom matchers)
```

## Key Files

| File | Purpose |
|------|---------|
| `src/core/engine/GameEngine.ts` | Main engine - `tick(delta)`, `purchaseUpgrade(id)` |
| `src/core/engine/Formulas.ts` | Pure math: `calculateCost()`, `calculateProduction()` |
| `src/core/persistence/IPersistenceAdapter.ts` | Interface for save/load (swap for Godot) |
| `src/core/physics/IPhysicsEngine.ts` | Interface for physics (swap for Godot) |
| `src/core/physics/MatterPhysicsEngine.ts` | matter.js-backed physics implementation |
| `src/core/utils/BigNumber.ts` | break_infinity.js wrapper, `formatNumber()` |
| `src/hooks/useGameState.ts` | React hook that owns engine instance |
| `src/data/upgrades.json` | All upgrade stats (baseCost, costMultiplier, baseProduction) |

## Formulas

- **Upgrade Cost**: `Cost = BaseCost * CostMultiplier^Level`
- **Production**: `Production = BaseProduction * Level`
- **Currency Gain**: `Gained = TotalProduction * Delta`

## Commands

### Development

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
docker compose up -d     # Start dev server (port 3000)
docker compose down      # Stop container
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

## Linting & Formatting

- **ESLint**: Flat config in `eslint.config.js` with TypeScript and React rules
- **Prettier**: Config in `.prettierrc` (single quotes, semicolons, 100 char width)
- **Pre-commit hook**: Husky runs lint-staged on commit (auto-fixes and formats staged files)

## Big Numbers

Uses `break_infinity.js` for numbers up to 10^9e15. Key functions in `src/core/utils/BigNumber.ts`:

- `formatNumber(value: Decimal)` - Human-readable (1.5M, 2.3B, 1.2e15)
- `serializeDecimal()` / `deserializeDecimal()` - For save/load

## Godot Migration Path

1. Port `/src/core/` to GDScript/C# (syntactic translation)
2. Implement `IPersistenceAdapter` using Godot's `ConfigFile`
3. Replace React components with Godot Control nodes
4. Use `_process(delta)` instead of `requestAnimationFrame`

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

## Documentation

| Document | Description |
|----------|-------------|
| `docs/GAME_DESIGN.md` | Game design document - mechanics, balance, progression |
| `docs/PHYSICS.md` | Physics engine architecture and Godot migration guide |
