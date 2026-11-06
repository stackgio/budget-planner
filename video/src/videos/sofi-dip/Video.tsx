import React from 'react';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {iris, matchCut, panelSweep} from '../../story/components/Transitions';
import {makeCalculateMetadata, NarratedVideo, narratedSchema, type NarratedProps, type VideoDef} from '../../story/lib/NarratedVideo';
import {cinematic, editorial} from '../../story/theme';
import {SCENES, SCRIPT, TAIL_SEC} from './script';
import {NumbersScene, OppScene, OppositeScene, PanicScene} from './scenes/MarketScenes';
import {ConvictScene, SofiScene, WhyScene} from './scenes/SofiScenes';
import {AskScene, LearnScene, RiskScene} from './scenes/StoryScenes';

type Id = (typeof SCENES)[number]['id'];

const DEF: VideoDef<Id> = {
	script: SCRIPT,
	scenes: SCENES,
	tailSec: TAIL_SEC,
	components: {
		panic: PanicScene,
		opposite: OppositeScene,
		numbers: NumbersScene,
		opp: OppScene,
		sofi: SofiScene,
		why: WhyScene,
		learn: LearnScene,
		risk: RiskScene,
		convict: ConvictScene,
		ask: AskScene,
	},
	looks: {
		panic: cinematic,
		opposite: cinematic,
		numbers: cinematic,
		opp: cinematic,
		sofi: editorial,
		why: cinematic,
		learn: editorial,
		risk: editorial,
		convict: cinematic,
		ask: cinematic,
	},
	transitions: {
		opposite: {presentation: matchCut()}, // same chart, it just freezes
		numbers: {presentation: slide({direction: 'from-bottom'}), timing: 'spring'},
		opp: {presentation: wipe({direction: 'from-left'})},
		sofi: {presentation: panelSweep({color: cinematic.accent, direction: 'up'}), timing: 'spring'}, // the decision
		why: {presentation: iris({x: 540, y: 300})}, // opens from the ticker
		learn: {presentation: panelSweep({color: editorial.bg, direction: 'left'})},
		risk: {presentation: matchCut()}, // through the laptop screen
		convict: {presentation: slide({direction: 'from-right'}), timing: 'spring'},
		ask: {presentation: wipe({direction: 'from-top'})},
	},
	captionEmphasis: ['panic-selling,', 'opposite.', 'more', 'Nasdaq', '5.5%,', 'S&P', '500', '4%.', 'opportunity.', 'SoFi', 'record', '$1.4', 'billion', '17', 'million', '22,', 'learning', 'further.', "SoFi's", 'long-term', 'buy', 'dip,', 'wait', 'drop?', 'advice.', 'research.'],
};

export const SofiDipSchema = narratedSchema;
export const calculateSofiDipMetadata = makeCalculateMetadata(DEF);

/** Everyone Was Panicking. I Bought More. */
export const SofiDip: React.FC<NarratedProps> = (props) => <NarratedVideo def={DEF} props={props} />;
