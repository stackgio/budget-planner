import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {EditorialBg} from '../../../story/components/Backgrounds';
import {Sfx} from '../../../story/components/Chrome';
import {HouseKey} from '../../../story/components/HomeProps';
import {KineticText} from '../../../story/components/KineticText';
import {Marcus} from '../../../story/components/Marcus';
import {SavingsJar} from '../../../story/components/Money';
import {useCues} from '../../../story/lib/cues';
import {kf, sp} from '../../../story/lib/motion';
import {editorial as P, story} from '../../../story/theme';
import {EstimateCard} from './shared';

/** Where the estimate sits at the end of this scene — EndScene opens on the same framing (match cut). */
export const ESTIMATE_HANDOFF = {x: 540, y: 960, w: 560};

const Reason: React.FC<{icon: React.ReactNode; text: string; p: number}> = ({icon, text, p}) => (
	<div style={{display: 'flex', alignItems: 'center', gap: 28, height: 130, opacity: p, transform: `translateX(${(1 - p) * -60}px)`}}>
		<div style={{width: 120, height: 120, borderRadius: 30, background: P.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>{icon}</div>
		<div style={{fontSize: 72, fontWeight: 900, letterSpacing: -1, color: P.ink}}>{text}</div>
	</div>
);

const House: React.FC<{x: number; s: number; c: string}> = ({x, s, c}) => (
	<svg viewBox="0 0 100 90" width={170 * s} height={153 * s} style={{position: 'absolute', left: x, bottom: 0, transform: 'translateX(-50%)'}}>
		<path d="M50,6 L94,44 H82 V86 H18 V44 H6 Z" fill={c} />
		<rect x="42" y="56" width="16" height="30" rx="2" fill={P.bg} />
	</svg>
);

/**
 * L22–L25 — my decision. I'd rather rent right now → SAVE / INVEST SOME /
 * ROOM TO MOVE (no balances implied). Then the two questions get separate
 * beats, and the keys + the $5,000 estimate come back to tie the story off.
 */
export const DecisionScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tRent = cue('L22', 'rent');
	const tStack = cue('L22', 'stack');
	const tInvest = cue('L22', 'invest');
	const tRoom = cue('L22', 'room');
	const tL23 = cue('L23');
	const tMath = cue('L23', 'do the math.');
	const tL24 = cue('L24');
	const tL25 = cue('L25');
	const tKeys = cue('L25', 'keys,');
	const tBreaks = cue('L25', 'breaks?');

	const reasonsOut = kf(frame, [tL23 - 6, tL23 + 2], [0, 1]);
	const r1 = sp(frame, fps, tStack - 3, 'snappy') * (1 - reasonsOut);
	const r2 = sp(frame, fps, tInvest - 3, 'snappy') * (1 - reasonsOut);
	const r3 = sp(frame, fps, tRoom - 3, 'snappy') * (1 - reasonsOut);
	const math = sp(frame, fps, tMath - 3, 'bouncy') * (1 - kf(frame, [tL24 - 6, tL24], [0, 1]));
	const houses = sp(frame, fps, tL24 + 4, 'bouncy') * (1 - kf(frame, [tL25 - 6, tL25], [0, 1]));
	const key = sp(frame, fps, tKeys - 6, 'bouncy');
	const est = sp(frame, fps, tBreaks - 6, 'heavy');
	const marcusOut = kf(frame, [tL25 - 4, tL25 + 8], [0, 1]);
	const jarLevel = kf(frame, [tStack, tStack + 40], [0.15, 0.55]);

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<EditorialBg floorY={story.ground} />
			{/* headlines, one per beat */}
			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right, top: 250}}>
				{frame < tL23 - 4 && (
					<>
						<div style={{fontSize: 32, fontWeight: 800, letterSpacing: 5, color: P.muted, opacity: sp(frame, fps, 0, 'snappy')}}>ME PERSONALLY?</div>
						<KineticText text="I'D RATHER RENT RIGHT NOW" at={tRent - 8} fontSize={84} color={P.ink} colors={{RENT: P.accent}} style={{marginTop: 12}} exitAt={tL23 - 10} />
					</>
				)}
				{frame >= tL23 - 4 && frame < tL24 - 2 && (
					<>
						<div style={{fontSize: 32, fontWeight: 800, letterSpacing: 5, color: P.muted}}>IF BUYING IS YOUR GOAL</div>
						<KineticText text="DO THE MATH." at={tMath - 4} mode="pop" fontSize={120} color={P.ink} colors={{MATH: P.accent}} style={{marginTop: 12}} />
					</>
				)}
				{frame >= tL24 - 2 && frame < tL25 - 2 && <KineticText text="WOULD I STAY HERE?" at={tL24 - 2} fontSize={112} color={P.ink} colors={{STAY: P.accent}} exitAt={tL25 - 10} />}
				{frame >= tL25 - 2 && <KineticText text="CAN I AFFORD WHAT BREAKS?" at={tL25 - 2} fontSize={100} color={P.ink} colors={{BREAKS: P.danger}} />}
			</div>

			{/* reasons */}
			<div style={{position: 'absolute', left: story.safe.left + 10, top: 640}}>
				<Reason
					p={r1}
					text="SAVE"
					icon={<SavingsJar w={80} level={jarLevel} palette={P} showLabel={false} style={{left: 60, top: 110}} />}
				/>
				<div style={{height: 34}} />
				<Reason
					p={r2}
					text="INVEST SOME"
					icon={
						<svg width="76" height="76" viewBox="0 0 40 40">
							<path d="M4,32 L15,21 L22,27 L36,10" stroke={P.accent} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
							<path d="M27,9 H37 V19" stroke={P.accent} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
						</svg>
					}
				/>
				<div style={{height: 34}} />
				<Reason
					p={r3}
					text="ROOM TO MOVE"
					icon={
						<svg width="80" height="80" viewBox="0 0 40 40">
							<path d="M4,20 H36 M10,13 L3,20 L10,27 M30,13 L37,20 L30,27" stroke={P.accent} strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
						</svg>
					}
				/>
			</div>

			{/* do the math: a plain calculator glyph */}
			{math > 0.01 && (
				<div style={{position: 'absolute', left: 300, top: 700, width: 300, height: 420, borderRadius: 36, background: P.ink, opacity: math, transform: `translateY(${(1 - math) * 60}px) rotate(-4deg)`, padding: 30}}>
					<div style={{height: 90, borderRadius: 16, background: '#2A2E35'}} />
					<div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 24}}>
						{Array.from({length: 9}, (_, i) => (
							<div key={i} style={{height: 64, borderRadius: 14, background: i === 8 ? P.accent : '#3A3E46'}} />
						))}
					</div>
				</div>
			)}

			{/* would I stay here? a neighborhood */}
			{houses > 0.01 && (
				<div style={{position: 'absolute', left: 0, width: 760, top: story.ground - 200, height: 200, opacity: houses, transform: `translateY(${(1 - houses) * 40}px)`}}>
					<House x={170} s={0.9} c={P.line} />
					<House x={380} s={1.15} c={P.accent} />
					<House x={590} s={0.9} c={P.line} />
				</div>
			)}

			{/* callback: keys, then the estimate */}
			{frame >= tKeys - 8 && (
				<div style={{opacity: Math.min(1, key * 2) * (1 - kf(frame, [tBreaks - 4, tBreaks + 6], [0, 1]) * 0.75)}}>
					<HouseKey w={420} style={{left: 520, top: 820, transform: `translate(-50%,-50%) scale(${0.6 + 0.4 * key}) rotate(${-18 + (1 - key) * 30 - kf(frame, [tBreaks - 4, tBreaks + 6], [0, 30])}deg)`, transformOrigin: '22% 50%'}} />
				</div>
			)}
			{frame >= tBreaks - 8 && (
				<EstimateCard
					w={ESTIMATE_HANDOFF.w}
					owner={1}
					style={{left: ESTIMATE_HANDOFF.x, top: ESTIMATE_HANDOFF.y + (1 - est) * 600, transform: `translate(-50%,-50%) rotate(${(1 - est) * 10}deg)`}}
				/>
			)}

			{marcusOut < 1 && (
				<div style={{opacity: 1 - marcusOut}}>
					<Marcus
						x={880}
						y={story.ground}
						scale={1.0}
						facing={-1}
						seed={8}
						track={[
							{at: 0, pose: 'relaxed', face: 'smug'},
							{at: tRent, pose: 'present', face: 'happy'},
							{at: tStack, pose: 'relaxed', face: 'happy'},
							{at: tL23, pose: 'think', face: 'focused'},
							{at: tL24, pose: 'shrug', face: 'curious'},
						]}
					/>
				</div>
			)}
			<Sfx at={tStack - 3} name="coin" volume={0.3} />
			<Sfx at={tInvest - 3} name="pop" volume={0.25} />
			<Sfx at={tRoom - 3} name="pop" volume={0.25} />
			<Sfx at={tKeys - 6} name="coin" volume={0.25} />
			<Sfx at={tBreaks - 2} name="paper" volume={0.35} />
		</AbsoluteFill>
	);
};
