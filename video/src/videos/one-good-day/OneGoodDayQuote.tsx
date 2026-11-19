import React from 'react';
import {AbsoluteFill} from 'remotion';
import '../../fonts';
import {cinematic, story} from '../../story/theme';
import {Background} from './OneGoodDay';
import {QUOTE_LINES, QUOTE_SEC} from './script';

/**
 * v02: the whole quote, static, readable from frame 0 and held for all 9 s.
 * Same footage, grade and 100→104% push-in as v01; the light lifts gently across the shot.
 */
const W = story.width;
const SAFE = story.safe; // top 170, right 120, bottom 330, left 72
const GREEN = cinematic.accent;
const INK = '#F5F2EA';

const CX = (SAFE.left + (W - SAFE.right)) / 2; // 516: centred in the horizontal safe band
const CY = 860; // slightly above the 960 midpoint
const BOX_W = W - SAFE.left - SAFE.right; // 888

const SIZE = {setup: 62, payoff: 100} as const;

const Line: React.FC<{text: string; kind: 'setup' | 'payoff'; green?: 'numeral' | 'all'}> = ({text, kind, green}) => {
	const size = SIZE[kind];
	let content: React.ReactNode = text;
	if (green === 'all') content = <span style={{color: GREEN}}>{text}</span>;
	else if (green === 'numeral' && text.startsWith('1 ')) content = (
		<>
			<span style={{color: GREEN}}>1</span>
			{text.slice(1)}
		</>
	);
	return (
		<div
			style={{
				fontSize: size,
				fontWeight: kind === 'payoff' ? 900 : 700,
				lineHeight: 1.16,
				letterSpacing: kind === 'payoff' ? -2.5 : -1,
				color: INK,
				whiteSpace: 'nowrap',
				textShadow: '0 2px 18px rgba(0,0,0,0.45)',
				marginTop: kind === 'setup' ? 10 : 0,
			}}
		>
			{content}
		</div>
	);
};

export const OneGoodDayQuote: React.FC = () => (
	<AbsoluteFill style={{backgroundColor: '#050506'}}>
		<Background totalSec={QUOTE_SEC} liftKeys={[[0, 4.5, QUOTE_SEC], [0, 0.35, 0.9]]} textBox={{cx: CX, cy: CY, rx: 820, ry: 640}} />
		<div
			style={{
				position: 'absolute',
				left: CX - BOX_W / 2,
				width: BOX_W,
				top: CY,
				transform: 'translateY(-50%)',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				textAlign: 'center',
				fontFamily: story.font,
			}}
		>
			{QUOTE_LINES.map((l, i) => (
				<Line key={i} {...l} />
			))}
		</div>
	</AbsoluteFill>
);
