import React from 'react';
import { Series } from 'remotion';
import { IntroSegment } from './IntroSegment';
import { ZodiacSegment } from './ZodiacSegment';
import { OutroSegment } from './OutroSegment';

// Must match PHASES.EXIT.end in ZodiacSegment.jsx — the frame where globalExitOpacity reaches 0
const ZODIAC_SEQUENCE_DURATION = 340;

export const Main = ({ zodiacs = [] }) => {
  const introDuration = 240;
  const outroDuration = 120;

  if (!zodiacs || zodiacs.length === 0) {
    return (
      <AbsoluteFill style={{ backgroundColor: 'black', color: 'white', justifyContent: 'center', alignItems: 'center' }}>
        <h1 style={{ fontSize: '60px' }}>No Zodiac Data Found</h1>
      </AbsoluteFill>
    );
  }

  return (
    <Series>
      <Series.Sequence durationInFrames={introDuration}>
        <IntroSegment zodiacs={zodiacs} />
      </Series.Sequence>

      {zodiacs.map((zodiac) => (
        <Series.Sequence key={zodiac.name} durationInFrames={ZODIAC_SEQUENCE_DURATION}>
          <ZodiacSegment name={zodiac.name} vibe={zodiac.vibe} zodiacData={zodiac} />
        </Series.Sequence>
      ))}

      <Series.Sequence durationInFrames={outroDuration}>
        <OutroSegment />
      </Series.Sequence>
    </Series>
  );
};
