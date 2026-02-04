/**
 * Panel Component
 *
 * A flat, transparent panel for containing UI sections.
 * Clean console aesthetic with minimal styling.
 */

import { ReactNode, CSSProperties, useState, useEffect } from 'react';
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
  /** Inner panel classes (for flex/grid layouts) */
  innerClassName?: string;
  /** Whether to show corner markers, default true */
  showMarkers?: boolean;
}

const PADDING_CONFIG: Record<string, string> = {
  none: '0',
  sm: '8px',
  md: '16px',
  lg: '24px',
};

/** Corner marker style */
const markerStyle: CSSProperties = {
  position: 'absolute',
  width: '3px',
  height: '3px',
  backgroundColor: 'rgba(255, 255, 255, 0.6)',
  pointerEvents: 'none',
};

/** Offset from panel edge */
const MARKER_OFFSET = '0px';

/** Fine mesh overlay style */
const meshStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  backgroundImage: `
    radial-gradient(circle at center, rgba(255, 255, 255, 0.03) 0px, transparent 1px),
    linear-gradient(rgba(0, 0, 0, 0.15) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.15) 1px, transparent 1px)
  `,
  backgroundSize: '4px 4px',
};

export function Panel3D({
  children,
  className = '',
  padding = 'md',
  bgColor,
  opacity = 0.6,
  innerClassName = '',
  showMarkers = true,
}: Panel3DProps) {
  // AC6-style flicker on mount
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(timer);
  }, []);

  // Flat transparent style
  const background = bgColor || `rgba(15, 18, 22, ${opacity})`;

  // Outer wrapper for dots (no overflow clipping)
  const wrapperStyle: CSSProperties = {
    position: 'relative',
  };

  // Inner panel with background and padding
  const panelStyle: CSSProperties = {
    backgroundColor: background,
    backdropFilter: 'blur(4px)',
    padding: PADDING_CONFIG[padding],
    height: '100%',
    width: '100%',
    position: 'relative',
    // Subtle fade at very edge using mask (2px)
    maskImage:
      'linear-gradient(to right, rgba(0,0,0,0.3) 0px, black 2px, black calc(100% - 2px), rgba(0,0,0,0.3) 100%), linear-gradient(to bottom, rgba(0,0,0,0.3) 0px, black 2px, black calc(100% - 2px), rgba(0,0,0,0.3) 100%)',
    maskComposite: 'intersect',
    WebkitMaskImage:
      'linear-gradient(to right, rgba(0,0,0,0.3) 0px, black 2px, black calc(100% - 2px), rgba(0,0,0,0.3) 100%), linear-gradient(to bottom, rgba(0,0,0,0.3) 0px, black 2px, black calc(100% - 2px), rgba(0,0,0,0.3) 100%)',
    WebkitMaskComposite: 'source-in',
  };

  return (
    <div className={className} style={{ ...wrapperStyle, opacity: mounted ? 1 : 0 }}>
      {/* Panel content */}
      <div className={innerClassName} style={panelStyle}>
        {/* Fine mesh overlay */}
        <div style={meshStyle} />
        {/* Corner markers - inside the panel */}
        {showMarkers && (
          <>
            <div style={{ ...markerStyle, top: MARKER_OFFSET, left: MARKER_OFFSET }} />
            <div style={{ ...markerStyle, top: MARKER_OFFSET, right: MARKER_OFFSET }} />
            <div style={{ ...markerStyle, bottom: MARKER_OFFSET, left: MARKER_OFFSET }} />
            <div style={{ ...markerStyle, bottom: MARKER_OFFSET, right: MARKER_OFFSET }} />
          </>
        )}
        {children}
      </div>
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
