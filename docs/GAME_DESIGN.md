# Total Idle - Game Design Document

## Vision Statement

An idle game where you command an army in continuous battle against demon waves. The core tension: **farm safely for resources** or **push aggressively for progress** at the risk of death and setback.

---

## Core Game Loop

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   ┌─────────┐     ┌─────────┐     ┌─────────────┐      │
│   │  FIGHT  │────▶│  LOOT   │────▶│   UPGRADE   │      │
│   │  Waves  │     │ Rewards │     │    Army     │      │
│   └─────────┘     └─────────┘     └──────┬──────┘      │
│        ▲                                 │              │
│        │                                 │              │
│        └─────────────────────────────────┘              │
│                                                         │
│   DEATH: Cooldown → Respawn at last cleared wave        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Moment-to-Moment Gameplay**:
1. Your army automatically fights the current wave
2. Squads move toward enemies, attack when in range
3. Wave clears → earn gold → new wave spawns
4. Use gold to buy more squads or upgrade existing ones
5. Stronger army → push to higher waves → better rewards

**The Risk/Reward Decision**:
- **Farm Mode**: Stay at current wave, guaranteed clears, steady income
- **Push Mode**: Auto-advance to harder waves, risk death but faster progression

---

## Player Goals

### Short-Term (Minutes)
- Clear the next wave
- Afford the next squad purchase
- Survive a push attempt

### Medium-Term (Hours)
- Reach wave 50/100/200 milestones
- Unlock new unit types
- Build a balanced army composition

### Long-Term (Days/Weeks)
- Prestige for permanent bonuses (future feature)
- Complete achievements
- Optimize farming efficiency

---

## Army System

### Unit Types (4 Core Units)

| Unit | Role | Playstyle |
|------|------|-----------|
| **Warriors** | Tank | Slow, high HP, soaks damage at front |
| **Archers** | DPS | Ranged, squishy, stays back and deals damage |
| **Knights** | Bruiser | Balanced HP/damage, charges into melee |
| **Healers** | Support | Restores squad health over time (unlocks later) |

### Squad Composition Strategy
- Too many Warriors = slow clear times, safe but inefficient
- Too many Archers = fast clears but vulnerable to being overrun
- Balance matters as waves get harder

---

## Wave System

### Wave Structure
Each wave consists of enemy demon squads. As waves progress:
- More enemy squads spawn
- Enemy stats increase
- New enemy types appear (future)

### Difficulty Curve

**Early Game (Waves 1-20)**: Tutorial-paced, forgiving
- Player learns mechanics
- Deaths are unlikely unless pushing hard
- Quick clears, instant gratification

**Mid Game (Waves 21-100)**: Core loop established
- Meaningful upgrade decisions
- Death becomes real threat when pushing
- Farm vs push tension is felt

**Late Game (Waves 100+)**: Optimization phase
- Marginal gains matter
- Prestige becomes attractive
- Min-maxing army composition

---

## Numeric Balance Framework

### Currency: Gold

**Earning Rate by Wave**:
```
Gold per wave clear = BaseGold × (1 + Wave × 0.1)

Wave 1:   10 gold
Wave 10:  20 gold
Wave 50:  60 gold
Wave 100: 110 gold
```

### Squad Costs

**Purchase Cost** (first squad of type):
| Unit | Base Cost | Cost Scaling |
|------|-----------|--------------|
| Warrior | 50 | ×1.5 per owned |
| Archer | 75 | ×1.5 per owned |
| Knight | 200 | ×1.6 per owned |
| Healer | 500 | ×1.7 per owned |

**Upgrade Cost** (per level):
```
Upgrade Cost = BaseCost × 2^Level

Level 1→2: 100 gold
Level 2→3: 200 gold
Level 3→4: 400 gold
```

### Combat Stats

**Base Squad Stats** (Level 1):
| Unit | Health | Damage/sec | Range | Speed |
|------|--------|------------|-------|-------|
| Warrior | 100 | 10 | Melee | 50 |
| Archer | 40 | 20 | 200 | 75 |
| Knight | 80 | 15 | Melee | 60 |
| Healer | 30 | 0 | 150 | 50 |

