import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { THEME } from '../theme';

export const Scene1Crisis: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring for headline
  const titleScale = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const warningOpacity = interpolate(frame, [60, 90], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Floating red badge position
  const badgeY = interpolate(frame, [90, 150], [40, 0], {
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
      {/* Background ambient red danger glow */}
      <div
        style={{
          position: 'absolute',
          width: 800,
          height: 800,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(190, 18, 60, 0.15) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Eyebrow Pill */}
      <div
        style={{
          padding: '8px 20px',
          borderRadius: 9999,
          border: '1px solid rgba(255, 255, 255, 0.15)',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          fontSize: 14,
          fontFamily: THEME.fonts.mono,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: '#f43f5e',
          marginBottom: 32,
          opacity: Math.min(1, frame / 20),
        }}
      >
        ● 2026 Developer Security Crisis
      </div>

      {/* Main Kinetic Headline */}
      <h1
        style={{
          fontSize: 72,
          fontWeight: 700,
          textAlign: 'center',
          maxWidth: 1200,
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
          transform: `scale(${titleScale})`,
          margin: 0,
        }}
      >
        Autonomous AI agents generate{' '}
        <span style={{ color: '#f43f5e' }}>thousands of PRs</span> per minute.
      </h1>

      {/* Warning Flash Subtitle */}
      <p
        style={{
          fontSize: 32,
          color: THEME.colors.textMuted,
          marginTop: 28,
          opacity: warningOpacity,
          fontWeight: 400,
          textAlign: 'center',
          maxWidth: 900,
        }}
      >
        And 84% of bug bounty submissions are now{' '}
        <strong style={{ color: '#ffffff', fontWeight: 600 }}>hallucinated AI slop</strong>.
      </p>

      {/* Floating Mock Bounty Slop Card */}
      {frame > 80 && (
        <div
          style={{
            marginTop: 48,
            padding: '24px 36px',
            borderRadius: 24,
            backgroundColor: 'rgba(18, 12, 16, 0.85)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            transform: `translateY(${badgeY}px)`,
            opacity: interpolate(frame, [80, 110], [0, 1]),
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: 'rgba(244, 63, 94, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f43f5e',
              fontSize: 24,
              fontWeight: 'bold',
            }}
          >
            !
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#ffffff' }}>
              cURL CVE-2026 AI Hallucination
            </div>
            <div style={{ fontSize: 14, fontFamily: THEME.fonts.mono, color: '#f43f5e', marginTop: 4 }}>
              Claims buffer overflow in non-existent function `parseChunkHeader()`
            </div>
          </div>
          <div
            style={{
              padding: '6px 14px',
              borderRadius: 9999,
              backgroundColor: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              color: '#f43f5e',
              fontFamily: THEME.fonts.mono,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            PHANTOM_SYMBOL
          </div>
        </div>
      )}
    </div>
  );
};
