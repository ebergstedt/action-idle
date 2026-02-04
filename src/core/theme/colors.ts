/**
 * Centralized Color Palette - Godot Portable
 *
 * Inspired by Armored Core 6: Fires of Rubicon
 * Industrial mech aesthetic with high-contrast accents.
 *
 * Godot Migration:
 * - Convert this file to GDScript or C#
 * - Replace hex strings with Color.html("#RRGGBB") or Color8(r, g, b)
 * - Example: Color.html("#0A0E14") or Color8(10, 14, 20)
 */

// =============================================================================
// CORPORATION COLORS - AC6-Inspired Factions
// =============================================================================

export interface FactionColor {
  primary: string;
  secondary: string;
}

export const FACTION_COLORS: Record<string, FactionColor> = {
  // Major Corporations
  arquebus: { primary: '#D4AF37', secondary: '#1A1A1A' }, // Gold/black - corporate elite
  balam: { primary: '#8B0000', secondary: '#2A2A2A' }, // Deep red - military industrial
  elcano: { primary: '#4A90A4', secondary: '#1E3A4A' }, // Steel blue - naval/logistics
  rad: { primary: '#00CED1', secondary: '#0A2030' }, // Cyan - research/tech

  // Mercenary Groups
  redgun: { primary: '#FF4444', secondary: '#2A1A1A' }, // Bright red - aggressive
  vesper: { primary: '#9370DB', secondary: '#1A1A2A' }, // Purple - elite mercenaries

  // Independent Forces
  rubicon: { primary: '#00FF88', secondary: '#0A1A14' }, // Coral green - liberation
  dosers: { primary: '#FF8C00', secondary: '#2A1A0A' }, // Orange - scavengers

  // Special
  ayre: { primary: '#87CEEB', secondary: '#0A1420' }, // Light blue - ethereal
  allmind: { primary: '#FFFFFF', secondary: '#1A1A1A' }, // White - AI/neutral
} as const;

// =============================================================================
// UI COLORS - Industrial Mech Theme
// =============================================================================

export const UI_COLORS = {
  // Panel backgrounds (darkest to lightest)
  panelDark: '#0A0E14', // Deepest black-blue
  panelBase: '#12171E', // Standard panel
  panelLight: '#1A2028', // Elevated panel
  panelHighlight: '#242C38', // Hover/active state

  // Metallic surfaces
  metalDark: '#2A323E', // Dark steel
  metalBase: '#3A4452', // Standard metal
  metalLight: '#4A5668', // Light metal
  metalHighlight: '#5A6878', // Polished metal

  // Text colors
  textPrimary: '#E8ECF0', // Primary text - off-white
  textSecondary: '#9AA4B0', // Secondary text - steel gray
  black: '#000000',
  white: '#FFFFFF',

  // Accent colors
  accentPrimary: '#F5A623', // Warning amber - primary accent
  accentSecondary: '#00A8E8', // Tech blue - secondary accent
  accentTertiary: '#00FF88', // Coral green - success/friendly

  // Warning/Status colors
  warningRed: '#FF4444', // Hostile/danger
  warningOrange: '#FF8C00', // Caution
  warningYellow: '#FFD700', // Alert
  successGreen: '#00CC66', // Success/online
  infoBlue: '#00A8E8', // Information
  criticalRed: '#CC0000', // Critical/destroyed

  // System colors
  systemOnline: '#00FF88', // System online
  systemOffline: '#5A6470', // System offline
  systemWarning: '#FF8C00', // System warning
  systemCritical: '#FF4444', // System critical
} as const;

// =============================================================================
// ENVIRONMENTAL COLORS - Industrial/Wasteland
// =============================================================================

export const ENV_COLORS = {
  // Rubicon landscape
  wastelandGray: '#3A3A3A',
  industrialRust: '#8B4513',
  coralRed: '#FF6B6B',
  toxicGreen: '#00FF88',
  skyPolluted: '#4A4A5A',
  metalDebris: '#6A7080',
  ashGray: '#505050',
} as const;

// =============================================================================
// GAME COLORS - Combat Arena
// =============================================================================

