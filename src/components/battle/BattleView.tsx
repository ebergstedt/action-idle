import { useEffect, useRef, useState } from 'react';
import { useBattle } from '../../hooks/useBattle';
import { BattleCanvas } from './BattleCanvas';
import { Unit } from '../../core/battle';

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
        <div className="flex gap-4 text-sm flex-shrink-0">
          <span className="text-blue-400">Allies: {playerCount}</span>
          <span className="text-gray-500">|</span>
          <span className="text-red-400">Enemies: {enemyCount}</span>
        </div>
      </div>

      {/* Right side - Info Panel */}
      <div className="w-80 flex-shrink-0 bg-gray-800 rounded-lg p-5 overflow-y-auto">
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
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold capitalize" style={{ color: unit.color }}>
          {unit.type}
        </h3>
        <button onClick={onDeselect} className="text-gray-500 hover:text-gray-300 text-sm">
          Close
        </button>
      </div>

      <div className="text-sm text-gray-400">
        <span
          className={`px-2 py-0.5 rounded text-xs ${unit.team === 'player' ? 'bg-blue-900 text-blue-300' : 'bg-red-900 text-red-300'}`}
        >
          {unit.team === 'player' ? 'Allied' : 'Enemy'}
        </span>
      </div>

      {/* Health bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Health</span>
          <span>
            {Math.round(unit.health)} / {unit.stats.maxHealth}
          </span>
        </div>
        <div className="h-3 bg-gray-700 rounded overflow-hidden">
          <div
            className={`h-full transition-all ${healthPercent > 50 ? 'bg-green-500' : healthPercent > 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${healthPercent}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Damage</span>
          <span className="text-gray-200">{unit.stats.damage}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Attack Speed</span>
          <span className="text-gray-200">{unit.stats.attackSpeed}/s</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">DPS</span>
          <span className="text-yellow-400">
            {(unit.stats.damage * unit.stats.attackSpeed).toFixed(1)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Range</span>
          <span className="text-gray-200">
            {unit.stats.attackType === 'melee' ? 'Melee' : `${unit.stats.range}px`}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Move Speed</span>
          <span className="text-gray-200">{unit.stats.moveSpeed}</span>
        </div>
      </div>

      {/* Position */}
      <div className="text-xs text-gray-600 border-t border-gray-700 pt-2">
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
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-bold text-gray-200">Battle Controls</h3>

      <div className="flex flex-col gap-2">
        {!isRunning ? (
          <button
            onClick={onStart}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 rounded font-semibold"
          >
            {hasStarted ? 'Resume' : 'Start Battle'}
          </button>
        ) : (
          <button
            onClick={onStop}
            className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded font-semibold"
          >
            Pause
          </button>
        )}

        <button
          onClick={onReset}
          className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded font-semibold"
        >
          Reset
        </button>
      </div>

      <div className="border-t border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-gray-400 mb-2">Unit Types</h4>
        <div className="space-y-2 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 bg-blue-500"></span>
            <span>Warrior - Tanky melee</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-green-500"></span>
            <span>Archer - Ranged DPS</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 bg-purple-500 rounded-full"></span>
            <span>Knight - Fast melee</span>
          </div>
        </div>
      </div>

      {!hasStarted && (
        <div className="text-xs text-yellow-600 mt-2">
          Tip: Drag allied units to reposition before starting
        </div>
      )}
    </div>
  );
}
