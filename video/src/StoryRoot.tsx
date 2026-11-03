import React from 'react';
import {Composition} from 'remotion';
import {MarcusGallery} from './story/gallery/MarcusGallery';
import {story} from './story/theme';
import {calculateDebtMetadata, DebtThreeThings, debtThreeThingsSchema} from './videos/debt-three-things/DebtThreeThings';
import {MoneyMistakes22, MoneyMistakes22Schema, calculateMoneyMistakes22Metadata} from './videos/money-mistakes-22/Video';
// @motion-imports (scripts/motion/new-video.mjs adds imports above this line)

/** Story-video compositions (Marcus / editorial / cinematic system). */
export const StoryCompositions: React.FC = () => (
	<>
		<Composition
			id="DebtThreeThings"
			component={DebtThreeThings}
			schema={debtThreeThingsSchema}
			width={story.width}
			height={story.height}
			fps={story.fps}
			durationInFrames={1200}
			defaultProps={debtThreeThingsSchema.parse({})}
			calculateMetadata={calculateDebtMetadata}
		/>
		<Composition id="MarcusGallery" component={MarcusGallery} width={story.width} height={story.height} fps={story.fps} durationInFrames={90} />
		<Composition id="MoneyMistakes22" component={MoneyMistakes22} schema={MoneyMistakes22Schema} width={story.width} height={story.height} fps={story.fps} durationInFrames={900} defaultProps={MoneyMistakes22Schema.parse({})} calculateMetadata={calculateMoneyMistakes22Metadata} />
		{/* @motion-compositions (scripts/motion/new-video.mjs adds compositions above this line) */}
	</>
);
