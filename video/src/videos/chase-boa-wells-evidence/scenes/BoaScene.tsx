import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {EditorialBg} from '../../../story/components/Backgrounds';
import {ChapterTag, Sfx} from '../../../story/components/Chrome';
import {LogoChip, SourceLabel, StatusTag} from '../../../story/components/Evidence';
import {useCues} from '../../../story/lib/cues';
import {E, mix, prog, sp} from '../../../story/lib/motion';
import {editorial as P, story} from '../../../story/theme';
import {BOA_HEAD, LOGO} from '../assets';
import {FACTS} from '../facts';
import {SourceCard} from './SourceCard';

/**
 * #2 BANK OF AMERICA — "Number two: Bank of America. In 2023, regulators took action against
 * them over improper fees and unauthorized accounts."
 * 2023 → CFPB ACTION, then the CFPB's own logo + headline + JUL 11, 2023, readable at phone size.
 * Each finding is highlighted in the headline AND restated in plain words underneath.
 */
const FINDINGS = [
	{key: 'fees', text: 'Repeat $35 fees on declined charges'},
	{key: 'accounts', text: 'Credit cards opened without consent'},
];

export const BoaScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tBank = cue('L4', 'Bank');
	const t2023 = cue('L5', '2023');
	const tReg = cue('L5', 'regulators');
	const tAction = cue('L5', 'action');
	const tFees = cue('L5', 'fees');
	const tUnauth = cue('L5', 'unauthorized');

	const logoIn = sp(frame, fps, tBank - 8, 'bouncy');
	const dock = sp(frame, fps, t2023 - 6, 'smooth');
	const dotA = sp(frame, fps, t2023 - 2, 'bouncy');
	const line = prog(frame, tReg, 14, E.out);
	const dotB = sp(frame, fps, tAction - 4, 'bouncy');
	const cardIn = sp(frame, fps, tAction - 2, 'heavy');
	const mDate = sp(frame, fps, tAction + 8, 'snappy');
	const mFees = sp(frame, fps, tFees - 3, 'snappy');
	const mAcc = sp(frame, fps, tUnauth - 3, 'snappy');
	const f = [sp(frame, fps, tFees, 'snappy'), sp(frame, fps, tUnauth, 'snappy')];

	const logoW = (LOGO.boa.natural.w / LOGO.boa.natural.h) * 70 + 68;
	const W = 860;
	const top = 520;
	const TL = {y: 456, x0: story.safe.left + 16, x1: 900};

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<EditorialBg tint="#F7F5F0" />
			<ChapterTag n="2" label="BANK OF AMERICA" at={-8} palette={P} style={{left: story.safe.left, top: story.safe.top}} />
			<LogoChip
				src={LOGO.boa.src}
				natural={LOGO.boa.natural}
				h={mix(70, 36, dock)}
				padX={mix(34, 18, dock)}
				padY={mix(26, 14, dock)}
				style={{left: mix((1080 - logoW) / 2, story.safe.left, dock), top: mix(640, 290, dock), opacity: Math.min(1, logoIn * 1.4), transform: `scale(${0.8 + 0.2 * logoIn})`, transformOrigin: '0 0'}}
			/>
			<StatusTag kind="historical" text="HISTORICAL · 2023" t={dotA} style={{left: 440, top: 294}} />

			{/* 2023 → CFPB ACTION */}
			<div style={{position: 'absolute', left: TL.x0, top: TL.y, width: (TL.x1 - TL.x0) * line, height: 6, borderRadius: 3, background: P.ink, opacity: dotA}} />
			<div style={{position: 'absolute', left: TL.x0 - 16, top: TL.y - 13, width: 32, height: 32, borderRadius: 16, background: P.ink, transform: `scale(${dotA})`}} />
			<div style={{position: 'absolute', left: TL.x1 - 16, top: TL.y - 13, width: 32, height: 32, borderRadius: 16, background: P.accent, transform: `scale(${dotB})`}} />
			<div style={{position: 'absolute', left: TL.x0 + 30, top: TL.y - 64, fontSize: 48, fontWeight: 900, color: P.ink, opacity: dotA, lineHeight: 1}}>{FACTS.boaYear.value}</div>
			<div style={{position: 'absolute', right: 1080 - TL.x1 - 16, top: TL.y - 52, fontSize: 32, fontWeight: 900, letterSpacing: 3, color: P.accent, opacity: dotB, lineHeight: 1}}>CFPB ACTION</div>

			{cardIn > 0.001 && (
				<SourceCard
					src={BOA_HEAD.src}
					natural={BOA_HEAD.natural}
					w={W}
					marks={[
						{r: BOA_HEAD.date, t: mDate},
						{r: BOA_HEAD.junkFees, t: mFees},
						{r: BOA_HEAD.fakeAccounts, t: mAcc},
					]}
					style={{left: (1080 - W - 48) / 2, top: top + (1 - cardIn) * 260, opacity: Math.min(1, cardIn * 1.6), transform: `rotate(${(1 - cardIn) * -3}deg)`}}
				/>
			)}
			<SourceLabel source="CFPB press release" date="Jul 11, 2023" palette={P} opacity={cardIn} style={{left: story.safe.left, top: 1086}} />

			{/* what the CFPB found — plain words */}
			<div style={{position: 'absolute', left: story.safe.left, top: 1140, fontSize: 26, fontWeight: 900, letterSpacing: 4, color: P.muted, opacity: f[0]}}>WHAT THE CFPB FOUND</div>
			{FINDINGS.map((it, i) => (
				<div
					key={it.key}
					style={{
						position: 'absolute',
						left: story.safe.left,
						top: 1184 + i * 70,
						display: 'flex',
						alignItems: 'center',
						gap: 16,
						fontSize: 42,
						fontWeight: 900,
						color: P.ink,
						opacity: f[i],
						transform: `translateX(${(1 - f[i]) * -40}px)`,
					}}
				>
					<span style={{width: 16, height: 16, borderRadius: 8, background: P.accent, flex: 'none'}} />
					{it.text}
				</div>
			))}

			<Sfx at={tBank - 6} name="pop" volume={0.35} />
			<Sfx at={tReg + 2} name="tick" volume={0.3} />
			<Sfx at={tAction} name="paper" volume={0.38} />
			<Sfx at={tUnauth} name="click" volume={0.28} />
		</AbsoluteFill>
	);
};
