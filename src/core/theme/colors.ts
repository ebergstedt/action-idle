/**
 * Centralized Color Palette - Godot Portable
 *
 * Based on Medieval II: Total War faction colors.
 * All colors are defined as hex strings for easy portability to Godot.
 *
 * Godot Migration:
 * - Convert this file to GDScript or C#
 * - Replace hex strings with Color.html("#RRGGBB") or Color8(r, g, b)
 * - Example: Color.html("#C80000") or Color8(200, 0, 0)
 */

// =============================================================================
// FACTION COLORS - Medieval II: Total War Palette
// =============================================================================

export interface FactionColor {
  primary: string;
  secondary: string;
}

export const FACTION_COLORS: Record<string, FactionColor> = {
  // Western European Factions
  england: { primary: '#C80000', secondary: '#FFFFFF' },
  france: { primary: '#0000A0', secondary: '#FFFF00' },
  hre: { primary: '#1E1E1E', secondary: '#FFFF00' },
  spain: { primary: '#FFFF00', secondary: '#C80000' },
  portugal: { primary: '#FFFFFF', secondary: '#0000C8' },
  scotland: { primary: '#00004B', secondary: '#FFFFFF' },
  denmark: { primary: '#820000', secondary: '#FFFFFF' },

  // Mediterranean & Italian Factions
  milan: { primary: '#006400', secondary: '#FFFFFF' },
  venice: { primary: '#960000', secondary: '#0000A0' },
  sicily: { primary: '#BEBEBE', secondary: '#000000' },
  byzantium: { primary: '#4B0082', secondary: '#FFA500' },

  // Eastern European & Middle Eastern Factions
  russia: { primary: '#E1E1E1', secondary: '#C80000' },
  poland: { primary: '#C80000', secondary: '#FFFFFF' },
  hungary: { primary: '#FF6464', secondary: '#006400' },
  moors: { primary: '#FFA500', secondary: '#FFFFFF' },
  turks: { primary: '#90EE90', secondary: '#000000' },
  egypt: { primary: '#FFFFE0', secondary: '#000000' },

  // Special & Non-Playable Factions
  papalStates: { primary: '#FFFFFF', secondary: '#FFFF00' },
  aztecs: { primary: '#008080', secondary: '#FFFF00' },
  mongols: { primary: '#B49632', secondary: '#000000' },
  timurids: { primary: '#000000', secondary: '#C80000' },
  rebels: { primary: '#649664', secondary: '#000000' },
} as const;

// =============================================================================
// UI COLORS - Medieval Parchment Theme
// =============================================================================

export const UI_COLORS = {
  // Parchment backgrounds
  parchmentBase: '#D8C9A6',
  parchmentShadow: '#B8A681',
  parchmentDark: '#A89871',

  // Ink and text
  inkBrown: '#5C4033',
  inkBlack: '#2C1810',
  inkFaded: '#8B7355',

  // Accents
  goldPrimary: '#FFD700',
  goldDark: '#B8860B',
  goldLight: '#FFEC8B',

  // Status colors
  successGreen: '#4CAF50',
  warningYellow: '#FFC107',
  dangerRed: '#F44336',
  infoBlue: '#2196F3',
} as const;

// =============================================================================
// ENVIRONMENTAL COLORS - Campaign Map
// =============================================================================

export const ENV_COLORS = {
  seaDeepNavy: '#1A2B44',
  seaShallow: '#2E4A62',
  forestGreen: '#2D4C1E',
  desertOchre: '#C2A366',
  mountainSlate: '#6F7275',
  grassland: '#4A7023',
  snow: '#F0F8FF',
} as const;

// =============================================================================
// GAME COLORS - Battle Arena
// =============================================================================

