import React from 'react';
import {makeCalculateMetadata, NarratedVideo, narratedSchema, type NarratedProps, type VideoDef} from '../../story/lib/NarratedVideo';
import {cinematic} from '../../story/theme';
import {SCENES, SCRIPT, TAIL_SEC} from './script';
import {MainScene} from './scenes/MainScene';
import {RIGHT_INSET} from './layout';

type Id = (typeof SCENES)[number]['id'];

const DEF: VideoDef<Id> = {
	script: SCRIPT,
	scenes: SCENES,
	tailSec: TAIL_SEC,
	components: {main: MainScene},
	looks: {main: cinematic},
	// phrase-by-phrase, up to two lines, kept left of the platform buttons; green is reserved for the graphics
	captionOptions: {maxChars: 26, maxWords: 6, fontSize: 56, left: 80, right: RIGHT_INSET, top: 1432, speaking: 'ink', keepAcronymPlural: true},
};

export const EtfWhatsInsideSchema = narratedSchema;
export const calculateEtfWhatsInsideMetadata = makeCalculateMetadata(DEF);

/** 4 ETFs: What's the Difference? (VOO vs SCHD, QQQM vs VGT) */
export const EtfWhatsInside: React.FC<NarratedProps> = (props) => <NarratedVideo def={DEF} props={props} />;
