import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {EditorialBg} from '../../../story/components/Backgrounds';
import {ChapterTag, Sfx} from '../../../story/components/Chrome';
import {LogoChip, SourceLabel, StatusTag} from '../../../story/components/Evidence';
import {Screenshot, type Region} from '../../../story/components/Screenshot';
import {useCues} from '../../../story/lib/cues';
import {mix, sp} from '../../../story/lib/motion';
import {editorial as P, story} from '../../../story/theme';
import {CHASE_FEE, LOGO} from '../assets';
import {ACCESSED} from '../facts';

const mixR = (a: Region, b: Region, t: number): Region => ({x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), w: mix(a.w, b.w, t), h: mix(a.h, b.h, t)});

/**
 * #3 CHASE — "Number three: Chase. Their Total Checking account can charge $15 a month
 * unless you meet certain criteria."
 * Logo → real Chase.com fee section; highlight "$15 … Monthly Service Fee" on "$15",
 * then the ways to avoid it on "unless".
 */
export const ChaseScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tChase = cue('L2', 'Chase');
	const tTotal = cue('L3', 'Total', -0.1);
	const tFee = cue('L3', '$15');
	const tUnless = cue('L3', 'unless');

	const logoIn = sp(frame, fps, tChase - 6, 'bouncy');
	const dock = sp(frame, fps, tTotal - 4, 'smooth');
	const cardIn = sp(frame, fps, tTotal, 'heavy');
	const zFee = sp(frame, fps, tFee - 3, 'smooth');
	const zWaive = sp(frame, fps, tUnless - 2, 'smooth');
	const markFee = sp(frame, fps, tFee, 'snappy');
	const markWaive = sp(frame, fps, tUnless + 2, 'snappy');
	const tag = sp(frame, fps, tTotal + 8, 'snappy');
	const pill = sp(frame, fps, tUnless + 6, 'bouncy');

	const logoH = mix(110, 50, dock);
	const logoX = mix((1080 - ((150 / 44) * 110 + 68)) / 2, story.safe.left, dock);
	const logoY = mix(640, 300, dock);

	const zoom = mixR(CHASE_FEE.heading, CHASE_FEE.options, zWaive);
	const focus = 0.42 * Math.max(zFee, zWaive);

	const W = 720;
	const H = (CHASE_FEE.natural.h / CHASE_FEE.natural.w) * W;
	const cardTop = 410;

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<EditorialBg tint="#F7F5F0" />
			<ChapterTag n="3" label="CHASE · CHECKING FEE" at={-6} palette={P} style={{left: story.safe.left, top: story.safe.top}} />

			<LogoChip
				src={LOGO.chase.src}
				natural={LOGO.chase.natural}
				h={logoH}
				padX={mix(34, 20, dock)}
				padY={mix(26, 14, dock)}
				style={{left: logoX, top: logoY, opacity: Math.min(1, logoIn * 1.4), transform: `scale(${0.8 + 0.2 * logoIn})`, transformOrigin: '0 0'}}
			/>
			<StatusTag kind="current" text="CURRENT · CHECKED NOV 2026" t={tag} style={{left: 380, top: 306}} />

			{cardIn > 0.001 && (
				<Screenshot
					src={CHASE_FEE.src}
					natural={CHASE_FEE.natural}
					w={W}
					frame="card"
					palette={P}
					zoomTo={zoom}
					focus={focus}
					marks={[
						{r: CHASE_FEE.heading, t: markFee},
						{r: CHASE_FEE.options, t: markWaive},
					]}
					style={{left: (1080 - W - 20) / 2, top: cardTop + (1 - cardIn) * 260, opacity: Math.min(1, cardIn * 1.6), transform: `rotate(${(1 - cardIn) * 4}deg)`}}
				/>
			)}

			<div
				style={{
					position: 'absolute',
					right: story.safe.right - 20,
					top: cardTop + H - 40,
					padding: '12px 22px',
					borderRadius: 14,
					background: P.accent,
					color: '#fff',
					fontSize: 32,
					fontWeight: 900,
					letterSpacing: 2,
					transform: `scale(${pill}) rotate(-3deg)`,
					boxShadow: `0 16px 30px ${P.shadow}`,
				}}
			>
				FEE CAN BE WAIVED
			</div>

			<SourceLabel
				source="Chase.com — Total Checking"
				date={ACCESSED}
				detail="chase.com/personal/checking/total-checking"
				palette={P}
				opacity={cardIn}
				style={{left: story.safe.left, top: cardTop + H + 44}}
			/>

			<Sfx at={tChase - 4} name="pop" volume={0.35} />
			<Sfx at={tTotal} name="paper" volume={0.4} />
			<Sfx at={tUnless + 6} name="click" volume={0.3} />
		</AbsoluteFill>
	);
};
