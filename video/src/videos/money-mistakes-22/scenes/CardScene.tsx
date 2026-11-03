import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {AllocationBar} from '../../../story/components/AllocationBar';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Camera} from '../../../story/components/Camera';
import {ChapterTag, Sfx} from '../../../story/components/Chrome';
import {CreditCard} from '../../../story/components/CreditCard';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {useCues} from '../../../story/lib/cues';
import {E, kf, sp} from '../../../story/lib/motion';
import {cinematic as P, story} from '../../../story/theme';
import {FACTS, usd} from '../facts';
import {ExampleChip, Label} from '../parts';

/**
 * 02 · THE MINIMUM — "$3,000 at 24%… $60 of my $90 payment was just interest."
 * Viewer learns: most of a minimum payment never touches the balance.
 * Pure data scene — no Marcus.
 */
export const CARD_POS = {x: 540, y: 560}; // card centre (the iris opens here)
const CARD_W = 620;

export const CardScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tMin = cue('L6', 'minimum');
	const tThree = cue('L7', 'three');
	const tPct = cue('L7', 'twenty-four');
	const tSixty = cue('L8', 'sixty');
	const tNinety = cue('L8', 'ninety');
	const tInterest = cue('L8', 'interest');

	const cardIn = sp(frame, fps, 2, 'heavy');
	const bal = FACTS.cardBalance.value * kf(frame, [tThree, cue('L7', 'dollars', 0, 'end')], [0, 1], E.out);
	const badge = sp(frame, fps, tPct, 'bouncy');
	const barIn = sp(frame, fps, tSixty - 6, 'snappy');
	// interest segment reveals on "Sixty", the balance segment on "ninety"
	const progress = kf(frame, [tSixty, tSixty + 12, tNinety, tNinety + 12], [0, 0.5, 0.5, 1], E.out);
	const focus = frame >= tInterest ? 0 : -1;
	const W = 1080 - story.safe.left - story.safe.right;

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={540} lightY={520} />
			<ExampleChip palette={P} at={tThree - 4} />
			<ChapterTag n="02" label="THE MINIMUM" at={4} palette={P} style={{left: story.safe.left, top: story.safe.top + 6}} />
			<Camera keys={[{at: 0, zoom: 1}, {at: tInterest - 4, zoom: 1}, {at: tInterest + 18, zoom: 1.06, x: 500, y: 960}]} handheld={0.6}>
				<CreditCard
					w={CARD_W}
					variant="debt"
					balanceLabel="CARD BALANCE"
					balance={<NumberCounter value={bal} fontSize={88} color={P.ink} />}
					rotX={(1 - cardIn) * 30}
					rot={(1 - cardIn) * -6}
					shine={kf(frame, [tMin, tMin + 24], [-1, 1.2])}
					badge={
						<div style={{position: 'absolute', right: -24, top: -30, background: P.danger, color: '#fff', fontWeight: 900, fontSize: 34, letterSpacing: 2, padding: '8px 18px', borderRadius: 12, transform: `scale(${badge})`, opacity: Math.min(1, badge * 2)}}>
							{FACTS.aprPct.value}% APR
						</div>
					}
					style={{left: CARD_POS.x - CARD_W / 2, top: CARD_POS.y - (CARD_W * 0.63) / 2 + (1 - cardIn) * -120, opacity: Math.min(1, cardIn * 1.4)}}
				/>

				<div style={{opacity: barIn, transform: `translateY(${(1 - barIn) * 30}px)`}}>
					<Label color={P.muted} style={{left: story.safe.left, top: 850}}>
						MY {usd(FACTS.minPayment.value)} MINIMUM PAYMENT
					</Label>
					<AllocationBar
						items={[
							{label: 'INTEREST', amount: FACTS.monthlyInterest.value, color: P.danger},
							{label: 'TO THE BALANCE', amount: FACTS.toBalance.value, color: P.accent},
						]}
						progress={progress}
						w={W - 110}
						h={104}
						palette={P}
						focus={focus}
						style={{left: story.safe.left, top: 910}}
					/>
				</div>
			</Camera>
			<Sfx at={2} name="card" volume={0.45} />
			<Sfx at={tPct} name="pop" volume={0.4} />
			<Sfx at={tSixty + 2} name="thud" volume={0.4} />
			<Sfx at={tNinety + 2} name="coin" volume={0.3} />
		</AbsoluteFill>
	);
};