**Level Scaling** (+20% per level):
```
Stat at Level N = BaseStat × 1.2^(N-1)

Level 1: 100 HP
Level 2: 120 HP
Level 3: 144 HP
Level 5: 207 HP
Level 10: 516 HP
```

### Enemy Scaling

**Per-Wave Scaling**:
```
Enemy Health = 50 × 1.08^Wave
Enemy Damage = 5 × 1.06^Wave
Enemy Count  = floor(1 + Wave/10)

Wave 1:   50 HP,  5 DPS,  1 enemy
Wave 10:  108 HP, 9 DPS,  2 enemies
Wave 50:  2,350 HP, 92 DPS, 6 enemies
Wave 100: 109,000 HP, 1,700 DPS, 11 enemies
```

### Balance Checkpoints

**Wave 10** (5 minutes in):
- Player should have: 2-3 Warriors, 1-2 Archers
- Clear time: ~10 seconds per wave
- Death risk: Low

**Wave 50** (1 hour in):
- Player should have: 5+ squads, some at level 3-4
- Clear time: ~20-30 seconds per wave
- Death risk: Medium when pushing

**Wave 100** (several hours in):
- Player should have: 10+ squads, levels 5-8
- Clear time: ~60 seconds per wave
- Death risk: High when pushing

---

## Farm vs Push Mechanic

### Farm Mode
- Repeats current wave indefinitely
- 100% of normal rewards
- No death risk
- Best for: AFK play, rebuilding after death

### Push Mode
- Auto-advances on wave clear
- 100% of normal rewards
- Death risk present
- Best for: Active play, progression

### Death Consequences
1. **Cooldown**: 30 seconds before respawn
2. **Regression**: Return to `highestCleared - 5` (minimum wave 1)
3. **No resource loss**: Keep all gold and upgrades

**Design Intent**: Death is a setback, not devastating. Encourages risk-taking.

---

## Idle Mechanics (Model A: Wave-Based Rewards)

The idle layer sits on top of the auto-battler. Battles generate rewards; rewards fuel upgrades; upgrades enable harder battles. The player can be active (watching, adjusting) or idle (AFK farming) and still progress.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        IDLE LAYER                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Offline    │  │   Prestige   │  │     Milestones       │  │
│  │  Simulation  │  │    System    │  │   & Achievements     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                      │              │
│         ▼                 ▼                      ▼              │
│  ┌────────────────────────────────────────────────────────────┐│
│  │                    ECONOMY ENGINE                          ││
│  │  Gold balance, upgrade costs, unlock gates, multipliers    ││
│  └────────────────────────────────────────────────────────────┘│
│                              ▲                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────┐
│                        BATTLE LAYER                             │
│                              │                                  │
│  ┌──────────────┐    ┌──────┴───────┐    ┌──────────────────┐  │
│  │ BattleEngine │───▶│ Wave Clear   │───▶│  Gold Reward     │  │
│  │   (combat)   │    │   Event      │    │  (lump sum)      │  │
│  └──────────────┘    └──────────────┘    └──────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Core Principle: Event-Driven Rewards

Unlike classic idle games (currency/second), rewards come from **discrete events**:

| Event | Reward | Frequency |
|-------|--------|-----------|
| Wave Clear | Gold (scaled by wave) | Every 10-60 seconds |
| Boss Kill | Gold + Gems + Loot chance | Every 10 waves |
| Milestone | One-time gold bonus | At wave 10, 25, 50, 100... |
| Death | Nothing (but no loss) | Variable |
| Offline Return | Simulated wave clears | Once per session |

---

## Currency System

### Primary Currency: Gold

**Source**: Wave clears (only)
**Sinks**: Squad purchases, upgrades
**Display**: Standard notation up to 999,999 → then 1.00M, 1.00B, etc.