export const ARENA_COLORS = {
  // Background - industrial combat arena floor
  background: '#12171E', // Dark steel floor
  gridLine: '#1E252E', // Subtle grid lines
  gridLineAccent: '#2A3542', // Major grid lines

  // Combat zones
  // Enemy zone - hostile red/orange tones
  enemyZoneFill: 'rgba(255, 68, 68, 0.15)', // Warning red
  enemyZoneBorder: 'rgba(255, 68, 68, 0.5)',

  // Ally zone - tech blue tones
  allyZoneFill: 'rgba(0, 168, 232, 0.15)', // Tech blue
  allyZoneBorder: 'rgba(0, 168, 232, 0.5)',

  // Placement validity indicators
  validPlacement: '#22c55e', // Green - valid position
  invalidPlacement: '#ef4444', // Red - invalid position

  // Selection and indicators
  selectionRing: '#F5A623', // Amber highlight
  moveIndicator: 'rgba(0, 168, 232, 0.3)', // Blue movement ghost
  unitOutline: '#1A1A1A', // Dark outline
  boxSelectFill: 'rgba(0, 255, 136, 0.15)', // Coral green selection
  boxSelectBorder: 'rgba(0, 255, 136, 0.8)',

  // Health bar - high contrast for visibility
  healthBarBg: '#0A0E14', // Deep black
  healthBarOutline: '#2A323E', // Metal edge
  healthHigh: '#00CC66', // Bright green
  healthMedium: '#FFD700', // Warning gold
  healthLow: '#FF4444', // Critical red
  healthGhost: '#660000', // Dark red ghost damage
  hitFlash: '#FFFFFF', // White flash on hit
  damageNumber: '#FF6B6B', // Coral red damage
  healingNumber: '#00FF88', // Coral green healing
  damageNumberOutline: '#000000', // Black outline

  // Unit visuals
  unitShadow: '#0A0E14', // Deep shadow
  dustParticle: '#4A5668', // Metal dust/sparks

  // Arena zones
  noMansLand: '#1A2028', // Contested zone
  flankZone: '#151B22', // Flank zones
} as const;

// =============================================================================
// TEAM COLORS - Combat Factions
// =============================================================================

export type Team = 'player' | 'enemy';

/**
 * Team lore names for display purposes.
 * Player forces vs hostile combatants.
 */
export const TEAM_NAMES: Record<Team, string> = {
  player: 'Allied',
  enemy: 'Hostile',
} as const;

/**
 * Base colors for each team.
 * Player: Cool blue/teal (defensive, tactical)
 * Enemy: Warning red/orange (aggressive, hostile)
 */
export const TEAM_BASE_COLORS: Record<Team, string> = {
  player: '#00A8E8', // Tech blue
  enemy: '#FF4444', // Warning red
} as const;

export const TEAM_COLORS: Record<Team, FactionColor> = {
  player: { primary: '#00A8E8', secondary: '#0A2030' },
  enemy: { primary: '#FF4444', secondary: '#2A1A1A' },
} as const;

/**
 * Get the opposite team.
 */
export function getOppositeTeam(team: Team): Team {
  return team === 'player' ? 'enemy' : 'player';
}

/**
 * Get team base color.
 */
export function getTeamColor(team: Team): string {
  return TEAM_BASE_COLORS[team];
}

/**
 * Get team display name.
 */
export function getTeamName(team: Team): string {
  return TEAM_NAMES[team];
}

// =============================================================================
// UNIT TYPE COLORS - Mech Class Variations
// =============================================================================

export type UnitType =
  | 'hound'
  | 'fang'
  | 'crawler'
  | 'arclight'
  | 'marksman'
  | 'void_eye'
  | 'castle';

export interface UnitTypeColors {
  player: string;
  enemy: string;
}

/**
 * Unit colors are class-based variations of team colors.
 * Each class has distinct visual identity while maintaining team recognition.
 *
 * Player (blue spectrum): #0080B0 (dark) -> #00A8E8 (base) -> #40C8FF (light)
 * Enemy (red spectrum):   #AA2222 (dark) -> #FF4444 (base) -> #FF8888 (light)
 */
export const UNIT_TYPE_COLORS: Record<UnitType, UnitTypeColors> = {
  // Hound - assault class, base team color
  hound: {
    player: '#00A8E8', // Tech blue
    enemy: '#FF4444', // Warning red
  },
  // Fang - light ranged, lighter shade
  fang: {
    player: '#40C8FF', // Light blue
    enemy: '#FF7777', // Light red
  },
  // Crawler - swarm class, darker shade
  crawler: {
    player: '#0080B0', // Dark blue
    enemy: '#CC3333', // Dark red
  },
  // Arclight - artillery class, amber/orange tint
  arclight: {
    player: '#00B8A0', // Teal (heavy weapons)
    enemy: '#FF6600', // Orange (explosive)
  },
  // Marksman - sniper class, purple tint (precision)
  marksman: {
    player: '#6090E0', // Steel blue
    enemy: '#E04060', // Crimson
  },
  // Void Eye - recon class, cyan tint (sensors)
  void_eye: {
    player: '#00E8D0', // Bright cyan
    enemy: '#FF8844', // Amber-orange
  },
  // Castle - stationary structure, uniform steel color
  castle: {
    player: '#3A4452', // Dark steel
    enemy: '#3A4452', // Dark steel
  },
} as const;

