import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {EditorialBg} from '../../../story/components/Backgrounds';
import {Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {Marcus} from '../../../story/components/Marcus';
import {Bill, Wallet} from '../../../story/components/Money';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, mix, prog, sp} from '../../../story/lib/motion';
import {editorial as P, story} from '../../../story/theme';
import {FACTS, usd} from '../facts';
import {Kicker} from '../props';

const ACCT = {x: 380, y: 470, w: 580, h: 300};
const WALLET = {x: 210, y: 1180};
const HAND = {x: 560, y: 1000};

/**
 * THE TAKEAWAY — "I'm learning that it's not just about making more money.
 * It's about actually keeping some of it."
 * Marcus sends one bill to his wallet (spending is fine) — then deliberately
 * sends a stack up into his savings account: +$500, balance grows.
 */
export const TakeawayScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tMaking = cue('L14', 'making');
	const tKeep = cue('L15', 'keeping');
	const tActually = cue('L15', 'actually');
	const tSome = cue('L15', 'some');

	const acctIn = sp(frame, fps, 4, 'smooth');
	const walletIn = sp(frame, fps, 8, 'bouncy');
	const spendFly = prog(frame, tMaking - 2, 18, E.inOut);
	const walletOpen = kf(frame, [tMaking + 10, tMaking + 16, tMaking + 30], [0, 0.6, 0]);
	const saves = [0, 1, 2].map((i) => prog(frame, tActually + i * 5, 20, E.inOut));
	const landed = prog(frame, tActually + 18, 18, E.out);
	const plus = sp(frame, fps, tActually + 20, 'bouncy');
	const glow = kf(frame, [tActually + 18, tActually + 26, tActually + 50], [0, 1, 0.25]);

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<EditorialBg floorY={story.ground} />
			<div style={{position: 'absolute', left: story.safe.left, top: story.safe.top + 20, right: story.safe.right}}>
				<KineticText text="KEEP SOME" at={tKeep - 6} mode="pop" fontSize={112} color={P.ink} colors={{KEEP: P.accent}} />
				<KineticText text="OF IT." at={tKeep - 2} mode="pop" fontSize={112} color={P.ink} />
			</div>

			{/* savings account */}
			<div
				style={{
					position: 'absolute',
					left: ACCT.x,
					top: ACCT.y,
					width: ACCT.w,
					height: ACCT.h,
					borderRadius: 34,
					background: P.paper,
					boxShadow: `0 24px 50px ${P.shadow}, 0 0 ${60 * glow}px rgba(30,158,87,${0.45 * glow})`,
					border: `4px solid ${glow > 0.3 ? P.accent : P.line}`,
					padding: '30px 40px',
					boxSizing: 'border-box',
					opacity: acctIn,
					transform: `translateY(${(1 - acctIn) * 40}px)`,
				}}
			>
				<div style={{display: 'flex', alignItems: 'center', gap: 14}}>
					<div style={{width: 46, height: 46, borderRadius: 12, background: P.accent, color: '#fff', fontSize: 30, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>$</div>
					<Kicker color={P.ink}>Savings</Kicker>
				</div>
				<div style={{marginTop: 30}}>
					<NumberCounter value={mix(0, FACTS.savePerMonth.value, landed)} fontSize={130} color={landed > 0.02 ? P.accent : P.muted} style={{letterSpacing: -4}} />
				</div>
				<div
					style={{
						position: 'absolute',
						right: 34,
						top: 26,
						fontSize: 38,
						fontWeight: 900,
						color: '#fff',
						background: P.accent,
						padding: '6px 16px',
						borderRadius: 12,
						opacity: Math.min(1, plus * 1.5),
						transform: `scale(${plus})`,
					}}
				>
					+{usd(FACTS.savePerMonth.value)}/mo
				</div>
			</div>

			{/* wallet (spending is fine) */}
			<Wallet w={250} open={walletOpen} bills={2} style={{left: WALLET.x, top: WALLET.y, transform: `translate(-50%,-50%) scale(${walletIn})`}} />
			<Kicker size={26} style={{position: 'absolute', left: WALLET.x, top: WALLET.y + 110, transform: 'translateX(-50%)', opacity: walletIn}}>
				Spend
			</Kicker>

			<Marcus
				x={720}
				y={story.ground}
				scale={1.05}
				facing={-1}
				seed={8}
				track={[
					{at: 0, pose: ['hold', {head: 4}], face: 'neutral'},
					{at: tMaking - 4, pose: ['feed', {fs: 50, lean: 6}], face: 'neutral', spring: 'snappy'},
					{at: tMaking + 18, pose: 'think', face: 'curious'},
					{at: tKeep - 10, pose: ['push', {fs: 150, fe: 10, bs: 120, be: 10, lean: -2, head: -14}], face: 'determined', spring: 'snappy'},
					{at: tSome + 6, pose: 'fist', face: 'joy', spring: 'bouncy'},
				]}
			/>

			{/* money moving */}
			{spendFly > 0 && spendFly < 1 && (() => {
				const [x, y] = arc(spendFly, [HAND.x, HAND.y], [WALLET.x, WALLET.y - 20], 160);
				return <Bill w={150} value="$" style={{left: x, top: y, transform: `translate(-50%,-50%) rotate(${spendFly * 200}deg) scale(${1 - 0.35 * spendFly})`}} />;
			})()}
			{saves.map((f, i) => {
				if (f <= 0 || f >= 1) return null;
				const [x, y] = arc(f, [HAND.x + 40, HAND.y - 150], [ACCT.x + ACCT.w * 0.4 + i * 50, ACCT.y + ACCT.h * 0.6], 120);
				return <Bill key={i} w={170} value="$" style={{left: x, top: y, transform: `translate(-50%,-50%) rotate(${-10 + f * 20 + i * 6}deg) scale(${1 - 0.3 * f})`}} />;
			})}

			<Sfx at={tMaking - 2} name="whoosh-soft" volume={0.3} />
			<Sfx at={tMaking + 14} name="paper" volume={0.3} />
			<Sfx at={tActually} name="whoosh" volume={0.35} />
			<Sfx at={tActually + 18} name="coin" volume={0.4} />
			<Sfx at={tActually + 22} name="chime" volume={0.35} />
		</AbsoluteFill>
	);
};
