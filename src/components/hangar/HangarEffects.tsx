/**
 * Hangar Visual Effects
 *
 * AC6-inspired visual effects overlays for the hangar.
 */

import { useEffect, useState, useMemo } from 'react';
import type { EffectsSettings } from './effectsSettings';

interface HangarEffectsProps {
  settings: EffectsSettings;
}

export function HangarEffects({ settings }: HangarEffectsProps) {
  // Flicker state
  const [flickerOpacity, setFlickerOpacity] = useState(1);

  // Random flicker effect
  useEffect(() => {
    if (!settings.flicker) return;

    const flickerInterval = setInterval(() => {
      if (Math.random() < 0.1) {
        setFlickerOpacity(0.85 + Math.random() * 0.1);
        setTimeout(() => setFlickerOpacity(1), 50 + Math.random() * 100);
      }
    }, 500);

    return () => clearInterval(flickerInterval);
  }, [settings.flicker]);

  // Generate burning ember particles
  const particles = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const intensity = Math.random();
      const duration = 16 + Math.random() * 16;
      // Negative delay starts animation partway through, simulating time already passed
      const delay = -Math.random() * duration;
      return {
        id: i,
        left: Math.random() * 100,
        delay,
        duration,
        size: 2 + Math.random() * 3,
        // Color ranges from deep orange to bright yellow
        color:
          intensity > 0.7
            ? `rgba(255, 200, 50, ${0.6 + Math.random() * 0.4})` // bright yellow
            : intensity > 0.4
              ? `rgba(255, 140, 30, ${0.5 + Math.random() * 0.4})` // orange
              : `rgba(255, 80, 20, ${0.4 + Math.random() * 0.3})`, // deep orange/red
        glowSize: 4 + Math.random() * 6,
        drift: -30 + Math.random() * 60, // horizontal drift
      };
    });
  }, []);

  return (
    <>
      {/* Scan Lines */}
      {settings.scanLines && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.15) 2px, rgba(0, 0, 0, 0.15) 4px)',
            backgroundSize: '100% 4px',
          }}
        />
      )}

      {/* Noise/Grain */}
      {settings.noise && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.05,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      )}

      {/* Scan Beam */}
      {settings.scanBeam && (
        <>
          <div
            className="absolute left-0 right-0 pointer-events-none"
            style={{
              height: '2px',
              background:
                'linear-gradient(90deg, transparent, rgba(245, 166, 35, 0.4) 20%, rgba(245, 166, 35, 0.6) 50%, rgba(245, 166, 35, 0.4) 80%, transparent)',
              animation: 'scanBeam 8s linear infinite',
              boxShadow: '0 0 10px rgba(245, 166, 35, 0.3)',
            }}
          />
          <style>{`
            @keyframes scanBeam {
              0% { top: -2px; }
              100% { top: 100%; }
            }
          `}</style>
        </>
      )}

      {/* Vignette */}
      {settings.vignette && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.4) 100%)',
          }}
        />
      )}

      {/* Corner Brackets */}
      {settings.cornerBrackets && (
        <>
          {/* Top Left */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: '20px',
              left: '20px',
              width: '40px',
              height: '40px',
              borderTop: '2px solid rgba(245, 166, 35, 0.5)',
              borderLeft: '2px solid rgba(245, 166, 35, 0.5)',
            }}
          />
          {/* Top Right */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: '20px',
              right: '20px',
              width: '40px',
              height: '40px',
              borderTop: '2px solid rgba(245, 166, 35, 0.5)',
              borderRight: '2px solid rgba(245, 166, 35, 0.5)',
            }}
          />
          {/* Bottom Left */}
          <div
            className="absolute pointer-events-none"
            style={{
              bottom: '20px',
              left: '20px',
              width: '40px',
              height: '40px',
              borderBottom: '2px solid rgba(245, 166, 35, 0.5)',
              borderLeft: '2px solid rgba(245, 166, 35, 0.5)',
            }}
          />
          {/* Bottom Right */}
          <div
            className="absolute pointer-events-none"
            style={{
              bottom: '20px',
              right: '20px',
              width: '40px',
              height: '40px',
              borderBottom: '2px solid rgba(245, 166, 35, 0.5)',
              borderRight: '2px solid rgba(245, 166, 35, 0.5)',
            }}
          />
        </>
      )}

      {/* Burning Ember Particles */}
      {settings.particles && (
        <>
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute pointer-events-none rounded-full"
              style={{
                left: `${p.left}%`,
                top: '105%',
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                boxShadow: `0 0 ${p.glowSize}px ${p.color}, 0 0 ${p.glowSize * 2}px rgba(255, 100, 20, 0.3)`,
                animation: `emberFloat-${p.id} ${p.duration}s ease-out ${p.delay}s infinite`,
              }}
            />
          ))}
          <style>{`
            ${particles
              .map(
                (p) => `
              @keyframes emberFloat-${p.id} {
                0%, 100% {
                  top: 105%;
                  opacity: 0;
                  transform: translateX(0) scale(1);
                }
                3% {
                  top: 100%;
                  opacity: 1;
                }
                50% {
                  opacity: 0.9;
                  transform: translateX(${p.drift * 0.5}px) scale(0.9);
                }
                90% {
                  opacity: 0.4;
                }
                97% {
                  top: -5%;
                  opacity: 0;
                  transform: translateX(${p.drift}px) scale(0.3);
                }
              }
            `
              )
              .join('\n')}
          `}</style>
        </>
      )}

      {/* Hex Grid */}
      {settings.hexGrid && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.03,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      )}

      {/* Chromatic Aberration */}
      {settings.chromatic && (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(90deg, rgba(255, 0, 0, 0.02) 0%, transparent 5%, transparent 95%, rgba(0, 255, 255, 0.02) 100%)',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(0deg, rgba(255, 0, 0, 0.02) 0%, transparent 5%, transparent 95%, rgba(0, 255, 255, 0.02) 100%)',
            }}
          />
        </>
      )}

      {/* Flicker overlay */}
      {settings.flicker && flickerOpacity < 1 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: `rgba(0, 0, 0, ${1 - flickerOpacity})`,
          }}
        />
      )}

      {/* Heat Distortion */}
      {settings.heatDistortion && (
        <>
          <svg className="absolute" width="0" height="0">
            <defs>
              <filter id="heat-distortion">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.01 0.005"
                  numOctaves="2"
                  result="noise"
                >
                  <animate
                    attributeName="baseFrequency"
                    values="0.01 0.005;0.015 0.008;0.01 0.005"
                    dur="4s"
                    repeatCount="indefinite"
                  />
                </feTurbulence>
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="noise"
                  scale="3"
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
              </filter>
            </defs>
          </svg>
          <div
            className="absolute left-0 right-0 bottom-0 pointer-events-none"
            style={{
              height: '15%',
              background: 'linear-gradient(to top, rgba(245, 166, 35, 0.03), transparent)',
              filter: 'url(#heat-distortion)',
            }}
          />
        </>
      )}

      {/* Ambient Glow */}
      {settings.glow && (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(245, 166, 35, 0.08) 0%, transparent 70%)',
              animation: 'hangarGlow 10s ease-in-out infinite',
            }}
          />
          <style>{`
            @keyframes hangarGlow {
              0%, 100% { opacity: 0.3; }
              50% { opacity: 1; }
            }
          `}</style>
        </>
      )}
    </>
  );
}
