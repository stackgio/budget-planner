import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {ChapterTag, Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {Marcus} from '../../../story/components/Marcus';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, prog, sp} from '../../../story/lib/motion';
import {cinematic as P, story} from '../../../story/theme';

const PED = {x: 820, top: 1080};

/** A generic flashy watch (no brand). */
const Watch: React.FC<{size: number; glint: number}> = ({size, glint}) => (
	<svg width={size} height={size * 1.5} viewBox="0 0 100 150">
		<rect x={30} y={0} width={40} height={45} rx={8} fill="#C9A23A" />
		<rect x={30} y={105} width={40} height={45} rx={8} fill="#C9A23A" />
		<circle cx={50} cy={75} r={38} fill="#E8C35A" stroke="#8C6A14" strokeWidth={5} />
		<circle cx={50} cy={75} r={29} fill="#121316" />
		<path d="M50,75 L50,55 M50,75 L64,82" stroke="#F5F2EA" strokeWidth={4} strokeLinecap="round" />
		<path d={`M${20 + glint * 60},40 l8,-14 l8,14 l-8,14z`} fill="#fff" opacity={glint > 0 && glint < 1 ? 0.9 : 0} />
	</svg>
);

/**
 * BONUS — Marcus is drawn to a flashy watch, reaches for it… and walks away.
 * Light, relatable; the joke is the double-take, not the shopper.
 */
export const BonusScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const t0 = cue('L10');
	const tNot = cue('L10', 'not');
	const tSpending = cue('L10', 'spending');
	const tLook = cue('L10', 'look');
	const tRich = cue('L10', 'rich');

	const walkIn = prog(frame, t0 - 4, tSpending - t0 + 4, E.out);
	const walkOut = prog(frame, tLook + 4, 34, E.in);
	const mx = mix(mix(150, 560, walkIn), 230, walkOut);
	const turned = frame >= tLook + 2;
	const tag = Math.sin(frame / 7) * 8;
	const nope = sp(frame, fps, tLook, 'bouncy');

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={PED.x} lightY={900} warm floorY={story.ground} />
			<ChapterTag n="+" label="BONUS" at={t0 - 4} palette={{...P, accent: P.gold}} style={{left: story.safe.left, top: story.safe.top + 10}} />
			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right, top: 320}}>
				<KineticText text="DON'T SPEND TO LOOK RICH" at={tNot - 4} fontSize={100} color={P.ink} colors={{rich: P.gold, "don't": P.accent}} />
			</div>
			{/* spotlight cone on the pedestal */}
			<div style={{position: 'absolute', left: PED.x - 220, top: 560, width: 440, height: 780, background: 'linear-gradient(180deg, rgba(255,236,200,0.0), rgba(255,236,200,0.08))', clipPath: 'polygon(40% 0, 60% 0, 100% 100%, 0 100%)'}} />
			{/* pedestal + watch */}
			<div style={{position: 'absolute', left: PED.x - 110, top: PED.top, width: 220, height: story.ground - PED.top, background: 'linear-gradient(180deg,#2A2E35,#1B1E23)', borderRadius: '10px 10px 0 0', borderTop: `4px solid ${P.gold}`}} />
			<div style={{position: 'absolute', left: PED.x - 75, top: PED.top - 236}}>
				<Watch size={150} glint={kf(frame, [t0, t0 + 16], [0, 1])} />
			</div>
			{/* price tag */}
			<div
				style={{
					position: 'absolute',
					left: PED.x + 40,
					top: PED.top - 70,
					background: '#F5F2EA',
					color: '#121316',
					fontSize: 40,
					fontWeight: 900,
					padding: '6px 16px',
					borderRadius: 10,
					transform: `rotate(${12 + tag}deg)`,
					transformOrigin: '0 0',
					boxShadow: `0 8px 18px ${P.shadow}`,
				}}
			>
				$$$$
			</div>
			{/* "nah" bubble */}
			<div
				style={{
					position: 'absolute',
					left: mx + 10,
					top: 780,
					fontSize: 44,
					fontWeight: 900,
					color: P.bg,
					background: P.accent,
					borderRadius: 22,
					padding: '8px 22px',
					opacity: Math.min(1, nope * 1.5) * kf(frame, [tRich + 24, tRich + 34], [1, 0]),
					transform: `scale(${nope})`,
				}}
			>
				NAH.
			</div>
			<Marcus
				x={mx}
				y={story.ground}
				scale={1.06}
				facing={turned ? -1 : 1}
				seed={7}
				onDark
				track={[
					{at: -10, pose: 'walk', face: 'curious', cycle: 'walk'},
					{at: tSpending - 2, pose: ['present', {head: 10}], face: 'happy', spring: 'snappy'},
					{at: cue('L10', 'just') - 2, pose: ['think', {head: 6}], face: {mouthCurve: -0.2, lookX: 1}},
					{at: tLook, pose: 'shrug', face: 'smug', spring: 'bouncy'},
					{at: tLook + 6, pose: 'walk', face: 'happy', cycle: 'walk'},
				]}
			/>
			<Sfx at={t0} name="chime" volume={0.25} />
			<Sfx at={tLook} name="pop" volume={0.35} />
			<Sfx at={tLook + 8} name="whoosh-soft" volume={0.25} />
		</AbsoluteFill>
	);
};
