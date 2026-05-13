import React from 'react';
import { Series } from 'remotion';
import { IntroSingle } from './IntroSingle';
import { ZodiacSingleSegment } from './ZodiacSingleSegment';
import { OutroSingle } from './OutroSingle';

export const MainSingle = ({ zodiac }) => {
  const introDuration = 240;
  const zodiacDuration = 340;
  const outroDuration = 120;

  return (
    <Series>
      <Series.Sequence durationInFrames={introDuration}>
        <IntroSingle zodiac={zodiac} />
      </Series.Sequence>

      <Series.Sequence durationInFrames={zodiacDuration}>
        <ZodiacSingleSegment zodiac={zodiac} />
      </Series.Sequence>

      <Series.Sequence durationInFrames={outroDuration}>
        <OutroSingle />
      </Series.Sequence>
    </Series>
  );
};
