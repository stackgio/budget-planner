import React from 'react';
import {Composition, type CalculateMetadataFunction} from 'remotion';
import {GraphVideo} from './GraphVideo';
import {specSchema, type Spec} from './schema';
import {theme} from './theme';
// Studio preview only: synthetic pipeline self-test data, clearly labelled on screen.
import placeholder from './placeholder-spec.json';

const calculateMetadata: CalculateMetadataFunction<Spec> = ({props}) => {
	const spec = specSchema.parse(props);
	return {durationInFrames: Math.round(spec.durationSec * theme.fps), props: spec};
};

/**
 * One composition for every /graph video. Pass a project's spec with
 * --props=projects/<slug>/spec.json; duration comes from the spec.
 */
export const RemotionRoot: React.FC = () => (
	<Composition
		id="GraphVideo"
		component={GraphVideo}
		schema={specSchema}
		width={theme.width}
		height={theme.height}
		fps={theme.fps}
		durationInFrames={Math.round(23 * theme.fps)}
		defaultProps={specSchema.parse(placeholder)}
		calculateMetadata={calculateMetadata}
	/>
);
