import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, mix, prog, sp} from '../../../story/lib/motion';
import {FACTS} from '../facts';
import {C, CheckBox, ExampleTag, Label, Panel, Stage, StepHeading} from '../ui';

const ACC = {top: 870, w: 420, h: 330, lefts: [92, 568]};
const HERO = {x: 540, y: 640, fs: 260};
const DEST = {x: ACC.lefts[1] + ACC.w / 2, y: ACC.top + 215, fs: 104};
const SRC = {x: ACC.lefts[0] + ACC.w / 2, y: ACC.top + 200, fs: 70};

const BankIcon = () => (
	<svg width={60} height={60} viewBox="0 0 24 24">
		<path d="M3 9.5L12 4l9 5.5M5 10v8M9.7 10v8M14.3 10v8M19 10v8M3 20.5h18" fill="none" stroke={C.ink} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);
const VaultIcon = () => (
	<svg width={60} height={60} viewBox="0 0 24 24">
		<rect x={3.5} y={4} width={17} height={15} rx={2.5} fill="none" stroke={C.ink} strokeWidth={1.9} />
		<circle cx={12} cy={11.5} r={3.6} fill="none" stroke={C.ink} strokeWidth={1.9} />
		<path d="M12 7.9v1.4M12 13.7v1.4M6.5 19v1.5M17.5 19v1.5" stroke={C.ink} strokeWidth={1.9} strokeLinecap="round" />
	</svg>
);

/**
 * STEP 3 — "move some money into savings on payday. Even if it's 20 bucks,
 * transfer it now." $20 rises out of CHECKING as the biggest thing on screen,
 * then arcs into SAVINGS and settles with a check; held through L10.
 */
export const SavingsScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tMove = cue('L8', 'move');
	const tSav = cue('L8', 'savings');
	const t20 = cue('L9', '20');
	const tTr = cue('L9', 'transfer');
	const land = tTr + 22;

	const accIn = [sp(frame, fps, Math.min(tMove, 0), 'snappy'), sp(frame, fps, tSav - 2, 'snappy')];
	const rise = prog(frame, t20 - 3, 16, E.out);
	const count = prog(frame, t20 - 3, 14, E.out);
	const fly = prog(frame, tTr, 22, E.inOut);
	const landed = sp(frame, fps, land, 'snappy');
	const arrow = kf(frame, [tTr - 2, tTr + 10], [0, 1], E.out);

	// $20 position: checking → hero → savings
	const [hx, hy] = [mix(SRC.x, HERO.x, rise), mix(SRC.y, HERO.y, rise)];
	const [fx, fy] = arc(fly, [hx, hy], [DEST.x, DEST.y], 60);
	const fs = mix(mix(SRC.fs, HERO.fs, rise), DEST.fs, E.out(fly));
	const bump = 1 + 0.06 * Math.sin(Math.min(1, landed) * Math.PI);

	return (
		<Stage>
			<StepHeading n={3} text="SAVE ON PAYDAY" at={-12} />

			{[0, 1].map((i) => {
				const isSav = i === 1;
				const green = isSav && landed > 0.02;
				return (
					<Panel
						key={i}
						border={green ? C.green : C.line}
						style={{
							left: ACC.lefts[i],
							top: ACC.top,
							width: ACC.w,
							height: ACC.h,
							opacity: accIn[i],
							transform: `translateY(${(1 - accIn[i]) * 50}px)`,
							background: green ? 'rgba(44,212,122,0.07)' : C.panel2,
						}}
					>
						<div style={{position: 'absolute', left: 30, top: 28, display: 'flex', alignItems: 'center', gap: 16}}>
							{isSav ? <VaultIcon /> : <BankIcon />}
							<Label size={36} color={C.white} style={{fontWeight: 900, letterSpacing: 2}}>
								{isSav ? 'SAVINGS' : 'CHECKING'}
							</Label>
						</div>
						{isSav && <CheckBox size={54} at={land + 2} style={{position: 'absolute', right: 24, top: 30}} />}
						{isSav && landed <= 0.02 && (
							<div style={{position: 'absolute', left: 40, right: 40, top: 150, bottom: 40, borderRadius: 20, border: '3px dashed #3A3F47'}} />
						)}
					</Panel>
				);
			})}

			{/* transfer direction */}
			<svg width={80} height={40} viewBox="0 0 80 40" style={{position: 'absolute', left: 500, top: ACC.top + ACC.h / 2 - 20, opacity: arrow * (1 - landed * 0.4)}}>
				<path d="M6 20h60M52 8l14 12-14 12" fill="none" stroke={C.green} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={90} strokeDashoffset={90 * (1 - arrow)} />
			</svg>

			{rise > 0 && (
				<div style={{position: 'absolute', left: fx, top: fy, transform: `translate(-50%, -50%) scale(${bump})`, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: Math.min(1, rise * 3)}}>
					<ExampleTag size={Math.max(24, fs * 0.13)} style={{marginBottom: fs * 0.06}} />
					<NumberCounter value={FACTS.savingsExample.value * count} fixedDigits={2} fontSize={fs} color={C.green} style={{letterSpacing: -fs * 0.03}} />
				</div>
			)}

			<Sfx at={tTr + 2} name="whoosh-soft" volume={0.2} />
			<Sfx at={land} name="coin" volume={0.32} />
		</Stage>
	);
};
