import { useEffect, useRef, useState } from 'react';
import { useBattle } from '../../hooks/useBattle';
import { BattleCanvas } from './BattleCanvas';
import { Unit } from '../../core/battle';
import { UNIT_TYPE_COLORS, UI_COLORS, ARENA_COLORS } from '../../core/theme/colors';

// Parchment theme styles - dark text on light background for readability
const styles = {
  text: { color: UI_COLORS.inkBlack }, // Primary text - black for readability
  textFaded: { color: UI_COLORS.inkBrown }, // Secondary text - brown
  textDark: { color: UI_COLORS.inkBlack }, // Emphasis text - black
  border: { borderColor: UI_COLORS.parchmentDark },
  panelBg: { backgroundColor: UI_COLORS.parchmentShadow },
  buttonPrimary: {
    backgroundColor: UI_COLORS.goldPrimary,
    color: UI_COLORS.inkBlack,
  },
  buttonSecondary: {
    backgroundColor: UI_COLORS.parchmentDark,
    color: UI_COLORS.inkBlack,
  },
  healthBarBg: { backgroundColor: UI_COLORS.inkBrown },
};

export function BattleView() {
  const { state, selectedUnitId, start, stop, reset, spawnWave, moveUnit, selectUnit } =
    useBattle();

  const containerRef = useRef<HTMLDivElement>(null);
  const [arenaSize, setArenaSize] = useState({ width: 600, height: 600 });

  const [isArenaSizeStable, setIsArenaSizeStable] = useState(false);
  const hasSpawnedRef = useRef(false);
  const sizeStableTimeoutRef = useRef<number | null>(null);

  // Calculate arena size based on container - optimized for 16:9 displays
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const availableHeight = rect.height - 40; // Leave space for unit count
        const availableWidth = rect.width - 20;

        // Use available space, maintaining reasonable proportions
        // For PC gaming: wider arenas work well
        const width = Math.max(600, Math.min(availableWidth, availableHeight * 1.4));
        const height = Math.max(500, Math.min(availableHeight, width * 0.75));

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

  const playerCount = state.units.filter((u) => u.team === 'player').length;
  const enemyCount = state.units.filter((u) => u.team === 'enemy').length;
  const selectedUnit = state.units.find((u) => u.id === selectedUnitId);

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
          selectedUnitId={selectedUnitId}
          onSelectUnit={selectUnit}
        />
        <div className="flex gap-4 text-sm flex-shrink-0" style={styles.text}>
          <span style={{ color: ARENA_COLORS.healthHigh }}>Allies: {playerCount}</span>
          <span style={styles.textFaded}>|</span>
          <span style={{ color: ARENA_COLORS.healthLow }}>Enemies: {enemyCount}</span>
        </div>
      </div>

      {/* Right side - Info Panel */}
      <div className="w-80 flex-shrink-0 rounded-lg p-5 overflow-y-auto" style={styles.panelBg}>
        {selectedUnit ? (
          <UnitInfoPanel unit={selectedUnit} onDeselect={() => selectUnit(null)} />
        ) : (
          <ControlsPanel
            isRunning={state.isRunning}
            hasStarted={state.hasStarted}
            onStart={handleStartBattle}
            onStop={stop}
            onReset={handleReset}
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
          className="px-2 py-0.5 rounded text-xs"
          style={{
            backgroundColor:
              unit.team === 'player' ? ARENA_COLORS.healthHigh : ARENA_COLORS.healthLow,
            color: '#FFFFFF',
          }}
        >
          {unit.team === 'player' ? 'Allied' : 'Enemy'}
        </span>
      </div>

      {/* Health bar */}
      <div>
        <div className="flex justify-between text-xs mb-1" style={styles.textFaded}>
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
            <div className="text-xs mb-1" style={styles.textFaded}>
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
              <span style={{ color: UI_COLORS.goldDark, fontWeight: 'bold' }}>
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
            <div className="text-xs mb-1" style={styles.textFaded}>
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
              <span style={{ color: UI_COLORS.goldDark, fontWeight: 'bold' }}>
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

      {/* Position */}
      <div
        className="text-xs pt-2"
        style={{ ...styles.textFaded, borderTop: `1px solid ${UI_COLORS.parchmentDark}` }}
      >
        Position: ({Math.round(unit.position.x)}, {Math.round(unit.position.y)})
      </div>
    </div>
  );
}

interface ControlsPanelProps {
  isRunning: boolean;
  hasStarted: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

function ControlsPanel({ isRunning, hasStarted, onStart, onStop, onReset }: ControlsPanelProps) {
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
              color: '#FFFFFF',
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

      <div className="pt-4" style={{ borderTop: `1px solid ${UI_COLORS.parchmentDark}` }}>
        <h4 className="text-sm font-semibold mb-2" style={styles.textFaded}>
          Unit Types
        </h4>
        <div className="space-y-2 text-xs" style={styles.text}>
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
        <div className="text-xs mt-2" style={{ color: UI_COLORS.goldDark }}>
          Tip: Drag allied units to reposition before starting
        </div>
      )}
    </div>
  );
}
