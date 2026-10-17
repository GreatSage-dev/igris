import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { THEME } from '../theme';

export const Scene5ProofCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sealSpring = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.6 },
  });

  const ctaOpacity = interpolate(frame, [40, 70], [0, 1], {
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
        padding: '0 60px',
        color: THEME.colors.textWhite,
      }}
    >
      {/* Upper-left light ray */}
      <div
        style={{
          position: 'absolute',
          top: -120,
          left: -120,
          width: 900,
          height: 1100,
          transform: 'rotate(-30deg)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(240,147,191,0.2) 30%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />

      {/* The Evidence Receipt Climax Card */}
      <div
        style={{
          width: '100%',
          maxWidth: 960,
          borderRadius: 28,
          backgroundColor: 'rgba(12, 10, 18, 0.95)',
          border: '1px solid rgba(240, 147, 191, 0.4)',
          boxShadow: '0 0 60px rgba(240, 147, 191, 0.25), 0 30px 60px rgba(0,0,0,0.95)',
          padding: 40,
          transform: `scale(${sealSpring})`,
          marginBottom: 44,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(240, 147, 191, 0.2)', border: '1px solid rgba(240, 147, 191, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f093bf', fontWeight: 'bold' }}>
              ★
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                IMMUTABLE EVIDENCE RECEIPT
              </div>
              <div style={{ fontSize: 12, fontFamily: THEME.fonts.mono, color: '#71717a' }}>
                Verified by Igris Defense Engine
              </div>
            </div>
          </div>
          <span style={{ fontSize: 13, fontFamily: THEME.fonts.mono, padding: '4px 12px', borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.05)', color: '#d4d4d8' }}>
            ID: IGRIS-9B84F2A1
          </span>
        </div>

        {/* Stat row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, margin: '24px 0' }}>
          <div style={{ padding: 16, borderRadius: 16, backgroundColor: '#000000', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 10, fontFamily: THEME.fonts.mono, color: '#71717a', textTransform: 'uppercase' }}>Process Exit</span>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', marginTop: 6 }}>code 0</div>
          </div>
          <div style={{ padding: 16, borderRadius: 16, backgroundColor: '#000000', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 10, fontFamily: THEME.fonts.mono, color: '#71717a', textTransform: 'uppercase' }}>Latency</span>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', marginTop: 6 }}>3.6ms</div>
          </div>
          <div style={{ padding: 16, borderRadius: 16, backgroundColor: '#000000', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 10, fontFamily: THEME.fonts.mono, color: '#71717a', textTransform: 'uppercase' }}>Memory</span>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', marginTop: 6 }}>0.00MB</div>
          </div>
          <div style={{ padding: 16, borderRadius: 16, backgroundColor: '#000000', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 10, fontFamily: THEME.fonts.mono, color: '#71717a', textTransform: 'uppercase' }}>Verdict</span>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981', marginTop: 6 }}>REFUTED</div>
          </div>
        </div>

        {/* SHA-256 seal */}
        <div style={{ padding: 16, borderRadius: 14, backgroundColor: '#000000', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: THEME.fonts.mono, fontSize: 13, color: '#a1a1aa' }}>
          <span>SHA-256: <strong style={{ color: '#ffffff', fontWeight: 600 }}>e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</strong></span>
          <span style={{ color: '#10b981', fontWeight: 600 }}>● VERIFIED</span>
        </div>
      </div>

      {/* Call to Action Bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          opacity: ctaOpacity,
        }}
      >
        <div
          style={{
            padding: '16px 44px',
            borderRadius: 9999,
            backgroundColor: '#ffffff',
            color: '#18181b',
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: '0.02em',
            boxShadow: '0 20px 40px rgba(255,255,255,0.2)',
          }}
        >
          Deploy in 1 Line with .gitlab-ci.yml
        </div>

        <div style={{ fontSize: 16, fontFamily: THEME.fonts.mono, color: '#71717a' }}>
          gitlab.com/igris/gatekeeper • Built for GitLab "Life After Code" Hackathon
        </div>
      </div>
    </div>
  );
};
