/**
 * Map Legend Component
 *
 * A decorative legend box explaining unit types,
 * styled like a medieval map legend.
 */

import { UI_COLORS, UNIT_TYPE_COLORS } from '../../core/theme/colors';

interface MapLegendProps {
  className?: string;
}

export function MapLegend({ className = '' }: MapLegendProps) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        backgroundColor: UI_COLORS.parchmentBase,
        border: `2px solid ${UI_COLORS.inkBrown}`,
        borderRadius: '4px',
        padding: '12px',
        boxShadow: `inset 0 0 10px ${UI_COLORS.parchmentDark}`,
      }}
    >
      {/* Decorative corner flourishes */}
      <CornerFlourish position="top-left" />
      <CornerFlourish position="top-right" />
      <CornerFlourish position="bottom-left" />
      <CornerFlourish position="bottom-right" />

      {/* Title with decorative underline */}
      <div className="text-center mb-3">
        <h4
          className="text-sm font-bold tracking-wider uppercase"
          style={{
            color: UI_COLORS.inkBlack,
            fontFamily: 'serif',
          }}
        >
          Unit Types
        </h4>
        <div
          className="mx-auto mt-1"
          style={{
            width: '60px',
            height: '2px',
            background: `linear-gradient(90deg, transparent, ${UI_COLORS.inkBrown}, transparent)`,
          }}
        />
      </div>

      {/* Legend entries */}
      <div className="space-y-2">
        <LegendEntry
          shape="square"
          color={UNIT_TYPE_COLORS.hound.player}
          name="Hound"
          description="Melee tank"
        />
        <LegendEntry
          shape="triangle"
          color={UNIT_TYPE_COLORS.fang.player}
          name="Fang"
          description="Ranged"
        />
        <LegendEntry
          shape="circle"
          color={UNIT_TYPE_COLORS.crawler.player}
          name="Crawler"
          description="Fast melee"
        />
      </div>

      {/* Bottom decorative divider */}
      <div
        className="mx-auto mt-3"
        style={{
          width: '40px',
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${UI_COLORS.inkFaded}, transparent)`,
        }}
      />
    </div>
  );
}

interface LegendEntryProps {
  shape: 'square' | 'triangle' | 'circle';
  color: string;
  name: string;
  description: string;
}

function LegendEntry({ shape, color, name, description }: LegendEntryProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-5 flex justify-center">
        <UnitShape shape={shape} color={color} size={12} />
      </div>
      <div className="flex-1 flex items-baseline gap-1">
        <span
          className="text-sm font-semibold"
          style={{ color: UI_COLORS.inkBlack, fontFamily: 'serif' }}
        >
          {name}
        </span>
        <span
          className="text-sm"
          style={{
            color: UI_COLORS.inkBrown,
            fontFamily: 'serif',
            fontStyle: 'italic',
          }}
        >
          - {description}
        </span>
      </div>
    </div>
  );
}

interface UnitShapeProps {
  shape: 'square' | 'triangle' | 'circle';
  color: string;
  size: number;
}

function UnitShape({ shape, color, size }: UnitShapeProps) {
  if (shape === 'square') {
    return (
      <div
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          border: `1px solid ${UI_COLORS.inkBlack}`,
        }}
      />
    );
  }

  if (shape === 'triangle') {
    return (
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: `${size / 2}px solid transparent`,
          borderRight: `${size / 2}px solid transparent`,
          borderBottom: `${size}px solid ${color}`,
        }}
      />
    );
  }

  // circle
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: '50%',
        border: `1px solid ${UI_COLORS.inkBlack}`,
      }}
    />
  );
}

interface CornerFlourishProps {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

function CornerFlourish({ position }: CornerFlourishProps) {
  const isTop = position.includes('top');
  const isLeft = position.includes('left');

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    width: '8px',
    height: '8px',
    borderColor: UI_COLORS.inkBrown,
    borderStyle: 'solid',
    borderWidth: 0,
  };

  const positionStyle: React.CSSProperties = {
    [isTop ? 'top' : 'bottom']: '3px',
    [isLeft ? 'left' : 'right']: '3px',
    [isTop ? 'borderTopWidth' : 'borderBottomWidth']: '2px',
    [isLeft ? 'borderLeftWidth' : 'borderRightWidth']: '2px',
  };

  return <div style={{ ...baseStyle, ...positionStyle }} />;
}
