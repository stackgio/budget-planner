import React from 'react';
import {slide} from '@remotion/transitions/slide';
import {iris, panelSweep} from '../../story/components/Transitions';
import {makeCalculateMetadata, NarratedVideo, narratedSchema, type NarratedProps, type VideoDef} from '../../story/lib/NarratedVideo';
import {cinematic, editorial} from '../../story/theme';
import {SCENES, SCRIPT, TAIL_SEC} from './script';
import {HookScene} from './scenes/HookScene';
import {CarScene} from './scenes/CarScene';
import {CARD_POS, CardScene} from './scenes/CardScene';
import {MatchScene} from './scenes/MatchScene';
import {EndScene} from './scenes/EndScene';

type Id = (typeof SCENES)[number]['id'];

const DEF: VideoDef<Id> = {
	script: SCRIPT,
	scenes: SCENES,
	tailSec: TAIL_SEC,
	components: {hook: HookScene, car: CarScene, card: CardScene, match: MatchScene, end: EndScene},
	looks: {hook: cinematic, car: editorial, card: cinematic, match: editorial, end: editorial},
	transitions: {
		car: {presentation: slide({direction: 'from-bottom'}), timing: 'spring'},
		card: {presentation: iris(CARD_POS)},
		match: {presentation: panelSweep({color: editorial.accent, direction: 'up'})},
		end: {presentation: slide({direction: 'from-right'}), timing: 'spring'},
	},
};

export const MoneyMistakes22Schema = narratedSchema;
export const calculateMoneyMistakes22Metadata = makeCalculateMetadata(DEF);

/** 3 Money Mistakes I Made at 22 */
export const MoneyMistakes22: React.FC<NarratedProps> = (props) => <NarratedVideo def={DEF} props={props} />;
