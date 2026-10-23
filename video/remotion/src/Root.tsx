import React from 'react';
import {Composition} from 'remotion';
import {DURATION_S, FPS, H, W} from './lib';
import {Main} from './Main';

export const Root: React.FC = () => (
    <Composition id="Main" component={Main} durationInFrames={Math.round(DURATION_S * FPS)} fps={FPS} width={W} height={H} />
);