// =============================================================================
// PROJECTILE COLORS
// =============================================================================

export const PROJECTILE_COLORS = {
  player: '#00FFFF', // Cyan energy
  enemy: '#FF6600', // Orange tracer
} as const;

// =============================================================================
// STRUCTURE COLORS (Castles/Bases)
// =============================================================================

export const CASTLE_COLORS = {
  player: '#3A4452', // Dark steel
  enemy: '#3A4452', // Dark steel
  door: '#2A323E', // Darker metal gate
  accent: '#FFD700', // Yellow - uniform accent for both sides
} as const;

// =============================================================================
// DEBUFF COLORS
// =============================================================================

export const DEBUFF_COLORS = {
  /** Color for structure death shockwave/EMP effect */
  shockwave: '#00A8E8', // Tech blue
  /** Color for the expanding shockwave ring */
  shockwaveRing: 'rgba(0, 168, 232, 0.6)',
  /** Inner glow color for shockwave */
  shockwaveGlow: 'rgba(0, 255, 255, 0.4)',
} as const;

// =============================================================================
// BATTLE RESULT COLORS - Industrial Victory/Defeat
// =============================================================================

export const WAX_SEAL_COLORS = {
  victory: {
    primary: '#00CC66', // Success green
    secondary: '#008844', // Dark green
    highlight: '#00FF88', // Bright highlight
    text: '#FFFFFF',
  },
  defeat: {
    primary: '#CC0000', // Critical red
    secondary: '#880000', // Dark red
    highlight: '#FF4444', // Warning highlight
    text: '#FFFFFF',
  },
  draw: {
    primary: '#4A5668', // Metal gray
    secondary: '#2A323E', // Dark metal
    highlight: '#6A7888', // Light metal
    text: '#FFFFFF',
  },
} as const;

/**
 * Get structure color based on team
 */
export function getCastleColor(_team: Team): string {
  return '#3A4452'; // Uniform steel for all structures
}

// =============================================================================
// DARK THEME UI COLORS - For React Components
// =============================================================================

export const DARK_THEME = {
  // Backgrounds (darkest to lightest)
  bgPrimary: '#0A0E14', // Deepest - main app bg
  bgSecondary: '#12171E', // Cards, panels
  bgTertiary: '#1A2028', // Buttons, inputs
  bgHover: '#242C38', // Hover states
  bgActive: '#2E3848', // Active/pressed states

  // Borders
  borderPrimary: '#1E252E',
  borderSecondary: '#2A3542',
  borderAccent: '#3A4552',

  // Text (lightest to darkest)
  textPrimary: '#E8ECF0', // Main text
  textSecondary: '#9AA4B0', // Labels, descriptions
  textTertiary: '#6A7480', // Muted, placeholders
  textDisabled: '#4A5460', // Disabled state

  // Accent colors
  accentGold: '#F5A623', // Primary accent (amber)
  accentGoldDark: '#CC8800', // Darker amber
  accentRed: '#FF4444', // Warning/hostile
  accentBlue: '#00A8E8', // Info/friendly
  accentGreen: '#00CC66', // Success
  accentPurple: '#9370DB', // Special/elite

  // Semantic colors
  success: '#00CC66',
  warning: '#FF8C00',
  danger: '#FF4444',
  info: '#00A8E8',
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Convert hex color to RGB values
 * Useful for Godot Color8(r, g, b) conversion
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert hex color to RGBA string with alpha
 */
export function hexToRgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/**
 * Lighten a hex color by a percentage (0-100)
 */
export function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const lighten = (value: number) =>
    Math.min(255, Math.floor(value + (255 - value) * (percent / 100)));

  const r = lighten(rgb.r).toString(16).padStart(2, '0');
  const g = lighten(rgb.g).toString(16).padStart(2, '0');
  const b = lighten(rgb.b).toString(16).padStart(2, '0');

  return `#${r}${g}${b}`;
}

/**
 * Darken a hex color by a percentage (0-100)
 */
export function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const darken = (value: number) => Math.max(0, Math.floor(value * (1 - percent / 100)));

  const r = darken(rgb.r).toString(16).padStart(2, '0');
  const g = darken(rgb.g).toString(16).padStart(2, '0');
  const b = darken(rgb.b).toString(16).padStart(2, '0');

  return `#${r}${g}${b}`;
}

/**
 * Get unit color based on team and type
 */
export function getUnitColor(team: Team, unitType: UnitType): string {
  return UNIT_TYPE_COLORS[unitType][team];
}

/**
 * Get projectile color based on team
 */
export function getProjectileColor(team: Team): string {
  return PROJECTILE_COLORS[team];
}
