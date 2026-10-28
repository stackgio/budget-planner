import React from 'react';
import {Composition} from 'remotion';
import {DebtStory} from './DebtStory';
import {MarcusSheet} from './MarcusSheet';
import {FPS, H, W} from './theme';
import {TOTAL_FRAMES} from './timing';

export const DebtStoryCompositions: React.FC = () => (
	<>
		<Composition id="DebtStory" component={DebtStory} width={W} height={H} fps={FPS} durationInFrames={TOTAL_FRAMES} />
		<Composition id="MarcusSheet" component={MarcusSheet} width={W} height={H} fps={FPS} durationInFrames={60} />
	</>
);
