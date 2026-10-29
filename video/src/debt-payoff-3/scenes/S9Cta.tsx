import React from 'react';
import {useCurrentFrame} from 'remotion';
import {pop, tw} from '../../debt-story/anim';
import {animate, Marcus, P, POSES} from '../../debt-story/Marcus';
import {CommentIcon} from '../../debt-story/props/Icons';
import {Svg} from '../../debt-story/Stage';
import {C, FONT} from '../../debt-story/theme';
import {at, SCENES, XF} from '../timing';
import {Rise, SceneWin} from '../ui';

/** Closing question to the viewer. */
export const S9Cta: React.FC = () => {
	const f = useCurrentFrame();
	const q = at('whats');
	const icon = pop(f, q - 4, 12, 190, 0.8);
	const {pose, expr} = animate(f, [
		{f: 0, pose: P({...POSES.stand, gaze: 0.4}), expr: 'determined'},
		{f: q + 10, pose: POSES.shrug, expr: 'curious', dur: 10, overshoot: true},
	]);
	return (
		<SceneWin id="cta" enter="rise" exit="none" drift={0.02}>
			<Svg>
				<g transform={`translate(540 420) scale(${3.2 * icon})`} opacity={Math.min(1, icon * 1.5)}>
					<CommentIcon />
				</g>
			</Svg>
			<div style={{position: 'absolute', left: 90, right: 90, top: 540, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 100, lineHeight: 1.04, letterSpacing: -3, color: C.white}}>
				<Rise text="WHAT'S YOUR BIGGEST *DEBT STRUGGLE?*" start={q - 2} stagger={2.5} />
			</div>
			<Svg>
				<Marcus x={540} y={1262} scale={0.86} pose={pose} expr={expr} frame={f} seed={6} opacity={tw(f, SCENES.cta[0] + XF, SCENES.cta[0] + XF + 8)} />
			</Svg>
		</SceneWin>
	);
};
