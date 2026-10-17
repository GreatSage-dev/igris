import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { THEME } from '../theme';

export const Scene4GitBisect: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const commitReveal = frame > 45;

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
        padding: '0 60px',
        color: THEME.colors.textWhite,
      }}
    >
      {/* Cyan laser bloom */}
      <div
        style={{
          position: 'absolute',
          width: 900,
          height: 600,
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, transparent 70%)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
        }}
      />

      {/* Pill */}
      <div
        style={{
          padding: '8px 24px',
          borderRadius: 9999,
          border: '1px solid rgba(56, 189, 248, 0.4)',
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          fontSize: 14,
          fontFamily: THEME.fonts.mono,
          color: THEME.colors.cyan,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          marginBottom: 24,
        }}
      >
        ● The 7-Year GitLab Wishlist Snipe
      </div>

      <h2
        style={{
          fontSize: 64,
          fontWeight: 700,
          textAlign: 'center',
          maxWidth: 1100,
          margin: '0 0 16px 0',
          letterSpacing: '-0.03em',
          transform: `scale(${entrance})`,
        }}
      >
        Resolving GitLab Community <span style={{ color: THEME.colors.cyan }}>Issue #989</span>
      </h2>

      <p
        style={{
          fontSize: 24,
          color: THEME.colors.textMuted,
          textAlign: 'center',
          maxWidth: 800,
          margin: '0 0 44px 0',
        }}
      >
        Automated pipeline-driven Git Bisection inside CI/CD runners.
      </p>

      {/* Bisection Commit Inspector Box */}
      <div
        style={{
          width: '100%',
          maxWidth: 900,
          borderRadius: 24,
          backgroundColor: 'rgba(12, 10, 18, 0.95)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          boxShadow: '0 0 40px rgba(56, 189, 248, 0.2), 0 25px 50px rgba(0,0,0,0.9)',
          padding: 32,
          fontFamily: THEME.fonts.mono,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontSize: 14, color: THEME.colors.cyan, fontWeight: 600 }}>
            GIT BISECTION ENGINE (#989)
          </span>
          <span style={{ fontSize: 13, color: commitReveal ? '#10b981' : '#a1a1aa' }}>
            {commitReveal ? 'CULPRIT COMMIT LOCKED (142ms)' : 'BINARY SEARCHING COMMIT TREE...'}
          </span>
        </div>

        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 15, color: '#a1a1aa' }}>
            // Evaluated 1,420 commits across main branch
          </div>
          <div
            style={{
              padding: 20,
              borderRadius: 16,
              backgroundColor: '#000000',
              border: commitReveal ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#ffffff' }}>
                Commit: b47a19ce4102
              </span>
              <span style={{ fontSize: 13, color: '#38bdf8', padding: '2px 10px', borderRadius: 9999, backgroundColor: 'rgba(56,189,248,0.1)' }}>
                VERIFIED REGRESSION
              </span>
            </div>
            <div style={{ fontSize: 14, color: '#a1a1aa' }}>
              Author: Alex Rivers &lt;alex@dev.io&gt;
            </div>
            <div style={{ fontSize: 14, color: '#e4e4e7', fontStyle: 'italic' }}>
              "Refactor auth token parser logic"
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
