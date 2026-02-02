# Total War: Warhammer 3 - Unit Mechanics Reference

A comprehensive reference for unit statistics, combat mechanics, and balance design. Use this as inspiration for the battle system.

---

## Core Combat Statistics

### Melee Attack (MA)

- **Function**: Chance to hit in melee combat
- **Formula**: `35 + Melee Attack - Enemy Melee Defense = Hit Chance %`
- **Caps**: Minimum 10%, Maximum 90%
- **Effective Range**: +50 MA over enemy MD is max benefit (hits 90% cap)

### Melee Defense (MD)

- **Function**: Chance to avoid being hit
- **Effective Range**: +30 MD over enemy MA is max benefit (enemy at 10% floor)
- **Flanking Penalties**:
  - Rear attacks: MD × 0.25-0.30 (75% reduction)
  - Flank attacks: MD × 0.60 (40% reduction)

### Weapon Strength (Damage)

Damage is split into two components:

| Type | Description | vs Armor |
|------|-------------|----------|
| **Base Damage** | Standard damage | Reduced by armor roll |
| **Armor-Piercing (AP)** | Ignores armor | Full damage always |

**Armor Formula**:
```
Damage Reduction = Random(50% of Armor, 100% of Armor)
```

| Armor Value | Reduction Range | Average |
|-------------|-----------------|---------|
| 30 | 15-30% | 22.5% |
| 50 | 25-50% | 37.5% |
| 100 | 50-100% | 75% |
| 150 | 75-100% | 93% |
| 200 | 100% | 100% |

**Design Note**: Most units have mixed damage (e.g., 20 base + 10 AP). Only ethereal units (ghosts) have 100% AP damage.

### Charge Bonus

- **Duration**: 13 seconds, decaying to zero
- **Effect**: Adds to both Melee Attack AND Weapon Strength
- **Damage Split**: Uses existing AP ratio (e.g., 25% AP unit with +12 charge = +3 AP, +9 base)
- **Counter**: Charge Defense negates the charge bonus entirely

---

## Resistances & Damage Types

### Damage Type Hierarchy

```
Physical ─┬─ Fire Physical
          └─ Non-Fire Physical

Magical ──┬─ Fire Magical
          └─ Non-Fire Magical
```

### Resistance Types

| Resistance | Reduces | Notes |
|------------|---------|-------|
| **Ward Save** | ALL damage | Most powerful, nothing bypasses it |
| **Physical Resistance** | Non-magical damage | Melee + non-magic missiles |
| **Missile Resistance** | ALL ranged damage | Magic missiles included |
| **Magic Resistance** | Spell damage | Does NOT affect magic missiles |
| **Fire Resistance** | Fire damage | Can go negative (vulnerability) |

**Stacking**: All resistances are additive
**Cap**: Maximum 90% total resistance vs any attack type

**Example Calculation**:
```
70% Physical + 20% Ward = 90% (capped) vs physical melee
40% Ward + 50% Missile = 90% (capped) vs missiles
```

### Fire Damage Special Rules

- Stops or slows regeneration on affected units
- Fire resistance can go negative (-20% = +20% damage taken)
- Only damage type that can have negative resistance

---

## Shields

### Block Mechanics

Shields provide a % chance to **completely block** missile damage from the front.

| Shield Tier | Icon Color | Block Chance |
|-------------|------------|--------------|
| Bronze | Brown | 30-35% |
| Silver | Silver | 50-55% |
| Gold | Gold | ~75% (magic buff only) |

**Important Rules**:
- Only works vs missiles from the front (60° arc)
- Does NOT reduce melee damage
- Does NOT reduce artillery/explosives
- Can block armor-piercing missiles (unlike armor)
- Rear and flanks have 0% block chance

---

## Unit Size Categories

### Small vs Large

| Category | Examples | Targeted By |
|----------|----------|-------------|
| **Small** | Infantry, War Dogs, Hounds | Anti-Infantry |
| **Large** | Cavalry, Monsters, Monstrous Infantry | Anti-Large |

**Bonus vs X**: Adds bonus to both Melee Attack AND Weapon Strength against that size category. Damage bonus uses the unit's existing AP ratio.

**Example**: Unit with 75% AP ratio and +28 vs Large gets:
- +28 Melee Attack vs Large
- +21 AP damage vs Large
- +7 Base damage vs Large

---

## Morale & Leadership

### Leadership Mechanics

- **Base**: Each unit has a Leadership stat (0-100+)
- **Modifiers**: Combat results, army losses, flanking, lord death, terror/fear
- **Routing**: Triggers after 5 consecutive seconds below 0 leadership
- **Rally**: Can recover if leader is alive and enemies aren't pursuing

### Rout States

