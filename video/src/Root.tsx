import React from 'react';
import { Composition } from 'remotion';
import { MainVideo } from './MainVideo';

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="IgrisPromo"
        component={MainVideo}
        durationInFrames={2330} // 77.6s at 30fps matching full ElevenLabs voiceover + SFX
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
