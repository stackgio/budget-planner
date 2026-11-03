import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {ChapterTag, Sfx} from '../../../story/components/Chrome';
import {LogoChip, SourceLabel, StatusTag} from '../../../story/components/Evidence';
import {Screenshot} from '../../../story/components/Screenshot';
import {useCues} from '../../../story/lib/cues';
import {mix, sp, wobble} from '../../../story/lib/motion';
import {cinematic as P, story} from '../../../story/theme';
import {CFPB_WF, LOGO} from '../assets';
import {FACTS} from '../facts';

const AccountCard: React.FC<{t: number; x: number; y: number; i: number}> = ({t, x, y, i}) => (
	<div
		style={{
			position: 'absolute',
			left: x,
			top: y + (1 - t) * 40,
			width: 146,
			height: 104,
			borderRadius: 16,
			background: '#F5F2EA',
			boxShadow: '0 14px 28px rgba(0,0,0,0.5)',
			opacity: Math.min(1, t * 1.6),
			transform: `scale(${0.7 + 0.3 * t}) rotate(${(i % 2 ? 1 : -1) * 2}deg)`,
			padding: '14px 14px',
			boxSizing: 'border-box',
			fontFamily: story.font,
		}}
	>
		<div style={{display: 'flex', alignItems: 'center', gap: 8}}>
			<div style={{width: 30, height: 30, borderRadius: 8, background: '#121316', color: '#F5F2EA', fontSize: 26, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1}}>+</div>
			<div style={{fontSize: 24, fontWeight: 900, color: '#121316'}}>OPEN</div>
		</div>
		<div style={{marginTop: 12, fontSize: 22, fontWeight: 900, color: P.danger, whiteSpace: 'nowrap'}}>✕ consent</div>
	</div>
);

/**
 * #1 WELLS FARGO — "They had employees opening accounts without customers' permission.
 * That's a pretty big red flag for me."
 * Logo + "2016 — Unauthorized Accounts Scandal" → account cards opening on their own,
 * alongside the CFPB's Sep 8, 2016 release; highlight "Secretly Opening Unauthorized Accounts".
 */
export const WellsScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tWells = cue('L9', 'Wells');
	const tThey = cue('L10', 'They', -0.1);
	const tOpening = cue('L10', 'opening');
	const tWithout = cue('L10', 'without');
	const tRed = cue('L11', 'red');

	const logoIn = sp(frame, fps, tWells - 6, 'bouncy');
	const title = sp(frame, fps, tWells + 8, 'snappy');
	const dock = sp(frame, fps, tThey - 4, 'smooth');
	const cardIn = sp(frame, fps, tThey, 'heavy');
	const accts = [0, 1, 2, 3, 4].map((i) => sp(frame, fps, tOpening - 2 + i * 4, 'bouncy'));
	const mDate = sp(frame, fps, tThey + 12, 'snappy');
	const mUn = sp(frame, fps, tOpening, 'snappy');
	const mSec = sp(frame, fps, tWithout, 'snappy');
	const flag = sp(frame, fps, tRed - 4, 'bouncy');
	const push = sp(frame, fps, tRed - 2, 'smooth');

	const logoW = (LOGO.wf.natural.w / LOGO.wf.natural.h) * 90;
	const W = 700;
	const VH = 660;
	const top = 610;

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={540} lightY={760} light={0.85} />
			<ChapterTag n="1" label="WELLS FARGO" at={-6} palette={P} style={{left: story.safe.left, top: story.safe.top}} />
			<LogoChip
				src={LOGO.wf.src}
				natural={LOGO.wf.natural}
				h={mix(90, 44, dock)}
				bg="#D71E28"
				padX={mix(26, 14, dock)}
				padY={mix(16, 8, dock)}
				style={{left: mix((1080 - logoW - 52) / 2, story.safe.left, dock), top: mix(600, 292, dock), opacity: Math.min(1, logoIn * 1.4), transform: `scale(${0.8 + 0.2 * logoIn})`, transformOrigin: '0 0'}}
			/>
			<StatusTag kind="historical" text="HISTORICAL · SEP 2016" palette={P} t={cardIn} style={{left: 400, top: 298}} />
			<div
				style={{
					position: 'absolute',
					left: mix(story.safe.left, story.safe.left, dock),
					right: story.safe.right - 48,
					top: mix(760, 392, dock),
					textAlign: dock > 0.5 ? 'left' : 'center',
					fontSize: mix(52, 38, dock),
					fontWeight: 900,
					color: P.ink,
					opacity: title,
					transform: `translateY(${(1 - title) * 20}px)`,
				}}
			>
				<span style={{color: P.danger}}>{FACTS.wfYear.value}</span> — Unauthorized Accounts Scandal
			</div>

			{accts.map((t, i) => (
				<AccountCard key={i} t={t} i={i} x={story.safe.left + i * 152} y={470 + wobble(frame, i + 11, 0.06, 2)} />
			))}
			{/* red flag */}
			<svg width={120} height={150} viewBox="0 0 120 150" style={{position: 'absolute', left: 862, top: 440, transform: `scale(${flag})`, transformOrigin: '10px 150px'}}>
				<rect x={8} y={6} width={8} height={144} rx={4} fill="#F5F2EA" />
				<path d={`M16 10 Q 60 ${0 + wobble(frame, 3, 0.25, 8)} 104 18 L 104 70 Q 60 ${62 + wobble(frame, 5, 0.25, 8)} 16 66 Z`} fill={P.danger} />
			</svg>

			{cardIn > 0.001 && (
				<Screenshot
					src={CFPB_WF.src}
					natural={CFPB_WF.natural}
					w={W}
					viewportH={VH}
					frame="card"
					palette={{...P, paper: '#FFFFFF'}}
					zoomTo={{x: 0, y: 340, w: 730, h: 340}}
					focus={0.22 * push}
					marks={[
						{r: CFPB_WF.date, t: mDate, color: '#1E9E57'},
						{r: CFPB_WF.unauthorized, t: mUn, color: '#1E9E57'},
						{r: CFPB_WF.secretly, t: mSec, color: '#1E9E57'},
					]}
					style={{left: (1080 - W - 20) / 2, top: top + (1 - cardIn) * 320, opacity: Math.min(1, cardIn * 1.6), transform: `rotate(${(1 - cardIn) * 4}deg)`}}
				/>
			)}
			<SourceLabel source="CFPB press release" date="Sep 8, 2016" detail="consumerfinance.gov · newsroom archive" palette={P} opacity={cardIn} style={{left: story.safe.left, top: top + VH + 36}} />

			<Sfx at={tWells - 4} name="pop" volume={0.35} />
			<Sfx at={tThey} name="paper" volume={0.4} />
			{[0, 2, 4].map((i) => (
				<Sfx key={i} at={tOpening + i * 4} name="click" volume={0.25} />
			))}
			<Sfx at={tRed - 2} name="stamp" volume={0.35} />
		</AbsoluteFill>
	);
};
