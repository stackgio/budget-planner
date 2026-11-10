import React from 'react';
import {Composition} from 'remotion';
import {MarcusGallery} from './story/gallery/MarcusGallery';
import {story} from './story/theme';
import {calculateDebtMetadata, DebtThreeThings, debtThreeThingsSchema} from './videos/debt-three-things/DebtThreeThings';
import {CarPaymentReality, CarPaymentRealitySchema, calculateCarPaymentRealityMetadata} from './videos/car-payment-reality/Video';
import {CarPaymentRealityV2, CarPaymentRealityV2Schema, calculateCarPaymentRealityV2Metadata} from './videos/car-payment-reality-v2/Video';
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
		<Composition id="CarPaymentReality" component={CarPaymentReality} schema={CarPaymentRealitySchema} width={story.width} height={story.height} fps={story.fps} durationInFrames={900} defaultProps={CarPaymentRealitySchema.parse({})} calculateMetadata={calculateCarPaymentRealityMetadata} />
		<Composition id="CarPaymentRealityV2" component={CarPaymentRealityV2} schema={CarPaymentRealityV2Schema} width={story.width} height={story.height} fps={story.fps} durationInFrames={900} defaultProps={CarPaymentRealityV2Schema.parse({})} calculateMetadata={calculateCarPaymentRealityV2Metadata} />
		{/* @motion-compositions (scripts/motion/new-video.mjs adds compositions above this line) */}
	</>
);
