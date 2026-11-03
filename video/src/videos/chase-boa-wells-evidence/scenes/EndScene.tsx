import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {EditorialBg} from '../../../story/components/Backgrounds';
import {BrandBug, Sfx} from '../../../story/components/Chrome';
import {LogoChip} from '../../../story/components/Evidence';
import {KineticText} from '../../../story/components/KineticText';
import {Marcus} from '../../../story/components/Marcus';
import {useCues} from '../../../story/lib/cues';
import {sp} from '../../../story/lib/motion';
import {editorial as P, story} from '../../../story/theme';
import {LOGO} from '../assets';

const ROW = [
	{logo: LOGO.chase, bg: '#FFFFFF', tag: 'FEE · CURRENT', current: true},
	{logo: LOGO.boa, bg: '#FFFFFF', tag: 'CFPB · 2023', current: false},
	{logo: LOGO.wf, bg: '#D71E28', tag: 'CFPB · 2016', current: false},
];

/**
 * "Like, I'm 22, still learning personal finance. I'm not saying these banks are bad for
 * everybody, but I'm learning that choosing the right bank matters. What bank would you never use again?"
 * Recap row keeps CURRENT vs HISTORICAL explicit, then the question takes the frame.
 */
export const EndScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const t22 = cue('L8', '22');
	const tStill = cue('L8', 'still');
	const tBanks = cue('L9', 'banks');
	const tEvery = cue('L9', 'everybody');
	const tChoose = cue('L9', 'choosing');
	const tWhat = cue('L10', 'What');
	const tNever = cue('L10', 'never');

	const row = ROW.map((_, i) => sp(frame, fps, tBanks - 4 + i * 4, 'bouncy'));
	const q = sp(frame, fps, tWhat - 8, 'smooth');
	const learn = sp(frame, fps, tBanks - 8, 'smooth');

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<EditorialBg floorY={story.ground} />

			{/* "I'm 22, still learning" */}
			<div style={{position: 'absolute', left: story.safe.left, top: story.safe.top + 40, opacity: 1 - learn, transform: `translateY(${-learn * 40}px)`}}>
				<KineticText text="22 &" at={t22 - 4} mode="pop" fontSize={190} color={P.ink} colors={{'22': P.accent}} />
				<KineticText text="STILL LEARNING" at={tStill - 2} fontSize={104} color={P.ink} />
			</div>

			{/* recap row: present-day vs historical */}
			<div style={{position: 'absolute', left: 0, right: 0, top: 0, opacity: 1 - q}}>
				{ROW.map((r, i) => {
					const t = row[i];
					const x = [story.safe.left, 290, 608][i];
					return (
						<React.Fragment key={i}>
							<LogoChip
								src={r.logo.src}
								natural={r.logo.natural}
								h={44}
								bg={r.bg}
								padX={16}
								padY={14}
								style={{left: x, top: story.safe.top + 40, opacity: Math.min(1, t * 1.5), transform: `translateY(${(1 - t) * 40}px)`}}
							/>
							<div style={{position: 'absolute', left: x + 4, top: story.safe.top + 136, fontSize: 24, fontWeight: 900, letterSpacing: 2, color: r.current ? P.accent : P.muted, opacity: t}}>{r.tag}</div>
						</React.Fragment>
					);
				})}
				<div style={{position: 'absolute', left: story.safe.left, top: 470, right: story.safe.right}}>
					<KineticText text="NOT BAD FOR EVERYONE" at={tEvery - 6} fontSize={84} color={P.ink} exitAt={tChoose - 6} />
				</div>
				<div style={{position: 'absolute', left: story.safe.left, top: 470, right: story.safe.right}}>
					<KineticText text="CHOOSE YOUR BANK" at={tChoose - 2} fontSize={96} color={P.ink} colors={{CHOOSE: P.accent}} />
					<KineticText text="ON PURPOSE" at={tChoose + 6} fontSize={96} color={P.accent} />
				</div>
			</div>

			{/* final question */}
			{q > 0.01 && (
				<div style={{position: 'absolute', left: story.safe.left, top: 330, right: story.safe.right, opacity: q}}>
					<div style={{fontSize: 30, fontWeight: 900, letterSpacing: 4, color: P.muted, marginBottom: 18}}>YOUR TURN</div>
					<KineticText text="WHAT BANK" at={tWhat - 4} fontSize={120} color={P.ink} />
					<KineticText text="WOULD YOU" at={tWhat + 2} fontSize={120} color={P.ink} />
					<KineticText text="NEVER USE" at={tNever - 4} mode="slam" fontSize={120} color={P.accent} />
					<KineticText text="AGAIN?" at={tNever + 4} fontSize={120} color={P.ink} />
				</div>
			)}

			<Marcus
				x={860}
				y={story.ground}
				scale={1.05}
				facing={-1}
				seed={12}
				track={[
					{at: 0, pose: 'idle', face: 'happy'},
					{at: t22, pose: 'shrug', face: 'happy', spring: 'bouncy'},
					{at: tBanks, pose: 'think', face: 'focused'},
					{at: tChoose, pose: 'present', face: 'determined'},
					{at: tWhat, pose: ['point', {head: -6}], face: 'curious', spring: 'bouncy'},
				]}
			/>
			<BrandBug palette={P} opacity={q * 0.9} style={{left: story.safe.left, top: 1290}} />
			<div style={{position: 'absolute', left: story.safe.left, top: 1250, fontSize: 24, fontWeight: 700, color: P.muted, opacity: q}}>Sources linked in the description</div>

			<Sfx at={tBanks} name="pop" volume={0.3} />
			<Sfx at={tChoose} name="chime" volume={0.3} />
			<Sfx at={tNever - 2} name="thud" volume={0.35} />
		</AbsoluteFill>
	);
};
