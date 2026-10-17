import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { NeonHorizonArc } from '../components/NeonHorizonArc';
import { THEME } from '../theme';

export const Scene2Gatekeeper: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Arc elevation progression
  const arcProgress = spring({
    frame,
    fps,
    config: { damping: 16, mass: 1 },
  });

  const logoScale = spring({
    frame: frame - 20,
    fps,
    config: { damping: 12, mass: 0.7 },
  });

  const subtitleOpacity = interpolate(frame, [40, 70], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: THEME.colors.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: THEME.fonts.sans,
        position: 'relative',
        overflow: 'hidden',
        color: THEME.colors.textWhite,
      }}
    >
      {/* Upper-left light ray */}
      <div
        style={{
          position: 'absolute',
          top: -100,
          left: -100,
          width: 800,
          height: 1000,
          transform: 'rotate(-30deg)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(240,147,191,0.2) 30%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />

      {/* Concentric Neon Horizon Arc */}
      <NeonHorizonArc progress={arcProgress} />

      {/* Main Brand Hero */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: `scale(${Math.max(0, logoScale)})`,
        }}
      >
        {/* Pill Tag */}
        <div
          style={{
            padding: '8px 24px',
            borderRadius: 9999,
            border: '1px solid rgba(240, 147, 191, 0.4)',
            backgroundColor: 'rgba(240, 147, 191, 0.1)',
            fontSize: 14,
            fontFamily: THEME.fonts.mono,
            color: THEME.colors.pinkNeon,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: 24,
            boxShadow: '0 0 20px rgba(240, 147, 191, 0.3)',
          }}
        >
          ● The Autonomous Post-Code Gatekeeper
        </div>

        <h1
          style={{
            fontSize: 120,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            margin: 0,
            lineHeight: 1,
            background: 'linear-gradient(180deg, #ffffff 40%, #f093bf 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 20px 40px rgba(0,0,0,0.8)',
          }}
        >
          IGRIS
        </h1>

        <p
          style={{
            fontSize: 28,
            color: '#d4d4d8',
            marginTop: 20,
            opacity: subtitleOpacity,
            fontWeight: 400,
            textAlign: 'center',
            maxWidth: 800,
            lineHeight: 1.4,
          }}
        >
          Deterministic post-code security for <strong style={{ color: '#ffffff' }}>GitLab Duo</strong>.
          <br />
          <span style={{ fontSize: 20, fontFamily: THEME.fonts.mono, color: THEME.colors.pinkNeon }}>
            Zero-Trust • Zero-Network • Sub-Second Deterministic Receipts
          </span>
        </p>
      </div>
    </div>
  );
};
