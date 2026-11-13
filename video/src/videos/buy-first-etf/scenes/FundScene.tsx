import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Sfx} from '../../../story/components/Chrome';
import {DemoScrims, PhoneDemo} from '../../../story/components/PhoneDemo';
import {camAt, retime} from '../../../story/components/ScreenRecording';
import {useCues} from '../../../story/lib/cues';
import {sp} from '../../../story/lib/motion';
import {cinematic as P, story} from '../../../story/theme';
import {centre, Chip, on, R, REC, REDACT, StepHeader, tapP} from '../ui';

/**
 * Funding steps that are NOT in Gio's recording — shown as clearly labelled
 * illustrated steps on top of the dimmed real phone (never as fake app screens).
 */
const TextSteps: React.FC<{items: {at: number; label: string; sub: string}[]; show: number}> = ({items, show}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	if (show <= 0) return null;
	let cur = -1;
	items.forEach((it, i) => {
		if (frame >= it.at) cur = i;
	});
	return (
		<div style={{position: 'absolute', left: 150, width: 780, top: 380, opacity: show, transform: `translateY(${(1 - show) * 40}px)`, fontFamily: story.font}}>
			<div style={{display: 'inline-block', padding: '10px 20px', borderRadius: 999, border: `2px solid ${P.muted}`, fontSize: 26, fontWeight: 800, letterSpacing: 3, color: P.body, marginBottom: 40}}>
				STEPS ONLY · NOT IN MY RECORDING
			</div>
			{items.map((it, i) => {
				const p = sp(frame, fps, it.at, 'snappy');
				const active = i === cur;
				const done = i < cur;
				return (
					<div key={i} style={{display: 'flex', alignItems: 'center', gap: 28, marginBottom: 30, opacity: frame < it.at ? 0.3 : 1, transform: `translateX(${active ? (1 - p) * 30 : 0}px)`}}>
						<div
							style={{
								width: 84,
								height: 84,
								flex: 'none',
								borderRadius: 24,
								border: `4px solid ${active || done ? P.accent : P.muted}`,
								background: active ? P.accent : 'transparent',
								color: active ? '#0B0C0E' : done ? P.accent : P.muted,
								fontSize: 38,
								fontWeight: 900,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								boxSizing: 'border-box',
							}}
						>
							{done ? '✓' : i + 1}
						</div>
						<div>
							<div style={{fontSize: 52, fontWeight: 900, color: active ? P.ink : done ? P.body : P.muted, lineHeight: 1.02}}>{it.label}</div>
							<div style={{fontSize: 28, fontWeight: 700, color: P.muted, marginTop: 6, opacity: active ? 1 : 0.7}}>{it.sub}</div>
						</div>
					</div>
				);
			})}
		</div>
	);
};

