# Mechabellum Unit Reference

A comprehensive reference for Mechabellum unit values, stats, counters, and strategic information. This document serves as a design reference for auto-battler game development.

**Last updated:** February 2026 (includes Void Eye from Update 1.5)

**Sources:**
- [Mechabellum Wiki - Unit Overview](https://mechabellum.wiki/index.php/Unit_Overview)
- [MechaMonarch Unit Guides](https://mechamonarch.com/unit/)
- [MechaMonarch Counter List](https://mechamonarch.com/guide/mechabellum-counters/)
- [Steam Community Unit Matrix](https://steamcommunity.com/sharedfiles/filedetails/?id=2981751067)
- [NamuWiki - Mechabellum Units](https://en.namu.wiki/w/%EB%A9%94%EC%B9%B4%EB%B2%A8%EB%A3%B8/%EC%9C%A0%EB%8B%9B)

---

## Unit Classification

### By Type
| Type | Description | Examples |
|------|-------------|----------|
| **Small** | Low HP, high squad count, melee/short range | Crawler, Fang, Hound, Void Eye |
| **Medium** | Moderate HP, varied squad sizes | Marksman, Sledgehammer, Rhino |
| **Heavy** | High HP, usually single unit | Sabertooth, Scorpion, Tarantula |
| **Giant** | Massive HP, expensive, game-changing | Fortress, Vulcan, Melting Point |
| **Titan** | Highest cost, unique mechanics | War Factory, Abyss |
| **Aerial** | Flying units, immune to many ground attacks | Phoenix, Wasp, Overlord, Wraith |

### By Cost Tier
| Tier | Cost | Unlock Cost | Examples |
|------|------|-------------|----------|
| T1 | 100 | 0 (Free) | Crawler, Fang, Arclight, Marksman, Hound, Void Eye |
| T2 | 200 | 50 | Mustang, Sledgehammer, Rhino, Steel Ball, Wasp, Phoenix |
| T3 | 300 | 100 | Scorpion, Typhoon, Farseer |
| T4 (Giant) | 400 | 200 | Fortress, Vulcan, Melting Point, Sandworm, Overlord |
| Titan | 400+ | 200 | War Factory (has 200 upkeep/round), Abyss |

---

## Complete Unit Stats

### Ground Units - Small/Medium

| Unit | Cost | HP | Attack | DPS | Range | Speed | Atk Int | Squad |
|------|------|-----|--------|-----|-------|-------|---------|-------|
| **Crawler** | 100 | 263 | 79 | 3,160 | Melee | 16 m/s | 0.6s | 24 |
| **Fang** | 100 | 117 | 63 | 732 | 75m | 6 m/s | 1.5s | 18 |
| **Arclight** | 100 | 4,813 | 347 | 385 | 95m | 7 m/s | 0.9s | 1 |
| **Marksman** | 100 | 1,622 | 2,329 | 751 | 140m | 8 m/s | 3.1s | 1 |
| **Hound** | 100 | 897 | 247 | — | 70m | 10 m/s | 2.4s | 5 |
| **Void Eye** | 100 | ~1,000 | ~1,800 | — | 100m | 8 m/s | 3.2s | 3 |
| **Mustang** | 200 | 343 | 36 | 1,110 | 95m | 16 m/s | 0.4s | 12 |
| **Sledgehammer** | 200 | 3,478 | 608 | 675 | 95m | 7 m/s | 4.5s | 5 |
| **Stormcaller** | 200 | 1,149 | 772×4 | 2,344 | 180m | 6 m/s | 6.6s | 4 |
| **Steel Ball** | 200 | 4,571 | 2-2,605 | 52,100* | 45m | 16 m/s | 0.2s | 4 |
| **Hacker** | 200 | 3,249 | 585 | 1,950 | 110m | 8 m/s | 0.3s | 1 |
| **Fire Badger** | 200 | 4,222 | 25 | 840 | 75m | 9 m/s | 0.1s | 3 |

*Steel Ball DPS is theoretical max with continuous beam contact

### Ground Units - Heavy/Giant

| Unit | Cost | HP | Attack | DPS | Range | Speed | Atk Int | Squad |
|------|------|------|--------|------|-------|-------|---------|-------|
| **Rhino** | 200 | 19,297 | 3,560 | 3,663 | Melee | 16 m/s | 0.9s | 1 |
| **Sabertooth** | 200 | 14,801 | 7,858 | — | 95m | 8 m/s | 3.4s | 1 |
| **Tarantula** | 200 | 14,773 | 496 | — | 80m | 8 m/s | 0.6s | 1 |
| **Farseer** | 300 | 11,991 | 1,348×2 | — | 125m | 16 m/s | 2.0s | 1 |
| **Scorpion** | 300 | 18,632 | 10,650 | 2,232 | 100m | 7 m/s | 4.5s | 1 |
| **Typhoon** | 300 | 9,529 | 88 | 880 | 100m | 9 m/s | 0.2s | 2 |
| **Vulcan** | 400 | 32,559 | 74 | 860 | 95m | 6 m/s | 0.1s | 1 |
| **Fortress** | 400 | ~45,000 | High | High | 95m | 6 m/s | — | 1 |
| **Melting Point** | 400 | ~35,000 | Ramp | High | 100m | 6 m/s | Beam | 1 |
| **Sandworm** | 400 | Highest* | High | High | Melee | 8 m/s | Slow | 1 |

*Sandworm has highest HP among non-Titan units; immune to damage while burrowing

### Air Units

| Unit | Cost | HP | Attack | DPS | Range | Speed | Atk Int | Squad |
|------|------|------|--------|------|-------|-------|---------|-------|
| **Wasp** | 200 | Low | Low | Low | Short | 16 m/s | Fast | 8+ |
| **Phoenix** | 200 | Medium | High | High | Long | Fast | — | 1 |
| **Wraith** | 300 | High | Medium | Medium | Medium | 8 m/s | — | 1 |
| **Phantom Ray** | 300 | High | High | High | Short | Medium | — | 1 |
| **Overlord** | 400 | Medium | Very High | Very High | 180m+ | Slow | — | 1 |
| **Raiden** | 400 | High | Very High | Multi-hit | Long | — | — | 1 |

### Titan Units

| Unit | Cost | Upkeep | HP | Special |
|------|------|--------|-----|---------|
| **War Factory** | 400 | 200/round | 3× highest | 4 independent turrets, spawns units |
| **Abyss** | 400+ | — | Lower than WF | Devastating sweeping laser |

---

## Tier List (Strategic Flexibility)

Units ranked by versatility and how often they're the correct choice:

### S-Tier (Most Flexible)
- **Crawler** - Best early game aggression, late game distraction, tower destroyer
- **Fortress** - Best counter to medium units, versatile upgrades, shield tech
- **War Factory** - Highest HP, missile interception, spawns supporting units
- **Fire Badger** - Excellent anti-small unit, area denial
- **Overlord** - Dominates from backline, massive range and damage

### A-Tier (Very Strong)
- **Vulcan** - Natural counter to all small units
- **Typhoon** - Anti-swarm specialist
- **Sabertooth** - Built-in missile interception, versatile
- **Fang** - Cheap ranged harassment
- **Steel Ball** - High speed, devastating close-range laser

### B-Tier (Situationally Excellent)
- **Sledgehammer** - Reliable anti-crawler, splash damage
- **Wasp** - Anti-air harassment, protects backline
- **Wraith** - Flying tank, multi-target engagement
- **Stormcaller** - Longest range (180m), high DPS artillery
- **Phoenix** - Early harassment, anti-ground support

### C-Tier (Specialized)
- **Marksman** - Long range sniper, scales well with levels
- **Rhino** - Fast melee with splash, anti-crawler
- **Mustang** - Fast harassment, anti-air capable
- **Melting Point** - Hard counter to Fortress/War Factory
- **Arclight** - AOE ground support, anti-swarm

### D-Tier (Niche)
- **Scorpion** - High single-target damage, slow
- **Sandworm** - Unique burrowing mechanic, situational
- **Tarantula** - Anti-swarm specialist
- **Hacker** - Disruption specialist
- **Void Eye** - Anti-heavy specialist, can gain flight mode

---

## Counter Matrix

### What Counters What

| Unit | Strong Against | Weak Against |
|------|----------------|--------------|
| **Crawler** | Fang, Hacker, Marksman, Melting Point, Steel Ball, Stormcaller | Arclight, Vulcan, Rhino, Wraith, Sledgehammer, Fire Badger |
| **Fang** | (limited) | Crawler, Mustang, Stormcaller, Vulcan, Typhoon |
| **Arclight** | Crawler, Fang, Mustang, Steel Ball, Sledgehammer | Marksman, Stormcaller, Rhino, Overlord, Fortress |
| **Marksman** | Phoenix, Overlord, Vulcan, Arclight, Sledgehammer | Crawler, Fang, Stormcaller, Wasp, Fortress |
| **Mustang** | Fang, Phoenix, Wasp, Crawler | Arclight, Sledgehammer, Stormcaller, Vulcan |
| **Sledgehammer** | Crawler, Mustang, Stormcaller | Hacker, Fortress, Phoenix, Overlord, Scorpion |
| **Steel Ball** | Fortress, Rhino, Melting Point, Vulcan, War Factory | Crawler, Hacker, Phoenix, Overlord, Stormcaller |
| **Stormcaller** | Arclight, Fang, Melting Point, Vulcan, Mustang, Marksman | Overlord, Phoenix, Crawler, Sledgehammer, Rhino |
| **Rhino** | Arclight, Vulcan, Stormcaller, Crawler, Sledgehammer | Fortress, Hacker, Melting Point, Steel Ball |
| **Sabertooth** | Arclight, Steel Ball, Stormcaller, Fire Badger | Fortress, Hacker, Melting Point, Overlord |
| **Scorpion** | Sledgehammer, Steel Ball, Arclight, War Factory | Marksman, Phoenix, Stormcaller, Overlord |
| **Vulcan** | Crawler, Fang, Mustang | Fortress, Melting Point, Overlord, Phoenix, Rhino |
| **Fortress** | Arclight, Rhino, Sledgehammer, Vulcan, Wasp, Phoenix | Crawler, Melting Point, Overlord, Stormcaller, Steel Ball |
| **Melting Point** | Fortress, Rhino, Vulcan, Wraith, War Factory | Steel Ball, Crawler, Marksman, Phoenix, Stormcaller |
| **Sandworm** | Fire Badger, Arclight, Marksman, Rhino, Sabertooth | War Factory, Phoenix, Overlord, Steel Ball |
| **War Factory** | Most medium units, Overlord | Melting Point, Scorpion |
| **Wasp** | Marksman, Phoenix, Melting Point, Vulcan, Overlord | Mustang, Fortress, Fang, Wraith |
| **Phoenix** | Arclight, Overlord, Rhino, Stormcaller, Vulcan | Wasp, Marksman, Mustang, Fang, Fortress |
| **Wraith** | Crawler, Fang, Sledgehammer, Steel Ball, Wasp | Overlord, Phoenix, Melting Point, Marksman |
| **Overlord** | Most ground units, Hacker, Scorpion, War Factory | Marksman, Melting Point, Phoenix, Mustang, Fortress |
| **Void Eye** | Marksman, Stormcaller, Phoenix, Vulcan, Sabertooth | Crawler, Fang, Sledgehammer, Arclight |

---

## Key Mechanics

### Unit Scaling
- **Formula**: `Unit Stats = Level × Level 1 Stats`
- Level 2 is a significant power spike (e.g., Marksman one-shots Sledgehammer)
- Giant units scale dramatically - Level 1 giants are weak; Level 2+ are dominant

### Economy
- **Round income**: Base supply + tower + specialists
- **Unlock limit**: Only 1 unit type can be unlocked per turn
- **War Factory upkeep**: 200 supply/round (50 with Efficient Maintenance)

### Combat Mechanics
- **Squad size matters**: 4 Marksmen (100 each) vs 1 Fortress (400) = fair fight
- **Range advantage**: Units with longer range fire first
- **Splash damage**: AOE diameter ~ 4 crawler lengths
- **Burrowing**: Sandworm immune to damage while moving underground

### Tech Upgrades (Sample Costs: 200-300 supply)
Common upgrade types:
- **Damage boost**: +50-175% attack
- **Speed boost**: +3-5 m/s movement
- **HP boost**: +20-35% health
- **Range boost**: +10-25m range
- **Special abilities**: Missile interception, spawning, EMP, acid

---

## Design Lessons for Auto-Battlers

### Cost-to-Power Ratios
1. **Linear scaling**: 4× cost should roughly equal 4× cheaper units in effectiveness
2. **Counter multipliers**: Hard counters swing 2-3× the expected value
3. **Giant premium**: High-cost units need impactful abilities, not just stats

### Unit Archetypes That Work
| Archetype | Example | Role |
|-----------|---------|------|
| Swarm | Crawler | Overwhelm, distract, flank |
| Sniper | Marksman | Long-range single-target |
| Tank | Fortress | Absorb damage, anchor position |
| Artillery | Stormcaller | Backline area damage |
| Assassin | Phoenix | Bypass front line |
| Counter-pick | Melting Point | Hard counter specific threats |
| Generalist | Sabertooth | Flexible, moderate at everything |

### Balance Triangle
```
Swarm beats Artillery (close distance)
Artillery beats Tank (out-ranges)
Tank beats Swarm (survives, kills slowly)
```

### Why Mechabellum Works
1. **No unit is universally bad** - Every unit has winning matchups
2. **Information asymmetry** - You deploy before seeing enemy composition
3. **Tech choices matter** - Same unit can fill different roles
4. **Positioning is skill** - Same units, different outcomes based on placement
5. **Economy pressure** - Expensive unlocks create commitment

---

## Quick Reference Card

### By Situation

| Problem | Solution |
|---------|----------|
| Enemy crawlers | Arclight, Vulcan, Rhino, Fire Badger |
| Enemy fortress | Melting Point, Crawler swarm, Stormcaller |
| Enemy overlord | Marksman, Phoenix, Melting Point, Wasp |
| Enemy air spam | Mustang, Fang, Fortress (anti-air tech) |
| Need early aggression | Crawler, Fang, Mustang, Phoenix |
| Need late game anchor | Fortress, War Factory, Overlord |
| Need tower damage | Crawler, Overlord, War Factory |

### Speed Reference
| Speed | Units |
|-------|-------|
| 16 m/s | Crawler, Rhino, Mustang, Steel Ball, Wasp, Farseer |
| 9-10 m/s | Hound, Fire Badger, Typhoon |
| 7-8 m/s | Most medium/heavy units |
| 6 m/s | Stormcaller, Vulcan, Fang, Giants |

### Range Reference
| Range | Units |
|-------|-------|
| 180m | Stormcaller (longest) |
| 140m | Marksman |
| 125m | Farseer |
| 95-110m | Most ranged units |
| 70-80m | Short-range units |
| 45m | Steel Ball |
| Melee | Crawler, Rhino, Sandworm |
