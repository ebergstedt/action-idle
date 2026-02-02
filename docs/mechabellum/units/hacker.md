# Hacker

## Overview

The Hacker is the most unusual unit in the entire game - a spindly tripod walker equipped with four long tentacles that project rays capable of converting enemy ground units to your side. For balance purposes, stolen units only deal 1/4 of their usual damage to their owner's HP if they survive the round.

Because of their niche status, it costs 100 supply to unlock Hackers, more than any other non-giant unit. The Hacker is extremely specialized - it isn't bad per se, but it lacks the versatility to branch out from that specialization.

## Stats

| Stat | Value |
|------|-------|
| **Cost** | 200 Supply |
| **Unlock Cost** | 100 Supply |
| **Unit Count** | 1 (Single Entity) |
| **HP** | 3,249 |
| **Hack Damage per Tick** | 585 |
| **Attack Interval** | 0.3 seconds |
| **Hack DPS** | 1,950 |
| **Range** | 110m |
| **Speed** | 8 m/s |
| **Target** | Ground Only |
| **Attack Type** | Control Ray (Hacking Beam) |
| **Barrier Damage** | 30% of listed damage |

### Weapon Mechanics

**Attack Type:** Control ray beam (hacking/conversion)

**Conversion Mechanic:**
The Hacker does not deal true damage. Instead, it fills a "hack bar" on the target. When hack damage exceeds the target's current HP, the unit is converted to your side.

**How Hacking Works:**
1. **Hack Accumulation:** Each tick deals 585 "hack damage" to the target
2. **Conversion Threshold:** When accumulated hack damage >= target's current HP, unit converts
3. **Heal Interaction:** Hack damage cannot be healed, but target HP can be
4. **Overkill Prevention:** If the target is killed (HP reaches 0) before hack completes, no conversion occurs
5. **Hack Reset:** If Hacker loses target (death, EMP, range), hack progress fully resets

**Conversion Example:**
- Target has 5,000 current HP
- Hacker deals 585 hack damage per 0.3 seconds
- After ~2.5 seconds, hack damage (4,875) approaches current HP
- If target takes normal damage reducing HP to 4,000, conversion triggers sooner

**Key Mechanics:**
- **No True Damage:** Hacking doesn't reduce target HP directly
- **Current HP Based:** Hack threshold is current HP, not max HP
- **EMP Vulnerability:** EMP resets hack progress completely
- **Stolen Unit Penalty:** Converted units only deal 25% damage to original owner's base

**Multiple Control Tech:**
- Fires 5 beams simultaneously instead of 1
- Each beam has 17% potency (not 20%)
- Range reduced by 25m
- Best vs many low-level units, worst vs single high-HP targets

**Fragility Note:**
- Hacker has less HP than an Arclight (3,249 vs ~4,500)
- Weakest single-body unit after Marksmen
- Single-entity vulnerability to burst damage

*Stats current as of 2025. Values may change with balance patches.*

## Technologies

| Tech | Cost | Description |
|------|------|-------------|
| **Electromagnetic Interference** | 100 | Causes electromagnetic interference on hit, disabling target tech and reducing movement speed by 40%. |
| **Multiple Control** | 250 | Range reduced by 25m, but fires 5 control beams at once (each at 17% potency). |
| **Enhanced Control** | 300 | Units under Hacker's control immediately recover their maximum HP. |
| **Barrier** | 300 | Generates large-scale shield protecting all allies within it. Shield HP increases by 20,000 per unit level. |
| **Range Enhancement** | 300 | Increases attack range by 40m. Usually the first tech to get. |

### Tech Analysis

**Range Enhancement** - Usually the first technology to get. Extra range allows Hackers to stay safe and keep distracting enemies. Range enables the power of Hackers by allowing them to live longer in a safer position.

**Electromagnetic Interference (EMP)** - Very cheap and provides a slow effect. If you have Hackers and don't want to invest much, the slow from EMP is great against charging Rhinos. Also good against Assault Marksmen since it deletes the HP buff from their technology and hacks them instantly.

**Multiple Control** - Good if your Hackers are very high level and the enemy has teched Fangs in large numbers. Works when enemy has lots of chaff or high amounts of low-level medium units. Never tech this if something high-level is in front of you.

**Enhanced Control** - Not useful often. Sometimes good against big flankers because you get easy hacks and develop a new army. Good in casual modes like FFA or survival mode where you can hack bosses with full health. Very expensive for situational use.

**Barrier** - Good technology to protect units around the Hackers against fire or Sentry Missiles if you're close to the line pushing. Synergizes well when pairing Hackers with Mustangs for protection.

## Counters

### What Beats Hackers

