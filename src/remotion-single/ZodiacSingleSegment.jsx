import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { theme } from '../remotion/theme';
import { ZodiacSection } from '../remotion/ZodiacSection';
import { ZODIAC_IMAGES } from '../remotion/assets';
import heartImg from '../images/heart.png';
import trophyImg from '../images/trophy.png';
import moneyBagImg from '../images/money-bag.png';
import crystalBallImg from '../images/crystal-ball.png';

export const ZodiacSingleSegment = ({ zodiac }) => {
  const frame = useCurrentFrame();
  const { name, vibe } = zodiac;

  const PHASES = {
    DECORATIVE: { start: 0, end: 30 },
    ICON: { start: 0, end: 45 },
    NAME: { start: 45, end: 75 },
    VIBE: { start: 75, end: 120 },
    SECTIONS: { 
      LOVE: { start: 120, end: 157 },
      CAREER: { start: 151, end: 188 },
      MONEY: { start: 182, end: 219 },
      SOUL: { start: 213, end: 250 },
    },
    HOLD: { start: 250, end: 310 },
    EXIT: { start: 310, end: 340 }
  };

  const iconOpacity = interpolate(frame, [PHASES.ICON.start, PHASES.ICON.end], [0, 1], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const iconX = interpolate(frame, [PHASES.ICON.start, PHASES.ICON.end], [-300, 0], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const iconRotation = interpolate(frame, [PHASES.ICON.start, PHASES.ICON.end], [-360, 0], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const globalExitOpacity = interpolate(frame, [PHASES.EXIT.start, PHASES.EXIT.end], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const nameToUpper = name.toUpperCase();
  const nameProgress = interpolate(frame, [PHASES.NAME.start, PHASES.NAME.end], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const visibleName = nameToUpper.substring(0, Math.floor(nameProgress * nameToUpper.length));

  const fullVibe = `Vibe: ${vibe}`;
  const vibeProgress = interpolate(frame, [PHASES.VIBE.start, PHASES.VIBE.end], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const visibleVibe = vibeProgress > 0 ? fullVibe.substring(0, Math.floor(vibeProgress * fullVibe.length)) : "";

  const iconSrc = ZODIAC_IMAGES[name];

  // Decorative Background Animations
  const decoOpacity = interpolate(
    frame,
    [PHASES.DECORATIVE.start, PHASES.DECORATIVE.end],
    [0, 0.4],
    { extrapolateRight: 'clamp' }
  );

  const decoTranslateY = interpolate(
    frame,
    [PHASES.DECORATIVE.start, PHASES.DECORATIVE.end],
    [50, 0],
    { extrapolateRight: 'clamp' }
  );

  const imgWidth = 450;

  return (
    <AbsoluteFill style={{
      backgroundColor: theme.colors.background,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: theme.colors.primary,
      fontFamily: theme.typography.fontFamily,
      padding: '40px 0',
      textAlign: 'center',
      position: 'relative',
    }}>
      <div style={{opacity: globalExitOpacity, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
        {/* Decorative Background Layer */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '400px',
          opacity: decoOpacity,
          transform: `translateY(${decoTranslateY}px)`,
          zIndex: 0,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end'
        }}>
          <img src={heartImg} alt="heart" style={{ width: imgWidth, height: 'auto', objectFit: 'contain', margin: '0 -40px' }} />
          <img src={trophyImg} alt="trophy" style={{ width: imgWidth, height: 'auto', objectFit: 'contain', margin: '0 -40px' }} />
          <img src={moneyBagImg} alt="money bag" style={{ width: imgWidth, height: 'auto', objectFit: 'contain', margin: '0 -40px' }} />
          <img src={crystalBallImg} alt="crystal ball" style={{ width: imgWidth, height: 'auto', objectFit: 'contain', margin: '0 -40px' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `translateX(${iconX}px)`, opacity: iconOpacity, marginBottom: 30 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            {iconSrc && <img src={iconSrc} alt={name} style={{ width: 120, height: 120, transform: `rotate(${iconRotation}deg)` }} />}
            <h1 style={{ fontSize: '60px', color: theme.colors.accent, margin: 0 }}>{visibleName}</h1>
          </div>
          <p style={{ fontSize: '42px', lineHeight: '1.4', minHeight: '1.4em', margin: 0, width: '90%' }}>{visibleVibe}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: "column", gap: 45, alignItems: 'center', width: '100%' }}>
          <ZodiacSection title="LOVE" content={zodiac?.love || "Love is in the stars."} phase={PHASES.SECTIONS.LOVE} />
          <ZodiacSection title="CAREER" content={zodiac?.career || "Focus on your goals."} phase={PHASES.SECTIONS.CAREER} />
          <ZodiacSection title="MONEY" content={zodiac?.money || "Financial abundance is coming."} phase={PHASES.SECTIONS.MONEY} />
          <ZodiacSection title="SOUL MESSAGE" content={zodiac?.soulMessage || "Listen to your inner voice."} phase={PHASES.SECTIONS.SOUL} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
