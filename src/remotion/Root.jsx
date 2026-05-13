import { Composition, staticFile } from 'remotion';
import { Main } from './Main';
import { MainSingle } from '../remotion-single/MainSingle';
import data from '../../public/data.json';

// Keep in sync with ZODIAC_SEQUENCE_DURATION in Main.jsx and PHASES.EXIT.end in ZodiacSegment.jsx
const INTRO_DURATION = 240;
const ZODIAC_SEQUENCE_DURATION = 340;
const OUTRO_DURATION = 120;
const totalDuration = INTRO_DURATION + (data.zodiacs.length * ZODIAC_SEQUENCE_DURATION) + OUTRO_DURATION;
// 240 + (3 × 340) + 120 = 1380 frames = 46 seconds @ 30fps

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="AstrologyReel"
        component={Main}
        durationInFrames={totalDuration}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          zodiacs: data.zodiacs,
        }}
      />
      <Composition
        id="SingleZodiacReel"
        component={MainSingle}
        durationInFrames={700}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          zodiac: data.zodiacs[0],
        }}
      />
    </>
  );
};
