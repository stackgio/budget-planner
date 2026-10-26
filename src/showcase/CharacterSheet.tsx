import React from 'react';
import {AbsoluteFill} from 'remotion';
import {colors, fonts} from '../brand/theme';
import {Background} from '../components/Background';
import {Stickman} from '../components/character/Stickman';
import type {Expression, PoseName} from '../components/character/poses';

// Turnaround of every pose and expression. Use it to check the character
// against the reference art after any rig change.
const cells: {pose: PoseName; expression: Expression; sunglasses?: number; sweat?: number; holding?: 'phone'}[] = [
	{pose: 'idle', expression: 'neutral'},
	{pose: 'celebrate', expression: 'happy'},
	{pose: 'shrug', expression: 'deadpan'},
	{pose: 'lounge', expression: 'smug'},
	{pose: 'facepalm', expression: 'worried', sweat: 1},
	{pose: 'jump', expression: 'shocked'},
	{pose: 'point', expression: 'happy', sunglasses: 1},
	{pose: 'think', expression: 'neutral', holding: 'phone'},
	{pose: 'deadpan', expression: 'deadpan', sunglasses: 1.5},
];

export const CharacterSheet: React.FC = () => (
	<AbsoluteFill>
		<Background glow={{x: 50, y: 50, size: 70, opacity: 0.08}} />
		{cells.map((c, i) => {
			const col = i % 3;
			const row = Math.floor(i / 3);
			const x = 200 + col * 340;
			const y = 560 + row * 560;
			return (
				<React.Fragment key={i}>
					<Stickman x={x} y={y} height={380} keys={[{frame: 0, pose: c.pose, expression: c.expression}]} sunglasses={c.sunglasses} sweat={c.sweat} holding={c.holding} />
					<div style={{position: 'absolute', left: x - 150, width: 300, top: y + 24, textAlign: 'center', color: colors.muted, fontFamily: fonts.body, fontSize: 28, fontWeight: 600}}>
						{c.pose} · {c.expression}
					</div>
				</React.Fragment>
			);
		})}
	</AbsoluteFill>
);
