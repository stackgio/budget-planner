import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {BrandBug, Sfx} from '../../../story/components/Chrome';
import {Marcus} from '../../../story/components/Marcus';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, sp} from '../../../story/lib/motion';
import {cinematic as P, story} from '../../../story/theme';

const Bookmark: React.FC<{size: number; color: string}> = ({size, color}) => (
	<svg width={size} height={size} viewBox="0 0 24 24">
		<path d="M6 3h12v18l-6-4.5L6 21z" fill={color} />
	</svg>
);
const Send: React.FC<{size: number; color: string}> = ({size, color}) => (
	<svg width={size} height={size} viewBox="0 0 24 24">
		<path d="M3 11.5 21 3l-7.5 18-2.6-7.3z" fill={color} />
	</svg>
);

/**
 * Disclaimer + CTA. Hierarchy: SAVE (primary, huge) > SEND TO A FRIEND (secondary)
 * > DO YOUR OWN RESEARCH (persistent small note).
 */
export const EndScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const t26 = cue('L26');
	const tAdvisor = cue('L26', 'advisor');
	const t27 = cue('L27');
	const tResearch = cue('L28', 'research');
	const tSave = cue('L29', 'Save');
	const tFirst = cue('L29', 'first');
	const tSend = cue('L29', 'send');
	const tAsk = cue('L30');

	// disclaimer card: centered while Gio says it, then docks at the top as a small note
	const dIn = sp(frame, fps, t26 - 4, 'snappy');
	const dock = kf(frame, [tSave - 10, tSave + 8], [0, 1], E.inOut);
	const research = kf(frame, [tResearch - 4, tResearch + 6], [0, 1]);
	const save = sp(frame, fps, tSave - 3, 'bouncy');
	const first = kf(frame, [tFirst - 4, tFirst + 6], [0, 1]);
	const send = sp(frame, fps, tSend - 3, 'bouncy');
	const ask = sp(frame, fps, tAsk - 2, 'snappy');
	const breathe = 1 + 0.015 * Math.sin((frame - tSave) / 18);

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={540} lightY={600} />
			<BrandBug palette={P} text="@stackwithgio" style={{left: story.safe.left, top: story.safe.top + 10}} opacity={0.9} />

			{/* disclaimer → docked note */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: mix(560, 262, dock),
					display: 'flex',
					justifyContent: 'center',
					opacity: Math.min(1, dIn * 1.4),
					transform: `scale(${mix(0.9 + 0.1 * dIn, 0.62, dock)})`,
				}}
			>
				<div style={{padding: '30px 48px', borderRadius: 32, background: P.paper, border: `2px solid ${P.line}`, textAlign: 'center'}}>
					<div style={{fontSize: 28, fontWeight: 800, letterSpacing: 4, color: P.muted, opacity: 1 - dock}}>{frame >= t27 ? 'JUST WHAT I DID' : frame >= tAdvisor ? 'NOT FINANCIAL ADVICE' : 'QUICK NOTE'}</div>
					<div style={{fontSize: 52, fontWeight: 900, color: P.ink, marginTop: 10, letterSpacing: 1}}>
						DO YOUR <span style={{color: mix(0, 1, research) > 0.5 ? P.accent : P.ink}}>OWN RESEARCH</span>
					</div>
				</div>
			</div>

			{/* PRIMARY — SAVE */}
			{frame >= tSave - 3 && (
				<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right - 40, top: 420, opacity: Math.min(1, save * 1.5), transform: `translateY(${(1 - save) * 60}px) scale(${breathe})`, transformOrigin: '0 50%'}}>
					<div style={{display: 'flex', alignItems: 'center', gap: 30}}>
						<div style={{width: 170, height: 170, flex: 'none', borderRadius: 44, background: P.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 50px rgba(44,212,122,0.25)'}}>
							<Bookmark size={100} color="#0B0C0E" />
						</div>
						<div style={{fontSize: 190, fontWeight: 900, letterSpacing: -6, color: P.ink, lineHeight: 0.9}}>SAVE</div>
					</div>
					<div style={{fontSize: 64, fontWeight: 900, color: P.accent, marginTop: 22, letterSpacing: -1, opacity: 0.35 + 0.65 * first}}>FOR YOUR FIRST ORDER</div>
				</div>
			)}

			{/* SECONDARY — SEND */}
			{frame >= tSend - 3 && (
				<div style={{position: 'absolute', left: story.safe.left, top: 820, display: 'flex', alignItems: 'center', gap: 22, padding: '20px 34px 20px 22px', borderRadius: 999, border: `3px solid ${P.accent}`, opacity: Math.min(1, send * 1.5), transform: `translateX(${(1 - send) * -60}px)`}}>
					<div style={{width: 84, height: 84, borderRadius: 999, background: P.accent, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
						<Send size={48} color="#0B0C0E" />
					</div>
					<div style={{fontSize: 54, fontWeight: 900, color: P.ink}}>SEND TO A FRIEND</div>
				</div>
			)}
			{/* the friend's question */}
			{frame >= tAsk - 2 && (
				<div style={{position: 'absolute', left: story.safe.left, top: 980, fontSize: 40, fontWeight: 800, color: P.body, opacity: ask, transform: `translateY(${(1 - ask) * 20}px)`}}>“How do I start investing?”</div>
			)}

			<Marcus
				x={860}
				y={story.ground}
				scale={0.95}
				facing={-1}
				onDark
				seed={5}
				track={[
					{at: 0, pose: 'relaxed', face: 'neutral'},
					{at: tAdvisor - 4, pose: 'stop', face: 'focused'},
					{at: tResearch - 4, pose: 'think', face: 'focused'},
					{at: tSave - 4, pose: 'point', face: 'happy', spring: 'bouncy'},
					{at: tSend - 4, pose: 'present', face: 'joy'},
				]}
			/>
			<Sfx at={tSave - 4} name="pop" volume={0.28} />
			<Sfx at={tSend - 4} name="whoosh-soft" volume={0.28} />
		</AbsoluteFill>
	);
};
