import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {EditorialBg} from '../../../story/components/Backgrounds';
import {ChapterTag, Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {Marcus} from '../../../story/components/Marcus';
import {Coin} from '../../../story/components/Money';
import {BankBuilding, GumPack} from '../../../story/components/Places';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, sp} from '../../../story/lib/motion';
import {editorial as P, story} from '../../../story/theme';
import {FACTS, usd2} from '../facts';
import {BANK, BANK_DOOR, MARCUS} from '../layout';
import {Ladder} from './Ladder';

/**
 * BIG BANK — "A big bank pays 0.01%. After three years, your $5,000 earns... a dollar fifty.
 * A pack of gum costs more than that."
 * Viewer learns: the balance barely moves (three identical stacks), then feels
 * the absurdity ($1.50 next to a pack of gum).
 */
export const BankScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tRate = cue('L3', '0.01%');
	const tThree = cue('L4', 'three');
	const tEarns = cue('L4', 'earns');
	const tFifty = cue('L4', 'dollar');
	const tGum = cue('L5', 'gum');

	const rateOut = tFifty - 6;
	const earned = sp(frame, fps, tFifty, 'heavy');
	const gum = sp(frame, fps, tGum - 2, 'bouncy');
	const webs = kf(frame, [tThree, tFifty + 20], [0, 1], E.inOut);

	// the single coin that comes out of the door
	const cT = kf(frame, [tFifty, tFifty + 22], [0, 1], E.out);
	const [cx, cy] = arc(cT, [BANK_DOOR.x, BANK_DOOR.y], [BANK_DOOR.x + 150, story.ground - 18], 90);

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<EditorialBg />
			<ChapterTag n="01" label="BIG BANK" at={-6} palette={P} style={{left: story.safe.left, top: story.safe.top}} />

			{/* the rate → what you earned */}
			<div style={{position: 'absolute', left: story.safe.left, top: 300, right: story.safe.right}}>
				<KineticText text="0.01% A YEAR" at={tRate - 4} fontSize={110} color={P.ink} colors={{'001': P.danger}} exitAt={rateOut} />
			</div>
			{earned > 0.01 && (
				<div style={{position: 'absolute', left: story.safe.left, top: 296}}>
					<div style={{fontSize: 30, fontWeight: 900, letterSpacing: 4, color: P.muted, opacity: earned}}>YOU EARN, 3 YEARS</div>
					<div style={{fontSize: 150, fontWeight: 900, letterSpacing: -6, lineHeight: 1, color: P.danger, transform: `scale(${1 + (1 - earned) * 0.5})`, transformOrigin: '0 50%', opacity: Math.min(1, earned * 2)}}>
						{usd2(FACTS.bigEarned.value)}
					</div>
				</div>
			)}
			{gum > 0.01 && (
				<div style={{position: 'absolute', left: 660, top: 290, transform: `rotate(${6 - 6 * gum}deg) scale(${gum})`, transformOrigin: '50% 100%'}}>
					<GumPack w={230} price={usd2(FACTS.gumPrice.value)} />
					<div style={{marginTop: 10, textAlign: 'center', fontSize: 28, fontWeight: 900, letterSpacing: 3, color: P.body}}>COSTS MORE</div>
				</div>
			)}

			<Ladder
				at={tThree}
				palette={P}
				counts={[4, 4, 4]}
				balances={FACTS.bigBalances.map((b) => b.value)}
				deposit={FACTS.deposit.value}
				cents
				tone={P.ink}
			/>

			<div style={{position: 'absolute', left: BANK.x, top: story.ground - BANK.h}}>
				<BankBuilding w={BANK.w} cobwebs={webs} />
			</div>
			{cT > 0 && <Coin size={44} spin={cT * 9} style={{left: cx, top: cy}} />}

			<Marcus
				x={MARCUS.x}
				y={story.ground}
				scale={MARCUS.scale}
				facing={-1}
				seed={2}
				track={[
					{at: 0, pose: ['point', {head: -14}], face: 'determined'},
					{at: tRate + 6, pose: 'think', face: 'curious'},
					{at: tEarns, pose: 'present', face: 'curious'},
					{at: tFifty + 2, pose: 'flinch', face: 'shock', spring: 'bouncy'},
					{at: tGum, pose: 'shrug', face: 'smug'},
				]}
			/>
			<Sfx at={tRate} name="tick" volume={0.35} />
			<Sfx at={tThree} name="pop" volume={0.3} />
			<Sfx at={tFifty + 2} name="coin" volume={0.35} />
			<Sfx at={tGum} name="pop" volume={0.4} />
		</AbsoluteFill>
	);
};
