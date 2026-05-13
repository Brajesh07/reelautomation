import React from 'react';
import { Composition } from 'remotion';
import { MainSingle } from './MainSingle';
import data from '../../public/data.json';

export const RootSingle = () => {
  return (
    <>
      <Composition
        id="SingleZodiacReel"
        component={MainSingle}
        durationInFrames={700}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          zodiac: data.zodiacs[0], // Default to first zodiac for preview
        }}
      />
    </>
  );
};
