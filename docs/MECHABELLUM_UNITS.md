# Mechabellum Unit Reference

Research compiled from multiple sources for implementing units in Total Idle.

**Last Updated:** February 2026
**Sources:**
- [Mechabellum Wiki - Unit Overview](https://mechabellum.wiki/index.php/Unit_Overview)
- [MechaMonarch Unit Guides](https://mechamonarch.com/unit/)
- [NamuWiki - Mechabellum Units](https://en.namu.wiki/w/%EB%A9%94%EC%B9%B4%EB%B2%A8%EB%A3%B8/%EC%9C%A0%EB%8B%9B)
- [Steam Community Guides](https://steamcommunity.com/app/669330/guides/)

---

## IMPORTANT: T1 Unit Clarification

**Only 4 units cost 100 supply in Mechabellum:**

| Unit | Cost | Verified |
|------|------|----------|
| Crawler | 100 | Yes |
| Fang | 100 | Yes |
| Arclight | 100 | Yes |
| Marksman | 100 | Yes |

**NOT T1 units (commonly confused):**
- **Steel Ball** - Costs 200 (T2)
- **Mustang** - Costs 200 (T2)
- **Hound** - Does NOT exist in Mechabellum (custom unit for our game)
- **Void Eye** - Does NOT exist in Mechabellum (custom unit for our game)

---

## T1 Units - Verified Stats (100 Cost)

### Crawler

| Stat | Value | Notes |
|------|-------|-------|
| **Squad Size** | 24 | Highest in game |
| **HP per Unit** | 263 | |
| **Total Squad HP** | 6,312 | |
| **Damage** | 79 | |
| **Attack Interval** | 0.6s | |
| **DPS (Squad)** | ~3,160 | |
| **Range** | Melee | |
| **Speed** | 16 m/s | Fastest in game |
| **Target** | Ground only | |

**Special Mechanics:**
- Bypasses energy shields completely
- Cannot target air units
- Excellent flankers due to speed

**Counters:** Arclight, Vulcan, Fire Badger, Sledgehammer

---

### Fang

| Stat | Value | Notes |
|------|-------|-------|
| **Squad Size** | 18 | Second highest |
| **HP per Unit** | 117 | Lowest HP unit |
| **Total Squad HP** | 2,106 | |
| **Damage** | 61-63 | Sources vary |
| **Attack Interval** | 1.5s | |
| **DPS (Squad)** | ~732 | |
| **Range** | 75m | |
| **Speed** | 6 m/s | Slow |
| **Target** | Air + Ground | |

**Special Mechanics:**
- High unit count draws single-target fire
- Base damage barely exceeds armor threshold
- Slow speed makes them vulnerable to Stormcallers

**Counters:** Any AoE, Stormcaller, Crawler

---

### Arclight

| Stat | Value | Notes |
|------|-------|-------|
| **Squad Size** | 1 | Single unit |
| **HP per Unit** | 4,813 | Tanky for T1 |
| **Damage** | 347 | |
| **Attack Interval** | 0.9s | Fast firing |
| **DPS** | ~385 | |
| **Range** | 95m | |
| **Speed** | 7 m/s | |
| **Splash Radius** | 7m | AoE damage |
| **Target** | Ground only | Needs tech for air |

**Special Mechanics:**
- One-shots most chaff units (Crawler, Fang, Mustang)
- Requires Anti-Aircraft Ammunition tech to hit air
- Slow rotation speed (80 deg/s)

**Counters:** Marksman, Sledgehammer, Stormcaller (outranges)

---

### Marksman

| Stat | Value | Notes |
|------|-------|-------|
| **Squad Size** | 1 | Single unit |
| **HP per Unit** | 1,622 | Glass cannon |
| **Damage** | 2,329 | Massive single-target |
| **Attack Interval** | 3.1s | Slow |
| **DPS** | ~751 | |
| **Range** | 140m | Second longest (Stormcaller has 180m) |
| **Speed** | 8 m/s | |
| **Target** | Air + Ground | |

**Special Mechanics:**
- Damage is 143% of its own HP
- Two Marksmen meeting at same range = mutual kill
- Glass cannon - very fragile

**Counters:** Crawler, Mustang, any swarm unit

---

## T2 Units - Reference (200 Cost)

### Steel Ball

| Stat | Value | Notes |
|------|-------|-------|
| **Squad Size** | 4 | |
| **HP per Unit** | 4,571 | |
| **Total Squad HP** | 18,284 | |
| **Damage** | 2-2,605 | Ramping beam |
| **Attack Interval** | 0.2s | |
| **Max DPS (Squad)** | ~52,100 | At full ramp |
| **Range** | 45m | Short |
| **Speed** | 16 m/s | Fast |
| **Target** | Ground only | |

**Special Mechanics:**
- Beam damage ramps up over ~4 seconds
- Terrible vs swarms (loses ramp on target switch)
- Very short range for a ranged unit

---

### Mustang

| Stat | Value | Notes |
|------|-------|-------|
| **Squad Size** | 12 | |
| **HP per Unit** | 343 | |
| **Total Squad HP** | 4,116 | |
| **Damage** | 36 | |
| **Attack Interval** | 0.4s | Rapid fire |
| **DPS (Squad)** | ~1,110 | |
| **Range** | 95m | |
| **Speed** | 16 m/s | Fast hover |
| **Target** | Air + Ground | |

**Special Mechanics:**
- Hover tanks - fast and mobile
- Shreds other chaff units
- Missile intercept tech counters Stormcallers

---

## Custom Units (Total Idle Only)

These units are **original creations** for our game, not from Mechabellum:

### Hound (Custom - Melee Infantry)

| Stat | Value | Design Notes |
|------|-------|--------------|
| **Squad Size** | 5 | Mid-size squad |
| **HP per Unit** | 897 | Tanky melee |
| **Damage** | 247 | |
| **Attack Interval** | 2.4s | |
| **Range** | Melee | |
| **Speed** | 10 m/s | |

**Design:** Sturdy front-line melee unit. Fills the "warrior" archetype.

---

### Void Eye (Custom - Scout/Harasser)

| Stat | Value | Design Notes |
|------|-------|--------------|
| **Squad Size** | 6 | |
| **HP per Unit** | 200 | Fragile |
| **Melee Damage** | 45 | |
| **Ranged Damage** | 35 | |
| **Attack Interval** | 0.8s | Fast |
| **Range** | 50m | Short ranged |
| **Speed** | 14 m/s | Fast |

**Design:** Fast scout unit for harassment. Original creation.

---

## Implementation Notes

### Scale Adjustments for Our Game

Our arena is smaller than Mechabellum's, so some values are adjusted:

| Property | Mechabellum | Our Game | Ratio |
|----------|-------------|----------|-------|
| Splash Radius | 7m | ~7 pixels | ~1:1 (scaled) |
| Range | 95m | 95 pixels | ~1:1 (scaled) |
| Speed | 16 m/s | 16 pixels/s | ~1:1 (scaled) |

### Attack Speed Conversion

Mechabellum uses **attack interval** (seconds between attacks).
Our game uses **attackSpeed** (attacks per second).

```
attackSpeed = 1 / attackInterval
```

| Unit | Interval | Our attackSpeed |
|------|----------|-----------------|
| Crawler | 0.6s | 1.67 |
| Fang | 1.5s | 0.67 |
| Arclight | 0.9s | 1.11 |
| Marksman | 3.1s | 0.32 |

---

## Counter Matrix (T1 Only)

| Attacker → | Crawler | Fang | Arclight | Marksman |
|------------|---------|------|----------|----------|
| **Crawler** | Draw | Win | Lose | Win |
| **Fang** | Lose | Draw | Lose | Lose |
| **Arclight** | Win | Win | Draw | Lose |
| **Marksman** | Lose | Win | Win | Draw |

**Key Relationships:**
- Arclight hard-counters all swarm units
- Marksman hard-counters single/low-count units
- Crawler beats fragile ranged (closes distance fast)
- Fang is generally weak but can harass

---

## Balance Philosophy

### Why T1 Units Work in Mechabellum

1. **Cost Efficiency**: 4× T1 units ≈ 1× T4 unit in power
2. **No Universal Counter**: Every unit has winning matchups
3. **Positioning Matters**: Same units, different outcomes
4. **Tech Choices**: Same unit can fill different roles

### For Our Game

- Start with T1 units for simplicity
- Add T2+ later as progression
- Custom units (Hound, Void Eye) fill gaps in archetypes
- Keep counter relationships clear
