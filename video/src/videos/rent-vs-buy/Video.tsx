import React from 'react';
import {z} from 'zod';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {useCurrentFrame} from 'remotion';
import {BrandBug} from '../../story/components/Chrome';
import {iris, matchCut, panelSweep} from '../../story/components/Transitions';
import {makeCalculateMetadata, NarratedVideo, narratedSchema, type VideoDef} from '../../story/lib/NarratedVideo';
import {cinematic, editorial, type Palette} from '../../story/theme';
import {SCENES, SCRIPT, TAIL_SEC, type SceneId} from './script';
import {HookScene} from './scenes/HookScene';
import {ParentsScene} from './scenes/ParentsScene';
import {PaycheckScene} from './scenes/PaycheckScene';
import {KeysScene} from './scenes/KeysScene';
import {JulyScene} from './scenes/JulyScene';
import {OutcomesScene} from './scenes/OutcomesScene';
import {CookedScene} from './scenes/CookedScene';
import {EquityScene} from './scenes/EquityScene';
import {GainScene} from './scenes/GainScene';
import {TaxScene} from './scenes/TaxScene';
import {DecisionScene} from './scenes/DecisionScene';
import {EndScene} from './scenes/EndScene';
import {white} from './scenes/shared';

/** Subtle Stack With Gio bug during the narration (top-left, inside the safe area). */
const Watermark: React.FC<{paletteAt: (f: number) => Palette}> = ({paletteAt}) => {
	const frame = useCurrentFrame();
	return <BrandBug palette={paletteAt(frame)} opacity={0.55} style={{left: 72, top: 176, transform: 'scale(0.82)', transformOrigin: '0 0'}} />;
};

const LOOKS: Record<SceneId, Palette> = {
	hook: cinematic,
	parents: editorial,
	paycheck: editorial,
	keys: cinematic,
	july: cinematic,
	outcomes: cinematic,
	cooked: cinematic,
	equity: white,
	gain: white,
	tax: editorial,
	decision: editorial,
	end: cinematic,
};

export const DEF: VideoDef<SceneId> = {
	script: SCRIPT,
	scenes: SCENES,
	tailSec: TAIL_SEC,
	components: {
		hook: HookScene,
		parents: ParentsScene,
		paycheck: PaycheckScene,
		keys: KeysScene,
		july: JulyScene,
		outcomes: OutcomesScene,
		cooked: CookedScene,
		equity: EquityScene,
		gain: GainScene,
		tax: TaxScene,
		decision: DecisionScene,
		end: EndScene,
	},
	looks: LOOKS,
	transitions: {
		parents: {presentation: panelSweep({color: editorial.bg, direction: 'up'}), timing: 'spring'}, // brighter editorial look
		paycheck: {presentation: slide({direction: 'from-right'})}, // the question pivots
		keys: {presentation: wipe({direction: 'from-left'})}, // "So boom" — brisk
		july: {presentation: matchCut()}, // key turn → thermostat dial, same framing
		outcomes: {presentation: slide({direction: 'from-bottom'})},
		equity: {presentation: panelSweep({color: '#FFFFFF', direction: 'left'}), timing: 'spring'}, // clean bright reset
		gain: {presentation: slide({direction: 'from-right'})},
		tax: {presentation: wipe({direction: 'from-top'})},
		decision: {presentation: iris({x: 540, y: 960})}, // back to me
		end: {presentation: matchCut()}, // the $5,000 estimate continues full-frame
	},
	overlay: Watermark,
	captionBackdrop: true,
};

export const RentVsBuySchema = narratedSchema;
type Props = z.infer<typeof RentVsBuySchema>;

export const calculateRentVsBuyMetadata = makeCalculateMetadata(DEF);

/** Why I'd Rather Rent Right Now */
export const RentVsBuy: React.FC<Props> = (props) => {
	return <NarratedVideo def={DEF} props={props} />;
};
