import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

export const NeonHorizonArc: React.FC<{ progress?: number }> = ({ progress = 1 }) => {
  const frame = useCurrentFrame();
  const pulse = Math.sin(frame / 15) * 0.08 + 0.92;

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -46%) scale(${progress})`,
        width: 1400,
        height: 700,
        pointerEvents: 'none',
        opacity: progress,
      }}
    >
      <svg viewBox="0 0 1100 580" fill="none" style={{ width: '100%', height: '100%' }}>
        <defs>
          <radialGradient id="videoArcBloom" cx="50%" cy="32%" r="42%">
            <stop offset="0%" stopColor="#e4609d" stopOpacity={0.35 * pulse} />
            <stop offset="35%" stopColor="#be123c" stopOpacity={0.18 * pulse} />
            <stop offset="65%" stopColor="#490e2a" stopOpacity={0.06} />
            <stop offset="100%" stopColor="#000000" stopOpacity={0} />
          </radialGradient>

          <linearGradient id="videoRibbonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#881337" stopOpacity={0.1} />
            <stop offset="12%" stopColor="#be123c" stopOpacity={0.8} />
            <stop offset="30%" stopColor="#e11d48" stopOpacity={0.95} />
            <stop offset="45%" stopColor="#f472b6" stopOpacity={1} />
            <stop offset="50%" stopColor="#fbcfe8" stopOpacity={1} />
            <stop offset="55%" stopColor="#f472b6" stopOpacity={1} />
            <stop offset="70%" stopColor="#e11d48" stopOpacity={0.95} />
            <stop offset="88%" stopColor="#be123c" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#881337" stopOpacity={0.1} />
          </linearGradient>

          <linearGradient id="videoInnerCrimson" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#490e2a" stopOpacity={0} />
            <stop offset="22%" stopColor="#881337" stopOpacity={0.6} />
            <stop offset="50%" stopColor="#9f1239" stopOpacity={0.85} />
            <stop offset="78%" stopColor="#881337" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#490e2a" stopOpacity={0} />
          </linearGradient>

          <filter id="videoRibbonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="20" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Ambient Radial Bloom */}
        <ellipse cx="550" cy="220" rx="400" ry="210" fill="url(#videoArcBloom)" />

        {/* 2. Outer Frosted Arc (~46px) */}
        <path d="M 90 520 A 460 310 0 0 1 1010 520" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="48" fill="none" />
        <path d="M 90 497 A 483 333 0 0 1 1010 497" stroke="rgba(255, 255, 255, 0.22)" strokeWidth="1.5" fill="none" />

        {/* 3. Middle Solid Neon Pink Ribbon (~40px) */}
        <path d="M 120 520 A 430 280 0 0 1 980 520" stroke="url(#videoRibbonGradient)" strokeWidth="40" fill="none" filter="url(#videoRibbonGlow)" />
        <path d="M 140 501 A 410 261 0 0 1 960 501" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="2" fill="none" />

        {/* 4. Inner Crimson Band (~32px) */}
        <path d="M 150 520 A 400 250 0 0 1 950 520" stroke="url(#videoInnerCrimson)" strokeWidth="32" fill="none" />
      </svg>
    </div>
  );
};
