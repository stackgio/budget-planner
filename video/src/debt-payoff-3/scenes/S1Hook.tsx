import React from 'react';
import {useCurrentFrame} from 'remotion';
import {easeIO, easeOut, lerp, shake, tw} from '../../debt-story/anim';
import {animate, Marcus, P, POSES} from '../../debt-story/Marcus';
import {Svg} from '../../debt-story/Stage';
import {C, FONT} from '../../debt-story/theme';
import {at} from '../timing';
import {count, Kicker, money, panel, SceneWin} from '../ui';

/** Illustrative balance for the hook (labelled "EXAMPLE" on screen). */
export const HOOK_BALANCE = 12480;

export const S1Hook: React.FC = () => {
	const f = useCurrentFrame();
	const three = at('three', 2);
	// the balance is already rolling on frame 0 and lands at ~0.7 s
	const bal = count(f, 0, 22, 7350, HOOK_BALANCE);
	const land = tw(f, 20, 30, 0, 1, easeOut);
	const sh = shake(f, 22, 12, 9);
	const headIn = tw(f, 0, 10, 0, 1, easeOut);
	// card steps back when the three things arrive
	const back = tw(f, three - 6, three + 10, 0, 1, easeIO);
	const gone = tw(f, at('n1') - 20, at('n1') - 10, 1, 0);

	// Marcus: looks up at the balance (shock), then moves to the corner and points at the steps
	const m = tw(f, three - 4, three + 12, 0, 1, easeIO);
	const {pose, expr} = animate(f, [
		{f: 0, pose: P({...POSES.lookUp, head: -26, gaze: 0.6}), expr: 'shocked'},
		{f: 24, pose: P({...POSES.flinch, head: -20, gaze: 0.6}), expr: 'shocked', dur: 6, overshoot: true},
		{f: 44, pose: P({...POSES.handChin, head: -18, gaze: 0.6}), expr: 'curious', dur: 12},
		{f: three + 10, pose: P({...POSES.point, armF: [128, 6], head: -16}), expr: 'determined', dur: 12, overshoot: true},
	]);

	return (
		<SceneWin id="hook" enter="none" exit="fade" drift={0.025} fy={560}>
			{/* headline, readable from frame 0 */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: lerp(196, 70, back),
					textAlign: 'center',
					fontFamily: FONT,
					fontWeight: 900,
					fontSize: 96,
					letterSpacing: -3,
					color: C.white,
					opacity: 1 - back,
					transform: `scale(${0.97 + 0.03 * headIn})`,
				}}
			>
				PAYING OFF <span style={{color: C.green}}>DEBT?</span>
			</div>

			{/* balance card */}
			<div
				style={{
					...panel({left: 150, top: 380, width: 780, height: 300, padding: '34px 44px', overflow: 'hidden'}),
					transform: `translate(${sh.x}px, ${sh.y + lerp(0, -40, back)}px) scale(${lerp(1, 0.86, back)})`,
					transformOrigin: '540px 0px',
					borderColor: `rgba(255,85,85,${0.25 + 0.35 * land})`,
					opacity: gone,
				}}
			>
				<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
					<Kicker color="#E9A3A3">TOTAL DEBT</Kicker>
					<Kicker color={C.gray} style={{fontSize: 22, letterSpacing: 2, padding: '6px 14px', border: '1.5px solid #3A4441', borderRadius: 999}}>
						EXAMPLE
					</Kicker>
				</div>
				<div style={{marginTop: 16, fontWeight: 900, fontSize: 150, lineHeight: 1, letterSpacing: -5, color: C.white, fontVariantNumeric: 'tabular-nums'}}>
					{money(bal)}
				</div>
				<div style={{marginTop: 26, height: 14, borderRadius: 7, background: 'rgba(245,247,245,0.08)', overflow: 'hidden'}}>
					<div style={{height: '100%', width: `${100 * tw(f, 0, 22, 0.59, 1, easeOut)}%`, background: C.red, borderRadius: 7}} />
				</div>
			</div>

			<Svg>
				<Marcus
					x={lerp(540, 196, m)}
					y={lerp(1268, 1240, m)}
					scale={lerp(0.98, 0.66, m)}
					pose={pose}
					expr={expr}
					frame={f}
					fx={f > 22 && f < 46 ? ['shock'] : []}
					seed={1}
					opacity={gone}
				/>
			</Svg>
		</SceneWin>
	);
};