| State | Description |
|-------|-------------|
| **Wavering** | Near breaking point |
| **Routing** | Fleeing, can rally |
| **Shattered** | After 3 routs, cannot rally |

### Fear & Terror

| Ability | Effect |
|---------|--------|
| **Fear** | Passive leadership debuff, immunity to Fear |
| **Terror** | Causes instant rout check on attack (at ≤13 leadership), immunity to both |

**Terror Rout**: Special shorter rout, has separate counter (4 terror routs to shatter vs 3 normal)

### Special Cases

| Unit Type | Behavior |
|-----------|----------|
| **Unbreakable** | Never routes |
| **Undead** | Don't route, instead "Crumble" → "Disintegrate" |
| **Daemons** | Disintegrate instead of routing |

---

## Unit Abilities & Attributes

### Movement Abilities

| Ability | Effect |
|---------|--------|
| **Vanguard Deployment** | Can deploy in expanded area near enemy |
| **Stalk** | Hidden while moving in ANY terrain |
| **Hide (Forest)** | Hidden only in forests |
| **Strider** | Ignores terrain speed/combat penalties, can pass through trees |
| **Aquatic** | No penalties in water |

### Combat Abilities

| Ability | Effect |
|---------|--------|
| **Charge Defense vs Large** | Negates charge bonus from Large units when braced |
| **Charge Defense vs All** | Negates all charge bonuses when braced |
| **Anti-Large** | Bonus MA and damage vs Large |
| **Anti-Infantry** | Bonus MA and damage vs Small |
| **Armor-Piercing** | High % of damage ignores armor |
| **Armor-Sundering** | Attacks reduce target's armor |

### Defensive Abilities

| Ability | Effect |
|---------|--------|
| **Regeneration** | Heals ~0.10% max HP/second |
| **Physical Resistance** | % reduction to physical damage |
| **Magical Attacks** | Bypasses physical resistance |
| **Ethereal** | 75% physical resistance, 100% AP damage |
| **Unbreakable** | Cannot route |

### Special Abilities

| Ability | Effect |
|---------|--------|
| **Snipe** | Can target specific entities |
| **Fire While Moving** | Ranged attacks during movement |
| **360° Firing Arc** | Can shoot in any direction |
| **Encourage** | Leadership aura to nearby allies |
| **Expendable** | Routing doesn't affect ally morale |

---

## Bracing

### Mechanics

- **Activation**: Stand still for 3-4 seconds
- **Visual**: Shield icon on unit card, defensive stance animation
- **Effects**:
  - Increased mass (resist knockback)
  - Charge Defense activates (if unit has it)
  - Only works vs frontal attacks

### Tactical Implications

- Moving units cannot brace
- Engaged units cannot brace (why Hammer & Anvil works)
- Even archers can stop light cav if braced
- Side/rear charges bypass bracing entirely

---

## Fatigue

### Vigor States

| State | MA Modifier | MD Modifier |
|-------|-------------|-------------|
| Fresh | 100% | 100% |
| Winded | 95% | 100% |
| Tired | 85% | 100% |
| Very Tired | 75% | 100% |
| Exhausted | 70% | 85-90% |

**Causes**: Running, fighting, terrain, charging

---

## Magic System

### Winds of Magic

- **Power Pool**: Shared by all casters in army
- **Reserve**: Recharges power pool over time
- **Recharge Rate**: Speed of reserve → active transfer

### Spell Casting

| Cast Type | Cost | Miscast Risk |
|-----------|------|--------------|
| Normal | Base cost | None |
| Overcast | ~1.5-1.7x cost | ~25% base chance |

**Miscast**: Spell still casts, but damages the caster

### Spell Resistance

- Spells affected by: Spell Resistance, Ward Save
- Magic missiles affected by: Missile Resistance, Ward Save (NOT Magic Resistance)

---

## Unit Categories

### Infantry

| Type | Role | Characteristics |
|------|------|-----------------|
| **Line Infantry** | Hold the line | Good armor, shields, moderate damage |
| **Elite Infantry** | Kill infantry | High MA/MD, good damage |
| **Anti-Large Infantry** | Counter cavalry/monsters | Spears, charge defense, bonus vs Large |
| **Hybrid Infantry** | Flexible | Both ranged and melee capability |

**Kislev Special**: Many units are hybrid (Streltsi, Kossars) with both ranged and melee weapons.

### Cavalry

| Type | Role | Characteristics |
|------|------|-----------------|
| **Shock Cavalry** | Devastating charges | High charge bonus, requires micro |
| **Melee Cavalry** | Sustained fighting | Lower charge, better staying power |
| **Heavy Cavalry** | Breakthrough | High armor, mass, lower speed |
| **Light Cavalry** | Harassment | Fast, low armor, often vanguard |
| **Monstrous Cavalry** | Elite shock | Large size, terrifying, expensive |

**Speed**: ~2-2.5x faster than infantry

