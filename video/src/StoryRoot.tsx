import React from 'react';
import {Composition} from 'remotion';
import {MarcusGallery} from './story/gallery/MarcusGallery';
import {story} from './story/theme';
import {calculateDebtMetadata, DebtThreeThings, debtThreeThingsSchema} from './videos/debt-three-things/DebtThreeThings';
import {PaydayCheckingSavings, PaydayCheckingSavingsSchema, calculatePaydayCheckingSavingsMetadata} from './videos/payday-checking-savings/Video';
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
		<Composition id="PaydayCheckingSavings" component={PaydayCheckingSavings} schema={PaydayCheckingSavingsSchema} width={story.width} height={story.height} fps={story.fps} durationInFrames={900} defaultProps={PaydayCheckingSavingsSchema.parse({})} calculateMetadata={calculatePaydayCheckingSavingsMetadata} />
		{/* @motion-compositions (scripts/motion/new-video.mjs adds compositions above this line) */}
	</>
);
