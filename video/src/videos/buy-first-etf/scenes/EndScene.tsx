import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {BrandBug, Sfx} from '../../../story/components/Chrome';
import {Marcus} from '../../../story/components/Marcus';
import {useCues} from '../../../story/lib/cues';
import {kf, sp} from '../../../story/lib/motion';
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

const CtaLine: React.FC<{at: number; icon: React.ReactNode; children: React.ReactNode; top: number}> = ({at, icon, children, top}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = sp(frame, fps, at, 'bouncy');
	if (frame < at) return null;
	return (
		<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right - 40, top, display: 'flex', alignItems: 'center', gap: 28, opacity: Math.min(1, p * 1.5), transform: `translateX(${(1 - p) * -60}px)`}}>
			<div style={{width: 120, height: 120, flex: 'none', borderRadius: 30, background: P.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${0.6 + 0.4 * p})`}}>{icon}</div>
			<div style={{fontSize: 70, fontWeight: 900, lineHeight: 1, letterSpacing: -1, color: P.ink}}>{children}</div>
		</div>
	);
};

/** Disclaimer + CTA (save / send). */
export const EndScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {cue} = useCues();
	const t26 = cue('L26');
	const t28 = cue('L28');
	const tResearch = cue('L28', 'research');
	const tSave = cue('L29', 'Save');
	const tSend = cue('L29', 'send');
	const dyor = kf(frame, [t26 - 4, t26 + 8], [0, 1]) * (1 - kf(frame, [tSave - 6, tSave + 2], [0, 1]) * 0.55);
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={540} lightY={520} />
			<BrandBug palette={P} text="@stackwithgio" style={{left: story.safe.left, top: story.safe.top + 10}} opacity={0.9} />
			<div style={{position: 'absolute', left: 0, right: 0, top: 300, display: 'flex', justifyContent: 'center', opacity: dyor}}>
				<div style={{padding: '14px 28px', borderRadius: 999, border: `2px solid ${P.line}`, fontSize: 32, fontWeight: 800, letterSpacing: 4, color: frame >= tResearch - 4 ? P.ink : P.body}}>DO YOUR OWN RESEARCH</div>
			</div>
			<CtaLine at={tSave - 2} top={470} icon={<Bookmark size={64} color="#0B0C0E" />}>
				SAVE FOR YOUR<br /><span style={{color: P.accent}}>FIRST ORDER</span>
			</CtaLine>
			<CtaLine at={tSend - 2} top={720} icon={<Send size={60} color="#0B0C0E" />}>
				SEND TO A <span style={{color: P.accent}}>FRIEND</span>
			</CtaLine>
			<Marcus
				x={560}
				y={story.ground}
				scale={1.0}
				facing={1}
				onDark
				seed={5}
				track={[
					{at: 0, pose: 'relaxed', face: 'neutral'},
					{at: t28, pose: 'think', face: 'focused'},
					{at: tSave - 4, pose: 'point', face: 'happy', spring: 'bouncy'},
					{at: tSend - 4, pose: 'present', face: 'joy'},
				]}
			/>
			<Sfx at={tSave} name="pop" volume={0.3} />
			<Sfx at={tSend} name="whoosh-soft" volume={0.3} />
		</AbsoluteFill>
	);
};
