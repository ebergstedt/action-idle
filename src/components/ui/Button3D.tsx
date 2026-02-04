/**
 * 3D Pressable Button Component
 *
 * A button styled to look like a physical console button that presses inward.
 * Used for primary actions like SORTIE, CONFIRM, etc.
 */

import { useState, ReactNode, CSSProperties } from 'react';
import { UI_COLORS } from '../../core/theme/colors';

type ButtonSize = 'sm' | 'md' | 'lg';

interface Button3DProps {
  /** Button content */
  children: ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Base color of the button (hex) */
  color?: string;
  /** Text color (hex), defaults to dark */
  textColor?: string;
  /** Button size */
  size?: ButtonSize;
  /** Additional CSS classes */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

/** Size configurations for padding, font, and shadow depth */
const SIZE_CONFIG: Record<ButtonSize, { padding: string; fontSize: string; depth: number }> = {
  sm: { padding: '6px 16px', fontSize: '14px', depth: 2 },
  md: { padding: '8px 24px', fontSize: '16px', depth: 3 },
  lg: { padding: '10px 32px', fontSize: '18px', depth: 4 },
};

/**
 * Darken a hex color by a percentage
 */
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - Math.round(255 * percent));
  const g = Math.max(0, ((num >> 8) & 0x00ff) - Math.round(255 * percent));
  const b = Math.max(0, (num & 0x0000ff) - Math.round(255 * percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export function Button3D({
  children,
  onClick,
  color = UI_COLORS.accentPrimary,
  textColor = UI_COLORS.black,
  size = 'md',
  className = '',
  disabled = false,
}: Button3DProps) {
  const [isPressed, setIsPressed] = useState(false);

  const config = SIZE_CONFIG[size];
  const darkColor = darkenColor(color, 0.15);
  const darkerColor = darkenColor(color, 0.25);
  const pressedColor = darkenColor(color, 0.08);

  const depth = config.depth;
  const normalShadow = `inset 0 -${depth}px 0 0 ${darkColor}, inset 0 2px 0 0 rgba(255,255,255,0.3), 0 ${depth + 1}px ${depth * 2}px rgba(0, 0, 0, 0.4)`;
  const pressedShadow = `inset 0 ${depth}px ${depth * 2}px rgba(0,0,0,0.4), inset 0 1px 0 0 ${darkerColor}, 0 1px 2px rgba(0, 0, 0, 0.2)`;
  const disabledShadow = `inset 0 -2px 0 0 rgba(0,0,0,0.2), inset 0 1px 0 0 rgba(255,255,255,0.1)`;

  const style: CSSProperties = {
    backgroundColor: disabled ? '#666' : isPressed ? pressedColor : color,
    color: disabled ? '#999' : textColor,
    boxShadow: disabled ? disabledShadow : isPressed ? pressedShadow : normalShadow,
    border: `1px solid ${disabled ? '#555' : darkerColor}`,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'box-shadow 0.1s ease, background-color 0.1s ease',
    padding: config.padding,
    fontSize: config.fontSize,
  };

  return (
    <button
      className={`font-bold tracking-widest ${className}`}
      style={style}
      disabled={disabled}
      onMouseDown={() => !disabled && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
