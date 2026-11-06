import React from 'react';
import {AbsoluteFill} from 'remotion';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {BrandBug} from '../../story/components/Chrome';
import {iris, matchCut, panelSweep} from '../../story/components/Transitions';
import {makeCalculateMetadata, NarratedVideo, narratedSchema, type NarratedProps, type VideoDef} from '../../story/lib/NarratedVideo';
import {story} from '../../story/theme';
import {SCENES, SCRIPT, TAIL_SEC, type SceneId} from './script';
import {C, GREEN, NEUTRAL, RED} from './ui';
import {HookScene} from './scenes/HookScene';
import {DamageScene} from './scenes/DamageScene';
import {ElectionScene} from './scenes/ElectionScene';
import {DataCenterScene} from './scenes/DataCenterScene';
import {BillionsScene, NODES, NODE_Y} from './scenes/BillionsScene';
import {NvidiaScene} from './scenes/NvidiaScene';
import {PivotScene} from './scenes/PivotScene';
import {SofiScene} from './scenes/SofiScene';
import {RiskScene} from './scenes/RiskScene';
import {DebateScene} from './scenes/DebateScene';

const DEF: VideoDef<SceneId> = {
	script: SCRIPT,
	scenes: SCENES,
	tailSec: TAIL_SEC,
	components: {
		hook: HookScene,
		damage: DamageScene,
		election: ElectionScene,
		datacenter: DataCenterScene,
		billions: BillionsScene,
		nvidia: NvidiaScene,
		pivot: PivotScene,
		sofi: SofiScene,
		risk: RiskScene,
		debate: DebateScene,
	},
	// caption emphasis: red while the market story is told, green for the decision, white for the risk talk
	looks: {hook: RED, damage: RED, election: RED, datacenter: RED, billions: RED, nvidia: RED, pivot: GREEN, sofi: GREEN, risk: NEUTRAL, debate: GREEN},
	transitions: {
		damage: {presentation: matchCut()},
		election: {presentation: wipe({direction: 'from-left'})},
		datacenter: {presentation: slide({direction: 'from-right'}), timing: 'spring'},
		billions: {presentation: matchCut()},
		nvidia: {presentation: iris({x: NODES[0].x, y: NODE_Y})},
		pivot: {presentation: matchCut()},
		sofi: {presentation: slide({direction: 'from-bottom'}), timing: 'spring'},
		risk: {presentation: wipe({direction: 'from-right'})},
		debate: {presentation: panelSweep({color: C.panel, direction: 'up'})},
	},
};

export const MarketCrashNov5Schema = narratedSchema;
export const calculateMarketCrashNov5Metadata = makeCalculateMetadata(DEF);

/** Why the Market Crashed (Nov 5, 2026) — Stack With Gio. Persistent subtle watermark over every scene. */
export const MarketCrashNov5: React.FC<NarratedProps> = (props) => (
	<AbsoluteFill>
		<NarratedVideo def={DEF} props={props} />
		<BrandBug palette={GREEN} opacity={0.62} style={{left: story.safe.left, top: 176, transform: 'scale(0.85)', transformOrigin: '0 50%'}} />
	</AbsoluteFill>
);
