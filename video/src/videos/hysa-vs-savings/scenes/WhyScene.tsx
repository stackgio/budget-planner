import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {EditorialBg} from '../../../story/components/Backgrounds';
import {ChapterTag, Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {Marcus} from '../../../story/components/Marcus';
import {Bill} from '../../../story/components/Money';
import {BankBuilding, PhoneSavings, StickerTag} from '../../../story/components/Places';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, sp} from '../../../story/lib/motion';
import {editorial as P, story} from '../../../story/theme';
import {FACTS, usd0} from '../facts';
import {BANK, MARCUS, PHONE} from '../layout';

/**
 * WHY — "Why? Online banks don't pay for branches, rent, or tellers. So they pass that cash to you."
 * Viewer learns: a big bank's overhead (tags burst off the building) is what
 * eats your interest; the app has none of it, so the money flows to you.
 */
export const WhyScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tWhy = cue('L8', 'why');
	const tOnline = cue('L8', 'online');
	const costs: [string, number, number, number][] = [
		['BRANCHES', cue('L8', 'branches'), 560, -6],
		['RENT', cue('L8', 'rent'), 700, 5],
		['TELLERS', cue('L8', 'tellers'), 840, -3],
	];
	const tSo = cue('L9', 'so');
	const tCash = cue('L9', 'pass');
	const tYou = cue('L9', 'you');

	// L9: bank slides out, phone slides in on the same spot
	const swap = kf(frame, [tSo - 4, tSo + 14], [0, 1], E.inOut);
	const tagsOut = kf(frame, [tSo - 4, tSo + 10], [0, 1], E.in);

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<EditorialBg />
			<ChapterTag n="03" label="WHY THE GAP" at={tWhy - 6} palette={P} style={{left: story.safe.left, top: story.safe.top}} />
			<div style={{position: 'absolute', left: story.safe.left, top: 300, right: story.safe.right}}>
				<KineticText text="ONLINE BANKS SKIP" at={tOnline - 4} fontSize={100} color={P.ink} colors={{online: P.accent}} exitAt={tSo - 6} />
				<KineticText text="MORE FOR YOU" at={tSo + 2} fontSize={110} color={P.accent} style={{position: 'absolute', top: 0}} />
			</div>

			{/* overhead tags burst off the bank */}
			{costs.map(([label, at, y, rot], i) => {
				const p = sp(frame, fps, at - 2, 'bouncy');
				if (p < 0.01) return null;
				const [x0, y0] = [BANK.x + 160, story.ground - BANK.h + 120];
				const [x, yy] = arc(Math.min(1, p), [x0, y0], [story.safe.left + i * 40, y], 120);
				return (
					<StickerTag
						key={label}
						text={`− ${label}`}
						tone="danger"
						fontSize={50}
						style={{left: x, top: yy + tagsOut * 300, opacity: 1 - tagsOut, transform: `rotate(${rot}deg) scale(${0.5 + 0.5 * Math.min(1, p)})`}}
					/>
				);
			})}

			<div style={{position: 'absolute', left: BANK.x - swap * 700, top: story.ground - BANK.h}}>
				<BankBuilding w={BANK.w} />
			</div>
			<div style={{position: 'absolute', left: PHONE.x + (1 - swap) * -700, bottom: 1920 - story.ground}}>
				<PhoneSavings w={PHONE.w} balance={usd0(FACTS.deposit.value + FACTS.hysaEarned.value)} apy="4.5% APY" />
			</div>

			{/* cash flows from the app to Marcus */}
			{[0, 1, 2].map((i) => {
				const t = kf(frame, [tCash - 4 + i * 5, tCash + 14 + i * 5], [0, 1], E.inOut);
				if (t <= 0 || t >= 1) return null;
				const [x, y] = arc(t, [PHONE.x + PHONE.w / 2, story.ground - 260], [MARCUS.x - 60, story.ground - 300], 220);
				return <Bill key={i} w={150} rot={-20 + 40 * t} style={{left: x, top: y}} />;
			})}

			<Marcus
				x={MARCUS.x}
				y={story.ground}
				scale={MARCUS.scale}
				facing={-1}
				seed={4}
				track={[
					{at: 0, pose: 'think', face: 'curious'},
					{at: costs[0][1], pose: 'point', face: 'focused'},
					{at: tSo, pose: 'present', face: 'happy'},
					{at: tYou, pose: 'hold', face: 'joy', spring: 'bouncy'},
				]}
			/>
			{costs.map(([label, at]) => (
				<Sfx key={label} at={at} name="pop" volume={0.35} />
			))}
			<Sfx at={tSo} name="whoosh" volume={0.4} />
			<Sfx at={tCash + 8} name="cash" volume={0.35} />
		</AbsoluteFill>
	);
};
