import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {EditorialBg} from '../../../story/components/Backgrounds';
import {Camera} from '../../../story/components/Camera';
import {ChapterTag, Sfx} from '../../../story/components/Chrome';
import {Marcus} from '../../../story/components/Marcus';
import {Bill} from '../../../story/components/Money';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, prog, shake, sp} from '../../../story/lib/motion';
import {editorial as P, story} from '../../../story/theme';
import {FACTS} from '../facts';
import {ExampleChip, Label} from '../parts';

/**
 * 03 · THE MATCH — "My job matched 4%. That's $1,600 a year. Free money. And I said no."
 * Viewer feels: the sting — the same stop hand from the hook, now with a
 * price on it. A SKIPPED stamp lands on the money.
 */
const HAND: [number, number] = [650, 1010];

export const MatchScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tSkip = cue('L9', 'skipped');
	const tPct = cue('L10', 'four');
	const tSixteen = cue('L10', 'sixteen');
	const tFree = cue('L11', 'free');
	const tNo = cue('L11', 'no');

	const pctIn = sp(frame, fps, tPct - 2, 'bouncy');
	const numIn = sp(frame, fps, tSixteen - 4, 'snappy');
	const val = FACTS.matchYear.value * kf(frame, [tSixteen, cue('L10', 'year', 0, 'end')], [0, 1], E.out);
	const stamp = sp(frame, fps, tNo + 2, 'heavy');
	const impact = shake(frame, tNo + 4, 8, 14);

	// three bills fly toward Marcus on "Free money", bounce off his hand on "no"
	const bills = [0, 1, 2].map((i) => {
		const t0 = tFree - 4 + i * 4;
		const inP = prog(frame, t0, Math.max(10, tNo - t0), E.inOut);
		const [fx, fy] = arc(inP, [-150, 820 + i * 50], [HAND[0] - i * 30, HAND[1] - i * 40], 180);
		const out = prog(frame, tNo, 22 + i * 3, E.in);
		const [bx, by] = arc(out, [HAND[0] - i * 30, HAND[1] - i * 40], [150 - i * 120, 1600], 100 + i * 40);
		const gone = frame >= tNo;
		return {x: gone ? bx : fx, y: gone ? by : fy, rot: gone ? -40 * out - i * 10 : -14 + i * 12 + 12 * inP, show: frame >= t0 && (!gone || out < 1)};
	});

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<EditorialBg />
			<ExampleChip palette={P} at={tPct - 4} />
			<ChapterTag n="03" label="THE MATCH" at={4} palette={P} style={{left: story.safe.left, top: story.safe.top + 6}} />
			<Camera keys={[{at: 0, zoom: 1}, {at: tNo - 2, zoom: 1}, {at: tNo + 16, zoom: 1.04, x: 540, y: 760}]} shakeX={impact.x} shakeY={impact.y}>
				<div style={{position: 'absolute', left: story.safe.left, top: 320, display: 'flex', alignItems: 'baseline', gap: 20, opacity: pctIn, transform: `translateY(${(1 - pctIn) * 30}px)`}}>
					<span style={{fontSize: story.type.h1 + 20, fontWeight: 900, color: P.accent, letterSpacing: -2}}>{FACTS.matchPct.value}%</span>
					<span style={{fontSize: story.type.h2, fontWeight: 900, color: P.ink}}>401(K) MATCH</span>
				</div>

				<div style={{position: 'absolute', left: story.safe.left - 6, top: 450, opacity: Math.min(1, numIn * 1.5), transform: `translateY(${(1 - numIn) * 30}px)`}}>
					<NumberCounter value={val} fontSize={story.type.mega * 0.86} color={P.accent} style={{letterSpacing: -5}} />
				</div>
				<Label color={P.body} style={{left: story.safe.left, top: 680, opacity: numIn}}>
					FREE MONEY · PER YEAR
				</Label>

				{/* the stamp */}
				{stamp > 0.01 && (
					<div
						style={{
							position: 'absolute',
							left: story.safe.left + 120,
							top: 470,
							border: `10px solid ${P.danger}`,
							color: P.danger,
							borderRadius: 18,
							padding: '6px 28px',
							fontSize: 104,
							fontWeight: 900,
							letterSpacing: 6,
							transform: `rotate(-12deg) scale(${1.8 - 0.8 * stamp})`,
							opacity: Math.min(1, stamp * 1.6) * 0.92,
							background: 'rgba(245,240,230,0.55)',
						}}
					>
						SKIPPED
					</div>
				)}

				{bills.map((b, i) => (b.show ? <Bill key={i} w={200} rot={b.rot} style={{left: b.x, top: b.y}} /> : null))}

				<Marcus
					x={840}
					y={story.ground}
					scale={1.06}
					facing={-1}
					seed={7}
					track={[
						{at: 0, pose: 'idle', face: 'neutral'},
						{at: tSkip, pose: ['shrug', {head: -6}], face: 'worried', spring: 'bouncy'},
						{at: tSixteen, pose: 'point', face: 'focused'},
						{at: tNo - 6, pose: 'stop', face: 'determined', spring: 'bouncy'},
						{at: tNo + 20, pose: 'worried', face: 'worried'},
					]}
				/>
			</Camera>
			<Sfx at={tPct} name="pop" volume={0.35} />
			<Sfx at={tSixteen} name="coin" volume={0.4} />
			<Sfx at={tFree} name="whoosh" volume={0.35} />
			<Sfx at={tNo + 4} name="stamp" volume={0.55} />
		</AbsoluteFill>
	);
};
