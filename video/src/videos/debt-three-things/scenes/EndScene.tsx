import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {EditorialBg} from '../../../story/components/Backgrounds';
import {BrandBug, Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {Marcus} from '../../../story/components/Marcus';
import {useCues} from '../../../story/lib/cues';
import {kf, sp} from '../../../story/lib/motion';
import {editorial as P, story} from '../../../story/theme';

const ITEMS = [
	{n: '1', title: 'Build a $500 buffer', sub: 'Emergencies stop becoming debt'},
	{n: '2', title: 'Throw extra money at it', sub: 'Overtime, sell stuff, cut costs'},
	{n: '3', title: 'Stay debt-free', sub: 'Say no to the next shiny offer'},
];

/**
 * ENDING — "Which one are you working on?"
 * Learn: the three ideas, recapped as a numbered list so commenting "1/2/3"
 * is effortless. Feel: calm, clean, a natural invitation to answer.
 */
export const EndScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const t0 = cue('L10');
	const tEnd = cue('L10', undefined, 0, 'end');
	const brand = kf(frame, [tEnd + 6, tEnd + 20], [0, 1]);
	const prompt = sp(frame, fps, tEnd + 2, 'bouncy');
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<EditorialBg />
			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right - 30, top: story.safe.top + 20}}>
				<KineticText text="WHICH ONE ARE YOU WORKING ON?" at={t0 - 6} mode="pop" stagger={2} fontSize={108} color={P.ink} colors={{one: P.accent}} />
			</div>
			<div style={{position: 'absolute', left: story.safe.left, top: 640, width: 700, display: 'flex', flexDirection: 'column', gap: 26}}>
				{ITEMS.map((it, i) => {
					const p = sp(frame, fps, t0 + 6 + i * 6, 'snappy');
					return (
						<div
							key={it.n}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 26,
								background: P.paper,
								borderRadius: 26,
								padding: '22px 26px',
								boxShadow: `0 14px 30px ${P.shadow}`,
								transform: `translateY(${(1 - p) * 50}px)`,
								opacity: Math.min(1, p * 1.4),
							}}
						>
							<div style={{width: 84, height: 84, borderRadius: 22, background: P.accent, color: '#fff', fontSize: 50, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
								{it.n}
							</div>
							<div>
								<div style={{fontSize: 42, fontWeight: 900, color: P.ink, letterSpacing: -1}}>{it.title}</div>
								<div style={{fontSize: 26, fontWeight: 600, color: P.muted, marginTop: 2}}>{it.sub}</div>
							</div>
						</div>
					);
				})}
			</div>
			<div
				style={{
					position: 'absolute',
					left: story.safe.left,
					top: 1150,
					display: 'inline-flex',
					alignItems: 'center',
					gap: 14,
					background: P.ink,
					color: P.bg,
					fontSize: 32,
					fontWeight: 900,
					letterSpacing: 2,
					padding: '16px 26px',
					borderRadius: 18,
					transform: `scale(${prompt})`,
					transformOrigin: '0 50%',
				}}
			>
				COMMENT 1, 2 OR 3
				<svg width={30} height={30} viewBox="0 0 30 30">
					<path d="M15,4V24M6,16L15,25L24,16" stroke={P.accent} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
			</div>
			<BrandBug palette={P} opacity={brand} style={{left: story.safe.left, top: 1265}} />
			<Marcus
				x={900}
				y={story.ground}
				scale={0.95}
				facing={-1}
				seed={5}
				track={[
					{at: 0, pose: 'think', face: 'curious'},
					{at: t0 + 24, pose: ['point', {fs: 70, head: 8}], face: 'happy', spring: 'snappy'},
					{at: tEnd + 18, pose: 'relaxed', face: 'smug'},
				]}
			/>
			<Sfx at={t0 - 4} name="whoosh-soft" volume={0.35} />
			{ITEMS.map((_, i) => (
				<Sfx key={i} at={t0 + 6 + i * 6} name="click" volume={0.45} />
			))}
			<Sfx at={tEnd + 2} name="pop" volume={0.35} />
		</AbsoluteFill>
	);
};
