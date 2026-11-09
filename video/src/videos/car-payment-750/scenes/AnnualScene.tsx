import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, prog, sp} from '../../../story/lib/motion';
import {FACTS} from '../facts';
import {C, ExampleTag, FONT, GridBg, Label} from '../look';

/** Shared with HalfScene: where $13,800 sits at the end of this scene. */
export const YEAR_POS = {cy: 760, size: 230};

const TireIcon = () => (
	<svg width={54} height={54} viewBox="0 0 54 54">
		<circle cx={27} cy={27} r={24} fill="none" stroke={C.white} strokeWidth={6} />
		<circle cx={27} cy={27} r={10} fill="none" stroke={C.white} strokeWidth={4} />
	</svg>
);
const WrenchIcon = () => (
	<svg width={54} height={54} viewBox="0 0 54 54">
		<g transform="rotate(45 27 27)">
			<rect x={23} y={14} width={8} height={36} rx={4} fill={C.white} />
			<circle cx={27} cy={12} r={10} fill="none" stroke={C.white} strokeWidth={6} />
		</g>
	</svg>
);

const Chip: React.FC<{icon: React.ReactNode; text: string; at: number}> = ({icon, text, at}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const s = sp(frame, fps, at, 'snappy');
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 18,
				padding: '22px 34px',
				borderRadius: 999,
				border: '3px dashed rgba(255,90,78,0.7)',
				fontFamily: FONT,
				fontWeight: 900,
				fontSize: 48,
				letterSpacing: 1,
				color: C.white,
				opacity: frame < at ? 0 : prog(frame, at, 5),
				transform: `translateY(${(1 - s) * 40}px) scale(${0.9 + 0.1 * s})`,
			}}
		>
			{icon}+ {text}
		</div>
	);
};

export const AnnualScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const t0 = cue('L8');
	const tFourteen = cue('L8', 'fourteen');
	const tYear = cue('L8', 'year');
	const tTires = cue('L8', 'tires');
	const tRepairs = cue('L8', 'repairs');

	const mult = sp(frame, fps, t0 - 4, 'snappy');
	const up = sp(frame, fps, tFourteen - 4, 'smooth');
	const hit = sp(frame, fps, tFourteen - 3, 'heavy');
	const roll = kf(frame, [tFourteen - 3, tFourteen + 16], [0, 1], E.out);
	const value = mix(FACTS.monthly.value, FACTS.yearly.value, roll);
	const yearO = prog(frame, tYear - 3, 8);
	const dimTop = kf(frame, [tTires - 6, tTires + 10], [1, 0.55]);

	return (
		<AbsoluteFill>
			<GridBg drift={-frame * 0.5} />
			{/* $1,150 × 12 */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: mix(640, 330, up),
					textAlign: 'center',
					fontFamily: FONT,
					fontWeight: 900,
					fontSize: mix(130, 72, up),
					letterSpacing: -2,
					color: mix(1, 0, up) > 0.5 ? C.white : C.gray,
					opacity: prog(frame, t0 - 4, 6) * dimTop,
					transform: `scale(${0.85 + 0.15 * mult})`,
				}}
			>
				${FACTS.monthly.value.toLocaleString('en-US')} <span style={{color: C.green}}>× 12</span>
			</div>
			{/* $13,800 / YEAR */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: YEAR_POS.cy - YEAR_POS.size * 0.54,
					display: 'flex',
					justifyContent: 'center',
					opacity: frame < tFourteen - 3 ? 0 : prog(frame, tFourteen - 3, 4) * dimTop,
					transform: `scale(${1.6 - 0.6 * hit})`,
					transformOrigin: `50% ${YEAR_POS.size * 0.54}px`,
					filter: `blur(${(1 - hit) * 10}px)`,
				}}
			>
				<NumberCounter value={value} fontSize={YEAR_POS.size} color={C.white} style={{letterSpacing: -6, fontFamily: FONT}} />
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: YEAR_POS.cy + 150, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 64, letterSpacing: 18, color: C.red, opacity: yearO * dimTop}}>/ YEAR</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: YEAR_POS.cy + 250, textAlign: 'center', opacity: prog(frame, tYear + 4, 10) * dimTop}}>
				<Label size={28} color={C.gray}>Payment + insurance + gas</Label>
				<ExampleTag style={{marginTop: 22}} />
			</div>
			{/* not even counted yet */}
			<div style={{position: 'absolute', left: 0, right: 0, top: 1150, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26}}>
				<Label size={26} color={C.gray} style={{opacity: frame < tTires - 4 ? 0 : prog(frame, tTires - 4, 8)}}>
					Not even counted yet
				</Label>
				<div style={{display: 'flex', gap: 28}}>
					<Chip icon={<TireIcon />} text="TIRES" at={tTires - 3} />
					<Chip icon={<WrenchIcon />} text="REPAIRS" at={tRepairs - 3} />
				</div>
			</div>
		</AbsoluteFill>
	);
};