```
Gold per wave = BASE_GOLD × (1 + wave × WAVE_SCALING)

Constants:
  BASE_GOLD = 10
  WAVE_SCALING = 0.1

Examples:
  Wave 1:   10 × (1 + 0.1) = 11 gold
  Wave 10:  10 × (1 + 1.0) = 20 gold
  Wave 50:  10 × (1 + 5.0) = 60 gold
  Wave 100: 10 × (1 + 10)  = 110 gold
  Wave 500: 10 × (1 + 50)  = 510 gold
```

### Secondary Currency: Gems (Future)

**Source**: Boss kills, milestones, prestige
**Sinks**: Premium unlocks, cosmetics, time skips
**Design Intent**: Rare currency for meaningful choices, not pay-to-win

```
Gems per boss = floor(bossWave / 10)

Boss at wave 10:  1 gem
Boss at wave 50:  5 gems
Boss at wave 100: 10 gems
```

### Tertiary Currency: Soul Shards (Prestige)

**Source**: Prestige reset only
**Sinks**: Permanent upgrades
**Formula**: See Prestige System section

---

## Offline Progression (Detailed)

When player returns after being away, simulate farming at their **farming wave** (not highest wave).

### Calculation

```
offlineWaves = min(offlineSeconds / avgClearTime, maxOfflineWaves)
offlineGold = offlineWaves × goldPerWave × OFFLINE_EFFICIENCY

Constants:
  OFFLINE_EFFICIENCY = 0.5      # Active play is 2x better
  maxOfflineWaves = 1440        # 24 hours at 1 wave/min
  avgClearTime = 60 seconds     # Assume 1 wave/minute for simplicity

Example: 8 hours offline, farming wave 50
  offlineSeconds = 8 × 3600 = 28,800
  offlineWaves = min(28800 / 60, 1440) = 480 waves
  goldPerWave = 60
  offlineGold = 480 × 60 × 0.5 = 14,400 gold
```

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| First launch ever | No offline rewards |
| < 1 minute offline | No rewards (prevent exploit) |
| Died before going offline | Simulate at respawn wave |
| Push mode when offline | Auto-switch to farm mode |
| Game was backgrounded | Same as offline (mobile) |

### Offline Return UI

```
┌─────────────────────────────────────────┐
│         Welcome Back, Commander!        │
│                                         │
│   You were away for 8h 23m              │
│                                         │
│   Your army defended wave 50            │
│   Waves cleared: 480                    │
│   Gold earned: 14,400                   │
│                                         │
│   [  Collect & Continue  ]              │
│                                         │
└─────────────────────────────────────────┘
```

### Offline Upgrades (Future)

Prestige upgrades can improve offline gains:
- **Efficient Farming**: +10% offline efficiency per level (cap: 80%)
- **Extended Patrol**: +2 hours max offline time per level (cap: 48h)
- **Offline Push**: Army attempts to push 1 wave per hour while offline

---

## Prestige System

Reset progress for permanent multipliers. Available after reaching wave 100.

### When to Prestige

The game calculates **potential Soul Shards** based on highest wave:

```
soulShards = floor((highestWave - 100) / 10) × (1 + prestigeCount × 0.1)

First prestige at wave 150:
  shards = floor((150 - 100) / 10) × 1.0 = 5 shards

Fifth prestige at wave 200:
  shards = floor((200 - 100) / 10) × 1.5 = 15 shards
```

**Design Intent**: Later prestiges are more rewarding. Encourages pushing further before reset.

### What Resets

| Resets | Keeps |
|--------|-------|
| Gold | Soul Shards |
| Wave progress | Prestige upgrades |
| Squad count | Achievements |
| Squad levels | Unlocked unit types |
| Current wave | Statistics |

### What Persists (Prestige Upgrades)

Permanent upgrades purchased with Soul Shards:

| Upgrade | Cost | Effect | Max Level |
|---------|------|--------|-----------|
| **Gold Rush** | 1 shard | +10% gold per wave | 10 |
| **Army Reserves** | 2 shards | Start with 1 free squad | 5 |
| **Veteran Training** | 3 shards | Squads start at level 2 | 3 |
| **Efficient Farming** | 2 shards | +10% offline efficiency | 3 |
| **Battle Hardened** | 5 shards | +5% all squad stats | 10 |
| **Quick Start** | 3 shards | Start at wave 10/20/30 | 3 |
| **Death Defiance** | 5 shards | 10% chance to survive lethal | 5 |
| **Boss Hunter** | 4 shards | +25% boss gold reward | 5 |

### Prestige UI

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESTIGE AVAILABLE                       │
│                                                             │
│   Highest Wave: 157                                         │
│   Soul Shards Earned: 5                                     │
│                                                             │
│   You will lose:                                            │
│     • 45,230 Gold                                           │
│     • 12 Squads                                             │
│     • Wave progress                                         │
│                                                             │
│   You will gain:                                            │
│     • 5 Soul Shards (total: 12)                             │
│     • Permanent power increase                              │
│                                                             │
│   ┌─────────────────┐    ┌─────────────────┐               │
│   │  Keep Playing   │    │    Prestige     │               │
│   └─────────────────┘    └─────────────────┘               │
│                                                             │
│   Tip: Reach wave 170 for 7 shards (+2 more)               │
└─────────────────────────────────────────────────────────────┘
```

### Optimal Prestige Timing

Players should prestige when time-to-next-shard exceeds time-to-regain-progress:

```
Rule of thumb: Prestige when stuck for 10+ minutes at highest wave
```

---

## Milestone System

One-time rewards for reaching wave thresholds. Provides pacing and goals.

### Wave Milestones

| Wave | Gold Reward | Unlock |
|------|-------------|--------|
| 10 | 100 | Tutorial complete |
| 25 | 500 | Knight unit |
| 50 | 2,000 | Healer unit |
| 75 | 5,000 | — |
| 100 | 10,000 | Prestige available |
| 150 | 25,000 | — |
| 200 | 50,000 | — |
| 250+ | wave × 200 | Every 50 waves |

### Achievements (Future)

Long-term goals with gem rewards:

| Achievement | Requirement | Reward |
|-------------|-------------|--------|
| First Blood | Clear wave 1 | 1 gem |
| Army Builder | Own 10 squads | 5 gems |
| Survivor | Die 10 times | 5 gems |
| Centurion | Reach wave 100 | 10 gems |
| Speed Demon | Clear wave 50 in under 30 min | 10 gems |
| Idle Master | Collect 100k offline gold | 15 gems |
| Prestige I-X | Prestige N times | N × 5 gems |

---

## Unlock System

Units and features gate behind wave progress.

### Unit Unlocks

| Unit | Unlock Condition | Design Reason |
|------|------------------|---------------|
| Warrior | Wave 1 (start) | Core tank |
| Archer | Wave 1 (start) | Core DPS |
| Knight | Wave 25 | Mid-game bruiser option |
| Healer | Wave 50 | Late-game sustain |
| (Future units) | Wave 100+ | Post-prestige variety |

### Feature Unlocks

| Feature | Unlock | Design Reason |
|---------|--------|---------------|
| Farm Mode | Wave 1 | Always available |
| Push Mode | Wave 5 | After tutorial |
| Squad Upgrades | Wave 10 | After first wall |
| Prestige | Wave 100 | End of first run |
| Gems | First boss (wave 10) | Rare currency intro |

---

## Retention Mechanics

### Daily Login (Future)

Consecutive login rewards reset if day missed:

| Day | Reward |
|-----|--------|
| 1 | 500 gold |
| 2 | 1,000 gold |
| 3 | 1 gem |
| 4 | 2,500 gold |
| 5 | 2 gems |
| 6 | 5,000 gold |
| 7 | 5 gems + bonus chest |

### Session Hooks

| Hook | Trigger | Purpose |
|------|---------|---------|
| Offline reward popup | On return | Re-engagement |
| "Almost there!" | 90% to next milestone | Push motivation |
| Prestige reminder | Stuck for 5 min | Suggest reset |
| Boss incoming | Wave 9, 19, 29... | Anticipation |

---

## Implementation Bridge: Battle → Economy

### Event Flow

```typescript
// BattleEngine emits events
battleEngine.on('wave_cleared', (event: WaveClearedEvent) => {
  const gold = calculateWaveGold(event.wave);
  economyEngine.addGold(gold);

  if (event.wave % 10 === 0) {
    const gems = calculateBossGems(event.wave);
    economyEngine.addGems(gems);
  }

  checkMilestones(event.wave);
});

