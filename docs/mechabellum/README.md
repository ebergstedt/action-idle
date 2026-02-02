# Mechabellum Game Mechanics Reference

A reference document covering Mechabellum's core systems and mechanics. This serves as a design reference for understanding auto-battler economy and progression systems.

## Game Overview

**Mechabellum** is a mech-themed auto-battler strategy game developed by Game River and published by Paradox Arc. Players command armies of mechanized units in turn-based strategic battles.

### What is an Auto-Battler?

- Players **do not directly control units** during combat
- All strategic decisions happen in the **preparation/deployment phase**
- Combat is automated based on unit stats, abilities, and positioning
- Victory depends on **army composition, positioning, and adaptation**

### Simultaneous Turn Structure

Mechabellum uses a "static game" model where both players make decisions simultaneously without knowledge of the opponent's choices:

1. Both players receive identical supply and card options each round
2. Players deploy units and purchase upgrades in hidden preparation phases
3. After both players confirm (or time expires), combat simulates automatically
4. Process repeats until one player's HP reaches zero

---

## Round Structure

Each match consists of multiple rounds with the following phases:

### 1. Card Selection Phase

At the start of each round (after Round 1), players are offered **4 cards** to choose from:

| Card Type | Description |
|-----------|-------------|
| **Unit Cards** | Purchase specific units (often discounted or pre-ranked) |
| **Item Cards** | Equipment that attaches to a single unit |
| **Ability Cards** | Cooldown-based active abilities (airstrikes, buffs, etc.) |
| **Passive Upgrades** | Permanent stat boosts or economy bonuses |

**Key mechanic**: Both players are offered the **exact same 4 cards**, allowing you to deduce what your opponent might have chosen.

**Skipping**: Declining to pick any card grants **+50 Supply**. Skilled players often skip early rounds unless offered high-tier cards.

### 2. Deployment Phase

- Spend Supply to **unlock new unit types** and **deploy units**
- **Position units** on your half of the battlefield grid
- Purchase **tech upgrades** for unit types
- Equip **items** to individual units
- Reposition existing units (limited by tech unlocks)

### 3. Combat Phase

- Units fight automatically based on AI behavior
- Units gain **experience** from kills and participation
- Surviving enemy units deal **damage to your HP**
- Round ends when one army is eliminated

---

## Economy System

### Supply

Supply is the primary currency for purchasing and deploying units.

| Round | Base Supply | Cumulative Total |
|-------|-------------|------------------|
| 1     | 200         | 200              |
| 2     | 200         | 400              |
| 3     | 200         | 600              |
| N     | 200         | N * 200          |

**Supply gain is identical for both players** regardless of win/loss, ensuring fair resource parity.

### Supply Modifiers

- **Skipping cards**: +50 Supply per skipped card
- **Specialist perks**: Some starting specialists grant +100 Supply/round (with stat penalties)
- **Economy cards**: Permanent upgrades can increase Supply income
- **Selling units**: Refunds a portion of the unit's cost

### Credits (Meta-Currency)

Credits are earned outside of matches through:

- Playing ranked matchmaking games
- Reaching Research Level milestones
- Seasonal rewards based on performance

Credits are used in the **rotating store** to purchase cosmetics and other items.

### Specialist Points

At match start, players choose a **Starting Specialist** that provides:

- A passive perk (economy bonus, free units, stat modifiers)
- Two randomized starting units
- HP modifier (positive or negative)

Example specialists:

| Specialist | Effect | Tradeoff |
|------------|--------|----------|
| Supply | +100 Supply per round | -13% ATK and HP on all units |
| Giant | Free Giant unit on specific round | Lower starting HP |
| Unit-specific | Free ranked unit on specific round | Varies |

---

## Victory Conditions

### HP System

Each player starts with a **base HP pool** (approximately 3,000 in 1v1). Starting HP is calculated as:

```
Starting HP = Base HP + Specialist HP Modifier + Starting Unit Set HP
```

### Damage Calculation

At the end of each round, the **losing player takes damage** based on surviving enemy units:

| Unit Tier | Damage to HP |
|-----------|--------------|
| Tier 1 (100 Supply) | ~100 damage |
| Tier 2 (200 Supply) | ~200 damage |
| Tier 3 (300 Supply) | **250 damage** (reduced from 300) |
| Tier 4 Giants (400 Supply) | **350 damage** (reduced from 400) |
| Supergiants (500 Supply) | **400 damage** (reduced from 500) |

**Note**: Higher-tier units deal reduced HP damage relative to their cost for balance purposes.

### Center Destruction Penalty

Each player controls two **Centers** (Command Center and Research Center):

- Centers have **3,400 HP** (upgradeable)
- When a center is destroyed, your units receive a devastating debuff:
  - **-80% movement speed**
  - **-90% damage dealt**
  - **Increased damage taken**
  - Duration: **9 seconds per center** (stackable to 18 seconds)

### Match End

The match ends when either player's HP reaches **zero or below**.

---

## Tech System

### In-Match Tech Upgrades

Every unit type has **4 purchasable tech upgrades** during a match:

- Upgrades apply to **all units of that type** (not just one)
- Purchased with Supply during deployment phase
- Persist for the entire match
- Examples: stat boosts, new abilities, summoned units

### Meta-Progression Tech Points

Outside of matches, players unlock permanent tech options:

| Concept | Description |
|---------|-------------|
| **Research Level** | Increases by playing matches (win or lose) |
| **Tech Points** | Earned at Research Level milestones |
| **Tech Unlocks** | Permanent unit upgrades unlocked with Tech Points |
| **Cap** | Research Level 74 (after which levels grant Credits instead) |

