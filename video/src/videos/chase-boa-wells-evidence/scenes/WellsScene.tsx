import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {ChapterTag, Sfx} from '../../../story/components/Chrome';
import {LogoChip, SourceLabel, StatusTag} from '../../../story/components/Evidence';
import {useCues} from '../../../story/lib/cues';
import {mix, sp, wobble} from '../../../story/lib/motion';
import {cinematic as P, story} from '../../../story/theme';
import {LOGO, WF_HEAD} from '../assets';
import {FACTS} from '../facts';
import {SourceCard} from './SourceCard';

const AccountCard: React.FC<{t: number; x: number; y: number; i: number}> = ({t, x, y, i}) => (
	<div
		style={{
			position: 'absolute',
			left: x,
			top: y + (1 - t) * 40,
			width: 160,
			height: 92,
			borderRadius: 16,
			background: '#F5F2EA',
			boxShadow: '0 14px 28px rgba(0,0,0,0.5)',
			opacity: Math.min(1, t * 1.6),
			transform: `scale(${0.7 + 0.3 * t}) rotate(${(i % 2 ? 1 : -1) * 2}deg)`,
			padding: '12px 14px',
			boxSizing: 'border-box',
			fontFamily: story.font,
		}}
	>
		<div style={{display: 'flex', alignItems: 'center', gap: 8}}>
			<div style={{width: 28, height: 28, borderRadius: 8, background: '#121316', color: '#F5F2EA', fontSize: 24, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1}}>+</div>
			<div style={{fontSize: 24, fontWeight: 900, color: '#121316'}}>OPENED</div>
		</div>
		<div style={{marginTop: 8, fontSize: 24, fontWeight: 900, color: P.danger, whiteSpace: 'nowrap'}}>✕ consent</div>
	</div>
);

/**
 * #1 WELLS FARGO — "Number one: Wells Fargo. They had employees opening accounts without customers' permission."
 * Logo + "2016 — Unauthorized Accounts Scandal" (HISTORICAL) → accounts open on their own beside
 * the CFPB's Sep 8, 2016 headline; "Secretly Opening Unauthorized Accounts" highlighted.
 */
export const WellsScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tWells = cue('L6', 'Wells');
	const tThey = cue('L7', 'They', -0.15);
	const tOpening = cue('L7', 'opening');
	const tWithout = cue('L7', 'without');
	const tEnd = cue('L7', undefined, 0, 'end');

	const logoIn = sp(frame, fps, tWells - 8, 'bouncy');
	const title = sp(frame, fps, tWells + 4, 'snappy');
	const dock = sp(frame, fps, tThey - 4, 'smooth');
	const cardIn = sp(frame, fps, tThey, 'heavy');
	const accts = [0, 1, 2, 3, 4].map((i) => sp(frame, fps, tOpening - 4 + i * 3, 'bouncy'));
	const mDate = sp(frame, fps, tThey + 10, 'snappy');
	const mUn = sp(frame, fps, tOpening + 2, 'snappy');
	const mSec = sp(frame, fps, tWithout, 'snappy');
	const note = sp(frame, fps, tEnd - 2, 'snappy');

	const logoW = (LOGO.wf.natural.w / LOGO.wf.natural.h) * 90 + 52;
	const W = 860;
	const top = 590;

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={540} lightY={760} light={0.85} />
			<ChapterTag n="1" label="WELLS FARGO" at={-8} palette={P} style={{left: story.safe.left, top: story.safe.top}} />
			<LogoChip
				src={LOGO.wf.src}
				natural={LOGO.wf.natural}
				h={mix(90, 42, dock)}
				bg="#D71E28"
				padX={mix(26, 14, dock)}
				padY={mix(16, 8, dock)}
				style={{left: mix((1080 - logoW) / 2, story.safe.left, dock), top: mix(560, 292, dock), opacity: Math.min(1, logoIn * 1.4), transform: `scale(${0.8 + 0.2 * logoIn})`, transformOrigin: '0 0'}}
			/>
			<StatusTag kind="historical" text="HISTORICAL · 2016" palette={P} t={title} style={{left: 360, top: 296}} />
			<div
				style={{
					position: 'absolute',
					left: story.safe.left,
					right: story.safe.right - 48,
					top: mix(720, 384, dock),
					textAlign: dock > 0.5 ? 'left' : 'center',
					fontSize: mix(58, 40, dock),
					fontWeight: 900,
					lineHeight: 1.1,
					color: P.ink,
					opacity: title,
					transform: `translateY(${(1 - title) * 20}px)`,
				}}
			>
				<span style={{color: P.danger}}>{FACTS.wfYear.value}</span> — Unauthorized Accounts Scandal
			</div>

			{accts.map((t, i) => (
				<AccountCard key={i} t={t} i={i} x={story.safe.left + i * 176} y={466 + wobble(frame, i + 11, 0.06, 2)} />
			))}

			{cardIn > 0.001 && (
				<SourceCard
					src={WF_HEAD.src}
					natural={WF_HEAD.natural}
					w={W}
					marks={[
						{r: WF_HEAD.date, t: mDate},
						{r: WF_HEAD.unauthorized, t: mUn},
						{r: WF_HEAD.secretly, t: mSec},
					]}
					style={{left: (1080 - W - 48) / 2, top: top + (1 - cardIn) * 300, opacity: Math.min(1, cardIn * 1.6), transform: `rotate(${(1 - cardIn) * 3}deg)`}}
				/>
			)}
			<SourceLabel source="CFPB press release" date="Sep 8, 2016" palette={P} opacity={cardIn} style={{left: story.safe.left, top: 1130}} />
			<div style={{position: 'absolute', left: story.safe.left, top: 1186, fontSize: 32, fontWeight: 800, color: P.body, opacity: note, transform: `translateY(${(1 - note) * 14}px)`}}>
				A 2016 case — not a claim about today.
			</div>

			<Sfx at={tWells - 6} name="pop" volume={0.35} />
			<Sfx at={tThey} name="paper" volume={0.38} />
			{[0, 2, 4].map((i) => (
				<Sfx key={i} at={tOpening - 4 + i * 3} name="click" volume={0.22} />
			))}
			<Sfx at={tWithout + 2} name="stamp" volume={0.3} />
		</AbsoluteFill>
	);
};
