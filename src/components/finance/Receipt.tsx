import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {colors} from '../../brand/theme';
import {clamp, ease} from '../../lib/motion';

export type ReceiptItem = {label: string; amount: number};

type Props = {
	items: ReceiptItem[];
	store?: string;
	date?: string;
	startFrame: number;
	/** Frames it takes to print the whole receipt. */
	printFrames?: number;
	width?: number;
	/** Frame to circle the total in red (the "ouch" moment). */
	circleTotalAt?: number;
};

const PAPER = '#F4F1E8';
const INK = '#26241F';
const mono = '"DejaVu Sans Mono", "SF Mono", Menlo, monospace';

/** Thermal receipt that prints out of a slot, line by line. */
export const Receipt: React.FC<Props> = ({items, store = 'STORE', date, startFrame, printFrames = 45, width = 560, circleTotalAt}) => {
	const frame = useCurrentFrame();
	const total = items.reduce((s, i) => s + i.amount, 0);
	const lineH = 58;
	const rows = 4 + items.length + 3;
	const fullH = rows * lineH + 80;
	const printed = interpolate(frame, [startFrame, startFrame + printFrames], [0, 1], {...clamp, easing: ease.out});
	const shown = fullH * printed;
	const jitter = printed > 0 && printed < 1 ? Math.sin(frame * 2.3) * 1.5 : 0;
	const circle = circleTotalAt === undefined ? 0 : interpolate(frame, [circleTotalAt, circleTotalAt + 12], [0, 1], {...clamp, easing: ease.inOut});

	const row = (left: React.ReactNode, right: React.ReactNode, bold = false) => (
		<div style={{display: 'flex', justifyContent: 'space-between', height: lineH, alignItems: 'center', fontWeight: bold ? 800 : 500}}>
			<span>{left}</span>
			<span>{right}</span>
		</div>
	);

	return (
		<div style={{position: 'relative', width: width + 80}}>
			{/* Printer slot */}
			<div style={{height: 36, borderRadius: 18, background: '#1A1A1D', boxShadow: 'inset 0 6px 10px rgba(0,0,0,0.8)', position: 'relative', zIndex: 2}} />
			<div style={{height: shown, overflow: 'hidden', margin: '-18px 40px 0', translate: `${jitter}px 0px`}}>
				<div
					style={{
						position: 'relative',
						height: fullH,
						background: PAPER,
						color: INK,
						fontFamily: mono,
						fontSize: 32,
						padding: '50px 36px 30px',
						boxSizing: 'border-box',
						clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 14px), 95% 100%, 90% calc(100% - 14px), 85% 100%, 80% calc(100% - 14px), 75% 100%, 70% calc(100% - 14px), 65% 100%, 60% calc(100% - 14px), 55% 100%, 50% calc(100% - 14px), 45% 100%, 40% calc(100% - 14px), 35% 100%, 30% calc(100% - 14px), 25% 100%, 20% calc(100% - 14px), 15% 100%, 10% calc(100% - 14px), 5% 100%, 0 calc(100% - 14px))',
					}}
				>
					<div style={{textAlign: 'center', fontWeight: 800, fontSize: 40, height: lineH}}>{store}</div>
					<div style={{textAlign: 'center', height: lineH, opacity: 0.7}}>{date ?? ''}</div>
					<div style={{borderTop: `3px dashed ${INK}55`, margin: '10px 0'}} />
					{items.map((it, i) => (
						<React.Fragment key={i}>{row(it.label, `$${it.amount.toFixed(2)}`)}</React.Fragment>
					))}
					<div style={{borderTop: `3px dashed ${INK}55`, margin: '10px 0'}} />
					<div style={{position: 'relative'}}>
						{row('TOTAL', `$${total.toFixed(2)}`, true)}
						{circleTotalAt !== undefined ? (
							<svg style={{position: 'absolute', right: -30, top: -14, overflow: 'visible'}} width={260} height={86}>
								<ellipse
									cx={130}
									cy={43}
									rx={125}
									ry={40}
									fill="none"
									stroke={colors.red}
									strokeWidth={6}
									pathLength={1}
									strokeDasharray={1}
									strokeDashoffset={1 - circle}
									transform="rotate(-4 130 43)"
								/>
							</svg>
						) : null}
					</div>
					<div style={{textAlign: 'center', marginTop: 20, opacity: 0.6, fontSize: 26}}>THANK YOU</div>
				</div>
			</div>
		</div>
	);
};
