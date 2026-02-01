import { useEffect, useRef, useState } from 'react';
import { useBattle, BattleSpeed } from '../../hooks/useBattle';
import { BattleCanvas } from './BattleCanvas';
import { Unit } from '../../core/battle';
import {
  MIN_ARENA_WIDTH,
  MIN_ARENA_HEIGHT,
  ARENA_ASPECT_RATIO,
  SHOCKWAVE_DEBUFF_MOVE_SPEED,
  SHOCKWAVE_DEBUFF_DAMAGE,
} from '../../core/battle/BattleConfig';
import {
  UNIT_TYPE_COLORS,
  UI_COLORS,
  ARENA_COLORS,
  DEBUFF_COLORS,
  hexToRgba,
} from '../../core/theme/colors';

// Parchment theme styles - all text black for readability
const styles = {
  text: { color: UI_COLORS.black },
  textFaded: { color: UI_COLORS.black },
  textDark: { color: UI_COLORS.black },
  border: { borderColor: UI_COLORS.parchmentDark },
  panelBg: { backgroundColor: UI_COLORS.parchmentShadow },
  buttonPrimary: {
    backgroundColor: UI_COLORS.goldPrimary,
    color: UI_COLORS.black,
  },
  buttonSecondary: {
    backgroundColor: UI_COLORS.parchmentDark,
    color: UI_COLORS.black,
  },
  healthBarBg: { backgroundColor: UI_COLORS.black },
};

export function BattleView() {
  const {
    state,
    selectedUnitIds,
    battleSpeed,
    start,
    stop,
    reset,
    spawnWave,
    moveUnit,
    moveUnits,
    selectUnit,
    selectUnits,
    setBattleSpeed,
  } = useBattle();

  const containerRef = useRef<HTMLDivElement>(null);
  const [arenaSize, setArenaSize] = useState({ width: 600, height: 600 });

  const [isArenaSizeStable, setIsArenaSizeStable] = useState(false);
  const hasSpawnedRef = useRef(false);
  const sizeStableTimeoutRef = useRef<number | null>(null);

  // Calculate arena size based on container - optimized for wide screens
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const availableHeight = rect.height - 10; // Small margin
        const availableWidth = rect.width - 20;

        // Use most of available width, cap height to maintain playable aspect ratio
        // Wider arenas work great for tactical gameplay on PC
        const width = Math.max(MIN_ARENA_WIDTH, availableWidth);
        const height = Math.max(
          MIN_ARENA_HEIGHT,
          Math.min(availableHeight, width * ARENA_ASPECT_RATIO)
        );

        setArenaSize({ width, height });

        // Mark size as stable after a short delay (no more resizes)
        if (sizeStableTimeoutRef.current) {
          clearTimeout(sizeStableTimeoutRef.current);
        }
        sizeStableTimeoutRef.current = window.setTimeout(() => {
          setIsArenaSizeStable(true);
        }, 100);
      }
    };

    // Use ResizeObserver for more reliable size updates
    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // Initial size calculation
    setTimeout(updateSize, 0);

    return () => {
      observer.disconnect();
      if (sizeStableTimeoutRef.current) {
        clearTimeout(sizeStableTimeoutRef.current);
      }
    };
  }, []);

  // Auto-spawn units once arena size is stable
  useEffect(() => {
    if (isArenaSizeStable && state.units.length === 0 && !hasSpawnedRef.current) {
      hasSpawnedRef.current = true;
      spawnWave(arenaSize.width, arenaSize.height);
    }
  }, [isArenaSizeStable, arenaSize, state.units.length, spawnWave]);

  // Only show unit info panel if exactly one unit is selected
  const selectedUnit =
    selectedUnitIds.length === 1 ? state.units.find((u) => u.id === selectedUnitIds[0]) : null;

  const handleStartBattle = () => {
    start();
  };

  const handleReset = () => {
    reset();
    // Let the useEffect handle respawning when units.length becomes 0
    hasSpawnedRef.current = false;
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Left side - Arena (2/3) */}
      <div
        ref={containerRef}
        className="flex-[2] flex flex-col items-center justify-center gap-2 min-w-0"
      >
        <BattleCanvas
          state={state}
          width={arenaSize.width}
          height={arenaSize.height}
          onUnitMove={moveUnit}
          onUnitsMove={moveUnits}
          selectedUnitIds={selectedUnitIds}
          onSelectUnit={selectUnit}
          onSelectUnits={selectUnits}
        />
      </div>

      {/* Right side - Info Panel */}
      <div className="w-80 flex-shrink-0 rounded-lg p-5 overflow-y-auto" style={styles.panelBg}>
        {selectedUnit ? (
          <UnitInfoPanel unit={selectedUnit} onDeselect={() => selectUnits([])} />
        ) : (
          <ControlsPanel
            isRunning={state.isRunning}
            hasStarted={state.hasStarted}
            battleSpeed={battleSpeed}
            onStart={handleStartBattle}
            onStop={stop}
            onReset={handleReset}
            onSpeedChange={setBattleSpeed}
          />
        )}
      </div>
    </div>
  );
}

