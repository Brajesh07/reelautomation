import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, useCurrentFrame } from 'remotion';
import { theme } from '../remotion/theme';
import { ZodiacRing } from '../remotion/ZodiacRing';

export const IntroSingle = ({ zodiac }) => {
  const frame = useCurrentFrame();
  
  // Phase 1: Ring Entrance and Rotation (0 -> 90)
  const ringOpacity = interpolate(frame, [0, 90], [0, 1], { extrapolateRight: 'clamp' });
  const ringScale = interpolate(frame, [0, 90], [0, 1], { extrapolateRight: 'clamp' });
  const ringRotation = interpolate(frame, [0, 150], [0, 360], { extrapolateRight: 'clamp' });

  // Phase 2: Text Type Animation (Each line 60 -> 90)
  const line1Str = "DAILY";
  const line2Str = "HOROSCOPE";
  const line3Str = "FOR";

  const t1 = interpolate(frame, [60, 70], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const t2 = interpolate(frame, [70, 80], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const t3 = interpolate(frame, [80, 90], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const line1Visible = frame >= 70 ? line1Str : line1Str.slice(0, Math.floor(t1 * line1Str.length));
  const line2Visible = frame >= 80 ? line2Str : line2Str.slice(0, Math.floor(t2 * line2Str.length));
  const line3Visible = frame >= 90 ? line3Str : line3Str.slice(0, Math.floor(t3 * line3Str.length));

  // Phase 3: Zodiac Name Typing + Highlight (120 -> 150)
  const zodiacNameStr = zodiac.name.toUpperCase();
  const zodiacTypingProgress = interpolate(frame, [120, 150], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  
  let revealedZodiac = "";
  if (frame >= 150) {
    revealedZodiac = zodiacNameStr;
  } else if (frame >= 120) {
    revealedZodiac = zodiacNameStr.slice(0, Math.floor(zodiacTypingProgress * zodiacNameStr.length));
  }
  
  const highlightedNames = [zodiac.name];

  // Formatting Date — dynamically derived from today's date at render time
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
  const dateOpacity = interpolate(frame, [140, 150], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Phase 5: Fade Out (180 -> 240)
  const introFadeOpacity = interpolate(frame, [180, 240], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const introFadeScale = interpolate(frame, [180, 240], [1, 0.95], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const commonTextStyle = {
    fontSize: theme.typography.titleSize, 
    color: theme.colors.accent, 
    margin: '0',
    fontWeight: 'bold',
    textAlign: 'center',
    whiteSpace: 'nowrap'
  };

  return (
    <AbsoluteFill style={{
      backgroundColor: theme.colors.background,
      color: theme.colors.primary,
      fontFamily: theme.typography.fontFamily,
    }}>
      <div style={{
        opacity: introFadeOpacity,
        transform: `scale(${introFadeScale})`,
        height: '100%',
        width: '100%',
      }}>
        <ZodiacRing 
          rotation={ringRotation} 
          scale={ringScale}
          opacity={ringOpacity}
          highlightedNames={highlightedNames}
          nonHighlightOpacity={0.2} // Dimmed others more for single mode
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', pointerEvents: 'none' }}>
          <h1 style={commonTextStyle}>{line1Visible}</h1>
          <h1 style={commonTextStyle}>{line2Visible}</h1>
          <h1 style={commonTextStyle}>{line3Visible}</h1>
          <p style={{ ...commonTextStyle, fontSize: '45px', maxWidth: '800px' }}>{revealedZodiac}</p>
          <p style={{ ...commonTextStyle, fontSize: theme.typography.bodySize, opacity: dateOpacity }}>{dateStr}</p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
