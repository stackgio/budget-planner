import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {EditorialBg} from '../../../story/components/Backgrounds';
import {Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {Marcus} from '../../../story/components/Marcus';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {Shield, Vault} from '../../../story/components/Places';
import {useCues} from '../../../story/lib/cues';
import {E, kf, sp} from '../../../story/lib/motion';
import {editorial as P, story} from '../../../story/theme';
import {FACTS} from '../facts';
import {MARCUS, VAULT} from '../layout';

/**
 * SAFE — "And it's just as safe, as long as the bank is FDIC insured, up to $250,000."
 * Viewer feels reassured: the vault locks, a shield stamps on, the limit counts up.
 */
export const SafeScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tJust = cue('L10', 'just');
	const tSafe = cue('L10', 'safe');
	const tFdic = cue('L10', 'fdic');
	const tInsured = cue('L10', 'insured');
	const tAmount = cue('L10', '$250,000');
	
	const vaultIn = sp(frame, fps, -6, 'smooth');
	const spin = kf(frame, [tSafe - 2, tSafe + 20], [0, 300], E.inOut);
	const shield = sp(frame, fps, tInsured - 2, 'bouncy');
	const check = kf(frame, [tInsured + 4, tInsured + 16], [0, 1], E.out);
	const label = sp(frame, fps, tFdic - 2, 'snappy');
	const limit = kf(frame, [tAmount - 2, tAmount + 16], [0, FACTS.fdicLimit.value], E.out);

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<EditorialBg tint="#F7F3EA" />
			<div style={{position: 'absolute', left: story.safe.left, top: story.safe.top + 10, right: story.safe.right}}>
				<KineticText text="JUST AS SAFE" at={tJust - 6} fontSize={116} color={P.ink} colors={{safe: P.accent}} marker={{words: ['safe'], color: P.accentSoft, at: tSafe}} />
			</div>

			<div style={{position: 'absolute', left: VAULT.x, top: VAULT.y, opacity: vaultIn, transform: `scale(${0.92 + 0.08 * vaultIn})`, transformOrigin: '50% 100%'}}>
				<Vault w={VAULT.w} spin={spin} />
			</div>
			{shield > 0.01 && (
				<div style={{position: 'absolute', left: VAULT.x + VAULT.w - 120, top: VAULT.y + VAULT.w * 0.55, transform: `scale(${shield}) rotate(${(1 - shield) * -20}deg)`, transformOrigin: '50% 60%'}}>
					<Shield w={180} check={check} />
				</div>
			)}

			<div style={{position: 'absolute', left: story.safe.left, top: 960, opacity: label, transform: `translateY(${(1 - label) * 20}px)`}}>
				<div style={{fontSize: 30, fontWeight: 900, letterSpacing: 4, color: P.muted}}>FDIC-INSURED UP TO</div>
				<NumberCounter value={limit} fontSize={128} color={P.accent} style={{letterSpacing: -4, marginTop: 6, opacity: kf(frame, [tAmount - 4, tAmount + 2], [0, 1])}} />
				<div style={{fontSize: 24, fontWeight: 700, color: P.muted, marginTop: 8, width: 600, lineHeight: 1.3}}>per depositor, per bank, per ownership category</div>
			</div>

			<Marcus
				x={MARCUS.x}
				y={story.ground}
				scale={MARCUS.scale}
				facing={-1}
				seed={5}
				track={[
					{at: 0, pose: 'idle', face: 'neutral'},
					{at: tSafe, pose: 'fist', face: 'determined', spring: 'bouncy'},
					{at: tAmount, pose: 'present', face: 'happy'},
				]}
			/>
			<Sfx at={tSafe} name="click" volume={0.45} />
			<Sfx at={tInsured + 2} name="stamp" volume={0.45} />
			<Sfx at={tAmount + 2} name="tick" volume={0.3} />
		</AbsoluteFill>
	);
};
