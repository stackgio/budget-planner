import React from 'react';
import {slide} from '@remotion/transitions/slide';
import {matchCut} from '../../story/components/Transitions';
import {makeCalculateMetadata, NarratedVideo, narratedSchema, type NarratedProps, type VideoDef} from '../../story/lib/NarratedVideo';
import {cinematic} from '../../story/theme';
import {SCENES, SCRIPT, TAIL_SEC} from './script';
import {ProgressOverlay} from './ui';
import {OpenScene} from './scenes/OpenScene';
import {GroceriesScene} from './scenes/GroceriesScene';
import {SavingsScene} from './scenes/SavingsScene';
import {DebtScene} from './scenes/DebtScene';
import {FunScene} from './scenes/FunScene';
import {EndScene} from './scenes/EndScene';

type Id = (typeof SCENES)[number]['id'];

const DEF: VideoDef<Id> = {
	script: SCRIPT,
	scenes: SCENES,
	tailSec: TAIL_SEC,
	components: {open: OpenScene, groceries: GroceriesScene, savings: SavingsScene, debt: DebtScene, fun: FunScene, end: EndScene},
	looks: {open: cinematic, groceries: cinematic, savings: cinematic, debt: cinematic, fun: cinematic, end: cinematic},
	transitions: {
		groceries: {presentation: slide({direction: 'from-right'}), timing: 'spring'},
		savings: {presentation: slide({direction: 'from-bottom'}), timing: 'spring'},
		debt: {presentation: slide({direction: 'from-right'}), timing: 'spring'},
		fun: {presentation: slide({direction: 'from-bottom'}), timing: 'spring'},
		end: {presentation: matchCut()},
	},
	overlay: ProgressOverlay,
	captionVariant: 'phrase',
};

export const FiveThingsPaydaySchema = narratedSchema;
export const calculateFiveThingsPaydayMetadata = makeCalculateMetadata(DEF);

/** 5 Things to Do When You Get Paid */
export const FiveThingsPayday: React.FC<NarratedProps> = (props) => <NarratedVideo def={DEF} props={props} />;
