/**
 * Panel Component
 *
 * A flat, transparent panel for containing UI sections.
 * Clean console aesthetic with minimal styling.
 */

import { ReactNode, CSSProperties } from 'react';
import { UI_COLORS } from '../../core/theme/colors';

interface Panel3DProps {
  /** Panel content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Panel padding */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Custom background color */
  bgColor?: string;
  /** Panel opacity (0-1), default 0.85 */
  opacity?: number;
}

const PADDING_CONFIG: Record<string, string> = {
  none: '0',
  sm: '8px',
  md: '16px',
  lg: '24px',
};

/** Corner dot style */
const dotStyle: CSSProperties = {
  position: 'absolute',
  width: '3px',
  height: '3px',
  backgroundColor: 'rgba(255, 255, 255, 0.5)',
  borderRadius: '50%',
  pointerEvents: 'none',
};

/** Offset from panel edge */
const DOT_OFFSET = '-6px';

export function Panel3D({
  children,
  className = '',
  padding = 'md',
  bgColor,
  opacity = 0.85,
}: Panel3DProps) {
  // Flat transparent style
  const background = bgColor || `rgba(15, 18, 22, ${opacity})`;

  const style: CSSProperties = {
    backgroundColor: background,
    backdropFilter: 'blur(4px)',
    padding: PADDING_CONFIG[padding],
    position: 'relative',
  };

  return (
    <div className={className} style={style}>
      {/* Corner dots */}
      <div style={{ ...dotStyle, top: DOT_OFFSET, left: DOT_OFFSET }} />
      <div style={{ ...dotStyle, top: DOT_OFFSET, right: DOT_OFFSET }} />
      <div style={{ ...dotStyle, bottom: DOT_OFFSET, left: DOT_OFFSET }} />
      <div style={{ ...dotStyle, bottom: DOT_OFFSET, right: DOT_OFFSET }} />
      {children}
    </div>
  );
}

/**
 * Panel header with accent styling
 */
interface PanelHeaderProps {
  children: ReactNode;
  color?: string;
}

export function PanelHeader({ children, color = UI_COLORS.accentPrimary }: PanelHeaderProps) {
  return (
    <div
      className="text-sm font-medium tracking-widest mb-4 pb-2"
      style={{
        color,
        borderBottom: `1px solid ${UI_COLORS.metalDark}`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Divider line for panels
 */
export function PanelDivider() {
  return (
    <div
      style={{
        height: '1px',
        background: `linear-gradient(90deg, transparent, ${UI_COLORS.metalDark} 20%, ${UI_COLORS.metalDark} 80%, transparent)`,
        margin: '16px 0',
      }}
    />
  );
}
