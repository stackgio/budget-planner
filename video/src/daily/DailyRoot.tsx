import React from 'react';
import {Composition} from 'remotion';
import {dmm} from './theme';
import {DMM001} from './episodes/dmm001/Episode';
import {DMM002} from './episodes/dmm002/Episode';
// @dmm-imports (add new episode imports above this line)

/**
 * Daily Money Motion compositions. Every episode is exactly 450 frames,
 * 1080×1920, 30 fps. Ids are DMM<NNN>; never reuse or rename one.
 */
export const DailyCompositions: React.FC = () => (
	<>
		<Composition id="DMM001" component={DMM001} width={dmm.width} height={dmm.height} fps={dmm.fps} durationInFrames={dmm.durationInFrames} defaultProps={{showSafeZones: false, music: true, sfx: true}} />
		<Composition id="DMM002" component={DMM002} width={dmm.width} height={dmm.height} fps={dmm.fps} durationInFrames={dmm.durationInFrames} defaultProps={{showSafeZones: false, audio: true}} />
		{/* @dmm-compositions (add new episodes above this line) */}
	</>
);