Tech unlocks give access to additional upgrade options during matches.

---

## Unit Tiers and Costs

### Tier Overview

| Tier | Supply Cost | Unlock Cost | Unit Type | Grid Size |
|------|-------------|-------------|-----------|-----------|
| **Tier 1** | 100 | Free | Chaff/fodder units | Small |
| **Tier 2** | 200 | 50 | Core army units | Medium |
| **Tier 3** | 300 | 100 | Powerful specialized units | Large |
| **Tier 4 (Giants)** | 400 | 200 | Massive single units | 4x4 squares |
| **Supergiants** | 500 | 200 | Enormous single units | 5x5 squares |

### Tier 1 Units (100 Supply)

Cheap, expendable units. Always free to unlock.

- **Marksman** - Ranged single-target burst damage
- **Fang** - Melee cannon fodder swarm
- **Arclight** - AOE damage dealer
- **Crawler** - Fast melee swarm

### Tier 2 Units (200 Supply)

Core army backbone. Each player starts with one T2 unlocked plus two deployments.

Starting T2 options:
- Mustang
- Steel Ball
- Sledgehammer
- Stormcaller
- Tarantula
- Sabertooth

Other T2 units (50 Supply to unlock):
- Wasp
- Phoenix
- Phantom Ray
- Rhino
- Hacker (100 Supply to unlock)

### Tier 3 Units (300 Supply)

Powerful specialized units. Cost 100 Supply to unlock.

- Significant battlefield impact
- Deal reduced HP damage (250 instead of 300)

### Tier 4 Giants (400 Supply)

Massive single-unit deployments. Cost 200 Supply to unlock.

- Occupy **4x4 grid squares**
- Can devastate entire armies
- Deal reduced HP damage (350 instead of 400)

### Supergiants (500 Supply)

The largest units in the game. Cost 200 Supply to unlock.

- Occupy **5x5 grid squares**
- Introduced in Season 2
- Deal reduced HP damage (400 instead of 500)

---

## Unit Leveling System

Units gain **experience (XP)** during combat and rank up for significant stat boosts.

### XP Sources

| Source | XP Amount |
|--------|-----------|
| **Killing blow** | 50% of target's XP value |
| **Participation** | 50% if kill XP was granted, 100% otherwise |
| **Higher rank targets** | Base XP * (2 * Level - 1) |
| **Destroying centers** | Large XP bonus |

### Rank Effects

Each rank **doubles the unit's base stats**:

- Rank 1: Base stats
- Rank 2: 2x base stats
- Rank 3: 4x base stats
- etc.

### XP Mechanics

- XP requirements increase each level (+122% for level 2, then diminishing)
- Units at max XP do not share excess XP
- Indirect damage (missiles, fire, abilities) splits XP among all friendly units
- Borrowed from WarCraft 3's last-hit XP system

---

## Deployment and Positioning

### Grid-Based Placement

- Players deploy on **their half** of the battlefield
- Units are placed on a **grid system**
- Larger units occupy multiple grid squares

### Positioning Principles

| Strategy | Description |
|----------|-------------|
| **Speed matching** | Place fast units behind slow ones so they arrive together |
| **Frontline** | Stack units at the front for immediate engagement |
| **Diagonal** | Stagger depth to control aggro and protect flanks |
| **Spread** | Avoid clustering to minimize AOE damage |

### Movement Lock

- Units can be **freely positioned** on the turn they are purchased
- After that round, units are **locked to their position**
- Specific tech/cards can unlock repositioning

### Deployment Delay

- Newly placed units have a **warp-in delay**
- Units are vulnerable during this period
- Cards that reduce deployment delay are valuable

---

## Items System

Items are equipment that attach to individual units:

- Acquired through **card selection** between rounds
- Provide stat boosts, abilities, or special effects
- **Selling a unit returns its item** for reuse
- Items scale with unit rank (higher rank = more item value)

Common item effects:
- Increased movement speed
- HP percentage boosts
- Lifesteal (healing from damage dealt)
- Special abilities

---

## Game Modes

| Mode | Description |
|------|-------------|
| **1v1** | Standard competitive format |
| **2v2** | Team battles with shared HP pool (~6,000 total) |
| **Free-for-all** | Multiple players compete |
| **Survival Mode** | PvE wave-based defense |

---

## Key Strategic Concepts

### Rock-Paper-Scissors Countering

Mechabellum features strong counter relationships between unit types:

- Certain units hard-counter others
- Flexibility and adaptation are key
- Reading opponent's composition informs your choices

### Overkill Consideration

Stat penalties (like the Supply Specialist's -13% ATK/HP) are often less impactful than they appear because:

- Combat frequently involves overkill damage
- Extra stats beyond what's needed for kills are wasted
- Economy advantages compound over multiple rounds

### Level Snowballing

- Leveled units become exponentially stronger
- Items on high-rank units provide compounding value
- Protecting and investing in key units is critical

---

## Sources

This document was compiled from the following resources:

- [Mechabellum on Steam](https://store.steampowered.com/app/669330/Mechabellum/)
- [Mechabellum Wiki](https://mechabellum.wiki/index.php/Mechabellum)
- [MechaMonarch Guides](https://mechamonarch.com/)
- [Steam Community Discussions](https://steamcommunity.com/app/669330/discussions/)
- [The Gamer - Mechabellum Guides](https://www.thegamer.com/)
- [Mechabellum Wikipedia](https://en.wikipedia.org/wiki/Mechabellum)
