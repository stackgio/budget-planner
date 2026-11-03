import React from 'react';
import {AbsoluteFill} from 'remotion';
import '../../fonts';
import {Marcus, POSES, FACES, type PoseName, type FaceName} from '../components/Marcus';
import {editorial, story} from '../theme';

const PAIRS: [PoseName, FaceName][] = [
	['idle', 'neutral'],
	['relaxed', 'happy'],
	['shock', 'shock'],
	['flinch', 'worried'],
	['worried', 'worried'],
	['point', 'determined'],
	['present', 'happy'],
	['hold', 'focused'],
	['feed', 'focused'],
	['push', 'determined'],
	['stop', 'smug'],
	['celebrate', 'joy'],
	['fist', 'determined'],
	['think', 'curious'],
	['shrug', 'curious'],
	['sit', 'neutral'],
	['sitType', 'focused'],
	['walk', 'neutral'],
];

/** QC sheet: every pose + expression on one frame. Keep Marcus consistent. */
export const MarcusGallery: React.FC = () => (
	<AbsoluteFill style={{background: editorial.bg, fontFamily: story.font}}>
		{PAIRS.map(([p, f], i) => {
			const col = i % 3;
			const row = Math.floor(i / 3);
			const x = 180 + col * 360;
			const y = 300 + row * 300;
			return (
				<React.Fragment key={p}>
					<Marcus x={x} y={y} scale={0.48} facing={1} track={[{at: 0, pose: p, face: f}]} seed={i} />
					<div style={{position: 'absolute', left: x - 150, width: 300, top: y + 8, textAlign: 'center', fontSize: 22, fontWeight: 800, color: editorial.body}}>
						{p} · {f}
					</div>
				</React.Fragment>
			);
		})}
	</AbsoluteFill>
);
export const poseNames = Object.keys(POSES);
export const faceNames = Object.keys(FACES);
