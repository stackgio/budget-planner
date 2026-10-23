import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C, FPS} from './lib';
import {SCENES, SFX} from './timing';
import {Captions, Finish, Watermark} from './ui';
import {S1Hook} from './scenes/S1Hook';
import {S2S3Car} from './scenes/S2S3Car';
import {S4Clothes} from './scenes/S4Clothes';
import {S5Cart} from './scenes/S5Cart';
import {S5Wear} from './scenes/S5Wear';
import {S6Impress} from './scenes/S6Impress';
import {S7Trap} from './scenes/S7Trap';
import {S8Rule} from './scenes/S8Rule';
import {S9CTA} from './scenes/S9CTA';

type SceneKey = keyof typeof SCENES;
const LAYERS: [SceneKey, React.FC][] = [
  ['hook', S1Hook],
  ['car', S2S3Car],
  ['clothes', S4Clothes],
  ['cart', S5Cart],
  ['wear', S5Wear],
  ['impress', S6Impress],
  ['trap', S7Trap],
  ['rule', S8Rule],
  ['cta', S9CTA],
];

// Scenes read absolute time (frame/FPS); each one is mounted only inside its window.
const Scene: React.FC<{k: SceneKey; C: React.FC}> = ({k, C: Comp}) => {
  const t = useCurrentFrame() / FPS;
  const [a, b] = SCENES[k];
  if (t < a || t >= b) return null;
  return <Comp />;
};

export const Main: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{background: C.bg}}>
      {LAYERS.map(([k, Comp]) => (
        <Scene key={k} k={k} C={Comp} />
      ))}
      <Captions />
      {t < 35.4 && <Watermark opacity={0.42} />}
      <Finish />
      <Audio src={staticFile('vo.mp3')} volume={1} />
      {SFX.map(([s, f, v], i) => (
        <Sequence key={i} from={Math.round(s * FPS)} durationInFrames={Math.round(1.6 * FPS)} layout="none">
          <Audio src={staticFile(`sfx/${f}.wav`)} volume={v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
