import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Sfx} from '../../../story/components/Chrome';
import {FundCard, Swap, TickerWord} from '../../../story/components/FundCards';
import {Bill, Wallet} from '../../../story/components/Money';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, prog, sp} from '../../../story/lib/motion';
import {C, Desc, FONT, Label} from './common';

const SHARE = {x: 150, y: 640, w: 330, h: 400};
const WALLET = {x: 770, y: 880};

/** SCHD — a share pays one cash payment on "dividend"; "Payment amounts can change". No amounts, no schedule. */
export const SchdScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tSchd = cue('L17', 'SCHD', -0.05);
	const tFocus = cue('L17', 'focuses');
	const tDivs = cue('L17', 'dividends');
	const tDiv = cue('L18', 'dividend');
	const tShares = cue('L18', 'shares');
	const tAmount = cue('L19', 'amount');
	const tChange = cue('L19', 'change');

	const share = sp(frame, fps, tFocus - 4, 'bouncy');
	const wallet = sp(frame, fps, tDivs, 'bouncy');
	const flight = kf(frame, [tDiv, tDiv + 26], [0, 1], E.inOut);
	const landed = kf(frame, [tDiv + 24, tDiv + 32], [0, 1], E.out);
	const from: [number, number] = [SHARE.x + SHARE.w / 2, SHARE.y + 60];
	const to: [number, number] = [WALLET.x, WALLET.y - 30];
	const [bx, by] = arc(flight, from, to, 260);
	// "can change": the next payment's size visibly varies
	const vary = kf(frame, [tChange - 4, tChange + 6, tChange + 16, tChange + 26], [1, 0.72, 1.18, 0.9]);
	const ghost = prog(frame, tAmount - 4, 10);
	const note = sp(frame, fps, tAmount - 2, 'snappy');

	const ticker = [{at: tSchd, node: <TickerWord text="SCHD" fontSize={150} />}];
	const desc = [{at: tFocus, node: <Desc text="U.S. dividend stocks" hl={['dividend']} fontSize={52} />}];
	return (
		<AbsoluteFill style={{fontFamily: FONT}}>
			<CinematicBg lightX={540} lightY={860} />
			<div style={{position: 'absolute', left: 120, top: 210, right: 120}}>
				<Swap steps={ticker} height={156} dur={10} />
				<Swap steps={desc} height={64} dur={10} style={{marginTop: 8}} />
			</div>
			{/* one share of SCHD — same card system */}
			<div style={{position: 'absolute', inset: 0, opacity: Math.min(1, share * 1.4), transform: `translateY(${(1 - share) * 80}px)`}}>
				<FundCard x={SHARE.x} y={SHARE.y} w={SHARE.w} h={SHARE.h} radius={34} glow={kf(frame, [tDiv - 6, tDiv, tDiv + 20], [0, 1, 0.2])}>
					<svg width={150} height={150} viewBox="0 0 150 150" style={{position: 'absolute', left: (SHARE.w - 150) / 2, top: 60}}>
						<rect x={10} y={10} width={130} height={130} rx={28} fill="#123222" stroke={C.accent} strokeWidth={5} />
						<path d="M40 104 L64 78 L84 92 L112 58" fill="none" stroke={C.accent} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
					</svg>
					<div style={{position: 'absolute', left: 0, right: 0, top: 240, textAlign: 'center', fontSize: 64, fontWeight: 900, color: C.ink, letterSpacing: -1}}>1 share</div>
					<div style={{position: 'absolute', left: 0, right: 0, top: 318, textAlign: 'center', fontSize: 30, fontWeight: 800, color: C.muted, letterSpacing: 3}}>OF SCHD</div>
				</FundCard>
			</div>
			<div style={{position: 'absolute', inset: 0, opacity: Math.min(1, wallet * 1.4), transform: `translateY(${(1 - wallet) * 80}px)`}}>
				<FundCard x={WALLET.x - 190} y={SHARE.y} w={380} h={SHARE.h} radius={34} />
				<Wallet w={300} open={landed * (1 - prog(frame, tShares + 10, 14)) * 0.9} bills={1} billValue="" style={{left: WALLET.x, top: WALLET.y}} />
				<Label style={{left: WALLET.x - 40, top: WALLET.y + 110, fontSize: 30}} color={C.body}>
					YOU
				</Label>
			</div>
			{/* dashed path the payment travels */}
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: kf(frame, [tDiv - 8, tDiv], [0, 1]) * (1 - landed * 0.6)}}>
				<path
					d={`M${from[0]} ${from[1]} Q ${(from[0] + to[0]) / 2} ${Math.min(from[1], to[1]) - 260} ${to[0]} ${to[1]}`}
					fill="none"
					stroke={C.accent}
					strokeWidth={4}
					strokeDasharray="10 14"
					opacity={0.6}
				/>
			</svg>
			{flight > 0 && landed < 1 && <Bill w={190} value="" rot={(1 - flight) * -20 + 8} style={{left: bx, top: by}} />}
			{/* the next payment: same motion, different size */}
			{ghost > 0 && (
				<div style={{position: 'absolute', left: 540, top: 1215, opacity: ghost, transform: `scale(${vary})`, transformOrigin: '0 0'}}>
					<Bill w={150} value="" rot={-6} style={{left: 0, top: 0}} />
				</div>
			)}
			<div
				style={{
					position: 'absolute',
					left: 120,
					right: 120,
					top: 1110,
					textAlign: 'center',
					fontSize: 56,
					fontWeight: 900,
					letterSpacing: -1,
					color: C.ink,
					opacity: note,
					transform: `translateY(${(1 - note) * 30}px)`,
				}}
			>
				Payment amounts <span style={{color: C.accent}}>can change</span>
			</div>
			<Sfx at={tDiv + 24} name="cash" volume={0.25} />
			<Sfx at={tAmount} name="tick" volume={0.15} />
		</AbsoluteFill>
	);
};
