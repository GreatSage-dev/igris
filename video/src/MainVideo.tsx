import React from 'react';
import { Audio, Sequence, staticFile } from 'remotion';
import { Scene1Crisis } from './scenes/Scene1Crisis';
import { Scene2Gatekeeper } from './scenes/Scene2Gatekeeper';
import { Scene3HardwareCascade } from './scenes/Scene3HardwareCascade';
import { Scene4GitBisect } from './scenes/Scene4GitBisect';
import { Scene5ProofCTA } from './scenes/Scene5ProofCTA';

export const MainVideo: React.FC = () => {
  return (
    <div style={{ flex: 1, backgroundColor: '#000000', width: '100%', height: '100%' }}>
      
      {/* ======================================================== */}
      {/* CINEMATIC SOUND EFFECTS LAYER                            */}
      {/* ======================================================== */}
      {/* Sub-bass riser building into the Scene 2 Igris reveal */}
      <Sequence from={420} durationInFrames={75}>
        <Audio src={staticFile('audio/sfx_riser.wav')} volume={0.7} />
      </Sequence>

      {/* Verification chime for Gate 1 refusal in Scene 3 */}
      <Sequence from={910} durationInFrames={55}>
        <Audio src={staticFile('audio/sfx_chime.wav')} volume={0.45} />
      </Sequence>

      {/* Verification chime for Git Bisect culprit identified in Scene 4 */}
      <Sequence from={1400} durationInFrames={55}>
        <Audio src={staticFile('audio/sfx_chime.wav')} volume={0.45} />
      </Sequence>

      {/* Heavy digital stamp impact when the SHA-256 seal slams down in Scene 5 */}
      <Sequence from={1850} durationInFrames={40}>
        <Audio src={staticFile('audio/sfx_stamp.wav')} volume={0.85} />
      </Sequence>


      {/* ======================================================== */}
      {/* SCENE 1: THE CRISIS (Frames 0 to 480 = 16.0s)            */}
      {/* ======================================================== */}
      <Sequence from={0} durationInFrames={480}>
        <Scene1Crisis />
        <Audio src={staticFile('audio/scene1_crisis.mp3')} volume={1} />
      </Sequence>


      {/* ======================================================== */}
      {/* SCENE 2: THE SILENT GATEKEEPER AWAKENS (Frames 480 - 840)*/}
      {/* ======================================================== */}
      <Sequence from={480} durationInFrames={360}>
        <Scene2Gatekeeper />
        <Audio src={staticFile('audio/scene2_gatekeeper.mp3')} volume={1} />
      </Sequence>


      {/* ======================================================== */}
      {/* SCENE 3: THE 4-GATE HARDWARE CASCADE (Frames 840 - 1330) */}
      {/* ======================================================== */}
      <Sequence from={840} durationInFrames={490}>
        <Scene3HardwareCascade />
        <Audio src={staticFile('audio/scene3_cascade.mp3')} volume={1} />
      </Sequence>


      {/* ======================================================== */}
      {/* SCENE 4: THE 7-YEAR WISHLIST SNIPE (Frames 1330 - 1850)  */}
      {/* ======================================================== */}
      <Sequence from={1330} durationInFrames={520}>
        <Scene4GitBisect />
        <Audio src={staticFile('audio/scene4_bisect.mp3')} volume={1} />
      </Sequence>


      {/* ======================================================== */}
      {/* SCENE 5: THE EVIDENCE RECEIPT & CLIMAX (Frames 1850-2330)*/}
      {/* ======================================================== */}
      <Sequence from={1850} durationInFrames={480}>
        <Scene5ProofCTA />
        <Audio src={staticFile('audio/scene5_proof_cta.mp3')} volume={1} />
      </Sequence>

    </div>
  );
};
