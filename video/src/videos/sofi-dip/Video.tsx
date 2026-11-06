import React from 'react';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {iris, panelSweep} from '../../story/components/Transitions';
import {LAST} from './parts';
import {makeCalculateMetadata, NarratedVideo, narratedSchema, type NarratedProps, type VideoDef} from '../../story/lib/NarratedVideo';
import {cinematic, editorial} from '../../story/theme';
import {SCENES, SCRIPT, TAIL_SEC} from './script';
import {HookScene, NumbersScene, OppScene} from './scenes/MarketScenes';
import {DecideScene, WhyScene} from './scenes/SofiScenes';
import {AskScene, LearnScene, RiskScene} from './scenes/StoryScenes';

type Id = (typeof SCENES)[number]['id'];

const DEF: VideoDef<Id> = {
	script: SCRIPT,
	scenes: SCENES,
	tailSec: TAIL_SEC,
	components: {hook: HookScene, context: NumbersScene, opp: OppScene, reason: WhyScene, learn: LearnScene, risk: RiskScene, decide: DecideScene, ask: AskScene},
	looks: {hook: cinematic, context: cinematic, opp: cinematic, reason: cinematic, learn: editorial, risk: editorial, decide: cinematic, ask: cinematic},
	transitions: {
		context: {presentation: slide({direction: 'from-bottom'}), timing: 'spring'},
		opp: {presentation: wipe({direction: 'from-left'})},
		reason: {presentation: iris({x: LAST.x, y: LAST.y})}, // opens from the green Nov 5 point
		learn: {presentation: panelSweep({color: editorial.bg, direction: 'left'})},
		risk: {presentation: slide({direction: 'from-right'}), timing: 'spring'},
		decide: {presentation: panelSweep({color: cinematic.accent, direction: 'up'}), timing: 'spring'},
		ask: {presentation: wipe({direction: 'from-top'})},
	},
	captionEmphasis: ['panic-selling,', 'opposite.', 'more', 'hit', 'yesterday,', 'Nasdaq', '5.5%,', 'S&P', '500', '4%.', 'opportunity.', 'SoFi', 'record', '$1.4', 'billion', '17', 'million', '22,', 'learning', 'deal.', 'further.', "SoFi's", 'long-term', 'buy', 'dip,', 'wait', 'drop?', 'advice.', 'research.'],
};

export const SofiDipSchema = narratedSchema;
export const calculateSofiDipMetadata = makeCalculateMetadata(DEF);

/** Everyone Was Panicking. I Bought More. */
export const SofiDip: React.FC<NarratedProps> = (props) => <NarratedVideo def={DEF} props={props} />;