export const ARENA_COLORS = {
  // Background - parchment/paper like medieval maps
  background: UI_COLORS.parchmentBase, // #D8C9A6 - warm paper yellow
  gridLine: UI_COLORS.parchmentShadow, // #B8A681 - subtle darker lines

  // Zones - using faction colors with better visibility
  // Enemy (England red) - danger tones at top
  enemyZoneFill: 'rgba(200, 0, 0, 0.20)', // England primary red
  enemyZoneBorder: 'rgba(200, 0, 0, 0.6)',

  // Ally (Milan green) - friendly tones at bottom
  allyZoneFill: 'rgba(0, 100, 0, 0.20)', // Milan primary green
  allyZoneBorder: 'rgba(0, 100, 0, 0.6)',

  // Selection and indicators
  selectionRing: UI_COLORS.goldPrimary,
  moveIndicator: 'rgba(92, 64, 51, 0.3)', // Ink brown tint for allied units
  unitOutline: UI_COLORS.inkBrown, // #5C4033 - dark ink outline

  // Health bar
  healthBarBg: '#000000', // Black background for contrast
  healthBarOutline: '#000000', // Black outline
  healthHigh: '#22C55E', // Bright green (easy to see)
  healthMedium: '#EAB308', // Bright yellow (warning)
  healthLow: '#EF4444', // Bright red (danger)
} as const;

// =============================================================================
// TEAM COLORS - Player vs Enemy
// =============================================================================

export type Team = 'player' | 'enemy';

export const TEAM_COLORS: Record<Team, FactionColor> = {
  // Player uses England colors (red/white) - classic protagonist
  player: FACTION_COLORS.england,
  // Enemy uses France colors (blue/yellow) - classic antagonist
  enemy: FACTION_COLORS.france,
} as const;

// =============================================================================
// UNIT TYPE COLORS - By Unit Class
// =============================================================================

export type UnitType = 'warrior' | 'archer' | 'knight';

export interface UnitTypeColors {
  player: string;
  enemy: string;
}

export const UNIT_TYPE_COLORS: Record<UnitType, UnitTypeColors> = {
  // Warriors - core infantry, use primary team colors
  warrior: {
    player: FACTION_COLORS.england.primary, // England Red #C80000
    enemy: FACTION_COLORS.france.primary, // France Blue #0000A0
  },
  // Archers - ranged support, use secondary colors for variety
  archer: {
    player: FACTION_COLORS.milan.primary, // Milan Green #006400
    enemy: FACTION_COLORS.turks.primary, // Turks Light Green #90EE90
  },
  // Knights - elite cavalry, use purple/gold tones
  knight: {
    player: FACTION_COLORS.byzantium.primary, // Byzantium Purple #4B0082
    enemy: FACTION_COLORS.mongols.primary, // Mongols Gold #B49632
  },
} as const;

// =============================================================================
// PROJECTILE COLORS
// =============================================================================

export const PROJECTILE_COLORS = {
  player: FACTION_COLORS.turks.primary, // Light green
  enemy: FACTION_COLORS.hungary.primary, // Light red/pink
} as const;

// =============================================================================
// DARK THEME UI COLORS - For React Components
// =============================================================================

export const DARK_THEME = {
  // Backgrounds (darkest to lightest)
  bgPrimary: '#0F0F1A', // Darkest - main app bg
  bgSecondary: '#1A1A2E', // Cards, panels
  bgTertiary: '#252540', // Buttons, inputs
  bgHover: '#2F2F50', // Hover states
  bgActive: '#3A3A60', // Active/pressed states

  // Borders
  borderPrimary: '#2A2A4E',
  borderSecondary: '#3A3A6E',
  borderAccent: '#4A4A8E',

  // Text (lightest to darkest)
  textPrimary: '#F5F5F5', // Main text
  textSecondary: '#B8B8C8', // Labels, descriptions
  textTertiary: '#808090', // Muted, placeholders
  textDisabled: '#505060', // Disabled state

  // Accent colors (using faction colors)
  accentGold: UI_COLORS.goldPrimary,
  accentGoldDark: UI_COLORS.goldDark,
  accentRed: FACTION_COLORS.england.primary,
  accentBlue: FACTION_COLORS.france.primary,
  accentGreen: FACTION_COLORS.milan.primary,
  accentPurple: FACTION_COLORS.byzantium.primary,

  // Semantic colors
  success: UI_COLORS.successGreen,
  warning: UI_COLORS.warningYellow,
  danger: UI_COLORS.dangerRed,
  info: UI_COLORS.infoBlue,
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
