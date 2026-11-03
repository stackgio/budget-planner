import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {EditorialBg} from '../../../story/components/Backgrounds';
import {ChapterTag, Sfx} from '../../../story/components/Chrome';
import {LogoChip, SourceLabel, StatusTag} from '../../../story/components/Evidence';
import {KineticText} from '../../../story/components/KineticText';
import {Marcus} from '../../../story/components/Marcus';
import {Screenshot} from '../../../story/components/Screenshot';
import {useCues} from '../../../story/lib/cues';
import {mix, prog, sp, E} from '../../../story/lib/motion';
import {editorial as P, story} from '../../../story/theme';
import {CFPB_BOA, LOGO} from '../assets';
import {FACTS} from '../facts';

/**
 * #2 BANK OF AMERICA — "In 2023, regulators took action against them over improper fees and
 * unauthorized accounts. When it comes to my money, trust matters."
 * Logo → 2023 → CFPB ACTION timeline → the CFPB's own release (logo, headline, JUL 11, 2023),
 * highlighting "Illegally Charging Junk Fees" and "Opening Fake Accounts". Then back to motion.
 */
export const BoaScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tBank = cue('L6', 'Bank');
	const t2023 = cue('L7', '2023');
	const tReg = cue('L7', 'regulators');
	const tAction = cue('L7', 'action');
	const tFees = cue('L7', 'fees');
	const tUnauth = cue('L7', 'unauthorized');
	const tWhen = cue('L8', 'When');
	const tTrust = cue('L8', 'trust');

	const logoIn = sp(frame, fps, tBank - 6, 'bouncy');
	const dock = sp(frame, fps, t2023 - 6, 'smooth');
	const dotA = sp(frame, fps, t2023, 'bouncy');
	const line = prog(frame, tReg, 16, E.out);
	const dotB = sp(frame, fps, tAction - 2, 'bouncy');
	const cardIn = sp(frame, fps, tAction, 'heavy');
	const mDate = sp(frame, fps, tAction + 10, 'snappy');
	const mFees = sp(frame, fps, tFees - 2, 'snappy');
	const mAcc = sp(frame, fps, tUnauth - 2, 'snappy');
	const push = sp(frame, fps, tFees - 6, 'smooth');
	const out = sp(frame, fps, tWhen - 6, 'smooth');
	const tag = sp(frame, fps, tAction + 6, 'snappy');

	const logoH = mix(70, 40, dock);
	const logoW = (LOGO.boa.natural.w / LOGO.boa.natural.h) * 70 + 68;
	const W = 760;
	const VH = 720;
	const top = 520;
	const TL = {y: 410, x0: story.safe.left + 20, x1: 860};

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<EditorialBg tint="#F7F5F0" />
			<ChapterTag n="2" label="BANK OF AMERICA" at={-6} palette={P} style={{left: story.safe.left, top: story.safe.top}} />
			<LogoChip
				src={LOGO.boa.src}
				natural={LOGO.boa.natural}
				h={logoH}
				padX={mix(34, 20, dock)}
				padY={mix(26, 14, dock)}
				style={{left: mix((1080 - logoW) / 2, story.safe.left, dock), top: mix(640, 290, dock), opacity: Math.min(1, logoIn * 1.4), transform: `scale(${0.8 + 0.2 * logoIn})`, transformOrigin: '0 0'}}
			/>
			<StatusTag kind="historical" text="HISTORICAL · JUL 2023" t={tag} style={{left: 450, top: 296}} />

			{/* mini timeline: 2023 → CFPB ACTION */}
			<div style={{position: 'absolute', left: TL.x0, top: TL.y, width: (TL.x1 - TL.x0) * line, height: 6, borderRadius: 3, background: P.ink, opacity: dotA}} />
			{[
				{x: TL.x0, t: dotA, label: String(FACTS.boaYear.value), big: true},
				{x: TL.x1, t: dotB, label: 'CFPB ACTION', big: false},
			].map((d, i) => (
				<React.Fragment key={i}>
					<div style={{position: 'absolute', left: d.x - 16, top: TL.y - 13, width: 32, height: 32, borderRadius: 16, background: i ? P.accent : P.ink, transform: `scale(${d.t})`}} />
					<div
						style={{
							position: 'absolute',
							left: i ? undefined : d.x - 16,
							right: i ? 1080 - d.x - 16 : undefined,
							top: TL.y + 30,
							fontSize: d.big ? 48 : 30,
							fontWeight: 900,
							letterSpacing: d.big ? 0 : 3,
							color: i ? P.accent : P.ink,
							opacity: d.t,
							lineHeight: 1,
						}}
					>
						{d.label}
					</div>
				</React.Fragment>
			))}

			{cardIn > 0.001 && (
				<Screenshot
					src={CFPB_BOA.src}
					natural={CFPB_BOA.natural}
					w={W}
					viewportH={VH}
					frame="card"
					palette={P}
					zoomTo={CFPB_BOA.headline}
					focus={0.3 * push}
					marks={[
						{r: CFPB_BOA.date, t: mDate},
						{r: CFPB_BOA.junkFees, t: mFees},
						{r: CFPB_BOA.fakeAccounts, t: mAcc},
					]}
					style={{
						left: (1080 - W - 20) / 2,
						top: top + (1 - cardIn) * 300 + out * 700,
						opacity: Math.min(1, cardIn * 1.6) * (1 - out),
						transform: `rotate(${(1 - cardIn) * -4 + out * 6}deg)`,
					}}
				/>
			)}
			<SourceLabel
				source="CFPB press release"
				date="Jul 11, 2023"
				detail="consumerfinance.gov · newsroom archive"
				palette={P}
				opacity={cardIn * (1 - out)}
				style={{left: story.safe.left, top: top + VH + 40}}
			/>

			{/* back to motion graphics */}
			{out > 0.01 && (
				<>
					<div style={{position: 'absolute', left: story.safe.left, top: 640, right: story.safe.right}}>
						<KineticText text="TRUST" at={tTrust - 4} mode="slam" fontSize={160} color={P.ink} />
						<KineticText text="MATTERS" at={tTrust + 2} fontSize={124} color={P.accent} />
					</div>
					<div style={{position: 'absolute', inset: 0, opacity: out}}>
					<Marcus
						x={900}
						y={story.ground}
						scale={0.9}
						facing={-1}
						seed={9}
						track={[
							{at: tWhen - 6, pose: 'idle', face: 'neutral'},
							{at: tTrust, pose: ['point', {head: -8}], face: 'determined', spring: 'bouncy'},
						]}
					/>
					</div>
				</>
			)}

			<Sfx at={tBank - 4} name="pop" volume={0.35} />
			<Sfx at={tReg + 2} name="tick" volume={0.3} />
			<Sfx at={tAction} name="paper" volume={0.4} />
			<Sfx at={tTrust - 2} name="thud" volume={0.35} />
		</AbsoluteFill>
	);
};