battleEngine.on('death', (event: DeathEvent) => {
  // No gold loss, just respawn logic
  battleEngine.setWave(Math.max(1, state.highestWave - 5));
  battleEngine.setMode('farm');
});
```

### State Structure

```typescript
interface IdleState {
  // Currencies
  gold: Decimal;
  gems: number;
  soulShards: number;

  // Progress
  currentWave: number;
  highestWave: number;
  mode: 'farm' | 'push';

  // Squads (moved from battle)
  squads: Squad[];

  // Prestige
  prestigeCount: number;
  prestigeUpgrades: Record<string, number>;

  // Tracking
  totalGoldEarned: Decimal;
  totalWavesCleared: number;
  totalDeaths: number;
  totalPlayTime: number;
  lastOnlineTime: number;

  // Unlocks
  unlockedUnits: string[];
  unlockedFeatures: string[];
  completedMilestones: number[];
  achievements: string[];
}
```

### Save Points

Auto-save triggers:
- Every 30 seconds
- On wave clear
- On purchase
- On prestige
- On app background/close

---

## Progression Pacing

### Session Goals by Playtime

| Session | Target Wave | Army Size | Key Milestone |
|---------|-------------|-----------|---------------|
| First 10 min | Wave 10 | 3-4 squads | Learn basics |
| First hour | Wave 30-40 | 6-8 squads | Feel the loop |
| First day | Wave 80-100 | 12-15 squads | Hit first wall |
| First week | Wave 150+ | 20+ squads | Consider prestige |

### Avoiding Common Pitfalls

**Problem**: Player feels stuck
**Solution**: Farm mode always viable, death isn't harsh

**Problem**: Optimal play is boring (never push)
**Solution**: Pushing gives same rewards but faster progression

**Problem**: Numbers get too big too fast
**Solution**: Conservative 6-8% enemy scaling, not 15%+

---

## Future Features

### v1.0 - Core Loop
- [x] Auto-battler combat
- [x] Farm/Push modes
- [ ] Gold economy
- [ ] Squad purchasing
- [ ] Squad upgrades
- [ ] Offline progression
- [ ] Wave milestones

### v1.5 - Prestige
- [ ] Prestige system (fully designed above)
- [ ] Soul Shard currency
- [ ] Permanent upgrades
- [ ] Prestige UI

### v2.0 - Depth
- [ ] **Boss Waves**: Every 10th wave has a boss with bonus rewards
- [ ] **Gems Currency**: Rare currency from bosses/achievements
- [ ] **Achievements**: Long-term goals with gem rewards
- [ ] **Daily Login**: Consecutive login rewards

### v3.0 - Variety
- [ ] **Unit Abilities**: Active skills (archer volley, warrior shield)
- [ ] **Enemy Variety**: Demon types with unique behaviors (fast, tanky, ranged)
- [ ] **Equipment**: Gear drops that buff specific units
- [ ] **Formations**: Position units in battle for bonuses

### v4.0 - Meta
- [ ] **New Unit Types**: Post-prestige units (Mage, Cavalry, Siege)
- [ ] **Challenge Modes**: Special rules for bonus rewards
- [ ] **Leaderboards**: Highest wave, fastest prestige
- [ ] **Endless Mode**: Scaling difficulty for whale players

---

## Success Metrics

The game is working if players:
- Understand farm/push within 2 minutes
- Feel genuine tension when deciding to push
- Return after being away (offline rewards hook)
- Have meaningful upgrade decisions (not just "buy everything")
- Can play actively OR idle and still progress
