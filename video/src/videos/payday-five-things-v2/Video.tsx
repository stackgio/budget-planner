import React from 'react';
import {makeCalculateMetadata, NarratedVideo, narratedSchema, type NarratedProps, type VideoDef} from '../../story/lib/NarratedVideo';
import {cinematic} from '../../story/theme';
import {SCENES, SCRIPT, TAIL_SEC} from './script';
import {HookScene} from './scenes/HookScene';
import {BillsScene} from './scenes/BillsScene';
import {GroceriesScene} from './scenes/GroceriesScene';
import {SavingsScene} from './scenes/SavingsScene';
import {CardsScene} from './scenes/CardsScene';
import {FunScene} from './scenes/FunScene';
import {EndScene} from './scenes/EndScene';

type Id = (typeof SCENES)[number]['id'];

// Full-bleed scenes; captions sit on a compact matte black pill (white type, green active word).
const LOOK = cinematic;

const DEF: VideoDef<Id> = {
	script: SCRIPT,
	scenes: SCENES,
	tailSec: TAIL_SEC,
	components: {hook: HookScene, bills: BillsScene, groceries: GroceriesScene, savings: SavingsScene, cards: CardsScene, fun: FunScene, end: EndScene},
	looks: {hook: LOOK, bills: LOOK, groceries: LOOK, savings: LOOK, cards: LOOK, fun: LOOK, end: LOOK},
	// phrase-based captions, up to two lines, in their own band
	captionStyle: {maxChars: 36, maxWords: 8, fontSize: 50, uppercase: false, top: 1420, background: '#0B0C0E'},
};

export const PaydayFiveThingsV2Schema = narratedSchema;
export const calculatePaydayFiveThingsV2Metadata = makeCalculateMetadata(DEF);

/** 5 Things to Do When You Get Paid (V2) */
export const PaydayFiveThingsV2: React.FC<NarratedProps> = (props) => <NarratedVideo def={DEF} props={props} />;