| Unit | Effectiveness | Notes |
|------|---------------|-------|
| **Overlord** | Hard Counter | Air unit Hackers can't target |
| **Fortress** | Hard Counter | Barrier protects key units, too tanky |
| **Phoenix** | Hard Counter | Flying, destroys Hackers easily |
| **Wraith** | Hard Counter | Air unit Hackers can't target |
| **Stormcaller** | Good Counter | Outranges Hackers even without tech, great at destroying Hacker shields |
| **Crawler** | Good Counter | A single Fang unit can destroy a Hacker instantly |
| **Fang** | Good Counter | Swarms overwhelm Hackers |
| **War Factory** | Good Counter | Outclasses Hackers entirely |
| **Any Barrier Unit** | Good Counter | Hackers do only 30% damage to barriers |

### What Hackers Beat

| Unit | Effectiveness | Notes |
|------|---------------|-------|
| **Scorpion** | Hard Counter | Distracted by hacked units, spins around doing nothing |
| **Melting Point** | Hard Counter | Same as Scorpion - distracted by hacked units |
| **Steel Ball** | Good Counter | Can hack Steel Balls effectively |
| **Sledgehammer** | Good Counter | Medium-sized targets, easy to hack |
| **Rhino** | Good Counter | Hacker loses 1v1 but with support becomes excellent counter |
| **Fire Badger** | Good Counter | Medium-sized target |
| **Arclight** | Good Counter | Stationary, easy hack |

## Strategy Tips

### Offensive Use

1. **Support Role Only** - Hackers should be strictly kept in a supporting role. Under no circumstances use them as frontline units - it achieves nothing and wastes resources.

2. **Two Purposes** - Use Hackers either as a barrier for your Fangs/Mustangs, or as a response to medium-sized units (Steel Ball, Sledgehammer, Rhino, Arclight).

3. **Giant Hacking** - Hackers can hack giants but require significant support to do so. Not reliable as a primary anti-giant strategy.

### Defensive Use

1. **Distraction Machine** - Hacked units distract enemy armies. This works better when enemies clear chaff with Arclights or Sledgehammers (slower clear) rather than Mustangs or Vulcans (fast clear).

2. **Support Pairing** - Pair Hackers with Stormcallers early game so you won't get countered by Barriers on the next round.

### Tech Build Paths

**Standard Build:**
1. Range Enhancement
2. Barrier or Electromagnetic Interference

**Anti-Rhino Build:**
1. Range Enhancement
2. Electromagnetic Interference

**Chaff Hacking Build:**
1. Range Enhancement
2. Multiple Control (only if enemy has lots of low-level units)

### General Advice

- Hackers get significantly better when leveled. A leveled Hacker is much more threatening.
- The biggest enemy of Hackers in midgame is the Barrier. Going Fortress with Barrier tech or buying a 100 cost personal shield counters Hackers effectively.
- If you go Hackers early game, pair them with something that kills barriers fast (like Stormcallers).
- In late game when the enemy has shield break and chaff clear covered, you need to kill your own hacked units as fast as possible. Consider Mustangs, Vulcans, or even Overlords with ground cannon.
- Hackers are good against Scorpions and Melting Points since both units become very distracted by hacked units and spin around without doing anything.

## Synergies

| Unit | Synergy | Notes |
|------|---------|-------|
| **Mustang** | Excellent | Hackers serve as barrier, protect each other |
| **Fang** | Excellent | Hackers barrier Fangs, Fangs provide anti-air |
| **Stormcaller** | Excellent | Breaks enemy barriers that counter Hackers |
| **Fortress** | Good | Tanky frontline while Hackers work |

## Strengths

- Can convert enemy units to your side
- Excellent against Scorpions and Melting Points (distraction value)
- Scales well with levels
- Range Enhancement enables safe positioning
- Barrier tech protects allies from fire and missiles
- Hacked units distract enemy armies
- Effective against medium-sized units

## Weaknesses

- Cannot target air units at all
- Achilles' heel: Barriers and Air units
- Does only 30% damage to barriers
- Extremely specialized with limited versatility
- High unlock cost (100 supply)
- Vulnerable to swarm units (single Fang unit can destroy a Hacker)
- Requires support to be effective
- Stolen units only deal 1/4 damage to owner's HP

## Sources

- [MechaMonarch Hacker Guide](https://mechamonarch.com/unit/hacker/)
- [Mechabellum Wiki - Hacker](https://mechabellum.wiki/index.php/Hacker)
- [ZLeague Hacker Guide](https://www.zleague.gg/theportal/mechabellum-hacker-guide/)
- [MechaMonarch Counter List](https://mechamonarch.com/guide/mechabellum-counters/)
