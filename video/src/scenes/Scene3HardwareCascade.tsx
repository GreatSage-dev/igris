import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { THEME } from '../theme';

export const Scene3HardwareCascade: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring for split screen
  const splitEntrance = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  // Gate progress triggers
  const g0Pass = frame > 30;
  const g1Refuse = frame > 65;

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
      {/* Eyebrow */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 36,
        }}
      >
        <span style={{ width: 40, height: 1, backgroundColor: '#3f3f46' }} />
        <span
          style={{
            fontSize: 14,
            fontFamily: THEME.fonts.mono,
            color: THEME.colors.pinkNeon,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          ● The 15-Second Split-Screen Test
        </span>
        <span style={{ width: 40, height: 1, backgroundColor: '#3f3f46' }} />
      </div>

      {/* Split-Screen Arena */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 40,
          width: '100%',
          maxWidth: 1600,
          transform: `scale(${splitEntrance})`,
        }}
      >
        {/* LEFT SCREEN: THE NAIVE STATUS QUO */}
        <div
          style={{
            padding: 40,
            borderRadius: 28,
            backgroundColor: 'rgba(16, 12, 16, 0.8)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 13, fontFamily: THEME.fonts.mono, color: '#f43f5e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Naive Status Quo
              </span>
              <span style={{ fontSize: 13, fontFamily: THEME.fonts.mono, color: '#a1a1aa' }}>Standard CI Bot</span>
            </div>

            <h3 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 16px 0', color: '#ffffff' }}>
              Blind Automated Triage
            </h3>

            <p style={{ fontSize: 18, color: '#a1a1aa', lineHeight: 1.5, margin: 0 }}>
              • Spawns heavy container without AST reachability checks.
              <br />
              • Burns 15 minutes of paid cloud compute on a hallucinated function.
              <br />
              • CI hangs, leaks token, or issues false bounty payout.
            </p>
          </div>

          <div
            style={{
              marginTop: 36,
              padding: 20,
              borderRadius: 16,
              backgroundColor: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontFamily: THEME.fonts.mono, fontSize: 15, color: '#f43f5e' }}>Outcome: Measurable Loss</span>
            <span style={{ fontFamily: THEME.fonts.mono, fontSize: 20, fontWeight: 700, color: '#f43f5e' }}>-$18,000 Waste</span>
          </div>
        </div>

        {/* RIGHT SCREEN: THE IGRIS SUPERPOWER */}
        <div
          style={{
            padding: 40,
            borderRadius: 28,
            backgroundColor: 'rgba(12, 10, 18, 0.95)',
            border: '1px solid rgba(240, 147, 191, 0.5)',
            boxShadow: '0 0 50px rgba(240, 147, 191, 0.2), 0 25px 50px rgba(0,0,0,0.9)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 13, fontFamily: THEME.fonts.mono, color: THEME.colors.pinkNeon, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Igris Superpower
              </span>
              <span style={{ fontSize: 13, fontFamily: THEME.fonts.mono, color: THEME.colors.safeGreen }}>Active Quarantine</span>
            </div>

            <h3 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 16px 0', color: '#ffffff' }}>
              4-Gate Hardware Defense
            </h3>

            {/* Micro 4-Gate Pipeline */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 24, marginBottom: 24 }}>
              <div style={{ padding: 12, borderRadius: 12, backgroundColor: '#000000', border: g0Pass ? '1px solid #10b981' : '1px solid #27272a', textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontFamily: THEME.fonts.mono, color: '#71717a' }}>G0 SCHEMA</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: g0Pass ? '#10b981' : '#ffffff', marginTop: 4 }}>
                  {g0Pass ? '0.8ms PASS' : 'READY'}
                </div>
              </div>

              <div style={{ padding: 12, borderRadius: 12, backgroundColor: '#000000', border: g1Refuse ? '1px solid #f093bf' : '1px solid #27272a', textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontFamily: THEME.fonts.mono, color: '#71717a' }}>G1 AST</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: g1Refuse ? '#f093bf' : '#ffffff', marginTop: 4 }}>
                  {g1Refuse ? '3.6ms REFUSED' : 'SCANNING'}
                </div>
              </div>

              <div style={{ padding: 12, borderRadius: 12, backgroundColor: '#000000', border: '1px solid #27272a', textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontFamily: THEME.fonts.mono, color: '#71717a' }}>G2 BLAST</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#71717a', marginTop: 4 }}>0-COMPUTE</div>
              </div>

              <div style={{ padding: 12, borderRadius: 12, backgroundColor: '#000000', border: '1px solid #27272a', textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontFamily: THEME.fonts.mono, color: '#71717a' }}>G3 BISECT</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#71717a', marginTop: 4 }}>SKIPPED</div>
              </div>
            </div>

            <p style={{ fontSize: 18, color: '#a1a1aa', lineHeight: 1.5, margin: 0 }}>
              • AST Scanner identifies phantom symbol <code style={{ color: '#ffffff', fontFamily: THEME.fonts.mono }}>parseChunkHeader()</code> in 3.6ms.
              <br />
              • Execution terminates before container boot. 0.0ms runner CPU burned.
            </p>
          </div>

          <div
            style={{
              marginTop: 36,
              padding: 20,
              borderRadius: 16,
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontFamily: THEME.fonts.mono, fontSize: 15, color: '#10b981' }}>Outcome: Verifiable Defense</span>
            <span style={{ fontFamily: THEME.fonts.mono, fontSize: 20, fontWeight: 700, color: '#10b981' }}>$18,000 Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
};
