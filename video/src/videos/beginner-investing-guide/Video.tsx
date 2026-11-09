import React from 'react';
import {fade} from '@remotion/transitions/fade';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {iris, matchCut, panelSweep} from '../../story/components/Transitions';
import {makeCalculateMetadata, NarratedVideo, narratedSchema, type NarratedProps, type VideoDef} from '../../story/lib/NarratedVideo';
import {brandDark} from '../../story/theme';
import {SCENES, SCRIPT, TAIL_SEC, type SceneId} from './script';
import {HookScene} from './scenes/HookScene';
import {IntroScene} from './scenes/IntroScene';
import {AppsScene} from './scenes/AppsScene';
import {AccountScene} from './scenes/AccountScene';
import {BankScene} from './scenes/BankScene';
import {StuckScene} from './scenes/StuckScene';
import {EtfScene} from './scenes/EtfScene';
import {VooScene} from './scenes/VooScene';
import {FractionScene} from './scenes/FractionScene';
import {BuyScene} from './scenes/BuyScene';
import {DividendScene} from './scenes/DividendScene';
import {HabitScene} from './scenes/HabitScene';
import {RiskScene} from './scenes/RiskScene';
import {EndScene} from './scenes/EndScene';

const DEF: VideoDef<SceneId> = {
	script: SCRIPT,
	scenes: SCENES,
	tailSec: TAIL_SEC,
	components: {
		hook: HookScene,
		intro: IntroScene,
		apps: AppsScene,
		account: AccountScene,
		bank: BankScene,
		stuck: StuckScene,
		etf: EtfScene,
		voo: VooScene,
		fraction: FractionScene,
		buy: BuyScene,
		dividend: DividendScene,
		habit: HabitScene,
		risk: RiskScene,
		end: EndScene,
	},
	looks: Object.fromEntries(SCENES.map((s) => [s.id, brandDark])) as Record<SceneId, typeof brandDark>,
	transitions: {
		intro: {presentation: slide({direction: 'from-bottom'})}, // into the person behind it
		apps: {presentation: wipe({direction: 'from-left'})}, // step 01 begins
		account: {presentation: slide({direction: 'from-right'})}, // next step
		bank: {presentation: panelSweep({color: '#12361A', direction: 'up'}), timing: 'spring'}, // money moves up the chain
		stuck: {presentation: fade()}, // pause: the stuck moment
		etf: {presentation: matchCut()}, // ticker cluster continues into the basket
		voo: {presentation: iris({x: 540, y: 1150})}, // out of the basket: my fund
		fraction: {presentation: slide({direction: 'from-bottom'})},
		buy: {presentation: wipe({direction: 'from-right'})}, // into the real app
		dividend: {presentation: panelSweep({color: '#12361A', direction: 'left'}), timing: 'spring'}, // chapter: what happens after
		habit: {presentation: slide({direction: 'from-right'})},
		risk: {presentation: fade()}, // tone shift: calm and honest
		end: {presentation: iris({x: 540, y: 960})},
	},
};

export const BeginnerInvestingGuideSchema = narratedSchema;
export const calculateBeginnerInvestingGuideMetadata = makeCalculateMetadata(DEF);

/** The Complete Beginner Investing Guide — Stack With Gio */
export const BeginnerInvestingGuide: React.FC<NarratedProps> = (props) => <NarratedVideo def={DEF} props={props} />;