interface UnitInfoPanelProps {
  unit: Unit;
  onDeselect: () => void;
}

function UnitInfoPanel({ unit, onDeselect }: UnitInfoPanelProps) {
  const healthPercent = Math.round((unit.health / unit.stats.maxHealth) * 100);

  return (
    <div className="flex flex-col gap-4" style={styles.text}>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold capitalize" style={{ color: unit.color }}>
          {unit.type}
        </h3>
        <button onClick={onDeselect} className="text-sm hover:underline" style={styles.textFaded}>
          Close
        </button>
      </div>

      <div className="text-sm">
        <span
          className="px-2 py-0.5 rounded text-sm"
          style={{
            backgroundColor:
              unit.team === 'player' ? ARENA_COLORS.healthHigh : ARENA_COLORS.healthLow,
            color: UI_COLORS.white,
          }}
        >
          {unit.team === 'player' ? 'Allied' : 'Enemy'}
        </span>
      </div>

      {/* Health bar */}
      <div>
        <div className="flex justify-between text-sm mb-1" style={styles.textFaded}>
          <span>Health</span>
          <span>
            {Math.round(unit.health)} / {unit.stats.maxHealth}
          </span>
        </div>
        <div className="h-3 rounded overflow-hidden" style={styles.healthBarBg}>
          <div
            className="h-full transition-all"
            style={{
              width: `${healthPercent}%`,
              backgroundColor:
                healthPercent > 50
                  ? ARENA_COLORS.healthHigh
                  : healthPercent > 25
                    ? ARENA_COLORS.healthMedium
                    : ARENA_COLORS.healthLow,
            }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-2 text-sm">
        {/* Melee Attack */}
        {unit.stats.melee && (
          <div
            className="pb-2 mb-2"
            style={{ borderBottom: `1px solid ${UI_COLORS.parchmentDark}` }}
          >
            <div className="text-sm mb-1" style={styles.textFaded}>
              Melee Attack
            </div>
            <div className="flex justify-between">
              <span style={styles.textFaded}>Damage</span>
              <span style={styles.textDark}>{unit.stats.melee.damage}</span>
            </div>
            <div className="flex justify-between">
              <span style={styles.textFaded}>Speed</span>
              <span style={styles.textDark}>{unit.stats.melee.attackSpeed}/s</span>
            </div>
            <div className="flex justify-between">
              <span style={styles.textFaded}>DPS</span>
              <span style={{ color: UI_COLORS.black, fontWeight: 'bold' }}>
                {(unit.stats.melee.damage * unit.stats.melee.attackSpeed).toFixed(1)}
              </span>
            </div>
          </div>
        )}

        {/* Ranged Attack */}
        {unit.stats.ranged && (
          <div
            className="pb-2 mb-2"
            style={{ borderBottom: `1px solid ${UI_COLORS.parchmentDark}` }}
          >
            <div className="text-sm mb-1" style={styles.textFaded}>
              Ranged Attack
            </div>
            <div className="flex justify-between">
              <span style={styles.textFaded}>Damage</span>
              <span style={styles.textDark}>{unit.stats.ranged.damage}</span>
            </div>
            <div className="flex justify-between">
              <span style={styles.textFaded}>Speed</span>
              <span style={styles.textDark}>{unit.stats.ranged.attackSpeed}/s</span>
            </div>
            <div className="flex justify-between">
              <span style={styles.textFaded}>Range</span>
              <span style={styles.textDark}>{unit.stats.ranged.range}px</span>
            </div>
            <div className="flex justify-between">
              <span style={styles.textFaded}>DPS</span>
              <span style={{ color: UI_COLORS.black, fontWeight: 'bold' }}>
                {(unit.stats.ranged.damage * unit.stats.ranged.attackSpeed).toFixed(1)}
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <span style={styles.textFaded}>Move Speed</span>
          <span style={styles.textDark}>{unit.stats.moveSpeed}</span>
        </div>
      </div>

      {/* Active Modifiers (Buffs/Debuffs) */}
      {unit.activeModifiers.length > 0 && (
        <div className="pt-2" style={{ borderTop: `1px solid ${UI_COLORS.parchmentDark}` }}>
          <div className="text-sm mb-2" style={styles.textFaded}>
            Active Effects
          </div>
          <div className="space-y-2">
            {unit.activeModifiers.map((mod) => (
              <ModifierDisplay
                key={mod.id}
                sourceId={mod.sourceId}
                remainingDuration={mod.remainingDuration}
              />
            ))}
          </div>
        </div>
      )}

      {/* Position */}
      <div
        className="text-sm pt-2"
        style={{ ...styles.textFaded, borderTop: `1px solid ${UI_COLORS.parchmentDark}` }}
      >
        Position: ({Math.round(unit.position.x)}, {Math.round(unit.position.y)})
      </div>
    </div>
  );
}

interface ModifierDisplayProps {
  sourceId: string;
  remainingDuration: number;
}

function ModifierDisplay({ sourceId, remainingDuration }: ModifierDisplayProps) {
  // Map source IDs to display info
  const modifierInfo = getModifierDisplayInfo(sourceId);

  return (
    <div
      className="flex items-start gap-2 p-2 rounded text-sm"
      style={{ backgroundColor: modifierInfo.bgColor }}
    >
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: modifierInfo.iconBgColor }}
      >
        <span style={{ color: UI_COLORS.white, fontSize: '12px' }}>{modifierInfo.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold" style={{ color: modifierInfo.textColor }}>
          {modifierInfo.name}
        </div>
        <div className="text-sm" style={{ color: modifierInfo.textColor, opacity: 0.8 }}>
          {modifierInfo.effects.map((effect, i) => (
            <div key={i}>{effect}</div>
          ))}
        </div>
        <div className="text-sm mt-1" style={{ color: modifierInfo.textColor, opacity: 0.6 }}>
          {remainingDuration.toFixed(1)}s remaining
        </div>
      </div>
    </div>
  );
}

function getModifierDisplayInfo(sourceId: string): {
  name: string;
  icon: string;
  effects: string[];
  bgColor: string;
  iconBgColor: string;
  textColor: string;
} {
  switch (sourceId) {
    case 'castle_death_shockwave':
      return {
        name: 'Castle Collapse',
        icon: 'X',
        effects: [
          `${Math.abs(SHOCKWAVE_DEBUFF_MOVE_SPEED * 100)}% Move Speed`,
          `${Math.abs(SHOCKWAVE_DEBUFF_DAMAGE * 100)}% Damage`,
        ],
        bgColor: hexToRgba(DEBUFF_COLORS.shockwave, 0.2),
        iconBgColor: DEBUFF_COLORS.shockwave,
        textColor: UI_COLORS.black,
      };
    default:
      return {
        name: sourceId,
        icon: '?',
        effects: ['Unknown effect'],
        bgColor: 'rgba(128, 128, 128, 0.2)',
        iconBgColor: '#808080',
        textColor: UI_COLORS.black,
      };
  }
}

interface ControlsPanelProps {
  isRunning: boolean;
  hasStarted: boolean;
  battleSpeed: BattleSpeed;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onSpeedChange: (speed: BattleSpeed) => void;
}

function ControlsPanel({
  isRunning,
  hasStarted,
  battleSpeed,
  onStart,
  onStop,
  onReset,
  onSpeedChange,
}: ControlsPanelProps) {
  const speeds: BattleSpeed[] = [0.5, 1, 5];

  return (
    <div className="flex flex-col gap-4" style={styles.text}>
      <h3 className="text-lg font-bold" style={styles.textDark}>
        Battle Controls
      </h3>

      <div className="flex flex-col gap-2">
        {!isRunning ? (
          <button
            onClick={onStart}
            className="w-full px-4 py-2 rounded font-semibold hover:opacity-90"
            style={{
              backgroundColor: ARENA_COLORS.healthHigh,
              color: UI_COLORS.white,
            }}
          >
            {hasStarted ? 'Resume' : 'Start Battle'}
          </button>
        ) : (
          <button
            onClick={onStop}
            className="w-full px-4 py-2 rounded font-semibold hover:opacity-90"
            style={{
              backgroundColor: ARENA_COLORS.healthMedium,
              color: UI_COLORS.inkBlack,
            }}
          >
            Pause
          </button>
        )}

        <button
          onClick={onReset}
          className="w-full px-4 py-2 rounded font-semibold hover:opacity-90"
          style={styles.buttonSecondary}
        >
          Reset
        </button>
      </div>

      {/* Battle Speed Control */}
      <div className="pt-4" style={{ borderTop: `1px solid ${UI_COLORS.parchmentDark}` }}>
        <h4 className="text-sm font-semibold mb-2" style={styles.textFaded}>
          Battle Speed
        </h4>
        <div className="flex gap-2">
          {speeds.map((speed) => (
            <button
              key={speed}
              onClick={() => onSpeedChange(speed)}
              className="flex-1 px-3 py-1.5 rounded font-semibold text-sm transition-all"
              style={{
                backgroundColor:
                  battleSpeed === speed ? UI_COLORS.goldPrimary : UI_COLORS.parchmentDark,
                color: UI_COLORS.black,
                border:
                  battleSpeed === speed
                    ? `2px solid ${UI_COLORS.goldDark}`
                    : '2px solid transparent',
              }}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      <div className="pt-4" style={{ borderTop: `1px solid ${UI_COLORS.parchmentDark}` }}>
        <h4 className="text-sm font-semibold mb-2" style={styles.textFaded}>
          Unit Types
        </h4>
        <div className="space-y-2 text-sm" style={styles.text}>
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3"
              style={{ backgroundColor: UNIT_TYPE_COLORS.warrior.player }}
            />
            <span>Warrior - Tanky melee</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent"
              style={{ borderBottomColor: UNIT_TYPE_COLORS.archer.player }}
            />
            <span>Archer - Ranged DPS</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: UNIT_TYPE_COLORS.knight.player }}
            />
            <span>Knight - Fast melee</span>
          </div>
        </div>
      </div>

      {!hasStarted && (
        <div className="text-sm mt-2" style={{ color: UI_COLORS.black }}>
          Tip: Drag allied units to reposition before starting
        </div>
      )}
    </div>
  );
}
