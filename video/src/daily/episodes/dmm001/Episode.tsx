// DMM-001 · "Same $500 raise. Two moves." (Engine B · motion graphics)
// One continuous, transforming frame — no scene cuts. Timing grid: 120 BPM
// music bed → a beat every 15 frames; one simulated year every 30 frames.
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import '../../../fonts';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {Sfx} from '../../../story/components/Chrome';
import {E, kf, mix, prog, shake, sp} from '../../../story/lib/motion';
import {FilmFinish, Stage} from '../../components/FilmLook';
import {GrowthChart} from '../../components/GrowthChart';
import {Headline} from '../../components/Headline';
import {Panel} from '../../components/Panel';
import {SplitBar} from '../../components/SplitBar';
import {MusicBed, SafeZoneOverlay, Signature, YearTrack} from '../../components/Chrome';
import {dmm, usd} from '../../theme';
import {T} from './timing';
import {BASE_SERIES, FINAL_VALUE, GROWTH, RAISE, SPEND_SPLIT, TOTAL_PUT_IN, VALUE_SERIES, YEARS, valueAt} from './facts';



const C = dmm.color;
const PX = dmm.safe.left;
const PW = dmm.width - dmm.safe.left - dmm.safe.right; // 888
const A = {y: 432, h: 392};
const B = {y: 932, h: 568};

const Chip: React.FC<{at: number; tone: 'accent' | 'muted'}> = ({at, tone}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = sp(frame, fps, at, 'bouncy');
	return (
		<div
			style={{
				position: 'absolute',
				right: 30,
				top: 24,
				padding: '8px 18px',
				borderRadius: 999,
				border: `2px solid ${tone === 'accent' ? C.accent : 'rgba(255,255,255,0.35)'}`,
				color: tone === 'accent' ? C.accent : C.ink,
				fontSize: 28,
				fontWeight: 900,
				letterSpacing: 1,
				fontFamily: dmm.font,
				opacity: Math.min(1, p * 1.5),
				transform: `translateY(${(1 - p) * -40}px) scale(${0.85 + 0.15 * p})`,
			}}
		>
			+{usd(RAISE.value)} / MO
		</div>
	);
};

const Stat: React.FC<{label: string; children: React.ReactNode; x: number; y: number; align?: 'left' | 'right'; labelColor?: string}> = ({label, children, x, y, align = 'left', labelColor = C.muted}) => (
	<div style={{position: 'absolute', left: align === 'left' ? x : undefined, right: align === 'right' ? x : undefined, top: y, textAlign: align, fontFamily: dmm.font}}>
		<div style={{fontSize: 24, fontWeight: 800, letterSpacing: 4, color: labelColor, marginBottom: 6}}>{label}</div>
		{children}
	</div>
);