### Missiles

| Type | Role | Characteristics |
|------|------|-----------------|
| **Archers** | Volume fire | Good range, lower AP |
| **Crossbows** | Armor-piercing | High AP, slower rate |
| **Handgunners** | Anti-armor | Very high AP, short range |
| **Skirmishers** | Harassment | Fast, fire-while-moving |
| **Artillery** | Siege/Anti-blob | Explosive, ignores shields |

### Monsters & Single Entities

| Type | Role | Characteristics |
|------|------|-----------------|
| **Infantry Giants** | Frontline monsters | Trolls, Ogres - high HP, regen common |
| **War Beasts** | Flanking | Fast, expendable, Fear |
| **Monsters** | Terror weapons | Huge, Terror, high damage |
| **Single Entity Lords** | Army anchor | Buffs army, powerful in combat |

**Mass**: Single entities can plow through infantry (animation-dependent)

---

## Faction Unique Mechanics

### Kislev
- **Hybrid Units**: Streltsi, Kossars combine ranged + melee
- **Frost Magic**: Ice spells, slow effects

### Khorne
- **No Magic**: Cannot cast spells
- **Rampage**: Pure melee aggression
- **Blood for the Blood God**: Buffs from killing

### Grand Cathay
- **Harmony**: Melee + ranged units buff each other when close
- **Yin/Yang Lords**: Paired lords enhance harmony

### Tzeentch
- **Barriers**: Regenerating magic shield (HP buffer)
- **Magical/Fire Attacks**: Bypass physical resistance
- **Warpflame**: Debuffs stack fire vulnerability

### Nurgle
- **Regeneration**: Units heal over time
- **Poison**: Attacks debuff enemy
- **Slow but Tanky**: Low speed, high HP/armor

### Slaanesh
- **Speed**: Fastest faction
- **Seduction**: Can convert enemy units
- **Glass Cannon**: Low armor, high damage

### Daemons of Chaos
- **All Four**: Access to all Chaos god units
- **Customizable Lord**: Daemon Prince with mix of boons

### Chaos Dwarfs
- **Slave Economy**: Captured units fuel production
- **War Engines**: Powerful daemonic artillery
- **Hybrid Dwarfs**: Tough infantry + artillery focus

### Ogre Kingdoms
- **Big'uns**: Monstrous infantry focus
- **Camps**: Mobile settlement system
- **Meat**: Resource from battles/raiding

---

## Balance Design Principles

### Rock-Paper-Scissors

```
Anti-Large Infantry ─► Cavalry/Monsters
        ▲                    │
        │                    ▼
   Ranged ◄───────── Standard Infantry
```

### Counter System

| Unit | Strong Against | Weak Against |
|------|---------------|--------------|
| Spearmen | Cavalry, Large | Infantry, Missiles |
| Swordsmen | Infantry | Cavalry, Missiles |
| Cavalry | Missiles, Flanking | Spears, Braced units |
| Ranged | Unshielded, Slow | Cavalry, Fast flankers |
| Monsters | Infantry blobs | Focus fire, Anti-Large |

### Armor vs AP Balance

- **Light Armor (0-50)**: Vulnerable to everything
- **Medium Armor (50-80)**: Protected vs base damage
- **Heavy Armor (100+)**: Needs AP to kill efficiently
- **Elite Armor (150+)**: AP essential, base damage nearly useless

### Speed Tiers (Approximate)

| Category | Speed | Examples |
|----------|-------|----------|
| Very Slow | 28-32 | Dwarfs, heavy infantry |
| Slow | 33-38 | Most infantry |
| Average | 39-46 | Light infantry, some monsters |
| Fast | 48-56 | Light cavalry, wolves |
| Very Fast | 58-75 | Cavalry, flying units |
| Fastest | 80+ | Slaanesh units, some flyers |

---

## Sources

- [Total War Warhammer Wiki - Statistics](https://totalwarwarhammer.fandom.com/wiki/Statistics)
- [Total War Warhammer Wiki - Combat](https://totalwarwarhammer.fandom.com/wiki/Combat)
- [Steam Guide - KV Rules](https://steamcommunity.com/sharedfiles/filedetails/?id=2776861563)
- [Games Lantern - Damage Types Explained](https://gameslantern.com/article/warhammer-iii-damage-types-explained)
- [Total War Forums - Armor Mechanics](https://forums.totalwar.com/discussion/194500/armour-attack-defence-charge-bonus-and-bonus-vs-mechanics)
- [Dexerto - Faction Mechanics Guide](https://www.dexerto.com/gaming/total-war-warhammer-3-races-guide-all-faction-mechanics-bonuses-1759423/)
- [Screen Rant - Unit Stats Guide](https://screenrant.com/total-war-warhammer-3-unit-stats-guide/)
