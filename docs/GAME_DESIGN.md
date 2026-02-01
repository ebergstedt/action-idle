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

## Offline Progression

When player returns after being away:

**Calculation**:
```
Offline Gold = (Gold per wave at farming wave) × (Offline hours) × 60 × 0.5

Example: Farming wave 50 for 8 hours
= 60 gold × 8 × 60 × 0.5 = 14,400 gold
```

**Cap**: Maximum 24 hours of offline gains

**Design Intent**: Reward returning players without making active play pointless. The 0.5 multiplier ensures active play is still 2x more efficient.

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

## Future Features (v2+)

1. **Prestige System**: Reset progress for permanent multipliers
2. **Unit Abilities**: Active skills (archer volley, warrior shield)
3. **Enemy Variety**: Demon types with unique behaviors
4. **Boss Waves**: Every 10th wave has a boss
5. **Equipment**: Gear drops that buff specific units
6. **Formations**: Position units in battle for bonuses

---

## Success Metrics

The game is working if players:
- Understand farm/push within 2 minutes
- Feel genuine tension when deciding to push
- Return after being away (offline rewards hook)
- Have meaningful upgrade decisions (not just "buy everything")
- Can play actively OR idle and still progress
