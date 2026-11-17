import React from 'react';
import {slide} from '@remotion/transitions/slide';
import {iris, matchCut} from '../../story/components/Transitions';
import {makeCalculateMetadata, NarratedVideo, narratedSchema, type NarratedProps, type VideoDef} from '../../story/lib/NarratedVideo';
import {cinematic} from '../../story/theme';
import {SCENES, SCRIPT, TAIL_SEC, type SceneId} from './script';
import {HookScene} from './scenes/HookScene';
import {BasketScene} from './scenes/BasketScene';
import {UsScene} from './scenes/UsScene';
import {WorldScene} from './scenes/WorldScene';
import {SchdScene} from './scenes/SchdScene';
import {PayoffScene} from './scenes/PayoffScene';
import {EndScene} from './scenes/EndScene';

const DEF: VideoDef<SceneId> = {
	script: SCRIPT,
	scenes: SCENES,
	tailSec: TAIL_SEC,
	components: {hook: HookScene, basket: BasketScene, us: UsScene, world: WorldScene, schd: SchdScene, payoff: PayoffScene, end: EndScene},
	looks: {hook: cinematic, basket: cinematic, us: cinematic, world: cinematic, schd: cinematic, payoff: cinematic, end: cinematic},
	transitions: {
		basket: {presentation: slide({direction: 'from-bottom'}), timing: 'spring'},
		us: {presentation: matchCut()},
		world: {presentation: iris({x: 540, y: 760})},
		schd: {presentation: slide({direction: 'from-right'}), timing: 'spring'},
		payoff: {presentation: matchCut()},
		end: {presentation: slide({direction: 'from-bottom'}), timing: 'spring'},
	},
};

export const FiveEtfsForBeginnersSchema = narratedSchema;
export const calculateFiveEtfsForBeginnersMetadata = makeCalculateMetadata(DEF);

/** 5 ETFs for Beginners — Stack With Gio */
export const FiveEtfsForBeginners: React.FC<NarratedProps> = (props) => <NarratedVideo def={DEF} props={props} />;
