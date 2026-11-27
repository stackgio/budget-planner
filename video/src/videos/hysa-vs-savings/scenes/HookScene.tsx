import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {EditorialBg} from '../../../story/components/Backgrounds';
import {Camera} from '../../../story/components/Camera';
import {Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {Marcus} from '../../../story/components/Marcus';
import {CashStack} from '../../../story/components/Money';
import {BankBuilding, StickerTag} from '../../../story/components/Places';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, mix, shake, sp} from '../../../story/lib/motion';
import {editorial as P, story} from '../../../story/theme';
import {FACTS, usd0} from '../facts';
import {BANK, BANK_DOOR, MARCUS} from '../layout';

/**
 * HOOK — "Keeping $5,000 in a traditional bank is quietly costing you hundreds every single year."
 * Viewer feels: "that's me" (cash goes into the bank), then the sting of a
 * yearly loss stamped on screen. Ends framed exactly like the bank scene.
 */
export const HookScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tDeposit = cue('L1', '$5,000');
	const tBank = cue('L1', 'bank');
	const tQuiet = cue('L1', 'quietly');
	const tHundreds = cue('L1', 'hundreds');
	const tMath = cue('L2', 'math');

	// $5,000 stack: Marcus's side → arcs into the bank door
	const fly = kf(frame, [tDeposit + 4, tBank + 4], [0, 1], E.inOut);
	const [sx, sy] = arc(fly, [MARCUS.x - 150, 1150], [BANK_DOOR.x, BANK_DOOR.y + 10], 260);
	const sScale = mix(1, 0.25, kf(frame, [tBank - 4, tBank + 6], [0, 1], E.in));
	const sGone = frame > tBank + 6;
	const glow = kf(frame, [tBank, tBank + 6, tBank + 20], [0, 1, 0], E.out);

	const tag = sp(frame, fps, tHundreds, 'heavy');
	const hit = shake(frame, tHundreds + 4, 9, 14);

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<EditorialBg />
			{/* frame-0 hook */}
			<div style={{position: 'absolute', left: story.safe.left, top: story.safe.top + 20, fontSize: 30, fontWeight: 900, letterSpacing: 4, color: P.muted}}>
				{usd0(FACTS.deposit.value)} IN A BIG BANK
			</div>
			<div style={{position: 'absolute', left: story.safe.left, top: story.safe.top + 66, right: story.safe.right}}>
				<KineticText text="IS QUIETLY COSTING YOU" at={-14} mode="none" fontSize={116} color={P.ink} colors={{costing: P.danger}} marker={{words: ['quietly'], color: P.dangerSoft, at: tQuiet}} />
			</div>

			<Camera
				keys={[
					{at: 0, zoom: 1},
				]}
				shakeX={hit.x}
				shakeY={hit.y}
			>
				{/* the yearly cost */}
				{tag > 0.01 && (
					<StickerTag
						text={`−${usd0(FACTS.missedPerYear.value)} / YEAR`}
						tone="danger"
						fontSize={76}
						rot={-4}
						style={{left: story.safe.left, top: 660, transform: `rotate(-4deg) scale(${0.4 + 0.6 * tag})`, opacity: Math.min(1, tag * 2), transformOrigin: '20% 50%'}}
					/>
				)}
				{tag > 0.01 && (
					<div style={{position: 'absolute', left: story.safe.left + 6, top: 810, fontSize: 28, fontWeight: 800, letterSpacing: 3, color: P.muted, opacity: tag}}>
						IN INTEREST YOU MISS · EXAMPLE
					</div>
				)}

				<div style={{position: 'absolute', left: BANK.x, top: story.ground - BANK.h}}>
					<BankBuilding w={BANK.w} doorOpen={glow} />
				</div>

				<Marcus
					x={MARCUS.x}
					y={story.ground}
					scale={MARCUS.scale}
					facing={-1}
					seed={2}
					track={[
						{at: 0, pose: 'present', face: 'happy'},
						{at: tDeposit + 4, pose: 'push', face: 'focused', spring: 'bouncy'},
						{at: tBank + 8, pose: 'idle', face: 'neutral'},
						{at: tHundreds, pose: 'shock', face: 'shock', spring: 'bouncy'},
						{at: tMath - 4, pose: ['point', {head: -14}], face: 'determined'},
					]}
				/>

				{/* the deposit */}
				{!sGone && (
					<div style={{position: 'absolute', left: sx, top: sy, transform: `scale(${sScale}) rotate(${-8 * fly}deg)`}}>
						<CashStack w={200} count={5} style={{left: 0, top: 0}} />
						<div style={{position: 'absolute', left: -70, top: -150, background: P.ink, color: '#fff', fontSize: 34, fontWeight: 900, padding: '6px 16px', borderRadius: 12, opacity: 1 - fly}}>
							{usd0(FACTS.deposit.value)}
						</div>
					</div>
				)}
			</Camera>
			<Sfx at={tDeposit + 4} name="whoosh" volume={0.4} />
			<Sfx at={tBank + 4} name="cash" volume={0.4} />
			<Sfx at={tHundreds + 2} name="stamp" volume={0.5} />
		</AbsoluteFill>
	);
};
