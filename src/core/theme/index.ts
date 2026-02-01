// Re-export colors but rename conflicting types to avoid collisions with battle/physics modules
export {
  // Faction colors
  FACTION_COLORS,
  type FactionColor,

  // UI colors
  UI_COLORS,
  ENV_COLORS,
  ARENA_COLORS,
  DARK_THEME,

  // Team/Unit colors (prefixed to avoid conflicts with battle types)
  TEAM_COLORS as THEME_TEAM_COLORS,
  UNIT_TYPE_COLORS,
  PROJECTILE_COLORS,

  // Utility functions
  hexToRgb,
  hexToRgba,
  lightenColor,
  darkenColor,
  getUnitColor,
  getProjectileColor,
} from './colors';

// Also export the original names for direct imports from theme/colors
export type { Team as ThemeTeam, UnitType as ThemeUnitType, UnitTypeColors } from './colors';
