/**
 * Hangar Page Component
 *
 * Main hub for navigation between game sections.
 * Contains left navigation panel with section selection.
 */

import { ReactNode } from 'react';
import { UI_COLORS } from '../../core/theme/colors';
import { Panel3D } from '../ui/Panel3D';
import { Button3D } from '../ui/Button3D';
import hangarBg from '../../assets/hangar.png';

export type HangarSection = 'garage' | 'assembly' | 'arena' | 'virtuality';

interface HangarPageProps {
  /** Currently selected section */
  currentSection: HangarSection;
  /** Called when a section is selected */
  onSelectSection: (section: HangarSection) => void;
  /** Content to render in the main area */
  children: ReactNode;
  /** Current VEST amount */
  vest: number;
  /** Highest wave reached */
  highestWave: number;
  /** Called when Sortie button is clicked */
  onSortie: () => void;
}

interface NavItem {
  id: HangarSection;
  label: string;
  available: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'garage', label: 'GARAGE', available: true },
  { id: 'assembly', label: 'ASSEMBLY', available: false },
  { id: 'arena', label: 'ARENA', available: false },
  { id: 'virtuality', label: 'VIRTUALITY', available: false },
];

export function HangarPage({
  currentSection,
  onSelectSection,
  children,
  vest,
  highestWave,
  onSortie,
}: HangarPageProps) {
  return (
    <div
      className="flex flex-col h-full relative"
      style={{
        backgroundImage: `url(${hangarBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }} />

      {/* Content layer */}
      <div className="relative z-10 flex flex-col h-full p-4 gap-4">
        {/* Main row */}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Left navigation panel */}
          <Panel3D className="w-48 flex-shrink-0 flex flex-col">
            {/* Hangar title */}
            <div
              className="text-lg font-bold tracking-widest mb-6 pb-2"
              style={{
                color: UI_COLORS.accentPrimary,
                borderBottom: `1px solid ${UI_COLORS.metalDark}`,
              }}
            >
              HANGAR
            </div>

            {/* Navigation items */}
            <div className="flex flex-col gap-2">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => item.available && onSelectSection(item.id)}
                  disabled={!item.available}
                  className="text-left py-2 px-3 text-sm font-medium tracking-wider transition-colors"
                  style={{
                    backgroundColor:
                      currentSection === item.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    color: !item.available
                      ? UI_COLORS.textSecondary
                      : currentSection === item.id
                        ? UI_COLORS.accentPrimary
                        : UI_COLORS.textPrimary,
                    borderLeft:
                      currentSection === item.id
                        ? `2px solid ${UI_COLORS.accentPrimary}`
                        : '2px solid transparent',
                    cursor: item.available ? 'pointer' : 'not-allowed',
                  }}
                >
                  {item.label}
                  {!item.available && (
                    <span className="ml-2 text-xs" style={{ color: UI_COLORS.textSecondary }}>
                      [LOCKED]
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Stats at bottom */}
            <div
              className="pt-4 mt-4 space-y-2"
              style={{ borderTop: `1px solid ${UI_COLORS.metalDark}` }}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm tracking-wide" style={{ color: UI_COLORS.textSecondary }}>
                  VEST
                </span>
                <span className="font-mono font-bold" style={{ color: UI_COLORS.accentPrimary }}>
                  {vest.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm tracking-wide" style={{ color: UI_COLORS.textSecondary }}>
                  WAVE
                </span>
                <span className="font-mono" style={{ color: UI_COLORS.textPrimary }}>
                  {highestWave}
                </span>
              </div>
            </div>
          </Panel3D>

          {/* Main content area */}
          <div className="flex-1 min-w-0">{children}</div>
        </div>

        {/* Bottom bar with Sortie */}
        <Panel3D
          className="h-14 flex-shrink-0"
          innerClassName="flex items-center justify-end px-4"
          padding="none"
          showMarkers={false}
        >
          <Button3D size="lg" onClick={onSortie}>
            SORTIE
          </Button3D>
        </Panel3D>
      </div>
    </div>
  );
}
