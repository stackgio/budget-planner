import React from 'react';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {panelSweep} from '../../story/components/Transitions';
import {makeCalculateMetadata, NarratedVideo, narratedSchema, type NarratedProps, type VideoDef} from '../../story/lib/NarratedVideo';
import {cinematic, editorial} from '../../story/theme';
import {SCENES, SCRIPT, TAIL_SEC} from './script';
import {HookScene, NumbersScene} from './scenes/MarketScenes';
import {ConvictScene, WhyScene} from './scenes/SofiScenes';
import {AskScene, LearnScene, RiskScene} from './scenes/StoryScenes';

type Id = (typeof SCENES)[number]['id'];

const DEF: VideoDef<Id> = {
	script: SCRIPT,
	scenes: SCENES,
	tailSec: TAIL_SEC,
	components: {hook: HookScene, numbers: NumbersScene, why: WhyScene, learn: LearnScene, risk: RiskScene, convict: ConvictScene, ask: AskScene},
	looks: {hook: cinematic, numbers: cinematic, why: cinematic, learn: editorial, risk: editorial, convict: cinematic, ask: cinematic},
	transitions: {
		numbers: {presentation: slide({direction: 'from-bottom'}), timing: 'spring'},
		why: {presentation: wipe({direction: 'from-left'})},
		learn: {presentation: panelSweep({color: editorial.bg, direction: 'left'})},
		risk: {presentation: slide({direction: 'from-right'}), timing: 'spring'},
		convict: {presentation: slide({direction: 'from-bottom'}), timing: 'spring'},
		ask: {presentation: wipe({direction: 'from-top'})},
	},
	captionEmphasis: ['panic-selling,', 'opposite.', 'more', 'SoFi', 'Nasdaq', '5.5%,', 'S&P', '500', '4%.', 'record', '$1.4', 'billion', '17', 'million', '22,', 'learning', 'deal.', 'further.', "SoFi's", 'long-term', 'buy', 'dip,', 'wait', 'drop?', 'advice.', 'research.'],
};

export const SofiDipSchema = narratedSchema;
export const calculateSofiDipMetadata = makeCalculateMetadata(DEF);

/** Everyone Was Panicking. I Bought More. */
export const SofiDip: React.FC<NarratedProps> = (props) => <NarratedVideo def={DEF} props={props} />;