/** PICK A BROKERAGE → BUYING POWER → ADD MONEY (labelled steps) → SEARCH, on Gio's real home screen. */
export const FundScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {cue} = useCues();
	const tRh = cue('L4', 'Robinhood');
	const tFi = cue('L4', 'Fidelity');
	const tVa = cue('L4', 'Vanguard');
	const tUse = cue('L5', 'Robinhood');
	const t6 = cue('L6');
	const tHome = cue('L6', 'home');
	const tBp = cue('L6', 'buying');
	const t7 = cue('L7');
	const tAdd = cue('L7', 'add');
	const tEnter = cue('L8', 'enter');
	const tLink = cue('L8', 'link');
	const tRev = cue('L9', 'review');
	const tConf = cue('L9', 'confirm');
	const t10 = cue('L10');
	const tSearch = cue('L10', 'search');

	const src = retime(frame, [
		[0, 0.5],
		[tSearch - 14, 0.55],
		[tSearch, 1.08],
		[tSearch + 20, 1.75],
	]);
	const cam = camAt(frame, [
		{at: 0, cx: 603, cy: 1000, zoom: 1.16},
		{at: tUse, cx: 603, cy: 1150, zoom: 1.12},
		{at: tHome, cx: 603, cy: 1450, zoom: 1.2},
		{at: tBp - 4, cx: 603, cy: 1700, zoom: 1.5},
		{at: t7, cx: 603, cy: 1700, zoom: 1.52},
		{at: t7 + 16, cx: 603, cy: 1300, zoom: 1.0},
		{at: t10, cx: 603, cy: 1350, zoom: 1.0},
		{at: tSearch - 16, cx: 603, cy: 2380, zoom: 1.45},
		{at: tSearch + 30, cx: 603, cy: 2380, zoom: 1.45},
	]);
	const brokerDim = on(frame, tRh - 4, tUse, 6) * 0.4;
	const stepsShow = on(frame, t7 - 4, t10 + 2, 8);
	const dim = Math.max(brokerDim, stepsShow);
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={540} lightY={700} />
			<PhoneDemo
				{...REC}
				srcSec={src}
				camera={cam}
				redact={REDACT}
				dim={dim}
				palette={P}
				marks={[
					{...R.buyingPower, p: on(frame, tBp - 4, t7 - 4)},
					{...R.searchTab, p: on(frame, tSearch - 10, tSearch + 10)},
				]}
				taps={[
					{x: 300, y: centre(R.buyingPower).y, p: tapP(frame, tBp + 6)},
					{...centre(R.searchTab), p: tapP(frame, tSearch)},
				]}
			/>
			<DemoScrims />
			<StepHeader
				palette={P}
				steps={[
					{at: -30, n: '01', label: 'PICK A BROKERAGE'},
					{at: t6, n: '02', label: 'HOME → TAP BUYING POWER'},
					{at: t7, n: '03', label: 'ADD MONEY'},
					{at: tRev, n: '03', label: 'REVIEW, THEN CONFIRM'},
					{at: t10, n: '04', label: 'WAIT UNTIL FUNDS ARE AVAILABLE'},
					{at: tSearch - 4, n: '04', label: 'TAP SEARCH'},
				]}
			/>
			{/* brokerages — text only (no logos) */}
			<Chip text="ROBINHOOD" at={tRh} out={tUse + 30} x={540} y={560} palette={P} size={60} tone={frame >= tUse ? 'accent' : 'dark'} />
			<Chip text="FIDELITY" at={tFi} out={tUse} x={540} y={730} palette={P} size={60} tone="dark" />
			<Chip text="VANGUARD" at={tVa} out={tUse} x={540} y={900} palette={P} size={60} tone="dark" />
			<Chip text="GIO USES ROBINHOOD" at={tUse + 26} out={t6} x={540} y={1240} palette={P} size={46} />
			<TextSteps
				show={stepsShow}
				items={[
					{at: tAdd, label: 'ADD MONEY', sub: 'from Buying power'},
					{at: tEnter, label: 'ENTER AN AMOUNT', sub: 'how much to transfer'},
					{at: tLink, label: 'LINK OR PICK A BANK', sub: 'if you haven’t already'},
					{at: tRev, label: 'REVIEW', sub: 'check the transfer'},
					{at: tConf, label: 'CONFIRM', sub: 'then wait for the money'},
				]}
			/>
			<Sfx at={tRh} name="pop" volume={0.25} />
			<Sfx at={tFi} name="pop" volume={0.22} />
			<Sfx at={tVa} name="pop" volume={0.22} />
			<Sfx at={tBp + 6} name="click" volume={0.35} />
			<Sfx at={tAdd} name="tick" volume={0.3} />
			<Sfx at={tEnter} name="tick" volume={0.25} />
			<Sfx at={tLink} name="tick" volume={0.3} />
			<Sfx at={tRev} name="tick" volume={0.3} />
			<Sfx at={tConf} name="tick" volume={0.3} />
			<Sfx at={tSearch} name="click" volume={0.35} />
		</AbsoluteFill>
	);
};
