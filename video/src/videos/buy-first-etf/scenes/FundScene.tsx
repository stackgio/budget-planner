import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Sfx} from '../../../story/components/Chrome';
import {camAt, retime, ScreenRecording} from '../../../story/components/ScreenRecording';
import {useCues} from '../../../story/lib/cues';
import {sp} from '../../../story/lib/motion';
import {cinematic as P, story} from '../../../story/theme';
import {centre, Chip, on, PHONE, phoneStyle, R, REC, REDACT, StepHeader, tapP} from '../ui';

/** Funding steps that are NOT in the recording — shown as clearly labelled text steps. */
const TextSteps: React.FC<{items: {at: number; label: string}[]; show: number}> = ({items, show}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	if (show <= 0) return null;
	let cur = -1;
	items.forEach((it, i) => {
		if (frame >= it.at) cur = i;
	});
	return (
		<div style={{position: 'absolute', left: PHONE.x + 40, width: PHONE.w - 80, top: 470, opacity: show, transform: `translateY(${(1 - show) * 40}px)`, fontFamily: story.font}}>
			<div style={{fontSize: 26, fontWeight: 800, letterSpacing: 3, color: P.muted, marginBottom: 34}}>TEXT STEPS · NOT IN MY RECORDING</div>
			{items.map((it, i) => {
				const p = sp(frame, fps, it.at, 'snappy');
				const active = i === cur;
				const done = i < cur;
				return (
					<div key={i} style={{display: 'flex', alignItems: 'center', gap: 24, marginBottom: 34, opacity: frame < it.at ? 0.28 : 1, transform: `translateX(${active ? (1 - p) * 24 : 0}px)`}}>
						<div
							style={{
								width: 64,
								height: 64,
								flex: 'none',
								borderRadius: 999,
								border: `4px solid ${active || done ? P.accent : P.muted}`,
								background: done ? P.accent : 'transparent',
								color: done ? '#0B0C0E' : active ? P.accent : P.muted,
								fontSize: 30,
								fontWeight: 900,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								boxSizing: 'border-box',
							}}
						>
							{done ? '✓' : i + 1}
						</div>
						<div style={{fontSize: 46, fontWeight: 900, color: active ? P.accent : P.ink, lineHeight: 1.05}}>{it.label}</div>
					</div>
				);
			})}
		</div>
	);
};

/** PICK A BROKERAGE → BUYING POWER → ADD MONEY (text steps) → SEARCH, on Gio's real home screen. */
export const FundScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {cue} = useCues();
	const tRh = cue('L4', 'Robinhood');
	const tFi = cue('L4', 'Fidelity');
	const tVa = cue('L4', 'Vanguard');
	const tUse = cue('L5', 'Robinhood');
	const t6 = cue('L6');
	const tBp = cue('L6', 'buying');
	const t7 = cue('L7');
	const tAdd = cue('L7', 'add');
	const tEnter = cue('L8', 'enter');
	const tLink = cue('L8', 'link');
	const tRev = cue('L9', 'review');
	const t10 = cue('L10');
	const tSearch = cue('L10', 'search');

	const src = retime(frame, [
		[0, 0.5],
		[tSearch - 14, 0.55],
		[tSearch, 1.08],
		[tSearch + 20, 1.75],
	]);
	const cam = camAt(frame, [
		{at: 0, cx: 603, cy: 930, zoom: 1},
		{at: tBp - 18, cx: 603, cy: 930, zoom: 1},
		{at: tBp, cx: 603, cy: 1550, zoom: 1.08},
		{at: t7, cx: 603, cy: 1550, zoom: 1.08},
		{at: t7 + 14, cx: 603, cy: 1300, zoom: 1},
		{at: t10, cx: 603, cy: 1300, zoom: 1},
		{at: t10 + 18, cx: 603, cy: 1692, zoom: 1},
	]);
	const brokerDim = on(frame, tRh - 4, tUse, 6) * 0.6;
	const stepsShow = on(frame, t7 - 4, t10 + 4, 8);
	const dim = Math.max(brokerDim, stepsShow);
	const sTap = centre(R.searchTab);
	const bTap = {x: 330, y: centre(R.buyingPower).y};
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={540} lightY={600} />
			<StepHeader
				palette={P}
				steps={[
					{at: -30, n: '01', label: 'PICK A BROKERAGE'},
					{at: t6, n: '02', label: 'TAP BUYING POWER'},
					{at: t7, n: '03', label: 'TAP ADD MONEY'},
					{at: tEnter, n: '03', label: 'ENTER AMOUNT · PICK BANK'},
					{at: tRev, n: '03', label: 'REVIEW, THEN CONFIRM'},
					{at: t10, n: '04', label: 'ONCE FUNDS ARE AVAILABLE'},
					{at: tSearch - 4, n: '04', label: 'TAP SEARCH'},
				]}
			/>
			<ScreenRecording
				{...REC}
				w={PHONE.w}
				h={PHONE.h}
				srcSec={src}
				camera={cam}
				redact={REDACT}
				dim={dim}
				marks={[
					{...R.buyingPower, p: on(frame, tBp - 4, t7 - 4)},
					{...R.searchTab, p: on(frame, tSearch - 10, tSearch + 8)},
				]}
				taps={[
					{...bTap, p: tapP(frame, tBp + 6)},
					{...sTap, p: tapP(frame, tSearch)},
				]}
				style={phoneStyle()}
			/>
			{/* brokerages — text only (no logos) */}
			<Chip text="ROBINHOOD" at={tRh} out={tUse + 30} x={540} y={600} palette={P} size={56} tone={frame >= tUse ? 'accent' : 'dark'} />
			<Chip text="FIDELITY" at={tFi} out={tUse} x={540} y={750} palette={P} size={56} tone="dark" />
			<Chip text="VANGUARD" at={tVa} out={tUse} x={540} y={900} palette={P} size={56} tone="dark" />
			<Chip text="GIO USES ROBINHOOD" at={tUse + 26} out={t6} x={540} y={1240} palette={P} size={44} />
			<TextSteps
				show={stepsShow}
				items={[
					{at: tAdd, label: 'ADD MONEY'},
					{at: tEnter, label: 'ENTER TRANSFER AMOUNT'},
					{at: tLink, label: 'LINK OR SELECT BANK'},
					{at: tRev, label: 'REVIEW → CONFIRM'},
				]}
			/>
			<Sfx at={tRh} name="pop" volume={0.25} />
			<Sfx at={tFi} name="pop" volume={0.22} />
			<Sfx at={tVa} name="pop" volume={0.22} />
			<Sfx at={tBp + 6} name="click" volume={0.35} />
			<Sfx at={tAdd} name="tick" volume={0.3} />
			<Sfx at={tLink} name="tick" volume={0.3} />
			<Sfx at={tRev} name="tick" volume={0.3} />
			<Sfx at={tSearch} name="click" volume={0.35} />
		</AbsoluteFill>
	);
};
