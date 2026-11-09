import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Car, PAINTS} from '../../../story/components/Car';
import {Bill, Wallet} from '../../../story/components/Money';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, prog, sp} from '../../../story/lib/motion';
import {C, FONT, Label} from '../look';
import {Road} from './Road';

/** Gio's choice: a clean, reliable used sedan in daylight — and the extra money stays in the pocket. */
export const UsedScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tPers = cue('L13', 'personally');
	const tUsed = cue('L13', 'used');
	const tKeep = cue('L13', 'keep');
	const tPocket = cue('L13', 'pocket');

	const a = sp(frame, fps, tPers - 4, 'snappy');
	const strike = kf(frame, [cue('L13', 'rather') - 2, cue('L13', 'rather') + 14], [0, 1], E.inOut);
	const b = sp(frame, fps, tUsed - 4, 'snappy');
	const walletIn = sp(frame, fps, tKeep - 8, 'bouncy');
	const open = kf(frame, [tKeep - 6, tKeep + 2, tPocket - 2, tPocket + 8], [0, 1, 1, 0]);
	const kept = sp(frame, fps, tPocket, 'bouncy');
	const carIn = sp(frame, fps, 0, 'smooth');
	const bob = Math.sin(frame * 0.45) * 1.4;

	const walletPos: [number, number] = [540, 780];

	return (
		<AbsoluteFill>
			<Road frame={frame} mood="day" speed={12} />
			<div style={{position: 'absolute', inset: 0, transform: `translate(${(1 - carIn) * 260}px, ${bob}px)`}}>
				<Car id="usedcar" variant="sedan" paint={PAINTS.pearl} x={540} y={1380} w={980} lights={0.15} spin={-frame * 20} sheen={0.55} sheenAmt={0.45} reflection={0.06} rim={0.6} />
			</div>
			{/* contrast */}
			<div style={{position: 'absolute', left: 0, right: 0, top: 290, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18}}>
				<div style={{position: 'relative', fontFamily: FONT, fontWeight: 900, fontSize: 64, letterSpacing: -1, color: 'rgba(16,16,16,0.55)', opacity: frame < tPers - 4 ? 0 : prog(frame, tPers - 4, 6), transform: `translateY(${(1 - a) * 24}px)`}}>
					EXPENSIVE PAYMENT
					<div style={{position: 'absolute', left: -10, top: '52%', height: 8, borderRadius: 4, width: `calc(${strike * 100}% + 20px)`, background: C.redDeep}} />
				</div>
				<div style={{fontFamily: FONT, fontWeight: 900, fontSize: 84, letterSpacing: -2, color: C.ink, opacity: frame < tUsed - 4 ? 0 : prog(frame, tUsed - 4, 6), transform: `translateY(${(1 - b) * 30}px) scale(${0.94 + 0.06 * b})`}}>
					LOWER <span style={{color: C.greenDeep}}>MONTHLY COST</span>
				</div>
				<div style={{opacity: frame < tUsed ? 0 : prog(frame, tUsed, 8)}}>
					<Label size={26} color="#55606B">Good · reliable · used</Label>
				</div>
			</div>
			{/* money retained instead of leaving every month */}
			{frame >= tKeep - 8 && (
				<>
					<div style={{position: 'absolute', left: 0, top: 0, opacity: prog(frame, tKeep - 8, 6), transform: `scale(${0.7 + 0.3 * walletIn})`, transformOrigin: `${walletPos[0]}px ${walletPos[1]}px`}}>
						<Wallet w={300} open={open} bills={0} style={{left: walletPos[0], top: walletPos[1]}} />
					</div>
					{[0, 1, 2].map((i) => {
						const t = kf(frame, [tKeep + i * 4, tKeep + 16 + i * 4], [0, 1], E.inOut);
						if (t <= 0 || t >= 1) return null;
						const [x, y] = arc(t, [380 + i * 150, 1130], [walletPos[0], walletPos[1] - 30], 160);
						return <Bill key={i} w={170} rot={-20 + i * 18 + t * 30} style={{left: x, top: y, opacity: 1 - t * 0.3}} />;
					})}
					<div style={{position: 'absolute', left: 0, right: 0, top: walletPos[1] + 130, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 56, letterSpacing: 8, color: C.greenDeep, opacity: frame < tPocket ? 0 : prog(frame, tPocket, 6), transform: `scale(${0.8 + 0.2 * kept})`}}>
						KEPT.
					</div>
				</>
			)}
		</AbsoluteFill>
	);
};
