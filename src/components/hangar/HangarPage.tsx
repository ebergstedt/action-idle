/**
 * Hangar Page Component
 *
 * Main hub for navigation between game sections.
 * Contains left navigation panel with section selection.
 */

import { ReactNode, useState } from 'react';
import { UI_COLORS, hexToRgba } from '../../core/theme/colors';
import { Panel3D } from '../ui/Panel3D';
import { Button3D } from '../ui/Button3D';
import { PanelTransition } from '../ui/PanelTransition';
import { HangarEffects } from './HangarEffects';
import { EffectsSettingsModal } from './EffectsSettingsModal';
import { DEFAULT_EFFECTS } from './effectsSettings';
import type { EffectsSettings } from './effectsSettings';
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
  const [showEffectsModal, setShowEffectsModal] = useState(false);
  const [effectsSettings, setEffectsSettings] = useState<EffectsSettings>(DEFAULT_EFFECTS);
  const [settingsHovered, setSettingsHovered] = useState(false);

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
      <div
        className="absolute inset-0"
        style={{ backgroundColor: hexToRgba(UI_COLORS.black, 0.4) }}
      />

      {/* Visual effects */}
      <HangarEffects settings={effectsSettings} />

      {/* Settings cog button */}
      <button
        onClick={() => setShowEffectsModal(true)}
        className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded transition-colors"
        style={{
          backgroundColor: settingsHovered
            ? hexToRgba(UI_COLORS.accentPrimary, 0.2)
            : hexToRgba(UI_COLORS.black, 0.5),
          color: settingsHovered ? UI_COLORS.accentPrimary : UI_COLORS.textSecondary,
        }}
        onMouseEnter={() => setSettingsHovered(true)}
        onMouseLeave={() => setSettingsHovered(false)}
        title="Visual Effects Settings"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

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
                      currentSection === item.id ? hexToRgba(UI_COLORS.white, 0.1) : 'transparent',
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
                    <span className="ml-2 text-sm" style={{ color: UI_COLORS.textSecondary }}>
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

          {/* Main content area with transition */}
          <div className="flex-1 min-w-0">
            <PanelTransition transitionKey={currentSection}>{children}</PanelTransition>
          </div>
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

      {/* Effects settings modal */}
      <EffectsSettingsModal
        isOpen={showEffectsModal}
        onClose={() => setShowEffectsModal(false)}
        settings={effectsSettings}
        onSettingsChange={setEffectsSettings}
      />
    </div>
  );
}