export const DMM001: React.FC<{showSafeZones?: boolean; music?: boolean; sfx?: boolean}> = ({showSafeZones = false, music = true, sfx = true}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	// simulated time
	const yp = prog(frame, T.yearsStart, T.yearsEnd - T.yearsStart, (t) => t);
	const months = yp * YEARS.value * 12;
	const value = valueAt(months);
	const spent = RAISE.value * months;
	const done = frame >= T.yearsEnd;

	// panel B lifts toward the viewer on the payoff (no global zoom: keeps the
	// headline and footnote inside the safe area)
	const [l0, l1, l2, l3] = T.lift;
	const lift = frame < l2 ? kf(frame, [l0, l1], [0, 1], E.inOut) : kf(frame, [l2, l3], [1, 0.4], E.inOut);
	const drift = Math.sin(frame / 70) * 2;

	// spender's panel drains of colour as years pass
	const dimA = kf(frame, [T.yearsStart, T.yearsEnd], [0, 0.6], E.soft);
	const kept = shake(frame, T.keptPulse, 7, 16);
	const glowB = kf(frame, [T.gap - 20, T.gap + 20], [0, 1], E.out);
	const gapP = prog(frame, T.gap, 26, E.out);
	const gapLabelP = sp(frame, fps, T.gap + 14, 'bouncy');
	const baseLabelP = prog(frame, T.baseLabel, 14);
	const trackOut = kf(frame, [T.headOut + 8, T.headOut + 22], [1, 0], E.in);
	const signIn = prog(frame, T.sign, 16);
	const settle = done ? sp(frame, fps, T.yearsEnd, 'heavy') : 0;

	return (
		<AbsoluteFill style={{fontFamily: dmm.font}}>
			<Stage lightX={mix(260, 420, yp)} lightY={mix(240, 900, yp)} light={1 + glowB * 0.3} />
			<AbsoluteFill style={{transform: `translateY(${drift}px)`}}>
				{/* HOOK — readable on frame 0, swapped for the takeaway at the end */}
				<Headline
					y={196}
					exitAt={T.headOut}
					lines={[
						{text: 'YOU GOT A $500 RAISE.', size: 74},
						{text: 'WHERE DOES IT GO?', size: 84, color: C.accent},
					]}
				/>
				<Headline
					y={192}
					at={T.headIn}
					stagger={5}
					lines={[
						{text: 'Lifestyle creep doesn’t', size: 62, weight: 800},
						{text: 'feel like a choice.', size: 62, weight: 800},
						{text: 'It is one.', size: 80, color: C.accent},
					]}
				/>

				{/* MOVE 1 — spends it */}
				<Panel x={PX} y={A.y} w={PW} h={A.h} tag="SPENDS IT" tagNumber="1" tone="muted" dim={dimA}>
					<Chip at={T.chipA} tone="muted" />
					<div style={{position: 'absolute', left: 36, top: 112}}>
						<SplitBar total={RAISE.value} w={PW - 72} items={SPEND_SPLIT.map((s, i) => ({...s, at: T.items[i]}))} fade={dimA} />
					</div>
					<Stat label="SPENT" x={36} y={262}>
						<NumberCounter value={spent} fontSize={72} color={C.muted} roll={false} />
					</Stat>
					<div style={{position: 'absolute', right: 36, top: 262, transform: `translate(${kept.x}px, ${kept.y}px)`}}>
						<Stat label="KEPT" x={0} y={0} align="right" labelColor={C.ink}>
							<div style={{fontSize: 72, fontWeight: 900, color: C.ink, lineHeight: 1.08}}>$0</div>
						</Stat>
					</div>
				</Panel>

				<div style={{opacity: trackOut}}>
					<YearTrack years={YEARS.value} progress={yp} x={PX} y={A.y + A.h + 22} w={PW} />
				</div>
				<Signature y={A.y + A.h + 36} opacity={signIn} />

				{/* MOVE 2 — invests it */}
				<Panel x={PX} y={B.y} w={PW} h={B.h} tag="INVESTS IT" tagNumber="2" glow={glowB} style={{transform: `scale(${1 + 0.022 * lift})`, transformOrigin: '50% 40%'}}>
					<Chip at={T.chipB} tone="accent" />
					<Stat label="WORTH" x={36} y={96} labelColor={C.accent}>
						<div style={{transform: `scale(${done ? 1 + 0.05 * (1 - settle) : 1})`, transformOrigin: '0% 50%'}}>
							<NumberCounter value={done ? FINAL_VALUE.value : value} fontSize={104} color={C.ink} roll={false} />
						</div>
					</Stat>
					<div
						style={{
							position: 'absolute',
							right: 36,
							top: 158,
							padding: '10px 18px',
							borderRadius: 14,
							background: C.accent,
							color: C.bg,
							fontSize: 30,
							fontWeight: 900,
							whiteSpace: 'nowrap',
							opacity: Math.min(1, gapLabelP * 1.4),
							transform: `translateY(${(1 - Math.min(1, gapLabelP)) * 24}px) scale(${0.8 + 0.2 * gapLabelP})`,
							transformOrigin: '100% 50%',
						}}
					>
						+{usd(GROWTH.value)} GROWTH
					</div>
					<div style={{position: 'absolute', left: 36, top: 262}}>
						<GrowthChart
							w={PW - 72 - 70}
							h={276}
							value={VALUE_SERIES}
							base={BASE_SERIES}
							progress={yp}
							yMax={FINAL_VALUE.value * 1.06}
							xLabels={[
								{at: 0, text: 'YEAR 0'},
								{at: 1, text: 'YEAR 10'},
							]}
							baseLabel={`PUT IN ${usd(TOTAL_PUT_IN.value)}`}
							baseLabelReveal={baseLabelP}
							gapReveal={gapP}
						/>
					</div>
				</Panel>

				{/* honesty footnote — always on, inside the safe area */}
				<div style={{position: 'absolute', left: PX, top: B.y + B.h + 20, width: PW, fontSize: 24, lineHeight: 1.3, fontWeight: 600, color: C.muted, fontFamily: dmm.font}}>
					<span style={{color: C.ink, fontWeight: 800, letterSpacing: 2}}>EXAMPLE</span> · $500/mo for 10 yrs at a hypothetical 7%/yr, compounded monthly. Not guaranteed. Not advice.
				</div>
			</AbsoluteFill>

			<FilmFinish />
			{showSafeZones && <SafeZoneOverlay />}

			{music && <MusicBed src="daily/music/dmm-bed-120bpm.wav" volume={0.9} />}
			{sfx && (
				<>
					<Sfx at={T.chipA} name="pop" volume={0.6} />
					{T.items.map((at, i) => (
						<Sfx key={at} at={at} name={i === 0 ? 'card' : 'click'} volume={0.7} />
					))}
					<Sfx at={T.keptPulse} name="thud" volume={0.7} />
					<Sfx at={T.gap} name="coin" volume={0.7} />
					<Sfx at={T.yearsEnd} name="chime" volume={0.6} />
					<Sfx at={T.headOut} name="whoosh-soft" volume={0.6} />
				</>
			)}
		</AbsoluteFill>
	);
};

export {QC_BEATS} from './timing';
