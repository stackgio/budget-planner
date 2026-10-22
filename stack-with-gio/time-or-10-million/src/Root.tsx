import React from 'react';
import {Composition} from 'remotion';
import {Video} from './Video';
import {DURATION} from './timing';
import {FPS, H, W} from './theme';

export const Root: React.FC = () => (
  <Composition id="TimeOr10Million" component={Video} durationInFrames={DURATION} fps={FPS} width={W} height={H} />
);
