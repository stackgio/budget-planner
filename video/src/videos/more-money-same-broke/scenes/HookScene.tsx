import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {EditorialBg} from '../../../story/components/Backgrounds';
import {Camera} from '../../../story/components/Camera';
import {Sfx} from '../../../story/components/Chrome';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, prog, shake, sp} from '../../../story/lib/motion';
import {editorial as P, story} from '../../../story/theme';
import {FACTS, usd} from '../facts';
import {ExampleTag, Kicker} from '../props';

const PANEL = {x: story.safe.left, w: 1080 - story.safe.left - story.safe.right};

/**
 * HOOK — "More money, same broke life."
 * Frame 0: a big green $3,000 income. On "money" it rolls to $5,000 (+$2,000).
 * On "same" the bank balance slams in underneath: $0. Contradiction < 1.5 s.
 */
export const HookScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tMoney = cue('L1', 'money');
	const tSame = cue('L1', 'same');
	const tBroke = cue('L1', 'broke');

	const roll = prog(frame, tMoney - 2, 18, E.inOut);
	const income = mix(FACTS.oldIncome.value, FACTS.newIncome.value, roll);
	const chip = sp(frame, fps, tMoney + 8, 'bouncy');
	const bank = sp(frame, fps, tSame - 4, 'heavy');
	const stamp = sp(frame, fps, tBroke + 2, 'heavy');
	const hit = shake(frame, tSame + 6, 12, 14);
	const pulse = 1 + 0.04 * kf(frame, [tMoney + 14, tMoney + 20, tMoney + 30], [0, 1, 0]);

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<EditorialBg />
			<ExampleTag style={{right: story.safe.right, top: story.safe.top + 8}} />
			<Camera
				keys={[
					{at: 0, zoom: 1.0},
					{at: tSame, zoom: 1.0},
					{at: tSame + 20, zoom: 1.05, x: 540, y: 1010, ease: E.out},
				]}
				shakeX={hit.x}
				shakeY={hit.y}
			>
				{/* income card — readable on frame 0 */}
				<div
					style={{
						position: 'absolute',
						left: PANEL.x,
						top: 250,
						width: PANEL.w,
						height: 400,
						background: P.paper,
						borderRadius: 36,
						boxShadow: `0 24px 50px ${P.shadow}`,
						padding: '40px 48px',
						boxSizing: 'border-box',
					}}
				>
					<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
						<Kicker color={P.muted}>Monthly income</Kicker>
						<div
							style={{
								background: P.accentSoft,
								color: P.accentDeep,
								fontSize: 36,
								fontWeight: 900,
								padding: '8px 18px',
								borderRadius: 14,
								opacity: Math.min(1, chip * 1.4),
								transform: `scale(${chip}) translateY(${(1 - chip) * 20}px)`,
							}}
						>
							▲ +{usd(FACTS.raise.value)}
						</div>
					</div>
					<div style={{marginTop: 34, transform: `scale(${pulse})`, transformOrigin: '0 50%'}}>
						<NumberCounter value={income} fontSize={story.type.mega} color={P.accent} style={{letterSpacing: -6}} fixedDigits={4} />
					</div>
				</div>

				{/* bank balance — the contradiction */}
				<div
					style={{
						position: 'absolute',
						left: PANEL.x,
						top: 710,
						width: PANEL.w,
						height: 520,
						background: P.ink,
						borderRadius: 36,
						boxShadow: `0 30px 60px ${P.shadow}`,
						padding: '40px 48px',
						boxSizing: 'border-box',
						opacity: Math.min(1, bank * 2),
						transform: `translateY(${(1 - bank) * 420}px) rotate(${(1 - bank) * 4}deg)`,
					}}
				>
					<Kicker color="#9AA0A8">Left in the bank</Kicker>
					<div style={{fontSize: 300, fontWeight: 900, color: '#F5F2EA', letterSpacing: -8, lineHeight: 1, marginTop: 40}}>
						{usd(FACTS.leftOver.value)}
					</div>
					{/* stamp */}
					<div
						style={{
							position: 'absolute',
							right: 50,
							top: 210,
							border: `8px solid ${P.danger}`,
							color: P.danger,
							borderRadius: 18,
							padding: '6px 24px',
							fontSize: 84,
							fontWeight: 900,
							letterSpacing: 6,
							transform: `rotate(-12deg) scale(${1 + (1 - Math.min(1, stamp)) * 1.4})`,
							opacity: Math.min(1, stamp * 1.6),
						}}
					>
						BROKE
					</div>
				</div>
			</Camera>
			<Sfx at={tMoney} name="tick" volume={0.35} />
			<Sfx at={tMoney + 10} name="pop" volume={0.35} />
			<Sfx at={tSame} name="whoosh" volume={0.4} />
			<Sfx at={tSame + 6} name="thud" volume={0.55} />
			<Sfx at={tBroke + 4} name="stamp" volume={0.5} />
		</AbsoluteFill>
	);
};
