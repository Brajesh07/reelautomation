import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { theme } from '../remotion/theme';
import { ZodiacRing } from '../remotion/ZodiacRing';

const PHASES = {
  RING_ENTER: { start: 0,  end: 30  },
  LINE1:      { start: 30, end: 65  },
  CTA_BOX:    { start: 60, end: 85  },
  HOLD:       { start: 85, end: 90  },
  EXIT:       { start: 90, end: 120 },
};

export const OutroSingle = () => {
  const frame = useCurrentFrame();

  const ringOpacity = interpolate(
    frame,
    [PHASES.RING_ENTER.start, PHASES.RING_ENTER.end],
    [0, 0.4],
    { extrapolateRight: 'clamp' }
  );
  const ringScale = interpolate(
    frame,
    [PHASES.RING_ENTER.start, PHASES.RING_ENTER.end],
    [0, 1],
    { extrapolateRight: 'clamp' }
  );
  const ringRotation = interpolate(frame, [0, 120], [0, 360], { extrapolateRight: 'clamp' });

  const line1Str = "Want a personalised reading?";
  const line1Progress = interpolate(
    frame,
    [PHASES.LINE1.start, PHASES.LINE1.end],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const visibleLine1 = line1Str.slice(0, Math.floor(line1Progress * line1Str.length));

  const ctaBoxScale = interpolate(
    frame,
    [PHASES.CTA_BOX.start, PHASES.CTA_BOX.end],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.33, 1, 0.68, 1),
    }
  );

  const globalExitOpacity = interpolate(
    frame,
    [PHASES.EXIT.start, PHASES.EXIT.end],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const globalExitScale = interpolate(
    frame,
    [PHASES.EXIT.start, PHASES.EXIT.end],
    [1, 0.95],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const commonTextStyle = {
    fontSize: theme.typography.titleSize,
    color: theme.colors.accent,
    margin: '0',
    fontWeight: 'bold',
    textAlign: 'center',
    maxWidth: '700px',
    lineHeight: '1.2',
  };

  return (
    <AbsoluteFill style={{
      backgroundColor: theme.colors.background,
      color: theme.colors.primary,
      fontFamily: theme.typography.fontFamily,
    }}>
      <div style={{
        opacity: globalExitOpacity,
        transform: `scale(${globalExitScale})`,
        height: '100%',
        width: '100%',
      }}>
        <ZodiacRing
          rotation={ringRotation}
          scale={ringScale}
          opacity={ringOpacity}
          highlightedNames={[]}
          nonHighlightOpacity={1}
        />

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 40,
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}>
          <h1 style={commonTextStyle}>{visibleLine1}</h1>

          <div style={{
            position: 'relative',
            width: 'fit-content',
            minHeight: '100px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px 50px',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: theme.colors.accent,
              transformOrigin: 'left',
              transform: `scaleX(${ctaBoxScale})`,
            }} />
            <p style={{
              position: 'relative',
              color: '#000000',
              fontSize: theme.typography.outroTitleSize,
              fontWeight: 'bold',
              fontFamily: theme.typography.fontFamily,
              margin: 0,
              textAlign: 'center',
              clipPath: `inset(0 ${100 - ctaBoxScale * 100}% 0 0)`,
            }}>Visit starryvibes.ai.</p>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
