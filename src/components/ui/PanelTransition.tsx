/**
 * Panel Transition Component
 *
 * AC6-inspired instant transition with brief flicker.
 * Minimal visual feedback - content swaps instantly.
 */

import { ReactNode, useEffect, useState, useRef } from 'react';

interface PanelTransitionProps {
  /** Content to render */
  children: ReactNode;
  /** Key to trigger transition (change this to trigger effect) */
  transitionKey: string;
}

export function PanelTransition({ children, transitionKey }: PanelTransitionProps) {
  const [flicker, setFlicker] = useState(false);
  const prevKeyRef = useRef(transitionKey);

  useEffect(() => {
    if (prevKeyRef.current !== transitionKey) {
      // Brief 1-frame flicker
      setFlicker(true);
      const timer = setTimeout(() => setFlicker(false), 30);
      prevKeyRef.current = transitionKey;
      return () => clearTimeout(timer);
    }
  }, [transitionKey]);

  return (
    <div className="w-full h-full" style={{ opacity: flicker ? 0.7 : 1 }}>
      {children}
    </div>
  );
}
