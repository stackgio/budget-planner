import React from 'react';
import {iris, matchCut, panelSweep} from '../../story/components/Transitions';
import {makeCalculateMetadata, NarratedVideo, narratedSchema, type NarratedProps, type VideoDef} from '../../story/lib/NarratedVideo';
import {cinematic} from '../../story/theme';
import {SCENES, SCRIPT, TAIL_SEC} from './script';
import {HookScene} from './scenes/HookScene';
import {MathScene} from './scenes/MathScene';
import {BridgeScene} from './scenes/BridgeScene';
import {RedeemScene} from './scenes/RedeemScene';
import {PlanScene} from './scenes/PlanScene';
import {EndScene} from './scenes/EndScene';

type Id = (typeof SCENES)[number]['id'];

const DEF: VideoDef<Id> = {
	script: SCRIPT,
	scenes: SCENES,
	tailSec: TAIL_SEC,
	captionCase: 'sentence',
	captionInactiveAlpha: 0.9,
	captionRight: 120, // stay clear of the right-hand platform buttons
	components: {hook: HookScene, math: MathScene, bridge: BridgeScene, redeem: RedeemScene, plan: PlanScene, end: EndScene},
	looks: {hook: cinematic, math: cinematic, bridge: cinematic, redeem: cinematic, plan: cinematic, end: cinematic},
	transitions: {
		// the card's glow opens into the money it earns
		math: {presentation: iris({x: 540, y: 966})},
		// chapter change: "here's how"
		bridge: {presentation: panelSweep({color: cinematic.accent, direction: 'left'}), timing: 'spring'},
		// redeem: hard cut (0 frames) on "I can go into the Rewards tab"
		// plan: no transition (same VOO shot continues)
		// same Marcus, same spot
		end: {presentation: matchCut()},
	},
};

export const RobinhoodGoldCardSchema = narratedSchema;
export const calculateRobinhoodGoldCardMetadata = makeCalculateMetadata(DEF);

/** This credit card pays me to invest */
export const RobinhoodGoldCard: React.FC<NarratedProps> = (props) => <NarratedVideo def={DEF} props={props} />;
